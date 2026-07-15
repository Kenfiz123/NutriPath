import assert from "node:assert/strict";
import {
  buildVnpayPaymentUrl,
  formatVnpayDate,
  getVnpayConfig,
  verifyVnpaySignature,
} from "../src/vnpay.js";

process.env.VNPAY_TMN_CODE = "TEST1234";
process.env.VNPAY_HASH_SECRET = "test-hash-secret-for-vnpay-unit-test";
process.env.VNPAY_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
process.env.VNPAY_RETURN_URL = "http://127.0.0.1:5173/payment-result";
process.env.VNPAY_EXPIRE_MINUTES = "15";

const config = getVnpayConfig();
const now = new Date("2026-07-15T05:00:00.000Z");
const result = buildVnpayPaymentUrl({
  config,
  amount: 199000,
  transactionRef: "NP202607150001",
  orderInfo: "Thanh toán gói SVIP",
  ipAddress: "127.0.0.1",
  bankCode: "VNBANK",
  now,
});

const paymentUrl = new URL(result.paymentUrl);
assert.equal(paymentUrl.origin + paymentUrl.pathname, process.env.VNPAY_URL);
assert.equal(paymentUrl.searchParams.get("vnp_Amount"), "19900000");
assert.equal(paymentUrl.searchParams.get("vnp_CreateDate"), "20260715120000");
assert.equal(paymentUrl.searchParams.get("vnp_ExpireDate"), "20260715121500");
assert.equal(formatVnpayDate(now), "20260715120000");
assert.equal(verifyVnpaySignature(paymentUrl.searchParams, config).valid, true);

paymentUrl.searchParams.set("vnp_Amount", "1");
assert.equal(verifyVnpaySignature(paymentUrl.searchParams, config).valid, false);

console.log("VNPAY signing test passed.");
