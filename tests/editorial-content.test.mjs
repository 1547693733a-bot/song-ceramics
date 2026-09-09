import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../src/Prototype.tsx', import.meta.url), 'utf8');
const file = ts.createSourceFile('Prototype.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function readData(name) {
  let initializer;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(file) === name) initializer = node.initializer;
    ts.forEachChild(node, visit);
  }
  visit(file);
  assert.ok(initializer, `${name} exists`);
  const js = ts.transpileModule(`(${initializer.getText(file)})`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  return vm.runInNewContext(js);
}
const kilns = readData('kilns');
const stories = readData('kilnStories');
const cizhou = readData('cizhouTraits');
const scenes = [...Object.values(stories).flatMap(story => Array.from(story.scenes)), ...cizhou];

test('all eight kilns and 24 scenes have complete, concise educational copy', () => {
  assert.equal(kilns.length, 8);
  assert.equal(scenes.length, 24);
  assert.equal(new Set(kilns.map(kiln => kiln.id)).size, 8);
  for (const kiln of kilns) {
    for (const key of ['name', 'feature', 'vessel', 'description']) assert.ok(kiln[key]?.trim(), `${kiln.id}.${key}`);
  }
  for (const group of [...Object.values(stories).map(story => story.scenes), cizhou]) {
    assert.equal(group.length, 3);
    assert.equal(Array.from(group, scene => scene.number).join(','), '01,02,03');
  }
  for (const scene of scenes) {
    for (const key of ['title', 'tagline', 'vessel', 'period', 'fact', 'reconstruction', 'sourceLabel', 'sourceUrl']) {
      assert.ok(scene[key]?.trim(), `${scene.id}.${key}`);
    }
    assert.ok(scene.title.length <= 8, scene.id);
    assert.ok(scene.tagline.length <= 30, scene.id);
    assert.ok(scene.fact.length <= 160, scene.id);
    assert.ok(scene.reconstruction.length <= 160, scene.id);
    assert.ok(scene.hotspots.length > 0, scene.id);
    for (const hotspot of scene.hotspots) {
      assert.ok(hotspot.label && hotspot.title && hotspot.body, scene.id);
      assert.ok(hotspot.label.length <= 5 && hotspot.body.length <= 160, scene.id);
      assert.ok(hotspot.x >= 0 && hotspot.x <= 100 && hotspot.y >= 0 && hotspot.y <= 100, scene.id);
    }
  }
});

test('every scene retains institutional references for internal verification', () => {
  const domains = new Set(['www.dpm.org.cn', 'intl.dpm.org.cn', 'www.chnmuseum.cn', 'www.npm.gov.tw',
    'digitalarchive.npm.gov.tw', 'z.hangzhou.com.cn', 'www.tjbwg.cn', 'www.westlakemuseum.com', 'www.mbam.qc.ca']);
  for (const scene of scenes) {
    const refs = [{ label: scene.sourceLabel, url: scene.sourceUrl }, ...(scene.additionalSources ?? [])];
    for (const ref of refs) {
      const url = new URL(ref.url);
      assert.equal(url.protocol, 'https:');
      assert.ok(domains.has(url.hostname), ref.url);
      assert.ok(ref.label.trim());
    }
  }
});

test('knowledge sheet presents one paragraph without editorial sections or source lists', () => {
  const sheet = source.slice(source.indexOf('function KilnKnowledgeSheet('), source.indexOf('function ScenePlaybackStatus('));
  assert.equal((sheet.match(/<p>/g) ?? []).length, 1);
  assert.match(sheet, /<p>\{content\?\.body\}<\/p>/);
  assert.match(sheet, /snap=\{0\.56\}/);
  assert.match(sheet, /<MobileScroll/);
  assert.doesNotMatch(sheet, /<dl|<dt|<dd|<a |观察点|器物依据|场景说明|资料来源|sourceUrl|additionalSources|description=/);
  const visible = [...kilns.map(kiln => kiln.description), ...scenes.flatMap(scene => [scene.title, scene.tagline, scene.period,
    ...scene.hotspots.flatMap(h => [h.title, h.body])])].join('\n');
  assert.doesNotMatch(visible, /本幕|本篇|画面|情境复原|艺术复原|连接窑场与市井|作为.*参照|不能据此|观察重点/);
  for (const scene of scenes) for (const hotspot of scene.hotspots) {
    assert.ok(hotspot.title.length <= 8, hotspot.title);
    assert.ok(hotspot.body.length >= 50 && hotspot.body.length <= 150, hotspot.title);
    assert.doesNotMatch(hotspot.body, /\n|[①②③]|首先|其次/);
  }
});

test('scene-specific corrections and uncertain chronologies remain explicit', () => {
  assert.equal(stories.ding.scenes[1].title, '草衬护器');
  assert.match(stories.longquan.scenes[1].fact, /贴附/);
  assert.match(stories.ru.scenes[2].fact, /温碗.*执壶/);
  assert.match(cizhou[2].vessel, /剔划黑花玉壶春瓶/);
  assert.match(stories.jun.scenes[2].fact, /元末明初/);
  assert.ok(stories.jun.scenes[2].additionalSources.some(ref => ref.url.endsWith('.pdf')));
  assert.match(stories.ge.scenes[0].fact, /年代.*窑址.*研究/);
  for (const scene of stories.ge.scenes) assert.match(scene.vessel, /^传世哥窑/);
  assert.match(stories.longquan.scenes[1].hotspots[0].body, /模具.*贴附.*施釉烧成/);
  assert.match(stories.ru.scenes[2].hotspots[0].body, /温碗.*执壶.*温水/);
  assert.match(stories.ge.scenes[0].hotspots[0].body, /年代.*窑址.*厘清/);
  assert.match(stories.jun.scenes[2].hotspots[0].body, /年代.*讨论.*元末明初/);
});

test('published educational copy contains no production instructions or obsolete route claims', () => {
  const text = scenes.map(scene => [scene.title, scene.tagline, scene.vessel, scene.period, scene.fact, scene.reconstruction,
    ...scene.hotspots.flatMap(h => [h.label, h.title, h.body])].join('\n')).join('\n');
  assert.doesNotMatch(text, /提示词|首尾帧|本幕不再|模型生成|水路入京|印花成型|官方认证/);
  assert.match(source, /轻触焰心，进入\$\{activeKiln.name\}三幕场景/);
  assert.doesNotMatch(source, /观看金丝铁线成纹|釉层由内而外逐渐白热烧成|返回窑中|三项窑口特性/);
});
