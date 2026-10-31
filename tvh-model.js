import {COUNTRIES,country} from './data.js?v=1.3.0';
export const TVH_DELIVERED_COLOR='#e96aa6';
// Operational viewport: Europe, Maghreb, Türkiye, Azores/Canaries and Svalbard.
export const OPERATIONAL_BOUNDS=[[26,-33],[81,46]];
export const OVERVIEW_CENTER=[47,10];
export const MIN_MAP_ZOOM=4.5;
const codes=new Set(COUNTRIES.map(c=>c.code));
const point=p=>p&&Number.isFinite(p.lat)&&Number.isFinite(p.lng);
const confirmed=p=>point(p)&&!!p.source&&!/catalogue|indicatif|non localisé/i.test(p.source);
export const withinOperationalArea=p=>point(p)&&p.lat>=26&&p.lat<=81&&p.lng>=-33&&p.lng<=46;
export function normaliseTVH(d){
 d.tvhOriginCountry??=d.depot?.country&&codes.has(d.depot.country)?d.depot.country:d.country;
 d.tvhOriginPrecision??=confirmed(d.depot)?'location':'country';
 d.tvhDestinationPrecision??=confirmed(d.destination)?'location':'country';
 d.tvhDestinationCountry='FR';if(d.tvhDestinationPrecision==='location'&&d.destination?.country&&d.destination.country!=='FR')d.tvhDestinationPrecision='country';
 return d;
}
export function validateTVH(d){
 normaliseTVH(d);
 if(!codes.has(d.tvhOriginCountry)||!codes.has(d.tvhDestinationCountry)||!['country','location'].includes(d.tvhOriginPrecision)||!['country','location'].includes(d.tvhDestinationPrecision))throw Error('Pays ou précision du TVH invalide.');
 for(const [precision,key,code,label] of [[d.tvhOriginPrecision,'depot',d.tvhOriginCountry,'départ'],[d.tvhDestinationPrecision,'destination',d.tvhDestinationCountry,'arrivée']])if(precision==='location'){
  if(!point(d[key]))throw Error('Le lieu de '+label+' n’est pas localisé. Choisissez le suivi au pays ou confirmez un lieu.');
  if(d[key].country&&d[key].country!==code)throw Error('Le lieu de '+label+' ne correspond pas au pays choisi.');
 }
 return d;
}
export function countryAnchor(code){const c=country(code);if(!c)return null;const city=c.cities[0];return {lat:city[1],lng:city[2],country:code,label:c.name+' · repère de pays',schematic:true,source:'Repère de pays schématique · aucune adresse ni position réelle'};}
export function tvhJourney(d){
 const from=d.tvhOriginCountry||d.country,to='FR';
 const origin=d.tvhOriginPrecision==='location'&&point(d.depot)?{...d.depot,schematic:false}:countryAnchor(from);
 const destination=d.tvhDestinationPrecision==='location'&&point(d.destination)&&(!d.destination.country||d.destination.country==='FR')?{...d.destination,schematic:false}:countryAnchor(to);
 return {origin,destination,originCountry:from,destinationCountry:to,schematic:!!(origin?.schematic||destination?.schematic)};
}
export function tvhMatchesCountry(d,code){if(d.tvh==='Non applicable')return false;const j=tvhJourney(d);return !code||j.originCountry===code||j.destinationCountry===code;}
export function schematicTVHPath(origin,destination){
 if(!point(origin)||!point(destination))return [];
 if(origin.lat===destination.lat&&origin.lng===destination.lng)return [];
 const bend=Math.min(3,Math.hypot(destination.lat-origin.lat,destination.lng-origin.lng)*.14),clat=(origin.lat+destination.lat)/2+bend,clng=(origin.lng+destination.lng)/2;
 return Array.from({length:25},(_,i)=>{const t=i/24,u=1-t;return [u*u*origin.lat+2*u*t*clat+t*t*destination.lat,u*u*origin.lng+2*u*t*clng+t*t*destination.lng]});
}
export function tvhDisplayPosition(d){const j=tvhJourney(d);if(d.tvh==='Livré')return j.destination;if(d.tvh!=='En cours')return j.origin;const points=schematicTVHPath(j.origin,j.destination);if(!points.length)return j.origin;const mid=points[Math.floor(points.length/2)];return {lat:mid[0],lng:mid[1],schematic:true,label:'Camion KSK · position illustrative, sans suivi GPS'};}
export function confirmTVHPlace(d,key,p){if(key==='destination'&&d.tvh!=='Non applicable'&&p.country&&p.country!=='FR')throw Error('L’arrivée d’un TVH est toujours en France. Choisissez un lieu français ou le repère au pays.');if(key==='location'&&d.tvhOriginPrecision==='country'&&d.tvhOriginCountry===d.country&&codes.has(p.country))d.tvhOriginCountry=p.country;d[key]=p;if(key==='depot'){d.tvhOriginPrecision=point(p)?'location':'country';if(codes.has(p.country))d.tvhOriginCountry=p.country}if(key==='destination'){d.tvhDestinationPrecision=point(p)?'location':'country';d.tvhDestinationCountry='FR'}}
