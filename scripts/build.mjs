import {cp,mkdir,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
for(const f of ['index.html','app.js','core.js','data.js','map.js','map-model.js','style.css','manifest.webmanifest','manifest-agent.webmanifest','sw.js','icon.svg','icon-192.png','icon-512.png','data','vendor'])await cp(f,'dist/'+f,{recursive:true});
