import { useId, useState, type FormEvent } from 'react'
import { BottomSheet, Button, ConfirmDialog, Field, Input, Modal, Select } from '@/components/ui'
import styles from './UiKitPage.module.css'

/* Dev-only demo of Modal, ConfirmDialog and BottomSheet. */
export default function OverlaysDemo() {
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sheetExpanded, setSheetExpanded] = useState(false)
  const [log, setLog] = useState('—')
  const formId = useId()

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(e.currentTarget))
    setLog(`saved: ${JSON.stringify(data)}`)
    setModalOpen(false)
  }

  return (
    <>
      <div className={styles.row}>
        <Button variant="primary" icon="+" onClick={() => setModalOpen(true)}>
          Add expense (modal)
        </Button>
        <Button variant="dangerOutline" onClick={() => setConfirmOpen(true)}>
          Delete trip…
        </Button>
        <span className="meta" data-testid="overlay-log">
          {log}
        </span>
      </div>
      <p className="meta">BottomSheet is mobile-only (≤ 720px) — shrink the window to see it.</p>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add expense"
        footer={
          <>
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            {/* `form` attribute submits the form that lives in the modal body */}
            <Button type="submit" form={formId} variant="primary">
              Save
            </Button>
          </>
        }
      >
        <form id={formId} onSubmit={onSubmit} className={styles.form}>
          <Field label="What" required>
            <Input name="title" placeholder="Taxi from airport" />
          </Field>
          <div className={styles.grid2}>
            <Field label="Amount, €" required>
              <Input name="amount" type="number" placeholder="0" />
            </Field>
            <Field label="Category">
              <Select
                name="category"
                options={[
                  { value: 'transport', label: 'Transport' },
                  { value: 'food', label: 'Food' },
                ]}
              />
            </Field>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete trip?"
        message="“Crete with family” and its plan, ideas, expenses and checklist will be deleted. This can’t be undone."
        confirmLabel="Delete"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setLog('deleted ✓')
          setConfirmOpen(false)
        }}
      />

      <BottomSheet title="Ideas · 4" meta="drag into the day" expanded={sheetExpanded} onExpandedChange={setSheetExpanded}>
        <div className={styles.row}>
          {['Sintra palaces', 'Tram 28', 'Fado evening', 'Douro wine tour'].map((idea) => (
            <Button key={idea} size="sm">
              {idea}
            </Button>
          ))}
        </div>
      </BottomSheet>
    </>
  )
}
