import fs from "node:fs";

const checks=[];
const add=(name,ok,detail="")=>checks.push({name,ok:Boolean(ok),detail});
const read=(p)=>{try{return fs.readFileSync(p,"utf8");}catch{return "";}};

const manifest=read("android/app/src/main/AndroidManifest.xml");
const appGradle=read("android/app/build.gradle");
const rootGradle=read("android/build.gradle");
const workflow=read(".github/workflows/android-aab.yml");
const packageText=read("package.json");
const capacitorSettings=read("android/capacitor.settings.gradle");
const bridge=read("src/petlife-server-bridge.js");

let pkg={};
try{pkg=JSON.parse(packageText);}catch{}
const coreVersion=pkg.dependencies?.["@capacitor/core"]||pkg.devDependencies?.["@capacitor/core"]||"";
const pushVersion=pkg.dependencies?.["@capacitor/push-notifications"]||pkg.devDependencies?.["@capacitor/push-notifications"]||"";
const cleanVersion=(v)=>String(v).replace(/^[~^<>=\s]*/,"");
const major=(v)=>cleanVersion(v).split(".")[0]||"";
const pushPinned=Boolean(pushVersion)&&!/[~^*xX]|latest|next|dev/.test(String(pushVersion));
const pushAligned=major(pushVersion)&&major(pushVersion)===major(coreVersion);

add("POST_NOTIFICATIONS permission",manifest.includes("android.permission.POST_NOTIFICATIONS"));
add("Google Services classpath",rootGradle.includes("com.google.gms:google-services"));
add("Conditional Google Services plugin",appGradle.includes("google-services.json")&&appGradle.includes("com.google.gms.google-services"));
add("AAB Firebase secret injection",workflow.includes("GOOGLE_SERVICES_JSON_BASE64")&&workflow.includes("google-services.json"));
add("Push plugin dependency pinned and aligned",pushPinned&&pushAligned,`core=${coreVersion||"missing"}, push=${pushVersion||"missing"}`);
add("Native plugin sync verification",capacitorSettings.includes("include ':capacitor-push-notifications'")&&capacitorSettings.includes("@capacitor/push-notifications/android"));
add("Client PushNotifications registration",bridge.includes('registerPlugin("PushNotifications")')&&bridge.includes("Push.register()"));
add("Server token registration",bridge.includes("push-register"));

for(const c of checks)console.log(`${c.ok?"PASS":"FAIL"}  ${c.name}${c.detail?` — ${c.detail}`:""}`);
const failed=checks.filter(c=>!c.ok);
console.log(`\n${checks.length-failed.length}/${checks.length} Android push wiring checks passed.`);
if(failed.length)process.exit(1);
