import { useState } from 'react'
import { IconButton, Menu, SegmentedControl, TabNav } from '@/components/ui'
import { paths, TRIP_TABS } from '@/routes/paths'
import styles from './UiKitPage.module.css'

/* Dev-only demo of TabNav, SegmentedControl and Menu. */
type Status = 'all' | 'upcoming' | 'ongoing' | 'past'
type Where = 'ideas' | 'day'

export default function NavDemo() {
  const [status, setStatus] = useState<Status>('all')
  const [where, setWhere] = useState<Where>('day')
  const [log, setLog] = useState('—')

  return (
    <>
      <TabNav
        label="Trip sections (demo)"
        items={TRIP_TABS.map((tab, i) => ({ to: paths.trip('demo', tab), label: tab, count: [10, undefined, '5/8'][i] }))}
      />
      <div className={styles.row}>
        <SegmentedControl
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: 'All', count: 6 },
            { value: 'upcoming', label: 'Upcoming', count: 4 },
            { value: 'ongoing', label: 'Now', count: 1 },
            { value: 'past', label: 'Past', count: 1 },
          ]}
        />
        <span className="meta" data-testid="status-value">
          status = {status}
        </span>
      </div>
      <div className={styles.narrow}>
        <SegmentedControl
          fullWidth
          label="Where to put it"
          value={where}
          onChange={setWhere}
          options={[
            { value: 'ideas', label: 'Ideas' },
            { value: 'day', label: 'A day' },
          ]}
        />
      </div>
      <div className={styles.row}>
        <Menu
          label="Group actions"
          align="start"
          items={[
            { id: 'rename', label: 'Rename', icon: '✎' },
            { id: 'duplicate', label: 'Duplicate', icon: '⧉', disabled: true },
            { id: 'delete', label: 'Delete group', icon: '×', danger: true },
          ]}
          onSelect={(id) => setLog(`menu → ${id}`)}
          renderTrigger={(props) => <IconButton {...props} label="Group actions" icon="⋯" shape="square" size="sm" />}
        />
        <span className="meta" data-testid="menu-log">
          {log}
        </span>
      </div>
    </>
  )
}
