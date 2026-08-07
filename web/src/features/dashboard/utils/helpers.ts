export const formatChildName = (child?: any) => {
  if (!child) return "Unknown Child";
  const firstName = child.firstName || child.first || "";
  const middleName = child.middleName || child.middle || "";
  const lastName = child.lastName || child.last || "";
  const trailing = [firstName, middleName].filter(Boolean).join(" ");
  if (lastName && trailing) return `${lastName}, ${trailing}`;
  if (lastName) return lastName;
  if (trailing) return trailing;
  return "Unknown Child";
};

export const getChildId = (child: any) =>
  typeof child === "string" ? child : String(child?._id || "");

export const getLocalDateKey = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getRecordDateKey = (value: unknown) => {
  const d = new Date(String(value || ""));
  if (Number.isNaN(d.getTime())) return "";
  return getLocalDateKey(d);
};

export const formatDateTimeManila = (value: Date) =>
  new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(value);

export const getLatestDateKey = (entries: any[]): string =>
  entries.reduce((latest: string, entry: any) => {
    const hasRecords = Array.isArray(entry?.records) && entry.records.length > 0;
    if (!hasRecords) return latest;
    const key = getRecordDateKey(entry?.date);
    if (!key) return latest;
    return !latest || key > latest ? key : latest;
  }, "");
