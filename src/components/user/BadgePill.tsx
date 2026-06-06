import { UserBadge } from "@/lib/user-profile";

interface Props {
  badge:    UserBadge;
  compact?: boolean;
  showDesc?: boolean;
}

export default function BadgePill({ badge, compact = false, showDesc = false }: Props) {
  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.color} ${badge.textColor}`}>
        {badge.emoji} {badge.label}
      </span>
    );
  }

  return (
    <div className={`inline-flex flex-col gap-0.5 px-3 py-2 rounded-2xl ${badge.color}`}>
      <div className="flex items-center gap-1.5">
        <span className="text-lg">{badge.emoji}</span>
        <span className={`text-sm font-black ${badge.textColor}`}>{badge.label}</span>
        <span className={`text-[9px] font-bold opacity-50 ${badge.textColor}`}>Level {badge.tier}</span>
      </div>
      {showDesc && (
        <p className={`text-[10px] ${badge.textColor} opacity-70 leading-relaxed`}>{badge.description}</p>
      )}
    </div>
  );
}
