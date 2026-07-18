import { ChefHat, Clock3, ShieldCheck, Utensils } from "lucide-react";
import { useLanguage } from "../../language";

export interface AiRecipeFormOptions {
  goal: string;
  cuisineStyle: string;
  mealTime: string;
  cookingMethod: string;
  timeMinutes: number;
  servings: number;
  spiceLevel: string;
  mainIngredient: string;
  secondaryIngredients: string;
  allergies: string;
}

export const DEFAULT_AI_RECIPE_OPTIONS: AiRecipeFormOptions = {
  goal: "",
  cuisineStyle: "",
  mealTime: "",
  cookingMethod: "",
  timeMinutes: 30,
  servings: 1,
  spiceLevel: "",
  mainIngredient: "",
  secondaryIngredients: "",
  allergies: "",
};

function splitTextList(value: string) {
  return [...new Set(value
    .split(/[,\n;]/)
    .map((item) => item.trim())
    .filter(Boolean))];
}

export function buildAiRecipeRequestOptions(
  form: AiRecipeFormOptions,
  profileAllergies: string[] = [],
) {
  const allergies = [...new Set([...profileAllergies, ...splitTextList(form.allergies)])];
  const secondaryIngredients = splitTextList(form.secondaryIngredients);

  return {
    goal: form.goal || undefined,
    cuisineStyle: form.cuisineStyle || undefined,
    mealTime: form.mealTime || undefined,
    cookingMethod: form.cookingMethod || undefined,
    timeMinutes: form.timeMinutes,
    servings: form.servings,
    spiceLevel: form.spiceLevel || undefined,
    mainIngredient: form.mainIngredient.trim() || undefined,
    secondaryIngredients: secondaryIngredients.length ? secondaryIngredients : undefined,
    allergies: allergies.length ? allergies : undefined,
    avoidIngredients: allergies.length ? allergies : undefined,
  };
}

interface AiRecipeOptionsFormProps {
  value: AiRecipeFormOptions;
  profileAllergies: string[];
  onChange: (nextValue: AiRecipeFormOptions) => void;
}

const selectClassName = "mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-gray-800 outline-none transition focus:border-green-500";
const inputClassName = "mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-green-500";

export function AiRecipeOptionsForm({ value, profileAllergies, onChange }: AiRecipeOptionsFormProps) {
  const { t } = useLanguage();
  const update = <Key extends keyof AiRecipeFormOptions>(key: Key, nextValue: AiRecipeFormOptions[Key]) => {
    onChange({ ...value, [key]: nextValue });
  };

  return (
    <section className="mt-4 rounded-2xl border border-green-100 bg-gray-50 p-4 md:p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
          <ChefHat className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-gray-900" style={{ fontSize: "0.96rem", fontWeight: 800 }}>
            {t("Tùy chỉnh công thức")}
          </h3>
          <p className="mt-1 text-gray-500" style={{ fontSize: "0.8rem", lineHeight: 1.5 }}>
            {t("Chọn càng rõ, AI càng tạo đúng khẩu vị, thời gian và nguyên liệu bạn có.")}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="block text-gray-700" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
          {t("Mục tiêu món ăn")}
          <select value={value.goal} onChange={(event) => update("goal", event.target.value)} className={selectClassName}>
            <option value="">{t("Để AI đề xuất")}</option>
            <option value="Cân bằng dinh dưỡng">{t("Cân bằng dinh dưỡng")}</option>
            <option value="Giảm mỡ, kiểm soát calo">{t("Giảm mỡ")}</option>
            <option value="Tăng cơ, giàu protein">{t("Tăng cơ")}</option>
            <option value="Tăng cân lành mạnh">{t("Tăng cân")}</option>
            <option value="Món gia đình">{t("Món gia đình")}</option>
            <option value="Ăn chay">{t("Ăn chay")}</option>
          </select>
        </label>

        <label className="block text-gray-700" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
          {t("Kiểu ẩm thực")}
          <select value={value.cuisineStyle} onChange={(event) => update("cuisineStyle", event.target.value)} className={selectClassName}>
            <option value="">{t("Để AI đề xuất")}</option>
            <option value="Việt Nam">{t("Việt Nam")}</option>
            <option value="Châu Á">{t("Châu Á")}</option>
            <option value="Châu Âu">{t("Châu Âu")}</option>
            <option value="Nhật Bản">{t("Nhật Bản")}</option>
            <option value="Hàn Quốc">{t("Hàn Quốc")}</option>
            <option value="Trung Quốc">{t("Trung Quốc")}</option>
            <option value="Thái Lan">{t("Thái Lan")}</option>
            <option value="Địa Trung Hải">{t("Địa Trung Hải")}</option>
          </select>
        </label>

        <label className="block text-gray-700" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
          {t("Dùng cho bữa")}
          <select value={value.mealTime} onChange={(event) => update("mealTime", event.target.value)} className={selectClassName}>
            <option value="">{t("Để AI đề xuất")}</option>
            <option value="Bữa sáng">{t("Bữa sáng")}</option>
            <option value="Bữa trưa">{t("Bữa trưa")}</option>
            <option value="Bữa tối">{t("Bữa tối")}</option>
            <option value="Bữa phụ">{t("Bữa phụ")}</option>
            <option value="Trước khi tập">{t("Trước khi tập")}</option>
            <option value="Sau khi tập">{t("Sau khi tập")}</option>
          </select>
        </label>

        <label className="block text-gray-700" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
          {t("Cách chế biến")}
          <select value={value.cookingMethod} onChange={(event) => update("cookingMethod", event.target.value)} className={selectClassName}>
            <option value="">{t("Để AI đề xuất")}</option>
            <option value="Hấp">{t("Hấp")}</option>
            <option value="Luộc">{t("Luộc")}</option>
            <option value="Áp chảo">{t("Áp chảo")}</option>
            <option value="Xào">{t("Xào")}</option>
            <option value="Nướng">{t("Nướng")}</option>
            <option value="Nồi chiên không dầu">{t("Nồi chiên không dầu")}</option>
            <option value="Kho">{t("Kho")}</option>
            <option value="Hầm">{t("Hầm")}</option>
            <option value="Trộn salad hoặc gỏi">{t("Trộn salad hoặc gỏi")}</option>
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="block text-gray-700" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-4 w-4 text-gray-400" />
            {t("Thời gian nấu tối đa")}
          </span>
          <div className="relative">
            <input
              type="number"
              min={5}
              max={180}
              step={5}
              value={value.timeMinutes}
              onChange={(event) => update("timeMinutes", Math.min(180, Math.max(5, Number(event.target.value) || 5)))}
              className={`${inputClassName} pr-14`}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 translate-y-0.5 text-gray-400" style={{ fontSize: "0.78rem" }}>
              {t("phút")}
            </span>
          </div>
        </label>

        <label className="block text-gray-700" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
          <span className="inline-flex items-center gap-1.5">
            <Utensils className="h-4 w-4 text-gray-400" />
            {t("Số khẩu phần")}
          </span>
          <input
            type="number"
            min={1}
            max={12}
            value={value.servings}
            onChange={(event) => update("servings", Math.min(12, Math.max(1, Number(event.target.value) || 1)))}
            className={inputClassName}
          />
        </label>

        <label className="block text-gray-700" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
          {t("Mức độ cay")}
          <select value={value.spiceLevel} onChange={(event) => update("spiceLevel", event.target.value)} className={selectClassName}>
            <option value="">{t("Theo khẩu vị hồ sơ")}</option>
            <option value="Không cay">{t("Không cay")}</option>
            <option value="Cay nhẹ">{t("Cay nhẹ")}</option>
            <option value="Cay vừa">{t("Cay vừa")}</option>
            <option value="Cay nhiều">{t("Cay nhiều")}</option>
          </select>
        </label>

        <label className="block text-gray-700" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
          {t("Nguyên liệu chính")}
          <input
            value={value.mainIngredient}
            onChange={(event) => update("mainIngredient", event.target.value)}
            className={inputClassName}
            placeholder={t("Ví dụ: cá hồi, ức gà, đậu hũ...")}
            maxLength={100}
          />
        </label>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <label className="block text-gray-700" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
          {t("Nguyên liệu phụ đang có")}
          <textarea
            value={value.secondaryIngredients}
            onChange={(event) => update("secondaryIngredients", event.target.value)}
            rows={2}
            className={`${inputClassName} resize-none`}
            placeholder={t("Ngăn cách bằng dấu phẩy, ví dụ: khoai lang, nấm, cải bó xôi")}
            maxLength={400}
          />
        </label>

        <label className="block text-gray-700" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
          <span className="inline-flex items-center gap-1.5 text-red-700">
            <ShieldCheck className="h-4 w-4" />
            {t("Món dị ứng/cần tránh")}
          </span>
          <textarea
            value={value.allergies}
            onChange={(event) => update("allergies", event.target.value)}
            rows={2}
            className={`${inputClassName} resize-none border-red-100 focus:border-red-400`}
            placeholder={t("Ví dụ: tôm, đậu phộng, sữa...")}
            maxLength={400}
          />
        </label>
      </div>

      <div className="mt-3 rounded-xl border border-green-100 bg-green-50 px-3 py-2.5 text-green-800" style={{ fontSize: "0.78rem", lineHeight: 1.5 }}>
        <ShieldCheck className="mr-1.5 inline h-4 w-4 align-text-bottom" />
        {profileAllergies.length
          ? t("Đã tự động dùng danh sách dị ứng trong hồ sơ: {items}. Bạn có thể nhập thêm món cần tránh cho công thức này.", { items: profileAllergies.join(", ") })
          : t("Danh sách này được gửi kèm hồ sơ để AI loại bỏ nguyên liệu không phù hợp trước khi lưu công thức.")}
      </div>
    </section>
  );
}
