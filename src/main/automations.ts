import { nextFireAfter } from '../vendor/cloudflare-os/scheduler-core';
import { OPENAI_CODEX_MODELS } from '@earendil-works/pi-ai/providers/openai-codex.models';
import type { Modules } from './modules';
import type { Chats } from './chat';
import type { Auth } from './auth';
import type { AppEvent } from '../shared/types';
import type { Agent } from '@earendil-works/pi-agent-core';

export class Automations {
  private timer?: ReturnType<typeof setInterval>;
  private running = new Map<string, Promise<void>>();
  private agents = new Map<string, Agent>();
  private stopping = false;
  constructor(
    private modules: Modules,
    private chats: Chats,
    private auth: Auth,
    private notify: (event: AppEvent) => void,
  ) {}
  async start() {
    for (const item of await this.modules.store.list('automations'))
      if (item.enabled && (item.nextRun <= Date.now() || item.status === 'running'))
        await this.modules.store.put('automations', item.id, {
          ...item,
          nextRun: nextFireAfter(item.schedule, Date.now()),
          status: item.status === 'running' ? 'interrupted' : item.status,
        });
    this.timer = setInterval(() => void this.tick().catch(() => {}), 15000);
  }
  async stop() {
    this.stopping = true;
    if (this.timer) clearInterval(this.timer);
    for (const agent of this.agents.values()) agent.abort();
    await Promise.allSettled([...this.running.values()]);
  }
  private async tick() {
    if (!(await this.modules.settings()).enabled.includes('automations')) return;
    const now = Date.now();
    for (const item of await this.modules.store.list('automations')) {
      if (!item.enabled || !item.nextRun || item.nextRun > now || this.running.has(item.id))
        continue;
      if (now - item.nextRun > 60000) {
        await this.modules.store.put('automations', item.id, {
          ...item,
          nextRun: nextFireAfter(item.schedule, now),
        });
        continue;
      }
      void this.run(item.id).catch(() => {});
    }
  }
  run(id: string) {
    if (this.stopping) return Promise.reject(new Error('Clarity is quitting.'));
    if (this.running.has(id))
      return Promise.reject(new Error('This automation is already running.'));
    const task = this.execute(id).finally(() => {
      this.running.delete(id);
      this.agents.delete(id);
      this.notify({ type: 'changed', module: 'automations' });
    });
    this.running.set(id, task);
    return task;
  }
  private async execute(id: string) {
    let item = await this.modules.store.get('automations', id);
    if (!item) throw new Error('Automation not found');
    const started = Date.now();
    item = await this.modules.store.put('automations', id, {
      ...item,
      status: 'running',
      nextRun: nextFireAfter(item.schedule, started),
    });
    this.notify({ type: 'changed', module: 'automations' });
    try {
      const settings = await this.modules.settings();
      if (!settings.enabled.includes('automations') || !settings.enabled.includes('wiki'))
        throw new Error('Enable Automations and Wiki to run wiki maintenance.');
      const candidates: any[] = [];
      for (const collection of ['chats', 'bookmarks', 'news', 'todos', 'calendar', 'expenses']) {
        if (!settings.enabled.includes((collection === 'chats' ? 'chat' : collection) as any))
          continue;
        for (const record of await this.modules.store.list(collection)) {
          if (record.updatedAt <= item.since || record.updatedAt > started) continue;
          const content =
            collection === 'chats'
              ? {
                  id: record.id,
                  title: record.title,
                  messages: record.messages
                    .filter((message: any) => message.timestamp > item!.since)
                    .map((message: any) => ({
                      role: message.role,
                      content:
                        typeof message.content === 'string'
                          ? message.content
                          : message.content?.filter((part: any) => part.type === 'text'),
                    })),
                }
              : record;
          candidates.push({
            kind: collection,
            id: record.id,
            updatedAt: record.updatedAt,
            content,
          });
        }
      }
      if (settings.enabled.includes('notes'))
        for (const file of await this.modules.files.list('Notes')) {
          if (!file.folder && file.modified > item.since && file.modified <= started)
            candidates.push({ kind: 'notes', id: file.path, updatedAt: file.modified });
        }
      candidates.sort((a, b) => a.updatedAt - b.updatedAt);
      const changes: any[] = [];
      let cursor = started;
      let size = 0;
      for (let index = 0; index < candidates.length; ) {
        const timestamp = candidates[index].updatedAt;
        const group: any[] = [];
        while (index < candidates.length && candidates[index].updatedAt === timestamp) {
          const candidate = candidates[index++];
          if (candidate.kind === 'notes')
            candidate.content = await this.modules.files.read('Notes', candidate.id);
          group.push(candidate);
        }
        const groupSize = JSON.stringify(group).length;
        if (size + groupSize > 120000 || changes.length + group.length > 100) {
          if (!changes.length)
            throw new Error(
              'A change is too large for one lean automation run. No input has been marked processed. Review the large source in chat first.',
            );
          cursor = changes.at(-1).updatedAt;
          break;
        }
        size += groupSize;
        changes.push(...group);
      }
      let current;
      try {
        current = await this.modules.files.read('Wiki', item.topicPath);
      } catch {
        current = null;
      }
      if ((current?.text.length || 0) > 100000)
        throw new Error(
          'This wiki topic is too large for automatic maintenance. Review it in chat.',
        );
      if (!changes.length) {
        const latest = await this.modules.store.get('automations', id);
        if (latest)
          await this.modules.store.patch('automations', id, {
            status: 'completed',
            since: started,
            lastRun: started,
            result: 'No new app information.',
            error: undefined,
          });
        return;
      }
      const model = Object.values(OPENAI_CODEX_MODELS).find((model) => model.id === settings.model);
      if (!model) throw new Error('Choose a supported model in Settings.');
      const agent = await this.chats.makeAgent(
        `automation:${id}`,
        model,
        settings.effort,
        await this.auth.codexToken(),
        [],
        item.topicPath,
      );
      if (this.stopping) throw new Error('Clarity is quitting.');
      this.agents.set(id, agent);
      const timeout = setTimeout(() => agent.abort(), 180000);
      try {
        await agent.prompt(
          `Scheduled wiki update. Instructions: ${item.instruction}\nTarget: ${item.topicPath}\nCurrent page: ${JSON.stringify(current)}\nNew app state since ${new Date(item.since).toISOString()}:\n${JSON.stringify(changes)}\nUse only relevant new app state for this schedule. Preserve existing useful content and conflicting evidence; cite sources using ordinary links. Do nothing if there is no relevant change. Keep the final result concise.`,
        );
      } finally {
        clearTimeout(timeout);
      }
      const last: any = agent.state.messages.at(-1);
      if (last?.stopReason === 'error' || last?.stopReason === 'aborted')
        throw new Error(last.errorMessage || 'Automation was interrupted.');
      const summary =
        last?.content
          ?.filter((part: any) => part.type === 'text')
          .map((part: any) => part.text)
          .join('\n') || 'No changes.';
      const latest = await this.modules.store.get('automations', id);
      if (latest)
        await this.modules.store.patch('automations', id, {
          status: 'completed',
          since: cursor,
          lastRun: started,
          result: summary,
          error: undefined,
        });
    } catch (error: any) {
      const latest = await this.modules.store.get('automations', id);
      if (latest)
        await this.modules.store.patch('automations', id, {
          status: 'failed',
          lastRun: started,
          error: error.message,
        });
      throw error;
    }
  }
}
