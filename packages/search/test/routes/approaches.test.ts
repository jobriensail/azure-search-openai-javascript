import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { build } from '../helper.js';

test('cached chat approach is registered', async (t: TestContext) => {
  const app = await build(t);
  assert.ok(app.approaches.chat.rrr_cached);
});
