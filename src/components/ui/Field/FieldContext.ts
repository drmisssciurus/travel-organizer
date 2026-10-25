import { createContext, useContext } from 'react'

export interface FieldContextValue {
  /** id of the control — the <label htmlFor> points here */
  id: string
  /** ids for aria-describedby (hint + error), already joined */
  describedBy?: string
  invalid: boolean
  required: boolean
}

export const FieldContext = createContext<FieldContextValue | null>(null)

interface ControlA11yProps {
  id?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling'
  required?: boolean
}

/**
 * Merges a control's own props with the surrounding <Field>:
 * id, aria-describedby, aria-invalid and aria-required are wired automatically.
 * Outside a <Field> the props are returned unchanged.
 */
export function useFieldControl<P extends ControlA11yProps>(props: P) {
  const field = useContext(FieldContext)
  if (!field) return { props, invalid: Boolean(props['aria-invalid']) }

  const describedBy = [props['aria-describedby'], field.describedBy].filter(Boolean).join(' ') || undefined
  const invalid = field.invalid || Boolean(props['aria-invalid'])

  return {
    invalid,
    props: {
      ...props,
      id: props.id ?? field.id,
      'aria-describedby': describedBy,
      'aria-invalid': invalid || undefined,
      // aria-required instead of `required`: keeps native browser bubbles out, our validation owns the UX
      'aria-required': field.required || undefined,
    },
  }
}
