import React from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun, FileText, Accessibility } from "lucide-react";
import { useTheme } from "next-themes";
import { useAccessibility } from "@/contexts/AccessibilityContext";

const Header = () => {
  const { theme, setTheme } = useTheme();
  const { screenReaderMode, toggleScreenReaderMode } = useAccessibility();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-xl items-center">
        <div className="mr-4 flex">
          <a className="mr-6 flex items-center space-x-2" href="/">
            <FileText className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">ReadEasy</span>
          </a>
        </div>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <a
              className="transition-colors hover:text-foreground/80 text-foreground/60 sr-enhanced"
              href="#features"
              aria-label="Navigate to Features section"
            >
              Features
            </a>
            <a
              className="transition-colors hover:text-foreground/80 text-foreground/60 sr-enhanced"
              href="#how-it-works"
              aria-label="Navigate to How it Works section"
            >
              How it Works
            </a>
          </nav>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleScreenReaderMode}
              className={`h-8 w-8 px-0 ${screenReaderMode ? 'bg-accent text-accent-foreground' : ''}`}
              aria-label={screenReaderMode ? 'Disable screen reader mode' : 'Enable screen reader mode'}
              aria-pressed={screenReaderMode}
            >
              <Accessibility className="h-4 w-4" />
              <span className="sr-only">Toggle screen reader mode</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="h-8 w-8 px-0"
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;