import { Select } from '@base-ui/react/select'
import { Tooltip } from '@base-ui/react/tooltip'
import { useId, useMemo } from 'react'

export interface SelectOption {
  value: string
  label: string
  description?: string
}

interface SelectFieldProps {
  label: string
  value: string
  options: SelectOption[]
  onValueChange: (value: string) => void
  placeholder?: string
  required?: boolean
  name?: string
  id?: string
}

function ChevronIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m5 12 4 4L19 6" />
    </svg>
  )
}

export function SelectField({
  label,
  value,
  options,
  onValueChange,
  placeholder = '請選擇',
  required = false,
  name,
  id,
}: SelectFieldProps) {
  const generatedId = useId()
  const triggerId = id ?? generatedId
  const infoHandle = useMemo(
    () => Tooltip.createHandle<{ description: string }>(),
    [],
  )
  const hasDescriptions = options.some((option) => option.description)

  return (
    <Tooltip.Provider delay={100} closeDelay={80}>
      <div className="select-field">
        <Select.Root<string>
          {...(name ? { name } : {})}
          items={options}
          modal={false}
          required={required}
          value={value || null}
          onValueChange={(nextValue) => {
            if (nextValue !== null) onValueChange(nextValue)
          }}
        >
          <Select.Label>{label}</Select.Label>
          <Select.Trigger className="custom-select-trigger" id={triggerId}>
            <Select.Value placeholder={placeholder} />
            <Select.Icon className="custom-select-icon">
              <ChevronIcon />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner
              alignItemWithTrigger={false}
              className="custom-select-positioner"
              sideOffset={6}
              collisionPadding={10}
            >
              <Select.Popup className="custom-select-content">
                <Select.ScrollUpArrow className="custom-select-scroll">
                  <ChevronIcon />
                </Select.ScrollUpArrow>
                <Select.List className="custom-select-viewport">
                  {options.map((option) => (
                    <Select.Item
                      aria-label={option.label}
                      className="custom-select-item"
                      key={option.value}
                      value={option.value}
                    >
                      <Select.ItemText>{option.label}</Select.ItemText>
                      <span className="custom-select-trailing">
                        <Select.ItemIndicator className="custom-select-indicator">
                          <CheckIcon />
                        </Select.ItemIndicator>
                        {option.description ? (
                          <Tooltip.Trigger
                            aria-label={`顯示說明 ${option.description}`}
                            handle={infoHandle}
                            payload={{ description: option.description }}
                            render={
                              <span className="custom-select-info" tabIndex={0}>
                                i
                              </span>
                            }
                          />
                        ) : null}
                      </span>
                    </Select.Item>
                  ))}
                </Select.List>
                <Select.ScrollDownArrow className="custom-select-scroll down">
                  <ChevronIcon />
                </Select.ScrollDownArrow>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
        {hasDescriptions ? (
          <Tooltip.Root handle={infoHandle}>
            {({ payload }) => (
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
                    {payload?.description}
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            )}
          </Tooltip.Root>
        ) : null}
      </div>
    </Tooltip.Provider>
  )
}
