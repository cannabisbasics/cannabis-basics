(() => {
  if (window.__siteAppSupport || window.top !== window.self) return;
  window.__siteAppSupport = true;
  let pending = null;
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  // Existing Cannabis Basics and Basketball Brilliance install controls retain their handlers.
  const existing = () => document.querySelector('[data-pwa-install], [onclick*="installBasketballBrilliance"]');
  let control;
  addEventListener('beforeinstallprompt', event => { if (!existing()) { event.preventDefault(); pending = event; } });
  function sync() { if (control) control.hidden = standalone(); }
  addEventListener('appinstalled', sync);
  matchMedia('(display-mode: standalone)').addEventListener('change', sync);
  function guide() {
    let dialog = document.getElementById('site-app-install-help');
    if (!dialog) {
      dialog = document.createElement('dialog'); dialog.id = 'site-app-install-help';
      dialog.setAttribute('aria-labelledby', 'site-app-install-title');
      Object.assign(dialog.style, {maxWidth:'min(440px, calc(100vw - 48px))', padding:'24px', border:'1px solid #888', borderRadius:'14px', background:'#f0f0ec', color:'#232323', font:'17px/1.6 Georgia, serif'});
      const title = document.createElement('h2'); title.id = 'site-app-install-title'; title.textContent = 'Add this site as an app'; title.style.fontSize = '1.3em';
      const text = document.createElement('p');
      const ua = navigator.userAgent;
      text.textContent = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
        ? 'In Safari, open Share, choose Add to Home Screen, then Add. If offered, leave Open as Web App turned on.'
        : /android/i.test(ua) ? 'Open this page in Chrome or Samsung Internet. Open the browser menu and choose Install app or Add to Home screen, then confirm.'
        : 'In Chrome or Microsoft Edge, look for the install icon beside the address bar, or open the browser menu and choose Install this site as an app. On a Mac using Safari, choose File, then Add to Dock. Available labels vary by browser.';
      const close = document.createElement('button'); close.type = 'button'; close.textContent = 'Close'; close.addEventListener('click', () => dialog.close());
      dialog.append(title, text, close); document.body.append(dialog);
      dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
    }
    dialog.showModal();
  }
  function init() {
    if (existing()) return;
    control = document.createElement('button'); control.type = 'button'; control.textContent = 'Install App'; control.setAttribute('aria-label', 'Install this site as an app');
    Object.assign(control.style, {font:'inherit', color:'inherit', background:'transparent', border:'1px solid currentColor', borderRadius:'999px', padding:'7px 14px', margin:'12px', cursor:'pointer'});
    control.addEventListener('click', async () => {
      if (!pending) { guide(); return; }
      const event = pending; pending = null;
      try { await event.prompt(); await event.userChoice; } catch (_) { guide(); }
    });
    const host = document.querySelector('footer');
    if (host) host.append(control);
    else { const box = document.createElement('div'); box.style.cssText = 'text-align:center;padding:12px;color:inherit'; box.append(control); document.body.append(box); }
    sync();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true}); else init();
})();
