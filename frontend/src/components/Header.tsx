import { BlogIcon, HomeIcon, LibraryIcon, ReviewsIcon, UserIcon, WorkoutIcon } from "./icons";
import { SearchBar } from "./SearchBar";
import type { PageId } from "../types";
import type { SearchSuggestionItem } from "../types";

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
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  suggestions: SearchSuggestionItem[];
  isSuggesting: boolean;
  onSelectSuggestion: (item: SearchSuggestionItem) => void;
};

export function Header({
  currentPage,
  onNavigate,
  onOpenProfile,
  searchTerm,
  onSearchChange,
  onSearch,
  suggestions,
  isSuggesting,
  onSelectSuggestion
}: HeaderProps) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <div className="logo">
          GY<span>DEX</span>
        </div>
        <div className="header-main-nav">
          <nav id="site-header-primary-nav" aria-label="Основные разделы">
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
        </div>
        <div className="header-actions">
          <div className="header-search">
            <SearchBar
              value={searchTerm}
              onChange={onSearchChange}
              onSearch={onSearch}
              suggestions={suggestions}
              isSuggesting={isSuggesting}
              onSelectSuggestion={onSelectSuggestion}
              hideButtonWhenCollapsed
            />
          </div>
          <button type="button" className="icon-btn" title="Личный кабинет" onClick={onOpenProfile}>
            {UserIcon({ className: "ui-icon", size: 18 })}
          </button>
        </div>
      </div>
    </header>
  );
}
