from pathlib import Path

# 1) PetPoint: same-tab events are already immediate; shorten safety sync from 30s to 5s
app=Path('src/App.jsx')
s=app.read_text(encoding='utf-8')
s=s.replace('const poll=setInterval(()=>{if(alive)load()},30000);','const poll=setInterval(()=>{if(alive)load()},5000);')
s=s.replace('const poll=setInterval(()=>load(true),30000);','const poll=setInterval(()=>load(true),5000);')
s=s.replace('최근 20건 · 30초마다 자동 동기화','최근 20건 · 실시간 반영 · 5초 자동 동기화')
s=s.replace('최근 20건 · 30초마다 자동 동기화','최근 20건 · 실시간 반영 · 5초 자동 동기화')
app.write_text(s,encoding='utf-8')

# 2) Pet Music: starter seed must not run on every public/admin list request.
# Existing 32 starter tracks are already seeded; repeated seed checks/deletes make navigation feel like an upload/loading pass.
music=Path('api/music.js')
m=music.read_text(encoding='utf-8')
m=m.replace('    if(action==="list" && req.method==="GET"){\n      await ensureStarterTracks();\n', '    if(action==="list" && req.method==="GET"){\n')
m=m.replace('    if(action==="admin-list" && req.method==="GET"){\n      if(!(await requireAdmin(req,res)))return;\n      await ensureStarterTracks();\n', '    if(action==="admin-list" && req.method==="GET"){\n      if(!(await requireAdmin(req,res)))return;\n')
# Add explicit admin-only seed action for maintenance, so seeding remains available without penalizing normal navigation.
needle='    if(action==="admin-list" && req.method==="GET"){\n'
if 'action==="admin-seed"' not in m and needle in m:
    seed='''    if(action==="admin-seed" && req.method==="POST"){\n      if(!(await requireAdmin(req,res)))return;\n      await ensureStarterTracks();\n      return res.status(200).json({ok:true});\n    }\n'''
    m=m.replace(needle,seed+needle,1)
music.write_text(m,encoding='utf-8')

# validation markers
assert 'setInterval(()=>load(true),5000)' in s or 'setInterval(()=>{if(alive)load()},5000)' in s
assert 'if(action==="list" && req.method==="GET"){\n      await ensureStarterTracks();' not in m
assert 'action==="admin-seed"' in m
print('patched PetPoint live sync and Pet Music list loading')
