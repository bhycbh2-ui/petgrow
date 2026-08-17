import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const sourcePath='scripts/apply-petgrow-ux-bundle.mjs';
let source=fs.readFileSync(sourcePath,'utf8');
// Repair the escaped newline accidentally stored at the end of the generated helper.
source=source.replace("fs.writeFileSync(appFile,s);fs.writeFileSync(musicFile,music);\\nconsole.log('PetGrow UX bundle applied successfully');","fs.writeFileSync(appFile,s);fs.writeFileSync(musicFile,music);\nconsole.log('PetGrow UX bundle applied successfully');");
// Make the home quick-section matcher tolerant of the current == form.
source=source.replace("key===\\\"pets\\\"?onGoPets():key===\\\"more\\\"?onGoView(\\\"more\\\"):onGoView(key)","key==\\\"pets\\\"?onGoPets():key==\\\"more\\\"?onGoView(\\\"more\\\"):onGoView(key)");
const temp=path.join(process.cwd(),'scripts','.apply-petgrow-ux-runtime.mjs');
fs.writeFileSync(temp,source);
try{await import(pathToFileURL(temp).href+`?t=${Date.now()}`);}finally{try{fs.unlinkSync(temp)}catch{}}
