const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

function loadStore() {
  const source = fs.readFileSync(path.join(__dirname, '../store/email-builder-store.ts'), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const exports = {};
  const mockRequire = (name) => {
    if (name === '@/services/firebase-service') return { firebaseService: {} };
    return require(name);
  };
  new Function('require', 'exports', outputText)(mockRequire, exports);
  return exports.useEmailBuilderStore;
}

test('switching historical versions preserves the working draft and all options', () => {
  const store = loadStore();
  const draftComponents = [{ id: 'draft-1', type: 'text', content: 'Draft' }];
  const draftOption2 = [{ id: 'draft-2', type: 'text', content: 'Draft option 2' }];
  const draftOption3 = [{ id: 'draft-3', type: 'text', content: 'Draft option 3' }];
  store.setState({
    currentTemplate: {
      id: 'email-1',
      name: 'Email',
      description: '',
      category: 'sfmc',
      components: draftComponents,
      optionMode: 'three',
      optionSubMode: 'completely-different',
      option2Components: draftOption2,
      option3Components: draftOption3,
      createdAt: null,
      updatedAt: null,
    },
    components: draftComponents,
    originalComponents: draftComponents,
    option2Components: draftOption2,
    originalOption2Components: draftOption2,
    option3Components: draftOption3,
    originalOption3Components: draftOption3,
    optionMode: 'three',
    optionSubMode: 'completely-different',
    preheaderText: 'Draft preheader',
    hasComponentChanges: true,
  });

  const makeVersion = (id, versionNumber, content) => ({
    id,
    templateId: 'email-1',
    versionNumber,
    changeNote: `Version ${versionNumber}`,
    createdAt: null,
    createdBy: 'user@example.com',
    sourceHtml: `<html>${content}</html>`,
    editorSnapshot: {
      components: [{ id: `${id}-1`, type: 'text', content }],
      option2Components: [{ id: `${id}-2`, type: 'text', content: `${content} 2` }],
      option3Components: [{ id: `${id}-3`, type: 'text', content: `${content} 3` }],
      optionMode: 'three',
      optionSubMode: 'completely-different',
      preheaderText: `${content} preheader`,
      metadata: { name: 'Email', description: '', category: 'sfmc' },
      settings: {},
    },
  });

  const first = makeVersion('v1', 1, 'First');
  const second = makeVersion('v2', 2, 'Second');
  store.getState().viewVersion(first);
  store.getState().viewVersion(second);

  assert.equal(store.getState().viewingVersion.id, 'v2');
  assert.equal(store.getState().components[0].content, 'Second');
  assert.equal(store.getState().option2Components[0].content, 'Second 2');
  assert.equal(store.getState().option3Components[0].content, 'Second 3');

  store.getState().exitVersionView();

  assert.equal(store.getState().viewingVersion, null);
  assert.equal(store.getState().components[0].content, 'Draft');
  assert.equal(store.getState().option2Components[0].content, 'Draft option 2');
  assert.equal(store.getState().option3Components[0].content, 'Draft option 3');
  assert.equal(store.getState().preheaderText, 'Draft preheader');
  assert.equal(store.getState().hasComponentChanges, true);
});
