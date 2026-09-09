// Fetch only the glyphs used by the app; prints CSS/license for apply_patch.
// Binary font downloads are local assets. No font service is contacted at runtime.
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const root = path.resolve(import.meta.dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/Prototype.tsx'), 'utf8');
const ast = ts.createSourceFile('Prototype.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const ignored = new Set(['fact', 'reconstruction', 'sourceLabel', 'soundscape']);
let text = '一二三四五六七八九十〇宋瓷八窑赏器归静声音返回关闭开启轻触焰心';
function visit(node) {
  if (ts.isStringLiteralLike(node)) {
    const key = ts.isPropertyAssignment(node.parent) ? node.parent.name.getText(ast) : '';
    if (!ignored.has(key) && /[\u3400-\u9fff]/u.test(node.text)) text += node.text;
  }
  if (ts.isJsxText(node)) text += node.text;
  ts.forEachChild(node, visit);
}
visit(ast);
const glyphs = [...new Set([...text].filter(c => /[\u00a0-\uffff]/u.test(c)))].sort();
const dir = path.join(root, 'public/assets/fonts');
fs.mkdirSync(dir, { recursive: true });
const fontFaces = [];
const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' };
async function get(url) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  return response;
}
let bytes = 0;
for (let i = 0; i < glyphs.length; i += 350) {
  const subset = glyphs.slice(i, i + 350);
  const css = await (await get(`https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400&display=swap&text=${encodeURIComponent(subset.join(''))}`)).text();
  const match = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)\s+format\('([^']+)'\)/);
  if (!match) throw new Error('Unexpected Google Fonts stylesheet');
  const data = Buffer.from(await (await get(match[1])).arrayBuffer());
  const extension = match[2] === 'woff2' ? 'woff2' : 'ttf';
  const name = `song-reading-${i / 350 + 1}.${extension}`;
  if (extension === 'woff2' && data.toString('ascii', 0, 4) !== 'wOF2') throw new Error('Not a WOFF2 font');
  fs.writeFileSync(path.join(dir, name), data);
  bytes += data.length;
  const unicode = subset.map(c => `U+${c.codePointAt(0).toString(16).toUpperCase()}`).join(',');
  fontFaces.push(`@font-face {\n  font-family: "Song Reading";\n  font-style: normal;\n  font-weight: 400;\n  font-display: swap;\n  src: url("/assets/fonts/${name}") format("${match[2]}");\n  unicode-range: ${unicode};\n}`);
}
const license = await (await get('https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/OFL.txt')).text();
process.stdout.write(JSON.stringify({ glyphCount: glyphs.length, bytes, css: fontFaces.join('\n\n'), license }));
