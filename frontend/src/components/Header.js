import { html } from "../lib.js";
const profileIcon = "./frontend/src/assets/lk.png";

const navItems = [
  { key: "home", label: "Главная" },
  { key: "catalog", label: "Каталог упражнений" },
  { key: "blog", label: "Блог" },
  { key: "reviews", label: "Отзывы" },
  { key: "workout", label: "Моя тренировка" }
];

export function Header({ currentPage, onNavigate, onOpenProfile }) {
  return html`
    <header className="site-header">
      <div className="container header-inner">
        <div className="logo">GY<span>DEX</span></div>
        <nav>
          ${navItems.map(
            (item) => html`
              <button
                key=${item.key}
                className=${item.key === currentPage ? "active" : ""}
                onClick=${() => onNavigate(item.key)}
              >
                ${item.label}
              </button>
            `
          )}
        </nav>
        <button className="icon-btn" title="Личный кабинет" onClick=${onOpenProfile}>
          <img src=${profileIcon} alt="Личный кабинет" />
        </button>
      </div>
    </header>
  `;
}
