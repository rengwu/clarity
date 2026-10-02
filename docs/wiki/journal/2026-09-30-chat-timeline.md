---
title: 30 September 2026 — Chronological chat approvals
section: Journal
status: Current
updated: 2026-09-30
order: 2026093001
summary: Approval and action cards appear with their conversation turns instead of accumulating below newer replies.
---
# 30 September 2026 — Chronological chat approvals

The user reported that accumulated approval/action cards appeared after all conversation messages. As more actions were recorded, the latest response was pushed above the cards, forcing the user to scroll upward to find it. [D111](../decisions/index.md#d111-chronological-chat-approvals-30-september-2026) establishes chronological placement for these cards too.

The renderer previously displayed saved messages, then the streaming response, then the entire action list. It now merges messages and actions using their existing original timestamps. Status changes use the same card key and creation time, so reviewing an old action changes its contents without moving it to the end. Streaming messages participate in the same timeline. Approval controls, navigation, and error presentation retain their existing behavior.

No backend, approval-policy, storage, or migration change is needed. Older chats already contain message timestamps and immutable action creation times. The [Chat specification](../foundations/chat.md#chronological-action-cards) owns the ordering, ties, and acceptance behavior.

Application and Worker type checks pass. A disposable Electron walkthrough passes in both the development build and the packaged app: automatic, pending and failed cards interleave with four conversation turns; same-time messages retain their order; Apply creates the expected task and updates the same card in place; Dismiss also retains position. A simulated streaming reply remains below older actions and is visible when scrolled to the bottom. Reopening preserves order and review outcomes. This uses a separate fixture data folder and no live model request. Screenshots and the report remain in the external build cache.

The macOS package also passes relocation, signature, dependency independence, and note/task persistence checks. The signed updated bundle is installed at `~/Applications/Clarity.app`, with the preceding bundle retained as a backup. The running instance loads the renderer change with View → Reload (or the next normal launch). The wiki reader is rebuilt and its internal links checked.
