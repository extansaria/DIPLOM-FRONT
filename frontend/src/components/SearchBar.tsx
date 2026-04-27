import { useRef, useState } from "react";
import { SearchIcon } from "./icons";
import type { SearchSuggestionItem } from "../types";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSearch?: () => void;
  suggestions?: SearchSuggestionItem[];
  isSuggesting?: boolean;
  onSelectSuggestion?: (item: SearchSuggestionItem) => void;
};

export function SearchBar({
  value,
  onChange,
  onSearch,
  suggestions = [],
  isSuggesting = false,
  onSelectSuggestion
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const isExpanded = isFocused && Boolean(value.trim());

  return (
    <div className="search-autocomplete-shell">
      {isExpanded && (
        <button
          type="button"
          className="search-page-dim"
          aria-label="Закрыть подсказки поиска"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsFocused(false);
            inputRef.current?.blur();
          }}
        />
      )}
      <div className={`search-wrap search-wrap-with-suggest ${isExpanded ? "expanded" : ""}`}>
        <div className="search-row">
          <div className="search-input-wrap">
            {SearchIcon({ className: "ui-icon search-input-icon", size: 16 })}
            <div className="search-autocomplete">
              <input
                ref={inputRef}
                value={value}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSearch?.()}
                placeholder="Найти упражнение: например, тяга на спину, жим, планка..."
              />
            </div>
          </div>
          <button type="button" className="btn primary" onClick={onSearch}>
            Поиск
          </button>
        </div>
      </div>
      {isExpanded && (
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
                    setIsFocused(false);
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
