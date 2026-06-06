import { useEffect, useState } from "react";

export function useCountdown(targetDate: Date | null): number {
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    if (!targetDate) {
      const resetId = setTimeout(() => setSecs(0), 0);
      return () => clearTimeout(resetId);
    }

    const tick = () => setSecs(Math.max(0, Math.ceil((targetDate.getTime() - Date.now()) / 1000)));
    const firstTickId = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(firstTickId);
      clearInterval(id);
    };
  }, [targetDate]);

  return secs;
}
