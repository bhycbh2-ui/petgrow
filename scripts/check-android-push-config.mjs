import fs from "node:fs";

const checks=[];
const add=(name,ok,detail="")=>checks.push({name,ok:Boolean(ok),detail});
const read=(p)=>{try{return fs.readFileSync(p,"utf8");}catch{return "";}};

const manifest=read("android/app/src/main/AndroidManifest.xml");
const appGradle=read("android/app/build.gradle");
const rootGradle=read("android/build.gradle");
const workflow=read(".github/workflows/android-aab.yml");
const bridge=read("src/petlife-server-bridge.js");

add("POST_NOTIFICATIONS permission",manifest.includes("android.permission.POST_NOTIFICATIONS"));
add("Google Services classpath",rootGradle.includes("com.google.gms:google-services"));
add("Conditional Google Services plugin",appGradle.includes("google-services.json")&&appGradle.includes("com.google.gms.google-services"));
add("AAB Firebase secret injection",workflow.includes("GOOGLE_SERVICES_JSON_BASE64")&&workflow.includes("google-services.json"));
add("AAB native push plugin install",workflow.includes("@capacitor/push-notifications@6.0.2"));
add("Native plugin sync verification",workflow.includes("capacitor-push-notifications"));
add("Client PushNotifications registration",bridge.includes('registerPlugin("PushNotifications")')&&bridge.includes("Push.register()"));
add("Server token registration",bridge.includes('mode')?bridge.includes("push-register"):bridge.includes("push-register"));

for(const c of checks)console.log(`${c.ok?"PASS":"FAIL"}  ${c.name}${c.detail?` — ${c.detail}`:""}`);
const failed=checks.filter(c=>!c.ok);
console.log(`\n${checks.length-failed.length}/${checks.length} Android push wiring checks passed.`);
if(failed.length)process.exit(1);
