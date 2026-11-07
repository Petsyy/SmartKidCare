import { RecordCalendarDatePicker } from "@/src/shared/components";

export interface NutritionDatePickerProps {
  dateKey: string;
  dateLabel: string;
  onDateChange: (dateKey: string) => void;
}

export function NutritionDatePicker({
  dateKey,
  dateLabel,
  onDateChange,
}: NutritionDatePickerProps) {
  return (
    <RecordCalendarDatePicker
      dateKey={dateKey}
      dateLabel={dateLabel}
      onDateChange={onDateChange}
      title="Measurement Date"
      modalTitle="Select measurement date"
      tone="teal"
      maxPastDays={7}
      alertTitle="Invalid Measurement Date"
      alertMessage={(min, today) =>
        `Measurement date must be today or within the previous 7 days (${min} to ${today}).`
      }
    />
  );
}
