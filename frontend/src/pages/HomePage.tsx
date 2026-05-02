import { useLayoutEffect, useRef } from "react";
import { MuscleMap } from "../components/MuscleMap";
import { GithubIcon, TelegramIcon } from "../components/icons";
import type { PageId } from "../types";

type HomePageProps = {
  onMuscleSelect: (groupId: string) => void;
  onNavigate: (page: PageId) => void;
};

/** 1mm в CSS px при привязке 96px = 1in = 25.4mm (как в спецификации для экрана) */
const ONE_MM_PX = 96 / 25.4;

const primaryLinks: Array<{ id: PageId; label: string }> = [
  { id: "home", label: "Главная" },
  { id: "catalog", label: "Каталог" },
  { id: "blog", label: "Блог" },
  { id: "reviews", label: "Отзывы" },
  { id: "workout", label: "Моя тренировка" }
];

export function HomePage({ onMuscleSelect, onNavigate }: HomePageProps) {
  const footerPrimaryLinksRef = useRef<HTMLElement>(null);

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
      <section className="home-intro">
        <p className="home-intro-title">
          Изучай <span>свое тело</span>
        </p>
      </section>
      <MuscleMap onMuscleSelect={onMuscleSelect} />
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
                <a href="https://t.me/" target="_blank" rel="noreferrer" className="home-social-link" aria-label="Telegram">
                  <TelegramIcon size={24} />
                </a>
                <a href="https://github.com/" target="_blank" rel="noreferrer" className="home-social-link" aria-label="GitHub">
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
