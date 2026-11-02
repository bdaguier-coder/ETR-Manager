// Local, deterministic escalation signals. No remote classification or AI.
export const PRIORITY_SIGNALS=Object.freeze([
 {key:'localizationIssue',label:'Problème de localisation',priority:'urgent'},
 {key:'longWait',label:'Attente trop longue',priority:'urgent'},
 {key:'linguistNeeded',label:'Besoin d’un linguiste',priority:'urgent'},
 {key:'customerConflict',label:'Conflit client',priority:'critical'},
 {key:'suspectedFraudLeakage',label:'Suspicion de fraude / leakage',priority:'critical'}
]);
const rank={normal:0,follow:1,urgent:2,critical:3};
export function normaliseSignals(d){
 if(d.signals==null)d.signals={};if(typeof d.signals!=='object'||Array.isArray(d.signals))throw Error('Signalements de priorité invalides.');
 for(const signal of PRIORITY_SIGNALS){if(d.signals[signal.key]===undefined)d.signals[signal.key]=false;if(typeof d.signals[signal.key]!=='boolean')throw Error('Signalement invalide : '+signal.label)}return d;
}
export function signalPriority(d){const active=PRIORITY_SIGNALS.filter(s=>d.signals?.[s.key]);if(!active.length)return null;const key=active.some(s=>s.priority==='critical')?'critical':'urgent';return {key,reason:'Signalement : '+active.filter(s=>s.priority===key).map(s=>s.label).join(' ; ')};}
export function effectiveTaskPriority(task,d={}){const keys=[task.priority,d.priorityOverride&&d.priorityMode==='manual'?null:signalPriority(d)?.key,d.priorityMode==='manual'?d.priority:'normal'].filter(k=>k in rank);return keys.sort((a,b)=>rank[b]-rank[a])[0]||'normal';}
