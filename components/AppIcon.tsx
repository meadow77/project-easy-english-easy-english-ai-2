import type { SVGProps } from 'react';

export type AppIconName =
  | 'today'
  | 'words'
  | 'review'
  | 'bookmark'
  | 'search'
  | 'listen'
  | 'speak'
  | 'example'
  | 'note'
  | 'play'
  | 'pause'
  | 'stop'
  | 'check'
  | 'uncheck'
  | 'filter'
  | 'repeat'
  | 'test'
  | 'arrowRight'
  | 'close';

type AppIconProps = Omit<SVGProps<SVGSVGElement>, 'name'> & {
  name: AppIconName;
  size?: number;
};

export default function AppIcon({ name, size = 20, className, ...props }: AppIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {name === 'today' && <><rect x="3.5" y="5" width="17" height="15" rx="3" /><path d="M7.5 3.5v3M16.5 3.5v3M3.5 9h17M8 13h.01M12 13h.01M16 13h.01M8 16h.01M12 16h.01" /></>}
      {name === 'words' && <><path d="M4.5 5.5A3.5 3.5 0 0 1 8 4h9.5a2 2 0 0 1 2 2v13.5H8A3.5 3.5 0 0 0 4.5 23V5.5Z" /><path d="M4.5 19.5A3.5 3.5 0 0 1 8 16h11.5M8 8h7M8 11h5" /></>}
      {name === 'review' && <><path d="M20 7v5h-5" /><path d="M4 17v-5h5" /><path d="M6.4 9A7 7 0 0 1 18.5 6L20 7M4 17l1.5 1A7 7 0 0 0 17.6 15" /></>}
      {name === 'bookmark' && <><path d="M6.5 4.5A2.5 2.5 0 0 1 9 2h6a2.5 2.5 0 0 1 2.5 2.5V22L12 18.3 6.5 22V4.5Z" /><path d="m10 8 1.3 1.3L14.5 6" /></>}
      {name === 'search' && <><circle cx="10.5" cy="10.5" r="5.8" /><path d="m15 15 4.5 4.5" /></>}
      {name === 'listen' && <><path d="M4 10v4h3l4 3V7l-4 3H4Z" /><path d="M15 9.2a4.2 4.2 0 0 1 0 5.6M17.7 6.7a7.7 7.7 0 0 1 0 10.6" /></>}
      {name === 'speak' && <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v4M8.5 21h7" /></>}
      {name === 'example' && <><path d="M4.5 5.5A3.5 3.5 0 0 1 8 4c1.8 0 3 .7 4 2 1-1.3 2.2-2 4-2a3.5 3.5 0 0 1 3.5 3.5V19A3 3 0 0 0 16 18c-1.8 0-3 .6-4 1.8C11 18.6 9.8 18 8 18a3 3 0 0 0-3.5 1V5.5Z" /><path d="M12 6v13" /></>}
      {name === 'note' && <><rect x="5" y="3" width="14" height="18" rx="3" /><path d="M9 3v3M15 3v3M8.5 10h7M8.5 14h5M8.5 18h3" /></>}
      {name === 'play' && <path fill="currentColor" stroke="none" d="M8 5.5v13l10-6.5-10-6.5Z" />}
      {name === 'pause' && <><path d="M8.5 6v12M15.5 6v12" strokeWidth="3" /></>}
      {name === 'stop' && <rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor" stroke="none" />}
      {name === 'check' && <><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12 2.3 2.3 4.8-5" /></>}
      {name === 'uncheck' && <circle cx="12" cy="12" r="8.5" />}
      {name === 'filter' && <><path d="M4 6h16M7 12h10M10 18h4" /><circle cx="8" cy="6" r="1.5" fill="currentColor" /><circle cx="15" cy="12" r="1.5" fill="currentColor" /><circle cx="12" cy="18" r="1.5" fill="currentColor" /></>}
      {name === 'repeat' && <><path d="M18.5 8.5 21 11l-2.5 2.5M5.5 15.5 3 13l2.5-2.5" /><path d="M20.5 11H8.5a3.5 3.5 0 0 0-3.2 2.1M3.5 13h12a3.5 3.5 0 0 0 3.2-2.1" /></>}
      {name === 'test' && <><rect x="5" y="3" width="14" height="18" rx="3" /><path d="M9 3v3M15 3v3M9 11l1.5 1.5 3-3M9 16l1.5 1.5 3-3" /></>}
      {name === 'arrowRight' && <><path d="M5 12h13M13 6l6 6-6 6" /></>}
      {name === 'close' && <><path d="m7 7 10 10M17 7 7 17" /></>}
    </svg>
  );
}
