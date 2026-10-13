(()=>{
if(document.body.dataset.reader!=='true'||document.body.dataset.home==='true'||document.body.classList.contains('home-page')||document.querySelector('.read-aloud'))return;
const supported=typeof window.speechSynthesis?.speak==='function'&&typeof window.SpeechSynthesisUtterance==='function';
const box=document.createElement('aside');box.className='read-aloud';box.setAttribute('aria-label','Read aloud controls');box.innerHTML=`<div class="read-bar"><button id="read-play" aria-label="Read this page aloud" title="Read aloud"><span id="read-symbol" aria-hidden="true">▶</span><span id="read-label">read</span></button><button id="read-stop" aria-label="Stop reading" title="Stop" disabled>■</button><button id="read-options" aria-label="Reading options" aria-expanded="false" aria-controls="read-settings" title="Reading options">⚙</button></div><div id="read-settings" hidden><h2>Listen at your pace.</h2><label for="read-voice">Voice</label><select id="read-voice"><option value="">Browser default</option></select><label for="read-rate">Reading speed</label><select id="read-rate"><option value="0.8">Slower · 0.8×</option><option value="1" selected>Normal · 1×</option><option value="1.2">Faster · 1.2×</option></select><label class="read-follow"><input type="checkbox" id="read-follow"> Follow the reading</label><button id="read-here">Read from where I am</button><p id="read-status" role="status">Reads visible page text. Word timing depends on your browser and voice.</p></div>`;document.body.append(box);
const find=id=>box.querySelector('#'+id),play=find('read-play'),stop=find('read-stop'),settings=find('read-settings'),status=find('read-status');
find('read-options').onclick=()=>{settings.hidden=!settings.hidden;find('read-options').setAttribute('aria-expanded',String(!settings.hidden))};
if(!supported){play.disabled=true;find('read-here').disabled=true;find('read-label').textContent='audio off';status.textContent='This browser does not offer read aloud. Try a browser with speech support.';return;}
const synth=window.speechSynthesis;let voices=[],state='idle',position=0,token=0,current=null,active=null;
let chunks=[];
const blockSelector='h1,h2,h3,h4,h5,h6,p,li,dt,dd,figcaption,blockquote,summary';
const excluded='script,style,svg,nav,form,button,input,select,textarea,iframe,video,audio,dialog,.citation,.planned-tag,.read-aloud,.music-panel,.cb-quiz,.cb-scenario,.cb-sources,.cb-video-browser,.cb-book,.cb-learning-links,.quiz-question,.question,[aria-hidden="true"],[hidden]';
const highlights=typeof window.CSS?.highlights?.set==='function'&&typeof window.Highlight==='function';
function collectChunks(){
 const root=document.querySelector('main');if(!root)return [];
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),groups=[];let node;
 while(node=walker.nextNode()){
  const parent=node.parentElement;if(!parent||parent.closest(excluded)||!parent.getClientRects().length)continue;
  const element=parent.closest(blockSelector);if(!element||!root.contains(element))continue;
  let group=groups.at(-1);if(!group||group.element!==element){group={element,words:[]};groups.push(group)}
  for(const match of node.textContent.matchAll(/\S+/gu))group.words.push({word:match[0],node,start:match.index,end:match.index+match[0].length});
 }
 const result=[];
 for(const group of groups){let part={text:'',element:group.element,words:[]};for(const word of group.words){if(part.text&&part.text.length+word.word.length+1>220){result.push(part);part={text:'',element:group.element,words:[]}}const at=part.text.length+(part.text?1:0);part.text+=(part.text?' ':'')+word.word;part.words.push({...word,at})}if(part.text)result.push(part)}
 return result;
}
function follow(range){if(!find('read-follow').checked)return;const rect=range.getBoundingClientRect(),top=(document.querySelector('header')?.getBoundingClientRect().bottom||0)+24;if(rect.top<top||rect.bottom>innerHeight-76)window.scrollBy({top:rect.top-top,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}
function mark(part,index=null){
 if(!highlights)return;
 window.CSS.highlights.delete('read-word');window.CSS.highlights.delete('read-passage');
 const word=index===null?null:part.words.find(w=>index>=w.at&&index<w.at+w.word.length)||part.words.find(w=>w.at>=index);
 const first=word||part.words[0],last=word||part.words.at(-1);if(!first?.node.isConnected||!last?.node.isConnected)return;
 const range=document.createRange();range.setStart(first.node,first.start);range.setEnd(last.node,last.end);window.CSS.highlights.set(word?'read-word':'read-passage',new window.Highlight(range));follow(range);
}
function populate(){const selected=find('read-voice').value;voices=synth.getVoices();const english=voices.filter(v=>/^en\b/i.test(v.lang));const list=english.length?english:voices;find('read-voice').replaceChildren(new Option('Browser default',''));for(const v of list)find('read-voice').append(new Option(v.name+' ('+v.lang+')',v.voiceURI));if(list.some(v=>v.voiceURI===selected))find('read-voice').value=selected;}
populate();synth.addEventListener('voiceschanged',populate);
function paint(){find('read-label').textContent=state==='playing'?'Pause':state==='paused'?'Resume':'Read aloud';find('read-symbol').textContent=state==='playing'?'Ⅱ':'▶';play.setAttribute('aria-label',state==='playing'?'Pause reading':state==='paused'?'Resume reading':'Read this page aloud');stop.disabled=state==='idle';box.dataset.state=state;}
function clear(){if(active)active.classList.remove('read-active');active=null;if(highlights){window.CSS.highlights.delete('read-word');window.CSS.highlights.delete('read-passage')}}
function halt(message='Stopped. Press Read aloud to start again.'){token++;state='idle';synth.cancel();current=null;clear();position=0;status.textContent=message;paint();}
function speak(){if(state!=='playing')return;if(position>=chunks.length){halt('Finished reading.');return;}clear();const part=chunks[position];if(!part.element.isConnected){position++;speak();return}active=part.element;active.classList.add('read-active');current=new SpeechSynthesisUtterance(part.text);current.lang=document.documentElement.lang||'en';current.rate=Number(find('read-rate').value);current.voice=voices.find(v=>v.voiceURI===find('read-voice').value)||null;const session=token,utterance=current;
 current.onstart=()=>{if(token!==session||current!==utterance)return;mark(part)};
 current.onboundary=e=>{if(token!==session||current!==utterance||state!=='playing'||e.name==='sentence'||!Number.isFinite(e.charIndex))return;mark(part,e.charIndex);status.textContent='Listening · '+Math.round(position/chunks.length*100)+'% · '+(highlights?'word highlighting':'passage highlighting')};
 current.onend=()=>{if(token!==session||current!==utterance)return;position++;current=null;if(state==='playing')speak()};
 current.onerror=e=>{if(token!==session||current!==utterance||e.error==='canceled'||e.error==='interrupted')return;halt('The voice could not play. Try another voice or browser.');settings.hidden=false;find('read-options').setAttribute('aria-expanded','true')};status.textContent='Listening · '+Math.round(position/chunks.length*100)+'% · passage highlighting';synth.speak(current);}
function start(index=0,refresh=true){halt();if(!synth.getVoices().length){status.textContent='No usable speech voice is available in this browser. Reading, notes and visual guides still work.';return;}if(refresh)chunks=collectChunks();position=index;if(!chunks.length){status.textContent='No visible page text is available to read.';return;}window.CBMusic?.pause();const audio=document.querySelector('#homepageRadio');if(audio&&!audio.paused)audio.pause();state='playing';paint();speak();}
play.onclick=()=>{if(state==='playing'){state='paused';synth.pause();status.textContent='Paused. Resume when you are ready.';paint();}else if(state==='paused'){state='playing';paint();if(current)synth.resume();else speak();}else start();};stop.onclick=()=>halt();
find('read-here').onclick=()=>{chunks=collectChunks();let index=chunks.findIndex(c=>c.element.getBoundingClientRect().bottom>(document.querySelector('header')?.getBoundingClientRect().bottom||0)+12);if(index<0)index=chunks.length-1;start(Math.max(0,index),false);};
find('read-rate').onchange=()=>{if(state!=='idle'){const at=position;start(at,false);}};find('read-voice').onchange=()=>{if(state!=='idle'){const at=position;start(at,false);}};
window.addEventListener('pagehide',()=>halt());document.querySelector('#homepageRadio')?.addEventListener('play',()=>{if(state!=='idle')halt('Reading stopped while music plays.');});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!settings.hidden){settings.hidden=true;find('read-options').setAttribute('aria-expanded','false');find('read-options').focus();}});window.CBReader={stop:halt};paint();
})();
