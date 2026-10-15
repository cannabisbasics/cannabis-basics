/* Shared interaction patterns; each site retains its catalog, identity and page routes. */
(() => {
'use strict';
if(window.__siteExperience)return;window.__siteExperience=true;
const cfg=window.__siteExperienceConfig;if(!cfg)return;
const base=new URL('./',document.currentScript.src), asset=n=>new URL(n,base).href;
const $=s=>document.querySelector(s), all=s=>[...document.querySelectorAll(s)];
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
function action(text,fn,cls=''){const b=el('button','x-action '+cls,text);b.type='button';b.onclick=fn;return b;}
const icon='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>';
function dialog(type,title){const d=el('dialog',type),head=el('div','x-dialog-heading'),img=el('img');img.src=asset('icon-192.png');img.alt='';const copy=el('div');copy.append(el('small','',cfg.name),el('h2','',title));const close=action('×',()=>d.close());close.setAttribute('aria-label','Close '+title);head.append(img,copy,close);d.append(head);d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});document.body.append(d);return d;}
function divider(index=0){const n=document.createElementNS('http://www.w3.org/2000/svg','svg');n.setAttribute('class','x-divider');n.setAttribute('viewBox','0 0 420 20');n.setAttribute('aria-hidden','true');const designs=['M0 10H100Q130 -5 160 10T220 10T280 10H420','M0 10H140C165 10 160 -6 180 4S170 25 200 10H420','M0 10Q70 2 140 10T280 10T420 10','M0 10H90L110 5L130 15L150 10H280Q300 0 320 10H420'];n.innerHTML='<path d="M0 10H420" opacity=".3"/><path class="x-flow" d="'+designs[index%designs.length]+'"/>';n.style.setProperty('--x-divider-speed',(10+index)+'s');return n;}
function addMenu(){
 if(cfg.slug==='perennial-home-and-gardens')return;
 if(cfg.slug==='ie')return; // i.e. already uses the approved compact dropdown.
 const sources=all(cfg.navSources).filter(n=>!n.closest('.x-menu'));
 if(!sources.length)return;
 const host=$(cfg.header)||sources[0].parentElement;
 const menu=dialog('x-menu','Menu'),items=el('nav','x-menu-items');items.setAttribute('aria-label',cfg.name+' navigation');menu.append(items);menu.addEventListener('close',()=>{all('.x-menu-toggle').forEach(b=>b.setAttribute('aria-expanded','false'));});
 function refresh(){
  items.replaceChildren();const seen=new Set(),members=[];
  for(const source of sources)for(const n of source.querySelectorAll('a[href],button')){
   if(n.closest('.site-app-button')||n.matches('.site-app-button,.x-menu-toggle,.drop-toggle')||n.matches(cfg.mediaTrigger||'[data-no-media]')||/theme|sound|music|light|announcement/i.test(n.id+' '+n.getAttribute('data-etp-action')))continue;
   const label=n.getAttribute('data-label')||n.querySelector('.label,.nav-label,.wdw-sr-only')?.textContent||n.closest('.etp-nav-item')?.querySelector('.etp-tip')?.textContent||n.getAttribute('aria-label')||n.querySelector('span:last-child')?.textContent||n.textContent;
   const contextLabel=cfg.slug==='ie-casino-games'&&n.dataset.rule?(n.dataset.rule==='time'?'Time Travel Slots':'Casa 21')+' · House Rules':label;
   const text=String(contextLabel||'').replace(/\s+/g,' ').trim();if(!text||/^(close|close menu|close navigation)$/i.test(text)||text==='Install App'||seen.has(text))continue;seen.add(text);
   const b=el(n.tagName==='A'?'a':'button','x-menu-item');if(n.tagName==='A')b.href=n.href;else{b.type='button';b.disabled=n.disabled;}b.innerHTML=icon;const span=el('span','',text);b.append(span);
   b.addEventListener('click',e=>{e.preventDefault();menu.close();n.click();});
   if(/membership|members only|join|subscribe/i.test(text)){b.classList.add('x-membership');members.push(b);}else items.append(b);
  }
  if(cfg.slug==='basketball-brilliance'&&!items.children.length){for(const role of ['coach','player','parent']){const b=el('button','x-menu-item',role[0].toUpperCase()+role.slice(1));b.type='button';b.onclick=()=>{menu.close();document.querySelector('.hs-'+role)?.click();};items.append(b);}}
  members.forEach(n=>items.append(n));
  const install=el('button','x-menu-item','Install App');install.type='button';install.onclick=()=>{menu.close();window.siteInstallApp?.();};items.insertBefore(install,members[0]||null);
 }
 all(cfg.preserve||'[data-no-preserve]').forEach(n=>{if(sources.some(s=>s.contains(n)))host.append(n);});
 sources.forEach(n=>{n.classList.add('x-hidden-nav');n.style.setProperty('display','none','important');new MutationObserver(refresh).observe(n,{childList:true,subtree:true});});refresh();
 all(cfg.oldMenuTriggers||'[data-no-old-menu]').forEach(n=>{n.classList.add('x-hidden-nav');n.style.setProperty('display','none','important');});
 function toggle(){const b=el('button','x-menu-toggle');b.type='button';b.setAttribute('aria-label','Open '+cfg.name+' navigation');b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-expanded','false');b.setAttribute('aria-controls','site-experience-menu');b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16M17 4v16"/></svg>';b.onclick=()=>{refresh();menu.showModal();b.setAttribute('aria-expanded','true');};return b;}
 menu.id='site-experience-menu';host.append(toggle());
 // The Basketball Brilliance entry screen intentionally has no header.
 if(cfg.slug==='basketball-brilliance'&&$('#entryStage')){const dock=el('div','x-entry-menu');dock.style.cssText='position:absolute;left:12px;top:12px;z-index:6';dock.append(toggle());$('#entryStage').append(dock);}
 // Keep install access outside the navigation containers that were collapsed.
 const top=$('.site-app-desktop');if(top&&!host.contains(top))host.insertBefore(top,host.lastElementChild);
}
function brandNative(){
 const panel=$(cfg.nativePanel||'[data-no-native]');if(!panel)return;
 panel.classList.add('x-native-panel');
 if(cfg.slug==='ie'){
  const identity=panel.querySelector('.music-identity');if(identity&&!identity.querySelector('.x-brand-name')){const small=el('small','x-brand-name','InAct Entertainment');small.style.cssText='display:block;font:11px Georgia,serif';identity.insertBefore(small,identity.lastElementChild);}
  return;
 }
 const heading=panel.querySelector('.jb-heading,.cb-music-heading,.etp-jukebox-brand');
 if(heading&&!panel.querySelector('.x-divider')){const old=panel.querySelector('.jb-divider,.cb-juke-divider,.etp-jukebox-divider');if(old)old.replaceWith(divider(cfg.divider));else heading.after(divider(cfg.divider));}
 if(cfg.slug==='divine-shades-of-brown'&&heading&&!heading.querySelector('.x-brand-name')){const small=el('small','x-brand-name',cfg.name);heading.querySelector('h2')?.before(small);}
 if(cfg.slug==='examine-the-past-home'){const copy=heading?.querySelector('div');if(copy){const h=copy.querySelector('h2'),s=copy.querySelector('span');if(h&&s){h.textContent='Jukebox';s.textContent=cfg.name;copy.prepend(s);}}}
 const summary=panel.querySelector('.jb-personal summary,.cb-favorites summary');if(summary){summary.textContent='› My playlists';}
 if(!panel.querySelector('.x-explore-footer')){const link=el('a','x-action x-wide x-explore-footer','Explore '+cfg.name);link.href=new URL('../',base).href;panel.append(link);}
}
async function genericPlayer(){
 if(!cfg.generic)return;
 const catalog=await fetch(asset('media-library.json')).then(r=>{if(!r.ok)throw Error();return r.json();}).catch(()=>({music:[],motivation:[],movies:[],quiet:[],failed:true}));
 const panel=dialog('x-jukebox','Jukebox');panel.id='site-shared-jukebox';panel.insertBefore(divider(cfg.divider),panel.children[1]||null);
 const back=action('‹ Back',()=>goBack());back.hidden=true;const view=el('div','x-player-view');panel.append(back,view);
 const mini=el('div','x-mini');mini.hidden=true;document.body.append(mini);
 const key='ie-'+cfg.slug+'-jukebox-v1';let saved=[];try{const parsed=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(parsed))saved=parsed.filter(t=>t&&(/^[\w-]{11}$/.test(t.videoId||'')||/^[\w-]{10,100}$/.test(t.listId||'')));}catch{}
 let stack=[],screen={type:'root'},queue=[],current=null,index=-1,yt=null,ready=false,epoch=0,shuffle=false,repeat=false,audio=null,playing=false,apiPromise=null,local=[],timer;
 const status=el('p','x-status');status.setAttribute('role','status');
 function stopOther(){all('audio').forEach(a=>{if(a!==audio&&!a.paused)a.pause();});all('iframe[src*="youtube"]').forEach(f=>{if(!panel.contains(f))f.contentWindow?.postMessage(JSON.stringify({event:'command',func:'pauseVideo',args:[]}),'*');});}
 function persist(){try{localStorage.setItem(key,JSON.stringify(saved.filter(t=>!t.local)));}catch{status.textContent='Saved for this visit; browser storage is unavailable.';}}
 function navigate(next){stack.push(screen);screen=next;render();}
 function goBack(){if(screen.type==='player')pause();screen=stack.pop()||{type:'root'};render();}
 function rootPlaylists(){const details=el('details','x-playlists'),summary=el('summary','','My playlists');details.append(summary,action('Open my playlist',()=>navigate({type:'list',title:'My playlist',items:[...saved,...local]})));
  const form=el('form'),label=el('label','','Add a YouTube video or playlist URL'),url=el('input');url.type='url';url.required=true;url.placeholder='https://www.youtube.com/watch?v=…';label.append(url);const add=action('Add to playlist',()=>{});add.type='submit';form.append(label,add);form.onsubmit=e=>{e.preventDefault();let parsed;try{parsed=new URL(url.value);}catch{status.textContent='Enter a YouTube URL.';return;}const host=parsed.hostname.replace(/^www\./,'');if(!['youtube.com','youtu.be','m.youtube.com','music.youtube.com'].includes(host)){status.textContent='Use a YouTube video or playlist link.';return;}const id=host==='youtu.be'?parsed.pathname.slice(1):parsed.searchParams.get('v'),listId=parsed.searchParams.get('list');if(!/^[\w-]{11}$/.test(id||'')&&!/^[\w-]{10,100}$/.test(listId||'')){status.textContent='That link needs a video or playlist ID.';return;}const t={title:'My YouTube selection',artist:'My playlist',...(id?{videoId:id}:{listId})};if(!saved.some(x=>(id&&x.videoId===id)||(listId&&x.listId===listId)))saved.push(t);persist();url.value='';status.textContent='Added to My playlist.';};details.append(form);
  const files=el('input');files.type='file';files.accept='audio/*';files.multiple=true;const fileLabel=el('label','','Add audio from this device');fileLabel.append(files);files.onchange=()=>{for(const f of files.files){if(!f.type.startsWith('audio/'))continue;local.push({title:f.name,artist:'Local audio',src:URL.createObjectURL(f),local:true});}status.textContent='Local audio added for this visit.';};details.append(fileLabel,el('p','','Your saved selections stay in this browser. Local files must be re-added on a future visit.'));return details;
 }
 function nativeTracks(){return all(cfg.audioSources||'[data-no-audio]').map((a,i)=>({title:a.dataset.trackTitle||a.id?.replace(/Track$/,'').replace(/([A-Z])/g,' $1')||'Site soundtrack',artist:cfg.name,audioId:a.id,id:'site-audio-'+i}));}
 function render(){view.replaceChildren();back.hidden=screen.type==='root';status.textContent='';
  if(screen.type==='root'){
   const grid=el('div','x-root-grid');const siteTracks=nativeTracks();
   if(siteTracks.length)grid.append(action(cfg.slug==='ie-casino-games'?'Casino Tunes':'Site soundtrack',()=>navigate({type:'list',title:cfg.name+' music',items:siteTracks})));
   if(cfg.slug==='livefit-info'){grid.append(action('Workout Music',()=>navigate({type:'genres'})),action('Recovery Music',()=>navigate({type:'list',title:'Recovery Music',items:catalog.quiet})),action('Quiet Listening',()=>navigate({type:'list',title:'Quiet Listening',items:catalog.quiet})));}else{grid.append(action('Music',()=>navigate({type:'genres'})),action('Motivation',()=>navigate({type:'list',title:'Motivation',items:catalog.motivation})),action('Movies',()=>navigate({type:'list',title:'Movie trailers',items:catalog.movies})));}
   if(catalog.failed)status.textContent='The media collection could not load. Refresh to try again, or use a site soundtrack or your own audio.';view.append(grid,rootPlaylists());const explore=el('a','x-action x-wide','Explore '+cfg.name);explore.href=new URL('../',base).href;view.append(explore,status);return;
  }
  if(screen.type==='genres'){
   view.append(el('h3','','Choose a genre'));const grid=el('div','x-root-grid');for(const genre of [...new Set(catalog.music.map(t=>t.genre||'Music'))])grid.append(action(genre,()=>navigate({type:'list',title:genre,items:catalog.music.filter(t=>(t.genre||'Music')===genre)})));view.append(grid);return;
  }
  if(screen.type==='list'){
   view.append(el('h3','',screen.title));if(!screen.items.length)view.append(el('p','','Save a selection or add local audio in My playlists.'));
   screen.items.forEach((t,i)=>{const row=el('div','x-row');row.append(action(t.artist+' · '+t.title,()=>{queue=screen.items;index=i;navigate({type:'player'});play(t);},'x-track'));if(t.videoId){const exists=saved.some(x=>x.videoId===t.videoId);const save=action(exists?'✓':'+',()=>{saved=exists?saved.filter(x=>x.videoId!==t.videoId):[...saved,t];persist();render();},'x-save');save.setAttribute('aria-label',(exists?'Remove from':'Save to')+' My playlist');row.append(save);}view.append(row);});view.append(status);return;
  }
  if(screen.type==='player'){drawPlayer();}
 }
 function api(){if(window.YT?.Player)return Promise.resolve(window.YT);if(apiPromise)return apiPromise;apiPromise=new Promise((resolve,reject)=>{const old=window.onYouTubeIframeAPIReady;const timeout=setTimeout(()=>{apiPromise=null;reject(Error('Video controls could not connect. Try again.'));},12000);window.onYouTubeIframeAPIReady=()=>{old?.();clearTimeout(timeout);resolve(window.YT);};if(!document.querySelector('script[src*="youtube.com/iframe_api"]')){const s=el('script');s.src='https://www.youtube.com/iframe_api';document.head.append(s);}});return apiPromise;}
 function pause(){if(audio)audio.pause();try{yt?.pauseVideo();}catch{}playing=false;sync();}
 function stop(){pause();if(audio)try{audio.currentTime=0;}catch{}try{yt?.stopVideo();}catch{}sync();}
 function sync(){const b=panel.querySelector('[data-x-play]');if(b)b.textContent=playing?'Pause':'Play';mini.hidden=panel.open||!playing;mini.replaceChildren(action('Pause',pause),action('Open',()=>{if(!panel.open)panel.showModal();mini.hidden=true;}),action('Stop',stop));}
 function drawPlayer(){
  view.append(el('h3','',current?current.artist+' · '+current.title:'Loading selection…'));
  const video=el('div','x-video');video.id='x-media-video';view.append(video);
  const controls=el('div','x-transport');const playButton=action('Play',()=>{if(playing)pause();else if(audio){stopOther();audio.play().catch(()=>{status.textContent='Tap Play again to allow audio.';});}else if(yt&&ready)yt.playVideo();else if(current)play(current);});playButton.dataset.xPlay='';
  const sh=action('Shuffle',()=>{shuffle=!shuffle;sh.setAttribute('aria-pressed',String(shuffle));});sh.setAttribute('aria-pressed',String(shuffle));const rp=action('Repeat',()=>{repeat=!repeat;rp.setAttribute('aria-pressed',String(repeat));if(audio)audio.loop=repeat;});rp.setAttribute('aria-pressed',String(repeat));
  controls.append(action('‹',()=>step(-1)),playButton,action('Stop',stop),sh,rp,action('›',()=>step(1)));controls.firstChild.setAttribute('aria-label','Previous track');controls.lastChild.setAttribute('aria-label','Next track');view.append(controls);
  const seek=el('input');seek.type='range';seek.min=0;seek.max=1;seek.value=0;seek.disabled=true;seek.setAttribute('aria-label','Track position');seek.dataset.xSeek='';seek.onchange=()=>{if(audio)audio.currentTime=Number(seek.value);else if(ready)yt.seekTo(Number(seek.value),true);};const vol=el('input');vol.type='range';vol.min=0;vol.max=100;vol.value=70;vol.setAttribute('aria-label','Volume');vol.oninput=()=>{if(audio)audio.volume=Number(vol.value)/100;if(ready)yt.setVolume(Number(vol.value));};const l=el('label','x-slider','Volume');l.append(vol);view.append(seek,l,status);
  view.append(action('Expand player ↗',()=>{const f=video.querySelector('iframe');f?.requestFullscreen?.().catch(()=>{status.textContent='Use the video fullscreen control.';});}));
 }
 async function play(t){
  const token=++epoch;try{yt?.destroy();}catch{}yt=null;ready=false;if(audio)audio.pause();audio=null;current=t;playing=false;view.replaceChildren();drawPlayer();stopOther();const video=$('#x-media-video');
  if(t.src||t.audioId){audio=t.audioId?document.getElementById(t.audioId):new Audio(t.src);if(!audio){status.textContent='The site soundtrack is unavailable on this page.';return;}audio.loop=repeat;audio.volume=.7;const img=el('img');img.src=asset('icon-192.png');img.alt=cfg.name;video.append(img);audio.onplay=()=>{playing=true;sync();};audio.onpause=()=>{playing=false;sync();};audio.onended=()=>repeat?audio.play():step(1);audio.onerror=()=>{status.textContent='Audio could not load. Choose another selection.';};try{await audio.play();}catch{status.textContent='Tap Play to start audio.';}return;}
  try{const YT=await api();if(token!==epoch)return;const target=el('div');video.append(target);yt=new YT.Player(target,{host:'https://www.youtube-nocookie.com',...(t.videoId?{videoId:t.videoId}:{}),playerVars:{autoplay:1,playsinline:1,rel:0,...(t.listId?{listType:'playlist',list:t.listId}:{})},events:{onReady:e=>{if(token!==epoch)return;ready=true;e.target.setVolume(70);e.target.playVideo();},onStateChange:e=>{if(token!==epoch)return;playing=e.data===1;if(e.data===0){if(repeat){yt.seekTo(0,true);yt.playVideo();}else step(1);}sync();},onError:()=>{status.textContent='This video cannot play here. Choose another selection or use its YouTube source.';const link=el('a','x-action','Open on YouTube');link.href=t.videoId?'https://www.youtube.com/watch?v='+t.videoId:'https://www.youtube.com/playlist?list='+t.listId;link.target='_blank';link.rel='noopener';status.append(link);}}});}catch(e){status.textContent=e.message;const source=el('a','x-action','Open on YouTube');source.href=t.videoId?'https://www.youtube.com/watch?v='+t.videoId:'https://www.youtube.com/playlist?list='+t.listId;source.target='_blank';source.rel='noopener';status.append(source);}
 }
 function step(direction){if(!queue.length)return;index=shuffle&&queue.length>1?(index+1+Math.floor(Math.random()*(queue.length-1)))%queue.length:(index+direction+queue.length)%queue.length;screen={type:'player'};render();play(queue[index]);}
 panel.addEventListener('close',sync);timer=setInterval(()=>{const seek=panel.querySelector('[data-x-seek]');if(!seek)return;let duration=0,time=0;try{duration=audio?audio.duration:ready?yt.getDuration():0;time=audio?audio.currentTime:ready?yt.getCurrentTime():0;}catch{}seek.disabled=!Number.isFinite(duration)||duration<=0;seek.max=String(Number.isFinite(duration)?duration:1);if(document.activeElement!==seek)seek.value=String(time||0);},750);
 function open(){stack=[];screen={type:'root'};render();if(!panel.open)panel.showModal();mini.hidden=true;}
 document.addEventListener('click',e=>{const trigger=e.target.closest?.(cfg.mediaTrigger||'[data-no-media]');if(trigger){e.preventDefault();e.stopImmediatePropagation();open();}},true);
 if(!$(cfg.mediaTrigger||'[data-no-media]')){const b=action('♫',open);b.setAttribute('aria-label','Open '+cfg.name+' Jukebox');($(cfg.header)||$('header')||document.body).append(b);}
 all(cfg.replacePanel||'[data-no-panel]').forEach(n=>{n.classList.add('x-hidden-nav');n.style.setProperty('display','none','important');});
 window.addEventListener('pagehide',()=>{clearInterval(timer);stop();local.forEach(t=>URL.revokeObjectURL(t.src));});render();
}
function init(){
 const body=document.body;body.dataset.siteSlug=cfg.slug;for(const [key,value] of Object.entries({high:cfg.high,mid:cfg.mid,low:cfg.low,ink:cfg.ink}))body.style.setProperty('--x-'+key,value);
 const link=el('link');link.rel='stylesheet';link.href=asset('site-experience.css?v=20261015-chrome');document.head.append(link);
 function syncTheme(){const m=getComputedStyle(document.body).color.match(/[\d.]+/g)||[240,240,240];const light=cfg.slug!=='ie'&&(+m[0]*.2126 + +m[1]*.7152 + +m[2]*.0722)<145;body.style.setProperty('--x-panel',light?'#f1eee7':'#0c100f');body.style.setProperty('--x-text',light?'#262923':'#eee');}
 syncTheme();for(const n of [document.body,document.documentElement])new MutationObserver(syncTheme).observe(n,{attributes:true,attributeFilter:['class','data-theme']});
 addMenu();brandNative();genericPlayer();
 // ETP creates its jukebox on demand, so apply the same branding when it appears.
 if(cfg.slug==='examine-the-past-home')new MutationObserver(()=>{if($('.etp-jukebox-card:not(.x-native-panel)'))brandNative();}).observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='complete')init();else window.addEventListener('load',init,{once:true});
})();
