export function formatRelativeTime(input: string | Date) {
  const date = typeof input === "string" ? new Date(input) : input;
  const diffMs = date.getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 1000 * 60 * 60 * 24 * 365],
    ["month", 1000 * 60 * 60 * 24 * 30],
    ["week", 1000 * 60 * 60 * 24 * 7],
    ["day", 1000 * 60 * 60 * 24],
    ["hour", 1000 * 60 * 60],
    ["minute", 1000 * 60],
  ];

  for (const [unit, ms] of units) {
    if (absMs >= ms) {
      return rtf.format(Math.round(diffMs / ms), unit);
    }
  }

  return rtf.format(Math.round(diffMs / 1000), "second");
}

export function formatCalendarDate(input: string | Date) {
  const date = typeof input === "string" ? new Date(input) : input;

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
