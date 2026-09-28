---
title: 27 September 2026 — Board methods and instructed reads
section: Journal
status: Accepted
updated: 2026-09-27
order: 520
summary: Accept the board proposal and module interface; all agents read only when instructed.
---
# 27 September 2026 — Board methods and instructed reads

The user explicitly accepted the recommendation to use Cloudflare OS's existing agent-callable module methods and the proposed board. Recorded D66: topic threads with concise findings/decisions/handoffs, links to originating chats and affected items, human browsing of the same content, and platform-managed local persistence under the single root. The earlier summary-only feed is superseded as an unaccepted alternative. Exact method names/schema are not fixed.

The user clarified that the board is open and readable by all agents, but only when instructed. Recorded D67: access availability does not trigger reads. No proactive discovery, startup catch-up, background polling, or automatic context injection. Bounded/incremental reads remain useful when the agent is instructed to consult the board; saved cursors do not create standing read instructions.

All-agent readability is not restricted to Clarity agents, but connecting a specific external runtime still requires a supported interface. No CLI, REST service, public endpoint, or direct-file protocol is chosen by this statement. A concrete external adapter remains to be scoped if needed. Posting triggers and edit/delete behavior remain open; the user specified the trigger for reading only.

Updated project instructions, board page, chat behavior, feature map, overview, decision register, and question queue. Earlier journals and research are preserved. No Clarity application code or board implementation was built.
