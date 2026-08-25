import React from "react";

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageShell({ children, className = "" }: PageShellProps) {
  return (
    <div
      className={`key-page-shell flex-1 p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full min-w-0 relative z-[1] ${className}`}
    >
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
      <div className="min-w-0">
        <h2 className="key-page-title text-2xl sm:text-3xl lg:text-[2rem]">{title}</h2>
        {subtitle && <p className="key-page-subtitle mt-2">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">{actions}</div>
      )}
    </div>
  );
}

interface StatCardGridProps {
  children: React.ReactNode;
  columns?: "default" | "compact";
}

export function StatCardGrid({ children, columns = "default" }: StatCardGridProps) {
  const gridClass =
    columns === "compact"
      ? "grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6";

  return <div className={gridClass}>{children}</div>;
}

interface StatCardProps {
  key?: React.Key;
  label: string;
  value: React.ReactNode;
  sub?: string;
}

export function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="key-stat-card min-w-0">
      <p className="key-stat-label">{label}</p>
      <h3 className="key-stat-value font-display font-bold text-2xl sm:text-3xl mt-2">{value}</h3>
      {sub && <span className="key-stat-sub mt-1 block">{sub}</span>}
    </div>
  );
}

interface SectionCardProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({ children, className = "" }: SectionCardProps) {
  return <div className={`key-section-card ${className}`}>{children}</div>;
}

/** Inner work area — tighter padding/gaps; does not affect page shell or navbar */
interface WorkspaceProps {
  children: React.ReactNode;
  className?: string;
  stack?: boolean;
  panel?: boolean;
}

export function Workspace({ children, className = "", stack = false, panel = false }: WorkspaceProps) {
  const classes = [
    panel ? "key-workspace-panel" : "key-workspace",
    stack ? (panel ? "key-workspace-panel--stack" : "key-workspace--stack") : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classes}>{children}</div>;
}
