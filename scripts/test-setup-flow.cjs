const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function setup(hash = '#teams') {
  const names = ['teams','settings','categories'];
  const panels = names.map(setupPanel => ({ dataset: { setupPanel }, hidden: false }));
  const buttons = names.map(step => ({ dataset: { step }, disabled: false,
    setAttribute(k,v) { this[k]=v; }, removeAttribute(k) { delete this[k]; },
    addEventListener(_, fn) { this.click=fn; } }));
  const navigation = {};
  const location = { hash };
  const events = {};
  const context = { location, history: { pushState(_,__,h) { location.hash=h; }, replaceState(_,__,h) { location.hash=h; } },
    document: { body: { classList: { toggle() {} } }, getElementById: () => navigation,
      querySelector: () => ({ focus() {} }),
      querySelectorAll: selector => selector === '[data-setup-panel]' ? panels : buttons },
    window: { scrollTo() {}, addEventListener(name,fn) { events[name]=fn; } } };
  vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../games/family-challenge/js/setupFlow.js'),'utf8'),context);
  return { panels,buttons,navigation,location,events,api:context.window.SetupFlow };
}
test('only one setup screen appears; next and browser back retain progression', () => {
  const s=setup();
  assert.equal(s.panels.filter(p=>!p.hidden).length,1);
  assert.equal(s.buttons[2].disabled,true);
  s.buttons[1].click();
  assert.equal(s.location.hash,'#settings');
  assert.equal(s.panels[1].hidden,false);
  assert.equal(s.panels[0].hidden,true);
  s.buttons[2].click();
  s.location.hash='#teams';s.events.popstate();
  assert.equal(s.panels[0].hidden,false);
  assert.equal(s.buttons[2].disabled,false);
});
test('fresh direct links start at teams; play is protected and reset restores teams', () => {
  const s=setup('#play');
  assert.equal(s.location.hash,'#teams');
  s.api.begin();assert.equal(s.location.hash,'#play');assert.equal(s.navigation.hidden,true);
  assert.ok(s.panels.every(p=>p.hidden));
  s.location.hash='#settings';s.events.popstate();assert.equal(s.location.hash,'#play');
  s.api.reset();assert.equal(s.location.hash,'#teams');assert.equal(s.navigation.hidden,false);
  assert.equal(s.panels[0].hidden,false);
});
