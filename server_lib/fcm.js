import crypto from "node:crypto";

let cachedAccessToken="";
let cachedAccessTokenExpiresAt=0;

function readEnv(name){
  return String(process.env[name]||"").trim();
}

function getConfig(){
  return {
    projectId:readEnv("FCM_PROJECT_ID"),
    clientEmail:readEnv("FCM_CLIENT_EMAIL"),
    privateKey:readEnv("FCM_PRIVATE_KEY").replace(/\\n/g,"\n")
  };
}

function base64url(value){
  const input=typeof value==="string"?value:JSON.stringify(value);
  return Buffer.from(input).toString("base64url");
}

export function isFcmConfigured(){
  const {projectId,clientEmail,privateKey}=getConfig();
  return Boolean(projectId&&clientEmail&&privateKey);
}

async function getAccessToken(){
  if(cachedAccessToken&&Date.now()<cachedAccessTokenExpiresAt-60_000)return cachedAccessToken;
  const {clientEmail,privateKey}=getConfig();
  if(!clientEmail||!privateKey)return "";

  const now=Math.floor(Date.now()/1000);
  const header=base64url({alg:"RS256",typ:"JWT"});
  const payload=base64url({
    iss:clientEmail,
    scope:"https://www.googleapis.com/auth/firebase.messaging",
    aud:"https://oauth2.googleapis.com/token",
    iat:now,
    exp:now+3600
  });
  const unsigned=`${header}.${payload}`;
  const signature=crypto.sign("RSA-SHA256",Buffer.from(unsigned),privateKey).toString("base64url");
  const assertion=`${unsigned}.${signature}`;

  const response=await fetch("https://oauth2.googleapis.com/token",{
    method:"POST",
    headers:{"content-type":"application/x-www-form-urlencoded"},
    body:new URLSearchParams({
      grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });
  if(!response.ok)throw new Error(`FCM_OAUTH_${response.status}`);
  const data=await response.json();
  cachedAccessToken=String(data?.access_token||"");
  cachedAccessTokenExpiresAt=Date.now()+Math.max(300,Number(data?.expires_in)||3600)*1000;
  return cachedAccessToken;
}

async function sendOne(token,payload){
  const {projectId}=getConfig();
  if(!projectId)return {ok:false,skipped:true};
  const accessToken=await getAccessToken();
  if(!accessToken)return {ok:false,skipped:true};
  const response=await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/messages:send`,{
    method:"POST",
    headers:{
      authorization:`Bearer ${accessToken}`,
      "content-type":"application/json"
    },
    body:JSON.stringify({
      message:{
        token,
        notification:{
          title:String(payload?.title||"PetGrow"),
          body:String(payload?.body||"")
        },
        data:Object.fromEntries(Object.entries(payload?.data||{}).map(([key,value])=>[key,String(value??"")]))
      }
    })
  });
  if(response.ok)return {ok:true};
  return {ok:false,status:response.status};
}

export async function sendPushToTokens(tokens,payload={}){
  const list=[...new Set((Array.isArray(tokens)?tokens:[]).map(v=>String(v||"").trim()).filter(Boolean))];
  if(!list.length)return {success:0,failed:0,skipped:0};
  if(!isFcmConfigured())return {success:0,failed:0,skipped:list.length,configured:false};

  let success=0,failed=0;
  for(const token of list){
    try{
      const result=await sendOne(token,payload);
      if(result?.ok)success++;
      else failed++;
    }catch(error){
      console.error("fcm send failed",error);
      failed++;
    }
  }
  return {success,failed,skipped:0,configured:true};
}
