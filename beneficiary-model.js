import {BENEFITS} from './data.js?v=1.3.0';
export const adultCount=g=>Number.isInteger(g.adults)?g.adults:(g.men||0)+(g.women||0);
export const beneficiaryCount=g=>adultCount(g)+(g.children||0);
export function normaliseGroup(g){
 for(const k of ['men','women'])if(k in g&&(!Number.isInteger(g[k])||g[k]<0||g[k]>1000))throw Error('Ancienne composition bénéficiaire invalide.');
 if(g.adults===undefined)g.adults=adultCount(g);
 for(const k of ['vulnerable','animals']){if(typeof g[k]==='boolean')continue;if(!Number.isInteger(g[k])||g[k]<0||g[k]>1000)throw Error('Indicateur bénéficiaire invalide : '+k);g[k]=g[k]>0}
 delete g.men;delete g.women;
 const legacy={'Sur place':BENEFITS[0],'En attente de solution':BENEFITS[2],'En cours de retour domicile':BENEFITS[3],'En cours de poursuite du voyage':BENEFITS[4]};if(legacy[g.status])g.status=legacy[g.status];return g;
}
