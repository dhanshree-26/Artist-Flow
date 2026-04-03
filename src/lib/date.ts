import { addDays, format, formatDistanceToNowStrict, isBefore, parseISO } from 'date-fns'

export const formatEventDate = (dateValue: string) =>
  format(parseISO(dateValue), 'EEE, dd MMM yyyy')

export const formatRelativeTime = (dateValue: Date) =>
  formatDistanceToNowStrict(dateValue, { addSuffix: true })

export const isUrgentDate = (dateValue: string) =>
  isBefore(parseISO(dateValue), addDays(new Date(), 7))
