import { DesaBadge } from "@/lib/types";
import { BADGE_STYLES } from "@/lib/badge";

interface Props {
  badge: DesaBadge;
  nama:  string;
  compact?: boolean;
}

// Placeholder badge image (SVG dummy — bisa diganti dengan gambar nyata nanti)
function BadgeImage({ level, warna }: { level: number; warna: string }) {
  const styles = BADGE_STYLES[warna];
  const sizes  = [56, 52, 48, 44, 40]; // level 5 paling besar
  const size   = sizes[5 - level];
  const stars  = level;

  return (
    <div
      className={`relative flex-shrink-0 rounded-full flex items-center justify-center border-4 shadow-lg ${styles.bg} ${styles.border}`}
      style={{ width: size + 16, height: size + 16 }}
    >
      {/* Shimmer ring untuk level tinggi */}
      {level >= 4 && (
        <div className={`absolute inset-0 rounded-full ring-4 ${styles.ring} animate-pulse`} />
      )}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-2xl leading-none">{["🚨","⚠️","🌱","🥇","🏆"][level - 1]}</span>
        <div className="flex gap-0.5">
          {Array.from({ length: stars }).map((_, i) => (
            <span key={i} className="text-[7px]">⭐</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DesaBadgeCard({ badge, compact = false }: Props) {
  const styles = BADGE_STYLES[badge.warna];

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${styles.bg} ${styles.border}`}>
        <span className="text-base">{badge.icon}</span>
        <span className={`text-xs font-bold ${styles.text}`}>{badge.label}</span>
        <span className={`text-[10px] font-bold opacity-60 ${styles.text}`}>Lv.{badge.level}</span>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border p-5 flex items-center gap-5 ${styles.bg} ${styles.border}`}>
      <BadgeImage level={badge.level} warna={badge.warna} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-bold uppercase tracking-wider ${styles.text} opacity-70`}>
            Level {badge.level} — Badge Desa
          </span>
        </div>
        <p className={`text-lg font-black ${styles.text} leading-tight`}>{badge.label}</p>
        <p className={`text-xs mt-1 leading-relaxed ${styles.text} opacity-75`}>{badge.deskripsi}</p>
      </div>

      {/* Level dots */}
      <div className="flex flex-col gap-1 flex-shrink-0">
        {[5, 4, 3, 2, 1].map((l) => (
          <div
            key={l}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              l <= badge.level ? `${styles.border} border-2 bg-current opacity-90` : "bg-slate-200"
            }`}
            title={`Level ${l}`}
          />
        ))}
      </div>
    </div>
  );
}
