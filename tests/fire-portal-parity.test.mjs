import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../src/prototype.css', import.meta.url), 'utf8');
const source = fs.readFileSync(new URL('../src/Prototype.tsx', import.meta.url), 'utf8');

test('Longquan inherits the shared portal compositing without hidden layers', () => {
  const shared = css.match(/^\.kiln-fire-portal\s*\{([^}]+)\}/m)[1];
  const longquan = css.match(/\.kiln-fire-portal\[data-motion="longquan"\]\s*\{([^}]+)\}/)[1];
  assert.match(shared, /mix-blend-mode:\s*screen/);
  assert.doesNotMatch(longquan, /(?:isolation|mix-blend-mode|display|opacity)\s*:/);
  assert.doesNotMatch(css, /\.kiln-fire-portal\[data-motion="longquan"\]\s+\.fire-portal-(?:fallback|echo)\s*\{/);
});

test('Longquan retains its established artwork, filter and movement settings', () => {
  const longquan = css.match(/\.kiln-fire-portal\[data-motion="longquan"\]\s*\{([^}]+)\}/)[1];
  assert.match(longquan, /--fire-duration:\s*4\.5s/);
  assert.match(longquan, /--fire-filter:\s*saturate\(0\.96\) contrast\(1\.08\) brightness\(0\.98\)/);
  assert.match(source, /fire:\s*"\/assets\/kilns\/fire-portals\/longquan-fire-v1\.webp"/);
  assert.match(source, /fireMotion:\s*"longquan"/);
  assert.match(source, /className="fire-portal-layer fire-portal-echo"/);
});
