const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup(fetch) {
  function element() {
    return {
      children: [], events: {}, value: '', dataset: {},
      addEventListener(name, callback) { this.events[name] = callback; },
      appendChild(child) { this.children.push(child); },
      replaceChildren() { this.children = []; },
      setAttribute(name, value) { this[name] = value; },
      removeAttribute(name) { delete this[name]; },
      click() { this.clicked = true; }
    };
  }
  const ids = Object.fromEntries(['beautifuljekyll-search-overlay', 'nav-search-link', 'nav-search-input', 'search-results-container', 'nav-search-exit'].map(id => [id, element()]));
  ids['beautifuljekyll-search-overlay'].dataset = {indexUrl: '/search-index.json?v=hash', loading: 'Loading', error: 'Retry', empty: 'No results'};
  const context = {
    document: {getElementById: id => ids[id], createElement: element, addEventListener(name, callback) { callback(); }},
    window: {location: {href: 'https://example.test/', origin: 'https://example.test'}},
    URL, fetch
  };
  vm.runInNewContext(fs.readFileSync('assets/js/search.js', 'utf8'), context);
  return {trigger: ids['nav-search-link'], input: ids['nav-search-input'], results: ids['search-results-container'], exit: ids['nav-search-exit']};
}

test('lazy single-flight loading, accent folding, safe output and memory reuse', async () => {
  let calls = 0;
  let resolve;
  const ui = setup(url => {
    calls++;
    assert.equal(url, '/search-index.json?v=hash');
    return new Promise(done => { resolve = done; });
  });
  assert.equal(calls, 0);
  const loading = ui.trigger.events.click();
  ui.input.value = 'anh dep';
  assert.equal(ui.input.events.input(), loading);
  assert.equal(calls, 1);
  resolve({ok: true, json: async () => [
    {title: 'Ảnh đẹp <img onerror=alert(1)>', category: 'Du lịch', url: '/posts/photo/'},
    {title: 'Ảnh đẹp unsafe', url: 'javascript:alert(1)'},
    {title: 'Ảnh đẹp external', url: 'https://outside.test/'}
  ]});
  await loading;
  assert.equal(ui.results.children.length, 1);
  const link = ui.results.children[0].children[0];
  assert.equal(link.textContent, 'Ảnh đẹp <img onerror=alert(1)>');
  assert.equal(link.href, '/posts/photo/');
  ui.input.value = 'du lich';
  await ui.input.events.input();
  assert.equal(ui.results.children.length, 1);
  assert.equal(calls, 1);
  ui.input.value = 'not found';
  await ui.input.events.input();
  assert.equal(ui.results.children[0].textContent, 'No results');
  ui.input.value = '';
  await ui.input.events.input();
  assert.equal(ui.results.children.length, 0);
  ui.exit.events.keydown({key: 'Enter', preventDefault() {}});
  assert.equal(ui.exit.clicked, true);
});

test('failures retry, results limited and Vietnamese d folding works', async () => {
  let calls = 0;
  const ui = setup(async () => {
    calls++;
    if (calls === 1) throw new Error('offline');
    if (calls === 2) return {ok: false};
    if (calls === 3) return {ok: true, json: async () => ({wrong: true})};
    return {ok: true, json: async () => Array.from({length: 15}, (_, i) => ({title: 'Đà Nẵng ' + i, url: '/posts/' + i + '/'}))};
  });
  ui.input.value = 'da nang';
  for (let i = 0; i < 3; i++) {
    await ui.trigger.events.click();
    assert.equal(ui.results.children[0].textContent, 'Retry');
  }
  await ui.input.events.input();
  assert.equal(calls, 4);
  assert.equal(ui.results.children.length, 10);
});
