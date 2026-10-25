import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
        <h2 className="font-display mt-1.5 text-2xl text-ink sm:text-3xl">{title}</h2>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card-shadow flex flex-col items-center rounded-3xl border border-border bg-card px-6 py-14 text-center">
      {icon && (
        <div className="grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
          {icon}
        </div>
      )}
      <h3 className="font-display mt-4 text-lg text-ink">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card">
      <div className="aspect-[16/9] animate-pulse bg-secondary" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-20 animate-pulse rounded-full bg-secondary" />
        <div className="h-5 w-4/5 animate-pulse rounded-full bg-secondary" />
        <div className="h-3 w-full animate-pulse rounded-full bg-secondary" />
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-secondary" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
