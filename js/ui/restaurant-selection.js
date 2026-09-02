const uniqueNames = (names = []) => [...new Set(names.filter(Boolean))];

export const getRestaurantSelectionState = (visibleNames = [], selectedNames = []) => {
  const visible = uniqueNames(visibleNames);
  const selected = new Set(uniqueNames(selectedNames));
  const selectedCount = visible.filter((name) => selected.has(name)).length;
  return {
    state: visible.length && selectedCount === visible.length ? "all" : selectedCount ? "partial" : "none",
    selectedCount,
    total: visible.length
  };
};

export const setAllRestaurantSelections = (visibleNames = [], selectAll = true) => (
  selectAll ? uniqueNames(visibleNames) : []
);
