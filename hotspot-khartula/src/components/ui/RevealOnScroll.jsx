"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animasi scroll-reveal ringan berbasis IntersectionObserver.
 * Menghormati `prefers-reduced-motion` melalui aturan CSS pada globals.css.
 */
export default function RevealOnScroll({
  children,
  delay = 0,
  className = "",
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      const frame = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -32px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div
      ref={ref}
      style={delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
      className={`hm-reveal ${visible ? "hm-reveal-visible" : ""} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
