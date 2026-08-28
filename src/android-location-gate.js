import { Capacitor } from "@capacitor/core";

const nativeAndroid=Capacitor.isNativePlatform()&&Capacitor.getPlatform()==="android";

if(nativeAndroid&&navigator.geolocation&&!window.__petgrowAndroidLocationGate){
  window.__petgrowAndroidLocationGate=true;
  const geo=navigator.geolocation;
  const nativeGet=geo.getCurrentPosition.bind(geo);
  const nativeWatch=geo.watchPosition.bind(geo);
  const nativeClear=geo.clearWatch.bind(geo);
  let userGestureUntil=0;
  const suppressedWatchIds=new Set();
  let fakeWatchId=-1000;

  const arm=()=>{userGestureUntil=Date.now()+15000;};
  const armed=()=>Date.now()<=userGestureUntil;
  const isLocationAction=(target)=>{
    const button=target?.closest?.("button,[role='button']");
    if(!button)return false;
    const value=`${button.textContent||""} ${button.getAttribute?.("aria-label")||""} ${button.getAttribute?.("title")||""}`;
    return /(현재\s*위치|내\s*위치|실시간\s*위치|current\s*location|my\s*location|live\s*location)/i.test(value);
  };

  document.addEventListener("click",event=>{
    if(isLocationAction(event.target))arm();
  },true);

  try{
    geo.getCurrentPosition=(success,error,options)=>{
      if(armed())return nativeGet(success,error,options);
      // Nearby mounts with a passive location probe. Do not trigger the Android
      // runtime permission dialog until the user explicitly taps a location action.
      queueMicrotask(()=>error?.({code:2,message:"Location waits for explicit user action."}));
    };
    geo.watchPosition=(success,error,options)=>{
      if(armed())return nativeWatch(success,error,options);
      const id=fakeWatchId--;
      suppressedWatchIds.add(id);
      return id;
    };
    geo.clearWatch=(id)=>{
      if(suppressedWatchIds.delete(id))return;
      return nativeClear(id);
    };
  }catch(error){
    console.warn("PetGrow Android location gate",error?.message||error);
  }
}
