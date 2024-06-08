export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getFirstDateOfYear(date: Date): string {
  const year = date.getFullYear();
  const firstDate = new Date(year, 0, 1);
  return formatDate(firstDate);
}
