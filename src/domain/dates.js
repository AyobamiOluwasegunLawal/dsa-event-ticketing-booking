import { DomainError } from './errors.js';

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?(Z|[+-]\d{2}:\d{2})$/i;

function invalidDate(label) {
  throw new DomainError('VALIDATION', `${label} must be a valid ISO date string.`);
}

function validCalendarDate(year, month, day) {
  if (month < 1 || month > 12 || day < 1) {
    return false;
  }

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return day <= daysInMonth[month - 1];
}

function utcTimestamp(year, month, day) {
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return date.getTime();
}

export function parseISODate(value, options = {}) {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    invalidDate('Options');
  }
  const { label = 'Date', endOfDay = false } = options;
  if (typeof label !== 'string' || typeof endOfDay !== 'boolean') {
    invalidDate('Options');
  }

  if (typeof value !== 'string') {
    invalidDate(label);
  }

  const dateParts = DATE_PATTERN.exec(value);
  if (dateParts) {
    const [, yearText, monthText, dayText] = dateParts;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);

    if (!validCalendarDate(year, month, day)) {
      invalidDate(label);
    }

    const timestamp = utcTimestamp(year, month, day);
    if (endOfDay) {
      const nextDay = new Date(timestamp);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      return nextDay.getTime() - 1;
    }
    return timestamp;
  }

  const dateTimeParts = DATE_TIME_PATTERN.exec(value);
  if (!dateTimeParts) {
    invalidDate(label);
  }

  const [, yearText, monthText, dayText, hourText, minuteText, secondText = '0'] =
    dateTimeParts;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);

  if (
    !validCalendarDate(year, month, day) ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    invalidDate(label);
  }

  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    invalidDate(label);
  }

  return timestamp;
}
