import { Mail, Phone, UserRound } from "lucide-react";

interface ContactCardProps {
  label: string;
  name: string;
  email?: string;
  phone?: string;
  emptyLabel: string;
}

export function ContactCard({
  label,
  name,
  email,
  phone,
  emptyLabel,
}: ContactCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600 dark:text-slate-400">
        {label}
      </p>
      {name === emptyLabel ? (
        <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
          {emptyLabel}
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <UserRound
              size={16}
              className="mt-0.5 shrink-0 text-teal-600 dark:text-teal-400"
            />
            <p className="text-[15px] font-medium leading-6 text-slate-900 dark:text-slate-100">
              {name}
            </p>
          </div>
          {email ? (
            <a
              href={`mailto:${email}`}
              className="flex items-start gap-2 text-[15px] font-medium text-teal-700 underline-offset-2 hover:underline dark:text-teal-300"
            >
              <Mail size={14} className="mt-0.5 shrink-0" />
              <span className="break-all">{email}</span>
            </a>
          ) : null}
          {phone ? (
            <div className="flex items-start gap-2 text-[15px] font-medium text-gray-500 dark:text-slate-400">
              <Phone
                size={14}
                className="mt-1 shrink-0 text-gray-400 dark:text-slate-500"
              />
              <span>{phone}</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

