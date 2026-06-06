import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Minus, Plus } from 'lucide-react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-100 ${className}`}>{children}</div>;
}

export function Accordion({ title, icon, defaultOpen = false, children, badge }: { title: string; icon?: ReactNode; defaultOpen?: boolean; children: ReactNode; badge?: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <button
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left"
        aria-expanded={open}
      >
        {icon && <span className="text-slate-500">{icon}</span>}
        <span className="font-semibold text-slate-900 text-sm flex-1">{title}</span>
        {badge}
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export function ControlGroup({ label, hint, children, action }: { label: string; hint?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">{label}</div>
          {hint && <div className="text-[10px] text-slate-400">{hint}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function Slider({
  value, min, max, step = 1, unit = '', onChange, displayValue,
}: {
  value: number; min: number; max: number; step?: number; unit?: string;
  onChange: (v: number) => void; displayValue?: (v: number) => string;
}) {
  const dec = () => onChange(Math.max(min, Number((value - step).toFixed(2))));
  const inc = () => onChange(Math.min(max, Number((value + step).toFixed(2))));
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-indigo-600 h-1.5"
      />
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-1 py-0.5 shrink-0">
        <button onClick={dec} className="p-1 rounded hover:bg-white" aria-label="Decrease"><Minus className="w-3 h-3" /></button>
        <span className="text-xs font-mono tabular-nums min-w-[2.5rem] text-center">
          {displayValue ? displayValue(value) : `${value}${unit}`}
        </span>
        <button onClick={inc} className="p-1 rounded hover:bg-white" aria-label="Increase"><Plus className="w-3 h-3" /></button>
      </div>
    </div>
  );
}

export function PillToggle<T extends string>({
  value, options, onChange,
}: {
  value: T;
  options: { v: T; label: ReactNode; title?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid gap-1 bg-slate-100 rounded-lg p-1" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o) => (
        <button
          key={String(o.v)}
          onClick={() => onChange(o.v)}
          title={o.title}
          className={`px-2 py-1.5 rounded-md text-xs font-medium transition flex items-center justify-center gap-1.5 ${value === o.v ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function OptionTile<T extends string>({
  value, options, onChange, columns = 3,
}: {
  value: T;
  options: { v: T; label: ReactNode; preview: ReactNode }[];
  onChange: (v: T) => void;
  columns?: number;
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={String(o.v)}
          onClick={() => onChange(o.v)}
          className={`border-2 rounded-lg p-2 flex flex-col items-center gap-1 transition ${value === o.v ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
        >
          <div className="w-full h-12 flex items-center justify-center text-slate-500">{o.preview}</div>
          <div className="text-[10px] font-medium text-slate-700">{o.label}</div>
        </button>
      ))}
    </div>
  );
}

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-slate-700">
      <span className={`w-4 h-4 rounded border flex items-center justify-center transition ${checked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <span>{label}</span>
    </label>
  );
}

export function ColorSwatch({ color, selected, onClick, size = 22 }: { color: string; selected: boolean; onClick: () => void; size?: number }) {
  return (
    <button
      onClick={onClick}
      style={{ width: size, height: size, background: color }}
      className={`rounded-full transition shrink-0 ${selected ? 'ring-2 ring-offset-2 ring-indigo-500' : 'ring-1 ring-black/10 hover:ring-slate-300'}`}
      aria-label={`Color ${color}`}
    />
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm">
      <span className={`w-9 h-5 rounded-full relative transition ${checked ? 'bg-indigo-600' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition ${checked ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      {label && <span className="text-slate-700">{label}</span>}
    </label>
  );
}
