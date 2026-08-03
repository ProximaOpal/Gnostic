type ModeOption = { id: string; label: string };

export function ModeToggle({
  options,
  value,
  onChange,
  fullWidth = true,
}: {
  options: ModeOption[];
  value: string;
  onChange: (id: string) => void;
  fullWidth?: boolean;
}) {
  const idx = Math.max(0, options.findIndex((o) => o.id === value));
  const n = Math.max(1, options.length);

  return (
    <div className={`gx-mode-toggle${fullWidth ? ' full' : ''}`} role="tablist">
      <span
        className="gx-mode-indicator"
        style={{
          width: `calc((100% - 8px - ${(n - 1) * 2}px) / ${n})`,
          transform: `translateX(calc(${idx} * (100% + 2px)))`,
        }}
      />
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="tab"
          aria-selected={value === opt.id}
          className={`gx-mode-btn${value === opt.id ? ' active' : ''}`}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
