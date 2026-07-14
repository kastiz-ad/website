export const paymentsEnabled = false;

export const commerceReadiness = Object.freeze({
  businessRegistrationComplete: false,
  paymentProcessorConnected: false,
  refundOperationsReady: false,
  legalReviewComplete: false
});

export const canAcceptPayments = () => paymentsEnabled && Object.values(commerceReadiness).every(Boolean);
