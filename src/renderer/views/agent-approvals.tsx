import React, { useEffect, useRef, useState } from 'react';
import { agentActions, agentActionIds } from '../../shared/agent-actions';
import { call, ErrorText, useApp } from '../api';

export function AgentApprovals() {
  const app = useApp();
  const saved: string[] = app.bootstrap.settings.autoApproveActions;
  const [selected, setSelected] = useState(saved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const selectAll = useRef<HTMLInputElement>(null);
  const selectedCount = agentActionIds.filter((id) => selected.includes(id)).length;
  const allSelected = selectedCount === agentActionIds.length;
  useEffect(() => {
    if (!busy) setSelected(saved);
  }, [saved, busy]);
  useEffect(() => {
    if (selectAll.current) selectAll.current.indeterminate = selectedCount > 0 && !allSelected;
  });

  async function save(actions: string[]) {
    setBusy(true);
    setSelected(actions);
    setError('');
    try {
      await call('settings.save', { autoApproveActions: actions });
      await app.refresh();
    } catch (failure: any) {
      setSelected(saved);
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="agent-approvals-heading">
      <h2 id="agent-approvals-heading">Agent approvals</h2>
      <p className="settings-intro">
        Checked actions run without asking in all chats and automations. Reads and scheduled updates
        to their configured wiki topic already run without approval.
      </p>
      <ErrorText>{error}</ErrorText>
      <fieldset
        className="agent-approvals"
        disabled={busy}
        aria-label="Skip approval for agent actions"
      >
        <label className="setting-row select-all-actions settings-group">
          <span className="setting-copy">
            <span className="setting-title">Select all</span>
            <span className="setting-description">
              {selectedCount} of {agentActionIds.length} actions allowed without asking
            </span>
          </span>
          <input
            ref={selectAll}
            type="checkbox"
            aria-label="Select all"
            checked={allSelected}
            onChange={(event) => void save(event.target.checked ? agentActionIds : [])}
          />
        </label>
        {[...new Set(agentActions.map((action) => action.module))].map((module) => (
          <div className="approval-group" key={module}>
            <h3 className="settings-group-heading">
              {agentActions.find((action) => action.module === module)!.label.split(':')[0]}
            </h3>
            <div className="settings-group">
              {agentActions
                .filter((action) => action.module === module)
                .map((action) => (
                  <label className="setting-row approval-row" key={action.id}>
                    <span>
                      {action.label.split(': ')[1].replace(/^./, (letter) => letter.toUpperCase())}
                    </span>
                    <input
                      type="checkbox"
                      aria-label={action.label}
                      checked={selected.includes(action.id)}
                      onChange={(event) =>
                        void save(
                          event.target.checked
                            ? [...selected, action.id]
                            : selected.filter((id) => id !== action.id),
                        )
                      }
                    />
                  </label>
                ))}
            </div>
          </div>
        ))}
      </fieldset>
    </section>
  );
}
