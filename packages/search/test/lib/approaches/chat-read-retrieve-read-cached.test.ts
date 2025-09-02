import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ChatReadRetrieveReadCached } from '../../../src/lib/approaches/chat-read-retrieve-read-cached.js';

test('ChatReadRetrieveReadCached caches search results', async () => {
  const calls: string[] = [];
  const searchClient = {
    search: async (query: string) => {
      calls.push(query);
      return { results: [{ document: { sourcepage: 's1', content: 'c1' } }] } as any;
    },
  };

  const approach = new ChatReadRetrieveReadCached(
    searchClient as any,
    {} as any,
    'gpt-4',
    'embed',
    'sourcepage',
    'content',
    { cacheMax: 100, cacheTTLms: 60_000 },
  );

  const first = await (approach as any).searchDocuments('question', { retrieval_mode: 'text' });
  const second = await (approach as any).searchDocuments('question', { retrieval_mode: 'text' });

  assert.deepEqual(first, second);
  assert.equal(calls.length, 1);
});
