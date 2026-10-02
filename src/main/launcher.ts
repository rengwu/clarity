import type { Modules } from './modules';
import type { ItemTarget } from '../shared/navigation';

export type SearchResult = { title: string; detail: string; target: ItemTarget };
export async function searchLocal(modules: Modules, input: string): Promise<SearchResult[]> {
  const query = String(input || '')
    .trim()
    .slice(0, 200)
    .toLowerCase();
  if (!query) return [];
  const settings = await modules.settings();
  const results: SearchResult[] = [];
  for (const module of settings.enabled) {
    if (['mail', 'music'].includes(module)) continue;
    if (module === 'notes' || module === 'wiki') {
      const files = await modules.files.list(module === 'notes' ? 'Notes' : 'Wiki', query);
      results.push(
        ...files
          .filter((file) => !file.folder)
          .slice(0, 12)
          .map((file) => ({
            title: file.title,
            detail: file.path,
            target: { module, path: file.path },
          })),
      );
      continue;
    }
    const records = await modules.store.list(module === 'chat' ? 'chats' : module);
    for (const item of records) {
      const searchable =
        module === 'chat'
          ? `${item.title} ${JSON.stringify(item.messages)}`
          : [
              item.title,
              item.topic,
              item.description,
              item.text,
              item.category,
              item.url,
              ...(item.tags || []),
            ]
              .filter(Boolean)
              .join(' ');
      if (!searchable.toLowerCase().includes(query)) continue;
      results.push({
        title: item.title || item.topic || item.description || item.category || 'Untitled',
        detail:
          module === 'chat' ? 'Conversation' : item.description || item.date || item.path || '',
        target: { module, id: item.id },
      });
      if (results.length >= 60) return results;
    }
  }
  return results.slice(0, 60);
}
