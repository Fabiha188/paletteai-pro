import React, { useMemo } from 'react'
import { hexToHsl, hueToCategory } from '../utils/colorHelpers'

export default function ColorDistributionChart({ palettes }) {
  const counts = useMemo(() => {
    const tally = {}
    palettes.forEach((p) => {
      p.colors.forEach((hex) => {
        const { h } = hexToHsl(hex)
        const category = hueToCategory(h)
        if (!tally[category.name]) tally[category.name] = { count: 0, color: category.color }
        tally[category.name].count += 1
      })
    })
    const total = Object.values(tally).reduce((sum, v) => sum + v.count, 0) || 1
    return Object.entries(tally)
      .map(([name, v]) => ({ name, ...v, pct: Math.round((v.count / total) * 100) }))
      .sort((a, b) => b.count - a.count)
  }, [palettes])

  if (counts.length === 0) return null

  return (
    <div className="hue-chart">
      <h4><i className="fas fa-chart-simple"></i> Color Distribution</h4>
      <div className="hue-chart-bars">
        {counts.map((c) => (
          <div className="hue-chart-row" key={c.name}>
            <span className="hue-chart-label">{c.name}</span>
            <div className="hue-chart-track">
              <div
                className="hue-chart-fill"
                style={{ width: `${c.pct}%`, background: c.color }}
              />
            </div>
            <span className="hue-chart-value">{c.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
