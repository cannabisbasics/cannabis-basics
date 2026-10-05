(() => {
  let registration=null,installPrompt=null,refreshing=false;

  function showUpdate(reg){
    if(document.getElementById('cbAppUpdate'))return;
    const box=document.createElement('div');
    box.id='cbAppUpdate';
    box.setAttribute('role','status');
    box.innerHTML='<span>A Cannabis Basics update is ready.</span><button type="button">Update Now</button><button type="button" aria-label="Dismiss update">×</button>';
    Object.assign(box.style,{position:'fixed',right:'14px',bottom:'max(14px, env(safe-area-inset-bottom))',zIndex:'100001',display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap',maxWidth:'min(420px,calc(100vw - 28px))',padding:'11px 12px',borderRadius:'15px',background:'#101812',color:'#edf3ed',border:'1px solid rgba(194,207,50,.28)',boxShadow:'0 18px 55px rgba(0,0,0,.48)',font:'600 .72rem/1.3 Arial,sans-serif'});
    const [update,dismiss]=box.querySelectorAll('button');
    [update,dismiss].forEach(b=>Object.assign(b.style,{border:'1px solid rgba(194,207,50,.22)',background:'#182019',color:'#edf3ed',borderRadius:'999px',padding:'7px 9px',cursor:'pointer'}));
    update.style.background='#c2cf32';update.style.color='#111600';update.style.fontWeight='800';
    update.addEventListener('click',()=>{
      const worker=reg.waiting;
      if(worker){refreshing=true;worker.postMessage('SKIP_WAITING');update.disabled=true;update.textContent='Updating…'}
    });
    dismiss.addEventListener('click',()=>box.remove());
    document.body.appendChild(box);
  }

  if('serviceWorker' in navigator){
    window.addEventListener('load',async()=>{
      try{
        registration=await navigator.serviceWorker.register('./sw.js');
        if(registration.waiting)showUpdate(registration);
        registration.addEventListener('updatefound',()=>{
          const worker=registration.installing;
          worker?.addEventListener('statechange',()=>{
            if(worker.state==='installed'&&navigator.serviceWorker.controller)showUpdate(registration);
          });
        });
      }catch(_){}
    });
    navigator.serviceWorker.addEventListener('controllerchange',()=>{
      if(refreshing)location.reload();
    });
  }

  const buttons=()=>[...document.querySelectorAll('[data-pwa-install]')];
  const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const sync=()=>buttons().forEach(btn=>{
    const installed=isStandalone();
    btn.hidden=installed;
    btn.textContent=installed?'App Installed':'Install App';
    btn.setAttribute('aria-hidden',installed?'true':'false');
  });

  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;sync()});
  window.addEventListener('appinstalled',()=>{installPrompt=null;sync()});

  document.addEventListener('click',async e=>{
    const btn=e.target.closest('[data-pwa-install]');
    if(!btn)return;
    e.preventDefault();
    if(isStandalone())return;
    if(installPrompt){
      installPrompt.prompt();
      try{await installPrompt.userChoice}catch(_){}
      installPrompt=null;sync();return;
    }
    const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
    alert(ios
      ?'On iPhone or iPad: tap the Share button in Safari, then choose “Add to Home Screen.”'
      :'In your browser menu, choose “Install app” or “Add to Home screen” to install Cannabis Basics.');
  });
  sync();
})();