import fs from 'fs';

const path='src/App.jsx';
let app=fs.readFileSync(path,'utf8');

const sajuOld=`  if (!pet) return (\n    <div className="feature-module-shell"><div className="bg-card" style={{ textAlign: "center" }}>\n      <SajuIcon style={{ width: 40, height: 40, color: "var(--primary)", margin: "0 auto 14px" }} />\n      <h2 style={{ fontSize: 19, marginBottom: 6 }}>{t.sajuNeedPetTitle}</h2><p className="bg-sub" style={{ fontSize: 13, marginBottom: 22 }}>{t.sajuNeedPetBody}</p>\n      <button className="bg-btn" style={{ width: "100%", fontSize: 15 }} onClick={onGoRegister}>{t.sajuGoRegisterBtn}</button>\n    </div></div>\n  );`;
const sajuNew=`  if (!pet) return (\n    <div className="feature-module-shell feature-empty-shell"><div className="bg-card feature-empty-card">\n      <div className="feature-empty-icon"><SajuIcon style={{ width: 38, height: 38, color: "var(--primary)" }} /></div>\n      <h2>{t.sajuNeedPetTitle}</h2><p className="bg-sub">{t.sajuNeedPetBody}</p>\n      <button className="bg-btn feature-empty-btn" onClick={onGoRegister}>{t.sajuGoRegisterBtn}</button>\n    </div></div>\n  );`;

const btiOld=`  if (!pet) return (\n    <div className="feature-module-shell"><div className="bg-card" style={{ textAlign: "center" }}>\n      <PetBtiIcon style={{ width: 40, height: 40, color: "var(--primary)", margin: "0 auto 14px" }} />\n      <h2 style={{ fontSize: 19, marginBottom: 6 }}>{t.sajuNeedPetTitle}</h2>\n      <p className="bg-sub" style={{ fontSize: 13, marginBottom: 22 }}>\n        {lang === "en"\n          ? "PetBTI is only available for pets registered under My Pets. Please register a pet first."\n          : "PetBTI는 '우리 아이'에 등록한 반려동물만 이용할 수 있어요. 먼저 반려동물을 등록해주세요."}\n      </p>\n      <button className="bg-btn" style={{ width: "100%", fontSize: 15 }} onClick={onGoRegister}>{t.sajuGoRegisterBtn}</button>\n    </div></div>\n  );`;
const btiNew=`  if (!pet) return (\n    <div className="feature-module-shell feature-empty-shell"><div className="bg-card feature-empty-card">\n      <div className="feature-empty-icon"><PetBtiIcon style={{ width: 38, height: 38, color: "var(--primary)" }} /></div>\n      <h2>{t.sajuNeedPetTitle}</h2>\n      <p className="bg-sub">\n        {lang === "en"\n          ? "PetBTI is only available for pets registered under My Pets. Please register a pet first."\n          : "PetBTI는 '우리 아이'에 등록한 반려동물만 이용할 수 있어요. 먼저 반려동물을 등록해주세요."}\n      </p>\n      <button className="bg-btn feature-empty-btn" onClick={onGoRegister}>{t.sajuGoRegisterBtn}</button>\n    </div></div>\n  );`;

if(!app.includes(sajuOld)) throw new Error('Saju empty state target not found');
if(!app.includes(btiOld)) throw new Error('PetBTI empty state target not found');
app=app.replace(sajuOld,sajuNew).replace(btiOld,btiNew);

const cssAnchor='.feature-module-shell';
const css=`\n/* Centered empty state for Pet사주 / PetBTI */\n.feature-empty-shell{display:flex;justify-content:center;align-items:flex-start;padding-top:26px;padding-bottom:34px}\n.feature-empty-card{width:min(100%,560px);margin:0 auto;padding:34px 34px 30px!important;text-align:center;border:1px solid #E7ECE8;box-shadow:0 10px 28px rgba(57,83,64,.055)}\n.feature-empty-icon{width:66px;height:66px;margin:0 auto 17px;border-radius:20px;display:grid;place-items:center;background:#F3F8F4}\n.feature-empty-card h2{font-size:20px;line-height:1.4;margin:0 0 9px;color:var(--text)}\n.feature-empty-card p{max-width:440px;margin:0 auto 22px;font-size:13px;line-height:1.7;word-break:keep-all}\n.feature-empty-btn{width:auto!important;min-width:230px;max-width:100%;padding:13px 24px!important;font-size:14px!important;border-radius:13px!important}\n@media(max-width:700px){.feature-empty-shell{padding-top:14px}.feature-empty-card{width:100%;padding:28px 20px 24px!important}.feature-empty-icon{width:58px;height:58px;border-radius:18px}.feature-empty-card h2{font-size:19px}.feature-empty-card p{font-size:12.5px;margin-bottom:20px}.feature-empty-btn{width:100%!important;min-width:0}}\n`;
const styleEnd=app.lastIndexOf('</style>');
if(styleEnd<0) throw new Error('style end not found');
app=app.slice(0,styleEnd)+css+app.slice(styleEnd);
fs.writeFileSync(path,app);
console.log('Centered PetSaju/PetBTI empty states applied');
