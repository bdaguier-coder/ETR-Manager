export const COUNTRIES = [
 ['FR','France','🇫🇷',['fr'],['Paris',48.8566,2.3522],['Lyon',45.764,4.8357],['Bordeaux',44.8378,-.5792]],
 ['ES','Espagne','🇪🇸',['es'],['Madrid',40.4168,-3.7038],['Valencia',39.4699,-.3763],['Barcelona',41.3874,2.1686]],
 ['PT','Portugal','🇵🇹',['pt'],['Lisboa',38.7223,-9.1393],['Porto',41.1579,-8.6291],['Faro',37.0194,-7.9304]],
 ['IT','Italie','🇮🇹',['it'],['Roma',41.9028,12.4964],['Milano',45.4642,9.19],['Napoli',40.8518,14.2681]],
 ['CH','Suisse','🇨🇭',['fr','de','it'],['Genève',46.2044,6.1432],['Zürich',47.3769,8.5417],['Bern',46.948,7.4474]],
 ['DE','Allemagne','🇩🇪',['de'],['Berlin',52.52,13.405],['München',48.1351,11.582],['Hamburg',53.5511,9.9937]],
 ['BE','Belgique','🇧🇪',['fr','nl'],['Bruxelles',50.8503,4.3517],['Liège',50.6326,5.5797],['Antwerpen',51.2194,4.4025]],
 ['NL','Pays-Bas','🇳🇱',['nl'],['Amsterdam',52.3676,4.9041],['Rotterdam',51.9244,4.4777],['Utrecht',52.0907,5.1214]],
 ['LU','Luxembourg','🇱🇺',['fr','de'],['Luxembourg',49.6116,6.1319],['Esch-sur-Alzette',49.4958,5.9806],['Diekirch',49.8678,6.1558]],
 ['AT','Autriche','🇦🇹',['de'],['Wien',48.2082,16.3738],['Salzburg',47.8095,13.055],['Innsbruck',47.2692,11.4041]],
 ['HU','Hongrie','🇭🇺',['hu'],['Budapest',47.4979,19.0402],['Szeged',46.253,20.1414],['Debrecen',47.5316,21.6273]],
 ['CZ','République tchèque','🇨🇿',['cs'],['Praha',50.0755,14.4378],['Brno',49.1951,16.6068],['Ostrava',49.8209,18.2625]],
 ['PL','Pologne','🇵🇱',['pl'],['Warszawa',52.2297,21.0122],['Kraków',50.0647,19.945],['Gdańsk',54.352,18.6466]],
 ['RO','Roumanie','🇷🇴',['ro'],['București',44.4268,26.1025],['Cluj-Napoca',46.7712,23.6236],['Timișoara',45.7489,21.2087]],
 ['AL','Albanie','🇦🇱',['sq'],['Tirana',41.3275,19.8187],['Durrës',41.3231,19.4414],['Vlorë',40.4661,19.4914]],
 ['TR','Turquie','🇹🇷',['tr'],['İstanbul',41.0082,28.9784],['Ankara',39.9334,32.8597],['Antalya',36.8969,30.7133]],
 ['MA','Maroc','🇲🇦',['ar','fr'],['Rabat',34.0209,-6.8416],['Marrakech',31.6295,-7.9811],['Casablanca',33.5731,-7.5898]],
 ['TN','Tunisie','🇹🇳',['ar','fr'],['Tunis',36.8065,10.1815],['Sousse',35.8256,10.6084],['Sfax',34.7406,10.7603]],
 ['GB','Royaume-Uni','🇬🇧',['en'],['London',51.5074,-.1278],['Manchester',53.4808,-2.2426],['Edinburgh',55.9533,-3.1883]],
 ['IE','Irlande','🇮🇪',['en'],['Dublin',53.3498,-6.2603],['Cork',51.8985,-8.4756],['Galway',53.2707,-9.0568]],
 ['NO','Norvège','🇳🇴',['no'],['Oslo',59.9139,10.7522],['Bergen',60.3913,5.3221],['Trondheim',63.4305,10.3951]],
 ['SE','Suède','🇸🇪',['sv'],['Stockholm',59.3293,18.0686],['Göteborg',57.7089,11.9746],['Malmö',55.605,13.0038]],
 ['HR','Croatie','🇭🇷',['hr'],['Zagreb',45.815,15.9819],['Split',43.5081,16.4402],['Dubrovnik',42.6507,18.0944]],
 ['GR','Grèce','🇬🇷',['el'],['Athína',37.9838,23.7275],['Thessaloníki',40.6401,22.9444],['Pátra',38.2466,21.7346]]
].map(([code,name,flag,languages,...cities])=>({code,name,flag,languages,cities}));
export const LANGUAGES={fr:'Français',en:'Anglais',es:'Espagnol',pt:'Portugais',it:'Italien',de:'Allemand',nl:'Néerlandais',hu:'Hongrois',cs:'Tchèque',pl:'Polonais',ro:'Roumain',sq:'Albanais',tr:'Turc',ar:'Arabe',no:'Norvégien',sv:'Suédois',hr:'Croate',el:'Grec'};
export const PRIORITIES={normal:{label:'Normal',color:'#158967'},follow:{label:'À suivre',color:'#db9019'},urgent:{label:'Urgent',color:'#e15158'},critical:{label:'Critique',color:'#20293d'}};
export const STAGES=['Ouverture','Prise en charge','Intervention','Dépôt','Réparation','Transport','Relivraison','Résolution'];
export const BENEFITS=['Sur place','À l’hôtel','En attente de solution','En cours de retour domicile','En cours de poursuite du voyage','Pris en charge / traitement terminé'];
export const TVH=['Non applicable','En attente','En cours','Livré'];
export const country=code=>COUNTRIES.find(c=>c.code===code);
export const parisDate=(date=new Date())=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
export const isoLocal=(date=new Date())=>parisDate(date)+'T'+new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Paris',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(date);
export function seed(now=new Date()){
 const names=['Camille Morel','Nora Laurent','Hugo Perrin','Lina Dubois','Adam Leroy','Zoé Simon','Louis Mercier','Maya Robin','Noé Garnier','Inès Renaud','Émile Caron','Jade Fontaine'];
 const langs=[['fr','en','es'],['fr','de','nl'],['fr','en','it'],['fr','pt','es'],['fr','en','ar'],['fr','pl','cs'],['en','de','hu'],['en','ro','sq'],['en','tr','el'],['en','no','sv'],['fr','en','hr'],['fr','en','de']];
 const agents=names.map((name,i)=>({id:'a'+i,name,languages:langs[i],service:i%3===0?'Relais nuit':i%3===1?'Europe centrale':'International',capacity:i%3===0?5:8,schedule:Array.from({length:14},(_,d)=>{const date=new Date(now);date.setDate(date.getDate()+d-3);return {date:parisDate(date),start:i%3===0?'22:00':i%3===1?'08:00':'13:00',end:i%3===0?'06:00':i%3===1?'17:00':'22:00',breakStart:i%3===0?'02:00':i%3===1?'12:00':'17:00',breakEnd:i%3===0?'02:30':i%3===1?'13:00':'17:30',unavailable:(d+i)%7===0,reason:(d+i)%7===0?'Repos':''}})}));
 const cases=Array.from({length:72},(_,i)=>{
  const c=COUNTRIES[i%24], city=c.cities[Math.floor(i/24)], dest=COUNTRIES[(i%5===0?1:0)].cities[(i+1)%3];
  const archived=i>=66, tvh=TVH[archived?3:i%4], stage=archived?'Résolution':tvh==='En cours'?'Transport':tvh==='Livré'?'Relivraison':STAGES[i%5];
  const opened=new Date(+now-(4+(i*13)%170)*3600000).toISOString(); const updated=new Date(+now-(i%7)*4*3600000).toISOString();
  const status=archived?BENEFITS[5]:BENEFITS[i%6]; const count=1+i%5;
  const loc=(a,cc)=>({label:a[0]+' — centre-ville (repère de démonstration)',lat:a[1],lng:a[2],country:cc,source:'Catalogue de villes publiques · position indicative'});
  return {id:String(826431+i),country:c.code,type:i%6===0?'Accident':'Panne',opened,updated,location:loc(city,c.code),depot:loc(city,c.code),destination:loc(dest,i%5===0?'ES':'FR'),stage,tvh,groups:[{id:'g1',name:'Groupe principal',men:1,women:count>1?1:0,children:Math.max(0,count-2),vulnerable:i%9===0?1:0,animals:i%8===0?1:0,status}],priorityMode:i%7===0?'manual':'auto',priority:i%7===0?'critical':'normal',priorityReason:i%7===0?'Décision de supervision : solution bénéficiaires à arbitrer':'Règles automatiques',agent:i%6===0?'':agents[i%12].id,associates:[],language:c.languages[0],action:archived?'Traitement terminé':['Confirmer la solution hôtel','Relancer le garage','Valider le devis','Confirmer le transporteur','Organiser le retour','Contacter les bénéficiaires'][i%6],due:new Date(+now+(i%8-2)*3600000).toISOString(),actionOwner:i%6===0?'':agents[i%12].id,notes:'Scénario fictif '+(i+1)+' — aucune donnée client. Le repère est le centre de la ville, pas une adresse de garage.',archived,closed:archived?new Date(+now-(i%5)*3600000).toISOString():null,history:[{at:opened,text:'Ouverture du dossier de démonstration'},{at:updated,text:'Point de suivi : '+stage}],beneficiaryDestination:loc(dest,i%5===0?'ES':'FR')};
 });
 return {version:1,cases,agents,settings:{staleHours:24,urgentHours:4,criticalHours:24},created:now.toISOString()};
}
