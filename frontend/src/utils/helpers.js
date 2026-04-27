export const daysOfWeek = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье"
];

export function includesText(value, query) {
  return value.toLowerCase().includes(query.trim().toLowerCase());
}
