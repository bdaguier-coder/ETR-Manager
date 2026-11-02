import {engineConfig,recommendAssignments} from './assignment-engine.js?v=1.3.2';
import {LANGUAGES,parisDate,WAITING_BENEFITS} from './data.js?v=1.3.2';
const priorities=['normal','follow','urgent','critical'];
const history=(d,text,now)=>{d.updated=new Date(now).toISOString();d.history.push({at:d.updated,text})};
export function ensureAssignmentData(s){
 s.engine=engineConfig(s.engine||{});s.taskCounter=s.taskCounter||0;s.engineHistory??=[];
 for(const a of s.agents){a.planningSource??='demo';a.presence??={status:'unconfirmed'}}
 const legacy=!Array.isArray(s.tasks);if(legacy)s.tasks=[];
 const represented=new Set(s.tasks.map(t=>t.caseId));
 for(const d of s.cases){d.initialAgent??=d.agent||'';if(d.initialAgent){d.associates=[...new Set([d.agent,...(d.associates||[])].filter(x=>x&&x!==d.initialAgent))];d.agent=d.initialAgent}
  if(!represented.has(d.id)){const p=d.priorityMode==='manual'?d.priority:d.groups.some(g=>WAITING_BENEFITS.includes(g.status))?'urgent':(Date.parse(s.created||d.updated)-Date.parse(d.updated))/3600000>=(s.settings?.staleHours||24)?'follow':'normal';
   let id;do{id='T'+String(++s.taskCounter).padStart(6,'0')}while(s.tasks.some(t=>t.id===id));
   s.tasks.push({id,caseId:d.id,title:'Suivi ETR',priority:p,status:d.archived?'done':'todo',assignee:d.agent||'',requiredLanguages:d.language?[d.language]:[],preferredLanguages:[],estimatedMinutes:30,due:null,created:d.opened,completedAt:d.archived?d.closed:null,source:'etr',history:[{at:d.opened,text:legacy?'Suivi initial issu du dossier de démonstration':'Suivi du nouveau dossier'}]});
  }
 }
 return s;
}
export function validateAssignmentData(s){
 ensureAssignmentData(s);const ids=new Set(),cases=new Map(s.cases.map(d=>[d.id,d])),agents=new Set(s.agents.map(a=>a.id));
 if(!Array.isArray(s.engineHistory)||!s.engineHistory.every(e=>typeof e.text==='string'&&Number.isFinite(Date.parse(e.at))))throw Error('Historique du moteur invalide.');
 if(s.tasks.length>50000||!Number.isInteger(s.taskCounter)||s.taskCounter<0)throw Error('Trop de tâches ou compteur invalide.');
 for(const a of s.agents)if(!['demo','manual','import'].includes(a.planningSource)||!['unconfirmed','available','absent','pause','unavailable'].includes(a.presence.status))throw Error('Présence ou source de planning invalide.');
 for(const d of s.cases)if(d.initialAgent&&!agents.has(d.initialAgent))throw Error('Responsable initial inconnu.');
 for(const t of s.tasks){if(typeof t.id!=='string'||!/^T[A-Z0-9_-]{1,40}$/.test(t.id)||ids.has(t.id)||!cases.has(t.caseId)||typeof t.title!=='string'||!t.title.trim()||t.title.length>250||!priorities.includes(t.priority)||!['todo','doing','done'].includes(t.status)||t.assignee&&!agents.has(t.assignee)||!Number.isInteger(t.estimatedMinutes)||t.estimatedMinutes<1||t.estimatedMinutes>1440||t.due!==null&&!Number.isFinite(Date.parse(t.due))||!Number.isFinite(Date.parse(t.created))||t.status==='done'&&!Number.isFinite(Date.parse(t.completedAt))||!['etr','core-demo'].includes(t.source)||!['requiredLanguages','preferredLanguages'].every(k=>Array.isArray(t[k])&&t[k].every(l=>l in LANGUAGES))||!Array.isArray(t.history)||!t.history.every(h=>typeof h.text==='string'&&Number.isFinite(Date.parse(h.at))))throw Error('Tâche invalide : '+t.id);ids.add(t.id);
  if(t.assignee&&t.status!=='done'){const d=cases.get(t.caseId);if(![d.agent,...d.associates].includes(t.assignee))throw Error('Le responsable de tâche doit être affecté au dossier : '+t.id)}
 }
 return s;
}
export function createTask(s,caseId,input={},now=new Date()){
 const d=s.cases.find(d=>d.id===caseId);if(!d||d.archived)throw Error('Dossier actif requis.');ensureAssignmentData(s);
 let id;do{id='T'+String(++s.taskCounter).padStart(6,'0')}while(s.tasks.some(t=>t.id===id));
 const task={id,caseId,title:input.title||'Intervention ETR',priority:input.priority||'normal',status:'todo',assignee:'',requiredLanguages:input.requiredLanguages||[],preferredLanguages:input.preferredLanguages||[],estimatedMinutes:input.estimatedMinutes||30,due:input.due||null,created:new Date(now).toISOString(),completedAt:null,source:input.source||'etr',history:[]};
 task.history.push({at:task.created,text:task.source==='core-demo'?'Réapparition CORE simulée, sans connexion au système CORE':'Création de la tâche'});s.tasks.push(task);
 try{validateAssignmentData(s)}catch(e){s.tasks.pop();throw e}history(d,'Tâche '+id+' créée : '+task.title+(task.source==='core-demo'?' · simulation CORE':''),now);return task;
}
export function applyAssignment(s,caseId,taskId,agentId,{override=false,languageOverride=false,mode='task',now=new Date()}={}){
 ensureAssignmentData(s);const d=s.cases.find(d=>d.id===caseId),a=s.agents.find(a=>a.id===agentId),task=taskId?s.tasks.find(t=>t.id===taskId&&t.caseId===caseId):null;
 if(!d||d.archived||!a||taskId&&!task||task?.status==='done')throw Error('Dossier, tâche ou chargé non disponible.');
 const input=task||{caseId,requiredLanguages:d.language?[d.language]:[],preferredLanguages:[],estimatedMinutes:30};
 const cfg=engineConfig(s.engine),candidate=recommendAssignments(s,input,cfg,now).candidates.find(c=>c.agent.id===agentId);
 if(!candidate.eligible&&(!cfg.allowOverrides||!override))throw Error(candidate.excluded.join(' ; '));
 if(candidate.missingLanguages.length&&(!cfg.allowLanguageOverrides||!languageOverride))throw Error('Dérogation linguistique explicite requise.');
 const initial=d.initialAgent||d.agent;if(!initial){d.initialAgent=agentId;d.agent=agentId;d.associates=(d.associates||[]).filter(x=>x!==agentId)}else{d.initialAgent=initial;d.agent=initial;d.associates=[...new Set([...(d.associates||[]),agentId].filter(x=>x!==initial))]}
 const detail=(!candidate.eligible?' · Dérogation explicite : '+candidate.excluded.join(' ; '):'')+(candidate.warnings.length?' · Avertissement : '+candidate.warnings.join(' ; '):'');
 if(task&&mode==='task'){const previous=task.assignee;task.assignee=agentId;task.history.push({at:new Date(now).toISOString(),text:(previous?'Réaffectation de '+previous+' à ':'Affectation à ')+a.name+detail});history(d,'Tâche '+task.id+' → '+a.name+' ; responsable initial conservé : '+d.initialAgent+detail,now)}else history(d,(initial?'Chargé complémentaire ajouté : ':'Responsable initial : ')+a.name+detail,now);
 return candidate;
}
export function finishTask(s,id,now=new Date()){
 const t=s.tasks.find(t=>t.id===id);if(!t||t.status==='done')return;
 t.status='done';t.completedAt=new Date(now).toISOString();t.history.push({at:t.completedAt,text:'Tâche terminée'});const d=s.cases.find(d=>d.id===t.caseId);history(d,'Tâche '+t.id+' terminée',now);
}
export function colleagueStats(s,from,to,now){
 const loads=new Map();for(const a of s.agents){const cases=s.cases.filter(d=>[d.agent,...d.associates].includes(a.id)),active=cases.filter(d=>!d.archived);loads.set(a.id,{cases:active.length,primary:active.filter(d=>d.initialAgent===a.id).length,complement:active.filter(d=>d.initialAgent!==a.id).length,archived:new Set(cases.filter(d=>d.archived&&parisDate(new Date(d.closed))>=from&&parisDate(new Date(d.closed))<=to).map(d=>d.id)).size,completedTasks:s.tasks.filter(t=>t.assignee===a.id&&t.status==='done'&&parisDate(new Date(t.completedAt))>=from&&parisDate(new Date(t.completedAt))<=to).length})}return loads;
}
