import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../src/Prototype.tsx', import.meta.url), 'utf8');
const component = source.slice(source.indexOf('function ScenePlaybackStatus('), source.indexOf('function CizhouKnowledgeExperience('));
const executable = ts.transpile(component, { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React });

function video(overrides = {}) {
  const listeners = new Map();
  return { paused: false, ended: false, readyState: 4, error: null, style: { opacity: '1' }, listeners,
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: (name) => listeners.delete(name),
    emit: (name) => listeners.get(name)?.(), ...overrides };
}
function mount(primary, secondary) {
  let state = 'quiet', cleanup, sequence = 0;
  const timers = new Map();
  const document = { hidden: false };
  const context = vm.createContext({ document,
    useState: (initial) => [initial, (next) => { state = next; }],
    useEffect: (effect) => { cleanup = effect(); },
    window: { setTimeout: (fn) => { timers.set(++sequence, fn); return sequence; }, clearTimeout: (id) => timers.delete(id) },
  });
  vm.runInContext(executable, context);
  context.ScenePlaybackStatus({ videoRefs: { current: [primary] }, secondaryRefs: { current: [secondary] }, activeIndex: 0, enabled: true });
  return { get state() { return state; }, document, cleanup,
    flush() { const pending = [...timers.values()]; timers.clear(); pending.forEach((fn) => fn()); },
    get pending() { return timers.size; } };
}

test('normal playback has no overlay', () => {
  const h = mount(video()); h.flush(); assert.equal(h.state, 'quiet'); h.cleanup();
});
test('paused primary during secondary loop handoff is not blocked autoplay', () => {
  const primary = video({ paused: true, style: { opacity: '0' } });
  const secondary = video(); const h = mount(primary, secondary);
  h.flush(); assert.equal(h.state, 'quiet');
  primary.emit('pause'); h.flush(); assert.equal(h.state, 'quiet');
  h.cleanup(); assert.equal(primary.listeners.size + secondary.listeners.size, 0);
});
test('foreground load, autoplay block and failure produce distinct states', () => {
  for (const [overrides, expected] of [
    [{ readyState: 1, paused: true }, 'loading'],
    [{ paused: true }, 'blocked'],
    [{ paused: true, error: { code: 4 } }, 'error'],
  ]) {
    const active = video(overrides); const h = mount(active);
    h.flush(); assert.equal(h.state, expected);
    active.emit('playing'); assert.equal(h.state, 'quiet'); h.cleanup();
  }
});
test('hidden page and disposed scene cannot display delayed warnings', () => {
  const active = video({ paused: true }); const h = mount(active);
  h.document.hidden = true; h.flush(); assert.equal(h.state, 'quiet');
  active.emit('pause'); h.cleanup(); assert.equal(h.pending, 0);
});
