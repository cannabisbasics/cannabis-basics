
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL='https://lwiwfgpgconkrahamedb.supabase.co';
const SUPABASE_KEY='sb_publishable_7yLj43nCOjMAZ4BXHehGSw_V9D_8F4Q';
const sb=createClient(SUPABASE_URL,SUPABASE_KEY);

const $=id=>document.getElementById(id);
const ui={
  area:$('locatorArea'),state:$('locatorState'),radius:$('locatorRadius'),product:$('locatorProduct'),
  locate:$('locatorBtn'),geo:$('locatorUseLocation'),reset:$('locatorReset'),status:$('locatorStatus'),
  summary:$('locatorSummary'),count:$('locatorCount'),cards:$('locatorCards'),mapShell:$('locatorMapShell'),
  memberNote:$('locatorMemberNote'),searchMap:$('locatorSearchMap')
};
if(!ui.locate||!window.L) throw new Error('Cannabis Basics Locator could not initialize.');

let session=null;
let map=null;
let markers=[];
let searchCenter=null;
let lastPlaces=[];
let searchLabel='';
let suppressMapMove=false;
let lastMapSearchCenter=null;

const milesToMeters=m=>Math.round(Number(m||10)*1609.344);
const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[c]));
const safeURL=v=>{if(!v)return '';try{const u=new URL(v);return /^https?:$/.test(u.protocol)?u.href:''}catch(e){return ''}};
const safePhone=v=>String(v||'').replace(/[^\d+(). -]/g,'').trim();
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
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
  if(ui.searchMap)ui.searchMap.disabled=busy;
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
const isMarylandCenter=c=>c&&c.lat>=37.7&&c.lat<=39.8&&c.lon>=-79.6&&c.lon<=-74.8;

function initMap(){
  if(map)return;
  map=L.map('locatorMap',{zoomControl:true,scrollWheelZoom:true}).setView([39.5,-98.35],4);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:19,
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>'
  }).addTo(map);
  map.on('moveend zoomend',()=>{
    if(suppressMapMove||!lastMapSearchCenter||!ui.searchMap)return;
    const c=map.getCenter();
    const moved=haversine(lastMapSearchCenter,{lat:c.lat,lon:c.lng})>.35;
    ui.searchMap.classList.toggle('show',moved);
  });
  ui.mapShell.classList.add('ready');
}
function clearMarkers(){
  markers.forEach(m=>map&&map.removeLayer(m));markers=[];
}
function sourceBadge(p){
  return p.source==='maryland-cannabis-administration'?'Maryland licensed location':'Open map location';
}
function popupHTML(p,i){
  return '<div class="locator-popup">'+
    '<strong>'+escapeHTML(p.name)+'</strong>'+
    '<span>'+escapeHTML(p.address||p.location||'Location details unavailable')+'</span>'+
    '<small>'+Number(p.distance||0).toFixed(1)+' mi · '+escapeHTML(sourceBadge(p))+'</small>'+
    '<div class="locator-popup-actions">'+
      '<button type="button" data-map-view="'+i+'">View details</button>'+
      '<button type="button" data-map-save="'+i+'">Save</button>'+
    '</div></div>';
}
function setMapCenter(center,places){
  initMap();clearMarkers();
  suppressMapMove=true;
  const centerMarker=L.circleMarker([center.lat,center.lon],{
    radius:7,color:'#b8ff9f',weight:2,fillColor:'#7dff57',fillOpacity:.72
  }).addTo(map).bindPopup('<strong>Search center</strong><br>'+escapeHTML(searchLabel||'Selected area'));
  markers.push(centerMarker);
  const bounds=L.latLngBounds([[center.lat,center.lon]]);
  places.forEach((p,i)=>{
    const marker=L.marker([p.lat,p.lon],{title:p.name}).addTo(map).bindPopup(popupHTML(p,i),{maxWidth:290});
    marker.__locatorIndex=i;markers.push(marker);bounds.extend([p.lat,p.lon]);
  });
  if(places.length)map.fitBounds(bounds.pad(.12),{maxZoom:13});
  else map.setView([center.lat,center.lon],12);
  lastMapSearchCenter={lat:center.lat,lon:center.lon};
  if(ui.searchMap)ui.searchMap.classList.remove('show');
  setTimeout(()=>{map.invalidateSize();suppressMapMove=false},160);
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

async function geocodeQuery(query,cacheKey,maxAge=90*24*60*60*1000){
  const cached=cacheGet(cacheKey,maxAge);
  if(cached)return cached;
  const url='https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=us&addressdetails=1&q='+encodeURIComponent(query);
  const res=await fetch(url,{headers:{'Accept':'application/json'}});
  if(!res.ok)throw new Error('Location search is temporarily unavailable.');
  const data=await res.json();
  if(!data?.length)return null;
  const point={lat:Number(data[0].lat),lon:Number(data[0].lon),display:data[0].display_name||query};
  cacheSet(cacheKey,point);
  return point;
}
async function geocodeArea(){
  const area=(ui.area.value||'').trim();
  const state=ui.state.value||'';
  if(!area||!state)throw new Error('Enter a city or ZIP code and select a state, or use My Location.');
  const query=area+', '+state+', USA';
  searchLabel=query;
  const point=await geocodeQuery(query,'cb_geocode_'+query.toLowerCase(),30*24*60*60*1000);
  if(!point)throw new Error('We could not find that city or ZIP. Check the spelling and try again.');
  return point;
}

async function fetchOSMPlaces(center,radiusMeters){
  const cacheKey='cb_locator_osm_'+center.lat.toFixed(3)+'_'+center.lon.toFixed(3)+'_'+radiusMeters;
  const cached=cacheGet(cacheKey,10*60*1000);
  if(cached)return cached;
  const q='[out:json][timeout:22];\n(\n'+
    'nwr(around:'+radiusMeters+','+center.lat+','+center.lon+')["shop"="cannabis"];\n'+
    'nwr(around:'+radiusMeters+','+center.lat+','+center.lon+')["cannabis:medical"~"^(yes|only)$"];\n'+
    'nwr(around:'+radiusMeters+','+center.lat+','+center.lon+')["cannabis:recreational"~"^(yes|only)$"];\n'+
    ');\nout center tags;';
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
  throw lastError||new Error('Nearby open map data is temporarily unavailable.');
}

function addressFromTags(t){
  if(t['addr:full'])return t['addr:full'];
  const line1=[t['addr:housenumber'],t['addr:street']].filter(Boolean).join(' ');
  const city=t['addr:city']||t['addr:town']||t['addr:village']||t['addr:hamlet']||'';
  const line2=[city,t['addr:state'],t['addr:postcode']].filter(Boolean).join(', ').replace(', '+(t['addr:postcode']||''),' '+(t['addr:postcode']||''));
  return [line1,line2].filter(Boolean).join(', ');
}
function normalizeOSMPlaces(data,center){
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
    places.push({
      source:'openstreetmap',sourceId,type:el.type,id:String(el.id),name,address,city,state,postal,lat,lon,
      website:safeURL(t['contact:website']||t.website||''),phone:safePhone(t['contact:phone']||t.phone||''),
      hours:t.opening_hours||'',medical:t['cannabis:medical']||'',recreational:t['cannabis:recreational']||'',
      distance:haversine(center,{lat,lon}),
      sourceUrl:'https://www.openstreetmap.org/'+el.type+'/'+el.id,
      location:[city,state].filter(Boolean).join(', ')||address||'Location saved from Cannabis Basics Locator'
    });
  }
  return places;
}

async function fetchOfficialCatalog(center,radiusMiles){
  if(!isMarylandCenter(center) && ui.state.value!=='Maryland')return [];
  const {data,error}=await sb.from('dispensary_catalog')
    .select('id,source_key,name,address,city,state,postal_code,county,latitude,longitude,phone,website,medical,recreational,source_url,source_updated_at')
    .eq('active',true).eq('state','Maryland');
  if(error)throw error;
  const rows=data||[];
  let geocodedOne=false;
  for(const row of rows){
    if(Number.isFinite(Number(row.latitude))&&Number.isFinite(Number(row.longitude)))continue;
    const cached=cacheGet('cb_catalog_geo_'+row.source_key,180*24*60*60*1000);
    if(cached){
      row.latitude=cached.lat;row.longitude=cached.lon;continue;
    }
    try{
      if(geocodedOne)await delay(1050);
      const q=[row.address,row.city,'Maryland',row.postal_code].filter(Boolean).join(', ');
      const point=await geocodeQuery(q,'cb_catalog_geo_'+row.source_key,180*24*60*60*1000);
      geocodedOne=true;
      if(point){row.latitude=point.lat;row.longitude=point.lon}
    }catch(e){console.warn('Catalog geocode unavailable for',row.name)}
  }
  return rows.map(row=>{
    const lat=Number(row.latitude),lon=Number(row.longitude);
    if(!Number.isFinite(lat)||!Number.isFinite(lon))return null;
    return {
      source:'maryland-cannabis-administration',sourceId:row.source_key,type:'official',id:row.id,
      name:row.name,address:[row.address,row.city,'MD',row.postal_code].filter(Boolean).join(', '),
      city:row.city,state:'Maryland',postal:row.postal_code||'',county:row.county||'',lat,lon,
      website:safeURL(row.website||''),phone:safePhone(row.phone||''),hours:'',
      medical:row.medical||'',recreational:row.recreational||'',
      distance:haversine(center,{lat,lon}),sourceUrl:row.source_url,
      sourceUpdatedAt:row.source_updated_at||'',
      location:[row.city,'MD'].filter(Boolean).join(', ')
    };
  }).filter(Boolean).filter(p=>p.distance<=radiusMiles+.5);
}
function nameKey(v){
  return String(v||'').toLowerCase().replace(/\b(cannabis|dispensary|wellness|center|maryland|md)\b/g,' ').replace(/[^a-z0-9]+/g,' ').trim();
}
function mergePlaces(official,osm,center){
  const out=[];
  const add=p=>{
    const dup=out.find(x=>{
      const close=haversine({lat:x.lat,lon:x.lon},{lat:p.lat,lon:p.lon})<.16;
      const a=nameKey(x.name),b=nameKey(p.name);
      const nameMatch=a&&b&&(a===b||a.includes(b)||b.includes(a));
      const addressMatch=x.postal&&p.postal&&x.postal===p.postal&&nameMatch;
      return close||addressMatch;
    });
    if(!dup){out.push(p);return}
    if(p.source==='maryland-cannabis-administration'&&dup.source!=='maryland-cannabis-administration'){
      const i=out.indexOf(dup);
      out[i]={...dup,...p,website:p.website||dup.website,phone:p.phone||dup.phone,hours:p.hours||dup.hours,medical:p.medical||dup.medical,recreational:p.recreational||dup.recreational};
    }else{
      dup.website=dup.website||p.website;dup.phone=dup.phone||p.phone;dup.hours=dup.hours||p.hours;
      dup.medical=dup.medical||p.medical;dup.recreational=dup.recreational||p.recreational;
    }
  };
  official.forEach(add);osm.forEach(add);
  return out.map(p=>({...p,distance:haversine(center,{lat:p.lat,lon:p.lon})}))
    .sort((a,b)=>a.distance-b.distance).slice(0,60);
}
const cannabisLabel=(value,label)=>{
  if(!value)return label+': check store';
  if(value==='yes')return label+': yes';
  if(value==='only')return label+': only';
  if(value==='no')return label+': no';
  return label+': '+value;
};

function renderPlaces(places){
  lastPlaces=places;
  const product=(ui.product.value||'').trim();
  ui.summary.textContent=places.length?'Dispensaries near '+searchLabel:'No dispensaries found';
  ui.count.textContent=places.length+(places.length===1?' result':' results');
  if(!places.length){
    ui.cards.innerHTML='<div class="locator-empty"><strong>No dispensaries were returned in this radius.</strong><br>Try a larger radius or move the map and choose Search This Map Area.</div>';
    return;
  }
  ui.cards.innerHTML=places.map((p,i)=>{
    const website=p.website?'<a href="'+escapeHTML(p.website)+'" target="_blank" rel="noopener">Website ↗</a>':'';
    const phone=p.phone?'<a href="tel:'+escapeHTML(p.phone)+'">'+escapeHTML(p.phone)+'</a>':'';
    const hours=p.hours?'<span>Hours: '+escapeHTML(p.hours)+'</span>':'';
    const info=[phone,website,hours].filter(Boolean).join('<span aria-hidden="true"> • </span>');
    const official=p.source==='maryland-cannabis-administration';
    const sourceLink=p.sourceUrl?'<a class="btn small locator-source-link" href="'+escapeHTML(p.sourceUrl)+'" target="_blank" rel="noopener">'+(official?'Official listing ↗':'OpenStreetMap ↗')+'</a>':'';
    return '<article class="locator-card'+(official?' official':'')+'" data-place="'+i+'">'+
      '<div class="locator-card-top"><div><h4>'+escapeHTML(p.name)+'</h4><div class="locator-address">'+escapeHTML(p.address||p.location)+'</div></div>'+
      '<span class="locator-distance">'+p.distance.toFixed(1)+' mi</span></div>'+
      '<div class="locator-tags">'+
        '<span class="'+(official?'verified':'')+'">'+escapeHTML(sourceBadge(p))+'</span>'+
        '<span class="'+(p.medical==='yes'||p.medical==='only'?'yes':'')+'">'+escapeHTML(cannabisLabel(p.medical,'Medical'))+'</span>'+
        '<span class="'+(p.recreational==='yes'||p.recreational==='only'?'yes':'')+'">'+escapeHTML(cannabisLabel(p.recreational,'Adult-use'))+'</span>'+
      '</div>'+
      (info?'<div class="locator-info">'+info+'</div>':'')+
      (product?'<div class="locator-product-note"><strong>Looking for: '+escapeHTML(product)+'</strong><br>Live inventory can change quickly. Check the store menu or contact the dispensary before traveling.</div>':'')+
      '<div class="locator-card-actions">'+
        '<button class="btn small locator-show" type="button" data-show="'+i+'">Show on Map</button>'+
        '<button class="btn small locator-save" type="button" data-save="'+i+'">♡ Save to My Dispensaries</button>'+
        sourceLink+
      '</div></article>';
  }).join('');
}

async function runSearch(centerOverride=null,fromMap=false){
  setBusy(true,centerOverride?'Finding dispensaries in this area…':'Finding that area and nearby dispensaries…');
  try{
    const center=centerOverride||await geocodeArea();
    searchCenter=center;
    if(fromMap)searchLabel='this map area';
    const radiusMiles=Number(ui.radius.value||10);
    const [osmResult,catalogResult]=await Promise.allSettled([
      fetchOSMPlaces(center,milesToMeters(radiusMiles)),
      fetchOfficialCatalog(center,radiusMiles)
    ]);
    const osm=osmResult.status==='fulfilled'?normalizeOSMPlaces(osmResult.value,center):[];
    const official=catalogResult.status==='fulfilled'?catalogResult.value:[];
    const places=mergePlaces(official,osm,center);
    setMapCenter(center,places);
    renderPlaces(places);
    const officialCount=places.filter(p=>p.source==='maryland-cannabis-administration').length;
    setStatus(
      places.length
        ?'Found '+places.length+' location'+(places.length===1?'':'s')+' within about '+radiusMiles+' miles'+(officialCount?' including '+officialCount+' Maryland licensed location'+(officialCount===1?'':'s'):'')+'. Zoom, pan, click a marker, or save a dispensary.'
        :'No dispensaries were found within about '+radiusMiles+' miles. Try a larger radius or move the map.',
      places.length?'success':''
    );
  }catch(err){
    console.error(err);
    setStatus(escapeHTML(err.message||'The locator could not complete that search.'),'error');
    ui.summary.textContent='Search needs attention';
    ui.count.textContent='0 results';
    ui.cards.innerHTML='<div class="locator-empty">You can retry the Locator without refreshing the page.</div>';
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
    client_id:(p.source==='maryland-cannabis-administration'?'mca-':'osm-')+p.sourceId.replace(/[^a-zA-Z0-9_-]/g,'-'),
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
    source:p.source||'openstreetmap',
    source_id:p.sourceId,
    source_url:p.sourceUrl||null
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
      .select('id').eq('user_id',session.user.id).eq('source',payload.source).eq('source_id',p.sourceId).maybeSingle();
    if(findError)throw findError;
    let result;
    if(existing?.id)result=await sb.from('dispensaries').update(payload).eq('id',existing.id);
    else result=await sb.from('dispensaries').insert(payload);
    if(result.error)throw result.error;
    document.querySelectorAll('[data-save="'+CSS.escape(String(lastPlaces.indexOf(p)))+'"]').forEach(b=>{
      b.classList.add('saved');b.textContent='✓ Saved';
    });
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
function focusPlace(i){
  const p=lastPlaces[i];
  if(!p)return;
  const card=ui.cards.querySelector('[data-place="'+i+'"]');
  card?.scrollIntoView({behavior:'smooth',block:'nearest'});
  card?.classList.add('selected');
  setTimeout(()=>card?.classList.remove('selected'),1800);
}
function showPlaceOnMap(i){
  const p=lastPlaces[i];
  if(!p||!map)return;
  suppressMapMove=true;
  map.setView([p.lat,p.lon],16);
  const marker=markers.find(m=>m.__locatorIndex===i);
  marker?.openPopup();
  ui.mapShell.scrollIntoView({behavior:'smooth',block:'center'});
  setTimeout(()=>{suppressMapMove=false},350);
}

ui.locate.addEventListener('click',()=>runSearch());
ui.geo.addEventListener('click',useMyLocation);
ui.reset.addEventListener('click',()=>{
  ui.area.value='';ui.state.value='';ui.radius.value='10';ui.product.value='';
  searchCenter=null;lastPlaces=[];searchLabel='';lastMapSearchCenter=null;
  if(map){clearMarkers();suppressMapMove=true;map.setView([39.5,-98.35],4);setTimeout(()=>suppressMapMove=false,250)}
  if(ui.searchMap)ui.searchMap.classList.remove('show');
  ui.summary.textContent='Your nearby results';
  ui.count.textContent='0 results';
  ui.cards.innerHTML='<div class="locator-empty">Search by city/ZIP or use your location. Results will appear here without sending you away from Cannabis Basics.</div>';
  setStatus('');
});
if(ui.searchMap)ui.searchMap.addEventListener('click',()=>{
  if(!map)return;
  const c=map.getCenter();
  searchLabel='this map area';
  runSearch({lat:c.lat,lon:c.lng,display:'Map center'},true);
});
ui.area.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();runSearch()}});
ui.product.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();runSearch()}});
ui.cards.addEventListener('click',async e=>{
  const show=e.target.closest('[data-show]');
  if(show){showPlaceOnMap(Number(show.dataset.show));return}
  const save=e.target.closest('[data-save]');
  if(save){
    const p=lastPlaces[Number(save.dataset.save)];
    if(p)await savePlace(p,save);
  }
});
ui.mapShell.addEventListener('click',async e=>{
  const view=e.target.closest('[data-map-view]');
  if(view){focusPlace(Number(view.dataset.mapView));return}
  const save=e.target.closest('[data-map-save]');
  if(save){
    const p=lastPlaces[Number(save.dataset.mapSave)];
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
