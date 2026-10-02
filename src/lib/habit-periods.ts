export type HabitFrequency = "daily" | "weekly" | "monthly";

export function isHabitFrequency(value: string): value is HabitFrequency {
  return value === "daily" || value === "weekly" || value === "monthly";
}

export function habitPeriodStart(frequency: string, dateKey = new Date().toISOString().slice(0, 10)) {
  if (frequency === "monthly") return `${dateKey.slice(0, 7)}-01`;
  if (frequency === "weekly") {
    const date = new Date(`${dateKey}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    return date.toISOString().slice(0, 10);
  }
  return dateKey;
}

export function habitPeriodName(frequency: string) {
  if (frequency === "monthly") return "за месяц";
  if (frequency === "weekly") return "за неделю";
  return "за день";
}

export function habitFrequencyName(frequency: string) {
  if (frequency === "monthly") return "Раз в месяц";
  if (frequency === "weekly") return "Раз в неделю";
  return "Каждый день";
}
