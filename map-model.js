import {TVH_DELIVERED_COLOR} from './tvh-model.js?v=1.3.0';
// Pure, testable geometry and display rules. No Leaflet, DOM or network dependency.
export const TRANSIT_COLOR='#8554d8';
export const PRIORITY_COLORS={normal:'#158967',follow:'#db9019',urgent:'#e15158',critical:'#20293d'};
export const PRIORITY_RANK={critical:0,urgent:1,follow:2,normal:3};
export const MAX_DETAIL_MARKERS=160;
export const MAX_VISIBLE_ROUTES=24;
export function showCaseNumbers(zoom,{country='',region=null}={}){return zoom>=8||Boolean(country||region)&&zoom>=4;}
export function markerTone(d,key,mode){return {fill:mode==='tvh'&&d.tvh==='En cours'?TRANSIT_COLOR:mode==='tvh'&&d.tvh==='Livré'?TVH_DELIVERED_COLOR:PRIORITY_COLORS[key],priority:PRIORITY_COLORS[key],transit:mode==='tvh'&&d.tvh==='En cours'};}
export function groupProjectedPoints(points,{width=30,height=30,limit=Infinity}={}){
 let groups;let attempts=0;
 do {const cells=new Map();for(const p of points){const key=Math.floor(p.x/width)+':'+Math.floor(p.y/height);let g=cells.get(key);if(!g){g={entries:[],sumLat:0,sumLng:0,minLat:p.lat,maxLat:p.lat,minLng:p.lng,maxLng:p.lng,key};cells.set(key,g)}g.entries.push(p);g.sumLat+=p.lat;g.sumLng+=p.lng;g.minLat=Math.min(g.minLat,p.lat);g.maxLat=Math.max(g.maxLat,p.lat);g.minLng=Math.min(g.minLng,p.lng);g.maxLng=Math.max(g.maxLng,p.lng)}groups=[...cells.values()];width*=1.4;height*=1.4;}while(groups.length>limit&&++attempts<32);
 return groups.map(g=>{const count=g.entries.length;let top=g.entries[0];for(const p of g.entries)if(PRIORITY_RANK[p.priority]<PRIORITY_RANK[top.priority])top=p;return {...g,count,lat:g.sumLat/count,lng:g.sumLng/count,top};});
}
function inRing(x,y,ring){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];const cross=(b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]);if(Math.abs(cross)<1e-10&&x>=Math.min(a[0],b[0])-1e-10&&x<=Math.max(a[0],b[0])+1e-10&&y>=Math.min(a[1],b[1])-1e-10&&y<=Math.max(a[1],b[1])+1e-10)return true;if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
export function pointInGeometry(point,geometry,bbox){if(!point||!Number.isFinite(point.lat)||!Number.isFinite(point.lng)||!geometry)return false;const x=point.lng,y=point.lat;if(bbox&&(x<bbox[0]||y<bbox[1]||x>bbox[2]||y>bbox[3]))return false;const polys=geometry.type==='Polygon'?[geometry.coordinates]:geometry.type==='MultiPolygon'?geometry.coordinates:[];return polys.some(rings=>rings.length&&inRing(x,y,rings[0])&&!rings.slice(1).some(hole=>inRing(x,y,hole)));}
export function regionContains(d,region){return !region||d.country===region.properties.country&&pointInGeometry(d.location,region.geometry,region.bbox);}
