export const commands = [
  {
    id: 'task',
    module: 'todos',
    label: 'Add task',
    aliases: ['task', 'todo'],
    fields: ['title', 'date'],
  },
  {
    id: 'note',
    module: 'notes',
    label: 'New note',
    aliases: ['note'],
    fields: ['title', 'folder'],
  },
  {
    id: 'expense',
    module: 'expenses',
    label: 'Add expense',
    aliases: ['expense', 'spent'],
    fields: ['amount', 'category', 'description', 'date'],
  },
  {
    id: 'event',
    module: 'calendar',
    label: 'Add event',
    aliases: ['event', 'meeting'],
    fields: ['title', 'start', 'end'],
  },
  {
    id: 'bookmark',
    module: 'bookmarks',
    label: 'Add bookmark',
    aliases: ['bookmark', 'link'],
    fields: ['title', 'url', 'description', 'tags'],
  },
] as const;
export type CommandId = (typeof commands)[number]['id'];
export type CommandDraft = { command: CommandId; fields: Record<string, string> };
export const localDay = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const localTime = (date: Date) =>
  `${localDay(date)}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

export function validDay(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return Number.isFinite(+date) && localDay(date) === value;
}
function extractDay(text: string, now: Date) {
  const match = text.match(
    /\b(\d{4}-\d{2}-\d{2}|today|tomorrow|(?:next )?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i,
  );
  if (!match) return { text, date: '' };
  const word = match[0].toLowerCase();
  const date = new Date(now);
  if (/^\d/.test(word)) {
    if (!validDay(word)) return { text, date: '' };
    return { text: text.replace(match[0], '').trim(), date: word };
  }
  if (word === 'tomorrow') date.setDate(date.getDate() + 1);
  else if (word !== 'today') {
    const weekday = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ].indexOf(word.replace('next ', ''));
    const distance = (weekday - date.getDay() + 7) % 7;
    date.setDate(date.getDate() + (distance || 7));
  }
  return { text: text.replace(match[0], '').trim(), date: localDay(date) };
}
export function parseCommand(query: string, now = new Date()): CommandDraft | undefined {
  const input = query.trim().replace(/^(?:add|new|create)\s+/i, '');
  const prefix = input.split(/\s+/)[0]?.toLowerCase();
  const command = commands.find((item) => (item.aliases as readonly string[]).includes(prefix));
  if (!command) return;
  const remainder = input.slice(prefix.length).trim();
  if (command.id === 'note') return { command: 'note', fields: { title: remainder, folder: '' } };
  if (command.id === 'bookmark') {
    const url = remainder.match(/https?:\/\/[^\s]+/i)?.[0] || '';
    return {
      command: 'bookmark',
      fields: { title: remainder.replace(url, '').trim(), url, description: '', tags: '' },
    };
  }
  const parsed = extractDay(remainder, now);
  if (command.id === 'task')
    return { command: 'task', fields: { title: parsed.text, date: parsed.date } };
  if (command.id === 'expense') {
    const amount = parsed.text.match(
      /(?:^|\s)(?:[A-Z]{2,3}\s*|[$€£])?(\d+(?:\.\d{1,2})?)(?=\s|$)/,
    )?.[0];
    return {
      command: 'expense',
      fields: {
        amount: amount?.replace(/[^\d.]/g, '') || '',
        category: '',
        description: amount ? parsed.text.replace(amount, '').trim() : parsed.text,
        date: parsed.date || localDay(now),
      },
    };
  }
  const clock = parsed.text.match(
    /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b|\b(?:at\s+)(\d{1,2}):(\d{2})\b/i,
  );
  let start = '';
  let end = '';
  if (clock && parsed.date) {
    let hours = Number(clock[1] ?? clock[4]);
    const minutes = Number(clock[2] ?? clock[5] ?? 0);
    const period = clock[3]?.toLowerCase();
    if (period && hours >= 1 && hours <= 12) hours = (hours % 12) + (period === 'pm' ? 12 : 0);
    if (
      hours < 24 &&
      minutes < 60 &&
      (!period || (Number(clock[1]) >= 1 && Number(clock[1]) <= 12))
    ) {
      const date = new Date(
        `${parsed.date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`,
      );
      start = localTime(date);
      end = localTime(new Date(+date + 3600000));
    }
  }
  return {
    command: 'event',
    fields: {
      title: clock && start ? parsed.text.replace(clock[0], '').trim() : parsed.text,
      start,
      end,
    },
  };
}

export function normalizeCommand(value: unknown, enabled: readonly string[]): CommandDraft {
  const proposal = value as any;
  const command = commands.find(
    (item) => item.id === proposal?.command && enabled.includes(item.module),
  );
  if (
    !command ||
    !proposal.fields ||
    typeof proposal.fields !== 'object' ||
    Array.isArray(proposal.fields)
  )
    throw new Error('No supported command found. Choose a command or edit your wording.');
  const fields: Record<string, string> = {};
  for (const field of command.fields) {
    const value = proposal.fields[field];
    if (value === undefined || value === null) fields[field] = '';
    else if (typeof value === 'string' && value.length <= 2000) fields[field] = value;
    else
      throw new Error(
        'The interpretation returned an invalid field. Edit your wording or choose a command.',
      );
  }
  if (fields.date && !validDay(fields.date)) fields.date = '';
  for (const key of ['start', 'end'])
    if (fields[key]) {
      const date = new Date(fields[key]);
      fields[key] = Number.isFinite(+date) ? localTime(date) : '';
    }
  return { command: command.id, fields };
}

export function similarCommand(query: string) {
  const word = query.trim().split(/\s+/)[0].toLowerCase();
  if (word.length < 3 || word.length > 12) return undefined;
  const near = (alias: string) => {
    if (Math.abs(alias.length - word.length) > 1) return false;
    let a = 0,
      b = 0,
      edits = 0;
    while (a < alias.length && b < word.length) {
      if (alias[a] === word[b]) {
        a++;
        b++;
        continue;
      }
      if (++edits > 1) return false;
      if (alias.length <= word.length) b++;
      if (alias.length >= word.length) a++;
    }
    return edits + (alias.length - a) + (word.length - b) <= 1;
  };
  return commands.find((command) => command.aliases.some(near));
}
