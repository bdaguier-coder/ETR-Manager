import {COUNTRIES,country} from './data.js';
import {priority,parseGPS} from './core.js';
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
 const task=(async()=>{try{const res=await fetch('https://router.project-osrm.org/route/v1/driving/'+a.lng+','+a.lat+';'+b.lng+','+b.lat+'?overview=full&geometries=geojson&steps=false',{signal:AbortSignal.timeout(10000)});if(!res.ok)throw Error();const out=await res.json();if(out.code!=='Ok'||!out.routes?.[0])throw Error();return {points:out.routes[0].geometry.coordinates.map(([lng,lat])=>[lat,lng]),road:true};}catch{return {points:[[a.lat,a.lng],[b.lat,b.lng]],road:false}}})();routeCache.set(key,task);return task;
}
export class ControlMap{
 constructor(el,{selectCountry,openCase,onMessage}){
  this.selectCountry=selectCountry;this.openCase=openCase;this.message=onMessage;this.generation=0;
  if(!window.L){el.innerHTML='<div class="empty">Cartographie indisponible. Utilisez la liste des dossiers et les filtres pays.</div>';return}
  this.map=L.map(el,{zoomControl:false,preferCanvas:false,zoomAnimation:false,fadeAnimation:false}).setView([46,9],4);
  L.control.zoom({position:'bottomright'}).addTo(this.map);
  this.tiles=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Tiles © <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a> — Esri, HERE, Garmin, USGS, NGA · Frontières © Natural Earth'}).addTo(this.map);
  let failed=0;this.tiles.on('tileerror',()=>{if(++failed===3)this.message('Fond de carte indisponible : les repères et les listes restent utilisables.','error')});
  this.markers=L.layerGroup().addTo(this.map);this.lines=L.layerGroup().addTo(this.map);
  this.map.on('zoomend moveend',()=>{if(this.state)this.drawMarkers()});
  fetch('./data/countries.geojson').then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{
   if(this.destroyed)return;
   this.borders=L.geoJSON(data,{style:f=>this.borderStyle(f.properties.code),onEachFeature:(f,l)=>{
    l.on('add',()=>{const p=l.getElement();if(p){p.setAttribute('aria-label','Pays : '+country(f.properties.code)?.name);p.setAttribute('role','button');p.setAttribute('tabindex','0');p.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();this.selectCountry(f.properties.code)}})}});
    l.on('mouseover',()=>{l.setStyle({weight:2.2,color:'#3984ff',fillColor:'#5997ff',fillOpacity:.19});l.bringToFront();const rows=this.state?.cases.filter(d=>!d.archived&&d.country===f.properties.code)||[];const alerts=rows.filter(d=>['urgent','critical'].includes(priority(d,this.state.settings).key)).length;l.bindTooltip('<b>'+esc(country(f.properties.code)?.name)+'</b><br>'+rows.length+' dossiers actifs · '+alerts+' alertes',{sticky:true}).openTooltip()});
    l.on('mouseout',()=>this.borders.resetStyle(l));l.on('click',()=>this.selectCountry(f.properties.code));
   }}).addTo(this.map);this.borders.bringToBack();
  }).catch(()=>!this.destroyed&&this.message('Frontières indisponibles ; le sélecteur des 24 pays reste utilisable.','error'));
 }
 borderStyle(code){const selected=this.selectedCountry===code;return {color:selected?'#3278f5':'#6180a1',weight:selected?2:1,fillColor:'#6e9ecc',fillOpacity:selected?.12:.025}}
 focus(code){this.selectedCountry=code;this.borders?.setStyle(f=>this.borderStyle(f.properties.code));const c=country(code);if(c)this.map?.setView([c.cities[0][1],c.cities[0][2]],6);else this.map?.setView([46,9],4)}
 update(state,rows,mode,opts={}){this.state=state;this.rows=rows;this.mode=mode;this.opts=opts;this.generation++;this.lines?.clearLayers();this.drawMarkers();if(mode==='tvh'||mode==='flux')this.drawRoutes(this.generation)}
 drawMarkers(){if(!this.map)return;this.markers.clearLayers();let rows=this.rows||[];if(this.mode==='tvh')rows=rows.filter(d=>d.tvh!=='Non applicable'&&(this.opts.completed||d.tvh!=='Livré'));
  if(this.mode==='flux'){
   for(const c of COUNTRIES){const list=rows.filter(d=>d.country===c.code);if(!list.length)continue;const city=c.cities[0];L.marker([city[1],city[2]],{icon:L.divIcon({className:'',html:'<button class="flow-count" aria-label="'+esc(c.name)+' : '+list.length+' dossiers">'+list.length+'</button>',iconSize:[38,38]})}).on('click',()=>this.selectCountry(c.code)).addTo(this.markers)}return;
  }
  // Screen-space grouping adapts to zoom, while each case remains accessible in its cluster popup.
  const buckets=[];
  for(const d of rows){let p=this.mode==='tvh'?(d.tvh==='Livré'?d.destination:d.depot||d.location):d.location;if(this.mode==='tvh'&&d.tvh==='En cours'&&this.midpoints?.[d.id])p=this.midpoints[d.id];if(!hasPoint(p))continue;const pixel=this.map.latLngToLayerPoint([p.lat,p.lng]);const b=buckets.find(b=>pixel.distanceTo(b.pixel)<42);if(b)b.rows.push(d);else buckets.push({p,pixel,rows:[d]})}
  for(const b of buckets){const d=b.rows[0];const pri=priority(d,this.state.settings);const count=b.rows.length;const modeLabel=this.mode==='tvh'?(d.tvh==='En attente'?'EN ATTENTE':d.tvh==='Livré'?'LIVRÉ':'EN COURS · DÉMO'):'';
   const marker=L.marker([b.p.lat,b.p.lng],{icon:L.divIcon({className:'',html:'<button class="case-pin '+pri.key+'" aria-label="'+(count>1?count+' dossiers regroupés':'Ouvrir le dossier '+esc(d.id))+'">'+(count>1?'<span class="cluster-num">'+count+'</span> dossiers':esc(d.id))+(modeLabel&&count===1?'<small>'+modeLabel+'</small>':'')+'</button>',iconSize:[count>1?100:85,modeLabel?44:29],iconAnchor:[42,16]}),zIndexOffset:1000}).addTo(this.markers);
   if(count===1)marker.on('click',()=>this.openCase(d.id));else {const box=document.createElement('div');box.className='cluster-popup';b.rows.forEach(c=>{const btn=document.createElement('button');btn.textContent=c.id+' · '+c.tvh;btn.onclick=()=>this.openCase(c.id);box.append(btn)});marker.bindPopup(box)}
  }
 }
 async drawRoutes(generation){
  let rows=this.rows.filter(d=>d.tvh==='En cours'||(this.opts.completed&&d.tvh==='Livré'));if(this.mode==='flux')rows=this.rows.filter(d=>this.opts.flow==='people'?d.groups.some(g=>g.status.includes('En cours')):d.tvh==='En cours');
  this.midpoints={};let schematic=0,road=0;
  // Sequential requests deliberately keep public demo routing traffic low.
  for(const d of rows){if(generation!==this.generation)return;const a=d.depot||d.location,b=this.mode==='flux'&&this.opts.flow==='people'?d.beneficiaryDestination:d.destination;if(!hasPoint(a)||!hasPoint(b))continue;
   if(this.mode==='flux'){L.polyline([[a.lat,a.lng],[b.lat,b.lng]],{color:this.opts.flow==='people'?'#8a62d9':'#3679ed',weight:2,opacity:.55,dashArray:'6 8'}).bindTooltip(esc(d.id)+' · Flux schématique (pas un itinéraire)').addTo(this.lines);continue}
   const r=await routeFor(a,b);if(generation!==this.generation)return;if(!r)continue;r.road?road++:schematic++;
   const mid=r.road?r.points[Math.floor(r.points.length/2)]:[(a.lat+b.lat)/2,(a.lng+b.lng)/2];this.midpoints[d.id]={lat:mid[0],lng:mid[1]};
   L.polyline(r.points,{color:d.tvh==='Livré'?'#158967':'#347cf0',weight:d.tvh==='Livré'?2.5:3.5,opacity:d.tvh==='Livré'?.45:.8,dashArray:d.tvh==='Livré'?'':r.road?'7 9':'3 10'}).bindTooltip(esc(d.id)+' · '+(r.road?'Itinéraire routier OSRM':'Lien schématique — aucun trajet calculé')+' · '+(d.tvh==='En cours'?'position étiquette simulée':d.tvh)).on('click',()=>this.openCase(d.id)).addTo(this.lines);this.drawMarkers();this.message(road+' itinéraire(s) routier(s) · '+schematic+' lien(s) schématique(s) · étiquettes en cours simulées','route');
  }
 }
 destroy(){this.destroyed=true;this.generation++;this.map?.stop();this.map?.remove()}
}
