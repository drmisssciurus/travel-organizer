import {
  Avatar,
  Badge,
  Button,
  ButtonLink,
  Checkbox,
  EmptyState,
  Field,
  IconButton,
  Input,
  ProgressBar,
  Select,
  type ButtonVariant,
} from '@/components/ui'
import { TripStatusBadge } from '@/components/trips/TripStatusBadge'
import DemoForm from './DemoForm'
import NavDemo from './NavDemo'
import OverlaysDemo from './OverlaysDemo'
import ToastDemo from './ToastDemo'
import styles from './UiKitPage.module.css'

/* Dev-only showcase of the UI kit (route /dev/ui). Not translated on purpose. */

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'dangerOutline', 'danger', 'ghost']
const TRIPS = [
  ['Crete with family', 'crete'],
  ['Berlin tech conference', 'berlin'],
  ['Lisbon & Porto', 'lisbon'],
  ['Eilat dive weekend', 'eilat'],
  ['Tbilisi food trip', 'tbilisi'],
  ['Kyoto in spring', 'kyoto'],
] as const

export default function UiKitPage() {
  return (
    <div className={styles.page}>
      <div>
        <h1>UI kit</h1>
        <p className="meta">Dev-only preview · switch theme and language in the header</p>
      </div>

      <section className={styles.section}>
        <span className="label">Button · variants</span>
        <div className={styles.row}>
          {VARIANTS.map((v) => (
            <Button key={v} variant={v}>
              {v}
            </Button>
          ))}
        </div>
        <span className="label">Button · size sm</span>
        <div className={styles.row}>
          {VARIANTS.map((v) => (
            <Button key={v} variant={v} size="sm">
              {v}
            </Button>
          ))}
        </div>
        <span className="label">Icon · disabled · link · full width</span>
        <div className={styles.row}>
          <Button variant="primary" icon="+">
            New trip
          </Button>
          <Button variant="secondary" disabled>
            Disabled
          </Button>
          <ButtonLink to="/" variant="secondary" size="sm">
            ButtonLink → /
          </ButtonLink>
        </div>
        <div className={styles.narrow}>
          <Button variant="primary" fullWidth icon="+">
            Expense
          </Button>
        </div>
      </section>

      <section className={styles.section}>
        <span className="label">IconButton · circle</span>
        <div className={styles.row}>
          <IconButton label="Back" icon="←" />
          <IconButton label="Theme" icon="◐" />
          <IconButton label="Previous days" icon="‹" size="sm" />
          <IconButton label="Next days" icon="›" size="sm" />
          <IconButton label="Add stop" icon="+" variant="primary" />
        </div>
        <span className="label">IconButton · square (table row actions)</span>
        <div className={styles.row}>
          <IconButton label="Edit" icon="✎" shape="square" />
          <IconButton label="Delete" icon="×" shape="square" variant="danger" />
          <IconButton label="Edit" icon="✎" shape="square" size="sm" />
          <IconButton label="Delete" icon="×" shape="square" size="sm" variant="danger" />
          <IconButton label="Remove" icon="×" shape="square" size="sm" variant="ghost" />
        </div>
      </section>

      <section className={styles.section}>
        <span className="label">Fields · states</span>
        <div className={styles.grid2}>
          <Field label="Default" hint="Helper text under the control">
            <Input placeholder="Placeholder" />
          </Field>
          <Field label="With error" required error="Enter a destination">
            <Input defaultValue="" placeholder="City or country" />
          </Field>
          <Field label="Disabled" optional>
            <Input disabled defaultValue="Read only" />
          </Field>
          <Field label="Small">
            <Input inputSize="sm" placeholder="What to pack?" />
          </Field>
        </div>
        <span className="label">Search · pill select · checkbox</span>
        <div className={styles.row}>
          <Input variant="search" type="search" placeholder="Search by name or destination" aria-label="Search" style={{ maxWidth: 360 }} />
          <Select pill aria-label="Category" options={[{ value: 'all', label: 'Category: all' }, { value: 'food', label: 'Food' }]} />
          <Checkbox label="Passports" defaultChecked strikeWhenChecked />
          <Checkbox label="Power bank" strikeWhenChecked />
        </div>
      </section>

      <section className={styles.section}>
        <span className="label">Form demo · react-hook-form + zod</span>
        <DemoForm />
      </section>

      <section className={styles.section}>
        <span className="label">TabNav · SegmentedControl · Menu</span>
        <NavDemo />
      </section>

      <section className={styles.section}>
        <span className="label">Overlays · Modal · ConfirmDialog · BottomSheet</span>
        <OverlaysDemo />
      </section>

      <section className={styles.section}>
        <span className="label">Badge · tones</span>
        <div className={styles.row}>
          <Badge tone="solid">Now</Badge>
          <Badge tone="soft">In 12 days</Badge>
          <Badge tone="soft">Upcoming</Badge>
          <Badge tone="muted">Past</Badge>
          <Badge tone="danger">Overdue</Badge>
          <Badge tone="solid" size="sm">
            3 left
          </Badge>
          <Badge tone="soft" size="sm">
            all done
          </Badge>
        </div>
        <span className="label">TripStatusBadge · short (list) · translated</span>
        <div className={styles.row}>
          <TripStatusBadge status="ongoing" daysUntilStart={-2} />
          <TripStatusBadge status="upcoming" daysUntilStart={1} isNext />
          <TripStatusBadge status="upcoming" daysUntilStart={12} isNext />
          <TripStatusBadge status="upcoming" daysUntilStart={21} isNext />
          <TripStatusBadge status="upcoming" daysUntilStart={48} />
          <TripStatusBadge status="past" daysUntilStart={-40} />
        </div>
        <span className="label">TripStatusBadge · long (trip header)</span>
        <div className={styles.row}>
          <TripStatusBadge variant="long" status="upcoming" daysUntilStart={1} />
          <TripStatusBadge variant="long" status="upcoming" daysUntilStart={12} />
          <TripStatusBadge variant="long" status="upcoming" daysUntilStart={21} />
          <TripStatusBadge variant="long" status="upcoming" daysUntilStart={95} />
        </div>
        <span className="label">ProgressBar · readiness</span>
        <div className={styles.bars}>
          {[5, 30, 64, 100].map((v) => (
            <div key={v}>
              <ProgressBar value={v} label="Ready" />
              <span className="meta">{v}% ready</span>
            </div>
          ))}
        </div>
        <span className="label">ProgressBar · overflow · category colors · sm</span>
        <div className={styles.bars}>
          <div>
            <ProgressBar value={2120} max={2000} label="Spent" valueText="106% of 2 000 €" />
            <span className="meta">106% (value &gt; max → red)</span>
          </div>
          <ProgressBar value={560} max={1240} size="sm" color="var(--color-exp-stay)" label="Stay" />
          <ProgressBar value={380} max={1240} size="sm" color="var(--color-exp-transport)" label="Transport" />
          <ProgressBar value={190} max={1240} size="sm" color="var(--color-exp-food)" label="Food" />
          <ProgressBar value={80} max={1240} size="sm" color="var(--color-exp-activities)" label="Activities" />
        </div>
      </section>

      <section className={styles.section}>
        <span className="label">EmptyState</span>
        <div className={styles.empties}>
          <EmptyState
            icon="✈"
            title="No trips yet"
            description="Create your first trip: a destination and dates — then start planning."
            action={
              <Button variant="primary" size="sm" icon="+">
                New trip
              </Button>
            }
          />
          <EmptyState
            icon="?"
            title="Nothing found"
            description="No trips match “Rome” with status Upcoming"
            action={<Button size="sm">Reset filters</Button>}
          />
          <EmptyState icon="€" title="No expenses yet" compact card={false} />
        </div>
      </section>

      <section className={styles.section}>
        <span className="label">Toast · via Redux · undo = action</span>
        <ToastDemo />
      </section>

      <section className={styles.section}>
        <span className="label">Avatar · color derived from id</span>
        <div className={styles.row}>
          {TRIPS.map(([name, id]) => (
            <Avatar key={id} name={name} seed={id} />
          ))}
        </div>
        <span className="label">Avatar · sizes sm / md / lg / xl / round</span>
        <div className={styles.row}>
          <Avatar name="Lisbon" seed="lisbon" size="sm" />
          <Avatar name="Lisbon" seed="lisbon" size="md" />
          <Avatar name="Lisbon" seed="lisbon" size="lg" />
          <Avatar name="Lisbon" seed="lisbon" size="xl" />
          <Avatar name="Alina" size="sm" round />
        </div>
        <div className={`${styles.row} ${styles.inset}`}>
          <span className="meta">On inset background:</span>
          {TRIPS.map(([name, id]) => (
            <Avatar key={id} name={name} seed={id} size="sm" />
          ))}
        </div>
      </section>
    </div>
  )
}
