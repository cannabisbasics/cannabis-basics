
(() => {
  const path=location.pathname.toLowerCase();
  const isAdmin=path.endsWith('admin.html');
  const isMembers=path.endsWith('members.html');
  const isJoin=path.endsWith('join.html');

  function mainTarget(){
    return document.querySelector('main,.main,.gate,#adminApp,.wrap');
  }
  const main=mainTarget();
  if(main){
    if(!main.id)main.id='cbMain';
    if(!document.querySelector('.cb-skip-link')){
      const skip=document.createElement('a');
      skip.className='cb-skip-link';skip.href='#'+main.id;skip.textContent='Skip to main content';
      document.body.prepend(skip);
    }
  }

  document.querySelectorAll('a[target="_blank"]').forEach(a=>{
    const rel=new Set((a.getAttribute('rel')||'').split(/\s+/).filter(Boolean));
    rel.add('noopener');rel.add('noreferrer');a.setAttribute('rel',[...rel].join(' '));
  });

  document.querySelectorAll('.status,.control-status,.backup-status,.profile-status-line,.locator-status,#status,[aria-live]').forEach(el=>{
    if(!el.getAttribute('role'))el.setAttribute('role','status');
    if(!el.getAttribute('aria-live'))el.setAttribute('aria-live','polite');
  });

  document.querySelectorAll('img').forEach(img=>{
    if(img.closest('.hero,.nav,.topbar,.public-topbar,.brand,.gate-logo,.profile-avatar,.dashboard-avatar'))return;
    if(!img.hasAttribute('loading'))img.loading='lazy';
    if(!img.hasAttribute('decoding'))img.decoding='async';
  });
  document.querySelectorAll('video').forEach(video=>{
    if(video.closest('.hero'))return;
    if(!video.hasAttribute('preload')||video.getAttribute('preload')==='auto')video.preload='metadata';
  });

  const net=document.createElement('div');
  net.className='cb-network-status';net.setAttribute('role','status');net.setAttribute('aria-live','polite');
  document.body.appendChild(net);
  let netTimer;
  const showNet=(message,offline=false)=>{
    clearTimeout(netTimer);net.textContent=message;net.className='cb-network-status show'+(offline?' offline':'');
    if(!offline)netTimer=setTimeout(()=>net.classList.remove('show'),2600);
  };
  window.addEventListener('offline',()=>showNet('You are offline. Cloud features will reconnect when your connection returns.',true));
  window.addEventListener('online',()=>showNet('Back online. Cloud features are available again.'));
  const reportClientError=(kind)=>{
    try{
      if(sessionStorage.getItem('cb_client_error_sent')==='1')return;
      sessionStorage.setItem('cb_client_error_sent','1');
      const context={kind:String(kind||'unknown').slice(0,40),online:navigator.onLine};
      if(window.cbTrack)window.cbTrack('client_error',context);
      else window.dispatchEvent(new CustomEvent('cb-track',{detail:{eventName:'client_error',context}}));
    }catch(_){}
  };
  window.addEventListener('unhandledrejection',e=>{
    const msg=String(e.reason?.message||e.reason||'').toLowerCase();
    if(!navigator.onLine||/network|fetch|failed to fetch|timeout/.test(msg))showNet('A cloud request could not finish. Check your connection and try again.',true);
    reportClientError(/network|fetch|timeout/.test(msg)?'network-promise':'promise');
  });
  if(!navigator.onLine)showNet('You are offline. Cloud features will reconnect when your connection returns.',true);

  let priorFocus=null;
  const dialogSelector='.member-overlay.open,.control-modal.open,.article-modal.open,.member-invite.open';
  const focusables='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  const syncDialogs=()=>{
    document.querySelectorAll('.member-overlay,.control-modal,.article-modal,.member-invite').forEach(d=>{
      const open=d.classList.contains('open');
      d.setAttribute('aria-hidden',open?'false':'true');
      if(open&&!d.hasAttribute('role'))d.setAttribute('role','dialog');
      if(open&&!d.hasAttribute('aria-modal'))d.setAttribute('aria-modal','true');
    });
  };
  const observer=new MutationObserver(muts=>{
    let changed=false;
    muts.forEach(m=>{if(m.type==='attributes'&&m.attributeName==='class')changed=true});
    if(!changed)return;
    const open=document.querySelector(dialogSelector);
    if(open){
      if(!open.dataset.cbFocused){
        priorFocus=document.activeElement;open.dataset.cbFocused='1';
        const first=open.querySelector(focusables);if(first)setTimeout(()=>first.focus({preventScroll:true}),0);
      }
    } else {
      document.querySelectorAll('[data-cb-focused]').forEach(x=>delete x.dataset.cbFocused);
      if(priorFocus?.isConnected)priorFocus.focus({preventScroll:true});priorFocus=null;
    }
    syncDialogs();
  });
  observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});
  syncDialogs();

  document.addEventListener('keydown',e=>{
    const open=document.querySelector(dialogSelector);
    if(e.key==='Escape'&&open){
      const close=open.querySelector('[data-close],[data-close-member-overlay],.member-invite-close,.modal-close,#catalogModalClose');
      if(close){e.preventDefault();close.click();return}
    }
    if(e.key!=='Tab'||!open)return;
    const list=[...open.querySelectorAll(focusables)].filter(x=>x.offsetParent!==null);
    if(list.length<2)return;
    const first=list[0],last=list[list.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  });

  if(isMembers){
    const nav=document.getElementById('mobileNav');
    nav?.addEventListener('click',e=>{
      const b=e.target.closest('button[data-go]');if(!b)return;
      setTimeout(()=>{
        nav.querySelectorAll('button').forEach(x=>x.removeAttribute('aria-current'));
        const active=nav.querySelector('button.active');if(active)active.setAttribute('aria-current','page');
        b.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',inline:'center',block:'nearest'});
      },0);
    });
    const active=nav?.querySelector('button.active');if(active)active.setAttribute('aria-current','page');
  }

  window.addEventListener('error',e=>{
    const el=e.target;
    if(el instanceof HTMLImageElement&&!el.dataset.cbImageError){
      el.dataset.cbImageError='1';el.alt=el.alt||'Image unavailable';el.style.opacity='.25';return;
    }
    if(el instanceof HTMLScriptElement||el instanceof HTMLLinkElement){reportClientError('resource-load');return}
    if(e instanceof ErrorEvent)reportClientError('script');
  },true);

  window.cbQualityReady=true;
})();
