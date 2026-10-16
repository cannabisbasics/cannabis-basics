(() => {
  if (window.__siteAppSupport || window.top !== window.self) return;
  window.__siteAppSupport = true;
  const brand = {"name": "Cannabis Basics", "high": "#b2d183", "mid": "#b2d183", "low": "#b2d183", "ink": "#10230c", "desktop": ".public-top-actions", "mobile": ".hero-copy-wrap, main .article-topbar", "paper": "#f0eee8", "copy": "#242424", "navSources": ".public-bubble-nav", "header": ".public-top-actions", "mediaTrigger": "#musicBtn", "nativePanel": "#cbMusicPanel", "slug": "cannabis-basics", "divider": 3};
  let pending = window.__cbInstallPrompt || null, installed = false;
  const controls = [];
  const standalone = () => installed || matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const style = document.createElement('style');
  style.textContent = `
  button.site-app-button.site-app-button.site-app-button.site-app-button{--app-high:#c2cf32;--app-mid:#c2cf32;--app-low:#c2cf32;--app-ink:${brand.ink};position:relative!important;isolation:isolate;display:inline-flex;align-items:center!important;justify-content:center!important;gap:7px!important;flex:0 0 auto!important;box-sizing:border-box!important;min-height:32px!important;width:auto!important;max-width:100%!important;padding:7px 10px!important;margin:6px!important;border:1px solid var(--app-high)!important;border-radius:999px!important;background:#c2cf32!important;color:var(--app-ink)!important;-webkit-text-fill-color:var(--app-ink)!important;font:600 11px/1.2 Georgia,serif!important;text-decoration:none!important;letter-spacing:normal!important;text-transform:none!important;white-space:nowrap!important;cursor:pointer;overflow:hidden!important;box-shadow:inset 0 1px 0 #fff7,0 4px 12px #0003!important;animation:site-app-float 5.5s ease-in-out infinite!important;transition:box-shadow .25s ease!important}
  button.site-app-button.site-app-button.site-app-button.site-app-button::after{content:''!important;position:absolute!important;inset:-60% auto -60% -70%!important;width:40%!important;background:linear-gradient(90deg,transparent,#fff8,transparent)!important;pointer-events:none!important;transform:skewX(-22deg);animation:site-app-shine 6.5s ease-in-out infinite!important;z-index:1}
  button.site-app-button.site-app-button.site-app-button.site-app-button:hover,button.site-app-button.site-app-button.site-app-button.site-app-button:focus-visible{animation:site-app-shimmy .55s ease-in-out!important;box-shadow:inset 0 1px 0 #fff9,0 6px 20px #0005!important}
  button.site-app-button.site-app-button.site-app-button.site-app-button:focus-visible{outline:2px solid var(--app-high)!important;outline-offset:4px!important}
  button.site-app-button.site-app-button.site-app-button.site-app-button .site-app-icon{width:17px!important;height:17px!important;min-width:17px!important;fill:none!important;stroke:currentColor!important;stroke-width:1.8!important;display:block!important}
  .site-app-mobile,.site-app-mobile-slot{display:none!important}.site-app-footer{text-align:center;padding:10px 0 18px}.site-app-mobile-rail{text-align:right;padding:8px 12px;position:relative;z-index:2}
  [data-site-app-installed] button.site-app-button.site-app-button.site-app-button.site-app-button,[data-site-app-installed] [data-pwa-install],[data-site-app-installed] [onclick*="installBasketballBrilliance"],button.site-app-button.site-app-button.site-app-button.site-app-button[hidden]{display:none!important}
  @keyframes site-app-float{0%,65%,100%{transform:translateY(0)}76%{transform:translateY(-3px)}84%{transform:translateY(0)}92%{transform:translateY(-1px)}}
  @keyframes site-app-shine{0%,64%{left:-70%}85%,100%{left:145%}}
  @keyframes site-app-shimmy{0%,100%{transform:translateY(0) rotate(0)}25%{transform:translateY(-2px) rotate(-1.5deg)}60%{transform:translateY(-2px) rotate(1.5deg)}}
  @media(max-width:800px){.site-app-mobile-slot{display:block!important}.site-app-desktop{display:none!important}.site-app-mobile:not([hidden]){display:inline-flex!important}button.site-app-button.site-app-button.site-app-button.site-app-button{min-height:42px!important;font-size:12px!important;padding:9px 12px!important}.site-app-mobile-rail:has(button.site-app-button.site-app-button.site-app-button.site-app-button[hidden]){display:none}}
  @media(prefers-reduced-motion:reduce){button.site-app-button.site-app-button.site-app-button.site-app-button,button.site-app-button.site-app-button.site-app-button.site-app-button::after,button.site-app-button.site-app-button.site-app-button.site-app-button:hover,button.site-app-button.site-app-button.site-app-button.site-app-button:focus-visible{animation:none!important;transition:none!important}}
  `;
  document.head.append(style);
  function sync() {
    const hide = standalone();
    document.documentElement.toggleAttribute('data-site-app-installed', hide);
    controls.forEach(control => control.hidden = hide);
  }
  addEventListener('beforeinstallprompt', event => { event.preventDefault(); pending = event; window.__cbInstallPrompt=event; });
  addEventListener('appinstalled', () => { installed = true; pending = null; window.__cbInstallPrompt=null; sync(); });
  matchMedia('(display-mode: standalone)').addEventListener('change', sync);
  function unavailable() {
    let note=document.getElementById('cb-install-status');
    if(!note){note=document.createElement('p');note.id='cb-install-status';note.setAttribute('role','status');note.style.cssText='position:fixed;z-index:2147483647;bottom:max(18px,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);width:max-content;max-width:calc(100vw - 36px);padding:14px 18px;background:#000;color:#eee;border:1px solid #c2cf32;border-radius:10px;font:14px/1.5 Georgia,serif';document.body.append(note);}
    note.textContent='Installation is not available in this browser right now. You can keep using Cannabis Basics here.';
    clearTimeout(unavailable.timer);unavailable.timer=setTimeout(()=>note.remove(),7000);
  }
  async function install() {
    if (standalone()) return;
    pending=pending||window.__cbInstallPrompt;
    if (!pending) { unavailable(); return; }
    const event = pending; pending = null; window.__cbInstallPrompt=null;
    try { await event.prompt(); await event.userChoice; } catch (_) { unavailable(); }
  }
  function makeButton(label = 'Install App', kind = '') {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'site-app-button '+kind;
    if (label === 'Install App') {
      b.setAttribute('aria-label',`Install ${brand.name} app`);
      b.innerHTML = '<svg class="site-app-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11m-4-4 4 4 4-4M5 15v5h14v-5"/></svg><span>Install App</span>';
      b.addEventListener('click', install);
    } else b.textContent = label;
    controls.push(b); return b;
  }
  window.siteInstallApp=install;
  window.__siteExperienceConfig=brand;
  const experience=document.createElement("script");experience.src=new URL("site-experience.js?v=20261016-cb-menu",document.currentScript.src).href;document.head.append(experience);
  function init() {
    const desktopHost = document.querySelector(brand.desktop);
    const desktop = makeButton('Install App','site-app-desktop');
    if (desktopHost) desktopHost.append(desktop);
    else { const rail = document.createElement('div'); rail.className='site-app-mobile-rail'; rail.append(desktop); (document.querySelector('main') || document.body).prepend(rail); }
    const mobile = makeButton('Install App','site-app-mobile');
    const mobileHost = document.querySelector(brand.mobile);
    if (mobileHost) { mobileHost.prepend(mobile); new MutationObserver(() => { if (!mobileHost.contains(mobile)) mobileHost.prepend(mobile); }).observe(mobileHost, {childList:true}); }
    else { const rail=document.createElement('div');rail.className='site-app-mobile-rail site-app-mobile-slot';rail.append(mobile);(document.querySelector('main')||document.body).prepend(rail); }
    const legacy = document.querySelectorAll('[data-pwa-install], [onclick*="installBasketballBrilliance"]');
    legacy.forEach(b => { b.hidden=true;b.style.setProperty('display','none','important'); });
    document.querySelectorAll('.site-app-footer').forEach(n=>n.remove());
    const footer=document.querySelector('footer');
    if(footer){const host=footer.querySelector('.footer-word-links,.footer-links,.footer-nav,.legal-links,nav')||footer;const link=document.createElement('button');link.type='button';link.className='site-app-footer-text';link.textContent='Install App';link.addEventListener('click',install);host.append(link);controls.push(link);}
    sync();
  }
  // Keep older install buttons on the same prompt, without duplicate prompts.
  document.addEventListener('click', event => {
    const legacy = event.target.closest?.('[data-pwa-install], [onclick*="installBasketballBrilliance"]');
    if (legacy) {event.preventDefault();event.stopImmediatePropagation();install();}
  }, true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
