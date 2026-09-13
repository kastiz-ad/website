const finiteRange = (range) => range && Number.isFinite(Number(range.min)) && Number.isFinite(Number(range.max));
const multiplyRange = (range, factor) => ({
  currency: range.currency,
  min: Math.round(Number(range.min) * factor),
  max: Math.round(Number(range.max) * factor)
});

export const buildTransportCostBreakdown = ({ airportTransferOneWay, localTransitPerPersonDay, travelerCount = 1, durationDays = 1 } = {}) => {
  if (!finiteRange(airportTransferOneWay) || !finiteRange(localTransitPerPersonDay)) return { available: false, reason: "destination_fare_unavailable" };
  if (airportTransferOneWay.currency !== localTransitPerPersonDay.currency) return { available: false, reason: "currency_mismatch" };
  const travelers = Math.max(1, Math.trunc(Number(travelerCount) || 1));
  const days = Math.max(1, Math.trunc(Number(durationDays) || 1));
  const airportTransferRoundTrip = multiplyRange(airportTransferOneWay, 2);
  const localTransitTripTotal = multiplyRange(localTransitPerPersonDay, travelers * days);
  return {
    available: true,
    currency: airportTransferOneWay.currency,
    airportTransferOneWay: { ...airportTransferOneWay },
    airportTransferRoundTrip,
    localTransitPerPersonDay: { ...localTransitPerPersonDay },
    localTransitTripTotal,
    tripTotal: {
      currency: airportTransferOneWay.currency,
      min: airportTransferRoundTrip.min + localTransitTripTotal.min,
      max: airportTransferRoundTrip.max + localTransitTripTotal.max
    }
  };
};
