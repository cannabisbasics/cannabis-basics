"""Add app metadata without rewriting page markup or changing site behavior."""
from pathlib import Path
import base64,json,os,re
ROOT=Path('.')
cfg=json.loads((Path(__file__).with_name('app-config.json')).read_text())
a=ROOT/'app-assets';a.mkdir(exist_ok=True)
for size,data in cfg['icons'].items():(a/f'icon-{size}.png').write_bytes(base64.b64decode(data))
manifest=next((p for p in [ROOT/'manifest.webmanifest',ROOT/'site.webmanifest'] if p.exists()),ROOT/'manifest.webmanifest')
m=json.loads(manifest.read_text()) if manifest.exists() else {}
m.update(name=cfg['name'],short_name=cfg['short_name'],display='standalone',scope='./',background_color=cfg['color'],theme_color=cfg['color'],prefer_related_applications=False)
m.setdefault('id','./');m.setdefault('start_url','./');m.setdefault('lang','en-US')
m['icons']=[{'src':f'app-assets/icon-{s}.png','sizes':f'{s}x{s}','type':'image/png','purpose':'any'} for s in [192,512]]
manifest.write_text(json.dumps(m,indent=2)+'\n')
js=r'''(() => {
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
'''
(a/'install.js').write_text(js)
count=0
for page in ROOT.rglob('*.html'):
 if any(x in {'.git','.github','node_modules','app-assets','_site','dist','build23'} or x.startswith('backup') for x in page.parts):continue
 source=page.read_text(encoding='utf-8')
 if not re.search(r'</head\s*>',source,re.I):continue
 # Replace metadata tags only; preserve the rest of every original page byte for byte.
 source=re.sub(r'<link\b(?=[^>]*\brel\s*=\s*[\"\'](?:manifest|apple-touch-icon)[\"\'])[^>]*>','',source,flags=re.I)
 source=re.sub(r'<meta\b(?=[^>]*\bname\s*=\s*[\"\'](?:mobile-web-app-capable|apple-mobile-web-app-capable|apple-mobile-web-app-title)[\"\'])[^>]*>','',source,flags=re.I)
 source=re.sub(r'<script\b[^>]*\bsrc=[\"\'][^\"\']*app-assets/install\.js[^\"\']*[\"\'][^>]*>\s*</script>','',source,flags=re.I)
 rel=lambda p:os.path.relpath(p,page.parent).replace(os.sep,'/')
 tags=f'''<link rel="manifest" href="{rel(manifest)}" type="application/manifest+json">
<link rel="apple-touch-icon" sizes="180x180" href="{rel(a/'icon-180.png')}">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="{cfg['short_name']}">
<script defer src="{rel(a/'install.js')}"></script>
'''
 source=re.sub(r'</head\s*>',lambda match:tags+match.group(),source,count=1,flags=re.I)
 page.write_text(source,encoding='utf-8');count+=1
# Refresh the two pre-existing service workers without introducing new caching.
sw=ROOT/'sw.js'
if sw.exists():
 s=sw.read_text();s=re.sub(r"const CACHE='[^']+'",lambda _:"const CACHE='"+('cb-app-' if 'cb-app-' in s else 'basketball-brilliance-')+"install-20261015'",s,count=1)
 if 'cb-app-' in s:s=s.replace('keys.filter(k=>k!==CACHE)',"keys.filter(k=>k.startsWith('cb-app-')&&k!==CACHE)")
 sw.write_text(s)
print(f"Updated {count} pages for {cfg['name']}; manifest={manifest}")
assert len(m['icons'])==2 and m['display']=='standalone'
for icon in m['icons']:assert (ROOT/icon['src']).read_bytes().startswith(b'\x89PNG\r\n\x1a\n')
assert (manifest.parent/m['start_url'].split('?')[0]).exists()
