import { type ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

type LayoutProps = {
  children: ReactNode;
  activeItem?: string;
  onNavigate?: (path: string) => void;
  breadcrumbs?: string[];
};

export default function Layout({
  children,
  activeItem,
  onNavigate,
  breadcrumbs,
}: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50 transition-colors dark:bg-slate-950">
      <div className="no-print"><Sidebar activeItem={activeItem} onNavigate={onNavigate} /></div>
      <main className="ml-60 flex flex-1 flex-col print:ml-0">
        <div className="no-print"><Header breadcrumbs={breadcrumbs} /></div>
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}

