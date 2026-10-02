import React, { useState } from 'react';
import type { Action } from '../shared/types';
import { agentActions } from '../shared/agent-actions';
import { call, ErrorText, labels, useApp } from './api';
import { Markdown } from './markdown';
import { useSubmission } from './state';

const statusLabels = {
  pending: 'Needs approval',
  applying: 'Applying…',
  applied: 'Completed',
  rejected: 'Dismissed',
  failed: 'Failed',
};
const fieldLabels: Record<string, string> = {
  title: 'Title',
  text: 'Content',
  done: 'Completed',
  start: 'Start',
  end: 'End',
  amountCents: 'Amount',
  date: 'Date',
  category: 'Category',
  description: 'Description',
  url: 'URL',
  tags: 'Tags',
  path: 'File',
  to: 'New location',
  folder: 'Folder',
  topic: 'Topic',
  topicPath: 'Wiki topic',
  instruction: 'Instructions',
  enabled: 'Enabled',
  hour: 'Hour',
  minute: 'Minute',
  frequency: 'Frequency',
  weekdays: 'Days',
  origin: 'Website',
  source: 'Source',
  type: 'Type',
  action: 'Action',
  position: 'Position (seconds)',
  volume: 'Volume',
  shuffle: 'Shuffle',
  repeat: 'Repeat',
  actions: 'Browser steps',
  links: 'Linked items',
};
function DisplayValue({ name, value, currency }: { name: string; value: any; currency: string }) {
  if (value === undefined || value === null) return <span className="muted">None</span>;
  if (name === 'text') return <Markdown text={String(value)} />;
  if (typeof value === 'boolean') return <span>{value ? 'Yes' : 'No'}</span>;
  if (name === 'amountCents')
    return (
      <span>
        {currency}
        {(Number(value) / 100).toFixed(2)}
      </span>
    );
  if (['start', 'end'].includes(name)) return <span>{new Date(value).toLocaleString()}</span>;
  if (Array.isArray(value))
    return (
      <ul>
        {value.map((item, i) => (
          <li key={i}>
            <DisplayValue name="item" value={item} currency={currency} />
          </li>
        ))}
      </ul>
    );
  if (typeof value === 'object')
    return (
      <dl>
        {Object.entries(value).map(([key, item]) => (
          <React.Fragment key={key}>
            <dt>{fieldLabels[key] || key}</dt>
            <dd>
              <DisplayValue name={key} value={item} currency={currency} />
            </dd>
          </React.Fragment>
        ))}
      </dl>
    );
  return <span className="preserve-lines">{String(value)}</span>;
}
export function ActionCard({ action }: { action: Action }) {
  const app = useApp();
  const submission = useSubmission();
  const [error, setError] = useState('');
  const currency = app.bootstrap.settings.currency;
  const title =
    agentActions.find((item) => item.module === action.module && item.method === action.method)
      ?.label || action.description;
  const fields = Object.entries(action.args || {}).filter(([name]) => fieldLabels[name]);
  const affected =
    action.before?.title || action.before?.description || action.before?.topic || action.args.path;
  const target = {
    id: action.result?.id || action.args.id,
    path: action.result?.path || action.args.to || action.args.path,
    source: action.args.source,
    type: action.args.type,
  };
  return (
    <section className="action-review" aria-label={title}>
      <div className="row">
        <strong>{title}</strong>
        <span className="muted">{statusLabels[action.status]}</span>
      </div>
      {affected && <p>{affected}</p>}
      <dl className="action-fields">
        {fields.map(([name, value]) => (
          <React.Fragment key={name}>
            <dt>{fieldLabels[name]}</dt>
            <dd>
              {action.before &&
              name in action.before &&
              JSON.stringify(action.before[name]) !== JSON.stringify(value) ? (
                <div className="change-comparison">
                  <div>
                    <small>Before</small>
                    <DisplayValue name={name} value={action.before[name]} currency={currency} />
                  </div>
                  <div>
                    <small>After</small>
                    <DisplayValue name={name} value={value} currency={currency} />
                  </div>
                </div>
              ) : (
                <DisplayValue name={name} value={value} currency={currency} />
              )}
            </dd>
          </React.Fragment>
        ))}
      </dl>
      {action.method === 'remove' && action.before && (
        <p className="danger">
          {['notes', 'wiki'].includes(action.module)
            ? 'Moves this file to Trash.'
            : 'Permanently deletes this item.'}
        </p>
      )}
      {!action.before &&
        ['update', 'write', 'move', 'remove'].includes(action.method) &&
        action.args.version !== null && (
          <p className="muted">Original contents are unavailable for this review.</p>
        )}
      <details>
        <summary>Technical details</summary>
        <pre>{JSON.stringify(action.args, null, 2)}</pre>
      </details>
      <ErrorText>{error || action.error}</ErrorText>
      {action.status === 'applied' &&
        action.module === 'browser' &&
        action.method === 'authorize' && (
          <button
            onClick={() => void call('browser.login', { url: action.args.origin }).catch(app.error)}
          >
            Open browser
          </button>
        )}
      {action.status === 'applied' &&
        action.module !== 'browser' &&
        !['remove', 'removeSource'].includes(action.method) && (
          <div className="row action-links">
            {app.active === 'chat' && app.inspect && (
              <button onClick={() => app.inspect!({ module: action.module, ...target })}>
                Preview result
              </button>
            )}
            <button onClick={() => app.navigate(action.module, target)}>
              Open in {labels[action.module] || action.module}
            </button>
          </div>
        )}
      {action.status === 'pending' && (
        <div className="row">
          {[true, false].map((apply) => (
            <button
              key={String(apply)}
              className={apply ? 'primary' : ''}
              disabled={submission.busy}
              onClick={() =>
                void submission.run(async () => {
                  setError('');
                  try {
                    await call('actions.review', { id: action.id, apply });
                  } catch (failure: any) {
                    setError(failure.message);
                  }
                })
              }
            >
              {apply ? 'Apply' : 'Dismiss'}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
