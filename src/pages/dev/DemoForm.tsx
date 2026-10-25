import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button, Checkbox, Field, FormErrorSummary, Input, Select, Textarea } from '@/components/ui'
import { CURRENCIES } from '@/types'
import styles from './UiKitPage.module.css'

/*
 * Dev-only demo: UI-kit form controls + react-hook-form + zod.
 * Messages are hard-coded English here; real forms (stage 3.4) will use i18n keys.
 */
const dates = z.object({
  startDate: z.string().min(1, { error: 'Pick a date' }),
  endDate: z.string().min(1, { error: 'Pick a date' }),
})

const schema = z
  .object({
    title: z.string().trim().min(2, { error: 'Add a name (2–80 characters)' }).max(80, { error: 'Add a name (2–80 characters)' }),
    destination: z.string().trim().min(1, { error: 'Enter a destination' }),
    ...dates.shape,
    currency: z.enum(CURRENCIES),
    amount: z.number({ error: 'Enter an amount' }).positive({ error: 'Must be greater than 0' }),
    notes: z.string().max(1000, { error: 'Max 1000 characters' }),
    needsBooking: z.boolean(),
  })
  // Cross-field rule, error attached to endDate.
  // Zod 4 skips object-level refinements while ANY field is invalid; `when` makes it run
  // as soon as the dates themselves are valid, so the user sees this error together with the others.
  .refine((data) => data.endDate >= data.startDate, {
    error: 'End can’t be before start',
    path: ['endDate'],
    when: (payload) => dates.safeParse(payload.value).success,
  })

type FormValues = z.infer<typeof schema>

export default function DemoForm() {
  const [result, setResult] = useState<string>()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched', // first error after blur (or submit), then live while typing
    defaultValues: { title: '', destination: '', startDate: '', endDate: '', currency: 'EUR', notes: '', needsBooking: false },
  })

  const onSubmit = (values: FormValues) => setResult(JSON.stringify(values, null, 2))

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      {isSubmitted && <FormErrorSummary count={Object.keys(errors).length} />}

      <Field label="Name" required error={errors.title?.message}>
        <Input placeholder="Lisbon & Porto" {...register('title')} />
      </Field>
      <Field label="Destination" required error={errors.destination?.message} hint="City or country">
        <Input {...register('destination')} />
      </Field>
      <div className={styles.grid2}>
        <Field label="Start" required error={errors.startDate?.message}>
          {/* deps: changing the start re-validates the end (the cross-field rule lives on endDate) */}
          <Input type="date" {...register('startDate', { deps: ['endDate'] })} />
        </Field>
        <Field label="End" required error={errors.endDate?.message}>
          <Input type="date" {...register('endDate')} />
        </Field>
      </div>
      <div className={styles.grid2}>
        <Field label="Amount" required error={errors.amount?.message}>
          <Input type="number" inputMode="decimal" step="0.01" placeholder="0" {...register('amount', { valueAsNumber: true })} />
        </Field>
        <Field label="Currency">
          <Select options={CURRENCIES.map((c) => ({ value: c, label: c }))} {...register('currency')} />
        </Field>
      </div>
      <Field label="Notes" optional error={errors.notes?.message}>
        <Textarea placeholder="Ideas, links, reminders" {...register('notes')} />
      </Field>
      <Checkbox label="Needs booking → add task to “Before the trip”" {...register('needsBooking')} />

      <div className={styles.row}>
        <Button type="submit" variant="primary">
          Validate
        </Button>
        <Button type="reset" variant="secondary" onClick={() => setResult(undefined)}>
          Reset
        </Button>
      </div>
      {result && <pre className={styles.result}>{result}</pre>}
    </form>
  )
}
