import { Tooltip } from '@base-ui/react/tooltip'
import { ACTIVITY_LEVELS } from '../domain/constants'
import type { ActivityLevel } from '../domain/types'

interface TdeeBoardProps {
  bmr: number
}

function activityCopy(level: ActivityLevel): {
  label: string
  description: string
} {
  if (level.id === 'resting') {
    return {
      label: '睡覺／休息',
      description: '純躺著/睡覺 約等於 BMR 基礎代謝',
    }
  }
  const [label, description] = level.name.split('：', 2)
  return {
    label: label ?? level.name,
    description: description ?? level.name,
  }
}

export function TdeeBoard({ bmr }: TdeeBoardProps) {
  return (
    <Tooltip.Provider delay={100} closeDelay={80}>
      <div className="tdee-board">
        {ACTIVITY_LEVELS.map((level) => {
          const copy = activityCopy(level)
          return (
            <Tooltip.Root key={level.id}>
              <Tooltip.Trigger
                render={
                  <article
                    className={
                      level.id === 'resting' ? 'tdee-item resting' : 'tdee-item'
                    }
                    tabIndex={0}
                  >
                    <div>
                      <strong>{copy.label}</strong>
                    </div>
                    <span>
                      {Math.round(bmr * level.factor).toLocaleString()} kcal
                    </span>
                  </article>
                }
              />
              <Tooltip.Portal>
                <Tooltip.Positioner
                  className="custom-tooltip-positioner"
                  sideOffset={9}
                  collisionPadding={12}
                >
                  <Tooltip.Popup
                    className="custom-tooltip-popup"
                    role="tooltip"
                  >
                    <Tooltip.Arrow className="custom-tooltip-arrow" />
                    {copy.description}
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </Tooltip.Root>
          )
        })}
      </div>
    </Tooltip.Provider>
  )
}
