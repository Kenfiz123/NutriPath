import { Zap } from "lucide-react";
import { useLanguage } from "../../language";

interface DailyTipProps {
  text: string;
}

export function DailyTip({ text }: DailyTipProps) {
  const { t } = useLanguage();
  return (
    <section className="rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 p-5 dark:border-emerald-400/20 dark:from-emerald-500/10 dark:to-slate-900">
      <div className="mb-3 flex items-center gap-2">
        <Zap className="h-4 w-4 text-green-600 dark:text-emerald-300" />
        <h2 className="text-sm font-bold text-green-700 dark:text-emerald-200">
          {t("Mẹo hôm nay")}
        </h2>
      </div>
      <p className="text-sm leading-6 text-gray-700 dark:text-slate-200">
        {t(text)}
      </p>
    </section>
  );
}
