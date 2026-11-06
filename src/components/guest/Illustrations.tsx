import type { SVGProps } from "react";

type IllProps = Omit<SVGProps<SVGSVGElement>, "children"> & { size?: number; title?: string };

function Ill({ size = 64, title, children, ...rest }: IllProps & { children: React.ReactNode }) {
  return (
    <svg
      className="g-ill"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      {...rest}
    >
      {children}
    </svg>
  );
}
// Pallet palette: ink outlines, vivid fills.
const G = "#1f8a4c";
const I = "#0b0b0b";
const B = "#f7ef4a";
const S = "#c9f27a";
const C = "#ff8fa0";
const O = "#ff6a2b";

export function Sprig(p: IllProps) {
  return (
    <Ill {...p}>
      <path d="M32 58C31 42 32 26 34 8" stroke={G} />
      <path d="M33 22C22 22 16 15 15 8c10 0 18 4 18 14Z" fill={S} stroke={I} />
      <path d="M33 34c11 0 17-7 18-14-10 0-18 4-18 14Z" fill={B} stroke={I} />
      <path d="M32 46C22 46 17 40 16 33c9 0 16 4 16 13Z" fill={S} stroke={I} />
    </Ill>
  );
}
export function Tag(p: IllProps) {
  return (
    <Ill {...p}>
      <path d="M8 32 32 8h20a4 4 0 0 1 4 4v20L32 56a4 4 0 0 1-6 0L8 38a4 4 0 0 1 0-6Z" fill={O} stroke={I} transform="translate(0 1)" />
      <circle cx="46" cy="18" r="3.5" fill="#fff" stroke={I} />
      <path d="M24 38l10-10M28 44l12-12" stroke={I} />
    </Ill>
  );
}
export function Bookmark(p: IllProps) {
  return (
    <Ill {...p}>
      <path d="M16 8h32a2 2 0 0 1 2 2v46L32 44 14 56V10a2 2 0 0 1 2-2Z" fill={S} stroke={I} />
      <path d="m32 17 3.2 6.5 7.1 1-5.2 5 1.3 7.1L32 33.2l-6.4 3.4 1.3-7.1-5.2-5 7.1-1Z" fill={B} stroke={I} strokeWidth={1.8} />
    </Ill>
  );
}
export function Ticket(p: IllProps) {
  return (
    <Ill {...p}>
      <path d="M6 18a2 2 0 0 1 2-2h48a2 2 0 0 1 2 2v7a7 7 0 0 0 0 14v7a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-7a7 7 0 0 0 0-14Z" fill={B} stroke={I} />
      <path d="M42 18v28" stroke={I} />
      <path d="M16 28h18M16 36h12" stroke={I} />
    </Ill>
  );
}
export function Key(p: IllProps) {
  return (
    <Ill {...p}>
      <circle cx="21" cy="32" r="12" fill={B} stroke={I} />
      <circle cx="21" cy="32" r="4" fill="#fff" stroke={I} />
      <path d="M33 32h24M50 32v9M42 32v6" stroke={I} />
      <path d="M12 22c2-3 5-4 8-4" stroke="#fff" />
    </Ill>
  );
}
export function HandCard(p: IllProps) {
  return (
    <Ill {...p}>
      <rect x="14" y="8" width="34" height="24" rx="5" fill={O} stroke={I} transform="rotate(-8 31 20)" />
      <path d="M20 17h14" stroke={I} transform="rotate(-8 31 20)" />
      <circle cx="40" cy="20" r="3" fill={B} stroke={I} strokeWidth={1.6} transform="rotate(-8 31 20)" />
      <path d="M6 44c6-2 10-6 16-6h14c3 0 4 4 1 5l-9 2h12l12-5c3-1 6 2 3 4L40 58H20L6 54Z" fill={C} stroke={I} />
    </Ill>
  );
}

export const ILLUSTRATIONS = { Sprig, Tag, Bookmark, Ticket, Key, HandCard };
