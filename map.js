import {TVH_DELIVERED_COLOR,OPERATIONAL_BOUNDS,OVERVIEW_CENTER,MIN_MAP_ZOOM,tvhJourney,tvhDisplayPosition,tvhMatchesCountry,schematicTVHPath} from './tvh-model.js?v=1.3.2';
import {COUNTRIES,country} from './data.js?v=1.3.2';
import {priority,parseGPS} from './core.js?v=1.3.2';
import {TRANSIT_COLOR,UNLOCATED_COLOR,isUnlocated,dossierPosition,PRIORITY_COLORS,MAX_DETAIL_MARKERS,MAX_VISIBLE_ROUTES,showCaseNumbers,groupProjectedPoints,pointInGeometry} from './map-model.js?v=1.3.2';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const hasPoint=p=>p&&Number.isFinite(p.lat)&&Number.isFinite(p.lng);
let lastSearch=0;
export async function searchPlace(q,code){
 const gps=parseGPS(q);if(gps)return [{...gps,country:code}];
 if(q.trim().length<3)throw Error('Saisissez au moins 3 caractères ou deux coordonnées GPS.');
 const local=COUNTRIES.filter(c=>!code||c.code===code).flatMap(c=>c.cities.filter(city=>city[0].toLowerCase().includes(q.toLowerCase())).map(city=>({label:city[0]+' — centre-ville, '+c.name,lat:city[1],lng:city[2],country:c.code,source:'Catalogue local · repère de ville indicatif'})));
 const elapsed=Date.now()-lastSearch;if(elapsed<1100)throw Error('Attendez une seconde avant une nouvelle recherche.');lastSearch=Date.now();
 try{
  const u=new URL('https://nominatim.openstreetmap.org/search');u.search=new URLSearchParams({q,format:'jsonv2',limit:'5',addressdetails:'1','accept-language':'fr',countrycodes:code?code.toLowerCase():COUNTRIES.map(c=>c.code.toLowerCase()).join(',')});
  const res=await fetch(u,{signal:AbortSignal.timeout(10000)});if(!res.ok)throw Error();const out=await res.json();
  const places=out.map(p=>({label:p.display_name,lat:+p.lat,lng:+p.lon,country:p.address?.country_code?.toUpperCase()||code,source:'OpenStreetMap / Nominatim'})).filter(hasPoint);
  if(!places.length&&!local.length)throw Error('Aucun résultat. Essayez une ville, une adresse plus complète ou des coordonnées GPS.');
  return [...places,...local].slice(0,7);
 }catch(e){if(local.length)return local.map(p=>({...p,source:p.source+' · service de recherche indisponible'}));throw Error('Recherche externe indisponible ou aucun résultat. Le lieu peut être enregistré comme non localisé ; des coordonnées GPS restent utilisables.');}
}
const routeCache=new Map();
export async function routeFor(a,b){
 if(!hasPoint(a)||!hasPoint(b))return null;
 const key=[a.lat,a.lng,b.lat,b.lng].join(',');if(routeCache.has(key))return routeCache.get(key);
 const task=(async()=>{try{const res=await fetch('https://router.project-osrm.org/route/v1/driving/'+a.lng+','+a.lat+';'+b.lng+','+b.lat+'?overview=full&geometries=geojson&steps=false',{signal:AbortSignal.timeout(10000)});if(!res.ok)throw Error();const out=await res.json();if(out.code!=='Ok'||!out.routes?.[0])throw Error();return {points:out.routes[0].geometry.coordinates.map(([lng,lat])=>[lat,lng]),road:true};}catch{return {points:[[a.lat,a.lng],[b.lat,b.lng]],road:false}}})();if(routeCache.size>=256)routeCache.delete(routeCache.keys().next().value);routeCache.set(key,task);return task;
}
let regionsPromise;
export function loadRegions(){
 if(!regionsPromise)regionsPromise=fetch('./data/regions.geojson').then(r=>{if(!r.ok)throw Error('Regions unavailable');return r.json()}).then(d=>d.features).catch(e=>{regionsPromise=null;throw e});
 return regionsPromise;
}
export const truckIcon='<svg class="ksk-truck" viewBox="0 0 64 37" aria-hidden="true"><g class="ksk-body"><rect x="3" y="4" width="37" height="23" rx="3" fill="#ffffff18" stroke="currentColor" stroke-width="1.6"/><path d="M40 13h10l10 10v7H40z" fill="#ffffff18" stroke="currentColor" stroke-width="1.6"/><path d="M45 15h4l6 7H45z" fill="currentColor" opacity=".65"/><text x="21.5" y="20" text-anchor="middle" fill="currentColor" font-family="system-ui,sans-serif" font-size="11" font-weight="850" letter-spacing="1">KSK</text><path d="M3 29h57" stroke="currentColor" stroke-width="1.7"/></g><g class="ksk-wheel" style="transform-origin:15px 30px"><circle cx="15" cy="30" r="5" fill="#392460" stroke="currentColor" stroke-width="1.6"/><path d="M12 30h6m-3-3v6" stroke="currentColor" stroke-width="1"/></g><g class="ksk-wheel" style="transform-origin:49px 30px"><circle cx="49" cy="30" r="5" fill="#392460" stroke="currentColor" stroke-width="1.6"/><path d="M46 30h6m-3-3v6" stroke="currentColor" stroke-width="1"/></g></svg>';
const truckMarkup=d=>truckIcon.replace('class="ksk-truck"','class="ksk-truck'+(tvhJourney(d).origin?.lng>tvhJourney(d).destination?.lng?' go-west':'')+'"');
export class ControlMap{
 constructor(el,{selectCountry,selectRegion,openCase,onMessage,onRegionsReady,onViewportInfo}){
  Object.assign(this,{el,selectCountry,selectRegion,openCase,message:onMessage,onRegionsReady,onViewportInfo,generation:0,midpoints:{},routeLines:new Map()});
  if(!window.L){el.innerHTML='<div class="empty">Cartographie indisponible. Utilisez la liste des dossiers et les filtres pays.</div>';return}
  this.map=L.map(el,{zoomControl:false,preferCanvas:false,zoomAnimation:false,fadeAnimation:false,minZoom:MIN_MAP_ZOOM,zoomSnap:.5,maxBounds:OPERATIONAL_BOUNDS,maxBoundsViscosity:1,worldCopyJump:false}).setView(OVERVIEW_CENTER,MIN_MAP_ZOOM);
  L.control.zoom({position:'bottomright'}).addTo(this.map);
  this.map.createPane('operational-mask').style.zIndex=350;
  L.polygon([[[-85,-180],[-85,180],[85,180],[85,-180]],[[26,-33],[81,-33],[81,46],[26,46]]],{pane:'operational-mask',className:'operational-mask',interactive:false,stroke:false,fillColor:'#0b1422',fillOpacity:1,fillRule:'evenodd'}).addTo(this.map);
  this.map.createPane('regions').style.zIndex=410;
  this.map.createPane('transport-routes').style.zIndex=430;
  this.map.createPane('overview-points').style.zIndex=620;
  this.dotRenderer=L.svg({pane:'overview-points',padding:.2});
  this.tiles=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,minZoom:MIN_MAP_ZOOM,noWrap:true,bounds:OPERATIONAL_BOUNDS,attribution:'Tiles © <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a> — Esri, HERE, Garmin, USGS, NGA · Frontières © Natural Earth'}).addTo(this.map);
  let failed=0;this.tiles.on('tileerror',()=>{if(++failed===3)this.message('Fond de carte indisponible : les repères et les listes restent utilisables.','error')});
  this.markers=L.layerGroup().addTo(this.map);this.lines=L.layerGroup().addTo(this.map);
  this.map.on('zoomend moveend',()=>{clearTimeout(this.redrawTimer);this.redrawTimer=setTimeout(()=>this.renderViewport(),80)});
  this.map.on('popupopen',()=>this.popupOpen=true);
  this.map.on('popupclose',()=>{this.popupOpen=false;if(this.redrawPending){this.redrawPending=false;this.drawMarkers()}});
  fetch('./data/countries.geojson').then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{
   if(this.destroyed)return;
   this.borders=L.geoJSON(data,{style:f=>this.borderStyle(f.properties.code),onEachFeature:(f,l)=>{
    this.accessiblePolygon(l,'Pays : '+country(f.properties.code)?.name,()=>this.selectCountry(f.properties.code));
    l.on('mouseover',()=>{l.setStyle({weight:2.2,color:'#3984ff',fillColor:'#5997ff',fillOpacity:.19});l.bringToFront();const rows=this.state?.cases.filter(d=>!d.archived&&(this.mode==='tvh'?tvhMatchesCountry(d,f.properties.code):d.country===f.properties.code))||[];const alerts=rows.filter(d=>['urgent','critical'].includes(priority(d,this.state.settings).key)).length;l.bindTooltip('<b>'+esc(country(f.properties.code)?.name)+'</b><br>'+rows.length+' dossiers actifs · '+alerts+' alertes',{sticky:true}).openTooltip()});
    l.on('mouseout',()=>this.borders.resetStyle(l));l.on('click',()=>this.selectCountry(f.properties.code));
   }}).addTo(this.map);this.borders.bringToBack();
  }).catch(()=>!this.destroyed&&this.message('Frontières indisponibles ; le sélecteur des 24 pays reste utilisable.','error'));
 }
 accessiblePolygon(layer,label,activate){layer.on('add',()=>{const p=layer.getElement();if(!p)return;p.setAttribute('aria-label',label);p.setAttribute('role','button');p.setAttribute('tabindex','0');p.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();activate()}})})}
 borderStyle(code){const selected=this.selectedCountry===code;return {color:selected?'#3278f5':'#6180a1',weight:selected?2:1,fillColor:'#6e9ecc',fillOpacity:selected?.10:.025}}
 focus(code,region=null){
  if(!this.map)return;this.selectedCountry=code;this.selectedRegion=this.mode==='tvh'?null:region;
  this.borders?.setStyle(f=>this.borderStyle(f.properties.code));
  if(this.mode==='tvh'&&code){const positions=[];for(const d of this.rows||[]){const j=tvhJourney(d);if(hasPoint(j.origin))positions.push([j.origin.lat,j.origin.lng]);if(hasPoint(j.destination)&&(d.tvh==='En cours'||this.opts.completed&&d.tvh==='Livré'))positions.push([j.destination.lat,j.destination.lng])}if(!positions.length)for(const city of country(code)?.cities||[])positions.push([city[1],city[2]]);if(positions.length)this.map.fitBounds(L.latLngBounds(positions).pad(.18),{padding:[50,50],maxZoom:7,animate:false})}
  else if(region)this.map.fitBounds(L.geoJSON(region).getBounds(),{padding:[35,35],maxZoom:10,animate:false});
  else {const c=country(code);if(c){const positions=c.cities.map(city=>[city[1],city[2]]);for(const d of this.rows||[]){const p=d.location;if(hasPoint(p)&&d.country===code&&Math.abs(p.lng-c.cities[0][2])<24&&Math.abs(p.lat-c.cities[0][1])<16)positions.push([p.lat,p.lng])}this.map.fitBounds(L.latLngBounds(positions).pad(.25),{padding:[45,45],maxZoom:7,animate:false})}else this.map.setView(OVERVIEW_CENTER,MIN_MAP_ZOOM)}
  this.ensureRegions(code);this.renderViewport();
 }
 async ensureRegions(code){
  this.regions?.remove();this.regions=null;
  if(!code||this.mode==='tvh')return;
  try{const all=await loadRegions();if(this.destroyed||code!==this.selectedCountry)return;
   const features=all.filter(f=>f.properties.country===code);this.regionFeatures=features;this.onRegionsReady?.(features);
   const base=f=>({pane:'regions',color:f.properties.id===this.selectedRegion?.properties.id?'#326fea':'#6686aa',weight:f.properties.id===this.selectedRegion?.properties.id?2.4:1,fillColor:'#5190f0',fillOpacity:f.properties.id===this.selectedRegion?.properties.id ? .10 : .015,bubblingMouseEvents:false});
   this.regions=L.geoJSON({type:'FeatureCollection',features},{pane:'regions',style:base,onEachFeature:(f,l)=>{
    this.accessiblePolygon(l,'Région : '+f.properties.name,()=>this.selectRegion?.(f));
    l.on('mouseover',()=>{l.setStyle({color:'#326fea',weight:2,fillOpacity:.15});const n=(this.state?.cases||[]).filter(d=>!d.archived&&d.country===code&&pointInGeometry(d.location,f.geometry,f.bbox)).length;l.bindTooltip('<b>'+esc(f.properties.name)+'</b><br>'+n+' dossiers · Cliquer pour voir les numéros',{sticky:true}).openTooltip()});
    l.on('mouseout',()=>l.setStyle(base(f)));l.on('click',e=>{L.DomEvent.stopPropagation(e);this.selectRegion?.(f)});
   }}).addTo(this.map);
  }catch{if(!this.destroyed)this.message('Limites régionales indisponibles ; le zoom et les filtres pays restent utilisables.','error')}
 }
 update(state,rows,mode,opts={}){
  this.state=state;this.rows=rows;this.mode=mode;this.opts=opts;this.selectedCountry=opts.country??this.selectedCountry??'';this.selectedRegion=opts.region||null;
  this.priorityCache=new Map(rows.map(d=>[d.id,priority(d,state.settings).key]));this.map?.closePopup();this.renderViewport();
 }
 positionFor(d){
  if(this.mode!=='tvh')return dossierPosition(d);
  const j=tvhJourney(d),key=[j.origin?.lat,j.origin?.lng,j.destination?.lat,j.destination?.lng,j.schematic].join(',');
  if(d.tvh==='En cours'&&this.midpoints[d.id]?.key===key)return this.midpoints[d.id];
  return tvhDisplayPosition(d);
 }
 renderViewport(){if(this.destroyed||!this.state||!this.map)return;this.drawMarkers();clearTimeout(this.routesTimer);const generation=++this.generation;this.routesTimer=setTimeout(()=>this.drawRoutes(generation),120)}
 drawMarkers(){
  if(!this.map||this.destroyed||!this.state)return;if(this.popupOpen){this.redrawPending=true;return}
  this.markers.clearLayers();let rows=this.rows||[];
  if(this.mode==='tvh')rows=rows.filter(d=>d.tvh!=='Non applicable'&&(this.opts.completed||d.tvh!=='Livré'));
  if(this.mode==='flux'){
   const counts=new Map();for(const d of rows)counts.set(d.country,(counts.get(d.country)||0)+1);
   for(const c of COUNTRIES){const n=counts.get(c.code);if(!n)continue;const city=c.cities[0];L.marker([city[1],city[2]],{icon:L.divIcon({className:'',html:'<span class="flow-count">'+n+'</span>',iconSize:[38,38]}),title:c.name+' : '+n+' dossiers'}).on('click',()=>this.selectCountry(c.code)).addTo(this.markers)}
   this.onViewportInfo?.('Concentrations par pays · liens de flux schématiques');return;
  }
  const zoom=this.map.getZoom(),detail=showCaseNumbers(zoom,{country:this.selectedCountry,region:this.selectedRegion}),bounds=this.map.getBounds().pad(.12),points=[];
  for(const d of rows){const p=this.positionFor(d);if(!hasPoint(p)||!bounds.contains([p.lat,p.lng]))continue;const pixel=this.map.project([p.lat,p.lng],zoom);points.push({d,unlocated:this.mode!=='tvh'&&isUnlocated(d),lat:p.lat,lng:p.lng,x:pixel.x,y:pixel.y,priority:this.priorityCache.get(d.id)||'normal'});}
  const buckets=this.mode==='tvh'?[...new Set(points.map(p=>p.d.tvh))].map(status=>points.filter(p=>p.d.tvh===status)):[points.filter(p=>!p.unlocated),...new Set(points.filter(p=>p.unlocated).map(p=>p.d.country))].map(bucket=>typeof bucket==='string'?points.filter(p=>p.unlocated&&p.d.country===bucket):bucket).filter(bucket=>bucket.length);const limit=Math.max(1,Math.floor((detail?MAX_DETAIL_MARKERS:350)/Math.max(1,buckets.length)));const groups=buckets.flatMap(bucket=>groupProjectedPoints(bucket,detail?{width:this.mode==='tvh'?170:110,height:this.mode==='tvh'?66:42,limit}:{width:26,height:26,limit}));
  this.el.dataset.markerMode=detail?'numbers':'points';this.el.dataset.visibleMarkers=String(groups.length);this.el.dataset.visibleCases=String(points.length);
  for(const g of groups){const d=g.top.d,unlocated=g.entries.every(p=>p.unlocated),allTransit=this.mode==='tvh'&&g.entries.every(p=>p.d.tvh==='En cours'),allDelivered=this.mode==='tvh'&&g.entries.every(p=>p.d.tvh==='Livré'),tone={fill:unlocated?UNLOCATED_COLOR:allTransit?TRANSIT_COLOR:allDelivered?TVH_DELIVERED_COLOR:PRIORITY_COLORS[g.top.priority],priority:PRIORITY_COLORS[g.top.priority]};
   if(!detail){const dot=L.circleMarker([g.lat,g.lng],{renderer:this.dotRenderer,className:'map-overview-dot '+(unlocated?'unlocated ':'')+'priority-'+this.priorityCache.get(d.id),radius:Math.min(14,6+Math.log2(g.count)*1.5),color:tone.priority,weight:2.5,fillColor:tone.fill,fillOpacity:.95,bubblingMouseEvents:false}).addTo(this.markers);dot.bindTooltip(g.count===1?'Dossier '+esc(d.id)+(unlocated?' · Position à préciser · repère de pays':allTransit?' · TVH en transit (démo)':''):g.count+' dossiers'+(unlocated?' · Position à préciser · '+country(d.country)?.name:'')+' · Cliquer pour agrandir');dot.on('click',()=>g.count===1?this.openCase(d.id):this.openGroup(g));if(g.count===1&&dot.getElement())dot.getElement().dataset.case=d.id;continue;}
   if(g.count>1){const marker=L.marker([g.lat,g.lng],{icon:L.divIcon({className:'map-group-marker',html:'<span class="case-group '+(unlocated?'unlocated':allTransit?'tvh-transit-group':allDelivered?'tvh-delivered-group':'')+'" style="--group-color:'+tone.fill+';--pin-priority:'+tone.priority+'">'+(allTransit?truckMarkup(d):'')+'<span>'+g.count+' '+(unlocated?'À LOCALISER':allDelivered?'LIVRÉS':allTransit?'TVH EN COURS':'dossiers')+'</span></span>',iconSize:[allTransit?175:110,allTransit?54:34],iconAnchor:[allTransit?87:55,allTransit?-5:unlocated||allDelivered?60:17]}),title:g.count+' dossiers regroupés'}).on('click',()=>this.openGroup(g)).addTo(this.markers);marker.getElement()?.setAttribute('aria-label',g.count+' dossiers regroupés');continue;}
   const transit=this.mode==='tvh'&&d.tvh==='En cours',label=this.mode==='tvh'?(transit?'EN COURS · ILLUSTRATION':d.tvh==='En attente'?'EN ATTENTE':'LIVRÉ · '+(country(tvhJourney(d).destinationCountry)?.name||'')):unlocated?'POSITION À PRÉCISER':'';
   const html='<span class="case-pin '+g.top.priority+(unlocated?' unlocated':'')+(transit?' tvh-transit':this.mode==='tvh'&&d.tvh==='Livré'?' tvh-delivered':'')+'" style="--pin-priority:'+tone.priority+'">'+(transit?truckMarkup(d):'')+'<b class="pin-number">'+esc(d.id)+'</b>'+(label?'<small>'+label+'</small>':'')+'</span>';
   const m=L.marker([g.lat,g.lng],{icon:L.divIcon({className:'map-case-marker',html,iconSize:[transit?180:125,label?56:30],iconAnchor:[transit?90:62,transit?-5:unlocated?60:this.mode==='tvh'&&d.tvh==='Livré'?70:20]}),title:'Ouvrir le dossier '+d.id,zIndexOffset:1000}).on('click',()=>this.openCase(d.id)).addTo(this.markers);m.getElement()?.setAttribute('aria-label','Ouvrir le dossier '+d.id);if(m.getElement())m.getElement().dataset.case=d.id;m.bindTooltip(unlocated?'Position à préciser · '+esc(country(d.country)?.name)+' · repère de pays, aucune adresse réelle':transit?'Camion KSK · position illustrative, aucun suivi GPS · bordure : priorité du dossier':esc(d.id));
  }
  this.onViewportInfo?.(detail?points.length+' dossiers visibles · '+groups.length+' repères · groupes cliquables':'Vue large : points regroupés · zoomez ou sélectionnez un pays / une région pour voir les numéros');
 }
 openGroup(g){
  const spread=Math.max(g.maxLat-g.minLat,g.maxLng-g.minLng);
  if(spread>.005&&this.map.getZoom()<17){this.map.fitBounds([[g.minLat,g.minLng],[g.maxLat,g.maxLng]],{padding:[55,55],maxZoom:this.map.getZoom()+3,animate:false});return}
  // Same-garage cases stay at their true shared anchor; only a small page of IDs is rendered.
  const box=document.createElement('div');box.className='cluster-popup';let page=0;const list=[...g.entries].sort((a,b)=>String(a.d.id).localeCompare(String(b.d.id)));
  const paint=()=>{box.replaceChildren();const title=document.createElement('b');title.textContent=g.count+(g.entries.every(p=>p.unlocated)?' dossiers à localiser · '+country(g.top.d.country)?.name:' dossiers au même repère');box.append(title);for(const {d} of list.slice(page*10,page*10+10)){const b=document.createElement('button');b.textContent=d.id+(this.mode==='tvh'?' · '+d.tvh:'');b.dataset.case=d.id;b.onclick=()=>this.openCase(d.id);box.append(b)}if(list.length>10){const controls=document.createElement('div');controls.className='cluster-pager';const prev=document.createElement('button'),next=document.createElement('button');prev.textContent='←';next.textContent='→';prev.setAttribute('aria-label','Dossiers précédents');next.setAttribute('aria-label','Dossiers suivants');prev.disabled=page===0;next.disabled=(page+1)*10>=list.length;prev.onclick=()=>{page--;paint()};next.onclick=()=>{page++;paint()};const label=document.createElement('small');label.textContent=(page+1)+' / '+Math.ceil(list.length/10);controls.append(prev,label,next);box.append(controls)}};paint();L.popup({maxWidth:280,minWidth:180}).setLatLng([g.lat,g.lng]).setContent(box).openOn(this.map);
 }
 async drawRoutes(generation){
  if(this.destroyed||!this.state||!this.map)return;this.lines.clearLayers();this.routeLines.clear();
  if(!['tvh','flux'].includes(this.mode))return;
  if(!showCaseNumbers(this.map.getZoom(),{country:this.selectedCountry,region:this.selectedRegion})){this.message('Vue large : points regroupés. Sélectionnez un pays ou zoomez pour afficher les liaisons TVH.','route');return}
  const viewport=this.map.getBounds().pad(.15);let rows=this.rows.filter(d=>d.tvh==='En cours'||this.opts.completed&&d.tvh==='Livré');
  if(this.mode==='flux')rows=this.rows.filter(d=>this.opts.flow==='people'?d.groups.some(g=>g.status.toLowerCase().includes('en cours')):d.tvh==='En cours');
  const buckets=new Map();
  for(const d of rows){const j=this.mode==='flux'&&this.opts.flow==='people'?{origin:d.location,destination:d.beneficiaryDestination,schematic:true}:tvhJourney(d),a=j.origin,b=j.destination;if(!hasPoint(a)||!hasPoint(b)||!L.latLngBounds([[a.lat,a.lng],[b.lat,b.lng]]).intersects(viewport))continue;const key=[a.lat,a.lng,b.lat,b.lng,j.schematic,d.tvh].join(',');if(!buckets.has(key))buckets.set(key,{...j,key,cases:[]});buckets.get(key).cases.push(d)}
  const journeys=[...buckets.values()].sort((a,b)=>Math.min(...a.cases.map(d=>({critical:0,urgent:1,follow:2,normal:3}[this.priorityCache.get(d.id)]??3)))-Math.min(...b.cases.map(d=>({critical:0,urgent:1,follow:2,normal:3}[this.priorityCache.get(d.id)]??3))));
  const total=journeys.length,visible=journeys.slice(0,MAX_VISIBLE_ROUTES);let road=0,schematic=0,sameCountry=0;
  for(const j of visible){if(this.destroyed||generation!==this.generation)return;const a=j.origin,b=j.destination,d=j.cases[0];
   const points=schematicTVHPath(a,b);if(!points.length){sameCountry+=j.cases.length;continue}
   const r=this.mode==='flux'||j.schematic?{points,road:false}:await routeFor(a,b);if(this.destroyed||generation!==this.generation)return;if(!r)continue;r.road?road++:schematic++;
   const mid=r.points[Math.floor(r.points.length/2)];for(const item of j.cases)this.midpoints[item.id]={lat:mid[0],lng:mid[1],key:[a.lat,a.lng,b.lat,b.lng,j.schematic].join(',')};
   const transit=d.tvh==='En cours',color=this.mode==='flux'?(this.opts.flow==='people'?'#8a62d9':'#3679ed'):transit?TRANSIT_COLOR:TVH_DELIVERED_COLOR;
   const line=L.polyline(r.points,{pane:'transport-routes',className:'tvh-route '+(this.mode==='tvh'?(transit?'tvh-route-active':'tvh-route-delivered'):'tvh-flux')+(r.road?'':' tvh-route-schematic'),color,weight:transit?3.5:2.5,opacity:transit?.85:.55,dashArray:transit?'8 8':this.mode==='flux'?'6 8':null}).bindTooltip(j.cases.length+' TVH · '+(r.road?'Parcours entre les lieux renseignés':'Liaison schématique, aucun itinéraire ni position réelle')+' · '+(transit?'En cours':'Livré')).on('click',()=>{if(j.cases.length===1)this.openCase(d.id);else{const entries=j.cases.map(item=>({d:item,lat:mid[0],lng:mid[1],x:0,y:0,priority:this.priorityCache.get(item.id)}));this.openGroup(groupProjectedPoints(entries)[0])}}).addTo(this.lines);
   for(const item of j.cases)this.routeLines.set(item.id,line);this.drawMarkers();
  }
  this.message(this.mode==='flux'?visible.length+' flux schématiques visibles':road+' parcours entre lieux renseignés · '+schematic+' liaison(s) schématique(s) entre pays'+(sameCountry?' · '+sameCountry+' TVH au sein du même pays':'')+(total>MAX_VISIBLE_ROUTES?' · '+MAX_VISIBLE_ROUTES+' / '+total+' liaisons : affinez la zone':'')+' · Camions KSK illustratifs, aucun suivi GPS.','route');
 }
 destroy(){this.destroyed=true;this.generation++;clearTimeout(this.redrawTimer);clearTimeout(this.routesTimer);this.map?.stop();this.map?.remove()}
}
