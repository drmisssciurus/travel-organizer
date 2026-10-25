import { cx } from '@/utils/cx'
import styles from './Avatar.module.css'

const COLOR_COUNT = 5

/** Stable color index for a seed: the same trip always gets the same color. */
function colorIndex(seed: string): number {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return Math.abs(hash) % COLOR_COUNT
}

export interface AvatarProps {
  /** Text to take the first letter from (trip title, user name) */
  name: string
  /** What the color is derived from — usually the entity id. Defaults to `name`. */
  seed?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  round?: boolean
  className?: string
}

/**
 * Letter avatar ("L" for "Lisbon & Porto").
 * Decorative: the name is always shown next to it, so it's hidden from screen readers.
 */
export function Avatar({ name, seed, size = 'md', round, className }: AvatarProps) {
  const letter = name.trim().charAt(0).toUpperCase() || '?'
  return (
    <span
      className={cx(styles.avatar, styles[size], styles[`c${colorIndex(seed ?? name)}`], round && styles.round, className)}
      aria-hidden="true"
    >
      {letter}
    </span>
  )
}
