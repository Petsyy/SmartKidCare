type ToggleRowProps = {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};


export const ToggleRow = ({
  title,
  description,
  checked,
  onChange,
}: ToggleRowProps) => {
  return (
    <label className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-teal-200 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-teal-500/40">
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {title}
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
      <span className="relative mt-0.5 inline-flex h-6 w-11 flex-none">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span className="absolute inset-0 rounded-full bg-slate-300 transition peer-checked:bg-teal-500 peer-focus:ring-2 peer-focus:ring-teal-300 peer-focus:ring-offset-2 dark:bg-slate-600 dark:peer-focus:ring-offset-slate-900" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5 dark:bg-slate-100" />
      </span>
    </label>
  );
};
