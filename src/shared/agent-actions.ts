export const agentActions = [
  { module: 'notes', method: 'create', label: 'Notes: create a note' },
  { module: 'notes', method: 'write', label: 'Notes: edit a note' },
  { module: 'notes', method: 'embed', label: 'Notes: embed an attachment' },
  { module: 'notes', method: 'move', label: 'Notes: move or rename a note' },
  { module: 'notes', method: 'folder', label: 'Notes: create a folder' },
  { module: 'notes', method: 'remove', label: 'Notes: move a note to Trash' },
  { module: 'todos', method: 'add', label: 'Todos: add a task' },
  { module: 'todos', method: 'update', label: 'Todos: edit or complete a task' },
  { module: 'todos', method: 'remove', label: 'Todos: delete a task' },
  { module: 'wiki', method: 'create', label: 'Wiki: create an empty page' },
  { module: 'wiki', method: 'write', label: 'Wiki: create or edit a page' },
  { module: 'wiki', method: 'embed', label: 'Wiki: embed an attachment' },
  { module: 'wiki', method: 'move', label: 'Wiki: move or rename a page' },
  { module: 'wiki', method: 'folder', label: 'Wiki: create a folder' },
  { module: 'wiki', method: 'remove', label: 'Wiki: move a page to Trash' },
  { module: 'calendar', method: 'add', label: 'Calendar: add an event' },
  { module: 'calendar', method: 'update', label: 'Calendar: edit an event' },
  { module: 'calendar', method: 'remove', label: 'Calendar: delete an event' },
  { module: 'expenses', method: 'add', label: 'Expenses: add an expense' },
  { module: 'expenses', method: 'update', label: 'Expenses: edit an expense' },
  { module: 'expenses', method: 'remove', label: 'Expenses: delete an expense' },
  { module: 'news', method: 'addSource', label: 'News: add a source' },
  { module: 'news', method: 'removeSource', label: 'News: remove a source' },
  { module: 'news', method: 'refresh', label: 'News: refresh feeds' },
  { module: 'bookmarks', method: 'add', label: 'Bookmarks: add a bookmark' },
  { module: 'bookmarks', method: 'update', label: 'Bookmarks: edit a bookmark' },
  { module: 'bookmarks', method: 'remove', label: 'Bookmarks: delete a bookmark' },
  { module: 'bookmarks', method: 'refreshLinkding', label: 'Bookmarks: import from Linkding' },
  { module: 'bookmarks', method: 'refreshX', label: 'Bookmarks: import from X' },
  { module: 'music', method: 'play', label: 'Music: play' },
  {
    module: 'music',
    method: 'control',
    label: 'Music: pause, resume, skip, seek, volume, shuffle and repeat',
  },
  { module: 'board', method: 'post', label: 'Agent board: post or reply' },
  { module: 'automations', method: 'add', label: 'Automations: create a schedule' },
  {
    module: 'automations',
    method: 'update',
    label: 'Automations: edit, enable or disable a schedule',
  },
  { module: 'automations', method: 'remove', label: 'Automations: delete a schedule' },
  { module: 'browser', method: 'authorize', label: 'Browser: allow access to a website' },
  {
    module: 'browser',
    method: 'batch',
    label: 'Browser: submit, delete, purchase or other consequential actions',
  },
].map((action) => ({ ...action, id: `${action.module}.${action.method}` }));

export const agentActionIds = agentActions.map((action) => action.id);

export function validateAutoApproveActions(value: unknown): string[] {
  if (!Array.isArray(value) || value.some((id) => !agentActionIds.includes(id)))
    throw new Error('Choose agent actions from the Settings checklist.');
  return [...new Set(value)];
}
