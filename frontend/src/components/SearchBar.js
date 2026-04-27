import { html } from "../lib.js";
const searchIcon = "./frontend/src/assets/search.png";

export function SearchBar({ value, onChange, onSearch }) {
  return html`
    <div className="search-wrap">
      <div className="search-input-wrap">
        <img className="search-input-icon" src=${searchIcon} alt="Поиск" />
        <input
          value=${value}
          onChange=${(e) => onChange(e.target.value)}
          placeholder="Найти упражнение: например, тяга на спину, жим, планка..."
        />
      </div>
      <button className="btn primary" onClick=${onSearch}>Поиск</button>
    </div>
  `;
}
