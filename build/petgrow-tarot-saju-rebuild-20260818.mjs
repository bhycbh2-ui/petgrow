export default function petgrowTarotSajuRebuild(){
  return {
    name:"petgrow-tarot-saju-rebuild-20260818",
    enforce:"pre",
    transform(code,id){
      const norm=String(id||"").replaceAll("\\","/");
      if(!norm.endsWith("/src/PetDailyWidgets.jsx")) return null;
      let out=code;

      // The older UI transform inserted a separate pet-identity banner before Tarot.
      // Remove that generated banner completely so Tarot follows the same rhythm as Pet Saju.
      out=out.replace(
        /<div className="pg-tarot-pet-identity">[\s\S]*?<\/div><style>\{`/,
        '<style>{`'
      );

      const stage='<div className="bg-card pet-tarot-stage">';
      if(!out.includes(stage)) throw new Error('[petgrow-tarot-saju-rebuild] Pet Tarot stage not found');

      const head='<div className="pet-tarot-native-head"><span className="pet-tarot-native-avatar">{(pet?.profile?.profileImage||pet?.profile?.photo||pet?.profileImage||pet?.photo)?<img src={pet?.profile?.profileImage||pet?.profile?.photo||pet?.profileImage||pet?.photo} alt={petName}/>:<em>{String(pet?.profile?.species||pet?.species||pet?.profile?.type||pet?.type||"dog").toLowerCase().includes("cat")||String(pet?.profile?.species||pet?.species||"").includes("고양")?"🐱":"🐶"}</em>}</span><b className="pet-user-name">{petName}</b></div>';
      out=out.replace(stage,stage+head);
      return out===code?null:{code:out,map:null};
    }
  };
}
