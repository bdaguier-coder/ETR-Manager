import {cp,mkdir,rm,readdir} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const entry of await readdir('dist'))await rm('dist/'+entry,{recursive:true,force:true});
for(const f of ['index.html','app.js','core.js','data.js','map.js','map-model.js','tvh-model.js','beneficiary-model.js','priority-signals.js','tvh-ui.js','assignment-engine.js','task-model.js','assignment-ui.js','assignment-scenarios.js','style.css','manifest.webmanifest','manifest-agent.webmanifest','sw.js','icon.svg','icon-192.png','icon-512.png','data','vendor'])await cp(f,'dist/'+f,{recursive:true});
