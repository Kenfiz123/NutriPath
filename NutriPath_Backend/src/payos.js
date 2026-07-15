import { PayOS } from "@payos/node";

const DEFAULT_BASE_URL = "https://api-merchant.payos.vn";
const DEFAULT_EXPIRE_MINUTES = 15;
let lastOrderCode = 0;

function requireEnv(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) {
    const error = new Error(`Missing ${name} for PayOS payment.`);
    error.status = 503;
    error.code = "payos_not_configured";
    throw error;
  }
  return value;
}

function parseHttpUrl(value, name) {
  try {
    const url = new URL(value);
    if (!new Set(["http:", "https:"]).has(url.protocol)) throw new Error("Unsupported protocol");
    return url;
  } catch {
    const error = new Error(`${name} must be a valid HTTP(S) URL.`);
    error.status = 503;
    error.code = "payos_invalid_config";
    throw error;
  }
}

function paymentResultUrl(frontendUrl, configuredUrl, cancelled = false) {
  const url = parseHttpUrl(configuredUrl || `${frontendUrl}/payment-result`, cancelled ? "PAYOS_CANCEL_URL" : "PAYOS_RETURN_URL");
  url.searchParams.set("gateway", "payos");
  if (cancelled) url.searchParams.set("cancelled", "true");
  return url.toString();
}

export function getPayosConfig() {
  const frontendUrl = parseHttpUrl(
    String(process.env.FRONTEND_URL || "http://127.0.0.1:5173").replace(/\/+$/, ""),
    "FRONTEND_URL",
  ).toString().replace(/\/$/, "");
  const expireMinutes = Number(process.env.PAYOS_EXPIRE_MINUTES || DEFAULT_EXPIRE_MINUTES);
  if (!Number.isInteger(expireMinutes) || expireMinutes < 5 || expireMinutes > 60) {
    const error = new Error("PAYOS_EXPIRE_MINUTES must be an integer between 5 and 60.");
    error.status = 503;
    error.code = "payos_invalid_config";
    throw error;
  }

  return {
    clientId: requireEnv("PAYOS_CLIENT_ID"),
    apiKey: requireEnv("PAYOS_API_KEY"),
    checksumKey: requireEnv("PAYOS_CHECKSUM_KEY"),
    baseURL: parseHttpUrl(process.env.PAYOS_BASE_URL || DEFAULT_BASE_URL, "PAYOS_BASE_URL").toString().replace(/\/$/, ""),
    returnUrl: paymentResultUrl(frontendUrl, process.env.PAYOS_RETURN_URL, false),
    cancelUrl: paymentResultUrl(frontendUrl, process.env.PAYOS_CANCEL_URL, true),
    expireMinutes,
  };
}

export function createPayosClient(config = getPayosConfig()) {
  return new PayOS({
    clientId: config.clientId,
    apiKey: config.apiKey,
    checksumKey: config.checksumKey,
    baseURL: config.baseURL,
    timeout: 15000,
    maxRetries: 1,
  });
}

export function createPayosOrderCode(timestamp = Date.now()) {
  const candidate = Math.floor(Number(timestamp));
  if (!Number.isSafeInteger(candidate) || candidate <= 0) {
    throw new TypeError("PayOS order timestamp must be a positive safe integer.");
  }
  lastOrderCode = Math.max(candidate, lastOrderCode + 1);
  return lastOrderCode;
}

export async function createPayosPaymentLink({
  config = getPayosConfig(),
  orderCode,
  amount,
  itemName,
  now = new Date(),
  client = createPayosClient(config),
}) {
  if (!Number.isSafeInteger(orderCode) || orderCode <= 0) throw new TypeError("Invalid PayOS order code.");
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new TypeError("Invalid PayOS amount.");
  const createdAt = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(createdAt.getTime())) throw new TypeError("Invalid PayOS creation time.");

  const expiresAt = new Date(createdAt.getTime() + config.expireMinutes * 60 * 1000);
  const request = {
    orderCode,
    amount,
    description: `NP ${String(orderCode).slice(-6)}`,
    items: [{ name: String(itemName || "NutriPath membership").slice(0, 25), quantity: 1, price: amount }],
    cancelUrl: config.cancelUrl,
    returnUrl: config.returnUrl,
    expiredAt: Math.floor(expiresAt.getTime() / 1000),
  };
  const paymentLink = await client.paymentRequests.create(request);
  return { paymentLink, request, expiresAt: expiresAt.toISOString() };
}

export async function verifyPayosWebhook(payload, config = getPayosConfig(), client = createPayosClient(config)) {
  return client.webhooks.verify(payload);
}

export async function getPayosPaymentLink(orderCode, config = getPayosConfig(), client = createPayosClient(config)) {
  if (!Number.isSafeInteger(orderCode) || orderCode <= 0) throw new TypeError("Invalid PayOS order code.");
  return client.paymentRequests.get(orderCode);
}
