import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export function FieldLabel({ children, detail }: { children: ReactNode; detail?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{children}</span>
      {detail && <span className="font-mono text-[10px] text-slate-500">{detail}</span>}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-9 w-full rounded-lg border border-white/8 bg-white/[0.045] px-3 text-xs text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-400/60 focus:bg-white/[0.065] ${props.className ?? ""}`}
    />
  );
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`h-9 w-full appearance-none rounded-lg border border-white/8 bg-[#171923] px-3 text-xs text-slate-200 outline-none transition focus:border-violet-400/60 ${props.className ?? ""}`}
    />
  );
}

export function SegmentedControl<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid grid-flow-col gap-1 rounded-lg bg-black/20 p-1">
      {options.map((option) => (
        <button
          className={`rounded-md px-2 py-1.5 text-[11px] font-semibold transition ${
            option.value === value ? "bg-white/10 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
          }`}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <button className="flex w-full items-center justify-between py-1" onClick={() => onChange(!checked)} type="button">
      <span className="text-xs text-slate-300">{label}</span>
      <span className={`relative h-5 w-9 rounded-full transition ${checked ? "bg-violet-500" : "bg-white/10"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${checked ? "left-[18px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

export function IconButton({ children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white/8 hover:text-white disabled:opacity-35 ${className}`}
      type={props.type ?? "button"}
    >
      {children}
    </button>
  );
}
