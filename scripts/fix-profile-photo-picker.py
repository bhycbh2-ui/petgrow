from pathlib import Path

p=Path('src/App.jsx')
s=p.read_text(encoding='utf-8')
old='''function ProfileImagePicker({ species, value, onChange }) {
  const t = useT();
  const inputRef = useRef(null);
  const handlePick = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      onChange(dataUrl);
    } catch {
      alert(t.photoSaveError);
    }
    e.target.value = "";
  };
'''
new='''function ProfileImagePicker({ species, value, onChange }) {
  const t = useT();
  const inputRef = useRef(null);
  const [picking,setPicking]=useState(false);
  const openPicker=()=>{if(!inputRef.current)return;inputRef.current.value="";inputRef.current.click();};
  const handlePick = async (e) => {
    const input=e.target;
    const file = input.files && input.files[0];
    if (!file) return;
    setPicking(true);
    try {
      let dataUrl;
      try { dataUrl = await fileToCompressedDataUrl(file, 1024, 0.78); }
      catch {
        dataUrl = await new Promise((resolve,reject)=>{const r=new FileReader();r.onerror=reject;r.onload=()=>resolve(String(r.result||""));r.readAsDataURL(file);});
      }
      if(!dataUrl) throw new Error('empty image');
      onChange(dataUrl);
    } catch {
      alert(t.photoSaveError);
    } finally {
      input.value = "";
      setPicking(false);
    }
  };
'''
if old not in s: raise SystemExit('anchor not found')
s=s.replace(old,new,1)
s=s.replace('onClick={() => inputRef.current && inputRef.current.click()}>','onClick={openPicker}>',2)
s=s.replace('{t.profileImagePickBtn}','{picking ? (species === "cat" ? "사진 처리 중…" : "사진 처리 중…") : t.profileImagePickBtn}',1)
p.write_text(s,encoding='utf-8')
