import { Languages } from "lucide-react";
import { useLanguage } from "../language";

interface LanguageToggleProps {
  isLanding?: boolean;
}

export function LanguageToggle({ isLanding = false }: LanguageToggleProps) {
  const { language, t, toggleLanguage } = useLanguage();
  const nextLabel = language === "vi" ? t("Chuyển sang tiếng Anh") : t("Chuyển sang tiếng Việt");

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label={nextLabel}
      title={nextLabel}
      className={`flex h-9 min-w-[54px] items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-bold transition-colors ${
        isLanding
          ? "bg-white/10 text-white hover:bg-white/20"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      }`}
    >
      <Languages className="h-4 w-4" />
      <span>{language.toUpperCase()}</span>
    </button>
  );
}
