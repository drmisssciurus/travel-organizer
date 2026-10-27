/**
 * Small line icons as SVG. The ✎ and × characters are missing from Anonymous Pro, so each
 * system drew them from a fallback font — tiny and off-center on iPhone. SVG looks the same
 * everywhere. Sized in `em`: an icon follows the button's font size; color is `currentColor`.
 */

const base = {
  width: '1.15em',
  height: '1.15em',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const

export function EditIcon() {
  return (
    <svg {...base}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

export function CloseIcon() {
  return (
    <svg {...base} strokeWidth={2.4}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}
