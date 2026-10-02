import { wikiStyles } from './wiki-style';
import { marked } from 'marked';
import sanitize from 'sanitize-html';
import { readFile, writeFile, rename } from 'node:fs/promises';
import { dirname, join, extname, posix } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Files } from './files';

export class Wiki {
  private pending: Promise<void> = Promise.resolve();
  constructor(private files: Files) {}
  build() {
    this.pending = this.pending.catch(() => {}).then(() => this.generate());
    return this.pending;
  }
  private async generate() {
    const pages: any[] = [];
    for (const file of await this.files.list('Wiki')) {
      if (file.folder) continue;
      let document;
      try {
        document = await this.files.read('Wiki', file.path);
      } catch {
        pages.push({
          path: file.path,
          title: file.title,
          html: '<p>This page could not be loaded. Check the Markdown file and the 5 MB document limit.</p>',
          text: file.title,
        });
        continue;
      }
      const headings = new Map<string, number>();
      const renderer = new marked.Renderer();
      renderer.heading = function ({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        const base = text
          .replace(/<[^>]*>/g, '')
          .toLowerCase()
          .replace(/[^\p{L}\p{N}\s_-]/gu, '')
          .trim()
          .replace(/\s+/g, '-');
        const count = headings.get(base) || 0;
        headings.set(base, count + 1);
        return `<h${depth} id="${base}${count ? `-${count}` : ''}">${text}</h${depth}>`;
      };
      let html = await marked(document.text, { gfm: true, renderer });
      const images = [...html.matchAll(/<img[^>]*src="([^"]+)"[^>]*>/g)];
      for (const match of images) {
        if (/^https?:|^data:/i.test(match[1])) continue;
        try {
          const path = posix.normalize(
            posix.join(dirname(file.path), decodeURIComponent(match[1])),
          );
          const extension = extname(path).toLowerCase();
          const mime: Record<string, string> = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.webp': 'image/webp',
            '.gif': 'image/gif',
          };
          if (!mime[extension]) continue;
          const bytes = await readFile(await this.files.path('Wiki', path));
          if (bytes.length < 30_000_000)
            html = html.replace(
              match[0],
              match[0].replace(
                match[1],
                `data:${mime[extension]};base64,${bytes.toString('base64')}`,
              ),
            );
        } catch {}
      }
      html = sanitize(html, {
        allowedTags: [...sanitize.defaults.allowedTags, 'img', 'input', 'del'],
        allowedAttributes: {
          a: ['href', 'title'],
          img: ['src', 'alt'],
          input: ['type', 'checked', 'disabled'],
          '*': ['class', 'id'],
        },
        allowedSchemes: ['http', 'https', 'clarity'],
        allowedSchemesByTag: { img: ['data'] },
        transformTags: {
          input: (_name, attributes) => ({
            tagName: 'input',
            attribs: {
              type: 'checkbox',
              disabled: 'disabled',
              ...(attributes.checked !== undefined ? { checked: 'checked' } : {}),
            },
          }),
        },
      });
      pages.push({
        path: file.path,
        title: document.text.match(/^#\s+(.+)$/m)?.[1] || file.title,
        html,
        text: document.text,
      });
    }
    const serialized = JSON.stringify(pages).replace(/</g, '\\u003c');
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Wiki</title><style>
      ${wikiStyles}
      </style></head><body><nav><input id="search" type="search" placeholder="Search wiki" aria-label="Search wiki"><div id="pages"></div></nav><main id="content"></main><script>
      const parameters=new URLSearchParams(location.search);const theme=parameters.get('theme');document.documentElement.dataset.motion=parameters.get('motion')||'system';if(['light','dark'].includes(theme))document.documentElement.dataset.theme=theme;
      const pages=${serialized}; const list=document.getElementById('pages');const content=document.getElementById('content');let active;
      function renderList(){const query=document.getElementById('search').value.toLowerCase();list.replaceChildren();for(const page of pages.filter(p=>(p.title+' '+p.text).toLowerCase().includes(query))){const a=document.createElement('a');a.textContent=page.title;a.href='#'+encodeURIComponent(page.path);if(page.path===active?.path)a.setAttribute('aria-current','page');list.append(a)}if(!list.childElementCount)list.textContent=query?'No matching pages.':'No pages yet.'}
      function render(){const [encoded,anchor]=location.hash.slice(1).split('#');let path;try{path=decodeURIComponent(encoded)}catch{path=''}active=path?pages.find(p=>p.path===path):pages[0];if(active){content.innerHTML=active.html;renderList();if(parameters.get('motion')!=='reduced'&&!matchMedia('(prefers-reduced-motion:reduce)').matches)content.animate([{opacity:.45,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:160,easing:'cubic-bezier(.2,.8,.2,1)'});document.title=active.title;parent.postMessage({type:'wiki-page',path:active.path,anchor:anchor||''},'*');if(anchor){try{document.getElementById(decodeURIComponent(anchor))?.scrollIntoView()}catch{}}else{scrollTo(0,0)}}else{content.textContent=path?'This wiki page is no longer available. Choose a page from the sidebar.':'Ask in chat to create a wiki topic.'}}
      content.addEventListener('click',event=>{const link=event.target.closest('a');if(!link)return;const value=link.getAttribute('href');if(value?.startsWith('clarity://item/')&&parent!==window){event.preventDefault();parent.postMessage({type:'navigate',url:value},'*');return}if(!value||/^[a-z]+:|^\\/\\//i.test(value))return;const [target,anchor]=value.split('#');if(target&&!target.toLowerCase().endsWith('.md')){const base=new URL(active.path,location.href.split('#')[0]);link.href=new URL(target,base).toString();return}event.preventDefault();const segments=target?active.path.split('/').slice(0,-1):active.path.split('/');if(target)for(const part of decodeURIComponent(target).split('/')){if(part==='..')segments.pop();else if(part!=='.')segments.push(part)}location.hash=encodeURIComponent(segments.join('/'))+(anchor?'#'+anchor:'');if(anchor)render()});document.getElementById('search').addEventListener('input',renderList);addEventListener('hashchange',render);addEventListener('scroll',()=>{if(active)parent.postMessage({type:'wiki-position',path:active.path,top:scrollY},'*')},{passive:true});addEventListener('message',event=>{if(event.source===parent&&event.data?.type==='wiki-restore'&&Number.isFinite(event.data.top))scrollTo(0,event.data.top)});renderList();render();
      </script></body></html>`;
    const destination = join(this.files.root, 'Wiki', 'index.html');
    const temporary = `${destination}.${randomUUID()}.tmp`;
    await writeFile(temporary, html);
    await rename(temporary, destination);
  }
}
