import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const sb=createClient('https://lwiwfgpgconkrahamedb.supabase.co','sb_publishable_7yLj43nCOjMAZ4BXHehGSw_V9D_8F4Q');

const safeUrl=v=>{if(!v)return '';try{const u=new URL(v,location.href);return ['http:','https:'].includes(u.protocol)?u.href:''}catch(_){return ''}};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function mountStyle(){
  if(document.getElementById('cb-site-announcement-style'))return;
  const st=document.createElement('style');st.id='cb-site-announcement-style';st.textContent="\n.cb-site-announcement{position:relative;z-index:49;margin:0;background:linear-gradient(90deg,#172019,#111a13);border-bottom:1px solid rgba(194,207,50,.2);color:#eef4ec}\n.cb-site-announcement-inner{max-width:1500px;margin:auto;display:flex;align-items:center;justify-content:center;gap:13px;padding:10px 18px;text-align:center;flex-wrap:wrap}\n.cb-site-announcement strong{font:400 .82rem Georgia,serif;color:#e8ee9c}.cb-site-announcement span{font:500 .7rem/1.45 Inter,system-ui,sans-serif;color:#b8c5ba}\n.cb-site-announcement a{display:inline-flex;padding:6px 9px;border-radius:999px;border:1px solid rgba(194,207,50,.28);color:#e9f49b;text-decoration:none;font:700 .64rem Inter,system-ui,sans-serif}\n.cb-site-announcement button{border:0;background:transparent;color:#829087;cursor:pointer;font-size:1rem;line-height:1}\nbody:has(.nav) .cb-site-announcement{position:fixed;top:72px;left:0;right:0}\nbody:has(.topbar) .cb-site-announcement{position:sticky;top:78px}\n@media(max-width:720px){body:has(.nav) .cb-site-announcement{top:68px}.cb-site-announcement-inner{justify-content:flex-start;text-align:left;padding:9px 13px}.cb-site-announcement span{flex:1 1 200px}}\n";
  document.head.appendChild(st);
}
function mount(a){
  if(!a)return;
  if(sessionStorage.getItem('cb_dismiss_announcement_'+a.id)==='1')return;
  mountStyle();
  const wrap=document.createElement('div');wrap.className='cb-site-announcement';wrap.dataset.announcementId=a.id;
  const url=safeUrl(a.cta_url);
  wrap.innerHTML='<div class="cb-site-announcement-inner"><strong>'+esc(a.title)+'</strong><span>'+esc(a.message)+'</span>'+(url&&a.cta_label?'<a href="'+esc(url)+'">'+esc(a.cta_label)+'</a>':'')+'<button type="button" aria-label="Dismiss announcement">×</button></div>';
  wrap.querySelector('button').addEventListener('click',()=>{sessionStorage.setItem('cb_dismiss_announcement_'+a.id,'1');wrap.remove()});
  const anchor=document.querySelector('.nav,.public-topbar,.topbar,.top');
  if(anchor?.parentNode)anchor.insertAdjacentElement('afterend',wrap);else document.body.prepend(wrap);
}
try{
  const {data,error}=await sb.from('site_announcements').select('*').eq('active',true).order('priority',{ascending:false}).order('created_at',{ascending:false}).limit(1);
  if(!error&&data?.length)mount(data[0]);
}catch(_){}