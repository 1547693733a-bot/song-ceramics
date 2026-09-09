import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../src/Prototype.tsx', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../src/prototype.css', import.meta.url), 'utf8');
const icons = fs.readFileSync(new URL('../src/KilnUiIcon.tsx', import.meta.url), 'utf8');
const shared = css.slice(css.indexOf('/* Song-inspired reading:'));

test('both scene renderers use one accessible functional icon family and Chinese chapter labels', () => {
  assert.doesNotMatch(source, /@radix-ui\/react-icons/);
  assert.equal((source.match(/<KilnUiIcon kind="back"/g) ?? []).length, 2);
  assert.equal((source.match(/<KilnUiIcon kind="close"/g) ?? []).length, 1);
  assert.equal((source.match(/<KilnUiIcon kind=\{.*?"sound" : "muted"\}/g) ?? []).length, 2);
  assert.match(icons, /aria-hidden="true" focusable="false"/);
  assert.match(source, /SCENE_NUMERALS\[traitIndex\]/);
  assert.match(source, /SCENE_NUMERALS\[sceneIndex\]/);
  assert.doesNotMatch(source, /hotspotIndex/);
});

test('restrained controls retain touch targets and quiet knowledge markers', () => {
  const controls = shared.slice(shared.indexOf('/* Shared reading'), shared.indexOf('.kiln-ui-icon'));
  assert.match(controls, /width: 44px/);
  assert.match(controls, /height: 44px/);
  const marker = shared.match(/:is\(\.cizhou-trait-hotspot, \.kiln-story-hotspot\) i \{([^}]+)\}/)?.[1];
  assert.ok(marker);
  assert.match(marker, /animation: none/);
  assert.match(marker, /backdrop-filter: none/);
  assert.match(shared, /min-height: 44px/);
  assert.match(shared, /\.bottom-sheet:has\(\.kiln-knowledge-content\)/);
  assert.match(shared, /background: var\(--song-paper\)/);
  assert.match(shared, /focus-visible/);
});

test('Chinese reading fonts are local, licensed, small and cover visible copy', () => {
  const faces = [...css.matchAll(/@font-face\s*\{([^}]+)\}/g)].filter(m => m[1].includes('Song Reading'));
  assert.equal(faces.length, 3);
  const coverage = new Set();
  let bytes = 0;
  for (const [, face] of faces) {
    assert.match(face, /font-display: swap/);
    const relative = face.match(/url\("(\/assets\/fonts\/[^\"]+)"\)/)?.[1];
    assert.ok(relative);
    const data = fs.readFileSync(new URL(`../public${relative}`, import.meta.url));
    assert.equal(data.toString('ascii', 0, 4), 'wOF2');
    bytes += data.length;
    for (const match of face.matchAll(/U\+([0-9A-F]+)/g)) coverage.add(parseInt(match[1], 16));
  }
  assert.ok(bytes < 200 * 1024, `${bytes} bytes`);
  assert.match(fs.readFileSync(new URL('../public/assets/fonts/OFL.txt', import.meta.url), 'utf8'), /SIL OPEN FONT LICENSE/);
  const file = ts.createSourceFile('Prototype.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const ignored = new Set(['fact', 'reconstruction', 'sourceLabel', 'soundscape']);
  function visit(node) {
    let text = '';
    if (ts.isStringLiteralLike(node)) {
      const key = ts.isPropertyAssignment(node.parent) ? node.parent.name.getText(file) : '';
      if (!ignored.has(key) && /[\u3400-\u9fff]/u.test(node.text)) text = node.text;
    }
    if (ts.isJsxText(node)) text = node.text;
    for (const c of text) if (/[\u00a0-\uffff]/u.test(c)) {
      assert.ok(coverage.has(c.codePointAt(0)), `Missing local glyph: ${c}`);
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
});

test('glass controls and reading sheet have readable fallback and accessibility overrides', () => {
  assert.match(shared, /--song-control-fill: rgb\(25 32 28 \/ 0\.68\)/);
  assert.match(shared, /@supports \(\(backdrop-filter: blur\(8px\)\)/);
  assert.match(shared, /--song-control-fill: rgb\(25 32 28 \/ 0\.32\)/);
  assert.match(shared, /-webkit-backdrop-filter: var\(--song-control-blur\)/);
  assert.match(shared, /prefers-reduced-transparency: reduce/);
  assert.match(shared, /prefers-contrast: more/);
  const sheet = shared.match(/\.bottom-sheet:has\(\.kiln-knowledge-content\) \{\s*height:[^}]+\}/)?.[0];
  assert.ok(sheet);
  assert.doesNotMatch(sheet, /backdrop-filter/);
  assert.match(sheet, /background: var\(--song-paper\)/);
  assert.match(shared, /background: rgb\(239 237 226 \/ 0\.78\)/);
  assert.match(shared, /-webkit-backdrop-filter: blur\(16px\)/);
  assert.match(shared, /prefers-reduced-transparency: reduce[^}]+\.bottom-sheet:has\(\.kiln-knowledge-content\) \{[^}]+backdrop-filter: none/s);
});

test('five Phosphor Light icons retain attribution, geometry and local-only delivery', () => {
  assert.match(icons, /github.com\/phosphor-icons\/core/);
  assert.match(icons, /viewBox="0 0 256 256"/);
  assert.match(icons, /fill="currentColor"/);
  const keys = [...icons.matchAll(/^  "(back|close|sound|muted|read)":/gm)];
  assert.equal(keys.length, 5);
  assert.equal((source.match(/<KilnUiIcon kind="read"/g) ?? []).length, 3);
  assert.doesNotMatch(icons, /fetch\(|dangerouslySetInnerHTML|<image/);
  assert.match(fs.readFileSync(new URL('../public/assets/licenses/phosphor-MIT.txt', import.meta.url), 'utf8'), /Copyright \(c\) 2023 Phosphor Icons/);
});
