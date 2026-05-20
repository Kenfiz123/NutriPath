import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemeMode } from "../theme";

const options: Array<{ value: ThemeMode; label: string; icon: typeof Sun }> = [
  { value: "light", label: "Light Mode", icon: Sun },
  { value: "dark", label: "Dark Mode", icon: Moon },
  { value: "system", label: "System Default", icon: Monitor },
];

export function ThemeToggle({ compact = false, isLanding = false }: { compact?: boolean; isLanding?: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div
      className={`inline-flex items-center rounded-2xl border p-1 shadow-sm backdrop-blur ${
        isLanding
          ? "border-white/20 bg-white/10"
          : "border-gray-200 bg-gray-100 dark:border-slate-700 dark:bg-slate-800"
      }`}
      aria-label={`Theme switcher, current ${theme}, resolved ${resolvedTheme}`}
      title={`Theme: ${theme === "system" ? `System (${resolvedTheme})` : theme}`}
    >
      {options.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            className={`flex h-8 items-center justify-center gap-1.5 rounded-xl px-2.5 transition ${
              active
                ? "bg-white text-green-700 shadow-sm dark:bg-slate-950 dark:text-green-300"
                : isLanding
                  ? "text-white/75 hover:bg-white/10 hover:text-white"
                  : "text-gray-500 hover:bg-white/70 hover:text-gray-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
            }`}
            aria-pressed={active}
            aria-label={label}
          >
            <Icon className="h-4 w-4" />
            {!compact && <span className="hidden xl:inline" style={{ fontSize: "0.76rem", fontWeight: 800 }}>{value === "system" ? "Auto" : value === "light" ? "Light" : "Dark"}</span>}
          </button>
        );
      })}
    </div>
  );
}
