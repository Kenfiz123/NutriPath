import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

const DEFAULT_PAYMENT_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const DEFAULT_TIME_ZONE = "Asia/Ho_Chi_Minh";
const ALLOWED_BANK_CODES = new Set(["", "VNPAYQR", "VNBANK", "INTCARD"]);

function requiredEnv(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) {
    const error = new Error(`Missing ${name} for VNPAY payment.`);
    error.status = 503;
    error.code = "vnpay_not_configured";
    throw error;
  }
  return value;
}

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function assertHttpUrl(value, name, { allowLocalhost = false } = {}) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL.`);
  }
  const isLocal = ["localhost", "127.0.0.1"].includes(parsed.hostname);
  if (parsed.protocol !== "https:" && !(allowLocalhost && isLocal && parsed.protocol === "http:")) {
    throw new Error(`${name} must use HTTPS${allowLocalhost ? " (HTTP is allowed only for localhost)" : ""}.`);
  }
  return parsed.toString();
}

function encodeVnpayParams(params) {
  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && String(value).length > 0)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => [key, String(value)]);
  return new URLSearchParams(entries).toString();
}

function sign(hashData, secret) {
  return createHmac("sha512", secret).update(hashData, "utf8").digest("hex");
}

function secureHexEquals(left, right) {
  const leftText = String(left || "").toLowerCase();
  const rightText = String(right || "").toLowerCase();
  if (!/^[a-f0-9]{128}$/.test(leftText) || !/^[a-f0-9]{128}$/.test(rightText)) return false;
  return timingSafeEqual(Buffer.from(leftText, "hex"), Buffer.from(rightText, "hex"));
}

function vnpayResponseParams(searchParams) {
  return Object.fromEntries(
    [...searchParams.entries()].filter(([key, value]) => (
      key.startsWith("vnp_")
      && key !== "vnp_SecureHash"
      && key !== "vnp_SecureHashType"
      && value !== ""
    )),
  );
}

export function getVnpayConfig() {
  const frontendUrl = normalizeBaseUrl(process.env.FRONTEND_URL || process.env.CORS_ORIGIN || "http://127.0.0.1:5173");
  const paymentUrl = assertHttpUrl(process.env.VNPAY_URL || DEFAULT_PAYMENT_URL, "VNPAY_URL");
  const returnUrl = assertHttpUrl(
    process.env.VNPAY_RETURN_URL || `${frontendUrl}/payment-result`,
    "VNPAY_RETURN_URL",
    { allowLocalhost: true },
  );

  return {
    tmnCode: requiredEnv("VNPAY_TMN_CODE"),
    hashSecret: requiredEnv("VNPAY_HASH_SECRET"),
    paymentUrl,
    returnUrl,
    locale: process.env.VNPAY_LOCALE === "en" ? "en" : "vn",
    timeZone: process.env.VNPAY_TIMEZONE || DEFAULT_TIME_ZONE,
    expireMinutes: Math.min(60, Math.max(5, Number(process.env.VNPAY_EXPIRE_MINUTES || 15))),
  };
}

export function formatVnpayDate(date, timeZone = DEFAULT_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}${value.month}${value.day}${value.hour}${value.minute}${value.second}`;
}

export function createVnpayTxnRef() {
  return `NP${Date.now()}${String(randomInt(0, 100000)).padStart(5, "0")}`;
}

export function normalizeVnpayBankCode(value) {
  const bankCode = String(value || "").trim().toUpperCase();
  if (!ALLOWED_BANK_CODES.has(bankCode)) {
    const error = new Error("Invalid VNPAY bank code.");
    error.status = 400;
    error.code = "invalid_vnpay_bank_code";
    error.details = { allowed: [...ALLOWED_BANK_CODES] };
    throw error;
  }
  return bankCode;
}

export function toVnpayOrderInfo(value) {
  return String(value || "Thanh toan NutriPath")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, (letter) => (letter === "Đ" ? "D" : "d"))
    .replace(/[^A-Za-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 255);
}

export function buildVnpayPaymentUrl({ config, amount, transactionRef, orderInfo, ipAddress, bankCode = "", now = new Date() }) {
  const safeAmount = Math.round(Number(amount));
  if (!Number.isSafeInteger(safeAmount) || safeAmount <= 0 || safeAmount > 9_999_999_999) {
    const error = new Error("Invalid VNPAY payment amount.");
    error.status = 400;
    error.code = "invalid_vnpay_amount";
    throw error;
  }

  const expiresAt = new Date(now.getTime() + config.expireMinutes * 60_000);
  const params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: config.tmnCode,
    vnp_Amount: safeAmount * 100,
    vnp_CurrCode: "VND",
    vnp_TxnRef: transactionRef,
    vnp_OrderInfo: toVnpayOrderInfo(orderInfo),
    vnp_OrderType: "other",
    vnp_Locale: config.locale,
    vnp_ReturnUrl: config.returnUrl,
    vnp_IpAddr: String(ipAddress || "127.0.0.1").replace(/^::ffff:/, "").slice(0, 45),
    vnp_CreateDate: formatVnpayDate(now, config.timeZone),
    vnp_ExpireDate: formatVnpayDate(expiresAt, config.timeZone),
    ...(bankCode ? { vnp_BankCode: normalizeVnpayBankCode(bankCode) } : {}),
  };
  const hashData = encodeVnpayParams(params);
  const secureHash = sign(hashData, config.hashSecret);
  return {
    paymentUrl: `${config.paymentUrl}?${hashData}&vnp_SecureHash=${secureHash}`,
    expiresAt: expiresAt.toISOString(),
    params,
  };
}

export function verifyVnpaySignature(searchParams, config) {
  const receivedHash = searchParams.get("vnp_SecureHash") || "";
  const params = vnpayResponseParams(searchParams);
  const expectedHash = sign(encodeVnpayParams(params), config.hashSecret);
  return {
    valid: secureHexEquals(receivedHash, expectedHash),
    params,
  };
}
