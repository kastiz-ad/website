import { unavailableProviderResult } from "./provider-result.js";

const SENSITIVE_PAYMENT_PATTERN = /(cardNumber|card_number|cvv|cvc|bankPassword|bank_password|otp|password|residentRegistration|fullCard)/i;

export class PaymentProvider {
  constructor({ providerId = "payment-provider", label = "Payment provider", apiBase = "/api/v1" } = {}) {
    this.providerId = providerId;
    this.label = label;
    this.providerType = "payment";
    this.apiBase = apiBase;
  }

  rejectRawPaymentCredentials(request = {}) {
    if (SENSITIVE_PAYMENT_PATTERN.test(JSON.stringify(request))) {
      return {
        ok: false,
        error: {
          code: "sensitive_payment_field_rejected",
          message: "Raw card, bank, password, OTP, or identity credentials must stay inside the trusted provider surface."
        }
      };
    }
    return { ok: true };
  }

  async preparePayment(request = {}) {
    void request;
    return unavailableProviderResult(this.providerId, "preparePayment");
  }

  async confirmPayment(request = {}) {
    void request;
    return unavailableProviderResult(this.providerId, "confirmPayment");
  }
}

export class TossTestPaymentProvider extends PaymentProvider {
  constructor(options = {}) {
    super({ providerId: "toss-payments-test", label: "Toss Payments test", ...options });
  }

  async preparePayment(request = {}) {
    const safe = this.rejectRawPaymentCredentials(request);
    if (!safe.ok) return safe;
    const response = await fetch(`${this.apiBase}/payments/toss/test/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    });
    return response.json();
  }

  async confirmPayment(request = {}) {
    const safe = this.rejectRawPaymentCredentials(request);
    if (!safe.ok) return safe;
    const response = await fetch(`${this.apiBase}/payments/toss/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    });
    return response.json();
  }
}
