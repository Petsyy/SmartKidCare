type DetailFieldProps = {
  label: string;
  value: string;
};

export function DetailField({ label, value }: DetailFieldProps) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold text-gray-500 dark:text-slate-400">
        {label}
      </div>
      <div className="text-sm text-gray-900 dark:text-slate-100">{value}</div>
    </div>
  );
}
