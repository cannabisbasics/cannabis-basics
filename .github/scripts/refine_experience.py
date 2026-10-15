"""Bounded site-specific refinements; leave catalogs and saved-playlist keys intact."""
from pathlib import Path
import re
root=Path('.')
slug='cannabis-basics'
def edit(file,old,new,required=True):
 p=root/file
 if not p.exists():
  if required:raise AssertionError(file)
  return
 s=p.read_text()
 if old in s:p.write_text(s.replace(old,new))
 elif new not in s and required:raise AssertionError('Expected source not found: '+file+' '+old[:80])
if slug=='ie':
 p=root/'index.html';s=p.read_text()
 if 'id="home-explore-intro"' not in s:
  intro='<p id="home-explore-intro">Explore our connected worlds above, or contact us to explore opportunities and bring your next idea to life.</p>'
  s=s.replace('</h1></section>','</h1>'+intro+'</section>',1)
  s=re.sub(r'(<section class="home-connect".*?<ul.*?</ul>)\s*<p>.*?</p>\s*<a class="platinum" href="contact.html">Contact Us</a>',lambda m:m[1],s,count=1,flags=re.S)
  assert 'id="home-explore-intro"' in s
  p.write_text(s)
 css=root/'assets/home-simplified.css';s=css.read_text()
 marker='/* Compact one-row business-card ending. */'
 if marker not in s:
  s+='''\n/* Compact one-row business-card ending. */
.home-page .intro #home-explore-intro{display:block;white-space:nowrap;width:100%;max-width:100%;margin:16px auto 0;text-align:center;font:15px/1.5 Georgia,serif;color:#bbb}
.home-page .home-connect{max-width:1100px;padding-bottom:100px!important}
.home-page .home-connect .home-explore{display:flex!important;flex-wrap:nowrap!important;align-items:center;justify-content:center;gap:0!important;list-style:none!important;padding:0!important;width:100%!important;max-width:100%!important;white-space:nowrap!important;font-size:15px}
.home-page .home-connect .home-explore li{flex:0 0 auto;padding:0!important;white-space:nowrap}
.home-page .home-connect .home-explore li+li::before{content:' • ';white-space:pre;margin:0 .6em;color:#aaa}
@media(max-width:600px){.home-page .home-connect{padding:18px 12px 76px!important}.home-page .intro #home-explore-intro{font-size:7px}.home-page .home-connect .home-explore{font-size:5.6px}}
'''
  css.write_text(s)
 edit('assets/home.js',"$('#detail-link').target=['funding','music','ie'].includes(b.key)?'_self':'_blank'","$('#detail-link').target='_self'")
 # The existing local journey preserves effects while doing normal browser navigation.
 for p in [root/'assets/card-transitions.js']:
  t=p.read_text();t=t.replace("const clear=()=>{clearTimeout(timer);clearTimeout(safety);overlay.close();overlay.remove();stopSound();cleanup=()=>{}};","const clear=()=>{clearTimeout(timer);clearTimeout(safety);if(overlay.open)overlay.close();overlay.remove();stopSound();cleanup=()=>{}};")
  p.write_text(t)
elif slug=='divine-shades-of-brown':
 edit('assets/dsb-jukebox.js','function paint(){view.replaceChildren();page();back.hidden=false;',"function paint(){view.replaceChildren();panel.dataset.browse=page===root?'root':'branch';page();back.hidden=!focused&&stack.length===0;")
elif slug=='basketball-brilliance':
 edit('assets/js/bb-jukebox.js',"button(view,'My Playlist',()=>navigate(playlist),'jb-playlist');",'')
elif slug=='cannabis-basics':
 edit('assets/listening.js',"function render(){const view=$('cbJukeView');", "function render(){panel.dataset.browse=state.screen;const view=$('cbJukeView');")
 edit('assets/listening.js',"$('cbBack').disabled=!stack.length;","$('cbBack').disabled=!stack.length;$('cbBack').hidden=!stack.length;")
elif slug=='examine-the-past-home':
 p=root/'assets/etp-experience-v50.js';s=p.read_text()
 if "lastBrowse='root'" not in s:
  s=s.replace("let view='root',genre=''","let lastBrowse='root',lastGenre='',shuffled=false,repeated=false;let view='root',genre=''")
  s=s.replace("function choose(track,i){", "function choose(track,i){if(view!=='player'){lastBrowse=view;lastGenre=genre;}view='player';o.dataset.browse='player';screen.hidden=true;back.hidden=false;")
  s=s.replace("function render(){back.hidden=view==='root'&&!active;", "function render(){o.dataset.browse=view;screen.hidden=view==='player';player.hidden=view!=='player';back.hidden=view==='root';if(view==='player')return;")
  s=s.replace("back.onclick=()=>{if(view==='root'){stopPlayer();player.hidden=true;active=null}view='root';genre='';render();screen.querySelector('button')?.focus()};", "back.onclick=()=>{if(view==='player'){stopPlayer();view=lastBrowse;genre=lastGenre;}else{view='root';genre='';}player.hidden=true;render();screen.querySelector('button')?.focus()};")
  s=s.replace("index=(index+1)%collection.length;choose(collection[index],index)","index=shuffled&&collection.length>1?(index+1+Math.floor(Math.random()*(collection.length-1)))%collection.length:(index+1)%collection.length;choose(collection[index],index)")
  s=s.replace("o.querySelector('[data-player=\"stop\"]').onclick=()=>stopPlayer();", """o.querySelector('[data-player="stop"]').onclick=()=>stopPlayer();
 const controls=o.querySelector('.etp-player-controls');
 for(const name of ['Shuffle','Repeat']){const b=document.createElement('button');b.type='button';b.textContent=name;b.setAttribute('aria-pressed','false');b.onclick=()=>{if(name==='Shuffle')shuffled=!shuffled;else{repeated=!repeated;if(active&&frame.getAttribute('src')){const u=new URL(frame.src);if(repeated){u.searchParams.set('loop','1');u.searchParams.set('playlist',active.id);}else{u.searchParams.delete('loop');u.searchParams.delete('playlist');}frame.src=u.href;}}b.setAttribute('aria-pressed',String(name==='Shuffle'?shuffled:repeated));};controls.append(b);}
""")
  s=s.replace("+'?autoplay=1&rel=0&enablejsapi=1';setPlaying(true)","+'?autoplay=1&rel=0&enablejsapi=1'+(repeated?'&loop=1&playlist='+track.id:'');setPlaying(true)")
  # A small disclosure replaces the root's standalone playlist button.
  s=s.replace('<button type="button" class="etp-playlist-open" data-view="playlist">My Playlist · ', '<details class="x-playlists"><summary>My playlists</summary><button type="button" class="etp-playlist-open" data-view="playlist">Open My Playlist · ')
  s=s.replace("+playlist.length+'</button><p>Your playlist", "+playlist.length+'</button></details><p>Your playlist")
  p.write_text(s)
print(slug+': site-specific refinements complete')

# Activate new controls for visitors whose previous app cached the installer.
sw=root/'sw.js'
if sw.exists():
 text=sw.read_text();text=re.sub(r"const CACHE=[^\n;]+", "const CACHE='cb-app-quiet-20261015'",text,count=1);sw.write_text(text)
