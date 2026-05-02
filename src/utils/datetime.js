// Helpers for HTML date / datetime-local inputs that use the user's LOCAL time
// (not UTC). new Date().toISOString() returns UTC which causes wrong defaults
// for users outside UTC (e.g. IST is +5:30).

function pad(n) {
  return String(n).padStart(2, '0');
}

// Returns "YYYY-MM-DDTHH:mm" in local time. Use as value for <input type="datetime-local">.
export function localDateTimeNow(d = new Date()) {
  return (
    d.getFullYear() +
    '-' + pad(d.getMonth() + 1) +
    '-' + pad(d.getDate()) +
    'T' + pad(d.getHours()) +
    ':' + pad(d.getMinutes())
  );
}

// Returns "YYYY-MM-DD" in local time. Use as value for <input type="date">.
export function localDateNow(d = new Date()) {
  return (
    d.getFullYear() +
    '-' + pad(d.getMonth() + 1) +
    '-' + pad(d.getDate())
  );
}

// Convert any date-like value to a "YYYY-MM-DDTHH:mm" string in local time,
// suitable for prefilling a datetime-local input. Falls back to now.
export function toLocalDateTimeInput(value) {
  if (!value) return localDateTimeNow();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return localDateTimeNow();
  return localDateTimeNow(d);
}

// Convert any date-like value to a "YYYY-MM-DD" string in local time.
export function toLocalDateInput(value) {
  if (!value) return localDateNow();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return localDateNow();
  return localDateNow(d);
}
