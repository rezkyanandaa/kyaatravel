/* LocalStorage helpers for KYAA'S Travel Planner */

const STORAGE_KEY = 'kyaas_travel_planner_v1';

const defaultState = {
  trips: [],
  favorites: [],
  notifications: [],
  settings: {
    theme: 'light',
    currency: 'USD',
    currencySymbol: '$'
  },
  lastOpenedTrip: null
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(defaultState), ...parsed };
  } catch (e) {
    console.warn('Failed to load state', e);
    return structuredClone(defaultState);
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save state', e);
  }
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function exportTrips(state) {
  const data = {
    exportedAt: new Date().toISOString(),
    version: 1,
    trips: state.trips,
    favorites: state.favorites,
    settings: state.settings
  };
  return JSON.stringify(data, null, 2);
}

function importTrips(jsonStr, currentState) {
  const data = JSON.parse(jsonStr);
  if (!data.trips || !Array.isArray(data.trips)) {
    throw new Error('Invalid trip data');
  }
  // Merge: keep existing IDs, add new ones
  const existingIds = new Set(currentState.trips.map(t => t.id));
  const newTrips = data.trips.filter(t => !existingIds.has(t.id));
  currentState.trips = [...currentState.trips, ...newTrips];
  if (data.favorites) {
    currentState.favorites = [...new Set([...currentState.favorites, ...data.favorites])];
  }
  if (data.settings) {
    currentState.settings = { ...currentState.settings, ...data.settings };
  }
  saveState(currentState);
  return currentState;
}

window.KyaaStorage = {
  loadState,
  saveState,
  uid,
  exportTrips,
  importTrips,
  defaultState
};
