import { Link } from "react-router";
import { CheckCircle2, Leaf, Mail, Trash2 } from "lucide-react";

const deletionSteps = [
  "Gửi email đến support@nutripath.app bằng email đã dùng để đăng nhập NutriPath.",
  "Tiêu đề email: Yêu cầu xóa dữ liệu NutriPath.",
  "Trong nội dung, ghi rõ bạn muốn xóa tài khoản, nhật ký bữa ăn, lịch sử chat, dữ liệu Google/Facebook OAuth và các dữ liệu cá nhân liên quan.",
  "NutriPath sẽ xác minh quyền sở hữu tài khoản qua email đăng ký hoặc nhà cung cấp đăng nhập.",
  "Sau khi xác minh, dữ liệu cá nhân sẽ được xóa khỏi hệ thống vận hành trong thời gian hợp lý, thường trong vòng 7 ngày làm việc.",
];

const deletedData = [
  "Thông tin hồ sơ thành viên: tên, email, ảnh đại diện, mục tiêu calo và dữ liệu dinh dưỡng cá nhân.",
  "Nhật ký bữa ăn, đồ uống, món tự nấu, công thức đã lưu và báo cáo liên quan.",
  "Lịch sử chat NutriBot AI, log an toàn AI gắn với tài khoản, và mapping đăng nhập Google/Facebook.",
  "Phiên đăng nhập hiện tại của tài khoản trong ứng dụng.",
];

const retainedData = [
  "Dữ liệu bắt buộc phải giữ theo yêu cầu pháp lý, chống gian lận hoặc bảo mật có thể được lưu trong thời gian cần thiết.",
  "Dữ liệu đã được ẩn danh hoặc tổng hợp để phân tích chất lượng sản phẩm có thể không thể liên kết ngược về người dùng cụ thể.",
];

export function DataDeletion() {
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
              <p className="text-sm font-bold uppercase tracking-wide text-red-600 dark:text-red-300">User Data Deletion</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Xóa dữ liệu người dùng</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                Trang này hướng dẫn người dùng NutriPath yêu cầu xóa dữ liệu cá nhân, bao gồm dữ liệu được tạo
                khi đăng nhập bằng Google hoặc Facebook qua Supabase Auth.
              </p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">
              <Trash2 className="h-7 w-7" />
            </div>
          </div>

          <section className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/70">
            <h2 className="text-lg font-extrabold">Cách yêu cầu xóa dữ liệu</h2>
            <ol className="mt-4 space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {deletionSteps.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <a
              href="mailto:support@nutripath.app?subject=Y%C3%AAu%20c%E1%BA%A7u%20x%C3%B3a%20d%E1%BB%AF%20li%E1%BB%87u%20NutriPath"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-700"
            >
              <Mail className="h-4 w-4" />
              Gửi yêu cầu xóa dữ liệu
            </a>
          </section>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-green-100 bg-green-50 p-5 dark:border-green-500/20 dark:bg-green-500/10">
              <h2 className="text-lg font-extrabold text-green-900 dark:text-green-100">Dữ liệu sẽ được xóa</h2>
              <div className="mt-4 space-y-3 text-sm leading-7 text-green-900/80 dark:text-green-100/80">
                {deletedData.map((item) => (
                  <p key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-green-600 dark:text-green-300" />
                    <span>{item}</span>
                  </p>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-amber-100 bg-amber-50 p-5 dark:border-amber-500/20 dark:bg-amber-500/10">
              <h2 className="text-lg font-extrabold text-amber-900 dark:text-amber-100">Dữ liệu có thể được giữ lại</h2>
              <div className="mt-4 space-y-3 text-sm leading-7 text-amber-900/80 dark:text-amber-100/80">
                {retainedData.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </section>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm leading-7 text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
            <p>
              Nếu bạn chỉ muốn ngắt kết nối Google/Facebook khỏi NutriPath nhưng vẫn giữ tài khoản, hãy ghi rõ yêu cầu
              trong email. Bạn cũng có thể xóa quyền truy cập của NutriPath trong phần cài đặt tài khoản Google hoặc Facebook.
            </p>
            <p className="mt-3">
              Ngày cập nhật gần nhất: 08/06/2026. Trang chính sách quyền riêng tư:{" "}
              <Link to="/privacy" className="font-bold text-green-700 dark:text-green-300">
                /privacy
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
