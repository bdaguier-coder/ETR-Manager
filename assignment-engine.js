import {effectiveTaskPriority} from './priority-signals.js?v=1.3.2';
// Assignment Engine — pure local rules. No DOM, network, AI or persistent state.
export const ENGINE_DEFAULTS = Object.freeze({
 weights:{normal:1,follow:2,urgent:5,critical:10}, nearDeadlineMinutes:60,
 nearDeadlinePenalty:3, overduePenalty:5, endingSoonMinutes:30,
 serviceBufferMinutes:10, endServicePenalty:12, shortfallPenaltyPerMinute:.1,
 preferredLanguagePenalty:4, continuityBonus:3, maxUrgent:6, maxCritical:3,
 maxWeightedLoad:80, blockOverload:true, blockInsufficientService:false,
 requireConfirmedPresence:false, allowOverrides:true, allowLanguageOverrides:true,
 unassignedAlertMinutes:30
});
const numericBounds={nearDeadlineMinutes:[1,1440],nearDeadlinePenalty:[0,100],overduePenalty:[0,100],endingSoonMinutes:[1,240],serviceBufferMinutes:[0,120],endServicePenalty:[0,100],shortfallPenaltyPerMinute:[0,10],preferredLanguagePenalty:[0,100],continuityBonus:[0,100],maxUrgent:[1,1000],maxCritical:[1,1000],maxWeightedLoad:[1,10000],unassignedAlertMinutes:[1,1440]};
export function engineConfig(input={}) {
 const cfg={...ENGINE_DEFAULTS,...input,weights:{...ENGINE_DEFAULTS.weights,...input.weights}};
 for(const k of Object.keys(ENGINE_DEFAULTS.weights))if(!Number.isFinite(cfg.weights[k])||cfg.weights[k]<.1||cfg.weights[k]>100)throw Error('Coefficient de priorité invalide : '+k);
 for(const [k,[min,max]] of Object.entries(numericBounds))if(!Number.isFinite(cfg[k])||cfg[k]<min||cfg[k]>max)throw Error('Paramètre du moteur invalide : '+k);
 for(const k of ['blockOverload','blockInsufficientService','requireConfirmedPresence','allowOverrides','allowLanguageOverrides'])if(typeof cfg[k]!=='boolean')throw Error('Règle du moteur invalide : '+k);
 return cfg;
}
const clock=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Paris',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
const day=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'});
const minute=v=>Number(v.split(':')[0])*60+Number(v.split(':')[1]);
function previousDay(date){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10)}
// Resolve civil shift boundaries in Paris, including DST and shifts starting the previous day.
export function parisInstant(date,time){let value=Date.parse(date+'T'+time+':00Z');for(let i=0;i<3;i++){const at=new Date(value);const seen=Date.parse(day.format(at)+'T'+clock.format(at)+':00Z');value+=Date.parse(date+'T'+time+':00Z')-seen}return value}
export function agentAvailability(agent,now,cfg=ENGINE_DEFAULTS){
 const at=new Date(now),date=day.format(at),n=minute(clock.format(at));
 const today=agent.schedule?.find(s=>s.date===date),yesterday=agent.schedule?.find(s=>s.date===previousDay(date));
 const sh=yesterday&&minute(yesterday.end)<minute(yesterday.start)&&n<minute(yesterday.end)?yesterday:today;
 const source=agent.planningSource||'demo',presence=agent.presence||{status:'unconfirmed'};
 const result=(status,label,extra={})=>({status,label,ok:status==='available'||status==='ending',source,confirmed:presence.status==='available',presenceNote:source==='import'?'Planning importé · présence non vérifiée':presence.status==='available'?'Présence déclarée dans la démonstration':'Planning simulé / saisi · présence non vérifiée',remainingMinutes:0,...extra});
 if(presence.status==='absent')return result('absent','Absent');
 if(presence.status==='pause')return result('pause','En pause');
 if(presence.status==='unavailable')return result('unavailable','Indisponible');
 if(!sh)return result('unknown','Planning non renseigné');
 if(sh.unavailable)return result('absent','Absent',{reason:sh.reason||'Repos / absence au planning'});
 const start=minute(sh.start),end=minute(sh.end),inside=end<start?(sh===yesterday?n<end:n>=start):n>=start&&n<end;
 if(!inside)return result('off','Hors service');
 let endDate=sh.date;if(end<start){const d=new Date(sh.date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);endDate=d.toISOString().slice(0,10)}
 const endAt=parisInstant(endDate,sh.end),remainingMinutes=Math.max(0,Math.floor((endAt-+at)/60000));
 const p=minute(sh.breakStart),q=minute(sh.breakEnd),inBreak=p!==q&&(q<p?n>=p||n<q:n>=p&&n<q);
 if(inBreak)return result('pause','En pause',{remainingMinutes,endAt,endTime:sh.end});
 return result(remainingMinutes<=cfg.endingSoonMinutes?'ending':'available',remainingMinutes<=cfg.endingSoonMinutes?'Fin de service imminente':'Disponible',{remainingMinutes,endAt,endTime:sh.end});
}
export function workloadIndex(state,config,now){
 const cfg=engineConfig(config),at=+new Date(now),cases=new Map(state.cases.map(d=>[d.id,d]));
 const loads=new Map(state.agents.map(a=>[a.id,{active:0,normal:0,follow:0,urgent:0,critical:0,weighted:0,near:0,overdue:0,caseIds:new Set()}]));
 for(const t of state.tasks||[]){const d=cases.get(t.caseId),l=loads.get(t.assignee);if(!l||!d||d.archived||t.status==='done')continue;
  const key=effectiveTaskPriority(t,d);l.active++;l[key]++;l.weighted+=cfg.weights[key];l.caseIds.add(t.caseId);
  if(t.due&&['urgent','critical'].includes(effectiveTaskPriority(t,d))){const left=(Date.parse(t.due)-at)/60000;if(left<0)l.overdue++;else if(left<=cfg.nearDeadlineMinutes)l.near++}
 }
 for(const l of loads.values())l.weighted=Math.round(l.weighted*100)/100;
 return loads;
}
const stable=(a,b)=>a<b?-1:a>b?1:0;
export function recommendAssignments(state,task,config,now){
 const cfg=engineConfig(config),loads=workloadIndex(state,cfg,now),d=state.cases.find(d=>d.id===task.caseId);
 // Ignore the task being reassigned, so its incumbent is compared on the same basis.
 const existing=(state.tasks||[]).find(t=>t.id===task.id);
 if(existing&&existing.status!=='done'&&existing.assignee&&d&&!d.archived){const l=loads.get(existing.assignee);if(l){const key=effectiveTaskPriority(existing,d);l.active--;l[key]--;l.weighted=Math.round((l.weighted-cfg.weights[key])*100)/100;if(existing.due&&['urgent','critical'].includes(effectiveTaskPriority(existing,d))){const left=(Date.parse(existing.due)-+new Date(now))/60000;if(left<0)l.overdue--;else if(left<=cfg.nearDeadlineMinutes)l.near--}}}
 const candidates=state.agents.map(agent=>{
  const availability=agentAvailability(agent,now,cfg),load=loads.get(agent.id),excluded=[],warnings=[];
  const missing=[...new Set(task.requiredLanguages||[])].filter(l=>!agent.languages.includes(l)),preferredMissing=[...new Set(task.preferredLanguages||[])].filter(l=>!agent.languages.includes(l));
  if(!availability.ok)excluded.push(availability.label+(availability.reason?' : '+availability.reason:''));
  if(cfg.requireConfirmedPresence&&!availability.confirmed)excluded.push('Présence non confirmée');
  if(missing.length)excluded.push('Langue obligatoire manquante : '+missing.join(', ').toUpperCase());
  const overloaded=load.urgent>=cfg.maxUrgent||load.critical>=cfg.maxCritical||load.weighted>=cfg.maxWeightedLoad;
  if(overloaded)(cfg.blockOverload?excluded:warnings).push('Surcharge prioritaire ou charge maximale atteinte');
  const shortfall=Math.max(0,(task.estimatedMinutes||30)+cfg.serviceBufferMinutes-availability.remainingMinutes);
  if(availability.ok&&shortfall>0)(cfg.blockInsufficientService?excluded:warnings).push('Fin de service : temps insuffisant pour la durée estimée et la marge');
  const penalties={deadlines:load.near*cfg.nearDeadlinePenalty+load.overdue*cfg.overduePenalty,service:availability.ok&&shortfall>0?cfg.endServicePenalty+shortfall*cfg.shortfallPenaltyPerMinute:0,languages:preferredMissing.length*cfg.preferredLanguagePenalty,continuity:d&&[d.initialAgent,d.agent,...(d.associates||[])].includes(agent.id)?cfg.continuityBonus:0};
  const rankingScore=Math.round((load.weighted+penalties.deadlines+penalties.service+penalties.languages-penalties.continuity)*100)/100;
  return {agent,availability,load:{...load,caseIds:[...load.caseIds]},missingLanguages:missing,requiredLanguages:[...new Set(task.requiredLanguages||[])],preferredMissing,excluded,warnings,eligible:!excluded.length,penalties,rankingScore};
 });
 const admissible=candidates.filter(c=>c.eligible).sort((a,b)=>a.rankingScore-b.rankingScore||stable(a.agent.id,b.agent.id));
 return {at:new Date(now).toISOString(),config:cfg,candidates,admissible,recommended:admissible.slice(0,3),excluded:candidates.filter(c=>!c.eligible),tieRule:'À indice égal : identifiant stable du chargé, par ordre alphabétique.'};
}
export function explanation(candidate,first=false){
 const {agent:a,availability:v,load:l,penalties:p}=candidate;
 if(!candidate.eligible)return a.name+' n’est pas admissible : '+candidate.excluded.join(' ; ')+'.';
 return (first?'Première proposition : ':'')+a.name+'. '+v.label+' selon le planning jusqu’à '+v.endTime+' ('+v.remainingMinutes+' min restantes). '+l.active+' tâches actives, dont '+l.urgent+' urgentes et '+l.critical+' critiques ; charge pondérée '+l.weighted+'. '+(candidate.requiredLanguages.length?'Langues obligatoires vérifiées. ':'Aucune langue obligatoire. ')+(p.deadlines?'Pénalité d’échéances prioritaires proches ou dépassées : +'+p.deadlines+'. ':'')+(p.service?'Temps de service insuffisant : +'+p.service+' au classement. ':'')+(p.languages?'Langue souhaitable manquante : +'+p.languages+'. ':'')+(p.continuity?'Continuité du dossier : −'+p.continuity+'. ':'')+'Indice de classement : '+candidate.rankingScore+'.';
}
