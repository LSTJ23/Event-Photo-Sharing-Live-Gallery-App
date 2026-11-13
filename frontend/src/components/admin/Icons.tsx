type IconProps = { size?: number };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function PlusCircleIcon({ size = 56 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 7v10M7 12h10" />
    </svg>
  );
}

export function StarIcon({ size = 56 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M12 3l2.7 5.9 6.3.7-4.7 4.3 1.3 6.3L12 17l-5.6 3.2 1.3-6.3L3 9.6l6.3-.7z" />
    </svg>
  );
}

export function UsersIcon({ size = 56 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="12" cy="6.5" r="3" />
      <circle cx="4.5" cy="9.5" r="2.2" />
      <circle cx="19.5" cy="9.5" r="2.2" />
      <path d="M12 11c-3.3 0-6 1.8-6 4v2.5h12V15c0-2.2-2.7-4-6-4z" />
      <path d="M4.5 12.5C2.6 12.7 1 13.8 1 15.3V17h3.5v-2c0-.9.4-1.7 1-2.4-.4-.1-.7-.1-1-.1zM19.5 12.5c-.3 0-.6 0-1 .1.6.7 1 1.500 1 2.400v2H23v-1.700c0-1.500-1.600-2.600-3.500-2.800z" />
    </svg>
  );
}

export function ArrowLeftIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

export function SearchIcon({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth={2.5}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </svg>
  );
}
