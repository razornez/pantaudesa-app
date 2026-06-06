import { CheckCircle2, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { Verdict } from "@/lib/verdicts";
import { getVerdictColors } from "@/lib/utils";

interface Props {
  verdict: Verdict;
  className?: string;
  isDark?: boolean;
}

const ICONS = {
  positive: CheckCircle2,
  warning:  AlertTriangle,
  danger:   AlertCircle,
  neutral:  Info,
};

const DARK_COLORS = {
  positive: { text: "text-emerald-300", bg: "bg-emerald-900/30", border: "border-emerald-700/40", icon: "text-emerald-400" },
  warning:  { text: "text-amber-300",   bg: "bg-amber-900/30",   border: "border-amber-700/40",   icon: "text-amber-400" },
  danger:   { text: "text-rose-300",    bg: "bg-rose-900/30",    border: "border-rose-700/40",    icon: "text-rose-400" },
  neutral:  { text: "text-slate-300",   bg: "bg-slate-800/50",   border: "border-slate-600/40",   icon: "text-slate-400" },
};

export default function VerdictBanner({ verdict, className = "", isDark = false }: Props) {
  const colors = isDark ? DARK_COLORS[verdict.tone] : getVerdictColors(verdict.tone);
  const Icon   = ICONS[verdict.tone];

  return (
    <div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 ${colors.bg} ${colors.border} ${className}`}>
      <Icon size={15} className={`flex-shrink-0 mt-0.5 ${colors.icon}`} />
      <p className={`text-sm leading-relaxed ${colors.text}`}>{verdict.message}</p>
    </div>
  );
}
