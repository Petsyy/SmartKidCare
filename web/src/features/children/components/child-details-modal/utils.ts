export function getNutritionalStatusColor(status?: string | null) {
  if (!status)
    return "border border-gray-200/60 bg-gray-100 text-gray-700 shadow-sm dark:border-slate-700/50 dark:bg-slate-800 dark:text-slate-300";
  if (status === "Normal")
    return "border border-emerald-200/60 bg-emerald-100 text-emerald-700 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300";
  if (status === "Underweight")
    return "border border-amber-200/60 bg-amber-100 text-amber-700 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300";
  return "border border-rose-200/60 bg-rose-100 text-rose-700 shadow-sm dark:border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-300";
}

export const formatDate = (value?: string | Date | null) => {
  if (!value) return "Not set";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleDateString();
};

export const formatFullName = (
  firstName?: string,
  middleName?: string,
  lastName?: string,
) =>
  [firstName, middleName, lastName]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");

export const formatMetric = (value?: number | null, unit?: string) =>
  value === null || value === undefined
    ? "Not provided"
    : `${value}${unit ? ` ${unit}` : ""}`;

export const formatTxDisplay = (hash: string) =>
  hash.length > 18 ? `${hash.slice(0, 14)}...` : hash;

export const formatTitleCase = (value?: string | null) => {
  if (!value) return "Not set";

  return value
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};
