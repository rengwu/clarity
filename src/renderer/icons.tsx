import React from 'react';

const paths: Record<string, React.ReactNode> = {
  chat: (
    <path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9 9 0 0 1-4-.9L3 21l1.6-5A8.5 8.5 0 1 1 21 11.5Z" />
  ),
  notes: (
    <>
      <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8Z" />
      <path d="M14 3v6h5M8 13h8M8 17h6" />
    </>
  ),
  todos: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  wiki: (
    <>
      <path d="M12 5c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1ZM12 5v15" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 3v5M17 3v5M3 11h18M7 15h3M14 15h3" />
    </>
  ),
  expenses: (
    <>
      <rect x="3" y="5" width="18" height="15" rx="2" />
      <path d="M3 9h18M15 14h3M6 5V3h12" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 6 9 7 9-7" />
    </>
  ),
  news: (
    <>
      <path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16" />
      <circle cx="5" cy="19" r="1" />
    </>
  ),
  bookmarks: <path d="M6 3h12v18l-6-4-6 4Z" />,
  music: (
    <>
      <path d="M9 18V5l12-2v13M9 9l12-2" />
      <ellipse cx="6" cy="18" rx="3" ry="3" />
      <ellipse cx="18" cy="16" rx="3" ry="3" />
    </>
  ),
  board: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 15h7M14 20h5" />
    </>
  ),
  automations: (
    <>
      <path d="m13 2-9 12h7l-1 8 10-13h-7Z" />
    </>
  ),
  settings: (
    <>
      <path d="m10 3-.6 2-2 .9-2-.5L3 9l1.5 1.5v3L3 15l2.4 3.6 2-.5 2 .9.6 2h4l.6-2 2-.9 2 .5L21 15l-1.5-1.5v-3L21 9l-2.4-3.6-2 .5-2-.9L14 3Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </>
  ),
  plus: <path d="M12 4v16M4 12h16" />,
  list: <path d="M8 5h13M8 12h13M8 19h13M3 5h.01M3 12h.01M3 19h.01" />,
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 7v5h-5M4 17v-5h5" />
      <path d="M6 6a8 8 0 0 1 13 2l1 4M4 12l1 4a8 8 0 0 0 13 2" />
    </>
  ),
  shuffle: (
    <>
      <path d="m17 3 4 4-4 4M17 13l4 4-4 4M3 7h2c6 0 6 10 12 10h4M3 17h2c2.4 0 4-1.6 5.5-4M13.5 8C14.6 7.3 15.7 7 17 7h4" />
    </>
  ),
  repeat: (
    <>
      <path d="m17 2 4 4-4 4M3 10V8a2 2 0 0 1 2-2h16M7 22l-4-4 4-4M21 14v2a2 2 0 0 1-2 2H3" />
    </>
  ),
  volume: (
    <>
      <path d="m11 5-6 4H2v6h3l6 4ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  appearance: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" />
    </>
  ),
  shield: <path d="M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6ZM8 12l3 3 5-6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  trash: <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />,
  code: <path d="m8 6-6 6 6 6M16 6l6 6-6 6M14 3l-4 18" />,
  left: <path d="m14 6-6 6 6 6" />,
  right: <path d="m10 6 6 6-6 6" />,
  down: <path d="m6 9 6 6 6-6" />,
  up: <path d="m6 15 6-6 6 6" />,
  sidebar: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
    </>
  ),
  external: <path d="M14 4h6v6M20 4l-9 9M10 5H5v14h14v-5" />,
  folder: (
    <path d="M3 7V5a1 1 0 0 1 1-1h5l2 3h9a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
  ),
  send: <path d="M12 20V4m-7 7 7-7 7 7" />,
  stop: <rect x="6" y="6" width="12" height="12" rx="1" />,
  play: <path d="m8 4 12 8-12 8Z" />,
  pause: (
    <>
      <path d="M8 5v14M16 5v14" />
    </>
  ),
  previous: <path d="M5 4v16M19 4 7 12l12 8Z" />,
  next: <path d="M19 4v16M5 4l12 8-12 8Z" />,
  check: <path d="m5 12 4 4L19 6" />,
  edit: (
    <>
      <path d="m15 4 5 5M4 20l5-1L21 7l-5-5L4 14Z" />
    </>
  ),
};

export function Icon({ name, size = 16 }: { name: string; size?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.notes}
    </svg>
  );
}
