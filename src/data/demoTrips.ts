import type { TripSnapshot } from '@/store/actions/tripActions'
import type {
  ChecklistGroup,
  ChecklistItem,
  CurrencyCode,
  Day,
  Expense,
  ExpenseCategory,
  ISODate,
  ItemCategory,
  ItineraryItem,
  Language,
  Trip,
} from '@/types'
import { addDays } from '@/utils/date'
import { dateRange } from '@/utils/tripDays'

/**
 * Demo data loaded on the first launch: one trip to Prague (28 Oct – 5 Nov 2026)
 * with real places, coordinates, opening hours and tips — the test data for the map.
 *
 * Dates are fixed (`startDate`) rather than offsets from today, so the trip keeps its
 * real dates; the spec still supports `startIn` (offset from "today") for other demos.
 * Texts follow the UI language; place names / addresses are kept as they are written locally.
 * Ids are readable (`demo-prague-d1`) — easy to spot demo data in DevTools.
 *
 * Opening hours and prices: official sites (hrad.cz, katedralasvatehovita.cz,
 * synagogue.cz, prague.eu), checked 2026-10-25.
 */

type Text = Record<Language, string>

interface DemoItem {
  /** 1-based day number, or `null` for "Ideas" */
  day: number | null
  title: Text
  category: ItemCategory
  time?: string
  durationMin?: number
  location?: string
  /** Coordinates of `location` → the item is on the map */
  at?: readonly [lat: number, lng: number]
  note?: Text
  done?: boolean
  /** "Needs booking": a linked task, due N days from today (`dueIn`) or on a fixed date (`due`) */
  booking?: { dueIn?: number; due?: ISODate; done: boolean }
}

interface DemoTask {
  text: Text
  dueIn?: number
  done: boolean
}

interface DemoExpense {
  title: Text
  amount: number
  category: ExpenseCategory
  /** Day of the trip (1-based); absent = no date (e.g. tickets bought before the trip) */
  day?: number
}

interface DemoPackingGroup {
  title: Text
  /** [text, packed] */
  items: [Text, boolean][]
}

interface DemoTripSpec {
  key: string
  /** Fixed first day… */
  startDate?: ISODate
  /** …or an offset from today */
  startIn?: number
  days: number
  currency: CurrencyCode
  title: Text
  destination: Text
  notes?: Text
  items: DemoItem[]
  tasks: DemoTask[]
  expenses?: DemoExpense[]
  packing?: DemoPackingGroup[]
}

const t = (en: string, ru: string): Text => ({ en, ru })

const DOCS = t('Documents', 'Документы')
const CLOTHES = t('Clothes', 'Одежда')
const TECH = t('Tech', 'Техника')
const HYGIENE = t('Toiletries', 'Гигиена')
/** Default groups without items (like a freshly created trip) */
const EMPTY_DEFAULT_GROUPS: DemoPackingGroup[] = [DOCS, CLOTHES, TECH, HYGIENE].map((title) => ({ title, items: [] }))

const DEMO_TRIPS: DemoTripSpec[] = [
  {
    key: 'prague',
    startDate: '2026-10-28',
    days: 9,
    currency: 'CZK',
    title: t('Prague', 'Прага'),
    destination: t('Prague, Czechia', 'Прага, Чехия'),
    notes: t(
      '28 October is Czech Independence Day: a public holiday, celebrations in the centre. From 1 November Prague Castle buildings close an hour earlier (16:00).',
      '28 октября — День независимости Чехии: государственный праздник, торжества в центре. С 1 ноября здания Пражского Града закрываются на час раньше (в 16:00).',
    ),
    items: [
      {
        day: 1,
        title: t('Old Town Square', 'Староместская площадь'),
        category: 'sight',
        time: '18:45',
        durationMin: 75,
        location: 'Staroměstské náměstí',
        at: [50.0875, 14.4213],
        note: t(
          'Astronomical Clock show every hour 9:00–23:00 — be at the Old Town Hall by 19:00',
          'Астрономические часы (Орлой) — представление каждый час 9:00–23:00, к 19:00 быть у ратуши',
        ),
      },
      {
        day: 2,
        title: t('St. Vitus Cathedral', 'Собор Святого Вита'),
        category: 'sight',
        time: '09:00',
        durationMin: 60,
        location: 'Pražský hrad, III. nádvoří',
        at: [50.0909, 14.4005],
        note: t(
          'Mon–Sat 9:00–17:00, Sun from 12:00. Entry with a Prague Castle circuit ticket (A or B). Come at opening — fewer people',
          'Пн–сб 9:00–17:00, вс с 12:00. Вход по билету Пражского Града (маршрут A или B). Прийти к открытию — меньше людей',
        ),
      },
      {
        day: 2,
        title: t('Prague Castle', 'Пражский Град'),
        category: 'sight',
        time: '10:00',
        durationMin: 150,
        location: 'Pražský hrad',
        at: [50.0904, 14.3982],
        note: t(
          'Buildings 9:00–17:00 until 31 Oct, grounds 6:00–22:00 free. Circuit B: cathedral, Old Royal Palace, Golden Lane; ticket valid 2 days. Changing of the guard with fanfare at 12:00',
          'Здания 9:00–17:00 до 31 окт., территория 6:00–22:00 бесплатно. Маршрут B: собор, Старый королевский дворец, Золотая улочка; билет действует 2 дня. Смена караула с фанфарами — в 12:00',
        ),
      },
      {
        day: 3,
        title: t('Charles Bridge', 'Карлов мост'),
        category: 'sight',
        time: '07:30',
        durationMin: 45,
        location: 'Karlův most',
        at: [50.0865, 14.4114],
        note: t('Open 24/7, free. Before 8:00 it is almost empty', 'Открыт круглосуточно, бесплатно. До 8 утра почти без людей'),
      },
      {
        day: 3,
        title: t('Clementinum', 'Клементинум'),
        category: 'sight',
        time: '09:00',
        durationMin: 45,
        location: 'Mariánské náměstí 5',
        at: [50.0864, 14.4163],
        note: t(
          'Baroque Library and Astronomical Tower — guided tours only (~45 min, max 25 people). 380 CZK; the first morning tours are 50 % off. Buy online',
          'Барочная библиотека и Астрономическая башня — только с экскурсией (~45 мин, до 25 человек). 380 Kč, первые утренние туры — скидка 50 %. Билеты онлайн',
        ),
        booking: { due: '2026-10-27', done: false },
      },
      {
        day: 3,
        title: t('Jerusalem Synagogue', 'Иерусалимская синагога'),
        category: 'sight',
        time: '11:00',
        durationMin: 45,
        location: 'Jeruzalémská 7',
        at: [50.0849, 14.4334],
        note: t(
          'Sun–Fri 10:00–17:00, closed on Saturdays and Jewish holidays. 150 CZK (e-ticket 135)',
          'Вс–пт 10:00–17:00, в субботу и еврейские праздники закрыта. 150 Kč (онлайн 135)',
        ),
      },
    ],
    tasks: [
      { text: t('Buy Prague Castle tickets (circuit B)', 'Купить билеты в Пражский Град (маршрут B)'), done: false },
    ],
    packing: EMPTY_DEFAULT_GROUPS,
  },
]

const BOOK: Text = t('Book: ', 'Забронировать: ')

function buildSnapshot(spec: DemoTripSpec, today: ISODate, lang: Language, now: number): TripSnapshot {
  const tripId = `demo-${spec.key}`
  const startDate = spec.startDate ?? addDays(today, spec.startIn ?? 0)
  const days: Day[] = dateRange(startDate, addDays(startDate, spec.days - 1)).map((date, i) => ({
    id: `${tripId}-d${i + 1}`,
    tripId,
    date,
    itemIds: [],
  }))
  const group: ChecklistGroup = { id: `${tripId}-tasks`, tripId, kind: 'tasks', title: '', itemIds: [] }
  const checklistItems: ChecklistItem[] = []
  const addTask = (task: ChecklistItem) => {
    checklistItems.push(task)
    group.itemIds.push(task.id)
  }
  const due = (dueIn?: number) => (dueIn === undefined ? undefined : addDays(today, dueIn))

  spec.tasks.forEach((task, i) =>
    addTask({ id: `${tripId}-t${i + 1}`, tripId, groupId: group.id, text: task.text[lang], done: task.done, dueDate: due(task.dueIn) }),
  )

  const packingGroups: ChecklistGroup[] = (spec.packing ?? []).map((packing, g) => {
    const packingGroup: ChecklistGroup = { id: `${tripId}-g${g + 1}`, tripId, kind: 'packing', title: packing.title[lang], itemIds: [] }
    packing.items.forEach(([text, done], i) => {
      const item: ChecklistItem = { id: `${packingGroup.id}-${i + 1}`, tripId, groupId: packingGroup.id, text: text[lang], done }
      checklistItems.push(item)
      packingGroup.itemIds.push(item.id)
    })
    return packingGroup
  })

  const ideaIds: string[] = []
  const items: ItineraryItem[] = spec.items.map((spec, i) => {
    const id = `${tripId}-i${i + 1}`
    const day = spec.day === null ? undefined : days[spec.day - 1]
    if (day) day.itemIds.push(id)
    else ideaIds.push(id)
    let bookingTaskId: string | undefined
    if (spec.booking) {
      bookingTaskId = `${id}-booking`
      addTask({
        id: bookingTaskId,
        tripId,
        groupId: group.id,
        text: BOOK[lang] + spec.title[lang],
        done: spec.booking.done,
        dueDate: spec.booking.due ?? due(spec.booking.dueIn),
        sourceItemId: id,
      })
    }
    return {
      id,
      tripId,
      dayId: day?.id ?? null,
      title: spec.title[lang],
      category: spec.category,
      time: spec.time,
      durationMin: spec.durationMin,
      location: spec.location,
      coords: spec.at && { lat: spec.at[0], lng: spec.at[1] },
      note: spec.note?.[lang],
      needsBooking: Boolean(spec.booking),
      bookingTaskId,
      done: spec.done ?? false,
    }
  })

  const trip: Trip = {
    id: tripId,
    title: spec.title[lang],
    destination: spec.destination[lang],
    startDate,
    endDate: addDays(startDate, spec.days - 1),
    currency: spec.currency,
    notes: spec.notes?.[lang],
    dayIds: days.map((day) => day.id),
    ideaIds,
    groupIds: [group.id, ...packingGroups.map((packing) => packing.id)],
    createdAt: now,
    updatedAt: now,
  }
  const expenses: Expense[] = (spec.expenses ?? []).map((expense, i) => ({
    id: `${tripId}-e${i + 1}`,
    tripId,
    title: expense.title[lang],
    amount: expense.amount,
    category: expense.category,
    // day N → startDate + N-1
    date: expense.day === undefined ? undefined : addDays(startDate, expense.day - 1),
  }))
  return { trip, days, items, checklistGroups: [group, ...packingGroups], checklistItems, expenses }
}

/** Builds the demo trips relative to `today`, with texts in `language`. */
export function createDemoSnapshots(today: ISODate, language: Language, now: number = Date.now()): TripSnapshot[] {
  return DEMO_TRIPS.map((spec) => buildSnapshot(spec, today, language, now))
}
