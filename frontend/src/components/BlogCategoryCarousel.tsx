import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  BarbellIcon,
  BlogIcon,
  CardioIcon,
  DumbbellIcon,
  SparkIcon,
  StretchIcon,
  FunctionalIcon,
  BodyweightIcon
} from "./icons";

export type BlogCategorySelectHint = "arrow-prev" | "arrow-next" | "card";

type BlogCategoryCarouselProps = {
  categories: string[];
  activeCategory: string;
  onSelect: (category: string, hint?: BlogCategorySelectHint) => void;
};

const SWIPE_PX = 48;

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

function useNarrowSlots() {
  const [narrow, setNarrow] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 560px)").matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 560px)");
    const fn = () => setNarrow(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return narrow;
}

function categoryGlyph(name: string) {
  switch (name) {
    case "Все":
      return <SparkIcon size={34} strokeWidth={1.75} className="blog-cat-card-glyph" />;
    case "Набор массы":
      return <BarbellIcon size={34} strokeWidth={1.75} className="blog-cat-card-glyph" />;
    case "Похудение":
      return <CardioIcon size={34} strokeWidth={1.75} className="blog-cat-card-glyph" />;
    case "Сила":
      return <DumbbellIcon size={34} strokeWidth={1.75} className="blog-cat-card-glyph" />;
    case "Питание":
      return <BodyweightIcon size={34} strokeWidth={1.75} className="blog-cat-card-glyph" />;
    case "Восстановление":
      return <StretchIcon size={34} strokeWidth={1.75} className="blog-cat-card-glyph" />;
    case "Мотивация":
      return <SparkIcon size={34} strokeWidth={1.75} className="blog-cat-card-glyph" />;
    case "Техника":
      return <FunctionalIcon size={34} strokeWidth={1.75} className="blog-cat-card-glyph" />;
    default:
      return <BlogIcon size={34} strokeWidth={1.75} className="blog-cat-card-glyph" />;
  }
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={dir === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BlogCategoryCarousel({ categories, activeCategory, onSelect }: BlogCategoryCarouselProps) {
  const narrow = useNarrowSlots();
  const offsets = narrow ? ([-1, 0, 1] as const) : ([-2, -1, 0, 1, 2] as const);

  const n = categories.length;
  const activeIndex = useMemo(() => {
    const i = categories.indexOf(activeCategory);
    return i >= 0 ? i : 0;
  }, [categories, activeCategory]);

  const cardsRef = useRef<HTMLDivElement>(null);
  const flipFirstRectsRef = useRef<DOMRect[] | null>(null);

  const scheduleFlipCapture = useCallback(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      flipFirstRectsRef.current = null;
      return;
    }
    const root = cardsRef.current;
    if (!root) {
      flipFirstRectsRef.current = null;
      return;
    }
    const nodes = root.querySelectorAll(".blog-cat-card");
    flipFirstRectsRef.current = Array.from(nodes).map((el) => el.getBoundingClientRect());
  }, []);

  useLayoutEffect(() => {
    const first = flipFirstRectsRef.current;
    flipFirstRectsRef.current = null;
    const root = cardsRef.current;
    if (!first?.length || !root) return;

    const cardEls = Array.from(root.querySelectorAll<HTMLElement>(".blog-cat-card"));
    if (cardEls.length !== first.length) return;

    for (let i = 0; i < cardEls.length; i++) {
      const el = cardEls[i];
      const a = first[i];
      const b = el.getBoundingClientRect();
      el.style.transition = "none";
      el.style.transform = `translate(${a.left - b.left}px, ${a.top - b.top}px)`;
    }

    root.classList.add("blog-cat-row-flip");

    let cancelled = false;
    let timeoutId = 0;
    const rafIds = { outer: 0, inner: 0 };
    rafIds.outer = requestAnimationFrame(() => {
      rafIds.inner = requestAnimationFrame(() => {
        if (cancelled) return;
        const ms = 560;
        const ease = "cubic-bezier(0.33, 0.88, 0.32, 1)";
        for (const el of cardEls) {
          el.style.transition = `transform ${ms}ms ${ease}`;
          el.style.transform = "";
        }
        timeoutId = window.setTimeout(() => {
          if (cancelled) return;
          root.classList.remove("blog-cat-row-flip");
          for (const el of cardEls) {
            el.style.transition = "";
            el.style.transform = "";
          }
        }, ms + 80);
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafIds.outer);
      cancelAnimationFrame(rafIds.inner);
      window.clearTimeout(timeoutId);
      root.classList.remove("blog-cat-row-flip");
      for (const el of cardEls) {
        el.style.transition = "";
        el.style.transform = "";
      }
    };
  }, [activeIndex]);

  const go = useCallback(
    (delta: number) => {
      if (n <= 0) return;
      const next = mod(activeIndex + delta, n);
      if (next === activeIndex) return;
      scheduleFlipCapture();
      const hint: BlogCategorySelectHint = delta < 0 ? "arrow-prev" : "arrow-next";
      onSelect(categories[next], hint);
    },
    [activeIndex, categories, n, onSelect, scheduleFlipCapture]
  );

  const drag = useRef<{ x: number; id: number | null }>({ x: 0, id: null });
  const suppressClickRef = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    if (n <= 1) return;
    suppressClickRef.current = false;
    drag.current = { x: e.clientX, id: e.pointerId };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (drag.current.id !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    const dx = e.clientX - drag.current.x;
    drag.current = { x: 0, id: null };
    if (dx > SWIPE_PX) {
      suppressClickRef.current = true;
      go(-1);
    } else if (dx < -SWIPE_PX) {
      suppressClickRef.current = true;
      go(1);
    }
  };

  const onCardClick = (cat: string) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    const idx = categories.indexOf(cat);
    if (idx >= 0) {
      const nextIdx = mod(idx, n);
      if (nextIdx !== activeIndex) scheduleFlipCapture();
    }
    onSelect(cat, "card");
  };

  const single = n <= 1;

  if (n === 0) {
    return null;
  }

  return (
    <div className="blog-cat-carousel" aria-label="Категории блога">
      <button
        type="button"
        className="blog-cat-arrow"
        aria-label="Предыдущая категория"
        disabled={single}
        onClick={() => go(-1)}
      >
        <Chevron dir="left" />
      </button>

      <div
        className="blog-cat-stage"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div ref={cardsRef} className="blog-cat-cards" role="list">
          {offsets.map((offset) => {
            const idx = mod(activeIndex + offset, n);
            const cat = categories[idx];
            const isCenter = offset === 0;
            return (
              <div
                key={offset}
                className="blog-cat-slot"
                data-slot={String(offset)}
                role="listitem"
              >
                <button
                  type="button"
                  className={`blog-cat-card${isCenter ? " blog-cat-card--active" : ""}`}
                  data-slot={String(offset)}
                  onClick={() => onCardClick(cat)}
                >
                  <span className="blog-cat-card-shine" aria-hidden="true" />
                  <span className="blog-cat-card-icon">{categoryGlyph(cat)}</span>
                  <span className="blog-cat-card-label">{cat}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        className="blog-cat-arrow"
        aria-label="Следующая категория"
        disabled={single}
        onClick={() => go(1)}
      >
        <Chevron dir="right" />
      </button>
    </div>
  );
}
