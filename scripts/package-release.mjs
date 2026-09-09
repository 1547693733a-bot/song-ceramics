import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const client = path.join(root, 'dist/client');
const release = path.join(root, 'release');
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const lock = JSON.parse(readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
if (!existsSync(path.join(client, 'index.html'))) throw new Error('Run npm run build first.');

// Ship the dependency license texts alongside the distributable.
let notices = '宋瓷 · 八窑 — third-party notices\n\n';
for (const [relative, metadata] of Object.entries(lock.packages)) {
  if (!relative.startsWith('node_modules/') || metadata.dev) continue;
  const directory = path.join(root, relative);
  if (!existsSync(directory)) continue;
  for (const file of readdirSync(directory).filter(name => /^(license|licence|copying|notice)(\.|$)/i.test(name))) {
    const text = readFileSync(path.join(directory, file), 'utf8');
    notices += `\n=== ${relative} ${metadata.version} / ${file} ===\n${text}\n`;
  }
}
writeFileSync(path.join(client, 'THIRD-PARTY-NOTICES.txt'), notices);
writeFileSync(path.join(client, 'version.json'), JSON.stringify({name: '宋瓷 · 八窑', version: pkg.version}, null, 2) + '\n');

const walk = directory => readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
  const file = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(file) : [file];
});
const files = walk(client).sort().map(file => {
  const data = readFileSync(file);
  return {path: path.relative(client, file).replaceAll('\\', '/'), bytes: data.length,
    sha256: createHash('sha256').update(data).digest('hex')};
});
mkdirSync(release, {recursive: true});
const archive = path.join(release, `song-ceramics-web-${pkg.version}.zip`);
execFileSync('tar', ['-a', '-cf', archive, '-C', client, '.']);
const sha256 = createHash('sha256').update(readFileSync(archive)).digest('hex');
const manifest = {version: pkg.version, archive: path.basename(archive), sha256,
  totalBytes: files.reduce((total, file) => total + file.bytes, 0), files};
writeFileSync(path.join(release, `song-ceramics-web-${pkg.version}.manifest.json`), JSON.stringify(manifest, null, 2) + '\n');
writeFileSync(path.join(release, 'SHA256SUMS.txt'), `${sha256}  ${path.basename(archive)}\n`);
console.log(`Packaged ${files.length} files, ${(manifest.totalBytes / 1024 / 1024).toFixed(1)} MiB.\n${archive}\nSHA256 ${sha256}`);
