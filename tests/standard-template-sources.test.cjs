const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../lib/standard-template-sources.ts'), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const exportsObject = {};
new Function('exports', outputText)(exportsObject);
const { applyStandardTemplateSources } = exportsObject;

const rteDraft = {
  id: 'rte-draft', brand: 'geron', category: 'rte', isUserCreated: true,
  name: 'Creative_feedback_Test_Pratiksha (Copy)', components: [{ id: 'updated-rte' }],
  optionMode: 'two', option2Components: [{ id: 'updated-option' }], preheaderText: 'Updated preheader',
};
const sfmcDraft = {
  id: 'sfmc-draft', brand: 'orserdu', category: 'sfmc', isUserCreated: true,
  name: 'MAT-US-ELA-00625-v4_SFMC-email_Heritage-Message_Demo_Ronald (Copy)',
  components: [{ id: 'updated-sfmc' }],
};
const oldRte = { id: 'old-rte', brand: 'geron', category: 'rte', name: 'RTE Standard Template' };
const oldSfmc = { id: 'old-sfmc', brand: 'orserdu', category: 'sfmc', name: 'Orserdu SFMC' };

test('Standard templates open the named source content and keep the source drafts and unrelated standards', () => {
  const other = { id: 'other', brand: 'orserdu', category: 'sfmc', name: 'Event standard' };
  const records = [oldRte, oldSfmc, rteDraft, sfmcDraft, other];
  const result = applyStandardTemplateSources(records);
  assert.deepEqual(result.map(entry => entry.id), ['rte-draft', 'sfmc-draft', 'other', 'standard-source-rte-draft', 'standard-source-sfmc-draft']);
  assert.deepEqual(result[3], { ...rteDraft, id: 'standard-source-rte-draft', name: 'RTE Standard Template', isUserCreated: false });
  assert.deepEqual(result[4], { ...sfmcDraft, id: 'standard-source-sfmc-draft', name: 'SFMC Standard Template', isUserCreated: false });
  assert.equal(records.length, 5);
});

test('Missing, duplicate, and empty source copies leave existing standards available', () => {
  const records = [oldRte, oldSfmc, rteDraft, { ...rteDraft, id: 'duplicate' }, { ...sfmcDraft, components: [] }];
  assert.deepEqual(applyStandardTemplateSources(records), records);
  assert.deepEqual(applyStandardTemplateSources([oldRte, oldSfmc]), [oldRte, oldSfmc]);
});
