import type { SearchClient } from '@azure/search-documents';
import { type OpenAiService } from '../../plugins/openai.js';
import type { ApproachContext } from './approach.js';
import type { SearchDocumentsResult } from './approach-base.js';
import { ChatReadRetrieveRead } from './chat-read-retrieve-read.js';
import { LRUCache } from 'lru-cache';

export class ChatReadRetrieveReadCached extends ChatReadRetrieveRead {
  private readonly cache: LRUCache<string, SearchDocumentsResult>;

  constructor(
    search: SearchClient<any>,
    openai: OpenAiService,
    chatGptModel: string,
    embeddingModel: string,
    sourcePageField: string,
    contentField: string,
    options?: {
      cacheMax?: number;
      cacheTTLms?: number;
    },
  ) {
    super(search, openai, chatGptModel, embeddingModel, sourcePageField, contentField);
    this.cache = new LRUCache<string, SearchDocumentsResult>({
      max: options?.cacheMax ?? 500,
      ttl: options?.cacheTTLms ?? 60_000,
    });
  }

  protected override async searchDocuments(
    query?: string,
    context: ApproachContext = {},
  ): Promise<SearchDocumentsResult> {
    const key = this.makeKey(query, context);

    if (key) {
      const hit = this.cache.get(key);
      if (hit) return hit;
    }

    const result = await super.searchDocuments(query, context);

    if (query) {
      this.cache.set(key, result);
    }

    return result;
  }

  private makeKey(query?: string, context?: ApproachContext): string | undefined {
    //simple key, but would like to append user id or similar for user mapping etc when ADO implimented
    if (!query?.trim()) return undefined;
    const normalizedQuery = query.trim();
    return JSON.stringify({ q: normalizedQuery, context });
  }

  //admin clear cache
  public clearCache() {
    this.cache.clear();
  }
  public cacheStats() {
    return { size: this.cache.size };
  }
}
