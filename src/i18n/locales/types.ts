/** Extra plural forms some languages need (Russian: _few, _many). */
type ExtraPluralKey = `${string}_${'zero' | 'two' | 'few' | 'many'}`

/**
 * Shape a translation must have to match the English source:
 * - every key from `T` is required (a missing key is a compile error);
 * - values are any strings (not the English literals);
 * - extra plural forms are allowed; any other unknown key is an error (typo guard).
 */
export type LocaleOf<T> = {
  [K in keyof T]: T[K] extends string ? string : LocaleOf<T[K]>
} & { [K in ExtraPluralKey]?: string }
