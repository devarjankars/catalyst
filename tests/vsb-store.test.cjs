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

test('an in-flight save preserves newer copy edits and writes snapshots in order', async () => {
  const saved = { ...draft, id: 'vsb-1' };
  const snapshots = [];
  let finishFirst;
  const firstWrite = new Promise(resolve => { finishFirst = resolve; });
  const store = loadStore({
    updateVSB: async (_id, snapshot) => {
      snapshots.push(snapshot);
      return snapshots.length === 1 ? firstWrite : true;
    },
  });
  store.setState({ currentVsb: saved, vsbs: [saved] });

  const initialSave = store.getState().saveVSB(saved.id);
  await Promise.resolve();
  const copy = [{ heading: 'Restored section', structure: 'normal', options: ['Text'] }];
  await store.getState().updateVSB(saved.id, { variableCopy: copy });
  const restoredSave = store.getState().saveVSB(saved.id);

  assert.equal(snapshots.length, 1);
  assert.deepEqual(store.getState().currentVsb.variableCopy, copy);
  finishFirst(true);
  await initialSave;
  assert.deepEqual(store.getState().currentVsb.variableCopy, copy);
  await restoredSave;
  assert.deepEqual(snapshots.map(snapshot => snapshot.variableCopy), [[], copy]);
  assert.equal(store.getState().hasUnsavedChanges, false);
});
