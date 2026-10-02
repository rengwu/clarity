import React, { useState } from 'react';
import type { Attachment } from '../shared/types';
import { call, Dialog, ErrorText, useResource } from './api';

function Preview({ attachment, onClose }: { attachment: Attachment; onClose: () => void }) {
  const preview = useResource<any>(
    () => call('attachments.preview', { id: attachment.id }),
    [attachment.id],
  );
  const [error, setError] = useState('');
  return (
    <Dialog title={attachment.name} onClose={onClose}>
      <ErrorText>{error || preview.error}</ErrorText>
      {preview.loading && <p role="status">Loading attachment…</p>}
      {preview.data && (
        <>
          <p className="muted">
            {(attachment.size / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} KB ·
            Available for 90 days after attaching
          </p>
          {preview.data.image ? (
            <img
              className="attachment-preview"
              src={`clarity://attachment/${attachment.id}`}
              alt={attachment.name}
            />
          ) : preview.data.text ? (
            <pre className="attachment-preview">{preview.data.text}</pre>
          ) : (
            <p>Open this file from Finder to view its contents.</p>
          )}
          {preview.data.truncated && (
            <p className="muted">Preview shows the first 100,000 characters.</p>
          )}
          <button
            type="button"
            onClick={() =>
              void call('attachments.reveal', { id: attachment.id }).catch((failure) =>
                setError(failure.message),
              )
            }
          >
            Show in Finder
          </button>
        </>
      )}
    </Dialog>
  );
}
export function AttachmentChip({
  attachment,
  onRemove,
}: {
  attachment: Attachment;
  onRemove?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const expired = Date.now() - attachment.createdAt >= 90 * 86400000;
  return (
    <span className="attachment-chip">
      <button type="button" className="link" onClick={() => setOpen(true)}>
        {attachment.name}
        {expired ? ' · expired' : !attachment.supported ? ' · stored only' : ''}
      </button>
      {onRemove && (
        <button type="button" aria-label={`Remove ${attachment.name}`} onClick={onRemove}>
          ×
        </button>
      )}
      {open && <Preview attachment={attachment} onClose={() => setOpen(false)} />}
    </span>
  );
}
