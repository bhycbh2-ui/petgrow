import fs from 'node:fs';

const file = 'src/App.jsx';
let s = fs.readFileSync(file, 'utf8');
const MARK = 'HOME_INFO_MUSIC_SAFE_20260819';

if (s.includes(MARK)) {
  console.log('home info/music React patch already applied');
  process.exit(0);
}

const importLine = 'import HomeInfoMusicSections from "./HomeInfoMusicSections.jsx";\n';
if (!s.includes('HomeInfoMusicSections from "./HomeInfoMusicSections.jsx"')) {
  s = importLine + s;
}

const classMatch = /className\s*=\s*["'][^"']*\bdash-quick-grid\b[^"']*["']/.exec(s);
if (!classMatch) throw new Error('dash-quick-grid anchor not found');

const classIndex = classMatch.index;
const openStart = s.lastIndexOf('<', classIndex);
if (openStart < 0) throw new Error('quick grid opening tag not found');

const openTagMatch = s.slice(openStart, classIndex + classMatch[0].length + 200).match(/^<([A-Za-z][A-Za-z0-9]*)\b/);
if (!openTagMatch) throw new Error('quick grid tag name not found');
const tag = openTagMatch[1];
const tokenRe = new RegExp(`<${tag}\\b[^>]*>|<\\/${tag}\\s*>`, 'g');
tokenRe.lastIndex = openStart;
let depth = 0;
let closeEnd = -1;
let token;
while ((token = tokenRe.exec(s))) {
  if (token[0].startsWith(`</${tag}`)) {
    depth -= 1;
    if (depth === 0) {
      closeEnd = tokenRe.lastIndex;
      break;
    }
  } else if (!token[0].endsWith('/>')) {
    depth += 1;
  }
}
if (closeEnd < 0) throw new Error('quick grid closing tag not found');

const insert = `\n      {/* ${MARK} */}\n      <HomeInfoMusicSections lang={lang} onGoView={onGoView} tips={TIPS_DATA} />`;
s = s.slice(0, closeEnd) + insert + s.slice(closeEnd);

fs.writeFileSync(file, s);
console.log('safe React PetInfo + PetMusic home sections applied');
