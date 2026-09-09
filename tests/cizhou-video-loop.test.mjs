import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../src/Prototype.tsx', import.meta.url), 'utf8');
const start = source.indexOf('    const loopStart = trait.videoStart ?? 0;', source.indexOf('const shouldCrossfade = trait.id'));
const end = source.indexOf('    return cleanup;', start) + '    return cleanup;'.length;
const code = ts.transpile(`function install() { ${source.slice(start, end)} }`, { target: ts.ScriptTarget.ES2022 });

test('Cizhou seam waits for metadata and completes at the media end', () => {
  let sequence = 0;
  const frames = new Map();
  const media = () => ({ duration: NaN, currentTime: 0, ended: false, readyState: 4, style: {}, paused: false,
    play() { this.paused = false; return Promise.resolve(); }, pause() { this.paused = true; } });
  const primary = media(), secondary = media(); secondary.paused = true;
  const context = vm.createContext({ primary, secondary, trait: { videoStart: 0 }, audioEnabled: false,
    sceneVideoCrossfadeCleanupRef: { current: null },
    clamp: (value, min, max) => Math.min(max, Math.max(min, value)),
    window: { requestAnimationFrame: (fn) => { frames.set(++sequence, fn); return sequence; }, cancelAnimationFrame: (id) => frames.delete(id) } });
  vm.runInContext(code, context);
  const cleanup = context.install();
  const tick = () => { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach((fn) => fn()); };
  tick(); assert.equal(secondary.paused, true);
  primary.duration = secondary.duration = 8;
  secondary.readyState = 0;
  primary.currentTime = 7; tick(); assert.equal(secondary.paused, false);
  primary.currentTime = 8; primary.ended = true; primary.paused = true; tick();
  assert.equal(primary.currentTime, 0);
  assert.equal(primary.paused, false);
  assert.equal(primary.style.opacity, '1');
  assert.equal(secondary.style.opacity, '0');
  primary.ended = false; primary.currentTime = 7; secondary.readyState = 4; tick();
  primary.currentTime = 8; primary.ended = true; tick();
  assert.equal(primary.paused, true);
  assert.equal(secondary.style.opacity, '1');
  assert.equal(primary.currentTime, 0);
  cleanup(); assert.equal(frames.size, 0);
});
