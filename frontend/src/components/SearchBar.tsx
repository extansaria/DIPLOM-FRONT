import { useEffect, useRef, useState } from "react";
import { SearchIcon } from "./icons";
import type { SearchSuggestionItem } from "../types";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSearch?: () => void;
  suggestions?: SearchSuggestionItem[];
  isSuggesting?: boolean;
  onSelectSuggestion?: (item: SearchSuggestionItem) => void;
  hideButtonWhenCollapsed?: boolean;
};

export function SearchBar({
  value,
  onChange,
  onSearch,
  suggestions = [],
  isSuggesting = false,
  onSelectSuggestion,
  hideButtonWhenCollapsed = false
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<"collapsed" | "expanded" | "closing">("collapsed");
  const [isInlineFocused, setIsInlineFocused] = useState(false);
  const isHeaderMode = hideButtonWhenCollapsed;
  const isExpanded = phase === "expanded";
  const isClosing = phase === "closing";
  const isOverlayVisible = isExpanded || isClosing;
  const shouldShowSuggestions = (isHeaderMode ? isExpanded : isInlineFocused) && (isSuggesting || Boolean(value.trim()));

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isHeaderMode && isExpanded) {
      window.setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isHeaderMode, isExpanded]);

  function openSearch() {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setPhase("expanded");
  }

  function closeSearch() {
    setPhase("closing");
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setPhase("collapsed");
      closeTimerRef.current = null;
    }, 220);
  }

  if (!isHeaderMode) {
    return (
      <div className="search-autocomplete-shell">
        <div className={`search-wrap search-wrap-with-suggest ${isInlineFocused ? "expanded" : ""}`}>
          <div className="search-row">
            <div className="search-input-wrap">
              {SearchIcon({ className: "ui-icon search-input-icon", size: 16 })}
              <div className="search-autocomplete">
                <input
                  ref={inputRef}
                  value={value}
                  onFocus={() => setIsInlineFocused(true)}
                  onBlur={() => setIsInlineFocused(false)}
                  onChange={(e) => onChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onSearch?.()}
                  placeholder="Найти упражнение..."
                />
              </div>
            </div>
            <button type="button" className="btn primary" onClick={onSearch}>
              Поиск
            </button>
          </div>
        </div>
        {shouldShowSuggestions && (
          <div className="search-suggest-popover">
            <div className="search-suggest-list expanded">
              {isSuggesting ? (
                <div className="search-suggest-item muted">Подбираю варианты...</div>
              ) : suggestions.length ? (
                suggestions.map((item) => (
                  <button
                    key={item.slug || item.id}
                    type="button"
                    className="search-suggest-item"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSelectSuggestion?.(item);
                      setIsInlineFocused(false);
                    }}
                  >
                    <span>{item.title}</span>
                    <span className="muted">{item.muscleGroup || ""}</span>
                  </button>
                ))
              ) : (
                <div className="search-suggest-item muted">Ничего не найдено</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="search-autocomplete-shell">
      <button type="button" className="search-header-trigger" onClick={openSearch}>
        {SearchIcon({ className: "ui-icon search-input-icon", size: 15 })}
        <span>Найти упражнение...</span>
      </button>
      {isOverlayVisible && (
        <button
          type="button"
          className="search-page-dim"
          aria-label="Закрыть подсказки поиска"
          onMouseDown={(e) => {
            e.preventDefault();
            closeSearch();
            inputRef.current?.blur();
          }}
        />
      )}
      {isOverlayVisible && (
        <div
          className={`search-modal ${isExpanded ? "open" : "closing"}`}
          onMouseDown={() => {
            closeSearch();
            inputRef.current?.blur();
          }}
        >
          <div className="search-modal-panel" onMouseDown={(e) => e.stopPropagation()}>
            <div className="search-modal-row">
              <div className="search-input-wrap">
                {SearchIcon({ className: "ui-icon search-input-icon", size: 18 })}
                <div className="search-autocomplete">
                  <input
                    ref={inputRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onSearch?.();
                      if (e.key === "Escape") closeSearch();
                    }}
                    placeholder="Найти упражнение..."
                  />
                </div>
              </div>
              <button type="button" className="btn primary" onClick={onSearch}>
                Поиск
              </button>
            </div>
            {shouldShowSuggestions && (
              <div className="search-suggest-popover search-suggest-popover-modal">
                <div className="search-suggest-list expanded">
                  {isSuggesting ? (
                    <div className="search-suggest-item muted">Подбираю варианты...</div>
                  ) : suggestions.length ? (
                    suggestions.map((item) => (
                      <button
                        key={item.slug || item.id}
                        type="button"
                        className="search-suggest-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          onSelectSuggestion?.(item);
                          closeSearch();
                        }}
                      >
                        <span>{item.title}</span>
                        <span className="muted">{item.muscleGroup || ""}</span>
                      </button>
                    ))
                  ) : (
                    <div className="search-suggest-item muted">Ничего не найдено</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
