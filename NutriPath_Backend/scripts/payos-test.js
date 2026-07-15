import assert from "node:assert/strict";
import {
  createPayosOrderCode,
  createPayosPaymentLink,
  getPayosConfig,
  getPayosPaymentLink,
  verifyPayosWebhook,
} from "../src/payos.js";

process.env.PAYOS_CLIENT_ID = "test-client-id";
process.env.PAYOS_API_KEY = "test-api-key";
process.env.PAYOS_CHECKSUM_KEY = "test-checksum-key";
process.env.PAYOS_BASE_URL = "https://api-merchant.payos.vn";
process.env.FRONTEND_URL = "http://127.0.0.1:5173";
process.env.PAYOS_RETURN_URL = "http://127.0.0.1:5173/payment-result";
process.env.PAYOS_CANCEL_URL = "http://127.0.0.1:5173/payment-result";
process.env.PAYOS_EXPIRE_MINUTES = "15";

const config = getPayosConfig();
assert.equal(config.returnUrl, "http://127.0.0.1:5173/payment-result?gateway=payos");
assert.equal(config.cancelUrl, "http://127.0.0.1:5173/payment-result?gateway=payos&cancelled=true");

const orderCode = createPayosOrderCode(1784091600000);
assert.equal(createPayosOrderCode(1784091600000), orderCode + 1);

let capturedRequest = null;
const fakeClient = {
  paymentRequests: {
    async create(request) {
      capturedRequest = request;
      return {
        orderCode: request.orderCode,
        amount: request.amount,
        paymentLinkId: "test-link-id",
        status: "PENDING",
        checkoutUrl: "https://pay.payos.vn/web/test-link-id",
        qrCode: "test-qr-code",
      };
    },
    async get(value) {
      return { id: "test-link-id", orderCode: value, amount: 199000, amountPaid: 199000, status: "PAID" };
    },
  },
  webhooks: {
    async verify(payload) {
      assert.equal(payload.signature, "valid-test-signature");
      return payload.data;
    },
  },
};

const now = new Date("2026-07-15T05:00:00.000Z");
const result = await createPayosPaymentLink({
  config,
  orderCode,
  amount: 199000,
  itemName: "Goi SVIP thang",
  now,
  client: fakeClient,
});
assert.equal(result.paymentLink.checkoutUrl, "https://pay.payos.vn/web/test-link-id");
assert.equal(result.expiresAt, "2026-07-15T05:15:00.000Z");
assert.deepEqual(capturedRequest.items, [{ name: "Goi SVIP thang", quantity: 1, price: 199000 }]);
assert.equal(capturedRequest.description, `NP ${String(orderCode).slice(-6)}`);
assert.equal(capturedRequest.expiredAt, Math.floor(new Date(result.expiresAt).getTime() / 1000));

const verified = await verifyPayosWebhook({
  code: "00",
  desc: "success",
  success: true,
  data: { orderCode, amount: 199000, currency: "VND", code: "00" },
  signature: "valid-test-signature",
}, config, fakeClient);
assert.equal(verified.orderCode, orderCode);

const payment = await getPayosPaymentLink(orderCode, config, fakeClient);
assert.equal(payment.status, "PAID");
assert.equal(payment.amountPaid, 199000);

console.log("PayOS adapter tests passed without calling the production API.");
