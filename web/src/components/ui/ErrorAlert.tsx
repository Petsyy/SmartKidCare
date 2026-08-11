import { Alert, AlertDescription } from "./Alert";

type ErrorAlertProps = {
  message: string | null;
  className?: string;
};

export function ErrorAlert({ message, className }: ErrorAlertProps) {
  if (!message) return null;

  return (
    <Alert className={`rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-200 ${className ?? ""}`}>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}