const sleep=(ms)=>new Promise(resolve=>window.setTimeout(resolve,ms));

async function waitForCriticalHome(timeout=3000){
  const started=performance.now();
  let homeSeenAt=0;
  while(performance.now()-started<timeout){
    const home=document.querySelector(".petgrow-dashboard-home");
    if(!home){
      if(performance.now()-started>500)return "not-home";
      await sleep(40);continue;
    }
    homeSeenAt ||= performance.now();
    const section=home.querySelector("#pg-petlife-home-dashboard");
    const loading=section?.querySelector(".pgh-loading");
    if(section&&!loading)return "ready";
    if(!section&&performance.now()-homeSeenAt>900)return "not-applicable";
    await sleep(45);
  }
  return "timeout";
}

let promise=null;
export function bootCriticalHome(){
  if(promise)return promise;
  promise=(async()=>{
    try{
      const [petLifeModule,bridge]=await Promise.all([
        import("./PetLifeApp.jsx"),
        import("./petlife-home-bridge.js"),
      ]);
      petLifeModule.bootPetLife?.();
      bridge.bootPetLifeHomeBridge?.();
      await waitForCriticalHome();
    }catch(error){
      console.warn("PetGrow critical home preload failed",error);
    }finally{
      window.__petgrowCriticalAppReady=true;
      window.dispatchEvent(new CustomEvent("petgrow:critical-ready"));
    }
  })();
  return promise;
}
