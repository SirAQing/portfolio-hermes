import React from 'react';

interface SectionTitleProps {
  icon?: React.ReactNode;
  number?: string;
  title: string;
  subtitle?: string;
}

export const SectionTitle = ({ icon, number, title, subtitle }: SectionTitleProps) => (
  <div className="mb-12 flex items-start gap-4">
    {icon && (
      <div className="w-10 h-10 rounded-xl bg-bg-card border border-border flex items-center justify-center shrink-0 shadow-sm">
        {icon}
      </div>
    )}
    <div>
      {number && <span className="text-xs text-text-muted font-mono tracking-wider mb-2 block">{number}</span>}
      <h2 className="text-3xl font-bold text-accent tracking-tight mb-3">{title}</h2>
      {subtitle && <p className="text-text-secondary max-w-2xl text-sm leading-relaxed">{subtitle}</p>}
    </div>
  </div>
);