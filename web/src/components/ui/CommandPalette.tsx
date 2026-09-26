import { useState, useEffect, useRef } from "react";
import { Search, X, User, Building2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "@/api/config";

type SearchResult = {
  id: string;
  type: "user" | "center";
  title: string;
  subtitle: string;
  url: string;
};

export function CommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${API_BASE}/search?q=${encodeURIComponent(query)}`,
          {
            signal: controller.signal,
            headers: {
              // Need authorization if required, assuming cookie-based or interceptor isn't needed for fetch?
              // Actually, we use fetch here. The project uses tanstack query or axios elsewhere.
              // Let's rely on cookies since it's same-origin or credentials: "include".
            },
            credentials: "include",
          },
        );
        const data = await response.json();
        setResults(data.results || []);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Search failed:", err);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[15vh]">
      <div
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl transform overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 transition-all dark:bg-[#0A101D] dark:ring-white/10 mx-4">
        {/* Header / Input */}
        <div className="relative flex items-center border-b border-gray-100 px-4 dark:border-white/10">
          <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          <input
            ref={inputRef}
            className="h-14 w-full border-0 bg-transparent px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 dark:text-gray-100 dark:placeholder-gray-500"
            placeholder="Search for children, users, or centers..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          ) : (
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Results */}
        {(results.length > 0 || (query && !isLoading)) && (
          <div className="max-h-80 overflow-y-auto p-2">
            {results.length === 0 && query && !isLoading ? (
              <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                No results found for "{query}"
              </div>
            ) : (
              results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => {
                    navigate(result.url);
                    onClose();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      result.type === "user"
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                        : "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
                    }`}
                  >
                    {result.type === "user" ? (
                      <User className="h-5 w-5" />
                    ) : (
                      <Building2 className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {result.title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {result.subtitle}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
