type PageHeaderProps = {
  title: string;
  subtitle?: string;
};

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm text-gray-500 dark:text-slate-400">{subtitle}</p>
      )}
    </div>
  );
}
