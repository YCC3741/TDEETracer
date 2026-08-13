import { useId } from 'react'
import type { GaugeStage, RouteGauge } from '../../domain/types'

/**
 * Geometry ported from qwqcode/SAO-UI (SAO_HP_Bar_Canvas.html). Every constant,
 * the 0.57 edge slope and the three-pass outline keep their upstream values;
 * only the badge glyph and the partial fill are ours.
 */
const PLATE_HEAD_W = 270
const PLATE_TAIL_W = 200
const PLATE_W = PLATE_HEAD_W + PLATE_TAIL_W
const PLATE_H = 60
const PLATE_STEP_H = 45
const PLATE_TAIL_SKEW = 25
const CORNER = 6

const LEAD_W = 27
const LEAD_GAP = 3
const LABEL_W = 74

const BAR_HEAD_W = 192
const BAR_TAIL_W = 175
const BAR_W = BAR_HEAD_W + BAR_TAIL_W
const BAR_H = 20
const BAR_STEP_H = 11
const BAR_X = LABEL_W
const BAR_Y = (PLATE_H - BAR_H) / 2

const BADGE_W = 34
const BADGE_H = 28
const BADGE_GAP = 17
const BADGE_X = BAR_X + BAR_W + BADGE_GAP
const BADGE_Y = 10
const DIAMOND_R = 5.5

const WINDOW_W = PLATE_TAIL_W - 15
const WINDOW_HEAD_W = (WINDOW_W * 2) / 3
const WINDOW_TAIL_W = WINDOW_W / 3
const WINDOW_H = 29
const WINDOW_GAP = 2
const WINDOW_X = PLATE_HEAD_W + WINDOW_GAP
const WINDOW_Y = PLATE_STEP_H + WINDOW_GAP

const SLOPE = 0.57

const VIEW_BOX = `${-(LEAD_W + LEAD_GAP) - 2} -2 ${PLATE_W + LEAD_W + LEAD_GAP + 26} ${WINDOW_Y + WINDOW_H + 4}`

function skew(height: number): number {
  return height * SLOPE
}

const BADGE_SKEW = skew(29)

const LEAD_PATH = [
  `M${-(LEAD_W + LEAD_GAP)},0`,
  `L${-LEAD_GAP},0`,
  `L${-LEAD_GAP},${PLATE_H}`,
  `L${-(LEAD_W + LEAD_GAP)},${PLATE_H}`,
  'Z',
].join(' ')

const PLATE_PATH = [
  'M0,0',
  `L${PLATE_W},0`,
  `L${PLATE_W - PLATE_TAIL_SKEW},${PLATE_STEP_H}`,
  `L${PLATE_HEAD_W + CORNER},${PLATE_STEP_H}`,
  `A${CORNER},${CORNER} 0 0 0 ${PLATE_HEAD_W},${PLATE_STEP_H + CORNER}`,
  `L${PLATE_HEAD_W},${PLATE_H}`,
  `L0,${PLATE_H}`,
  'Z',
].join(' ')

const BAR_PATH = [
  `M${BAR_X},${BAR_Y}`,
  `L${BAR_X + BAR_W},${BAR_Y}`,
  `L${BAR_X + BAR_W - skew(BAR_STEP_H)},${BAR_Y + BAR_STEP_H}`,
  `L${BAR_X + BAR_HEAD_W},${BAR_Y + BAR_STEP_H}`,
  `L${BAR_X + BAR_HEAD_W - skew(BAR_H - BAR_STEP_H)},${BAR_Y + BAR_H}`,
  `L${BAR_X},${BAR_Y + BAR_H}`,
  'Z',
].join(' ')

function outlinePath(offset: number): string {
  const top = BAR_Y - offset
  const step = BAR_Y + BAR_STEP_H + offset
  const bottom = BAR_Y + BAR_H + offset
  return [
    `M${BAR_X - offset},${top}`,
    `L${BAR_X + BAR_W + 2 * offset},${top}`,
    `L${BAR_X + BAR_W + 2 * offset - skew(step - top)},${step}`,
    `L${BAR_X + BAR_HEAD_W + offset},${step}`,
    `L${BAR_X + BAR_HEAD_W - skew(bottom - step) + offset},${bottom}`,
    `L${BAR_X - offset},${bottom}`,
    'Z',
  ].join(' ')
}

const BADGE_PATH = [
  `M${BADGE_X},${BADGE_Y}`,
  `L${BADGE_X + BADGE_W},${BADGE_Y}`,
  `L${BADGE_X + BADGE_W - BADGE_SKEW},${BADGE_Y + BADGE_H}`,
  `L${BADGE_X - BADGE_SKEW},${BADGE_Y + BADGE_H}`,
  'Z',
].join(' ')

const DIAMOND_CX = BADGE_X + BADGE_W / 2 - BADGE_SKEW / 2
const DIAMOND_CY = BADGE_Y + BADGE_H / 2
const DIAMOND_PATH = [
  `M${DIAMOND_CX},${DIAMOND_CY - DIAMOND_R}`,
  `L${DIAMOND_CX + DIAMOND_R},${DIAMOND_CY}`,
  `L${DIAMOND_CX},${DIAMOND_CY + DIAMOND_R}`,
  `L${DIAMOND_CX - DIAMOND_R},${DIAMOND_CY}`,
  'Z',
].join(' ')

function fillPath(ratio: number): string {
  const end = BAR_X + BAR_W * ratio
  return [
    `M${BAR_X},${BAR_Y}`,
    `L${end},${BAR_Y}`,
    `L${end - skew(BAR_H)},${BAR_Y + BAR_H}`,
    `L${BAR_X},${BAR_Y + BAR_H}`,
    'Z',
  ].join(' ')
}

/** Windows nest into the plate notch: outer corners round, inner ones square. */
function headWindowPath(paired: boolean): string {
  const right = WINDOW_X + WINDOW_HEAD_W
  const bottom = WINDOW_Y + WINDOW_H
  return [
    `M${WINDOW_X},${WINDOW_Y + CORNER}`,
    `A${CORNER},${CORNER} 0 0 1 ${WINDOW_X + CORNER},${WINDOW_Y}`,
    paired
      ? `L${right},${WINDOW_Y} L${right},${bottom}`
      : [
          `L${right - CORNER},${WINDOW_Y}`,
          `A${CORNER},${CORNER} 0 0 1 ${right},${WINDOW_Y + CORNER}`,
          `L${right},${bottom - CORNER}`,
          `A${CORNER},${CORNER} 0 0 1 ${right - CORNER},${bottom}`,
        ].join(' '),
    `L${WINDOW_X + CORNER},${bottom}`,
    `A${CORNER},${CORNER} 0 0 1 ${WINDOW_X},${bottom - CORNER}`,
    'Z',
  ].join(' ')
}

const TAIL_WINDOW_X = WINDOW_X + WINDOW_HEAD_W + WINDOW_GAP
const TAIL_WINDOW_PATH = [
  `M${TAIL_WINDOW_X},${WINDOW_Y}`,
  `L${TAIL_WINDOW_X + WINDOW_TAIL_W - CORNER},${WINDOW_Y}`,
  `A${CORNER},${CORNER} 0 0 1 ${TAIL_WINDOW_X + WINDOW_TAIL_W},${WINDOW_Y + CORNER}`,
  `L${TAIL_WINDOW_X + WINDOW_TAIL_W},${WINDOW_Y + WINDOW_H - CORNER}`,
  `A${CORNER},${CORNER} 0 0 1 ${TAIL_WINDOW_X + WINDOW_TAIL_W - CORNER},${WINDOW_Y + WINDOW_H}`,
  `L${TAIL_WINDOW_X},${WINDOW_Y + WINDOW_H}`,
  'Z',
].join(' ')

interface SaoHpRailProps {
  label: string
  gauge: RouteGauge
  stage: GaugeStage
  summary: string
  headWindow: string
  tailWindow?: string
  depleted?: boolean
}

export function SaoHpRail({
  label,
  gauge,
  stage,
  summary,
  headWindow,
  tailWindow,
  depleted = false,
}: SaoHpRailProps) {
  const uid = useId().replaceAll(':', '')
  const plateId = `sao-hp-plate-${uid}`
  const maskId = `sao-hp-mask-${uid}`
  const glowId = `sao-hp-glow-${uid}`
  const clipId = `sao-hp-clip-${uid}`
  const paired = tailWindow !== undefined

  return (
    <svg
      className="sao-hp-rail"
      data-stage={stage}
      viewBox={VIEW_BOX}
      role="img"
      aria-label={summary}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient
          id={plateId}
          x1="0"
          y1="0"
          x2={PLATE_W}
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop className="sao-hp-plate-head" offset="0" />
          <stop className="sao-hp-plate-head" offset="0.3" />
          <stop className="sao-hp-plate-tail" offset="1" />
        </linearGradient>
        <linearGradient
          id={maskId}
          x1={BAR_X}
          y1={BAR_Y}
          x2={BAR_X}
          y2={BAR_Y + BAR_H}
          gradientUnits="userSpaceOnUse"
        >
          <stop className="sao-hp-shade-strong" offset="0" />
          <stop className="sao-hp-shade-soft" offset="0.3" />
          <stop className="sao-hp-shade-clear" offset="0.7" />
          <stop className="sao-hp-shade-clear" offset="1" />
        </linearGradient>
        <filter id={glowId} x="-8%" y="-60%" width="116%" height="260%">
          <feGaussianBlur stdDeviation="0.55" />
        </filter>
        <clipPath id={clipId}>
          <path d={BAR_PATH} />
        </clipPath>
      </defs>

      <path d={LEAD_PATH} fill={`url(#${plateId})`} />
      <path d={PLATE_PATH} fill={`url(#${plateId})`} />

      <text
        className="sao-hp-label"
        x={LABEL_W / 2}
        y={PLATE_H / 2 + 2}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {label}
      </text>

      <g clipPath={`url(#${clipId})`}>
        <path className="sao-hp-fill" d={fillPath(gauge.ratio)} />
      </g>
      <path d={BAR_PATH} fill={`url(#${maskId})`} />

      <path
        className="sao-hp-outline-glow"
        d={outlinePath(2.7)}
        filter={`url(#${glowId})`}
      />
      <path className="sao-hp-outline-light" d={outlinePath(1.5)} />
      <path className="sao-hp-outline-dark" d={outlinePath(1)} />

      <path className="sao-hp-badge" d={BADGE_PATH} />
      <path className="sao-hp-badge-mark" d={DIAMOND_PATH} />

      <path d={headWindowPath(paired)} fill={`url(#${plateId})`} />
      <text
        className="sao-hp-window"
        data-depleted={depleted || undefined}
        x={WINDOW_X + WINDOW_HEAD_W / 2}
        y={WINDOW_Y + WINDOW_H / 2}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {headWindow}
      </text>

      {paired ? (
        <>
          <path d={TAIL_WINDOW_PATH} fill={`url(#${plateId})`} />
          <text
            className="sao-hp-window"
            x={TAIL_WINDOW_X + WINDOW_TAIL_W / 2}
            y={WINDOW_Y + WINDOW_H / 2}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {tailWindow}
          </text>
        </>
      ) : null}
    </svg>
  )
}
