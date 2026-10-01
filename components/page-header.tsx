export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-6">
      {eyebrow ? <p className="text-xs uppercase tracking-[0.18em] text-gold">{eyebrow}</p> : null}
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">{title}</h1>
      {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p> : null}
    </header>
  );
}
