import { useState, useEffect } from "react";
import { Moon, Sun, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface NavbarProps {
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  categories?: string[];
}

const TOP_N_CATEGORIES = 4;

const Navbar = ({ selectedCategory, onCategoryChange, categories: categoriesProp }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [pathname, setPathname] = useState("/");
  const [moreOpen, setMoreOpen] = useState(false);

  const isHomePage = pathname === "/";

  const allCategories = categoriesProp ?? [];
  const topCategories = allCategories.slice(0, TOP_N_CATEGORIES);
  const moreCategories = allCategories.slice(TOP_N_CATEGORIES);
  const isMoreActive = moreCategories.includes(selectedCategory ?? "");

  useEffect(() => {
    setPathname(window.location.pathname);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle("dark", newIsDark);
    localStorage.setItem("theme", newIsDark ? "dark" : "light");
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-background/95 backdrop-blur-sm"
            : "bg-transparent"
        }`}
      >
        <div className="px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a
              href="/"
              className="text-lg font-medium tracking-tight hover:opacity-70 transition-opacity duration-300"
            >
              frong.me
            </a>

            {/* Center: Category Filters (Desktop only, only on Home page) */}
            {isHomePage && onCategoryChange && (
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => onCategoryChange("everything")}
                  className={`px-4 py-1.5 text-sm rounded-full transition-all duration-300 ${
                    selectedCategory === "everything"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  everything
                </button>
                {topCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => onCategoryChange(category)}
                    className={`px-4 py-1.5 text-sm rounded-full transition-all duration-300 ${
                      selectedCategory === category
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {category}
                  </button>
                ))}

                {moreCategories.length > 0 && (
                  <Popover open={moreOpen} onOpenChange={setMoreOpen}>
                    <PopoverTrigger asChild>
                      <button
                        className={`flex items-center gap-1 px-4 py-1.5 text-sm rounded-full transition-all duration-300 ${
                          isMoreActive
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {isMoreActive ? selectedCategory : "more"}
                        <ChevronDown size={14} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="center"
                      className="w-48 p-2 rounded-2xl border border-border bg-background/95 backdrop-blur-md shadow-xl"
                      sideOffset={8}
                    >
                      <div className="flex flex-col gap-1">
                        {moreCategories.map((category) => (
                          <button
                            key={category}
                            onClick={() => {
                              onCategoryChange(category);
                              setMoreOpen(false);
                            }}
                            className={`px-3 py-1.5 text-sm rounded-full text-left transition-all duration-300 ${
                              selectedCategory === category
                                ? "bg-foreground text-background"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            )}

            {/* Right side: Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 hover:opacity-70 transition-opacity duration-300"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile: Scrollable Categories below header (only on Home page) */}
      {isHomePage && onCategoryChange && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm md:hidden">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 px-6 py-3 w-max">
              {["everything", ...allCategories].map((category) => (
                <button
                  key={category}
                  onClick={() => onCategoryChange(category)}
                  className={`px-4 py-2 text-sm rounded-full whitespace-nowrap transition-all duration-300 ${
                    selectedCategory === category
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
