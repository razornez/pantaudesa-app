import {
  AlertTriangle,
  FlaskConical,
  Globe2,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type DataStatusKind = "demo" | "source-found" | "needs-review" | "verified";

type DataStatusTone = {
  label: string;
  microcopy: string;
  icon: LucideIcon;
  badgeClass: string;
  iconClass: string;
  textClass: string;
  panelClass: string;
  disabled?: boolean;
};

const STATUS_TONES: Record<DataStatusKind, DataStatusTone> = {
  demo: {
    label: "Data Demo",
    microcopy: "Data ini masih demo, belum menjadi fakta resmi.",
    icon: FlaskConical,
    badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
    iconClass: "text-amber-600",
    textClass: "text-amber-800",
    panelClass: "border-amber-200 bg-amber-50",
  },
  "source-found": {
    label: "Sumber Ditemukan",
    microcopy: "Sumber publik ditemukan, belum berarti terverifikasi.",
    icon: Globe2,
    badgeClass: "border-sky-200 bg-sky-50 text-sky-800",
    iconClass: "text-sky-600",
    textClass: "text-sky-800",
    panelClass: "border-sky-200 bg-sky-50",
  },
  "needs-review": {
    label: "Perlu Review",
    microcopy: "Perlu dicek sebelum jadi rujukan.",
    icon: AlertTriangle,
    badgeClass: "border-orange-200 bg-orange-50 text-orange-800",
    iconClass: "text-orange-600",
    textClass: "text-orange-800",
    panelClass: "border-orange-200 bg-orange-50",
  },
  verified: {
    label: "Terverifikasi",
    microcopy: "Belum aktif sampai workflow verifikasi tersedia.",
    icon: ShieldCheck,
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700 opacity-55 grayscale",
    iconClass: "text-emerald-500",
    textClass: "text-emerald-800",
    panelClass: "border-emerald-200 bg-emerald-50 opacity-60 grayscale",
    disabled: true,
  },
};

const SIZE_CLASS = {
  xs: "gap-1 px-1.5 py-0.5 text-[9px]",
  sm: "gap-1.5 px-2 py-0.5 text-[10px]",
  md: "gap-1.5 px-3 py-1 text-xs",
} as const;

const ICON_SIZE = {
  xs: 8,
  sm: 9,
  md: 10,
} as const;

const ICON_BUBBLE = {
  xs: "h-3 w-3",
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
} as const;

interface Props {
  status: DataStatusKind;
  size?: keyof typeof SIZE_CLASS;
  showMicrocopy?: boolean;
  className?: string;
}

export function DataStatusBadge({
  status,
  size = "sm",
  showMicrocopy = false,
  className = "",
}: Props) {
  const config = STATUS_TONES[status];
  const Icon = config.icon;

  if (showMicrocopy) {
    return (
      <div className={`inline-flex items-start gap-2 rounded-xl border px-3 py-2 shadow-sm ${config.panelClass} ${className}`}>
        <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/75 shadow-sm">
          <Icon size={13} className={config.iconClass} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className={`text-xs font-black leading-tight ${config.textClass}`}>
            {config.label}
            {config.disabled ? " (belum aktif)" : ""}
          </p>
          <p className={`mt-0.5 text-[11px] leading-relaxed ${config.textClass} opacity-85`}>
            {config.microcopy}
          </p>
        </div>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border font-bold leading-none shadow-sm transition-all duration-200 hover:-translate-y-0.5 ${SIZE_CLASS[size]} ${config.badgeClass} ${className}`}
      aria-disabled={config.disabled ? true : undefined}
      title={config.microcopy}
    >
      <span className={`inline-flex flex-shrink-0 items-center justify-center rounded-full bg-white/75 ${ICON_BUBBLE[size]}`}>
        <Icon size={ICON_SIZE[size]} className={config.iconClass} aria-hidden />
      </span>
      {config.label}
    </span>
  );
}

export { STATUS_TONES as DATA_STATUS_BADGE_COPY };
