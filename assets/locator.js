
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL='https://lwiwfgpgconkrahamedb.supabase.co';
const SUPABASE_KEY='sb_publishable_7yLj43nCOjMAZ4BXHehGSw_V9D_8F4Q';
const sb=createClient(SUPABASE_URL,SUPABASE_KEY);

const $=id=>document.getElementById(id);
const ui={
  area:$('locatorArea'),state:$('locatorState'),radius:$('locatorRadius'),product:$('locatorProduct'),
  locate:$('locatorBtn'),geo:$('locatorUseLocation'),reset:$('locatorReset'),status:$('locatorStatus'),
  summary:$('locatorSummary'),count:$('locatorCount'),cards:$('locatorCards'),mapShell:$('locatorMapShell'),
  memberNote:$('locatorMemberNote')
};
if(!ui.locate||!window.L) throw new Error('Cannabis Basics Locator could not initialize.');

let session=null;
let map=null;
let markers=[];
let searchCenter=null;
let lastPlaces=[];
let searchLabel='';

const milesToMeters=m=>Math.round(Number(m||10)*1609.344);
const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const safeURL=v=>{
  if(!v)return '';
  try{const u=new URL(v);return /^https?:$/.test(u.protocol)?u.href:''}catch(e){return ''}
};
const safePhone=v=>String(v||'').replace(/[^\d+(). -]/g,'').trim();
const haversine=(a,b)=>{
  const R=3958.7613,toRad=x=>x*Math.PI/180;
  const dLat=toRad(b.lat-a.lat),dLon=toRad(b.lon-a.lon);
  const x=Math.sin(dLat/2)**2+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(x));
};
const setStatus=(msg,type='')=>{
  ui.status.className='locator-status'+(type?' '+type:'');
  ui.status.innerHTML=msg;
};
const setBusy=(busy,label='Searching nearby dispensaries…')=>{
  ui.locate.disabled=busy;ui.geo.disabled=busy;ui.reset.disabled=busy;
  if(busy)setStatus('<span class="locator-loading">'+escapeHTML(label)+'</span>');
};
const cacheGet=(key,maxAgeMs)=>{
  try{
    const item=JSON.parse(localStorage.getItem(key)||'null');
    if(item&&Date.now()-item.time<maxAgeMs)return item.data;
  }catch(e){}
  return null;
};
const cacheSet=(key,data)=>{
  try{localStorage.setItem(key,JSON.stringify({time:Date.now(),data}))}catch(e){}
};

function initMap(){
  if(map)return;
  map=L.map('locatorMap',{zoomControl:true,scrollWheelZoom:false}).setView([39.5,-98.35],4);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:19,
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>'
  }).addTo(map);
  ui.mapShell.classList.add('ready');
}
function clearMarkers(){
  markers.forEach(m=>map&&map.removeLayer(m));markers=[];
}
function setMapCenter(center,places){
  initMap();clearMarkers();
  const centerMarker=L.circleMarker([center.lat,center.lon],{
    radius:7,color:'#b8ff9f',weight:2,fillColor:'#7dff57',fillOpacity:.72
  }).addTo(map).bindPopup('<strong>Search center</strong><br>'+escapeHTML(searchLabel||'Selected area'));
  markers.push(centerMarker);
  const bounds=L.latLngBounds([[center.lat,center.lon]]);
  places.forEach((p,i)=>{
    const marker=L.marker([p.lat,p.lon]).addTo(map).bindPopup(
      '<strong>'+escapeHTML(p.name)+'</strong><br>'+escapeHTML(p.address||p.location||'Location details unavailable')+
      '<br><small>'+p.distance.toFixed(1)+' mi from search center</small>'
    );
    marker.__locatorIndex=i;markers.push(marker);bounds.extend([p.lat,p.lon]);
  });
  if(places.length)map.fitBounds(bounds.pad(.14),{maxZoom:13});
  else map.setView([center.lat,center.lon],12);
  setTimeout(()=>map.invalidateSize(),100);
}

async function getSession(){
  const {data:{session:s}}=await sb.auth.getSession();
  session=s||null;
  renderMemberNote();
}
function renderMemberNote(){
  if(session){
    ui.memberNote.innerHTML='<span>✓</span><div><b>Member connected.</b> Save any result directly to <strong>My Dispensaries</strong>.</div>';
  }else{
    ui.memberNote.innerHTML='<span>♡</span><div><b>Members can save dispensaries.</b> Tap Save on any result and sign in only if needed.</div>';
  }
}
sb.auth.onAuthStateChange((_event,s)=>{session=s||null;renderMemberNote()});

async function geocodeArea(){
  const area=(ui.area.value||'').trim();
  const state=ui.state.value||'';
  if(!area||!state)throw new Error('Enter a city or ZIP code and select a state, or use My Location.');
  const query=area+', '+state+', USA';
  searchLabel=query;
  const key='cb_geocode_'+query.toLowerCase();
  const cached=cacheGet(key,30*24*60*60*1000);
  if(cached)return cached;
  const url='https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=us&addressdetails=1&q='+encodeURIComponent(query);
  const res=await fetch(url,{headers:{'Accept':'application/json'}});
  if(!res.ok)throw new Error('Location search is temporarily unavailable.');
  const data=await res.json();
  if(!data?.length)throw new Error('We could not find that city or ZIP. Check the spelling and try again.');
  const center={lat:Number(data[0].lat),lon:Number(data[0].lon),display:data[0].display_name||query};
  cacheSet(key,center);
  return center;
}

async function fetchOSMPlaces(center,radiusMeters){
  const cacheKey='cb_locator_'+center.lat.toFixed(3)+'_'+center.lon.toFixed(3)+'_'+radiusMeters;
  const cached=cacheGet(cacheKey,10*60*1000);
  if(cached)return cached;
  const q=`[out:json][timeout:22];
(
  nwr(around:${radiusMeters},${center.lat},${center.lon})["shop"="cannabis"];
  nwr(around:${radiusMeters},${center.lat},${center.lon})["cannabis:medical"~"^(yes|only)$"];
  nwr(around:${radiusMeters},${center.lat},${center.lon})["cannabis:recreational"~"^(yes|only)$"];
);
out center tags;`;
  const endpoints=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];
  let lastError=null;
  for(const endpoint of endpoints){
    try{
      const res=await fetch(endpoint,{
        method:'POST',
        headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8','Accept':'application/json'},
        body:'data='+encodeURIComponent(q)
      });
      if(!res.ok)throw new Error('Map data service returned '+res.status);
      const data=await res.json();
      cacheSet(cacheKey,data);
      return data;
    }catch(err){lastError=err}
  }
  throw lastError||new Error('Nearby dispensary data is temporarily unavailable.');
}

function addressFromTags(t){
  if(t['addr:full'])return t['addr:full'];
  const line1=[t['addr:housenumber'],t['addr:street']].filter(Boolean).join(' ');
  const city=t['addr:city']||t['addr:town']||t['addr:village']||t['addr:hamlet']||'';
  const line2=[city,t['addr:state'],t['addr:postcode']].filter(Boolean).join(', ').replace(', '+(t['addr:postcode']||''),' '+(t['addr:postcode']||''));
  return [line1,line2].filter(Boolean).join(', ');
}
function normalizePlaces(data,center){
  const seen=new Set(),places=[];
  for(const el of data?.elements||[]){
    const sourceId=el.type+'/'+el.id;
    if(seen.has(sourceId))continue;seen.add(sourceId);
    const t=el.tags||{};
    const lat=Number(el.lat??el.center?.lat),lon=Number(el.lon??el.center?.lon);
    if(!Number.isFinite(lat)||!Number.isFinite(lon))continue;
    const name=t.name||t.brand||t.operator||'Cannabis dispensary';
    const address=addressFromTags(t);
    const city=t['addr:city']||t['addr:town']||t['addr:village']||'';
    const state=t['addr:state']||'';
    const postal=t['addr:postcode']||'';
    const website=safeURL(t['contact:website']||t.website||'');
    const phone=safePhone(t['contact:phone']||t.phone||'');
    const medical=t['cannabis:medical']||'';
    const recreational=t['cannabis:recreational']||'';
    places.push({
      sourceId,type:el.type,id:String(el.id),name,address,city,state,postal,lat,lon,website,phone,
      hours:t.opening_hours||'',medical,recreational,
      distance:haversine(center,{lat,lon}),
      sourceUrl:'https://www.openstreetmap.org/'+el.type+'/'+el.id,
      location:[city,state].filter(Boolean).join(', ')||address||'Location saved from Cannabis Basics Locator'
    });
  }
  return places.sort((a,b)=>a.distance-b.distance).slice(0,30);
}
const cannabisLabel=(value,label)=>{
  if(!value)return label+': not specified';
  if(value==='yes')return label+': yes';
  if(value==='only')return label+': only';
  if(value==='no')return label+': no';
  return label+': '+value;
};

function renderPlaces(places){
  lastPlaces=places;
  const product=(ui.product.value||'').trim();
  ui.summary.textContent=places.length?'Dispensaries near '+searchLabel:'No mapped dispensaries found';
  ui.count.textContent=places.length+(places.length===1?' result':' results');
  if(!places.length){
    ui.cards.innerHTML='<div class="locator-empty"><strong>No mapped dispensaries were returned in this radius.</strong><br>Try a larger radius or another nearby city/ZIP. OpenStreetMap coverage can vary by area, so always verify a location before traveling.</div>';
    return;
  }
  ui.cards.innerHTML=places.map((p,i)=>{
    const website=p.website?'<a href="'+escapeHTML(p.website)+'" target="_blank" rel="noopener">Website ↗</a>':'';
    const phone=p.phone?'<a href="tel:'+escapeHTML(p.phone)+'">'+escapeHTML(p.phone)+'</a>':'';
    const hours=p.hours?'<span>Hours: '+escapeHTML(p.hours)+'</span>':'';
    const info=[phone,website,hours].filter(Boolean).join('<span aria-hidden="true"> • </span>');
    return `
      <article class="locator-card" data-place="${i}">
        <div class="locator-card-top">
          <div><h4>${escapeHTML(p.name)}</h4><div class="locator-address">${escapeHTML(p.address||p.location)}</div></div>
          <span class="locator-distance">${p.distance.toFixed(1)} mi</span>
        </div>
        <div class="locator-tags">
          <span class="${p.medical==='yes'||p.medical==='only'?'yes':''}">${escapeHTML(cannabisLabel(p.medical,'Medical'))}</span>
          <span class="${p.recreational==='yes'||p.recreational==='only'?'yes':''}">${escapeHTML(cannabisLabel(p.recreational,'Adult-use'))}</span>
          <span>Open map data</span>
        </div>
        ${info?'<div class="locator-info">'+info+'</div>':''}
        ${product?'<div class="locator-product-note"><strong>Looking for: '+escapeHTML(product)+'</strong><br>Live product inventory is not included in open map data. Check the dispensary menu or contact the store before traveling.</div>':''}
        <div class="locator-card-actions">
          <button class="btn small locator-show" type="button" data-show="${i}">Show on Map</button>
          <button class="btn small locator-save" type="button" data-save="${i}">♡ Save to My Dispensaries</button>
          <a class="btn small" href="${escapeHTML(p.sourceUrl)}" target="_blank" rel="noopener">OSM Details ↗</a>
        </div>
      </article>`;
  }).join('');
}

async function runSearch(centerOverride=null){
  setBusy(true,centerOverride?'Finding dispensaries near you…':'Finding that area and nearby dispensaries…');
  try{
    const center=centerOverride||await geocodeArea();
    searchCenter=center;
    const radiusMiles=Number(ui.radius.value||10);
    const data=await fetchOSMPlaces(center,milesToMeters(radiusMiles));
    const places=normalizePlaces(data,center);
    setMapCenter(center,places);
    renderPlaces(places);
    setStatus(
      places.length
        ?'Found '+places.length+' mapped location'+(places.length===1?'':'s')+' within about '+radiusMiles+' miles. Select a result to view or save it.'
        :'No mapped dispensaries were found within about '+radiusMiles+' miles. Try increasing the radius.',
      places.length?'success':''
    );
  }catch(err){
    console.error(err);
    setStatus(escapeHTML(err.message||'The locator could not complete that search.'),'error');
    ui.summary.textContent='Search needs attention';
    ui.count.textContent='0 results';
    ui.cards.innerHTML='<div class="locator-empty">The rest of Cannabis Basics is still available. You can retry the Locator without refreshing the page.</div>';
  }finally{setBusy(false)}
}

async function useMyLocation(){
  if(!navigator.geolocation){
    setStatus('This browser does not provide location access. Use city/ZIP + state instead.','error');return;
  }
  setBusy(true,'Waiting for location permission…');
  navigator.geolocation.getCurrentPosition(
    pos=>{
      const center={lat:pos.coords.latitude,lon:pos.coords.longitude,display:'Your current location'};
      searchLabel='your location';runSearch(center);
    },
    err=>{
      setBusy(false);
      const message=err.code===1?'Location permission was not granted. Use city/ZIP + state instead.':'Your location could not be read. Use city/ZIP + state instead.';
      setStatus(message,'error');
    },
    {enableHighAccuracy:false,timeout:10000,maximumAge:300000}
  );
}

function buildSavePayload(p){
  const product=(ui.product.value||'').trim();
  return {
    user_id:session.user.id,
    client_id:'osm-'+p.type+'-'+p.id,
    name:p.name,
    location:p.location||p.address||null,
    notes:product?'Locator search product: '+product+'. Inventory not verified.':null,
    favorite:false,
    address:p.address||null,
    city:p.city||null,
    state:p.state||null,
    postal_code:p.postal||null,
    latitude:p.lat,
    longitude:p.lon,
    phone:p.phone||null,
    website:p.website||null,
    opening_hours:p.hours||null,
    medical:p.medical||null,
    recreational:p.recreational||null,
    source:'openstreetmap',
    source_id:p.sourceId,
    source_url:p.sourceUrl
  };
}
async function savePlace(p,button=null){
  if(!session){
    localStorage.setItem('cb_pending_dispensary_v1',JSON.stringify({place:p,product:(ui.product.value||'').trim()}));
    location.href='join.html?signin=1&return=locator-save';
    return;
  }
  const payload=buildSavePayload(p);
  if(button){button.disabled=true;button.textContent='Saving…'}
  try{
    const {data:existing,error:findError}=await sb.from('dispensaries')
      .select('id').eq('user_id',session.user.id).eq('source','openstreetmap').eq('source_id',p.sourceId).maybeSingle();
    if(findError)throw findError;
    let result;
    if(existing?.id)result=await sb.from('dispensaries').update(payload).eq('id',existing.id);
    else result=await sb.from('dispensaries').insert(payload);
    if(result.error)throw result.error;
    if(button){button.classList.add('saved');button.textContent='✓ Saved to My Dispensaries'}
    setStatus(escapeHTML(p.name)+' was saved to your private member account.','success');
  }catch(err){
    console.error(err);
    if(button){button.disabled=false;button.textContent='♡ Save to My Dispensaries'}
    setStatus('We could not save that dispensary. Please sign in again and retry.','error');
  }
}
async function savePendingIfNeeded(){
  if(!session)return false;
  let pending=null;
  try{pending=JSON.parse(localStorage.getItem('cb_pending_dispensary_v1')||'null')}catch(e){}
  if(!pending?.place)return false;
  localStorage.removeItem('cb_pending_dispensary_v1');
  if(pending.product)ui.product.value=pending.product;
  const p={...pending.place,distance:Number(pending.place.distance)||0};
  searchLabel=p.location||p.name||'saved dispensary';
  searchCenter={lat:Number(p.lat),lon:Number(p.lon),display:p.location||p.name};
  if(Number.isFinite(searchCenter.lat)&&Number.isFinite(searchCenter.lon)){
    setMapCenter(searchCenter,[p]);
    renderPlaces([p]);
  }
  await savePlace(p);
  setStatus(escapeHTML(p.name)+' was saved after sign-in.','success');
  return true;
}

ui.locate.addEventListener('click',()=>runSearch());
ui.geo.addEventListener('click',useMyLocation);
ui.reset.addEventListener('click',()=>{
  ui.area.value='';ui.state.value='';ui.radius.value='10';ui.product.value='';
  searchCenter=null;lastPlaces=[];searchLabel='';
  if(map){clearMarkers();map.setView([39.5,-98.35],4)}
  ui.summary.textContent='Your nearby results';
  ui.count.textContent='0 results';
  ui.cards.innerHTML='<div class="locator-empty">Search by city/ZIP or use your location. Results will appear here without sending you away from Cannabis Basics.</div>';
  setStatus('');
});
ui.area.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();runSearch()}});
ui.product.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();runSearch()}});
ui.cards.addEventListener('click',async e=>{
  const show=e.target.closest('[data-show]');
  if(show){
    const i=Number(show.dataset.show),p=lastPlaces[i];
    if(p&&map){
      map.setView([p.lat,p.lon],15);
      const marker=markers.find(m=>m.__locatorIndex===i);
      marker?.openPopup();
      ui.mapShell.scrollIntoView({behavior:'smooth',block:'center'});
    }
    return;
  }
  const save=e.target.closest('[data-save]');
  if(save){
    const p=lastPlaces[Number(save.dataset.save)];
    if(p)await savePlace(p,save);
  }
});

const pageParams=new URLSearchParams(location.search);
const presetArea=pageParams.get('locatorArea')||'';
const presetState=pageParams.get('locatorState')||'';
if(presetArea)ui.area.value=presetArea;
if(presetState&&[...ui.state.options].some(o=>o.value===presetState||o.text===presetState))ui.state.value=presetState;

initMap();
await getSession();
const restoredPending=await savePendingIfNeeded();
if(!restoredPending&&pageParams.get('autosearch')==='1'&&ui.area.value&&ui.state.value){
  await runSearch();
}
