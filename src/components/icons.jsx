export function ComputerIcon({ small = false }) {
  const s = small ? 16 : 32;
  return (
    <svg width={s} height={s} viewBox="0 0 32 32" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="3" y="4" width="24" height="18" fill="#d4d0c8" />
      <rect x="3" y="4" width="24" height="1" fill="#ffffff" />
      <rect x="3" y="4" width="1" height="18" fill="#ffffff" />
      <rect x="26" y="4" width="1" height="18" fill="#808080" />
      <rect x="3" y="21" width="24" height="1" fill="#404040" />
      <rect x="6" y="7" width="18" height="12" fill="#1a3a66" />
      <rect x="6" y="7" width="18" height="1" fill="#0c1c33" />
      <rect x="6" y="7" width="1" height="12" fill="#0c1c33" />
      <rect x="23" y="7" width="1" height="12" fill="#2a5a99" />
      <rect x="6" y="18" width="18" height="1" fill="#2a5a99" />
      <rect x="8" y="9" width="6" height="1" fill="#4a8acc" />
      <rect x="8" y="11" width="10" height="1" fill="#3a6aa8" />
      <rect x="8" y="13" width="4" height="1" fill="#3a6aa8" />
      <rect x="13" y="22" width="6" height="3" fill="#a0a0a0" />
      <rect x="9" y="25" width="14" height="3" fill="#d4d0c8" />
      <rect x="9" y="27" width="14" height="1" fill="#808080" />
      <rect x="10" y="26" width="10" height="1" fill="#3a6aa8" />
    </svg>
  );
}

export function StartGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="7" y="1" width="2" height="14" fill="#a99fdb" />
      <rect x="1" y="7" width="14" height="2" fill="#a99fdb" />
      <rect x="3" y="3" width="2" height="2" fill="#6a619b" />
      <rect x="11" y="3" width="2" height="2" fill="#6a619b" />
      <rect x="3" y="11" width="2" height="2" fill="#6a619b" />
      <rect x="11" y="11" width="2" height="2" fill="#6a619b" />
      <rect x="6" y="6" width="4" height="4" fill="#dcd9ea" />
    </svg>
  );
}

export function ErrorIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#d40000" />
      <path d="M8 8 L16 16 M16 8 L8 16" stroke="#ffffff" strokeWidth="2.5" />
    </svg>
  );
}

export function SpeakerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <rect x="1" y="5" width="3" height="4" fill="currentColor" />
      <path d="M4 5 L8 2 L8 12 L4 9 Z" fill="currentColor" />
      <path d="M10 4 Q12 7 10 10" stroke="currentColor" fill="none" strokeWidth="1.4" />
    </svg>
  );
}

export function SpeakerOffIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <rect x="1" y="5" width="3" height="4" fill="currentColor" />
      <path d="M4 5 L8 2 L8 12 L4 9 Z" fill="currentColor" />
      <path d="M10 4 Q12 7 10 10" stroke="currentColor" fill="none" strokeWidth="1.4" />
      <path d="M2 2 L12 12" stroke="#d40000" strokeWidth="1.6" />
    </svg>
  );
}
