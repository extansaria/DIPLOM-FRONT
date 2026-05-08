import { useCallback, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { BlogPost } from "../types";
import {
  BlogCategoryCarousel,
  type BlogCategorySelectHint
} from "../components/BlogCategoryCarousel";

type BlogGridAnimClass = "none" | "fade" | "slide-next" | "slide-prev";

type BlogPageProps = {
  posts: BlogPost[];
};

function buildSimilarArticleUrl(post: BlogPost) {
  return `/frontend/article-reader.html?id=${encodeURIComponent(post.id)}`;
}

function buildPreviewImageUrl(post: BlogPost, index: number) {
  if (post.id === "blog-1") {
    return "/frontend/src/assets/1.jpg";
  }
  if (post.id === "blog-2") {
    return "/frontend/src/assets/2.jpg";
  }
  if (post.id === "blog-3") {
    return "/frontend/src/assets/3.png";
  }
  if (post.id === "blog-4") {
    return "/frontend/src/assets/4.png";
  }
  if (post.id === "blog-5") {
    return "/frontend/src/assets/5.png";
  }
  if (post.id === "blog-6") {
    return "/frontend/src/assets/6.png";
  }
  if (post.id === "blog-7") {
    return "/frontend/src/assets/9.png";
  }
  if (post.id === "blog-8") {
    return "/frontend/src/assets/8.jpg";
  }
  if (post.id === "blog-9") {
    return "/frontend/src/assets/7.png";
  }
  if (post.id === "blog-10") {
    return "/frontend/src/assets/10.jpg";
  }
  if (post.id === "blog-11") {
    return "/frontend/src/assets/11.png";
  }
  if (post.id === "blog-12") {
    return "/frontend/src/assets/12.jpg";
  }
  if (post.id === "blog-13") {
    return "/frontend/src/assets/13.png?v=2";
  }
  if (post.id === "blog-14") {
    return "/frontend/src/assets/14.png";
  }
  if (post.id === "blog-15") {
    return "/frontend/src/assets/15.png";
  }
  if (post.id === "blog-16") {
    return "/frontend/src/assets/16.jpg";
  }
  if (post.id === "blog-17") {
    return "/frontend/src/assets/17.png";
  }
  if (post.id === "blog-18") {
    return "/frontend/src/assets/18.png";
  }
  if (post.id === "blog-19") {
    return "/frontend/src/assets/19.jpg";
  }
  if (post.id === "blog-20") {
    return "/frontend/src/assets/20.jpg";
  }
  if (post.id === "blog-21") {
    return "/frontend/src/assets/21.png";
  }
  if (post.id === "blog-22") {
    return "/frontend/src/assets/22.jpg";
  }
  if (post.id === "blog-23") {
    return "/frontend/src/assets/23.jpg";
  }
  if (post.id === "blog-24") {
    return "/frontend/src/assets/24.jpg";
  }
  const tagsByCategory: Record<string, string> = {
    "Набор массы": "bodybuilding,gym,muscle,weight-training",
    Похудение: "weight-loss,cardio,fitness,gym",
    Сила: "powerlifting,barbell,strength,gym",
    Питание: "healthy-food,meal-prep,nutrition,protein",
    Восстановление: "stretching,recovery,mobility,fitness",
    Мотивация: "fitness-motivation,gym-training,sport,workout",
    Техника: "exercise-form,squat,deadlift,workout-technique"
  };
  const tags = tagsByCategory[post.category] || "fitness,gym,workout";
  return `https://loremflickr.com/900/560/${tags}?lock=${index + 11}`;
}

function buildPreviewFallbackUrl(post: BlogPost, index: number) {
  const fallbackTagsByCategory: Record<string, string> = {
    "Набор массы": "gym,muscle,barbell",
    Похудение: "cardio,fitness,training",
    Сила: "barbell,powerlifting,training",
    Питание: "nutrition,healthy-food,meal",
    Восстановление: "recovery,stretching,yoga",
    Мотивация: "workout,fitness,sport",
    Техника: "squat,deadlift,fitness"
  };
  const tags = fallbackTagsByCategory[post.category] || "fitness,training,gym";
  return `https://loremflickr.com/900/560/${tags}?lock=${index + 211}`;
}

function buildPreviewObjectPosition(post: BlogPost) {
  if (post.id === "blog-6") {
    return "center 18%";
  }
  if (post.id === "blog-8") {
    return "center 15%";
  }
  if (post.id === "blog-12") {
    return "82% center";
  }
  if (post.id === "blog-14") {
    return "center 8%";
  }
  if (post.id === "blog-20") {
    return "center 40%";
  }
  if (post.id === "blog-21") {
    return "center top";
  }
  return "center";
}

function buildReadTime(post: BlogPost, index: number) {
  const idMatch = post.id.match(/blog-(\d+)/);
  const idNum = idMatch ? Number(idMatch[1]) : index + 1;
  const minutes = 4 + ((idNum * 3) % 7); // 4..10 минут, стабильно для каждой карточки
  return `~ ${minutes} мин чтения`;
}

function blogTilePlacement(index: number): {
  style: CSSProperties;
  isTall: boolean;
  isWide: boolean;
} {
  const slot = index % 6;
  if (slot === 5) {
    return {
      style: { gridColumn: "span 8" },
      isTall: false,
      isWide: true
    };
  }
  if (slot === 2) {
    return {
      style: { gridColumn: "span 4", gridRow: "span 2" },
      isTall: true,
      isWide: false
    };
  }
  return {
    style: { gridColumn: "span 4" },
    isTall: false,
    isWide: false
  };
}

export function BlogPage({ posts }: BlogPageProps) {
  const categories = useMemo(() => {
    const base = [
      "Все",
      "Набор массы",
      "Похудение",
      "Сила",
      "Питание",
      "Восстановление",
      "Мотивация",
      "Техника"
    ];
    const fromPosts = Array.from(new Set(posts.map((post) => post.category)));
    return Array.from(new Set([...base, ...fromPosts]));
  }, [posts]);

  const [activeCategory, setActiveCategory] = useState("Все");
  const [blogGridAnim, setBlogGridAnim] = useState<BlogGridAnimClass>("none");

  const onBlogCategorySelect = useCallback((cat: string, hint?: BlogCategorySelectHint) => {
    if (cat === activeCategory) return;
    let nextAnim: BlogGridAnimClass = "fade";
    if (hint === "arrow-prev") nextAnim = "slide-prev";
    else if (hint === "arrow-next") nextAnim = "slide-next";
    setBlogGridAnim(nextAnim);
    setActiveCategory(cat);
  }, [activeCategory]);

  const visiblePosts = useMemo(() => {
    if (activeCategory === "Все") return posts;
    return posts.filter((post) => post.category === activeCategory);
  }, [posts, activeCategory]);

  return (
    <section className="blog-page">
      <div className="blog-cat-block">
        <h2 className="blog-cat-section-title">Категории</h2>
        <BlogCategoryCarousel
          categories={categories}
          activeCategory={activeCategory}
          onSelect={onBlogCategorySelect}
        />
      </div>

      <div
        key={activeCategory}
        className={`blog-magazine-grid blog-magazine-grid--anim-${blogGridAnim}`}
      >
        {visiblePosts.map((post) => {
          const stableIndex = Math.max(0, posts.findIndex((p) => p.id === post.id));
          const { style, isTall, isWide } = blogTilePlacement(stableIndex);
          const slot = stableIndex % 6;
          const bodyAccent = slot === 0 || slot === 3;
          const toneClass = `tone-${(stableIndex % 4) + 1}`;
          const articleHref = buildSimilarArticleUrl(post);
          const cardClass = [
            "blog-magazine-card",
            isTall ? "blog-tile-tall" : "",
            isWide ? "blog-tile-wide" : "",
            bodyAccent ? "blog-body-accent" : ""
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <article key={post.id} className={cardClass} style={style}>
              <div
                className={`blog-preview-zone ${toneClass}`}
              >
                <img
                  className="blog-preview-media"
                  src={buildPreviewImageUrl(post, stableIndex)}
                  alt={post.title}
                  style={{ objectPosition: buildPreviewObjectPosition(post) }}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const fallback = buildPreviewFallbackUrl(post, stableIndex);
                    if (e.currentTarget.src !== fallback) {
                      e.currentTarget.src = fallback;
                    }
                  }}
                />
                <span className="blog-preview-tag">{post.category}</span>
              </div>
              <div className="blog-card-body">
                <h3>{post.title}</h3>
                <div className="blog-card-excerpt">
                  <p>{post.excerpt}</p>
                </div>
                <div className="card-footer blog-card-footer">
                  <span className="muted">{buildReadTime(post, stableIndex)}</span>
                  <a
                    className="btn primary"
                    href={articleHref}
                    target={articleHref.startsWith("/") ? undefined : "_blank"}
                    rel={articleHref.startsWith("/") ? undefined : "noopener noreferrer"}
                  >
                    Читать
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
