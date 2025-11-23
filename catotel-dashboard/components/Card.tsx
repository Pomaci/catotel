import { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-3xl border border-sand-200 bg-white/95 p-6 shadow-soft ${className}`}
    >
      {children}
    </div>
  );
}
