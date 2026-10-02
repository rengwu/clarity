import React, { useMemo } from 'react';
import { marked } from 'marked';
import { call, useApp } from './api';

import { itemLink, parseItemLink } from '../shared/navigation';

const tags = new Set(
  'p br hr h1 h2 h3 h4 h5 h6 blockquote ul ol li strong em del s pre code table thead tbody tr th td a img input details summary span div'.split(
    ' ',
  ),
);
export function Markdown({
  text,
  source,
}: {
  text: string;
  source?: { module: string; path: string };
}) {
  const app = useApp();
  const html = useMemo(() => {
    const document = new DOMParser().parseFromString(
      marked.parse(text, { gfm: true, async: false }) as string,
      'text/html',
    );
    for (const element of [...document.body.querySelectorAll('*')]) {
      const tag = element.tagName.toLowerCase();
      if (!tags.has(tag)) {
        element.remove();
        continue;
      }
      for (const attribute of [...element.attributes]) {
        const name = attribute.name;
        if (
          ![
            'href',
            'src',
            'alt',
            'title',
            'type',
            'checked',
            'start',
            'colspan',
            'rowspan',
          ].includes(name)
        )
          element.removeAttribute(name);
      }
      if (source && ['notes', 'wiki'].includes(source.module)) {
        const area = source.module === 'notes' ? 'Notes' : 'Wiki';
        for (const attribute of ['src', 'href']) {
          const value = element.getAttribute(attribute);
          if (!value || /^(?:[a-z]+:|\/\/|#)/i.test(value)) continue;
          try {
            const address = new URL(value, `clarity://assets/${area}/${source.path}`);
            const path = decodeURIComponent(address.pathname);
            if (!path.startsWith(`/${area}/`)) continue;
            if (attribute === 'src') element.setAttribute(attribute, address.toString());
            else if (path.endsWith('.md'))
              element.setAttribute(
                attribute,
                itemLink({ module: source.module, path: path.slice(area.length + 2) }),
              );
          } catch {
            element.removeAttribute(attribute);
          }
        }
      }
      if (
        element.hasAttribute('href') &&
        !/^(https?:|#)/i.test(element.getAttribute('href')!) &&
        !parseItemLink(element.getAttribute('href')!)
      )
        element.removeAttribute('href');
      if (tag === 'img' && !/^clarity:\/\/assets\//.test(element.getAttribute('src') || ''))
        element.remove();
      if (tag === 'input') {
        element.setAttribute('type', 'checkbox');
        element.setAttribute('disabled', '');
      }
    }
    return document.body.innerHTML;
  }, [text, source?.module, source?.path]);
  return (
    <div
      className="markdown"
      onClick={(event) => {
        const anchor = (event.target as Element).closest('a');
        const target = anchor?.href && parseItemLink(anchor.href);
        if (target) {
          event.preventDefault();
          if (app.active === 'chat' && app.inspect) app.inspect(target);
          else app.navigate(target.module, target);
          return;
        }
        if (anchor?.href?.startsWith('http')) {
          event.preventDefault();
          void call('external.open', { url: anchor.href }).catch(app.error);
        }
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
