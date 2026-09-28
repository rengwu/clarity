import type { Ctx } from '@milkdown/kit/ctx';
import { bulletListSchema, orderedListSchema } from '@milkdown/kit/preset/commonmark';
import { extendListItemSchemaForTask } from '@milkdown/kit/preset/gfm';

export function preserveMarkdownLists(ctx: Ctx) {
  // Milkdown 7.19 emits both string and boolean spread attributes. Its boolean-only
  // validator otherwise discards entire lists while parsing existing Markdown.
  for (const schema of [bulletListSchema, orderedListSchema, extendListItemSchemaForTask]) {
    ctx.update(schema.key, (factory) => (context) => {
      const base = factory(context);
      const item = schema === extendListItemSchemaForTask;
      const ordered = schema === orderedListSchema;
      return {
        ...base,
        attrs: {
          ...base.attrs,
          spread: { ...base.attrs!.spread, validate: 'boolean|string' },
        },
        ...(ordered
          ? {
              parseMarkdown: {
                ...base.parseMarkdown,
                runner: (state, node, type) => {
                  state
                    .openNode(type, { order: node.start ?? 1, spread: Boolean(node.spread) })
                    .next(node.children)
                    .closeNode();
                },
              },
              toDOM: (node) => ['ol', { start: node.attrs.order }, 0],
            }
          : {}),
        toMarkdown: {
          ...base.toMarkdown,
          runner: (state, node) => {
            const spread = node.attrs.spread === true || node.attrs.spread === 'true';
            state
              .openNode(
                item ? 'listItem' : 'list',
                undefined,
                item
                  ? { spread, checked: node.attrs.checked ?? null }
                  : { spread, ordered, ...(ordered ? { start: node.attrs.order } : {}) },
              )
              .next(node.content)
              .closeNode();
          },
        },
      };
    });
  }
}
