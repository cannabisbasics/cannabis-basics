import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const sb=createClient('https://lwiwfgpgconkrahamedb.supabase.co','sb_publishable_7yLj43nCOjMAZ4BXHehGSw_V9D_8F4Q');
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>v?new Date(v).toLocaleString(undefined,{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}):'—';
const toLocal=v=>{if(!v)return '';const d=new Date(v),pad=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes())};
const fromLocal=v=>v?new Date(v).toISOString():null;
const arr=v=>String(v||'').split(',').map(x=>x.trim()).filter(Boolean);
const slug=v=>String(v||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
let settings=null,announcements=[],deals=[],catalog=[],editingAnnouncement=null,editingDeal=null,editingCatalog=null;

async function adminReady(){
  const {data:{session}}=await sb.auth.getSession();
  if(!session)return false;
  const {data}=await sb.from('admin_users').select('role').eq('user_id',session.user.id).maybeSingle();
  return !!data;
}
function status(id,msg,bad=false){const el=$(id);if(!el)return;el.textContent=msg;el.style.color=bad?'#ef9f90':'#a4b0a6'}
function updateAlerts(){
  const alerts=[];
  const remaining=Number(document.getElementById('mRemaining')?.textContent?.replace(/,/g,'')||0);
  const unread=Number(document.getElementById('mUnread')?.textContent?.replace(/,/g,'')||0);
  const activeDeals=deals.filter(d=>d.active&&(!d.starts_at||new Date(d.starts_at)<=new Date())&&(!d.ends_at||new Date(d.ends_at)>new Date())).length;
  const activeAnn=announcements.filter(a=>a.active&&(!a.starts_at||new Date(a.starts_at)<=new Date())&&(!a.ends_at||new Date(a.ends_at)>new Date())).length;
  if(unread>0)alerts.push(['warn','Contact inbox needs attention',unread+' new message'+(unread===1?'':'s')+' waiting.']);
  else alerts.push(['good','Contact inbox is clear','No unread public contact messages.']);
  if(settings?.founding_offer_enabled){
    if(remaining<=5)alerts.push(['warn','Founding access is nearly full',remaining+' opening spot'+(remaining===1?'':'s')+' remain under the current limit.']);
    else alerts.push(['good','Founding access is open',remaining+' opening spots remain.']);
  }else alerts.push(['good','Founding offer is paused','New founding claims are currently disabled by Admin.']);
  if(settings?.member_deals_enabled&&activeDeals===0)alerts.push(['warn','Member Deals has no live offers','The area is enabled, but there are no active partner offers yet.']);
  if(activeDeals>0)alerts.push(['good','Member Deals is live',activeDeals+' active offer'+(activeDeals===1?'':'s')+' available.']);
  if(activeAnn)alerts.push(['good','Site announcement is live',activeAnn+' active announcement'+(activeAnn===1?'':'s')+'.']);
  if(catalog.length<100)alerts.push(['warn','Dispensary catalog coverage looks low',catalog.length+' catalog records are currently available to Admin.']);
  else alerts.push(['good','Maryland fallback catalog loaded',catalog.filter(x=>x.active).length+' active locations in the managed catalog.']);
  $('adminAlerts').innerHTML=alerts.map(([kind,title,body])=>'<div class="admin-alert '+kind+'"><i></i><div><strong>'+esc(title)+'</strong><span>'+esc(body)+'</span></div></div>').join('');
}

async function loadSettings(){
  const {data,error}=await sb.from('site_settings').select('*').eq('id','main').single();
  if(error)throw error;settings=data;
  $('settingFoundingLimit').value=data.founding_limit??33;
  $('settingFoundingEnabled').checked=!!data.founding_offer_enabled;
  $('settingFoundingCopy').value=data.founding_offer_copy||'';
  $('settingLifetimePrice').value=Number(data.standard_lifetime_price||0).toFixed(2);
  $('settingDealsEnabled').checked=!!data.member_deals_enabled;
}
$('siteSettingsForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const patch={
    founding_limit:Math.max(0,Number($('settingFoundingLimit').value||0)),
    founding_offer_enabled:$('settingFoundingEnabled').checked,
    founding_offer_copy:$('settingFoundingCopy').value.trim()||'Limited founding access is free while spots remain.',
    standard_lifetime_price:Math.max(0,Number($('settingLifetimePrice').value||0)),
    member_deals_enabled:$('settingDealsEnabled').checked,
    updated_at:new Date().toISOString()
  };
  status('settingsStatus','Saving controls…');
  const {data,error}=await sb.from('site_settings').update(patch).eq('id','main').select().single();
  if(error){status('settingsStatus','Settings could not be saved.',true);return}
  settings=data;status('settingsStatus','Saved. Live pages will use these settings.');updateAlerts();
});

function resetAnnouncement(){
  editingAnnouncement=null;$('announcementForm').reset();$('announcementAudience').value='all';$('announcementPriority').value='0';$('announcementActive').checked=false;$('announcementSave').textContent='Create Announcement';$('announcementCancel').hidden=true;
}
function fillAnnouncement(a){
  editingAnnouncement=a.id;$('announcementTitle').value=a.title||'';$('announcementMessage').value=a.message||'';$('announcementAudience').value=a.audience||'all';$('announcementCtaLabel').value=a.cta_label||'';$('announcementCtaUrl').value=a.cta_url||'';$('announcementPriority').value=a.priority??0;$('announcementStarts').value=toLocal(a.starts_at);$('announcementEnds').value=toLocal(a.ends_at);$('announcementActive').checked=!!a.active;$('announcementSave').textContent='Update Announcement';$('announcementCancel').hidden=false;$('announcementTitle').focus();
}
function renderAnnouncements(){
  $('announcementList').innerHTML=announcements.length?announcements.map(a=>'<article class="control-item '+(!a.active?'inactive':'')+'"><div><strong>'+esc(a.title)+'</strong><small>'+esc(a.audience)+' · priority '+Number(a.priority||0)+' · '+(a.active?'Active':'Inactive')+(a.starts_at?' · starts '+esc(fmt(a.starts_at)):'')+(a.ends_at?' · ends '+esc(fmt(a.ends_at)):'')+'</small><p>'+esc(a.message)+'</p></div><div class="control-item-actions"><button data-ann-edit="'+a.id+'">Edit</button><button data-ann-toggle="'+a.id+'">'+(a.active?'Pause':'Publish')+'</button><button data-ann-delete="'+a.id+'">Delete</button></div></article>').join(''):'<div class="empty">No announcements created yet.</div>';
}
async function loadAnnouncements(){
  const {data,error}=await sb.from('site_announcements').select('*').order('priority',{ascending:false}).order('created_at',{ascending:false});
  if(error)throw error;announcements=data||[];renderAnnouncements();
}
$('announcementForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const payload={title:$('announcementTitle').value.trim(),message:$('announcementMessage').value.trim(),audience:$('announcementAudience').value,cta_label:$('announcementCtaLabel').value.trim()||null,cta_url:$('announcementCtaUrl').value.trim()||null,priority:Number($('announcementPriority').value||0),starts_at:fromLocal($('announcementStarts').value),ends_at:fromLocal($('announcementEnds').value),active:$('announcementActive').checked,updated_at:new Date().toISOString()};
  if(!payload.title||!payload.message)return;
  status('announcementStatus',editingAnnouncement?'Updating announcement…':'Creating announcement…');
  const res=editingAnnouncement?await sb.from('site_announcements').update(payload).eq('id',editingAnnouncement):await sb.from('site_announcements').insert(payload);
  if(res.error){status('announcementStatus','Announcement could not be saved.',true);return}
  status('announcementStatus','Announcement saved.');resetAnnouncement();await loadAnnouncements();updateAlerts();
});
$('announcementCancel')?.addEventListener('click',resetAnnouncement);

function resetDeal(){editingDeal=null;$('dealForm').reset();$('dealActive').checked=false;$('dealFeatured').checked=false;$('dealSave').textContent='Create Offer';$('dealCancel').hidden=true}
function fillDeal(d){
  editingDeal=d.id;$('dealTitle').value=d.title||'';$('dealPartner').value=d.partner_name||'';$('dealCategory').value=d.category||'';$('dealDescription').value=d.description||'';$('dealUrl').value=d.destination_url||'';$('dealCta').value=d.cta_label||'';$('dealCode').value=d.promo_code||'';$('dealDisclosure').value=d.disclosure||'';$('dealStates').value=(d.states||[]).join(', ');$('dealTags').value=(d.interest_tags||[]).join(', ');$('dealStarts').value=toLocal(d.starts_at);$('dealEnds').value=toLocal(d.ends_at);$('dealActive').checked=!!d.active;$('dealFeatured').checked=!!d.featured;$('dealSave').textContent='Update Offer';$('dealCancel').hidden=false;$('dealTitle').focus();
}
function renderDeals(){
  $('dealList').innerHTML=deals.length?deals.map(d=>'<article class="control-item '+(!d.active?'inactive ':'')+(d.featured?'featured':'')+'"><div><strong>'+esc(d.title)+'</strong><small>'+esc(d.partner_name||'Partner not entered')+' · '+esc(d.category||'Uncategorized')+' · '+(d.active?'Active':'Inactive')+(d.featured?' · Featured':'')+'</small><p>'+esc(d.description||'')+'</p></div><div class="control-item-actions"><button data-deal-edit="'+d.id+'">Edit</button><button data-deal-toggle="'+d.id+'">'+(d.active?'Pause':'Publish')+'</button><button data-deal-delete="'+d.id+'">Delete</button></div></article>').join(''):'<div class="empty">No partner offers created yet.</div>';
}
async function loadDeals(){
  const {data,error}=await sb.from('partner_deals').select('*').order('featured',{ascending:false}).order('created_at',{ascending:false});
  if(error)throw error;deals=data||[];renderDeals();
}
$('dealForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const payload={title:$('dealTitle').value.trim(),partner_name:$('dealPartner').value.trim()||null,category:$('dealCategory').value.trim()||null,description:$('dealDescription').value.trim()||null,destination_url:$('dealUrl').value.trim()||null,cta_label:$('dealCta').value.trim()||null,promo_code:$('dealCode').value.trim()||null,disclosure:$('dealDisclosure').value.trim()||null,states:arr($('dealStates').value),interest_tags:arr($('dealTags').value),starts_at:fromLocal($('dealStarts').value),ends_at:fromLocal($('dealEnds').value),active:$('dealActive').checked,featured:$('dealFeatured').checked,updated_at:new Date().toISOString()};
  if(!payload.title)return;
  status('dealStatus',editingDeal?'Updating offer…':'Creating offer…');
  const res=editingDeal?await sb.from('partner_deals').update(payload).eq('id',editingDeal):await sb.from('partner_deals').insert(payload);
  if(res.error){status('dealStatus','Offer could not be saved.',true);return}
  status('dealStatus','Offer saved.');resetDeal();await loadDeals();updateAlerts();
});
$('dealCancel')?.addEventListener('click',resetDeal);

function filterCatalog(){
  const q=($('catalogSearch').value||'').trim().toLowerCase(),county=$('catalogCounty').value,statusFilter=$('catalogStatus').value;
  return catalog.filter(x=>{
    const text=[x.name,x.address,x.city,x.state,x.postal_code,x.county].join(' ').toLowerCase();
    return (!q||text.includes(q))&&(!county||x.county===county)&&(statusFilter==='all'||(statusFilter==='active'&&x.active)||(statusFilter==='inactive'&&!x.active));
  });
}
function renderCatalog(){
  const list=filterCatalog();
  $('catalogList').innerHTML=list.length?list.map(x=>'<div class="catalog-row"><div><strong>'+esc(x.name)+'</strong><small>'+esc(x.address||'')+'</small></div><div class="catalog-secondary"><span>'+esc([x.city,x.county].filter(Boolean).join(' · ')||'Maryland')+'</span><small>'+esc(x.postal_code||'')+'</small></div><div class="catalog-status '+(x.active?'':'off')+'">'+(x.active?'Active':'Inactive')+'</div><button data-catalog-edit="'+x.id+'">Edit</button></div>').join(''):'<div class="empty">No catalog records match this view.</div>';
  $('catalogCount').textContent=list.length+' shown · '+catalog.length+' total';
}
async function loadCatalog(){
  const {data,error}=await sb.from('dispensary_catalog').select('*').order('name').limit(500);
  if(error)throw error;catalog=data||[];
  const counties=[...new Set(catalog.map(x=>x.county).filter(Boolean))].sort();
  $('catalogCounty').innerHTML='<option value="">All counties</option>'+counties.map(c=>'<option>'+esc(c)+'</option>').join('');
  renderCatalog();
}
function openCatalog(x=null){
  editingCatalog=x?.id||null;$('catalogModal').classList.add('open');
  $('catalogModalTitle').textContent=x?'Edit Catalog Location':'Add Supplemental Location';
  $('catalogName').value=x?.name||'';$('catalogAddress').value=x?.address||'';$('catalogCity').value=x?.city||'';$('catalogStateField').value=x?.state||'Maryland';$('catalogZip').value=x?.postal_code||'';$('catalogCountyField').value=x?.county||'';$('catalogPhone').value=x?.phone||'';$('catalogWebsite').value=x?.website||'';$('catalogSourceUrl').value=x?.source_url||'https://cannabis.maryland.gov/Pages/Dispensary-Locator.aspx';$('catalogActive').checked=x?!!x.active:true;status('catalogEditStatus','');
}
function closeCatalog(){$('catalogModal').classList.remove('open');editingCatalog=null}
$('catalogEditForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const payload={name:$('catalogName').value.trim(),address:$('catalogAddress').value.trim(),city:$('catalogCity').value.trim(),state:$('catalogStateField').value.trim()||'Maryland',postal_code:$('catalogZip').value.trim()||null,county:$('catalogCountyField').value.trim()||null,phone:$('catalogPhone').value.trim()||null,website:$('catalogWebsite').value.trim()||null,source_url:$('catalogSourceUrl').value.trim()||'https://cannabis.maryland.gov/Pages/Dispensary-Locator.aspx',active:$('catalogActive').checked,updated_at:new Date().toISOString()};
  if(!payload.name||!payload.address){status('catalogEditStatus','Name and address are required.',true);return}
  status('catalogEditStatus',editingCatalog?'Updating location…':'Adding supplemental location…');
  let res;
  if(editingCatalog)res=await sb.from('dispensary_catalog').update(payload).eq('id',editingCatalog);
  else res=await sb.from('dispensary_catalog').insert({...payload,source_key:'cb-supplement-'+slug(payload.name)+'-'+Date.now(),jurisdiction:'MD',regulator:'Cannabis Basics verified supplement'});
  if(res.error){status('catalogEditStatus','Location could not be saved.',true);return}
  closeCatalog();await loadCatalog();updateAlerts();
});

document.addEventListener('click',async e=>{
  let b=e.target.closest('[data-ann-edit]');if(b){const x=announcements.find(a=>a.id===b.dataset.annEdit);if(x)fillAnnouncement(x);return}
  b=e.target.closest('[data-ann-toggle]');if(b){const x=announcements.find(a=>a.id===b.dataset.annToggle);if(!x)return;await sb.from('site_announcements').update({active:!x.active,updated_at:new Date().toISOString()}).eq('id',x.id);await loadAnnouncements();updateAlerts();return}
  b=e.target.closest('[data-ann-delete]');if(b){if(!confirm('Delete this announcement?'))return;await sb.from('site_announcements').delete().eq('id',b.dataset.annDelete);await loadAnnouncements();updateAlerts();return}
  b=e.target.closest('[data-deal-edit]');if(b){const x=deals.find(d=>d.id===b.dataset.dealEdit);if(x)fillDeal(x);return}
  b=e.target.closest('[data-deal-toggle]');if(b){const x=deals.find(d=>d.id===b.dataset.dealToggle);if(!x)return;await sb.from('partner_deals').update({active:!x.active,updated_at:new Date().toISOString()}).eq('id',x.id);await loadDeals();updateAlerts();return}
  b=e.target.closest('[data-deal-delete]');if(b){if(!confirm('Delete this partner offer?'))return;await sb.from('partner_deals').delete().eq('id',b.dataset.dealDelete);await loadDeals();updateAlerts();return}
  b=e.target.closest('[data-catalog-edit]');if(b){const x=catalog.find(c=>c.id===b.dataset.catalogEdit);if(x)openCatalog(x);return}
});
$('catalogSearch')?.addEventListener('input',renderCatalog);$('catalogCounty')?.addEventListener('change',renderCatalog);$('catalogStatus')?.addEventListener('change',renderCatalog);$('catalogAdd')?.addEventListener('click',()=>openCatalog());$('catalogModalClose')?.addEventListener('click',closeCatalog);$('catalogCancel')?.addEventListener('click',closeCatalog);$('catalogModal')?.addEventListener('click',e=>{if(e.target===$('catalogModal'))closeCatalog()});

if(await adminReady()){
  try{
    await Promise.all([loadSettings(),loadAnnouncements(),loadDeals(),loadCatalog()]);
    const {data:spots}=await sb.rpc('founding_spots_remaining');
    if(Number.isFinite(Number(spots)))document.getElementById('controlSpotsRemaining').textContent=Number(spots).toLocaleString();
    updateAlerts();
  }catch(err){console.error('Admin controls',err);status('settingsStatus','One or more admin controls could not load.',true)}
}


async function refreshLeadRows(){
  const {data,error}=await sb.from('email_leads').select('*').order('created_at',{ascending:false}).limit(500);
  if(error||!document.getElementById('leadRows'))return;
  const rows=data||[];
  document.getElementById('leadRows').innerHTML=rows.map(x=>'<tr data-lead-row="'+esc(x.id)+'"><td>'+esc(x.email)+'</td><td>'+esc(x.source||'—')+'<small>'+(x.marketing_consent?'Marketing opt-in recorded':'Resource request only')+'</small></td><td><span class="badge">'+esc(x.status||'new')+'</span></td><td>'+fmt(x.created_at)+'</td><td><div class="inbox-actions">'+((x.status||'new')!=='contacted'?'<button class="tiny" data-lead-status="contacted" data-id="'+esc(x.id)+'">Mark Contacted</button>':'')+((x.status||'new')!=='archived'?'<button class="tiny archive" data-lead-status="archived" data-id="'+esc(x.id)+'">Archive</button>':'')+'</div></td></tr>').join('');
  document.getElementById('emptyLeads')?.classList.toggle('hidden',rows.length>0);
}
document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-lead-status]');if(!b)return;
  b.disabled=true;
  const {error}=await sb.from('email_leads').update({status:b.dataset.leadStatus}).eq('id',b.dataset.id);
  if(error){b.disabled=false;alert('Lead status could not be updated.');return}
  await refreshLeadRows();
});
