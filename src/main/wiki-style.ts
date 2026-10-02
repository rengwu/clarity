export const wikiStyles = `
  :root {
    color-scheme: light dark;
    font: 14px/1.6 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    --bg: light-dark(#fcfcfc, #181818);
    --side: light-dark(#f3f3f3, #141414);
    --text: light-dark(#242424, #e7e7e7);
    --muted: light-dark(#636363, #a0a0a0);
    --line: light-dark(#14141412, #ffffff0f);
    --line-strong: light-dark(#14141425, #ffffff20);
    --hover: light-dark(#14141408, #ffffff0b);
    --selected: light-dark(#14141410, #ffffff12);
    --focus: light-dark(#506f80, #adbec8);
    background: var(--bg);
    color: var(--text);
  }
  :root[data-theme=light] { color-scheme: light; }
  :root[data-theme=dark] { color-scheme: dark; }
  * { box-sizing: border-box; scrollbar-width: thin; scrollbar-color: var(--line-strong) transparent; }
  body { margin: 0; display: grid; grid-template-columns: 220px minmax(0,1fr); min-height: 100vh; }
  nav { position: sticky; top: 0; height: 100vh; overflow: auto; padding: 8px; border-right: 1px solid var(--line); font-size: 12px; background: var(--side); }
  nav a { display: flex; align-items: center; gap: 7px; min-height: 26px; padding: 3px 8px; line-height: 20px; margin-bottom: 2px; border-radius: 5px; text-decoration: none; color: var(--muted); transition: color 120ms, background 120ms; }
  nav a:hover { background: var(--hover); color: var(--text); }
  nav a[aria-current=page] { background: var(--selected); color: var(--text); }
  input[type=search] { width: 100%; height: 28px; padding: 5px 8px; margin-bottom: 8px; background: var(--bg); border: 1px solid var(--line-strong); border-radius: 5px; color: inherit; font: inherit; }
  input[type=checkbox] { appearance: none; display: inline-grid; place-items: center; width: 15px; height: 15px; margin: 0 5px 0 0; border: 1px solid var(--muted); border-radius: 3px; vertical-align: middle; }
  input[type=checkbox]:checked { background: var(--muted); }
  input[type=checkbox]:checked::after { content: ''; width: 11px; height: 11px; background: var(--bg); mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='m2 6 2.6 2.6L10 3' fill='none' stroke='black' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/contain no-repeat; }
  main { padding: 24px 32px 48px; max-width: 900px; min-width: 0; }
  h1 { margin: 0 0 16px; font-size: 26px; line-height: 1.3; font-weight: 600; }
  h2 { font-size: 20px; margin: 24px 0 10px; }
  h3 { font-size: 16px; }
  p { margin: 10px 0; }
  a { color: inherit; text-underline-offset: 3px; }
  a:focus-visible, input:focus-visible { outline: 1px solid var(--focus); outline-offset: 1px; }
  pre { overflow: auto; background: var(--hover); padding: 12px; border-radius: 5px; }
  code { font-family: ui-monospace, monospace; font-size: 12px; }
  img { max-width: 100%; height: auto; }
  table { border-collapse: collapse; }
  td, th { border: 1px solid var(--line); padding: 6px 10px; }
  blockquote { border-left: 2px solid var(--line-strong); margin-left: 0; padding-left: 16px; color: var(--muted); }
  @media(max-width:600px) { main { padding: 20px 24px; } }
  :root[data-motion=reduced] * { transition: none !important; }
  @media(prefers-reduced-motion:reduce) { * { transition: none !important; } }
`;
