import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const sb=createClient('https://lwiwfgpgconkrahamedb.supabase.co','sb_publishable_7yLj43nCOjMAZ4BXHehGSw_V9D_8F4Q');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=v=>{if(!v)return '';try{const u=new URL(v,location.href);return ['http:','https:'].includes(u.protocol)?u.href:''}catch(_){return ''}};
const style=document.createElement('style');style.id='cb-member-deals-style';style.textContent="\n.member-deal-card{padding:19px;border-radius:20px;background:#0f1611;border:1px solid rgba(125,255,87,.12);display:flex;flex-direction:column;gap:9px;min-height:210px}\n.member-deal-card.featured{border-color:rgba(194,207,50,.34);box-shadow:0 16px 38px rgba(0,0,0,.18)}\n.member-deal-card .deal-kicker{font:800 .6rem Inter,system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#cbd878}\n.member-deal-card h3{font:400 1.2rem Georgia,serif;color:#eef3ed;margin:0}.member-deal-card p{color:#92a097;font-size:.78rem;line-height:1.55;margin:0}\n.member-deal-meta{display:flex;gap:6px;flex-wrap:wrap}.member-deal-meta span{font-size:.61rem;padding:5px 7px;border-radius:999px;background:rgba(125,255,87,.06);color:#aebdaf}\n.member-deal-code{padding:9px 10px;border-radius:12px;border:1px dashed rgba(194,207,50,.3);color:#e7ef9a;font:700 .72rem Inter,system-ui,sans-serif}\n.member-deal-card button{margin-top:auto;border:0;border-radius:999px;background:#c2cf32;color:#131700;padding:10px 12px;font-weight:800}\n.member-deal-disclosure{font-size:.62rem!important;color:#6f7e72!important}\nbody.light-theme .member-deal-card{background:#fff;border-color:#d6ded1}.body.light-theme .member-deal-card h3{color:#151915}\n";document.head.appendChild(style);
const {data:{session}}=await sb.auth.getSession();
if(session){
  const [settingsRes,dealsRes,profileRes]=await Promise.all([
    sb.from('site_settings').select('*').eq('id','main').single(),
    sb.from('partner_deals').select('*').order('featured',{ascending:false}).order('created_at',{ascending:false}),
    sb.from('profiles').select('state').eq('id',session.user.id).maybeSingle()
  ]);
  const settings=settingsRes.data||{};const grid=document.getElementById('memberDealsGrid');const intro=document.getElementById('memberDealsIntro');
  document.querySelectorAll('[data-membership-offer-copy]').forEach(el=>el.textContent=(settings.founding_offer_copy||'Limited founding access is free while spots remain.')+' Standard lifetime price after that: $'+Number(settings.standard_lifetime_price||0).toFixed(0)+'.');
  document.querySelectorAll('[data-standard-lifetime-price]').forEach(el=>el.textContent='$'+Number(settings.standard_lifetime_price||0).toFixed(0));
  if(grid){
    if(!settings.member_deals_enabled){grid.innerHTML='<div class="deal-placeholder"><b>Member Deals are temporarily paused.</b><span>Your journal, products, stash, dispensaries, and other member tools are still available.</span></div>';if(intro)intro.textContent='Partner offers are currently paused by Cannabis Basics.';}
    else{
      const state=profileRes.data?.state||'';let deals=(dealsRes.data||[]);
      if(state)deals=deals.filter(d=>!d.states?.length||d.states.some(s=>String(s).toLowerCase()===state.toLowerCase()));
      grid.innerHTML=deals.length?deals.map(d=>{const url=safeUrl(d.destination_url);return '<article class="member-deal-card '+(d.featured?'featured':'')+'"><span class="deal-kicker">'+esc(d.featured?'Featured Member Offer':(d.category||'Member Offer'))+'</span><h3>'+esc(d.title)+'</h3><p>'+esc(d.description||'')+'</p><div class="member-deal-meta">'+(d.partner_name?'<span>'+esc(d.partner_name)+'</span>':'')+(d.states?.length?'<span>'+esc(d.states.join(', '))+'</span>':'')+'</div>'+(d.promo_code?'<div class="member-deal-code">Code: '+esc(d.promo_code)+'</div>':'')+(d.disclosure?'<p class="member-deal-disclosure">'+esc(d.disclosure)+'</p>':'')+(url?'<button type="button" data-member-deal="'+esc(d.id)+'" data-url="'+esc(url)+'">'+esc(d.cta_label||'View Offer')+'</button>':'')+'</article>'}).join(''):'<div class="deal-placeholder"><b>No active offers yet.</b><span>Cannabis Basics will only publish verified partner offers after the relationship and terms are active.</span></div>';
      if(intro)intro.textContent=deals.length?'Current verified partner savings available to your member account.':'The Member Deals area is ready; no verified offers are live yet.';
      grid.addEventListener('click',async e=>{const b=e.target.closest('[data-member-deal]');if(!b)return;const url=safeUrl(b.dataset.url);if(!url)return;b.disabled=true;try{await sb.from('deal_clicks').insert({user_id:session.user.id,deal_id:b.dataset.memberDeal})}catch(_){}window.open(url,'_blank','noopener');b.disabled=false;});
    }
  }
}