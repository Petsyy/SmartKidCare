export const toLocalDateKey = (value: Date = new Date()): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatDateLabel = (value: string): string => {
  const [year, month, day] = value.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, (month || 1) - 1, day || 1));
  return utcDate.toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  });
};

export const formatArchivedAt = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Archived";
  }

  return `Archived ${date.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
  })}`;
};
