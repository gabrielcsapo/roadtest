import type { Risk } from '../types'

export const riskLevels: Risk[] = ['low', 'medium', 'high', 'critical']

export function riskToColor(risk: Risk): string {
  switch (risk) {
    case 'low': return '#22c55e'
    case 'medium': return '#f59e0b'
    case 'high': return '#ef4444'
    case 'critical': return '#7c3aed'
  }
}

export function riskToLabel(risk: Risk): string {
  switch (risk) {
    case 'low': return 'Low'
    case 'medium': return 'Medium'
    case 'high': return 'High'
    case 'critical': return 'Critical'
  }
}

export function riskToScore(risk: Risk): number {
  switch (risk) {
    case 'low': return 25
    case 'medium': return 50
    case 'high': return 75
    case 'critical': return 100
  }
}

export function scoreToRisk(score: number): Risk {
  if (score <= 25) return 'low'
  if (score <= 50) return 'medium'
  if (score <= 75) return 'high'
  return 'critical'
}

export function compareRisk(a: Risk, b: Risk): number {
  return riskToScore(a) - riskToScore(b)
}

export function isHighRisk(risk: Risk): boolean {
  return risk === 'high' || risk === 'critical'
}
