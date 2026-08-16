import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppData } from '../../app/AppDataContext'
import { LayeredStatus } from '../../components/layered/LayeredStatus'
import { SaoHpHud } from '../../components/sao/SaoHpHud'
import {
  buildGauge,
  calculateTdee,
  dayTotals,
  intakeAllowance,
  isCheckedIn,
  isProfileReady,
  longestCheckinStreak,
  proteinTarget,
  uniqueCheckinDays,
} from '../../domain/calculations'
import {
  achievementSeenKey,
  newlyUnlockedAchievements,
} from '../../domain/achievements'
import {
  addDays,
  parseLocalDate,
  todayString,
  toDateString,
} from '../../domain/date'
import { WEIGHT_RANGE_MESSAGE } from '../../domain/constants'
import {
  buildActualsByDate,
  latestWeightMeasurement,
  resolveForecastAnchor,
  simulateWeightPath,
} from '../../domain/projection'
import type { DiaryDay, DiaryEntry } from '../../domain/types'
import { isValidWeightKg } from '../../domain/validation'
import { DiaryDateRail } from './DiaryDateRail'
import { DiaryEditor } from './DiaryEditor'
import { DiaryProjection } from './DiaryProjection'
import { JourneyMilestonesPanel } from './JourneyMilestonesPanel'

function emptyDay(date: string): DiaryDay {
  return {
    date,
    actualWeightKg: null,
    exerciseStatus: 'no',
    note: '',
    entries: [],
    updatedAt: new Date().toISOString(),
  }
}

function isValidDiaryDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const parsed = parseLocalDate(date)
  return !Number.isNaN(parsed.getTime()) && toDateString(parsed) === date
}

interface DiaryPageProps {
  readOnly?: boolean
}

export function DiaryPage({ readOnly = false }: DiaryPageProps) {
  const {
    profile,
    diary,
    activeUser,
    selectedPlan,
    achievementsSeen,
    setDiary,
    upsertDay,
    notify,
  } = useAppData()
  const initialDate = useMemo(() => new Date(), [])
  const [selectedDate, setSelectedDate] = useState(() =>
    todayString(initialDate),
  )
  const [calendarYear, setCalendarYear] = useState(initialDate.getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(initialDate.getMonth())
  const warnedNoProfile = useRef(false)

  const selectedDay = diary.find((day) => day.date === selectedDate) ?? null
  const exerciseWeight =
    latestWeightMeasurement(diary, selectedDate)?.weight ??
    profile?.weight ??
    null
  const userDiary = activeUser.plans.flatMap((plan) => plan.diary)
  const checkinDays = uniqueCheckinDays(userDiary)
  const longestStreak = longestCheckinStreak(userDiary)
  const selectedForWeek = isValidDiaryDate(selectedDate)
    ? parseLocalDate(selectedDate)
    : initialDate
  const weekStart = addDays(selectedForWeek, -selectedForWeek.getDay())
  const visibleWeek = new Set(
    Array.from({ length: 7 }, (_, index) =>
      toDateString(addDays(weekStart, index)),
    ),
  )
  const weeklyCheckins = diary.filter(
    (day) => visibleWeek.has(day.date) && isCheckedIn(day),
  ).length

  const hudWeight = exerciseWeight
  const hudGauges = useMemo(() => {
    if (!isProfileReady(profile) || hudWeight === null) return null
    const allowance = intakeAllowance(
      profile,
      calculateTdee(profile, hudWeight),
    )
    const totals = dayTotals(selectedDay)
    return {
      intake: buildGauge(allowance - totals.intake, allowance),
      protein: buildGauge(totals.protein, proteinTarget(profile, hudWeight)),
    }
  }, [hudWeight, profile, selectedDay])

  useEffect(() => {
    if (isProfileReady(profile) || warnedNoProfile.current) return
    warnedNoProfile.current = true
    notify(
      'warn',
      '請先在「快速計算」完成並儲存個人資料與熱量計畫，精細頁才能投影體重曲線。',
    )
  }, [notify, profile])

  const selectDate = (date: string) => {
    setSelectedDate(date)
    const parsed = parseLocalDate(date)
    if (!Number.isNaN(parsed.getTime())) {
      setCalendarYear(parsed.getFullYear())
      setCalendarMonth(parsed.getMonth())
    }
  }

  const addEntry = (entry: DiaryEntry): boolean => {
    if (readOnly) return false
    if (!isValidDiaryDate(selectedDate)) {
      notify('danger', '請選擇有效日期。')
      return false
    }
    const day = selectedDay
      ? { ...selectedDay, entries: [...selectedDay.entries] }
      : emptyDay(selectedDate)
    day.entries.push(entry)
    day.updatedAt = new Date().toISOString()

    const nextDiary = diary.filter((item) => item.date !== day.date)
    nextDiary.push(day)
    const nextUserDiary = [
      ...activeUser.plans
        .filter((plan) => plan.id !== selectedPlan?.id)
        .flatMap((plan) => plan.diary),
      ...nextDiary,
    ]
    const unlocked = newlyUnlockedAchievements(
      uniqueCheckinDays(nextUserDiary),
      longestCheckinStreak(nextUserDiary),
      achievementsSeen,
    )
    const nextSeen = unlocked.length
      ? Array.from(
          new Set([...achievementsSeen, ...unlocked.map(achievementSeenKey)]),
        )
      : achievementsSeen
    if (!upsertDay(day, nextSeen)) return false

    if (unlocked.length) {
      unlocked.forEach((achievement) => {
        const progressLabel =
          achievement.kind === 'streak'
            ? `歷史最長連續 ${achievement.days} 天`
            : `累積 ${achievement.days} 個紀錄日`
        notify(
          'ok',
          `解鎖 Journey Milestone：${achievement.title} · ${progressLabel}`,
        )
      })
    }

    notify(
      'ok',
      entry.type === 'food'
        ? `已新增飲食 +${Math.round(entry.kcal)} kcal，總計已更新。`
        : `已新增運動 −${Math.round(entry.kcal)} kcal，總計已更新。`,
    )

    if (isProfileReady(profile)) {
      const anchor = resolveForecastAnchor(profile, nextDiary, initialDate)
      const simulation = simulateWeightPath(profile, {
        startDate: anchor.date,
        startWeight: anchor.weight,
        actuals: buildActualsByDate(nextDiary),
      })
      if (simulation.plateaued) {
        notify(
          'danger',
          `體重約到 ${simulation.finalWeight.toFixed(1)} kg 會停滯，請調整攝取或增加運動。`,
        )
      }
    }
    return true
  }

  const removeEntry = (entryId: string) => {
    if (readOnly) return
    if (!selectedDay) return
    const saved = upsertDay({
      ...selectedDay,
      entries: selectedDay.entries.filter((entry) => entry.id !== entryId),
      updatedAt: new Date().toISOString(),
    })
    if (!saved) return
    notify('ok', '已刪除明細，所有合計與預測已更新。')
  }

  const updateEntry = (entry: DiaryEntry): boolean => {
    if (readOnly || !selectedDay) return false
    const currentEntry = selectedDay.entries.find(
      (item) => item.id === entry.id,
    )
    if (!currentEntry || currentEntry.type !== entry.type) return false
    if (
      !upsertDay({
        ...selectedDay,
        entries: selectedDay.entries.map((item) =>
          item.id === entry.id ? entry : item,
        ),
        updatedAt: new Date().toISOString(),
      })
    ) {
      return false
    }
    notify('ok', '已更新明細，所有合計與預測已重新計算。')
    return true
  }

  const setActualWeight = (weight: number): boolean => {
    if (readOnly) return false
    if (!isValidWeightKg(weight)) {
      notify('danger', WEIGHT_RANGE_MESSAGE)
      return false
    }
    if (!isValidDiaryDate(selectedDate)) {
      notify('danger', '請選擇有效日期。')
      return false
    }
    if (selectedDate > todayString()) {
      notify('danger', '無法記錄未來日期的體重。')
      return false
    }
    const replacing =
      selectedDay?.actualWeightKg !== null && Boolean(selectedDay)
    const day = selectedDay
      ? { ...selectedDay, entries: [...selectedDay.entries] }
      : emptyDay(selectedDate)
    day.actualWeightKg = weight
    day.updatedAt = new Date().toISOString()
    if (!upsertDay(day)) return false
    notify('ok', replacing ? '已更新實際體重。' : '已新增實際體重。')
    return true
  }

  const removeActualWeight = () => {
    if (readOnly) return
    if (!selectedDay || selectedDay.actualWeightKg === null) return
    if (!selectedDay.entries.length) {
      if (!setDiary(diary.filter((day) => day.date !== selectedDate))) return
    } else if (
      !upsertDay({
        ...selectedDay,
        actualWeightKg: null,
        updatedAt: new Date().toISOString(),
      })
    ) {
      return
    }
    notify('ok', '已刪除實際體重紀錄。')
  }

  const deleteDay = () => {
    if (readOnly) return
    if (
      !selectedDay ||
      (!selectedDay.entries.length && selectedDay.actualWeightKg === null)
    ) {
      return
    }
    if (!setDiary(diary.filter((day) => day.date !== selectedDate))) return
    notify('ok', '已刪除此日全部明細。')
  }

  const returnToday = () => {
    const now = new Date()
    selectDate(todayString(now))
  }

  return (
    <main
      className="page-content diary-page"
      data-hud={hudGauges ? 'sao' : undefined}
    >
      <header className="layered-page-heading">
        <span>Daily route log</span>
        <h1>為美好生活獻上祝福</h1>
      </header>

      {hudGauges ? (
        <SaoHpHud
          intake={hudGauges.intake}
          protein={hudGauges.protein}
          dateLabel={selectedDate.slice(5).replace('-', ' / ')}
        />
      ) : null}

      {readOnly ? (
        <div className="archive-banner" role="status">
          此計畫已封存，目前為唯讀模式
        </div>
      ) : null}

      <DiaryDateRail
        year={calendarYear}
        month={calendarMonth}
        selectedDate={selectedDate}
        diary={diary}
        onSelect={selectDate}
        onMonthChange={(year, month) => {
          setCalendarYear(year)
          setCalendarMonth(month)
        }}
      />

      <div className="diary-dashboard">
        <DiaryEditor
          achievementPanel={
            <JourneyMilestonesPanel
              checkinDays={checkinDays}
              longestStreak={longestStreak}
              unlockedIds={activeUser.achievementsUnlocked}
            />
          }
          selectedDate={selectedDate}
          day={selectedDay}
          weight={exerciseWeight}
          onAdd={addEntry}
          onUpdateEntry={updateEntry}
          onSetWeight={setActualWeight}
          onRemoveEntry={removeEntry}
          onRemoveWeight={removeActualWeight}
          onDeleteDay={deleteDay}
          onReturnToday={returnToday}
          onError={(message) => notify('danger', message)}
          readOnly={readOnly}
        />
      </div>

      <LayeredStatus
        className="weekly-progress-hud"
        floating
        label="本週簽到進度"
        value={weeklyCheckins}
        max={7}
        detail={`累積 ${checkinDays} 日`}
      />

      <DiaryProjection
        profile={profile}
        diary={diary}
        startDate={initialDate}
      />
    </main>
  )
}
