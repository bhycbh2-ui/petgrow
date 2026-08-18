import fs from 'node:fs';

const file = 'src/App.jsx';
let s = fs.readFileSync(file, 'utf8');
const MARK = 'HOME_INFO_MUSIC_SAFE_20260819';
const component = `<HomeInfoMusicSections lang={lang} onGoView={onGoView} tips={TIPS_DATA} />`;
const block = `      {/* ${MARK} */}\n      ${component}`;

const importLine = 'import HomeInfoMusicSections from "./HomeInfoMusicSections.jsx";\n';
if (!s.includes('HomeInfoMusicSections from "./HomeInfoMusicSections.jsx"')) {
  s = importLine + s;
}

if (s.includes(MARK)) {
  const nestedPattern = new RegExp(`\\n\\s*\\{\\/\\* ${MARK} \\*\\/\\}\\n\\s*<HomeInfoMusicSections[^>]*\\/>\\s*(<\\/section>)`);
  if (nestedPattern.test(s)) {
    s = s.replace(nestedPattern, `$1\n\n${block}`);
    fs.writeFileSync(file, s);
    console.log('moved PetInfo + PetMusic sections outside quick menu section');
  } else {
    console.log('home info/music React patch already correctly placed');
  }
  process.exit(0);
}

const classMatch = /className\s*=\s*["'][^"']*\bdash-quick-grid\b[^"']*["']/.exec(s);
if (!classMatch) throw new Error('dash-quick-grid anchor not found');

const gridIndex = classMatch.index;
const sectionStart = s.lastIndexOf('<section', gridIndex);
if (sectionStart < 0) throw new Error('quick menu section start not found');

const tokenRe = /<section\b[^>]*>|<\/section\s*>/g;
tokenRe.lastIndex = sectionStart;
let depth = 0;
let sectionEnd = -1;
let token;
while ((token = tokenRe.exec(s))) {
  if (token[0].startsWith('</section')) {
    depth -= 1;
    if (depth === 0) {
      sectionEnd = tokenRe.lastIndex;
      break;
    }
  } else if (!token[0].endsWith('/>')) {
    depth += 1;
  }
}
if (sectionEnd < 0) throw new Error('quick menu section end not found');

s = s.slice(0, sectionEnd) + `\n\n${block}` + s.slice(sectionEnd);
fs.writeFileSync(file, s);
console.log('safe React PetInfo + PetMusic home sections applied');
