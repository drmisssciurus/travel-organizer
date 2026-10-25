import { zodResolver } from '@hookform/resolvers/zod'
import { useId, useMemo } from 'react'
import { useForm, type FieldError } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button, Field, FormErrorSummary, Input, Modal, Select } from '@/components/ui'
import { useAppDispatch, useAppSelector } from '@/hooks/store'
import { useToast } from '@/hooks/useToast'
import { expenseAdded, expenseUpdated } from '@/store/slices/expensesSlice'
import { selectLanguage } from '@/store/slices/settingsSlice'
import { EXPENSE_CATEGORIES, type Expense, type ISODate, type Trip } from '@/types'
import { formatDateRange } from '@/utils/format'
import {
  createExpenseSchema,
  emptyExpenseForm,
  EXPENSE_TITLE_MAX,
  expenseToForm,
  formToExpense,
  type ExpenseFormError,
  type ExpenseFormInput,
  type ExpenseFormOutput,
} from './expenseFormSchema'
import styles from './ExpenseFormModal.module.css'

export interface ExpenseFormModalProps {
  open: boolean
  onClose: () => void
  trip: Trip
  today: ISODate
  /** Expense to edit; without it — a new one */
  expense?: Expense
}

/** Create / edit an expense (also used by the "Today" screen, stage 7). */
export function ExpenseFormModal({ open, onClose, trip, today, expense }: ExpenseFormModalProps) {
  const { t } = useTranslation()
  const formId = useId()
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={t(expense ? 'expenses.form.editTitle' : 'expenses.form.createTitle')}
      closeOnBackdrop={false}
      footer={
        <>
          <Button onClick={onClose}>{t('actions.cancel')}</Button>
          <Button variant="primary" type="submit" form={formId}>
            {expense ? t('actions.save') : t('expenses.form.create')}
          </Button>
        </>
      }
    >
      <ExpenseForm id={formId} trip={trip} today={today} expense={expense} onDone={onClose} />
    </Modal>
  )
}

interface ExpenseFormProps {
  id: string
  trip: Trip
  today: ISODate
  expense?: Expense
  onDone: () => void
}

function ExpenseForm({ id, trip, today, expense, onDone }: ExpenseFormProps) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const toast = useToast()
  const language = useAppSelector(selectLanguage)
  const schema = useMemo(() => createExpenseSchema(trip), [trip])
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted },
  } = useForm<ExpenseFormInput, unknown, ExpenseFormOutput>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: expense ? expenseToForm(expense) : emptyExpenseForm(trip, today),
  })

  const errorText = (error?: FieldError) =>
    error?.message ? t(`expenses.form.errors.${error.message as ExpenseFormError}`) : undefined

  const onSubmit = (values: ExpenseFormOutput) => {
    const fields = formToExpense(values)
    if (expense) {
      dispatch(expenseUpdated({ id: expense.id, changes: fields }))
      toast({ message: t('expenses.form.saved') })
    } else {
      dispatch(expenseAdded(trip.id, fields))
      toast({ message: t('expenses.form.created') })
    }
    onDone()
  }

  return (
    <form id={id} className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      {isSubmitted && <FormErrorSummary count={Object.keys(errors).length} />}

      <Field label={t('expenses.form.title')} required error={errorText(errors.title)}>
        <Input
          placeholder={t('expenses.form.titlePlaceholder')}
          maxLength={EXPENSE_TITLE_MAX}
          autoComplete="off"
          {...register('title')}
        />
      </Field>

      <div className={styles.grid2}>
        <Field label={t('expenses.form.amount', { currency: trip.currency })} required error={errorText(errors.amount)}>
          {/* text + inputMode: allows "12,50" from Russian keyboards; type=number would reject the comma */}
          <Input inputMode="decimal" placeholder="0" autoComplete="off" {...register('amount')} />
        </Field>
        <Field label={t('expenses.form.category')}>
          <Select
            options={EXPENSE_CATEGORIES.map((value) => ({ value, label: t(`expenses.categories.${value}`) }))}
            {...register('category')}
          />
        </Field>
      </div>

      <Field
        label={t('expenses.form.date')}
        optional
        hint={t('expenses.form.dateHint', { range: formatDateRange(trip.startDate, trip.endDate, language, today) })}
        error={errorText(errors.date)}
      >
        <Input type="date" min={trip.startDate} max={trip.endDate} {...register('date')} />
      </Field>
    </form>
  )
}
