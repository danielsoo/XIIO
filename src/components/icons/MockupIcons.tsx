type IconProps = { className?: string };

const stroke = 1.75;

export function IconPlay({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5.5v13l11-6.5L8 5.5z" />
    </svg>
  );
}

export function IconPlayOutline({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="9" strokeWidth={stroke} />
      <path d="M10 8.5v7l5.5-3.5L10 8.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconPlus({ className = "w-3.5 h-3.5" }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeWidth={2} d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconChevronDown({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function IconChevronRight({ className = "w-3.5 h-3.5" }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function IconArrowRight({ className = "w-3.5 h-3.5" }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function IconSearch({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeWidth={stroke} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
    </svg>
  );
}

export function IconBell({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={stroke}
        d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0"
      />
    </svg>
  );
}

export function IconScrollNext({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} d="M9 6l6 6-6 6" />
    </svg>
  );
}

/** Reaction trigger — round smiley face with a small "+" badge. */
export function IconSmilePlus({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <circle cx="10" cy="10" r="7" strokeWidth={stroke} />
      <path strokeLinecap="round" strokeWidth={stroke} d="M7.5 9.3h.01M12.5 9.3h.01" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} d="M7.3 11.8c.9 1 2.5 1 3.4 0" />
      <circle cx="17.5" cy="16.5" r="4" strokeWidth={stroke} />
      <path strokeLinecap="round" strokeWidth={stroke} d="M17.5 14.8v3.4M15.8 16.5h3.4" />
    </svg>
  );
}

/** Reply trigger — a clean curved arrow (universal reply glyph). */
export function IconReply({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} d="M9 17l-5-5 5-5" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} d="M4 12h9a5 5 0 015 5v1" />
    </svg>
  );
}

export function IconDotsVertical({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="5.5" r="1.9" />
      <circle cx="12" cy="12" r="1.9" />
      <circle cx="12" cy="18.5" r="1.9" />
    </svg>
  );
}
