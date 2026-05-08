import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { MuscleMap } from "../components/MuscleMap";
import { reviewsMock } from "../data/mockData.js";
import type { Exercise, Review } from "../types";
import {
  CircleArrowRightIcon,
  GithubIcon,
  LibraryIcon,
  OpenCardIcon,
  TelegramIcon,
  WorkoutIcon
} from "../components/icons";
import type { PageId } from "../types";

type HomePageProps = {
  onMuscleSelect: (groupId: string) => void;
  onNavigate: (page: PageId) => void;
  exercises: Exercise[];
  onOpenExercise: (exercise: Exercise) => void;
};

/** 1mm в CSS px при привязке 96px = 1in = 25.4mm (как в спецификации для экрана) */
const ONE_MM_PX = 96 / 25.4;
const REVIEW_PREVIEW_CHAR_LIMIT = 110;

function ReviewStars({ value }: { value: number }) {
  const n = Math.min(5, Math.max(1, Math.round(value)));
  return (
    <span className="home-review-stars" aria-label={`Оценка ${n} из 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= n ? "home-review-star is-on" : "home-review-star is-off"} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}

function reviewAuthorInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase() || "?";
}

const primaryLinks: Array<{ id: PageId; label: string }> = [
  { id: "home", label: "Главная" },
  { id: "catalog", label: "Каталог" },
  { id: "blog", label: "Блог" },
  { id: "workout", label: "Моя тренировка" }
];

export function HomePage({ onMuscleSelect, onNavigate, exercises, onOpenExercise }: HomePageProps) {
  const footerPrimaryLinksRef = useRef<HTMLElement>(null);
  const recommendedExercises = useMemo(() => exercises.slice(0, 6), [exercises]);
  const [tickerReviews, setTickerReviews] = useState<Review[]>(() => [...reviewsMock]);
  const [reviewAuthor, setReviewAuthor] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [openedReview, setOpenedReview] = useState<Review | null>(null);
  const marqueeItems = useMemo(() => [...tickerReviews, ...tickerReviews], [tickerReviews]);

  const totalReviews = tickerReviews.length;
  const avgRating = totalReviews > 0
    ? (tickerReviews.reduce((acc, r) => acc + (r.rating ?? 5), 0) / totalReviews).toFixed(1)
    : "0.0";

  const ratingDistribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    for (const r of tickerReviews) {
      const n = Math.min(5, Math.max(1, Math.round(r.rating ?? 5)));
      counts[n - 1] += 1;
    }
    return counts;
  }, [tickerReviews]);

  function submitHomeReview() {
    const author = reviewAuthor.trim();
    const text = reviewText.trim();
    if (!author || !text) return;
    const next: Review = {
      id: `r-${Date.now()}`,
      author,
      text,
      rating: reviewRating
    };
    setTickerReviews((prev) => [next, ...prev]);
    setReviewAuthor("");
    setReviewText("");
    setReviewRating(5);
    setHoverRating(null);
  }

  useLayoutEffect(() => {
    const footerNavEl = footerPrimaryLinksRef.current;
    const headerNavEl = document.getElementById("site-header-primary-nav");
    const groupEl = footerNavEl?.closest<HTMLElement>(".home-footer-nav-group");
    if (!footerNavEl || !headerNavEl || !groupEl) return;

    const headerNav: HTMLElement = headerNavEl;
    const footerNav: HTMLElement = footerNavEl;
    const group: HTMLElement = groupEl;

    function alignFooterLinksToHeaderNav() {
      // Сброс margin, иначе getBoundingClientRect учитывает старый сдвиг и dx «плывёт»
      group.style.marginLeft = "";
      void group.offsetWidth;
      const headerLeft = headerNav.getBoundingClientRect().left;
      const footerLeft = footerNav.getBoundingClientRect().left;
      const dx = Math.round(headerLeft - footerLeft + ONE_MM_PX);
      group.style.marginLeft = dx === 0 ? "" : `${dx}px`;
    }

    alignFooterLinksToHeaderNav();

    const ro = new ResizeObserver(() => alignFooterLinksToHeaderNav());
    ro.observe(headerNav);
    ro.observe(footerNav);
    window.addEventListener("resize", alignFooterLinksToHeaderNav);

    let cancelled = false;
    void document.fonts?.ready?.then(() => {
      if (!cancelled) alignFooterLinksToHeaderNav();
    });

    return () => {
      cancelled = true;
      ro.disconnect();
      window.removeEventListener("resize", alignFooterLinksToHeaderNav);
      group.style.marginLeft = "";
    };
  }, []);

  return (
    <>
      <section className="home-portal-intro" aria-labelledby="home-portal-intro-title">
        <p className="home-portal-kicker">
          Изучай <span>свое тело</span>
        </p>
        <h2 id="home-portal-intro-title" className="home-portal-title">
          GY<span>DEX</span> — цифровой портал для тренировок, питания и восстановления
        </h2>
        <div className="home-portal-columns" role="list" aria-label="Возможности портала GYDEX">
          <article className="home-portal-col" role="listitem">
            <span className="home-portal-col-icon" aria-hidden="true">◎</span>
            <p className="home-portal-col-title">ИНТЕРАКТИВНАЯ КАРТА</p>
            <p className="home-portal-col-text">
              Быстрый выбор мышечной группы и выход к релевантным упражнениям без долгого поиска.
            </p>
          </article>
          <article className="home-portal-col" role="listitem">
            <span className="home-portal-col-icon" aria-hidden="true">▦</span>
            <p className="home-portal-col-title">КАТАЛОГ УПРАЖНЕНИЙ</p>
            <p className="home-portal-col-text">
              Карточки с техникой, частыми ошибками и инвентарем для зала и домашних условий.
            </p>
          </article>
          <article className="home-portal-col" role="listitem">
            <span className="home-portal-col-icon" aria-hidden="true">◫</span>
            <p className="home-portal-col-title">ПЛАНИРОВЩИК НЕДЕЛИ</p>
            <p className="home-portal-col-text">
              Раздел «Моя тренировка» помогает собрать понятный план и удерживать структуру нагрузок.
            </p>
          </article>
          <article className="home-portal-col" role="listitem">
            <span className="home-portal-col-icon" aria-hidden="true">✦</span>
            <p className="home-portal-col-title">БЛОГ И AI-ПОМОЩНИК</p>
            <p className="home-portal-col-text">
              Материалы по питанию и восстановлению плюс ответы AI по упражнениям из локальной базы.
            </p>
          </article>
        </div>
      </section>
      <MuscleMap onMuscleSelect={onMuscleSelect} />
      {recommendedExercises.length > 0 && (
        <section className="home-reco-zone" aria-labelledby="home-reco-heading">
          <h2 id="home-reco-heading" className="home-reco-title">
            Тренировка для старта
          </h2>
          <p className="home-reco-lead">Готовый комплекс упражнений для первой тренировки.</p>
          <div className="card-grid home-reco-grid">
            {recommendedExercises.map((exercise) => (
              <article key={exercise.id} className="card catalog-card catalog-item-card home-reco-card">
                <h3>{exercise.name}</h3>
                <p className="catalog-muscle-label">{exercise.muscleGroupLabel ?? exercise.muscleGroup}</p>
                <div className="exercise-preview-zone">Рекомендуем</div>
                <div className="catalog-card-desc">
                  <p>{exercise.cardDescription || exercise.description}</p>
                </div>
                <div className="card-footer">
                  <button type="button" className="btn primary card-open-btn" onClick={() => onOpenExercise(exercise)}>
                    {OpenCardIcon({ className: "ui-icon", size: 14 })}
                    Открыть карточку
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
      <section className="home-build-zone" aria-labelledby="home-build-heading">
        <div className="home-build-head">
          <h2 id="home-build-heading" className="home-build-title">
            Собери свою тренировку
          </h2>
          <p className="home-build-lead">
            Собери тренировку под себя — добавляй упражнения из каталога и расставляй их по дням недели. Готовый план всегда
            под рукой в разделе «Моя тренировка».
          </p>
        </div>

        <div className="home-build-bento">
          <article className="home-build-tile">
            <div className="home-build-tile-icon" aria-hidden="true">
              {LibraryIcon({ size: 28, strokeWidth: 1.5 })}
            </div>
            <h3 className="home-build-tile-title">Каталог</h3>
            <p className="home-build-tile-body">
              Фильтры по части тела и оборудованию — найди упражнения под свой зал или домашние условия.
            </p>
            <button
              type="button"
              className="home-build-text-link"
              onClick={() => onNavigate("catalog")}
            >
              Открыть каталог
              {CircleArrowRightIcon({ className: "ui-icon home-build-link-ico", size: 18, strokeWidth: 2 })}
            </button>
          </article>

          <article className="home-build-tile">
            <div className="home-build-tile-icon" aria-hidden="true">
              {WorkoutIcon({ size: 28, strokeWidth: 1.5 })}
            </div>
            <h3 className="home-build-tile-title">Моя тренировка</h3>
            <p className="home-build-tile-body">
              Сформируйте недельный план: добавляйте упражнения из каталога и свободно переставляйте их в нужном порядке.
            </p>
            <button
              type="button"
              className="home-build-text-link"
              onClick={() => onNavigate("workout")}
            >
              Перейти к плану
              {CircleArrowRightIcon({ className: "ui-icon home-build-link-ico", size: 18, strokeWidth: 2 })}
            </button>
          </article>
        </div>
      </section>

      <section className="home-reviews-zone" aria-labelledby="home-reviews-heading">
        <div className="home-reviews-shell">
        <header className="home-reviews-head">
          <div className="home-reviews-head-main">
            <h2 id="home-reviews-heading" className="home-reviews-title">
              Отзывы о портале GY<span>DEX</span>
            </h2>
            <p className="home-reviews-lead">
              Здесь пользователи делятся впечатлениями о самом портале: удобстве каталога, интерактивной карте, блоге и
              планировщике тренировок.
            </p>
          </div>
          <div className="home-reviews-head-aside" aria-label="Сводная оценка GYDEX">
            <div className="home-reviews-score-chip">
              <span className="home-reviews-score-chip-value">{avgRating}</span>
              <span className="home-reviews-score-chip-stars">
                <ReviewStars value={Number(avgRating)} />
              </span>
              <span className="home-reviews-score-chip-meta">Всего: {totalReviews}</span>
            </div>
          </div>
        </header>

        <div
          className="home-reviews-marquee"
          role="region"
          aria-label="Лента отзывов"
        >
          <div className="home-reviews-marquee-track">
            {marqueeItems.map((r, idx) => (
              <article key={`${r.id}-${idx}`} className="home-review-ticker-card">
                <div className="home-review-ticker-quote" aria-hidden="true">
                  “
                </div>
                <div className="home-review-ticker-top">
                  <span className="home-review-ticker-avatar" aria-hidden="true">
                    {reviewAuthorInitials(r.author)}
                  </span>
                  <div className="home-review-ticker-meta">
                    <span className="home-review-ticker-name">{r.author}</span>
                    <ReviewStars value={r.rating ?? 5} />
                  </div>
                </div>
                <p className="home-review-ticker-text">{r.text}</p>
                <button
                  type="button"
                  className={`home-review-more-btn ${r.text.length > REVIEW_PREVIEW_CHAR_LIMIT ? "" : "is-placeholder"}`}
                  onClick={() => {
                    if (r.text.length > REVIEW_PREVIEW_CHAR_LIMIT) setOpenedReview(r);
                  }}
                  disabled={r.text.length <= REVIEW_PREVIEW_CHAR_LIMIT}
                >
                  Читать полностью →
                </button>
              </article>
            ))}
          </div>
        </div>

        <div className="home-reviews-bottom-grid">
          <div className="home-reviews-form-card">
            <div className="home-reviews-form-card-head">
              <h3 className="home-reviews-form-title">Оставить свой отзыв</h3>
            </div>
            <div className="home-reviews-form-grid">
              <label className="home-reviews-field">
                <span className="home-reviews-label">Имя</span>
                <input
                  className="input"
                  value={reviewAuthor}
                  onChange={(e) => setReviewAuthor(e.target.value)}
                  placeholder=""
                  maxLength={80}
                />
              </label>
              <label className="home-reviews-field">
                <span className="home-reviews-label">Оценка</span>
                <div className="home-reviews-rating-picker" onMouseLeave={() => setHoverRating(null)}>
                  {[1, 2, 3, 4, 5].map((n) => {
                    const active = hoverRating !== null ? n <= hoverRating : n <= reviewRating;
                    return (
                      <button
                        key={n}
                        type="button"
                        className={`home-reviews-rating-star ${active ? "is-on" : "is-off"}`}
                        onMouseEnter={() => setHoverRating(n)}
                        onFocus={() => setHoverRating(n)}
                        onClick={() => setReviewRating(n)}
                        aria-label={`Поставить ${n} из 5`}
                      >
                        ★
                      </button>
                    );
                  })}
                </div>
              </label>
              <label className="home-reviews-field home-reviews-field--full">
                <span className="home-reviews-label">Комментарий</span>
                <textarea
                  className="input home-reviews-textarea"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder=""
                  rows={4}
                  maxLength={600}
                />
              </label>
              <div className="home-reviews-form-actions">
                <button type="button" className="btn primary home-reviews-submit" onClick={submitHomeReview}>
                  Отправить отзыв
                </button>
              </div>
            </div>
          </div>

          <aside className="home-reviews-info-card">
            <h3 className="home-reviews-info-title">Ваше мнение важно</h3>
            <div className="home-reviews-big-rating">
              <div className="score">{avgRating}</div>
              <ReviewStars value={Number(avgRating)} />
              <div className="count">Среднее по {totalReviews} оценкам</div>
            </div>
            <div className="home-reviews-distribution" role="group" aria-label="Распределение оценок">
              <p className="home-reviews-distribution-title">Как ставят звёзды</p>
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = ratingDistribution[stars - 1] ?? 0;
                const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                return (
                  <div key={stars} className="home-reviews-dist-row">
                    <span className="home-reviews-dist-label">{stars} ★</span>
                    <div className="home-reviews-dist-bar" aria-hidden="true">
                      <div className="home-reviews-dist-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="home-reviews-dist-count">{count}</span>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
        </div>
      </section>
      {openedReview && (
        <div className="modal-backdrop modal-backdrop-dim" role="dialog" aria-modal="true" onClick={() => setOpenedReview(null)}>
          <div className="modal home-review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>{openedReview.author}</h3>
                <ReviewStars value={openedReview.rating ?? 5} />
              </div>
              <button type="button" className="close-btn" onClick={() => setOpenedReview(null)} aria-label="Закрыть">
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="home-review-modal-text">{openedReview.text}</p>
            </div>
          </div>
        </div>
      )}

      <p className="map-disclaimer-line">
        <span className="map-disclaimer-star" aria-hidden="true">
          *
        </span>{" "}
        Портал предоставляет информацию об упражнениях исключительно в ознакомительных целях и не несёт ответственности
        за возможные последствия их выполнения
      </p>
      <footer className="home-footer">
        <div className="home-footer-top">
          <div className="home-footer-logo">
            GY<span>DEX</span>
          </div>
          <div className="home-footer-center-cols">
            <div className="home-footer-nav-group">
            <p className="home-footer-group-title">Навигация</p>
            <nav
              ref={footerPrimaryLinksRef}
              className="home-footer-links"
              aria-label="Разделы сайта"
            >
              {primaryLinks.map((link) => (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  className="home-footer-link"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(link.id);
                  }}
                >
                  {link.label}
                </a>
              ))}
            </nav>
            </div>
            <div className="home-footer-project">
              <p className="home-footer-group-title">О проекте</p>
              <nav className="home-footer-links" aria-label="О проекте">
                <a href="#about" className="home-footer-link">
                  О сервисе
                </a>
                <a href="#contacts" className="home-footer-link">
                  Контакты
                </a>
                <a href="#policy" className="home-footer-link">
                  Политика
                </a>
                <a href="#terms" className="home-footer-link">
                  Соглашение
                </a>
              </nav>
            </div>
          </div>
          <div className="home-footer-right">
            <div className="home-footer-meta">
              <p className="home-footer-slogan">
                Все упражнения —<br />
                <span>в одном месте</span>
              </p>
              <div className="home-footer-socials">
                <a href="https://t.me/extansaria" target="_blank" rel="noreferrer" className="home-social-link" aria-label="Telegram">
                  <TelegramIcon size={24} />
                </a>
                <a href="https://github.com/extansaria" target="_blank" rel="noreferrer" className="home-social-link" aria-label="GitHub">
                  <GithubIcon size={24} />
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="home-footer-bottom">
          <p className="home-footer-copy">© 2026 GYDEX Некоторые права защищены..</p>
          <div className="home-footer-release">
            <p className="home-footer-version">Версия: 1.3</p>
            <p className="home-footer-version">Последнее обновление: 29.04.2026</p>
          </div>
        </div>
      </footer>
    </>
  );
}
