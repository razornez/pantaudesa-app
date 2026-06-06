"use client";

import { useEffect } from "react";

/**
 * Wires all scroll-driven motion for the cinematic desa detail page:
 *  1. Reveal-on-scroll (IntersectionObserver → .in)
 *  2. Number counters (data-counter / data-target / data-format / data-suffix)
 *  3. Top scroll-progress bar (#scroll-progress)
 *  4. Chapter rail active state (.chrail a ↔ [id^="ch-"])
 * Pure DOM APIs only — no runtime deps. Honors prefers-reduced-motion.
 */
export function useDetailMotion() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 1 · Reveal observer
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    document
      .querySelectorAll(".bar-anim, .line-draw, .dot-pop")
      .forEach((el) => {
        if (!el.closest(".reveal")) io.observe(el);
      });

    // 2 · Number counters
    const formatRupiah = (n: number) => {
      if (n >= 1_000_000_000)
        return (
          "Rp " +
          (n / 1e9).toFixed(2).replace(/\.?0+$/, "").replace(".", ",") +
          " M"
        );
      if (n >= 1_000_000) return "Rp " + Math.round(n / 1e6) + " jt";
      return "Rp " + Math.round(n).toLocaleString("id-ID");
    };
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (el: HTMLElement) => {
      if (el.dataset.done) return;
      el.dataset.done = "1";
      const target = parseFloat(el.dataset.target ?? "0");
      const format = el.dataset.format;
      const suffix = el.dataset.suffix ?? "";
      const finalText =
        format === "rupiah"
          ? formatRupiah(target)
          : Math.round(target).toLocaleString("id-ID") + suffix;

      if (reduce) {
        el.textContent = finalText;
        return;
      }

      const t0 = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / 1600);
        const v = target * easeOutCubic(t);
        el.textContent =
          format === "rupiah"
            ? formatRupiah(v)
            : Math.round(v).toLocaleString("id-ID") + suffix;
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = finalText;
      };
      requestAnimationFrame(tick);
    };

    const cio = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            animate(e.target as HTMLElement);
            cio.unobserve(e.target);
          }
        }),
      { threshold: 0.3 },
    );
    document
      .querySelectorAll<HTMLElement>("[data-counter]")
      .forEach((el) => cio.observe(el));

    // 3 · Scroll progress bar
    const bar = document.getElementById("scroll-progress");
    const updateScroll = () => {
      if (!bar) return;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + "%";
    };
    window.addEventListener("scroll", updateScroll, { passive: true });
    updateScroll();

    // 4 · Chapter rail active state
    const railLinks = document.querySelectorAll(".chrail a");
    const chio = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const id = e.target.id;
            railLinks.forEach((a) =>
              a.classList.toggle(
                "active",
                a.getAttribute("href") === "#" + id,
              ),
            );
          }
        }),
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 },
    );
    document
      .querySelectorAll('[id^="ch-"]')
      .forEach((c) => chio.observe(c));

    return () => {
      io.disconnect();
      cio.disconnect();
      chio.disconnect();
      window.removeEventListener("scroll", updateScroll);
    };
  }, []);
}
