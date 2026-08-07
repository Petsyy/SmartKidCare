export const formatLastActivity = (isoString?: string) => {
  if (!isoString) return "No recent activity";
  const date = new Date(isoString);
  const now = new Date();
  
  const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();

  const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: 'numeric', hour12: true };
  const timeStr = date.toLocaleTimeString('en-US', timeOptions);

  if (isToday) {
    return `Today • ${timeStr}`;
  } else if (isYesterday) {
    return `Yesterday`;
  } else {
    const dateOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', dateOptions);
  }
};
