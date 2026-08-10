export const INVESTOR_VISIBILITY = Object.freeze({
  showOnHomepage: false,
  routeEnabled: true,
  routePath: "/investor"
});

const normalizedPath = (locationLike = {}) => String(locationLike.pathname || "/").replace(/\/+$/, "") || "/";

export function isDedicatedInvestorRoute(locationLike = {}) {
  return INVESTOR_VISIBILITY.routeEnabled && normalizedPath(locationLike) === INVESTOR_VISIBILITY.routePath;
}

export function shouldShowInvestorPanel(locationLike = {}) {
  return INVESTOR_VISIBILITY.showOnHomepage || isDedicatedInvestorRoute(locationLike);
}