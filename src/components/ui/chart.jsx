import React from "react"
import { Tooltip as RechartsTooltip, Legend as RechartsLegend } from "recharts"

// map series keys → CSS vars for colors
export function ChartContainer({ config, className = "", children }) {
  const style = Object.entries(config || {}).reduce((vars, [key, val]) => {
    vars[`--color-${key}`] = val?.color || `hsl(var(--chart-1))`
    return vars
  }, {})
  return (
    <div className={className} style={style}>
      {children}
    </div>
  )
}

// Recharts Tooltip passthrough
export const ChartTooltip = RechartsTooltip

// Styled tooltip content
export function ChartTooltipContent({ active, payload, label, config, valueFormatter }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border bg-popover p-2 text-xs shadow-sm">
      {label && <div className="mb-1 font-medium">{label}</div>}
      <div className="space-y-1">
        {payload.map((p) => {
          const item = config?.[p.dataKey] || {}
          const color = p.color || item.color
          return (
            <div key={p.dataKey} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: color }} />
              <span className="text-muted-foreground">{item.label ?? p.name}</span>
              <span className="ml-auto font-medium">
                {valueFormatter ? valueFormatter(p.value) : p.value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Recharts Legend passthrough with custom content
export const ChartLegend = RechartsLegend

export function ChartLegendContent({ payload, config }) {
  if (!payload?.length) return null
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      {payload.map((p) => {
        const item = config?.[p.dataKey] || {}
        const color = p.color || item.color
        return (
          <div key={p.dataKey} className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: color }} />
            <span className="text-muted-foreground">{item.label ?? p.value}</span>
          </div>
        )
      })}
    </div>
  )
}




