import { useState } from "react";
import { Link } from "react-router";
import { X, Crown, Star, Check, Shield, Zap, Leaf, ArrowRight, Sparkles } from "lucide-react";

interface UpgradeModalProps {
  defaultPlan?: "vip" | "svip";
  onClose: () => void;
}

const vipBenefits = [
  { icon: Zap, color: "text-green-500 bg-green-100", text: "Theo dõi calo không giới hạn" },
  { icon: Sparkles, color: "text-blue-500 bg-blue-100", text: "50 tin nhắn AI mỗi ngày" },
  { icon: Leaf, color: "text-emerald-500 bg-emerald-100", text: "Toàn bộ kho công thức Việt" },
  { icon: Shield, color: "text-purple-500 bg-purple-100", text: "Không quảng cáo, trải nghiệm sạch" },
];

const svipBenefits = [
  { icon: Crown, color: "text-amber-500 bg-amber-100", text: "AI Coach dinh dưỡng cá nhân riêng" },
  { icon: Star, color: "text-orange-500 bg-orange-100", text: "Thực đơn tùy chỉnh hoàn toàn" },
  { icon: Zap, color: "text-yellow-500 bg-yellow-100", text: "Hỗ trợ ưu tiên 24/7" },
  { icon: Shield, color: "text-red-500 bg-red-100", text: "Phân tích thành phần cơ thể" },
];

export function UpgradeModal({ defaultPlan = "vip", onClose }: UpgradeModalProps) {
  const [selected, setSelected] = useState<"vip" | "svip">(defaultPlan);

  const isVip = selected === "vip";
  const benefits = isVip ? vipBenefits : svipBenefits;
  const price = isVip ? "99,000₫" : "199,000₫";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full relative overflow-hidden"
        style={{ maxWidth: "520px" }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        {/* Top hero section */}
        <div
          className={`px-8 pt-10 pb-8 text-center relative overflow-hidden ${
            isVip
              ? "bg-gradient-to-br from-green-600 to-emerald-700"
              : "bg-gradient-to-br from-amber-500 to-orange-600"
          }`}
        >
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4"></div>

          <div className="relative z-10">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              isVip ? "bg-white/20" : "bg-amber-900/30"
            }`}>
              {isVip
                ? <Star className="w-8 h-8 text-white" />
                : <Crown className="w-8 h-8 text-amber-100" />
              }
            </div>
            <h2 className="text-white mb-2" style={{ fontSize: "1.6rem", fontWeight: 800 }}>
              Nâng cấp lên {isVip ? "VIP" : "SVIP"}
            </h2>
            <p className="text-white/80" style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
              {isVip
                ? "Mở khóa toàn bộ công thức, AI chat và trải nghiệm không quảng cáo"
                : "Trải nghiệm đỉnh cao với AI Coach dinh dưỡng hoàn toàn cá nhân hóa"
              }
            </p>
          </div>
        </div>

        {/* Plan selector */}
        <div className="px-8 pt-6">
          <div className="flex bg-gray-100 rounded-2xl p-1 gap-1 mb-6">
            <button
              onClick={() => setSelected("vip")}
              className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                selected === "vip" ? "bg-white text-green-700 shadow-sm" : "text-gray-500"
              }`}
              style={{ fontSize: "0.9rem", fontWeight: 700 }}
            >
              <Star className="w-4 h-4" />
              VIP — 99,000₫/tháng
            </button>
            <button
              onClick={() => setSelected("svip")}
              className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                selected === "svip" ? "bg-amber-500 text-white shadow-sm" : "text-gray-500"
              }`}
              style={{ fontSize: "0.9rem", fontWeight: 700 }}
            >
              <Crown className="w-4 h-4" />
              SVIP — 199,000₫/tháng
            </button>
          </div>

          {/* Benefits */}
          <div className="space-y-3 mb-6">
            {benefits.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.text} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${b.color.split(" ")[1]}`}>
                    <Icon className={`w-4 h-4 ${b.color.split(" ")[0]}`} />
                  </div>
                  <span className="text-gray-700" style={{ fontSize: "0.9rem" }}>{b.text}</span>
                  <Check className="w-4 h-4 text-green-500 ml-auto flex-shrink-0" />
                </div>
              );
            })}
          </div>

          {/* Price summary */}
          <div className={`rounded-2xl p-4 mb-6 border-2 ${isVip ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
            <div className="flex justify-between items-center">
              <span className="text-gray-600" style={{ fontSize: "0.9rem" }}>Gói {isVip ? "VIP" : "SVIP"}</span>
              <span className={`${isVip ? "text-green-700" : "text-amber-700"}`} style={{ fontSize: "1.1rem", fontWeight: 800 }}>{price}/tháng</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-gray-400" style={{ fontSize: "0.8rem" }}>Thanh toán hàng tháng</span>
              <span className="text-green-600 bg-green-100 px-2 py-0.5 rounded-full" style={{ fontSize: "0.75rem", fontWeight: 600 }}>7 ngày dùng thử miễn phí</span>
            </div>
          </div>

          {/* CTA */}
          <Link
            to="/checkout"
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl transition-all shadow-lg mb-3 ${
              isVip
                ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-500 hover:to-emerald-500"
                : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400"
            }`}
            style={{ fontSize: "1rem", fontWeight: 700 }}
            onClick={onClose}
          >
            Nâng cấp ngay <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="text-center pb-2">
            <button className="text-green-600 hover:text-green-700 underline" style={{ fontSize: "0.875rem" }}>
              Dùng thử 7 ngày miễn phí
            </button>
          </div>
        </div>

        {/* Trust badges */}
        <div className="px-8 py-4 border-t border-gray-100 flex justify-center gap-6">
          {[
            { icon: Shield, text: "Bảo mật SSL" },
            { icon: Zap, text: "Kích hoạt ngay" },
            { icon: Leaf, text: "Hủy mọi lúc" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-gray-400">
              <Icon className="w-3.5 h-3.5 text-green-500" />
              <span style={{ fontSize: "0.75rem" }}>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
