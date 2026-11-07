import { RecordCalendarDatePicker } from "@/src/shared/components";

export interface AttendanceDatePickerProps {
  dateKey: string;
  dateLabel: string;
  onDateChange: (dateKey: string) => void;
  disabled?: boolean;
}

export function AttendanceDatePicker({
  dateKey,
  dateLabel,
  onDateChange,
  disabled = false,
}: AttendanceDatePickerProps) {
  return (
    <RecordCalendarDatePicker
      dateKey={dateKey}
      dateLabel={dateLabel}
      onDateChange={onDateChange}
      disabled={disabled}
      title="Attendance date"
      modalTitle="Select attendance date"
      tone="emerald"
      maxPastDays={6}
      alertTitle="Invalid Attendance Date"
      alertMessage={(min, today) =>
        `Attendance can only be recorded from ${min} through ${today}.`
      }
    />
  );
}
