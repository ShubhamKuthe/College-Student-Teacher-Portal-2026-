import type { FirestoreDate } from '../types/models'

export function toDate(value: FirestoreDate) {
  if (!value) {
    return null
  }

  if (value instanceof Date) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate()
  }

  return null
}

export function toMillis(value: FirestoreDate) {
  return toDate(value)?.getTime() ?? 0
}

export function formatDate(value: FirestoreDate) {
  const date = toDate(value)

  if (!date) {
    return 'Not set'
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatDateTime(value: FirestoreDate) {
  const date = toDate(value)

  if (!date) {
    return 'Not set'
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

export function formatGrade(value?: number | null) {
  if (value === null || value === undefined) {
    return 'Pending'
  }

  return `${value}/100`
}

export function toInputDate(value: FirestoreDate) {
  const date = toDate(value)

  if (!date) {
    return ''
  }

  return date.toISOString().slice(0, 10)
}

export function truncateText(value: string, length = 120) {
  if (value.length <= length) {
    return value
  }

  return `${value.slice(0, length)}...`
}
