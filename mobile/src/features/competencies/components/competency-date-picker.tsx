import { RecordCalendarDatePicker } from "@/src/shared/components";

export type CompetencyDatePickerProps = {
  dateKey: string;
  dateLabel: string;
  disabled?: boolean;
  compact?: boolean;
  onDateChange: (dateKey: string) => void;
};

export function CompetencyDatePicker({
  dateKey,
  dateLabel,
  disabled = false,
  compact = false,
  onDateChange,
}: CompetencyDatePickerProps) {
  return (
    <RecordCalendarDatePicker
      dateKey={dateKey}
      dateLabel={dateLabel}
      onDateChange={onDateChange}
      disabled={disabled}
      compact={compact}
      title="Evaluation Date"
      modalTitle="Select evaluation date"
      tone="teal"
      maxPastDays={7}
      alertTitle="Invalid Evaluation Date"
      alertMessage={(min, today) =>
        `Evaluation date must be today or within the previous 7 days (${min} to ${today}).`
      }
    />
  );
}
