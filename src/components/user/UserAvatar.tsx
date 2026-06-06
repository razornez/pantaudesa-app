import { getAvatarBg, getInitial } from "@/lib/citizen-voice";

interface Props {
  nama:      string;
  avatarUrl?: string;
  size?:     "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE = {
  sm: { outer: "w-8 h-8",   text: "text-xs"  },
  md: { outer: "w-10 h-10", text: "text-sm"  },
  lg: { outer: "w-14 h-14", text: "text-lg"  },
  xl: { outer: "w-20 h-20", text: "text-2xl" },
};

export default function UserAvatar({ nama, avatarUrl, size = "md", className = "" }: Props) {
  const s   = SIZE[size];
  const bg  = getAvatarBg(nama);
  const ini = getInitial(nama);

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={nama}
        className={`${s.outer} rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div className={`${s.outer} rounded-full ${bg} flex items-center justify-center text-white font-black flex-shrink-0 ${s.text} ${className}`}>
      {ini}
    </div>
  );
}
