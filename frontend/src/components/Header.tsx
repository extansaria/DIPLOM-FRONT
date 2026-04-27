import { BlogIcon, HomeIcon, LibraryIcon, ReviewsIcon, UserIcon, WorkoutIcon } from "./icons";
import type { PageId } from "../types";

const navItems: { key: PageId; label: string; icon: typeof HomeIcon }[] = [
  { key: "home", label: "Главная", icon: HomeIcon },
  { key: "catalog", label: "Каталог упражнений", icon: LibraryIcon },
  { key: "blog", label: "Блог", icon: BlogIcon },
  { key: "reviews", label: "Отзывы", icon: ReviewsIcon },
  { key: "workout", label: "Моя тренировка", icon: WorkoutIcon }
];

type HeaderProps = {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onOpenProfile: () => void;
};

export function Header({ currentPage, onNavigate, onOpenProfile }: HeaderProps) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <div className="logo">
          GY<span>DEX</span>
        </div>
        <nav>
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={item.key === currentPage ? "active" : ""}
              onClick={() => onNavigate(item.key)}
            >
              {item.icon({ className: "ui-icon nav-icon", size: 14 })}
              {item.label}
            </button>
          ))}
        </nav>
        <button type="button" className="icon-btn" title="Личный кабинет" onClick={onOpenProfile}>
          {UserIcon({ className: "ui-icon", size: 18 })}
        </button>
      </div>
    </header>
  );
}
