import { NativeSelect } from "./NativeSelect";
import { cn } from "@/lib/utils";

type SelectFilterProps = {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
  className?: string;
  disabled?: boolean;
};

export function SelectFilter({
  value,
  onChange,
  options,
  className,
  disabled = false,
}: SelectFilterProps) {
  return (
    <NativeSelect
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className={cn(
        "rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50",
        className,
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </NativeSelect>
  );
}