/* Cannabis Basics Phase 2: prepared, inactive gift invitation.
   Activate only after an approved single-file download URL AND a tested delivery adapter exist.
   The separate magazine subscription will have its own consent and endpoint. */
(()=>{
  'use strict';
  const SETTINGS=Object.freeze({
    enabled:false,
    approvedGiftUrl:'',
    recipient:'cannabisbasics@gmail.com',
    requestEndpoint:'', // HTTPS endpoint that returns {accepted:true} only after durable storage.
    activeSeconds:25
  });
  if(!SETTINGS.enabled||!SETTINGS.approvedGiftUrl||!SETTINGS.requestEndpoint)return;
  const STORAGE='cb_gift_offer_seen_v1';
  const COMPLETE='cb_gift_offer_completed_v1';
  const read=(key)=>{try{return sessionStorage.getItem(key)==='1'}catch{return false}};
  const write=(key)=>{try{sessionStorage.setItem(key,'1')}catch{}};
  if(read(STORAGE)||read(COMPLETE))return;
  const style=document.createElement('style');
  style.textContent=`
  .cb-gift-overlay{position:fixed;inset:0;z-index:145;background:rgba(0,0,0,.82);display:grid;place-items:center;padding:18px}
  .cb-gift-dialog{position:relative;width:min(570px,100%);max-height:min(90dvh,850px);overflow-y:auto;background:linear-gradient(155deg,#102414,#060d08);border:1px solid rgba(125,255,87,.32);border-radius:25px;box-shadow:0 30px 100px #000;color:#f4f0e7;padding:clamp(24px,5vw,44px);font-family:Georgia,serif}
  .cb-gift-dialog h2{font-family:Georgia,serif;font-weight:400;color:#b8ff9f;font-size:clamp(2rem,6vw,3rem);line-height:1.05;margin:12px 0}
  .cb-gift-dialog p{line-height:1.55;color:#cfddce}.cb-gift-dialog label{display:block;margin:12px 0;color:#edf5e9}
  .cb-gift-dialog input:not([type=checkbox]){display:block;width:100%;margin-top:6px;border-radius:10px;border:1px solid #95c78e;padding:13px;color:#101d12;background:#fff}
  .cb-gift-dialog .cb-gift-close{position:absolute;right:14px;top:13px;border:0;border-radius:50%;width:36px;height:36px;background:#213623;color:#fff;cursor:pointer;font-size:24px}
  .cb-gift-dialog .cb-gift-submit{background:#7dff57;color:#061006;padding:13px 19px;border:0;border-radius:24px;font-weight:bold;cursor:pointer;width:100%;margin-top:12px}
  .cb-gift-dialog .cb-gift-submit:disabled{opacity:.6;cursor:wait}
  .cb-gift-dialog .cb-gift-status{min-height:1.5em;font-size:.95rem}
  .cb-gift-dialog .cb-gift-checkbox{display:flex;align-items:flex-start;gap:9px;font-size:.9rem}
  @media(max-width:480px){.cb-gift-dialog{padding:28px 20px}.cb-gift-dialog h2{font-size:2rem}}
  `;
  document.head.appendChild(style);
  let activeMs=0,last=performance.now(),shown=false,done=false,ticker;
  const busy=()=>document.hidden||document.querySelector('.modal.open,.article-modal.open,.member-invite.open,.member-overlay.open,[role=dialog][aria-modal=true]:not(.cb-gift-dialog),.contact-form:focus-within,form:focus-within,textarea:focus,.tool-shell:focus-within,#journal:focus-within')||document.activeElement?.matches('input,textarea,select,[contenteditable=true]');
  const close=()=>{
    try{sessionStorage.setItem('cb_popup_last_closed',String(Date.now()))}catch{}
    overlay.remove();document.body.classList.remove('cb-gift-open');
    write(STORAGE);
    document.removeEventListener('keydown',escape);
  };
  const escape=(e)=>{if(e.key==='Escape')close()};
  function show(){
    let lastClose=0;try{lastClose=Number(sessionStorage.getItem('cb_popup_last_closed')||0)}catch{}
    if(shown||done||busy()||read(STORAGE)||read(COMPLETE)||(lastClose&&Date.now()-lastClose<60000))return;
    shown=true;clearInterval(ticker);write(STORAGE);
    document.body.appendChild(overlay);
    document.querySelector('#cbGiftName')?.focus();
    document.addEventListener('keydown',escape);
  }
  const overlay=document.createElement('div');
  overlay.className='cb-gift-overlay';
  overlay.innerHTML=`<div class="cb-gift-dialog" role="dialog" aria-modal="true" aria-labelledby="cbGiftHeading">
    <button class="cb-gift-close" type="button" aria-label="Dismiss free gift">×</button>
    <div style="color:#7dff57;letter-spacing:.14em;font-size:.78rem">CANNABIS BASICS • FREE RESOURCE</div>
    <h2 id="cbGiftHeading">Make sense of your next cannabis label.</h2>
    <p>Request our free educational worksheet. We'll use your details to process this request; a magazine subscription is separate.</p>
    <form id="cbGiftForm">
      <label>Your name <input id="cbGiftName" autocomplete="name" required maxlength="120"></label>
      <label>Email address <input id="cbGiftEmail" type="email" autocomplete="email" required maxlength="254"></label>
      <label class="cb-gift-checkbox"><input id="cbGiftConsent" type="checkbox"> <span>Yes, send me occasional Cannabis Basics educational updates. Optional; not required for this gift.</span></label>
      <button class="cb-gift-submit" type="submit">Request my free worksheet</button>
      <p class="cb-gift-status" role="status" aria-live="polite"></p>
    </form></div>`;
  overlay.querySelector('.cb-gift-close').addEventListener('click',close);
  overlay.addEventListener('click',(e)=>{if(e.target===overlay)close()});
  overlay.querySelector('form').addEventListener('submit',async(e)=>{
    e.preventDefault();
    const form=e.currentTarget,btn=form.querySelector('button[type=submit]'),status=form.querySelector('.cb-gift-status');
    if(!form.reportValidity())return;
    btn.disabled=true;status.textContent='Submitting your request…';
    try{
      const res=await fetch(SETTINGS.requestEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        brand:'Cannabis Basics',request_type:'gift',source:'homepage-25-second-popup',
        name:form.querySelector('#cbGiftName').value.trim(),
        email:form.querySelector('#cbGiftEmail').value.trim(),
        marketing_consent:form.querySelector('#cbGiftConsent').checked,
        consent_text:'Yes, send me occasional Cannabis Basics educational updates. Optional; not required for this gift.',
        date:new Date().toISOString()
      })});
      const data=await res.json();
      if(!res.ok||data?.accepted!==true)throw new Error('Request not accepted');
      write(COMPLETE);done=true;status.textContent='Request accepted. Your worksheet is ready.';
      const link=document.createElement('a');link.href=SETTINGS.approvedGiftUrl;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Open approved worksheet';link.className='cb-gift-submit';link.style.display='block';link.style.textAlign='center';form.appendChild(link);btn.remove();
    }catch(_){status.textContent='We could not accept your request. Nothing has been unlocked. Please try again.';btn.disabled=false}
  });
  ticker=setInterval(()=>{
    const now=performance.now(),delta=Math.min(1000,now-last);last=now;
    if(busy())return;
    activeMs+=delta;
    if(activeMs>=SETTINGS.activeSeconds*1000)show();
  },500);
})();