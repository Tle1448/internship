"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

export type FilterOption = { value: string; label: string };

export default function FilterSelect({ label, value, options, onChange, className = "" }: {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value)?.label ?? options[0]?.label ?? "";

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: MouseEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return <div className={`filter-field ${className}`}>
    <span className="filter-field-label">{label}</span>
    <div className={`filter-select ${open ? "is-open" : ""}`} ref={container}>
      <button type="button" className="filter-trigger" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <span className="filter-value">{selected}</span><Icon name="chevron" size={16} />
      </button>
      {open && <div className="filter-menu" role="listbox" aria-label={label}>
        {options.map((option) => <button type="button" role="option" aria-selected={option.value === value} className={option.value === value ? "selected" : ""} key={option.value || "all"} onClick={() => { onChange(option.value); setOpen(false); }}><span>{option.label}</span>{option.value === value && <Icon name="check" size={16} />}</button>)}
      </div>}
    </div>
  </div>;
}
