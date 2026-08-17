import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

const raw=process.env.PLAY_SERVICE_ACCOUNT_JSON;
if(!raw) throw new Error('PLAY_SERVICE_ACCOUNT_JSON is missing');
const credentials=JSON.parse(raw);
const auth=new google.auth.GoogleAuth({credentials,scopes:['https://www.googleapis.com/auth/drive.readonly']});
const drive=google.drive({version:'v3',auth});
const outDir=path.resolve('public/petmusic');
fs.mkdirSync(outDir,{recursive:true});

const files=[
  ['1cHC6gECwoVWCEdiZPbePfmOFSAVvFrY3','new-dog-sleep-02.mp3'],
  ['1JM-xEm8ETtSmTXlra4YyGOmEPGz6qqbD','new-dog-sleep-03.mp3'],
  ['1YOq9ZDLlu6apZjSEBzMLrqGk0DbFIwaS','new-dog-sleep-04.mp3'],
  ['1v3z0yLAkAcKkmTdj_Gxon7J0snSrICYk','new-dog-sleep-05.mp3'],
  ['1VzIF1AXXuTW5Gi4ipuZHa4XTeR1bRp9f','new-cat-window-00.mp3'],
  ['1EIsQe4pMPTgCYjlSc6I0_hJ9y2s5Q-Dt','new-cat-window-01.mp3'],
  ['1Wzrz1J0OhgQHin9Ix9feTe61j_ZEcCYp','new-cat-window-02.mp3'],
  ['1v8mw9keN5sBsHaoJN2oX7vRrzIrr8lqm','new-cat-window-03.mp3'],
  ['1Lxnx2uR9U11lXPcqeJAE1doKaMqcmd6o','new-cat-window-04.mp3'],
  ['1tr7wZrd5NXwFzvZRH2jJo3xHl3x3rEYu','new-cat-window-05.mp3'],
  ['1ENpBNSQ5MpmQcS-5toBYAM9RcsFlPmY4','new-dog-fluffy-00.mp3'],
  ['1hQQ50V-w9w-IyDxwx9mqKGdIsPi5ZkBb','new-dog-fluffy-01.mp3'],
  ['1cYIpaFowPpWTxrkcMkq4m9btjpuG6Uzu','new-cat-breath-00.mp3'],
  ['1Rp_61UdiD1Wi3dGExeViaZ9thU8L3UNX','new-cat-breath-01.mp3'],
  ['1wRfTpQ7OOO_QBdy_fzQzdCrl91TIVc0B','new-dog-alley-walk-00.mp3'],
  ['1pRRvwKyzM79bMEvhCQ24bGvXq60j1Ity','new-dog-alley-walk-01.mp3'],
];

for(const [id,name] of files){
  const dest=path.join(outDir,name);
  console.log(`Downloading ${name}`);
  const res=await drive.files.get({fileId:id,alt:'media'},{responseType:'stream'});
  await new Promise((resolve,reject)=>{
    const w=fs.createWriteStream(dest);
    res.data.on('error',reject);
    w.on('error',reject);
    w.on('finish',resolve);
    res.data.pipe(w);
  });
  const size=fs.statSync(dest).size;
  if(size<100000) throw new Error(`${name} download looks invalid: ${size} bytes`);
  console.log(`${name}: ${size} bytes`);
}
console.log(`Downloaded ${files.length} PetMusic tracks.`);
