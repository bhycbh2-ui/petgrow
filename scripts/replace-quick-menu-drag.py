from pathlib import Path
p=Path('src/App.jsx')
s=p.read_text(encoding='utf-8')
old="""  const moveQuick=(key,dir)=>{const i=quickKeys.indexOf(key);if(i<0)return;const j=dir==='first'?0:dir==='last'?quickKeys.length-1:i+(dir==='left'?-1:1);if(j<0||j>=quickKeys.length||j===i)return;const next=[...quickKeys];next.splice(i,1);next.splice(j,0,key);saveQuick(next);};\n  const quick=quickKeys.map(k=>allQuick.find(x=>x[0]===k)).filter(Boolean);"""
new="""  const [quickDragKey,setQuickDragKey]=useState(null);\n  const reorderQuick=(fromKey,toKey)=>{if(!fromKey||!toKey||fromKey===toKey)return;const from=quickKeys.indexOf(fromKey),to=quickKeys.indexOf(toKey);if(from<0||to<0)return;const next=[...quickKeys];const [moved]=next.splice(from,1);next.splice(to,0,moved);saveQuick(next);};\n  const beginQuickPointerDrag=(e,key)=>{setQuickDragKey(key);try{e.currentTarget.setPointerCapture?.(e.pointerId)}catch{}};\n  const moveQuickPointer=(e)=>{if(!quickDragKey)return;const el=document.elementFromPoint(e.clientX,e.clientY)?.closest?.('[data-quick-key]');const over=el?.dataset?.quickKey;if(over&&over!==quickDragKey){reorderQuick(quickDragKey,over);setQuickDragKey(over);}};\n  const endQuickPointerDrag=()=>setQuickDragKey(null);\n  const quick=quickKeys.map(k=>allQuick.find(x=>x[0]===k)).filter(Boolean);"""
if old not in s: raise SystemExit('moveQuick anchor missing')
s=s.replace(old,new,1)
old2="""<div className=\"quick-order-list\">{quick.map(([key,icon,label],i)=><div className=\"quick-order-row\" key={key}><span><i>{icon}</i><b>{label}</b></span><div><button type=\"button\" disabled={i===0} onClick={()=>moveQuick(key,'first')}>{lang==='en'?'First':'맨앞'}</button><button type=\"button\" disabled={i===0} onClick={()=>moveQuick(key,'left')}>←</button><button type=\"button\" disabled={i===quick.length-1} onClick={()=>moveQuick(key,'right')}>→</button><button type=\"button\" disabled={i===quick.length-1} onClick={()=>moveQuick(key,'last')}>{lang==='en'?'Last':'맨뒤'}</button></div></div>)}</div>"""
new2="""<div className=\"quick-order-list\">{quick.map(([key,icon,label])=><div className={`quick-order-row ${quickDragKey===key?'dragging':''}`} data-quick-key={key} key={key} draggable onDragStart={()=>setQuickDragKey(key)} onDragOver={e=>{e.preventDefault();if(quickDragKey&&quickDragKey!==key){reorderQuick(quickDragKey,key);setQuickDragKey(key)}}} onDragEnd={endQuickPointerDrag}><span><i>{icon}</i><b>{label}</b></span><button type=\"button\" className=\"quick-drag-handle\" aria-label={`${label} 순서 이동`} title={lang==='en'?'Drag to reorder':'끌어서 순서 변경'} onPointerDown={e=>beginQuickPointerDrag(e,key)} onPointerMove={moveQuickPointer} onPointerUp={endQuickPointerDrag} onPointerCancel={endQuickPointerDrag}>≡</button></div>)}</div>"""
if old2 not in s: raise SystemExit('quick-order-list anchor missing')
s=s.replace(old2,new2,1)
# inject CSS near existing quick-order styles if present, otherwise append into GlobalStyle string before known app-bottom css marker.
css="""
.quick-order-list{display:flex;flex-direction:column;gap:8px}.quick-order-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 12px;border:1px solid var(--border);border-radius:14px;background:#fff;transition:.16s ease;touch-action:none}.quick-order-row>span{display:flex;align-items:center;gap:9px;min-width:0}.quick-order-row>span i{font-style:normal;font-size:19px}.quick-order-row>span b{font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.quick-order-row.dragging{opacity:.62;transform:scale(.985);box-shadow:0 8px 20px rgba(40,70,48,.10)}.quick-drag-handle{width:36px;height:36px;flex:0 0 36px;border:0;border-radius:11px;background:#f1f6f1;color:#718077;font-size:22px;line-height:1;font-weight:700;display:grid;place-items:center;cursor:grab;user-select:none;-webkit-user-select:none;touch-action:none}.quick-drag-handle:active{cursor:grabbing;background:#e8f1e9;color:var(--primary)}@media(max-width:600px){.quick-order-row{padding:10px 11px}.quick-drag-handle{width:40px;height:40px;flex-basis:40px}}
"""
anchor='.app-bottom-nav{'
if css.strip() not in s:
    idx=s.find(anchor)
    if idx<0: raise SystemExit('css anchor missing')
    s=s[:idx]+css+s[idx:]
p.write_text(s,encoding='utf-8')
print('quick menu drag reorder patch applied')
