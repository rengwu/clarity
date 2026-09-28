---
title: Mail
section: Features
status: Exploring
updated: 2026-09-27
order: 50
summary: Google-connected inbox and message reader with chat summaries.
---
# Mail

## Cloudflare OS reassessment · 27 September 2026

The inbox, reader, and chat summaries remain read-only. Reusing a Google connector does not authorize its compose/send/modify functions. Backend execution is local; offline cache behavior remains to be defined, and no new Gmail browser-link work is requested.

These are adaptation notes, not acceptance of new features or removal of the retained behavior below.

## Stated intent

Include mail similar to Lucia. It only works if a Google account is connected.

## Accepted scope

**Accepted from the user ([D37](../decisions/index.md#d37-inbox-and-message-reader-25-september-2026)):** just an inbox and message reader. No composing or replying. Chat can read and summarize mail, as already established under D17.

The user dropped the proposed browser link ([D39](../decisions/index.md#d39-drop-the-gmail-browser-link-25-september-2026)). Exact layout remains undecided; no additional mailbox-management features are selected.

## Browser link feasibility

**Historical research; feature dropped:** Google describes individual email URLs in its [Gmail blog](https://gmail.googleblog.com/2007/11/5-little-known-gmail-features-you-may.html). The documented [Gmail API Message resource](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages) supplies message/thread IDs, not a browser permalink field. Reliable link generation had not been verified when the user chose to drop the feature.

No browser-link implementation or validation work remains in scope.

## Open questions

- Which message data is stored locally?
- What remains available after disconnecting or going offline?

## Reference notes

The user identified Lucia as `~/Desktop/Projects/john-harness`. Its README describes read-only Google connections and a retained local mail archive. Mail implementation has not been audited in this planning session; those reference details do not expand Clarity's agreed inbox/reader scope.

## Related pages

[Feature map](index.md) · [Two folders](../foundations/folders.md) · [Modules and connections](../foundations/integrations.md) · [Reference register](../references/index.md)
