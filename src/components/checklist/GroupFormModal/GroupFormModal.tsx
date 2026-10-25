import { useId, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Field, Input, Modal } from '@/components/ui'

export const GROUP_TITLE_MAX = 40

export interface GroupFormModalProps {
  open: boolean
  onClose: () => void
  /** Current name when renaming; absent → a new group */
  initialTitle?: string
  onSubmit: (title: string) => void
}

/**
 * Name of a packing group (new / rename). One field — plain state instead of
 * react-hook-form + zod: the rule is just "not empty, up to 40 characters".
 */
export function GroupFormModal({ open, onClose, initialTitle, onSubmit }: GroupFormModalProps) {
  const { t } = useTranslation()
  const formId = useId()
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={t(initialTitle === undefined ? 'checklist.groupForm.createTitle' : 'checklist.groupForm.renameTitle')}
      footer={
        <>
          <Button onClick={onClose}>{t('actions.cancel')}</Button>
          <Button variant="primary" type="submit" form={formId}>
            {initialTitle === undefined ? t('checklist.groupForm.create') : t('actions.save')}
          </Button>
        </>
      }
    >
      {/* Mounted only while open (Modal) → the field starts fresh every time */}
      <GroupForm id={formId} initialTitle={initialTitle ?? ''} onSubmit={onSubmit} onDone={onClose} />
    </Modal>
  )
}

function GroupForm({
  id,
  initialTitle,
  onSubmit,
  onDone,
}: {
  id: string
  initialTitle: string
  onSubmit: (title: string) => void
  onDone: () => void
}) {
  const { t } = useTranslation()
  const [title, setTitle] = useState(initialTitle)
  const [error, setError] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const value = title.trim()
    if (!value || value.length > GROUP_TITLE_MAX) {
      setError(true)
      return
    }
    onSubmit(value)
    onDone()
  }

  return (
    <form id={id} onSubmit={submit} noValidate>
      <Field label={t('checklist.groupForm.name')} required error={error ? t('checklist.groupForm.error') : undefined}>
        <Input
          data-autofocus
          maxLength={GROUP_TITLE_MAX}
          autoComplete="off"
          placeholder={t('checklist.groupForm.namePlaceholder')}
          value={title}
          onChange={(event) => {
            setTitle(event.target.value)
            setError(false)
          }}
        />
      </Field>
    </form>
  )
}
