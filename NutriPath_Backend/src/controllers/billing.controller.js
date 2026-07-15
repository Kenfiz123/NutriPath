import {
  buildVnpayPaymentUrl,
  createVnpayTxnRef,
  getVnpayConfig,
  normalizeVnpayBankCode,
  verifyVnpaySignature,
} from "../vnpay.js";
import {
  createPayosOrderCode,
  createPayosPaymentLink,
  getPayosConfig,
  getPayosPaymentLink,
  verifyPayosWebhook,
} from "../payos.js";

export function registerBillingRoutes(ctx) {
  const {
    CUSTOM_FOOD_UNITS,
    VIETNAM_NUTRITION_INGREDIENTS,
    addDays,
    adminColorForMember,
    apiLinks,
    applyChatIntent,
    applyNutritionCalculationToMember,
    applyWaterEquivalent,
    assertMealItemQuota,
    assertMealLogAccess,
    assertMemberSessionAccess,
    assertNumberInRange,
    authSessionResponse,
    badRequest,
    buildAdminOverview,
    buildAdvancedNutritionContext,
    buildCalculationWarnings,
    buildDashboardAchievements,
    buildDashboardTips,
    buildNutritionProfile,
    buildNutritionReport,
    buildPersonalizedRecipePrompt,
    buildQuote,
    buildReportCsv,
    buildSafeChatHistoryContext,
    buildSafeNutritionContext,
    buildSvipCalorieInsightPrompt,
    buildSvipFoodPhotoRefinementPrompt,
    buildWeeklyCoachPlan,
    buildWeeklyProgress,
    calculateCalories,
    callAiProviderForText,
    callGeminiProvider,
    callGeminiVisionProvider,
    callGroqProvider,
    callOpenAiCompatibleProvider,
    canUseAdvancedAiContext,
    cannedChatResponse,
    chatBlockMessage,
    chatHistoryResource,
    collectionResponse,
    conflict,
    countTrackedMealDays,
    csvValue,
    currentLink,
    customFoodResource,
    dateToUtcDay,
    daysBetweenDates,
    earliestDateString,
    enforceSafeChatRateLimit,
    ensureAuthCredentials,
    ensureChatHistory,
    ensureCoachPlans,
    ensureMealLog,
    ensureNotifications,
    ensurePersonalFoods,
    ensurePersonalizedRecipes,
    errorResponse,
    estimateCustomCookedFood,
    estimateFoodPhotoCalories,
    extractGeminiText,
    extractJsonObject,
    extractMillilitersFromPortion,
    findCredentialByEmail,
    findMemberByEmail,
    foodResource,
    forbidden,
    geminiQuotaMessage,
    generatePersonalizedRecipe,
    generateSafeGeminiChatResponse,
    generateSvipCalorieInsight,
    getActiveSession,
    getAdminUsersData,
    getAiProviders,
    getBearerToken,
    getChatAdminKey,
    getClientIp,
    getDrinkWaterEquivalentGlasses,
    getFatPct,
    getFood,
    getGeminiRateState,
    getGoalDelta,
    getMealHistoryDayDelta,
    getMealItemCount,
    getMember,
    getMemberChatHistory,
    getMembershipAccess,
    getNormalizedTier,
    getPersonalizedRecipeQuestions,
    getPlan,
    getPlanPayments,
    getProteinPerKg,
    getRecipe,
    getRecipeImageUrl,
    getSafeCalorieMinimum,
    getSafeChatLimits,
    getSafeChatQuickReplies,
    getSafeChatTier,
    getSubscriptionSnapshot,
    hashPassword,
    initialsFromName,
    insertSqlServerAuthMember,
    insertSqlServerCredential,
    isChatAdminKey,
    isSameLocalDate,
    isTruthyQuery,
    link,
    loadEnvFile,
    localizePersonalizedRecipe,
    localizePersonalizedRecipeText,
    logDangerousChat,
    makeEmptyReportLog,
    matchRoute,
    mealLogResource,
    memberFromRegistration,
    memberResource,
    normalizeChatIntent,
    normalizeEmail,
    normalizeFoodPhotoEstimate,
    normalizeForPolicy,
    normalizeIngredient,
    normalizeMealLogLabels,
    normalizePath,
    normalizePersonalizedRecipe,
    normalizeSvipCalorieInsight,
    normalizeVietnameseText,
    notFound,
    notificationResource,
    paginateItems,
    parseCalorieGoalIntentFromText,
    parseChatIntent,
    parseDate,
    parseFoodPhotoImage,
    paymentResource,
    personalizedRecipeResource,
    planLabel,
    planResource,
    readBody,
    recipeResource,
    redactSensitiveText,
    refineFoodPhotoEstimateForSvip,
    releaseGeminiQuota,
    reportDateRange,
    requireAdminSession,
    requireFields,
    requireSession,
    reserveGeminiQuota,
    roleLabel,
    round,
    route,
    safeCannedChatResponse,
    saveMealLogChanges,
    saveMemberChatMessages,
    saveMemberNutritionProfile,
    savePersonalizedRecipe,
    saveSqlServerMealLog,
    saveSqlServerMemberNutritionProfile,
    saveSqlServerPaymentAndSubscription,
    sendJson,
    serviceUnavailable,
    sessions,
    splitPath,
    startOfWeek,
    summarizeMealLog,
    syncMemberNotifications,
    toLocalDateString,
    tooManyRequests,
    unauthorized,
    updateMemberDailyCalorieGoal,
    updateSqlServerMemberCalorieGoal,
    updateWaterGoalStatus,
    upsertNotification,
    validateSafeChatInput,
    validateSafeChatOutput,
    verifyPassword
  } = ctx;

  function requirePaymentOwner(req, store, memberId) {
    const { member: sessionMember } = requireSession(req, store);
    const member = getMember(store.db, memberId);
    if (!member) notFound(req, "Member not found.");
    if (sessionMember.id !== member.id && sessionMember.role?.toLowerCase() !== "admin") {
      forbidden("Bạn không được thanh toán thay cho thành viên này.");
    }
    return member;
  }

  function activateMembership(store, member, payment, plan, trialDays = 0) {
    const now = new Date();
    const todayString = toLocalDateString(now);
    const existingSubscription = getSubscriptionSnapshot(store.db, member);
    const sameActivePlan = existingSubscription.planId === plan.id && ["active", "trialing"].includes(existingSubscription.status);
    const startedAt = sameActivePlan ? (existingSubscription.startedAt || todayString) : todayString;
    const purchaseAt = sameActivePlan ? (existingSubscription.purchaseAt || startedAt) : todayString;
    const currentRenewal = parseDate(existingSubscription.renewsAt);
    const renewalBase = !trialDays && sameActivePlan && currentRenewal && currentRenewal > parseDate(todayString)
      ? currentRenewal
      : now;
    const renews = new Date(renewalBase);
    if (trialDays) {
      renews.setDate(renews.getDate() + trialDays);
    } else {
      renews.setMonth(renews.getMonth() + (payment.billing === "annual" ? 12 : 1));
    }
    const renewsAt = toLocalDateString(renews);
    const daysTotal = daysBetweenDates(startedAt, renewsAt) || trialDays || (payment.billing === "annual" ? 365 : 30);
    const daysRemaining = Math.max(0, daysBetweenDates(todayString, renewsAt) ?? daysTotal);

    member.tier = plan.id;
    member.subscription = {
      planId: plan.id,
      billing: payment.billing,
      status: trialDays ? "trialing" : "active",
      startedAt,
      purchaseAt,
      renewsAt,
      daysTotal,
      daysRemaining,
    };
    if (trialDays) member.trialUsedAt = now.toISOString();

    upsertNotification(
      store,
      member.id,
      "membership-payment",
      trialDays ? "Đã kích hoạt dùng thử" : "Gói thành viên đã được kích hoạt",
      `${plan.name} ${payment.billing === "annual" ? "năm" : "tháng"} có hiệu lực đến ${renewsAt}.`,
      {
        key: `${member.id}:membership-payment:${payment.id}`,
        actionHref: "/member",
        priority: "high",
      },
    );
  }

  async function persistFinalizedPayment(store, member, payment) {
    if (store.dataSource === "sqlserver") {
      await saveSqlServerPaymentAndSubscription(member, payment, member.subscription);
      await store.reload();
      return getMember(store.db, member.id);
    }
    await store.save();
    return member;
  }

  async function finalizePayosPayment(store, payment, providerData) {
    if (payment.status === "paid") return getMember(store.db, payment.memberId);
    const receivedAmount = Number(providerData.amountPaid ?? providerData.amount);
    if (!Number.isSafeInteger(receivedAmount) || receivedAmount !== payment.amount) {
      badRequest("Số tiền PayOS không khớp với đơn hàng.");
    }
    if (providerData.currency && providerData.currency !== payment.currency) {
      badRequest("Đơn vị tiền tệ PayOS không khớp với đơn hàng.");
    }

    const member = getMember(store.db, payment.memberId);
    const plan = getPlan(store.db, payment.planId);
    if (!member || !plan) badRequest("Không tìm thấy dữ liệu gói của đơn PayOS.");

    const now = new Date().toISOString();
    payment.status = "paid";
    payment.paidAt = now;
    payment.failedAt = null;
    payment.providerTransactionNo = providerData.reference || payment.providerTransactionNo || null;
    payment.payosPaymentLinkId = providerData.paymentLinkId || providerData.id || payment.payosPaymentLinkId || null;
    payment.transactionStatus = "PAID";
    payment.responseCode = providerData.code || "00";
    payment.providerPaidAt = providerData.transactionDateTime || now;
    activateMembership(store, member, payment, plan);
    return persistFinalizedPayment(store, member, payment);
  }

  async function failPayosPayment(store, payment, providerStatus) {
    if (payment.status !== "pending") return;
    payment.status = "failed";
    payment.failedAt = new Date().toISOString();
    payment.transactionStatus = providerStatus;
    await store.save();
  }

  route("GET", "/api/members/:memberId/payments", async ({ req, store, params }) => {
    const member = requirePaymentOwner(req, store, params.memberId);
    const payments = store.db.payments.filter((payment) => payment.memberId === member.id);
    return collectionResponse(req, "payments", payments, {
      itemMapper: (payment) => paymentResource(req, payment),
      links: { create: link(req, "/api/payments", "POST"), member: link(req, `/api/members/${member.id}`) },
    });
  });

  route("GET", "/api/plans", async ({ req, store, url }) => {
    const billing = url.searchParams.get("billing") || "monthly";
    const plans = store.db.plans.map((plan) => {
      const quoted = buildQuote(store.db, { planId: plan.id, billing: billing === "annual" ? "annual" : "monthly" });
      return { ...plan, pricePreview: quoted, _links: planResource(req, plan)._links };
    });
    return collectionResponse(req, "plans", plans, {
      itemMapper: (plan) => plan,
      meta: { billing },
      links: { quote: link(req, "/api/checkout/quote", "POST") },
    });
  });

  route("GET", "/api/plans/:id", async ({ req, store, params }) => {
    const plan = getPlan(store.db, params.id);
    if (!plan) notFound(req, "Plan not found.");
    return planResource(req, plan);
  });

  route("GET", "/api/faqs", async ({ req, store }) => collectionResponse(
    req,
    "faqs",
    store.db.faqs,
    { itemMapper: (faq) => ({ ...faq, _links: { self: link(req, `/api/faqs#${faq.id}`) } }) },
  ));

  route("POST", "/api/checkout/quote", async ({ req, store, body }) => ({
    quote: buildQuote(store.db, body),
    _links: {
      self: currentLink(req),
      plans: link(req, "/api/plans"),
      pay: link(req, "/api/payments", "POST"),
    },
  }));

  route("POST", "/api/payments", async ({ req, store, body }) => {
    requireFields(body, ["memberId", "planId", "billing", "paymentMethod"]);
    let member = requirePaymentOwner(req, store, body.memberId);
    const plan = getPlan(store.db, body.planId);
    if (!plan) notFound(req, "Plan not found.");
    const quote = buildQuote(store.db, body);
    const trialDays = quote.trialDays || 0;
    if (!trialDays) {
      badRequest("Thanh toán gói trả phí phải được thực hiện qua PayOS hoặc VNPAY.", {
        endpoints: ["/api/payments/payos/create", "/api/payments/vnpay/create"],
      });
    }
    const usedTrial = Boolean(member.trialUsedAt)
      || store.db.payments.some((payment) => payment.memberId === member.id && payment.status === "trial");
    if (usedTrial) conflict("Tài khoản này đã sử dụng gói dùng thử.");

    const now = new Date();
    const payment = {
      id: store.nextId("pay", store.db.payments),
      memberId: member.id,
      invoice: `INV-${now.getFullYear()}-${String(store.db.payments.length + 1).padStart(4, "0")}`,
      planId: plan.id,
      billing: body.billing,
      paymentMethod: body.paymentMethod,
      amount: quote.total,
      currency: "VND",
      status: "trial",
      gateway: "trial",
      createdAt: now.toISOString(),
      paidAt: now.toISOString(),
    };
    activateMembership(store, member, payment, plan, trialDays);
    store.db.payments.unshift(payment);
    member = await persistFinalizedPayment(store, member, payment);

    return {
      payment: paymentResource(req, payment),
      member: memberResource(req, member, store.db),
      quote,
      note: "Card number, CVV and other sensitive payment details are intentionally not stored.",
      _links: {
        self: link(req, `/api/payments/${payment.id}`),
        profile: link(req, `/api/members/${member.id}/profile`),
        dashboard: link(req, `/api/members/${member.id}/dashboard`),
      },
    };
  });

  route("POST", "/api/payments/payos/create", async ({ req, store, body }) => {
    requireFields(body, ["memberId", "planId", "billing"]);
    const member = requirePaymentOwner(req, store, body.memberId);
    const plan = getPlan(store.db, body.planId);
    if (!plan || plan.id === "free") notFound(req, "Paid plan not found.");
    if (store.dataSource === "sqlserver") {
      serviceUnavailable("PayOS checkout currently requires the Supabase or JSON data source.");
    }

    const quote = buildQuote(store.db, { ...body, trialDays: 0 });
    if (!Number.isSafeInteger(quote.total) || quote.total <= 0) badRequest("Số tiền thanh toán không hợp lệ.");
    const config = getPayosConfig();
    const orderCode = createPayosOrderCode();
    const now = new Date();
    let providerResult;
    try {
      providerResult = await createPayosPaymentLink({
        config,
        orderCode,
        amount: quote.total,
        itemName: `Goi ${plan.name} ${body.billing === "annual" ? "nam" : "thang"}`,
        now,
      });
    } catch (error) {
      console.error("PayOS create payment link failed:", error?.name || "PayOSError", error?.status || "");
      serviceUnavailable("Không thể tạo liên kết thanh toán PayOS lúc này. Vui lòng thử lại sau.");
    }

    const paymentLink = providerResult.paymentLink;
    if (!paymentLink?.checkoutUrl || String(paymentLink.orderCode) !== String(orderCode)) {
      serviceUnavailable("PayOS trả về liên kết thanh toán không hợp lệ.");
    }
    const payment = {
      id: store.nextId("pay", store.db.payments),
      memberId: member.id,
      invoice: `INV-${now.getFullYear()}-${String(store.db.payments.length + 1).padStart(4, "0")}`,
      planId: plan.id,
      billing: body.billing,
      paymentMethod: "payos",
      gateway: "payos",
      transactionRef: String(orderCode),
      payosOrderCode: orderCode,
      payosPaymentLinkId: paymentLink.paymentLinkId || null,
      providerTransactionNo: paymentLink.paymentLinkId || null,
      amount: quote.total,
      currency: "VND",
      status: "pending",
      transactionStatus: paymentLink.status || "PENDING",
      createdAt: now.toISOString(),
      expiresAt: providerResult.expiresAt,
      paidAt: null,
    };
    store.db.payments.unshift(payment);
    await store.save();

    return {
      payment: paymentResource(req, payment),
      quote,
      paymentUrl: paymentLink.checkoutUrl,
      qrCode: paymentLink.qrCode || null,
      expiresAt: providerResult.expiresAt,
      _links: {
        status: link(req, `/api/payments/payos/status/${orderCode}`),
        webhook: link(req, "/api/payments/payos/webhook", "POST"),
      },
    };
  });

  route("POST", "/api/payments/payos/webhook", async ({ store, body }) => {
    let providerData;
    try {
      providerData = await verifyPayosWebhook(body, getPayosConfig());
    } catch (error) {
      console.warn("Rejected invalid PayOS webhook:", error?.name || "InvalidSignatureError");
      badRequest("Webhook PayOS không hợp lệ.");
    }

    const orderCode = String(providerData.orderCode || "");
    const payment = store.db.payments.find(
      (item) => item.gateway === "payos" && String(item.transactionRef) === orderCode,
    );
    // PayOS sends a signed sample payload while registering the webhook.
    if (!payment) return { success: true, message: "Webhook received." };
    if (providerData.code !== "00") return { success: true, message: "No successful payment to process." };

    await finalizePayosPayment(store, payment, providerData);
    return { success: true, message: "Payment confirmed." };
  });

  route("GET", "/api/payments/payos/status/:orderCode", async ({ req, store, params }) => {
    const { member: sessionMember } = requireSession(req, store);
    const payment = store.db.payments.find(
      (item) => item.gateway === "payos" && String(item.transactionRef) === String(params.orderCode),
    );
    if (!payment) notFound(req, "Payment not found.");
    if (payment.memberId !== sessionMember.id && sessionMember.role?.toLowerCase() !== "admin") {
      forbidden("Bạn không được xem giao dịch này.");
    }

    if (payment.status === "pending") {
      try {
        const providerPayment = await getPayosPaymentLink(Number(payment.transactionRef), getPayosConfig());
        if (providerPayment.status === "PAID") {
          await finalizePayosPayment(store, payment, providerPayment);
        } else if (["CANCELLED", "EXPIRED", "FAILED"].includes(providerPayment.status)) {
          await failPayosPayment(store, payment, providerPayment.status);
        }
      } catch (error) {
        console.warn("PayOS status reconciliation skipped:", error?.name || "PayOSError", error?.status || "");
      }
    }

    return {
      transactionRef: payment.transactionRef,
      paymentStatus: payment.status,
      payment: paymentResource(req, payment),
      member: payment.status === "paid" ? memberResource(req, getMember(store.db, payment.memberId), store.db) : null,
      _links: { self: currentLink(req), profile: link(req, `/api/members/${payment.memberId}/profile`) },
    };
  });

  route("POST", "/api/payments/vnpay/create", async ({ req, store, body }) => {
    requireFields(body, ["memberId", "planId", "billing"]);
    const member = requirePaymentOwner(req, store, body.memberId);
    const plan = getPlan(store.db, body.planId);
    if (!plan || plan.id === "free") notFound(req, "Paid plan not found.");
    if (store.dataSource === "sqlserver") {
      serviceUnavailable("VNPAY checkout currently requires the Supabase or JSON data source.");
    }

    const quote = buildQuote(store.db, { ...body, trialDays: 0 });
    const config = getVnpayConfig();
    const transactionRef = createVnpayTxnRef();
    const bankCode = normalizeVnpayBankCode(body.bankCode);
    const now = new Date();
    const payment = {
      id: store.nextId("pay", store.db.payments),
      memberId: member.id,
      invoice: `INV-${now.getFullYear()}-${String(store.db.payments.length + 1).padStart(4, "0")}`,
      planId: plan.id,
      billing: body.billing,
      paymentMethod: "vnpay",
      gateway: "vnpay",
      transactionRef,
      amount: quote.total,
      currency: "VND",
      status: "pending",
      bankCode: bankCode || null,
      createdAt: now.toISOString(),
      paidAt: null,
    };
    const { paymentUrl, expiresAt } = buildVnpayPaymentUrl({
      config,
      amount: payment.amount,
      transactionRef,
      orderInfo: `Thanh toan goi ${plan.name} hoa don ${payment.invoice}`,
      ipAddress: getClientIp(req),
      bankCode,
      now,
    });
    payment.expiresAt = expiresAt;
    store.db.payments.unshift(payment);
    await store.save();

    return {
      payment: paymentResource(req, payment),
      quote,
      paymentUrl,
      expiresAt,
      _links: {
        status: link(req, `/api/payments/vnpay/status/${transactionRef}`),
        ipn: link(req, "/api/payments/vnpay/ipn"),
        return: link(req, "/api/payments/vnpay/return"),
      },
    };
  });

  route("GET", "/api/payments/vnpay/ipn", async ({ req, store, url }) => {
    try {
      const config = getVnpayConfig();
      const verification = verifyVnpaySignature(url.searchParams, config);
      if (!verification.valid || verification.params.vnp_TmnCode !== config.tmnCode) {
        return { RspCode: "97", Message: "Invalid signature" };
      }

      const transactionRef = verification.params.vnp_TxnRef;
      const payment = store.db.payments.find((item) => item.transactionRef === transactionRef);
      if (!payment) return { RspCode: "01", Message: "Order not found" };

      const receivedAmount = Number(verification.params.vnp_Amount);
      if (!Number.isSafeInteger(receivedAmount) || receivedAmount !== payment.amount * 100) {
        return { RspCode: "04", Message: "Invalid amount" };
      }
      if (payment.status !== "pending") {
        return { RspCode: "02", Message: "Order already confirmed" };
      }

      const now = new Date().toISOString();
      const succeeded = verification.params.vnp_ResponseCode === "00"
        && verification.params.vnp_TransactionStatus === "00";
      payment.status = succeeded ? "paid" : "failed";
      payment.paidAt = succeeded ? now : null;
      payment.failedAt = succeeded ? null : now;
      payment.providerTransactionNo = verification.params.vnp_TransactionNo || null;
      payment.bankCode = verification.params.vnp_BankCode || payment.bankCode || null;
      payment.cardType = verification.params.vnp_CardType || null;
      payment.responseCode = verification.params.vnp_ResponseCode || null;
      payment.transactionStatus = verification.params.vnp_TransactionStatus || null;
      payment.vnpayPayDate = verification.params.vnp_PayDate || null;

      if (succeeded) {
        const member = getMember(store.db, payment.memberId);
        const plan = getPlan(store.db, payment.planId);
        if (!member || !plan) return { RspCode: "01", Message: "Order data not found" };
        activateMembership(store, member, payment, plan);
      }
      await store.save();
      return { RspCode: "00", Message: "Confirm Success" };
    } catch (error) {
      console.error("VNPAY IPN processing error:", error);
      await store.reload().catch(() => {});
      return { RspCode: "99", Message: "Unknown error" };
    }
  });

  route("GET", "/api/payments/vnpay/return", async ({ req, store, url }) => {
    const { member: sessionMember } = requireSession(req, store);
    const config = getVnpayConfig();
    const verification = verifyVnpaySignature(url.searchParams, config);
    const signatureValid = verification.valid && verification.params.vnp_TmnCode === config.tmnCode;
    const transactionRef = verification.params.vnp_TxnRef || "";
    const payment = signatureValid
      ? store.db.payments.find((item) => item.transactionRef === transactionRef)
      : null;
    if (payment && payment.memberId !== sessionMember.id && sessionMember.role?.toLowerCase() !== "admin") {
      forbidden("Bạn không được xem giao dịch này.");
    }

    return {
      signatureValid,
      transactionRef,
      responseCode: verification.params.vnp_ResponseCode || null,
      transactionStatus: verification.params.vnp_TransactionStatus || null,
      paymentStatus: payment?.status || "not_found",
      payment: payment ? paymentResource(req, payment) : null,
      member: signatureValid && payment?.status === "paid" ? memberResource(req, getMember(store.db, payment.memberId), store.db) : null,
      message: !signatureValid
        ? "Chữ ký phản hồi VNPAY không hợp lệ."
        : payment?.status === "paid"
        ? "Thanh toán thành công và gói thành viên đã được kích hoạt."
        : payment?.status === "pending"
          ? "VNPAY đã chuyển hướng về, hệ thống đang chờ IPN xác nhận."
          : "Giao dịch chưa được xác nhận thành công.",
    };
  });

  route("GET", "/api/payments/vnpay/status/:transactionRef", async ({ req, store, params }) => {
    const { member: sessionMember } = requireSession(req, store);
    const payment = store.db.payments.find((item) => item.transactionRef === params.transactionRef);
    if (!payment) notFound(req, "Payment not found.");
    if (payment.memberId !== sessionMember.id && sessionMember.role?.toLowerCase() !== "admin") {
      forbidden("Bạn không được xem giao dịch này.");
    }
    return {
      transactionRef: payment.transactionRef,
      paymentStatus: payment.status,
      payment: paymentResource(req, payment),
      member: payment.status === "paid" ? memberResource(req, getMember(store.db, payment.memberId), store.db) : null,
      _links: { self: currentLink(req), profile: link(req, `/api/members/${payment.memberId}/profile`) },
    };
  });

  route("GET", "/api/payments/:id", async ({ req, store, params }) => {
    const { member: sessionMember } = requireSession(req, store);
    const payment = store.db.payments.find((item) => item.id === params.id);
    if (!payment) notFound(req, "Payment not found.");
    if (payment.memberId !== sessionMember.id && sessionMember.role?.toLowerCase() !== "admin") {
      forbidden("Bạn không được xem giao dịch này.");
    }
    return paymentResource(req, payment);
  });
}
