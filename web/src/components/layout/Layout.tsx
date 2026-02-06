import { type ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

type LayoutProps = {
  children: ReactNode;
  activeItem?: string;
  onNavigate?: (path: string) => void;
  breadcrumbs?: string[];
};

export default function Layout({ children, activeItem, onNavigate, breadcrumbs }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeItem={activeItem} onNavigate={onNavigate} />
      <main className="ml-60 flex-1 flex flex-col">
        <Header breadcrumbs={breadcrumbs} />
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
    
  );
}
