import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL='https://lwiwfgpgconkrahamedb.supabase.co';
const SUPABASE_KEY='sb_publishable_7yLj43nCOjMAZ4BXHehGSw_V9D_8F4Q';
const sb=createClient(SUPABASE_URL,SUPABASE_KEY);

const getSessionId=()=>{
  try{
    let id=sessionStorage.getItem('cb_anon_session');
    if(!id){id=crypto.randomUUID?.()||('cb-'+Date.now()+'-'+Math.random().toString(36).slice(2));sessionStorage.setItem('cb_anon_session',id)}
    return id;
  }catch(_){return ''}
};
const trackingAllowed=()=>navigator.doNotTrack!=='1'&&navigator.globalPrivacyControl!==true;
async function track(eventName,context={}){
  if(!trackingAllowed())return;
  try{
    await sb.from('site_events').insert({
      event_name:eventName,
      page_path:location.pathname+location.hash.slice(0,120),
      session_id:getSessionId(),
      context
    });
  }catch(_){}
}
window.cbTrack=track;
window.addEventListener('cb-track',e=>{const d=e.detail||{};if(d.eventName)track(d.eventName,d.context||{})});

track(location.pathname.endsWith('members.html')?'member_open':location.pathname.endsWith('join.html')?'join_open':'page_view');

document.addEventListener('click',e=>{
  if(e.target.closest('[data-pwa-install]'))track('pwa_install_click');
},{passive:true});

const emailInput=document.getElementById('freebieEmail');
const freebieBtn=document.getElementById('freebieInlineBtn');
freebieBtn?.addEventListener('click',async()=>{
  const email=(emailInput?.value||'').trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return;
  try{
    const {error}=await sb.from('email_leads').insert({email,source:'free-cannabis-log'});
    if(error&&error.code!=='23505')throw error;
    await track('free_resource_open');
  }catch(_){}
},{passive:true});

const contactForm=document.getElementById('contactForm');
const status=document.getElementById('contactStatus');
contactForm?.addEventListener('submit',async e=>{
  e.preventDefault();
  const email=(document.getElementById('contactEmail')?.value||'').trim();
  const message=(document.getElementById('contactMessage')?.value||'').trim();
  if(!email||!message){
    if(status)status.textContent='Please add your email and a message.';
    return;
  }
  if(status)status.textContent='Sending your message…';
  const topic=[
    document.getElementById('contactFocus')?.value||'',
    document.getElementById('contactType')?.value||''
  ].filter(v=>v&&v!=='Choose one').join(' • ');
  const payload={
    name:(document.getElementById('contactName')?.value||'').trim()||null,
    email,
    topic:topic||null,
    state:(document.getElementById('contactState')?.value||'').trim()||null,
    favorite_strains:(document.getElementById('contactStrains')?.value||'').trim()||null,
    message
  };
  try{
    const {error}=await sb.from('contact_messages').insert(payload);
    if(error)throw error;
    if(status)status.textContent='Message received. Thank you for contacting Cannabis Basics.';
    contactForm.reset();
    await track('contact_submit',{topic:topic||'general'});
  }catch(err){
    console.error(err);
    if(status)status.textContent='Your message could not be sent right now. Please try again.';
  }
});

document.addEventListener('click',e=>{
  if(e.target.closest('#decodeBtn'))track('decoder_run');
},{passive:true});


const modalEmailForm=document.getElementById('emailForm');
const modalEmailInput=document.getElementById('emailInput');
modalEmailForm?.addEventListener('submit',async()=>{
  const email=(modalEmailInput?.value||'').trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return;
  try{
    const {error}=await sb.from('email_leads').insert({email,source:'free-log-modal'});
    if(error&&error.code!=='23505')throw error;
    await track('free_resource_modal_submit');
  }catch(_){}
},{passive:true});
