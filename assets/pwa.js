(() => {
  if('serviceWorker' in navigator){
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
  }
  let installPrompt=null;
  const buttons=()=>[...document.querySelectorAll('[data-pwa-install]')];
  const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const sync=()=>{
    buttons().forEach(btn=>{
      const installed=isStandalone();
      btn.hidden=installed;
      btn.textContent=installed?'App Installed':'Install App';
      btn.setAttribute('aria-hidden',installed?'true':'false');
    });
  };
  window.addEventListener('beforeinstallprompt',e=>{
    e.preventDefault();installPrompt=e;sync();
  });
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
  if('serviceWorker' in navigator){
    navigator.serviceWorker.addEventListener('controllerchange',()=>{
      if(sessionStorage.getItem('cb_sw_reloaded')==='1')return;
      sessionStorage.setItem('cb_sw_reloaded','1');
      location.reload();
    });
  }
  sync();
})();