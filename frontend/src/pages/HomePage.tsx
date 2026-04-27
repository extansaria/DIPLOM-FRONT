import { SearchBar } from "../components/SearchBar";
import { MuscleMap } from "../components/MuscleMap";
import type { SearchSuggestionItem } from "../types";

type HomePageProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  suggestions: SearchSuggestionItem[];
  isSuggesting: boolean;
  onSelectSuggestion: (item: SearchSuggestionItem) => void;
  onMuscleSelect: (groupId: string) => void;
};

export function HomePage({
  searchTerm,
  onSearchChange,
  onSearch,
  suggestions,
  isSuggesting,
  onSelectSuggestion,
  onMuscleSelect
}: HomePageProps) {
  return (
    <>
      <section className="hero">
        <SearchBar
          value={searchTerm}
          onChange={onSearchChange}
          onSearch={onSearch}
          suggestions={suggestions}
          isSuggesting={isSuggesting}
          onSelectSuggestion={onSelectSuggestion}
        />
      </section>
      <MuscleMap onMuscleSelect={onMuscleSelect} />
    </>
  );
}
