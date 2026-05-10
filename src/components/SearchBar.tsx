import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
}

export default function SearchBar({ value, onChange, onSearch }: SearchBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-base-muted/60" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="搜索语音内容..."
        className="w-full pl-11 pr-10 py-3 bg-base-card rounded-2xl text-sm text-base-text
                   font-light placeholder:text-base-muted/50
                   border border-transparent focus:border-base-muted/30
                   transition-colors duration-200"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6
                     rounded-full bg-base-hover flex items-center justify-center"
        >
          <X className="w-3 h-3 text-base-muted" />
        </button>
      )}
    </div>
  );
}
