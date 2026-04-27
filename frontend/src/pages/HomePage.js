import { html } from "../lib.js";
import { SearchBar } from "../components/SearchBar.js";
import { MuscleMap } from "../components/MuscleMap.js";

export function HomePage({ searchTerm, onSearchChange, onSearch, onMuscleSelect }) {
  return html`
    <section className="hero">
      <${SearchBar}
        value=${searchTerm}
        onChange=${onSearchChange}
        onSearch=${onSearch}
      />
    </section>

    <${MuscleMap} onMuscleSelect=${onMuscleSelect} />
  `;
}

