export function formatDateTime(isoString: string) {
  const date = new Date(isoString);
  const formatter = new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Tehran'
  });
  return formatter.format(date);
} 