const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

function loadStore(service) {
  const source = fs.readFileSync(path.join(__dirname, '../store/vsb-store.ts'), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const exports = {};
  const mockRequire = (name) => {
    if (name === '@/services/firebase-service') return { firebaseService: service };
    // Test state transitions without browser persistence or Redux DevTools.
    if (name === 'zustand/middleware') return { devtools: (fn) => fn, persist: (fn) => fn };
    return require(name);
  };
  new Function('require', 'exports', outputText)(mockRequire, exports);
  return exports.useVSBStore;
}

const draft = { templateId: 'email-1', variableCopy: [], altNamePage: { images: [] } };

test('failed VSB writes clear loading and expose the error', async () => {
  for (const createVSB of [
    async () => null,
    async () => { throw new Error('Missing or insufficient permissions.'); },
  ]) {
    const store = loadStore({ createVSB });
    assert.equal(await store.getState().createVSB(draft), null);
    assert.equal(store.getState().loading, false);
    assert.ok(store.getState().error);
    assert.equal(store.getState().currentVsb, null);
    assert.deepEqual(store.getState().vsbs, []);
  }
});

test('successful creation opens the saved VSB and clears old unsaved state', async () => {
  const saved = { ...draft, id: 'vsb-1' };
  const store = loadStore({ createVSB: async () => saved });
  store.setState({ hasUnsavedChanges: true });
  assert.deepEqual(await store.getState().createVSB(draft), saved);
  assert.equal(store.getState().currentVsb.id, saved.id);
  assert.deepEqual(store.getState().vsbs, [saved]);
  assert.equal(store.getState().hasUnsavedChanges, false);
  assert.equal(store.getState().loading, false);
});

test('opening another emailer clears the previously selected VSB', async () => {
  const store = loadStore({ getVSBs: async () => [] });
  store.setState({ currentVsb: { ...draft, id: 'old-vsb' }, hasUnsavedChanges: true });
  await store.getState().fetchVSBs('email-2');
  assert.equal(store.getState().currentVsb, null);
  assert.equal(store.getState().hasUnsavedChanges, false);
  assert.equal(store.getState().loading, false);
});
