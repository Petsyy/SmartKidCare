import { useEffect, useState, type ReactNode } from "react";
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
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavigationOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileNavigationOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileNavigationOpen]);

  const handleNavigate = (path: string) => {
    setMobileNavigationOpen(false);
    onNavigate?.(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 transition-colors dark:bg-slate-950">
      <div className="no-print hidden lg:block">
        <Sidebar activeItem={activeItem} onNavigate={onNavigate} />
      </div>

      {mobileNavigationOpen && (
        <div className="no-print fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Main navigation">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setMobileNavigationOpen(false)}
          />
          <Sidebar
            activeItem={activeItem}
            onNavigate={handleNavigate}
            mobile
            onClose={() => setMobileNavigationOpen(false)}
          />
        </div>
      )}

      <main className="flex min-h-screen min-w-0 flex-col lg:ml-64 print:ml-0">
        <div className="no-print">
          <Header
            breadcrumbs={breadcrumbs}
            onOpenNavigation={() => setMobileNavigationOpen(true)}
          />
        </div>
        <div className="min-w-0 flex-1">{children}</div>
      </main>
    </div>
  );
}

