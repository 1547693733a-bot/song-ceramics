import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Exercise the real app controller with a deterministic frame clock, without
// modifying the protected Carousel or depending on a GPU/video decoder.
const source = fs.readFileSync(new URL('../src/Prototype.tsx', import.meta.url), 'utf8');
const sourceFile = ts.createSourceFile('Prototype.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const controllerNode = sourceFile.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'installSceneNavigation');
assert.ok(controllerNode, 'scene navigation controller exists');
const controller = controllerNode.getText(sourceFile);
const executable = ts.transpile(controller, { target: ts.ScriptTarget.ES2022 });
function harness(prefix = 'story', initialIndex = 0, reducedMotion = false) {
  class Node {
    dataset = {};
    listeners = new Map();
    properties = new Map();
    style = { setProperty: (key, value) => this.properties.set(key, value) };
    children = [];
    clientWidth = 400;
    scrollLeft = 0;
    addEventListener(type, fn) { this.listeners.set(type, fn); }
    removeEventListener(type) { this.listeners.delete(type); }
    setAttribute() {}
    emit(type, event = {}) { this.listeners.get(type)?.({ type, ...event }); }
  }
  const root = new Node(), viewport = new Node(), track = new Node(), win = new Node();
  track.children = Array.from({ length: 5 }, () => new Node());
  const layers = Array.from({ length: 3 }, () => new Node());
  root.querySelector = () => viewport;
  root.querySelectorAll = (selector) => selector === '[data-scene-slice]' ? [] : layers;
  viewport.querySelector = () => track;
  let id = 0, time = 40000, resizeCallback;
  const frames = new Map(), timers = new Map(), tweens = new Set(), commits = [];
  win.requestAnimationFrame = (fn) => { frames.set(++id, fn); return id; };
  win.cancelAnimationFrame = (key) => frames.delete(key);
  win.setTimeout = (fn) => { timers.set(++id, fn); return id; };
  win.clearTimeout = (key) => timers.delete(key);
  const context = vm.createContext({ window: win,
    ResizeObserver: class { constructor(fn) { resizeCallback = fn; } observe() {} disconnect() {} },
    clamp: (value, low, high) => Math.min(high, Math.max(low, value)),
    wrapIndex: (value, count) => ((value % count) + count) % count,
    gsap: {
      quickSetter: () => (x) => { track.style.transform = `translateX(${x}px)`; },
      set: (node) => { node.style.transform = ''; },
      to: (value, options) => {
        const tween = { kill: () => tweens.delete(tween), complete: () => {
          value.position = options.position;
          options.onUpdate(); tweens.delete(tween); options.onComplete();
        } };
        tweens.add(tween); return tween;
      },
    },
  });
  vm.runInContext(executable, context);
  const dispose = context.installSceneNavigation({ root, prefix, sceneIds: ['first', 'second', 'third'],
    initialIndex, reducedMotion, onCommit: (index) => commits.push(index), onMove() {} });
  const frame = () => {
    time += 16;
    const pending = [...frames.values()]; frames.clear(); pending.forEach((fn) => fn(time));
  };
  const flush = () => {
    frame(); const pending = [...timers.values()]; timers.clear(); pending.forEach((fn) => fn());
    [...tweens].forEach((tween) => tween.complete()); frame();
  };
  frame();
  return { root, viewport, layers, win, commits, dispose, frame, flush, frames, timers, tweens,
    resize: (width) => { viewport.clientWidth = width; resizeCallback(); },
    drag: (position) => { viewport.scrollLeft = position * viewport.clientWidth; viewport.emit('scroll'); frame(); },
    alpha: (index) => Number(layers[index].properties.get(prefix === 'story' ? '--story-scene-opacity' : '--scene-layer-opacity')),
  };
}

for (const prefix of ['cizhou', 'story']) {
  test(`${prefix}: RAF timestamp never becomes page position; midpoint does not darken`, () => {
    const h = harness(prefix);
    h.viewport.emit('pointerdown', { pointerId: 1 }); h.drag(1.5);
    assert.equal(h.alpha(0), 1); assert.equal(h.alpha(1), 0.5); assert.equal(h.alpha(2), 0);
    assert.equal(h.alpha(1) + h.alpha(0) * (1 - h.alpha(1)), 1);
    h.dispose();
  });
  test(`${prefix}: holding still cannot trigger settlement`, () => {
    const h = harness(prefix);
    h.viewport.emit('pointerdown', { pointerId: 1 }); h.drag(1.7); h.flush();
    assert.equal(h.commits.length, 0);
    h.win.emit('pointerup', { pointerId: 1 }); h.flush();
    assert.deepEqual(h.commits, [1]); assert.equal(h.viewport.scrollLeft, 800);
    h.dispose();
  });
  test(`${prefix}: last to first and first to last reconcile invisibly`, () => {
    const h = harness(prefix, 2);
    h.viewport.emit('pointerdown', { pointerId: 1 }); h.drag(4); h.win.emit('pointerup', { pointerId: 1 });
    h.flush(); assert.equal(h.commits.at(-1), 0); assert.equal(h.viewport.scrollLeft, 400);
    h.viewport.emit('pointerdown', { pointerId: 2 }); h.drag(0); h.win.emit('pointerup', { pointerId: 2 });
    h.flush(); assert.equal(h.commits.at(-1), 2); assert.equal(h.viewport.scrollLeft, 1200);
    assert.equal(h.alpha(2), 1); h.dispose();
  });
  test(`${prefix}: both keyboard directions cycle all three chapters`, () => {
    const h = harness(prefix);
    for (const key of ['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft']) {
      h.root.emit('keydown', { key, preventDefault() {}, stopPropagation() {} }); h.flush();
    }
    assert.deepEqual(h.commits, [1, 2, 0, 2, 1, 0]); h.dispose();
  });
  test(`${prefix}: touching during settle cannot queue another page; resize and disposal clean up`, () => {
    const h = harness(prefix);
    h.drag(1.7);
    [...h.timers.values()].forEach((fn) => fn()); h.timers.clear();
    assert.equal(h.tweens.size, 1);
    h.viewport.emit('pointerdown', { pointerId: 2 }); assert.equal(h.tweens.size, 1);
    h.resize(427); h.frame(); assert.equal(h.viewport.scrollLeft, 854);
    h.dispose(); assert.equal(h.frames.size, 0); assert.equal(h.timers.size, 0);
    assert.equal(h.win.listeners.size, 0); assert.equal(h.viewport.listeners.size, 0);
  });
  test(`${prefix}: a light swipe selects one neighbour before release momentum`, () => {
    const h = harness(prefix);
    h.viewport.emit('pointerdown', { pointerId: 1 }); h.drag(1.08);
    h.win.emit('pointerup', { pointerId: 1 });
    assert.equal(h.tweens.size, 1, 'snap begins immediately on release');
    h.drag(3.8); h.flush();
    assert.deepEqual(h.commits, [1]); assert.equal(h.viewport.scrollLeft, 800);
    h.drag(4); h.flush(); h.drag(3.2); h.flush();
    assert.deepEqual(h.commits, [1], 'late inertia cannot create another chapter');
    assert.equal(h.viewport.scrollLeft, 800);
    h.viewport.emit('pointerdown', { pointerId: 2 }); h.drag(1.92);
    h.win.emit('pointerup', { pointerId: 2 }); h.flush();
    assert.deepEqual(h.commits, [1, 0]); h.dispose();
  });
  test(`${prefix}: a long fast drag still advances just one scene`, () => {
    const h = harness(prefix);
    h.viewport.emit('pointerdown', { pointerId: 1 }); h.drag(4);
    assert.equal(h.alpha(1), 1); assert.equal(h.alpha(2), 0);
    h.win.emit('pointerup', { pointerId: 1 }); h.flush();
    assert.deepEqual(h.commits, [1]); h.dispose();
  });
  test(`${prefix}: tap jitter and cancelled gestures return to the same scene`, () => {
    const h = harness(prefix);
    h.viewport.emit('pointerdown', { pointerId: 1 }); h.drag(1.02);
    h.win.emit('pointerup', { pointerId: 1 }); h.flush();
    assert.equal(h.commits.at(-1), 0);
    h.viewport.emit('pointerdown', { pointerId: 2 }); h.drag(1.8);
    h.win.emit('pointercancel', { pointerId: 2 }); h.flush();
    assert.equal(h.commits.at(-1), 0); h.dispose();
  });
  test(`${prefix}: detail modal ignores navigation and reduced motion settles immediately`, () => {
    const h = harness(prefix, 0, true);
    h.root.dataset.detailOpen = 'true';
    h.root.emit('keydown', { key: 'ArrowRight', preventDefault() {}, stopPropagation() {} });
    assert.equal(h.commits.length, 0);
    h.root.dataset.detailOpen = 'false'; h.drag(1.8); h.flush();
    assert.equal(h.tweens.size, 0); assert.equal(h.commits.at(-1), 1); h.dispose();
  });
}
