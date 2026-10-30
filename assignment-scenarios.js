import {ENGINE_DEFAULTS,engineConfig} from './assignment-engine.js?v=1.2.0';
export const SCENARIOS={A:'12 tâches normales contre 4 urgentes + 3 normales',B:'Fin de service imminente',C:'Allemand obligatoire',D:'Retour CORE pendant l’absence du responsable',E:'Aucun candidat admissible',F:'Égalité et départage stable'};
export function simulationDefinition(key='A'){
 const agents=[{id:'sophie',name:'Sophie Martin',normal:12,follow:0,urgent:0,critical:0,start:'08:00',end:'18:00',presence:'available',languages:['fr','en']},{id:'thomas',name:'Thomas Bernard',normal:3,follow:0,urgent:4,critical:0,start:'08:00',end:'18:00',presence:'available',languages:['fr','en','de']},{id:'lina',name:'Lina Robert',normal:2,follow:0,urgent:0,critical:0,start:'08:00',end:'18:00',presence:'absent',languages:['fr','de']}];
 const value={key,now:'2026-10-30T09:00:00.000Z',agents,requiredLanguage:'fr',preferredLanguage:'',estimatedMinutes:45,priority:'normal'};
 if(key==='B')agents[0].end='10:10';
 if(key==='C')value.requiredLanguage='de';
 if(key==='D'){agents[0].presence='absent';agents[1].urgent=0;value.priority='urgent'}
 if(key==='E'){agents[0].presence='absent';agents[1].presence='pause';value.requiredLanguage='it'}
 if(key==='F'){agents[1].normal=12;agents[1].urgent=0}
 return value;
}
export function buildSimulation(definition,config=ENGINE_DEFAULTS){
 const now=new Date(definition.now),iso=now.toISOString(),date='2026-10-30';
 const agents=definition.agents.map(a=>({id:a.id,name:a.name,languages:a.languages,capacity:99,service:'Simulation',planningSource:'demo',presence:{status:a.presence},schedule:[{date,start:a.start,end:a.end,breakStart:'00:00',breakEnd:'00:00',unavailable:false,reason:''}]}));
 const makeCase=(id,agent='')=>({id,agent,initialAgent:agent,associates:[],archived:false,closed:null,opened:iso,updated:iso,history:[],groups:[{men:1,women:0,children:0,status:'À l’hôtel'}],language:'fr'});
 const d=makeCase('SIM826431',definition.key==='D'?'sophie':'');
 const state={agents,cases:[d],tasks:[],engine:engineConfig(config),taskCounter:1000};
 for(const a of definition.agents){const caseId='LOAD'+a.id;state.cases.push(makeCase(caseId,a.id));for(const p of ['normal','follow','urgent','critical'])for(let n=0;n<a[p];n++)state.tasks.push({id:'TL'+a.id+p+n,caseId,title:'Charge simulée',priority:p,status:'todo',assignee:a.id,requiredLanguages:[],preferredLanguages:[],estimatedMinutes:30,due:null,created:iso,completedAt:null,source:'etr',history:[]})}
 const task={id:'TSIMULATION',caseId:d.id,title:definition.key==='D'?'Nouvelle tâche CORE — simulation':'Nouvelle tâche de simulation',priority:definition.priority,status:'todo',assignee:'',requiredLanguages:definition.requiredLanguage?[definition.requiredLanguage]:[],preferredLanguages:definition.preferredLanguage?[definition.preferredLanguage]:[],estimatedMinutes:definition.estimatedMinutes,due:null,created:iso,completedAt:null,source:definition.key==='D'?'core-demo':'etr',history:[]};state.tasks.push(task);return {state,task,now};
}
