import { Link } from "react-router";
import { Leaf, Lock, Mail, ShieldCheck } from "lucide-react";
import { useLanguage } from "../language";

const sections = [
  {
    title: "1. Dữ liệu NutriPath thu thập",
    body: [
      "Khi bạn đăng ký hoặc đăng nhập bằng email, Google hoặc Facebook, NutriPath có thể nhận tên hiển thị, email, ảnh đại diện công khai và mã định danh tài khoản từ nhà cung cấp đăng nhập.",
      "Khi bạn sử dụng ứng dụng, NutriPath lưu các dữ liệu bạn chủ động nhập như mục tiêu calo, chiều cao, cân nặng, tuổi, giới tính, mức độ vận động, nhật ký bữa ăn, đồ uống, công thức đã lưu và lịch sử chat dinh dưỡng.",
    ],
  },
  {
    title: "2. Mục đích sử dụng dữ liệu",
    body: [
      "Dữ liệu được dùng để tạo hồ sơ dinh dưỡng, hiển thị dashboard cá nhân, tính calo/macro ước lượng, lưu nhật ký bữa ăn và cá nhân hóa gợi ý healthy food.",
      "Thông tin đăng nhập Google/Facebook chỉ dùng để xác thực tài khoản và liên kết với hồ sơ NutriPath của bạn.",
    ],
  },
  {
    title: "3. Chia sẻ dữ liệu",
    body: [
      "NutriPath không bán dữ liệu cá nhân của người dùng.",
      "Dữ liệu có thể được xử lý bởi các dịch vụ hạ tầng cần thiết như Supabase, Render, Vercel hoặc nhà cung cấp AI để vận hành tính năng, nhưng chỉ trong phạm vi cần thiết cho sản phẩm.",
    ],
  },
  {
    title: "4. Bảo mật",
    body: [
      "API key, database password và cấu hình server không được lưu trong React frontend.",
      "Các API bảo vệ dữ liệu cá nhân yêu cầu phiên đăng nhập hợp lệ. Dữ liệu nhạy cảm không được gửi sang AI nếu không cần thiết.",
    ],
  },
  {
    title: "5. Quyền của người dùng",
    body: [
      "Bạn có thể yêu cầu xem, cập nhật hoặc xóa dữ liệu cá nhân của mình.",
      "Bạn có thể xem hướng dẫn xóa dữ liệu tại trang Xóa dữ liệu người dùng.",
    ],
  },
  {
    title: "6. Liên hệ",
    body: [
      "Nếu có câu hỏi về quyền riêng tư hoặc dữ liệu cá nhân, vui lòng liên hệ đội NutriPath qua email: support@nutripath.app.",
      "Chính sách này có thể được cập nhật khi sản phẩm thay đổi. Ngày cập nhật gần nhất: 08/06/2026.",
    ],
  },
];

export function PrivacyPolicy() {
  const { t } = useLanguage();
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-20 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <section className="mx-auto max-w-4xl">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-green-700 dark:text-green-400" style={{ fontWeight: 850 }}>
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-600 text-white">
            <Leaf className="h-5 w-5" />
          </span>
          NutriPath
        </Link>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-10">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-green-600 dark:text-green-400">Privacy Policy</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{t("Chính sách quyền riêng tư")}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                {t("Trang này mô tả cách NutriPath thu thập, sử dụng và bảo vệ dữ liệu người dùng khi dùng ứng dụng, bao gồm đăng nhập bằng Google và Facebook qua Supabase Auth.")}
              </p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300">
              <ShieldCheck className="h-7 w-7" />
            </div>
          </div>

          <div className="grid gap-5">
            {sections.map((section) => (
              <article key={section.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/70">
                <h2 className="text-lg font-extrabold">{t(section.title)}</h2>
                <div className="mt-3 space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {section.body.map((text) => (
                    <p key={text}>{t(text)}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-4 rounded-2xl border border-green-100 bg-green-50 p-5 text-sm text-green-900 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-100 sm:grid-cols-2">
            <Link to="/data-deletion" className="inline-flex items-center gap-2 font-bold text-green-700 dark:text-green-300">
              <Lock className="h-4 w-4" />
              {t("Xem hướng dẫn xóa dữ liệu")}
            </Link>
            <a href="mailto:support@nutripath.app" className="inline-flex items-center gap-2 font-bold text-green-700 dark:text-green-300">
              <Mail className="h-4 w-4" />
              support@nutripath.app
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
