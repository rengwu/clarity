import React, { useMemo } from 'react';
import { marked } from 'marked';
import { call } from './api';

const tags = new Set(
  'p br hr h1 h2 h3 h4 h5 h6 blockquote ul ol li strong em del s pre code table thead tbody tr th td a img input details summary span div'.split(
    ' ',
  ),
);
export function Markdown({ text }: { text: string }) {
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
      if (element.hasAttribute('href') && !/^(https?:|#)/i.test(element.getAttribute('href')!))
        element.removeAttribute('href');
      if (tag === 'img' && !/^clarity:\/\/assets\//.test(element.getAttribute('src') || ''))
        element.remove();
      if (tag === 'input') {
        element.setAttribute('type', 'checkbox');
        element.setAttribute('disabled', '');
      }
    }
    return document.body.innerHTML;
  }, [text]);
  return (
    <div
      className="markdown"
      onClick={(event) => {
        const anchor = (event.target as Element).closest('a');
        if (anchor?.href?.startsWith('http')) {
          event.preventDefault();
          void call('external.open', { url: anchor.href });
        }
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
