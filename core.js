import {validateAssignmentData} from './task-model.js?v=1.2.0';
import {regionContains} from './map-model.js?v=1.2.0';
import {COUNTRIES,STAGES,BENEFITS,TVH,PRIORITIES,LANGUAGES,parisDate} from './data.js?v=1.2.0';
export const normalizeId=v=>String(v??'').normalize('NFKC').toUpperCase().replace(/[\s./_-]+/g,'');
export const validId=v=>/^[A-Z0-9]{3,24}$/.test(normalizeId(v));
export const active=s=>s.cases.filter(d=>!d.archived);
export const people=d=>d.groups.reduce((n,g)=>n+g.men+g.women+g.children,0);
export const waiting=d=>d.groups.some(g=>['Sur place','En attente de solution'].includes(g.status));
export const assigneeIds=d=>[...new Set([d.initialAgent,d.agent,...(d.associates||[])].filter(Boolean))];
export const hasAssignee=(d,id)=>assigneeIds(d).includes(id);
export const ready=d=>['Réparé','TVH livré'].includes(d.stage)&&['Non applicable','Livré'].includes(d.tvh)&&d.groups.every(g=>g.status===BENEFITS[5]);
export function priority(d,settings,now=new Date()){
 if(d.archived)return {key:'normal',reason:'Dossier archivé'};
 if(d.priorityMode==='manual')return {key:d.priority,reason:d.priorityReason||'Priorité manuelle'};
 if(waiting(d))return {key:'urgent',reason:'Bénéficiaires sur place ou en attente de solution'};
 if((+now-Date.parse(d.updated))/3600000>=settings.staleHours)return {key:'follow',reason:'Statuts sans mise à jour depuis '+settings.staleHours+' h'};
 return {key:'normal',reason:'Suivi conforme aux statuts actuels'};
}

export function filtered(s,f,archived=false,now=new Date()){
 return s.cases.filter(d=>d.archived===archived&&(!f.country||d.country===f.country)&&regionContains(d,f.region)&&(!f.agent||(f.agent==='none'?!assigneeIds(d).length:hasAssignee(d,f.agent)))&&(!f.priority||priority(d,s.settings,now).key===f.priority)&&(!f.stage||d.stage===f.stage)&&(!f.type||d.type===f.type)&&(!f.from||(archived?d.closed:d.opened).slice(0,10)>=f.from)&&(!f.to||(archived?d.closed:d.opened).slice(0,10)<=f.to)&&(!f.q||[d.id,d.location?.label,d.stage,d.tvh,d.notes].join(' ').toLowerCase().includes(f.q.toLowerCase())));
}
export function record(d,text,now=new Date()){d.updated=now.toISOString();d.history.push({at:d.updated,text});}
const mins=t=>{const [h,m]=t.split(':').map(Number);return h*60+m};
export function availability(agent,now=new Date()){
 const date=parisDate(now),time=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Paris',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now),n=mins(time);
 const prev=new Date(now);prev.setUTCDate(prev.getUTCDate()-1); const prevDate=parisDate(prev);
 const sh=agent.schedule.find(s=>s.date===date),before=agent.schedule.find(s=>s.date===prevDate);
 // The shift date is its start date; overnight shifts belong to the previous day after midnight.
 const applicable=before&&mins(before.end)<mins(before.start)&&n<mins(before.end)?before:sh;
 if(!applicable)return {ok:false,label:'Planning non renseigné'};
 if(applicable.unavailable)return {ok:false,label:applicable.reason||'Absent'};
 const a=mins(applicable.start),b=mins(applicable.end),inside=b<a?(applicable===before?n<b:n>=a):n>=a&&n<b;
 if(!inside)return {ok:false,label:'Hors service'};
 const p=mins(applicable.breakStart),q=mins(applicable.breakEnd),inBreak=p===q?false:q<p?(n>=p||n<q):n>=p&&n<q;
 return inBreak?{ok:false,label:'En pause'}:{ok:true,label:'Disponible'};
}
export function assignmentWarnings(s,d,a,now=new Date()){
 const warnings=[];const av=availability(a,now);if(!av.ok)warnings.push(av.label);
 const load=active(s).filter(x=>hasAssignee(x,a.id)&&x.id!==d.id).length;if(load>=a.capacity)warnings.push('Capacité indicative atteinte : '+load+' / '+a.capacity);
 if(d.language&&!a.languages.includes(d.language))warnings.push('Langue requise non attribuée : '+LANGUAGES[d.language]);

 return [...new Set(warnings)];
}
export function setAssignees(s,d,ids,now=new Date()){
 const initial=d.initialAgent||d.agent||'';const unique=[...new Set([initial,...ids].filter(Boolean))];const agents=unique.map(id=>s.agents.find(a=>a.id===id));if(agents.some(a=>!a))throw Error('Chargé inconnu');
 const previous=assigneeIds(d);const warnings=[...new Set(agents.filter(a=>!previous.includes(a.id)).flatMap(a=>assignmentWarnings(s,d,a,now).map(w=>a.name+' : '+w)))];
 d.agent=unique[0]||'';d.initialAgent=initial||d.agent;d.associates=unique.slice(1);
 if(previous.join('|')!==unique.join('|'))record(d,'Affectations : '+(agents.map(a=>a.name).join(', ')||'Non affecté')+(warnings.length?' · Informations : '+warnings.join(' ; '):''),now);
 return warnings;
}
export function assign(s,d,agentId,now=new Date()){return setAssignees(s,d,agentId?[agentId]:[],now)}
export function addAssignee(s,d,agentId,now=new Date()){return setAssignees(s,d,[...assigneeIds(d),agentId],now)}
export function removeAssignee(s,d,agentId,now=new Date()){if(agentId===(d.initialAgent||d.agent))throw Error('Le responsable initial est conservé. Réaffectez une tâche ou ajoutez un chargé complémentaire.');if(s.tasks?.some(t=>t.caseId===d.id&&t.assignee===agentId&&t.status!=='done'))throw Error('Réaffectez les tâches actives avant de retirer ce chargé.');return setAssignees(s,d,assigneeIds(d).filter(id=>id!==agentId),now)}
export function moveStage(d,stage,now=new Date()){
 if(!STAGES.includes(stage))throw Error('Statut du véhicule inconnu');
 const prev=d.stage;d.stage=stage;
 if(stage==='TVH en cours')d.tvh='En cours';else if(stage==='TVH livré')d.tvh='Livré';else if(['En cours','Livré'].includes(d.tvh))d.tvh='En attente';
 if(prev!==stage)record(d,'Statut véhicule : '+prev+' → '+stage,now);
}
export function archive(d,now=new Date()){
 if(!ready(d))throw Error('Archivage impossible : le véhicule et tous les groupes de bénéficiaires doivent avoir terminé leur parcours.');
 d.archived=true;d.closed=now.toISOString();record(d,'Clôture et archivage du dossier',now);
}
export function reopen(d,now=new Date()){d.archived=false;d.closed=null;d.stage='Ouverture';record(d,'Réouverture du dossier',now)}
export function createCase(s,input,now=new Date()){
 const id=normalizeId(input.id);if(!validId(id))throw Error('Identifiant attendu : 3 à 24 lettres ou chiffres.');
 if(s.cases.some(d=>normalizeId(d.id)===id))throw Error('Ce dossier est déjà enregistré.');
 if(!COUNTRIES.some(c=>c.code===input.country))throw Error('Choisissez un pays couvert.');
 const d={id,country:input.country,type:input.type||'Panne',opened:now.toISOString(),updated:now.toISOString(),location:null,depot:null,destination:null,beneficiaryDestination:null,groups:[{id:'g1',name:'Groupe principal',men:1,women:0,children:0,vulnerable:0,animals:0,status:BENEFITS[0]}],stage:STAGES[0],tvh:TVH[0],priority:'normal',priorityMode:'auto',priorityReason:'',agent:'',associates:[],language:COUNTRIES.find(c=>c.code===input.country).languages[0],notes:'',archived:false,closed:null,history:[]};
 record(d,'Création rapide du dossier',now);s.cases.push(d);return d;
}
export function validLocation(v){return v===null||Boolean(v&&typeof v.label==='string'&&v.label.length<1000&&(v.lat===null&&v.lng===null||Number.isFinite(v.lat)&&Math.abs(v.lat)<=90&&Number.isFinite(v.lng)&&Math.abs(v.lng)<=180));}
export function validateState(s){
 if(!s||s.version!==1||!Array.isArray(s.cases)||!Array.isArray(s.agents)||s.cases.length>5000||s.agents.length>500)throw Error('Format JSON Manager Control v1 attendu (5 000 dossiers maximum).');
 if(!s.settings||!Number.isFinite(s.settings.staleHours)||s.settings.staleHours<1||s.settings.staleHours>8760)throw Error('Règles de priorité invalides.');
 s.settings={staleHours:s.settings.staleHours};
 const ids=new Set(),agentIds=new Set();
 const times=t=>typeof t==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(t);
 for(const a of s.agents){if(!a.id||agentIds.has(a.id)||typeof a.name!=='string'||typeof a.service!=='string'||!Array.isArray(a.languages)||!a.languages.every(l=>l in LANGUAGES)||!Number.isFinite(a.capacity)||a.capacity<1||!Array.isArray(a.schedule))throw Error('Collaborateur invalide.');agentIds.add(a.id);
 const dates=new Set();for(const sh of a.schedule){if(!/^\d{4}-\d{2}-\d{2}$/.test(sh.date)||dates.has(sh.date)||!['start','end','breakStart','breakEnd'].every(k=>times(sh[k]))||sh.start===sh.end||typeof sh.unavailable!=='boolean')throw Error('Planning invalide ou date en doublon.');dates.add(sh.date)} }
 for(const d of s.cases){delete d.action;delete d.due;delete d.actionOwner;const legacy={'Prise en charge':'Ouverture','Intervention':'Diagnostic','Dépôt':'Au dépôt','Réparation':'Réparations en cours','Transport':'TVH en cours','Relivraison':d.tvh==='Livré'?'TVH livré':'Réparé','Résolution':d.tvh==='Livré'?'TVH livré':'Réparé'};if(legacy[d.stage])d.stage=legacy[d.stage];if(d.stage==='TVH en cours')d.tvh='En cours';if(d.stage==='TVH livré')d.tvh='Livré';const id=normalizeId(d.id);if(!validId(id)||ids.has(id))throw Error('Identifiant invalide ou dossier en doublon : '+id);ids.add(id);d.id=id;
 if(!COUNTRIES.some(c=>c.code===d.country)||!STAGES.includes(d.stage)||!TVH.includes(d.tvh)||!(d.priority in PRIORITIES)||!['auto','manual'].includes(d.priorityMode)||!['Panne','Accident'].includes(d.type)||!Number.isFinite(Date.parse(d.opened))||!Number.isFinite(Date.parse(d.updated))||typeof d.archived!=='boolean'||typeof d.notes!=='string'||!Array.isArray(d.associates)||![d.agent,...d.associates].every(id=>!id||agentIds.has(id))||!(d.language in LANGUAGES)||!['location','depot','destination','beneficiaryDestination'].every(k=>validLocation(d[k]))||!Array.isArray(d.groups)||!d.groups.length||!d.groups.every(g=>typeof g.name==='string'&&BENEFITS.includes(g.status)&&['men','women','children','vulnerable','animals'].every(k=>Number.isInteger(g[k])&&g[k]>=0&&g[k]<=1000)&&g.vulnerable<=g.men+g.women+g.children)||!Array.isArray(d.history)||!d.history.every(h=>typeof h.text==='string'&&Number.isFinite(Date.parse(h.at)))||d.archived&&!Number.isFinite(Date.parse(d.closed)))throw Error('Données invalides dans le dossier '+id);
 } validateAssignmentData(s);return s;
}
export function parseGPS(text){const m=text.trim().match(/^(-?\d{1,2}(?:\.\d+)?)\s*[,;]\s*(-?\d{1,3}(?:\.\d+)?)$/);if(!m)return null;const lat=+m[1],lng=+m[2];return Math.abs(lat)<=90&&Math.abs(lng)<=180?{lat,lng,label:lat+', '+lng,source:'Coordonnées saisies'}:null}
