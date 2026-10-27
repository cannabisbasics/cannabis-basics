/* Cannabis Basics — Phase 3, prepared seasonal magazine invitation.
   Confirmed magazine title and concept cover; deliberately INACTIVE until
   first-issue readiness and verified consent-submission endpoint.
   Does not modify gift requests, member auth, payment or journal. */
(()=>{
'use strict';
const CONFIG={
  enabled:false,
  titleApproved:true,
  issueAvailable:false,
  endpoint:'',
  title:'Cannabis Basics Magazine', // approved publication name
  waitActiveMs:120000
};
if(!CONFIG.enabled||!CONFIG.titleApproved||!CONFIG.endpoint)return;
const seenKey='cb_magazine_invite_seen_v1',completedKey='cb_magazine_invite_completed_v1';
const get=k=>{try{return sessionStorage.getItem(k)==='1'||localStorage.getItem(k)==='1'}catch{return false}};
const mark=(k,persistent=false)=>{try{(persistent?localStorage:sessionStorage).setItem(k,'1')}catch{}};
if(get(seenKey)||get(completedKey))return;
const consentWords='Yes, I want Cannabis Basics seasonal magazine emails and occasional promotional emails about Cannabis Basics articles, tools, products, and offers. I can unsubscribe at any time.';
const css=document.createElement('style');css.textContent=`
.cb-mag-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.84);z-index:146;display:grid;place-items:center;padding:16px}
.cb-mag-panel{position:relative;width:min(960px,100%);max-height:92dvh;overflow:auto;display:grid;grid-template-columns:.8fr 1fr;gap:25px;border:1px solid #7dff57;border-radius:27px;padding:clamp(22px,4vw,42px);background:linear-gradient(145deg,#102318,#050b07);box-shadow:0 32px 100px #000;color:#eaf7e9;font-family:Georgia,serif}
.cb-mag-panel h2{color:#b8ff9f;font:400 clamp(2rem,4vw,3.5rem)/1.05 Georgia,serif;margin:10px 0 16px}
.cb-mag-panel p{line-height:1.6;color:#d1ddce}
.cb-mag-close{position:absolute;top:12px;right:12px;border:1px solid #9db99c;color:#fff;background:#142c1c;border-radius:50%;width:42px;height:42px;cursor:pointer;font-size:24px}
.cb-mag-cover-wrap{perspective:900px;padding:22px 18px 28px;display:grid;place-items:center}
.cb-mag-cover{position:relative;isolation:isolate;overflow:hidden;aspect-ratio:3/4.15;width:min(100%,320px);padding:20px;background:radial-gradient(ellipse at 70% 35%,#7bb063 0,#436c3d 30%,#1e3b26 60%,#0c2318 100%);box-shadow:12px 14px 0 #14271b,22px 25px 45px #000a;transform:rotateY(-11deg) rotate(-4deg);display:flex;flex-direction:column}
.cb-mag-cover:before{content:'';position:absolute;inset:30% -40% -15% -35%;background:radial-gradient(ellipse at 50% 55%,#cedbad30,transparent 55%),repeating-conic-gradient(from 10deg at 48% 62%,#b9d68d95 0 5deg,transparent 6deg 26deg);filter:blur(1px);transform:rotate(-15deg);z-index:-1}
.cb-mag-cover:after{content:'';position:absolute;inset:0;background:linear-gradient(110deg,#fff2,transparent 25%,transparent 70%,#0005);pointer-events:none}
.cb-mag-masthead{font:900 clamp(1.2rem,2.6vw,2rem)/.9 Georgia,serif;letter-spacing:-.05em;color:#fff;border-bottom:2px solid #d3e6b7;padding-bottom:12px;text-shadow:0 2px 9px #000}
.cb-mag-edition{font:700 .58rem Arial,sans-serif;letter-spacing:.24em;color:#e6ffbf;margin:12px 0}
.cb-mag-leaf{font-size:clamp(5rem,11vw,9rem);opacity:.65;text-align:center;margin:auto;text-shadow:0 8px 25px #001d0f;line-height:1}
.cb-mag-headline{color:#fff;font:700 clamp(1.5rem,3vw,2.4rem)/.97 Georgia,serif;text-shadow:0 3px 12px #000;margin-top:auto}
.cb-mag-teaser{color:#edffdc;font:700 .75rem/1.4 Arial,sans-serif;margin-top:11px}
.cb-mag-preview{display:inline-block;margin-top:12px;padding:6px 9px;border:1px solid #eaf7e9;color:#fff;font:800 .65rem Arial,sans-serif;letter-spacing:.13em}
.cb-mag-form label:not(.cb-mag-consent){display:block;margin:13px 0;color:#eaf7e9}
.cb-mag-form input:not([type=checkbox]){display:block;width:100%;padding:13px;margin-top:6px;border:1px solid #86bb84;border-radius:11px;background:#fff;color:#102317}
.cb-mag-consent{display:flex;gap:12px;align-items:flex-start;margin:17px 0;font-size:.9rem;line-height:1.5}
.cb-mag-consent input{margin-top:4px}
.cb-mag-action{display:block;width:100%;padding:14px;border:0;border-radius:50px;background:#7dff57;color:#071507;font-weight:800;cursor:pointer}
.cb-mag-action:disabled{opacity:.55}
.cb-mag-state{min-height:25px;font-size:.9rem}
@media(max-width:650px){.cb-mag-panel{grid-template-columns:1fr;gap:10px}.cb-mag-cover{width:min(65vw,230px)}.cb-mag-cover-wrap{padding:9px}.cb-mag-leaf{font-size:5rem}}
`;document.head.appendChild(css);
const overlay=document.createElement('div');overlay.className='cb-mag-backdrop';
overlay.innerHTML=`<section class="cb-mag-panel" role="dialog" aria-modal="true" aria-labelledby="cbMagTitle">
<button class="cb-mag-close" type="button" aria-label="Close magazine invitation">×</button>
<div class="cb-mag-cover-wrap"><div class="cb-mag-cover" role="img" aria-label="Illustrative preview of a possible Cannabis Basics seasonal educational magazine cover; not a published issue">
<div class="cb-mag-masthead">CANNABIS<br>BASICS<br><span style="font-size:.55em;letter-spacing:.16em">MAGAZINE</span></div><div class="cb-mag-edition">CANNABIS BASICS MAGAZINE • CONCEPT COVER</div>
<div class="cb-mag-leaf" aria-hidden="true">✦</div><div class="cb-mag-headline">Read the label.<br>Know the basics.</div>
<div class="cb-mag-teaser">CANNABINOIDS • TERPENES • PERSONAL JOURNALING</div><div class="cb-mag-preview">PREVIEW ONLY • NOT AN ISSUED EDITION</div></div></div>
<div><div style="font:800 .72rem Arial,sans-serif;letter-spacing:.14em;color:#7dff57">CANNABIS BASICS • SEASONAL READING</div>
<h2 id="cbMagTitle">Be first to hear about Cannabis Basics Magazine.</h2>
<p>We're planning a seasonal Cannabis Basics magazine with educational articles and practical learning resources. <strong>No issue is available yet.</strong> Sign up to hear when the first issue is ready, plus occasional Cannabis Basics promotional emails.</p>
<form class="cb-mag-form" id="cbMagForm"><label>Name<input name="name" maxlength="120" autocomplete="name" required></label>
<label>Email<input name="email" type="email" maxlength="254" autocomplete="email" required></label>
<label class="cb-mag-consent"><input type="checkbox" name="consent" required><span>${consentWords}</span></label>
<button class="cb-mag-action" type="submit">Notify me about the magazine</button><p class="cb-mag-state" aria-live="polite" role="status"></p></form>
<p style="font-size:.77rem">Subscription is optional and separate from free worksheet requests. No issue is being promised for immediate delivery.</p></div></section>`;
let opened=false,active=0,last=performance.now();
const focusBusy=()=>document.activeElement?.matches('input,textarea,select,[contenteditable=true]');
const anotherDialog=()=>[...document.querySelectorAll('[role=dialog][aria-modal=true],.modal.open,.member-invite.open,.article-modal.open')].some(el=>el!==overlay&&el!==overlay.firstElementChild&&(el.classList.contains('open')||getComputedStyle(el).display!=='none')&&!overlay.contains(el));
const blocked=()=>document.hidden||focusBusy()||anotherDialog()||document.querySelector('form:focus-within,#journal:focus-within,.tool-shell:focus-within')||sessionStorage.getItem('cb_popup_last_closed')&&Date.now()-Number(sessionStorage.getItem('cb_popup_last_closed'))<60000;
const onKey=e=>{if(e.key==='Escape')close()};
function close(){overlay.remove();document.removeEventListener('keydown',onKey);mark(seenKey);try{sessionStorage.setItem('cb_popup_last_closed',String(Date.now()))}catch{}}
overlay.querySelector('.cb-mag-close').addEventListener('click',close);
overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
overlay.querySelector('form').addEventListener('submit',async e=>{
e.preventDefault();const form=e.currentTarget;if(!form.reportValidity())return;
const status=form.querySelector('.cb-mag-state'),button=form.querySelector('button');button.disabled=true;status.textContent='Saving your request…';
try{const payload={brand:'Cannabis Basics',request_type:'seasonal-magazine',source:'seasonal-popup-120-seconds',date:new Date().toISOString(),name:form.elements.name.value.trim(),email:form.elements.email.value.trim(),consent:true,consent_wording:consentWords,magazine_title:CONFIG.title};
const response=await fetch(CONFIG.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const result=await response.json();if(!response.ok||result?.accepted!==true)throw Error('Not accepted');
mark(completedKey,true);status.textContent='You are on the magazine update list. The first issue is not yet available.';button.textContent='Subscribed';
}catch(_){status.textContent='Signup could not be verified. Please try again.';button.disabled=false}
});
const interval=setInterval(()=>{const now=performance.now(),elapsed=Math.min(1000,now-last);last=now;if(opened||get(seenKey)||get(completedKey)){clearInterval(interval);return}if(blocked())return;active+=elapsed;if(active>=CONFIG.waitActiveMs){opened=true;mark(seenKey);document.body.appendChild(overlay);document.addEventListener('keydown',onKey);clearInterval(interval)}},500);
})();