export type CsvValue = string | number | boolean | null | undefined;
export type CsvRow = CsvValue[];

const csvCell = (value: CsvValue) => {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const buildCsv = (rows: CsvRow[]) =>
  `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;

export const downloadCsvFile = (filename: string, rows: CsvRow[]) => {
  const blob = new Blob([buildCsv(rows)], {
    type: "text/csv;charset=utf-8;",
  });
  downloadBlob(filename, blob);
};

export const downloadBlob = (filename: string, blob: Blob) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export const todayFileKey = () => new Date().toISOString().split("T")[0];
