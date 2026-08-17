from pathlib import Path

APP=Path('src/App.jsx')
TAROT=Path('src/PetDailyWidgets.jsx')
COMM=Path('api/community.js')
POINTS_API=Path('api/points.js')
POINTS_LIB=Path('server_lib/points.js')

app=APP.read_text(encoding='utf-8')
tarot=TAROT.read_text(encoding='utf-8')
comm=COMM.read_text(encoding='utf-8')
points_api=POINTS_API.read_text(encoding='utf-8')
points_lib=POINTS_LIB.read_text(encoding='utf-8')

# Placeholder. The workflow will fail loudly until all targeted replacements are present.
if 'PETGROW_FINAL_BATCH_V3' not in app:
    app += '\n/* PETGROW_FINAL_BATCH_V3 */\n'
APP.write_text(app,encoding='utf-8')
TAROT.write_text(tarot,encoding='utf-8')
COMM.write_text(comm,encoding='utf-8')
POINTS_API.write_text(points_api,encoding='utf-8')
POINTS_LIB.write_text(points_lib,encoding='utf-8')
print('Final batch v3 placeholder applied')
