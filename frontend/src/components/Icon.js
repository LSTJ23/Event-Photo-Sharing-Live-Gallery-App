const PATHS = {
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  bell: <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 21h4" />,
  img: <><rect x="3.5" y="4" width="17" height="16" rx="2.5" /><circle cx="9" cy="10" r="1.6" /><path d="M4 18l5.5-5 4 3.5 3-2.5 3.5 3" /></>,
  chart: <><rect x="3.5" y="4" width="17" height="16" rx="2.5" /><path d="M6.5 15l3.5-4 3 2.5 4.5-5" /></>,
  qr: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><path d="M14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z" /></>,
  flag: <path d="M5 21V4M5 5h12l-2 4 2 4H5" />,
  back: <path d="M15 5l-7 7 7 7" />,
};

export default function Icon({ name, fill = false }) {
  return (
    <svg viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"} stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
