/* KYAA'S TRAVEL PLANNER — Main Application */

(function () {
  const { loadState, saveState, uid, exportTrips, importTrips } = window.KyaaStorage;
  const {
    EXPLORE_DESTINATIONS,
    PLACE_CATEGORIES,
    BUDGET_CATEGORIES,
    DEFAULT_PACKING,
    ACTIVITY_CATEGORIES,
    MOODS,
    CURRENCIES,
    getRandomCover,
    formatDate,
    formatDateRange,
    daysBetween,
    getCountdown,
    formatMoney,
    getWeatherPreview
  } = window.KyaaData;
  const UI = window.KyaaUI;

  let state = loadState();
  let currentPage = 'dashboard';
  let currentTripId = null;
  let currentTripTab = 'overview';
  let dragSrcEl = null;

  // ---------- Helpers ----------
  function persist() {
    saveState(state);
  }

  function addNotification(message) {
    state.notifications.push({ id: uid(), message, at: new Date().toISOString() });
    if (state.notifications.length > 30) state.notifications.shift();
    persist();
    UI.updateNotifBadge(state.notifications.length);
    UI.renderNotifs(state.notifications);
  }

  function getTrip(id) {
    return state.trips.find(t => t.id === id);
  }

  function getUpcomingTrip() {
    const today = new Date().toISOString().slice(0, 10);
    const future = state.trips
      .filter(t => t.startDate && t.startDate >= today)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
    return future[0] || state.trips.sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))[0] || null;
  }

  function currency() {
    return state.settings.currencySymbol || '$';
  }

  // ---------- Navigation ----------
  function navigate(page, tripId = null, tab = 'overview') {
    currentPage = page;
    currentTripId = tripId;
    currentTripTab = tab;
    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page || (page === 'trip' && el.dataset.page === 'trips'));
    });
    document.getElementById('sidebar').classList.remove('open');
    render();
  }

  // ---------- Render ----------
  function render() {
    const content = document.getElementById('content');
    content.style.opacity = '0';
    setTimeout(() => {
      if (currentPage === 'dashboard') content.innerHTML = renderDashboard();
      else if (currentPage === 'trips') content.innerHTML = renderTripsList();
      else if (currentPage === 'trip') content.innerHTML = renderTripDetail();
      else if (currentPage === 'explore') content.innerHTML = renderExplore();
      else if (currentPage === 'favorites') content.innerHTML = renderFavorites();
      else content.innerHTML = renderDashboard();
      content.style.opacity = '1';
      bindPageEvents();
    }, 120);
  }

  // ========== DASHBOARD ==========
  function renderDashboard() {
    const upcoming = getUpcomingTrip();
    const countdown = upcoming ? getCountdown(upcoming.startDate) : null;
    const weather = upcoming ? getWeatherPreview(upcoming.destination) : null;
    const totalTrips = state.trips.length;
    const totalPlaces = state.trips.reduce((s, t) => s + (t.places?.length || 0), 0);
    const packedPct = upcoming?.packing?.length
      ? Math.round((upcoming.packing.filter(p => p.checked).length / upcoming.packing.length) * 100)
      : 0;

    let heroHTML = '';
    if (upcoming) {
      heroHTML = `
        <div class="upcoming-hero" data-trip="${upcoming.id}">
          <img src="${upcoming.coverImage || getRandomCover()}" alt="${upcoming.name}" loading="lazy" />
          <div class="overlay"></div>
          <div class="hero-content">
            <span class="hero-badge">✈️ Upcoming trip</span>
            <h2>${upcoming.name}</h2>
            <div class="hero-meta">
              <span>📍 ${upcoming.destination || 'Somewhere special'}</span>
              <span>📅 ${formatDateRange(upcoming.startDate, upcoming.endDate)}</span>
            </div>
            ${
              countdown && !countdown.past
                ? `<div class="countdown">
                    <div class="countdown-unit"><span class="num">${countdown.days}</span><span class="label">Days</span></div>
                    <div class="countdown-unit"><span class="num">${countdown.hours}</span><span class="label">Hrs</span></div>
                    <div class="countdown-unit"><span class="num">${countdown.mins}</span><span class="label">Min</span></div>
                  </div>`
                : countdown?.past
                ? `<p style="opacity:0.9">Trip is ongoing or just finished ✨</p>`
                : ''
            }
          </div>
        </div>`;
    } else {
      heroHTML = `
        <div class="empty-state card" style="min-height:280px;display:flex;flex-direction:column;align-items:center;justify-content:center;">
          <span class="emoji">🗺️</span>
          <h3>Nothing booked yet. Let’s change that.</h3>
          <p>Your next adventure starts here. Create your first trip and start planning.</p>
          <button class="btn btn-primary" id="dashNewTrip">+ Plan a trip</button>
        </div>`;
    }

    const recent = [...state.trips].sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '')).slice(0, 6);

    return `
      <div class="greeting">
        <h1>Where are we going next? ✈️</h1>
        <p class="microcopy">Let’s plan something unforgettable.</p>
      </div>

      <div class="dashboard-grid">
        <div>
          ${heroHTML}
          <div class="stats-row">
            <div class="stat-card">
              <div class="value">${totalTrips}</div>
              <div class="label">Trips planned</div>
            </div>
            <div class="stat-card">
              <div class="value">${totalPlaces}</div>
              <div class="label">Places saved</div>
            </div>
            <div class="stat-card">
              <div class="value">${state.favorites.length}</div>
              <div class="label">Favorites</div>
            </div>
          </div>
        </div>

        <div class="side-stack">
          ${
            weather
              ? `<div class="card weather-card">
                  <div class="weather-icon">${weather.icon}</div>
                  <div class="weather-info">
                    <h3>${upcoming.destination}</h3>
                    <p>${weather.temp} · ${weather.desc}</p>
                  </div>
                </div>`
              : ''
          }

          ${
            upcoming
              ? `<div class="card progress-ring-wrap">
                  <div class="progress-ring">
                    <svg width="72" height="72" viewBox="0 0 72 72">
                      <circle class="bg" cx="36" cy="36" r="30" />
                      <circle class="fg" cx="36" cy="36" r="30"
                        stroke-dasharray="${2 * Math.PI * 30}"
                        stroke-dashoffset="${2 * Math.PI * 30 * (1 - packedPct / 100)}" />
                    </svg>
                    <div class="pct">${packedPct}%</div>
                  </div>
                  <div>
                    <h3 style="font-size:1rem;font-weight:600">Packing progress</h3>
                    <p style="font-size:0.85rem;color:var(--text-muted)">Keep packing those bags 🎒</p>
                  </div>
                </div>`
              : ''
          }

          <div class="card card-padding">
            <div class="section-title" style="margin-bottom:0.85rem">Quick actions</div>
            <div class="quick-actions">
              <button class="quick-btn" data-action="new-trip"><span>🗺️</span>New trip</button>
              <button class="quick-btn" data-action="explore"><span>🌎</span>Explore</button>
              <button class="quick-btn" data-action="export"><span>📤</span>Export</button>
              <button class="quick-btn" data-action="import"><span>📥</span>Import</button>
            </div>
          </div>
        </div>
      </div>

      <div class="recent-trips">
        <div class="flex-between mb-2">
          <h3 class="section-title" style="margin:0">Recently planned</h3>
          <button class="btn btn-ghost btn-sm" data-action="all-trips">View all</button>
        </div>
        ${
          recent.length
            ? `<div class="trips-scroll">
                ${recent
                  .map(
                    t => `
                  <div class="trip-mini" data-trip="${t.id}">
                    <img src="${t.coverImage || getRandomCover()}" alt="${t.name}" loading="lazy" />
                    <div class="info">
                      <h4>${t.name}</h4>
                      <p>${t.destination || '—'} · ${formatDateRange(t.startDate, t.endDate)}</p>
                    </div>
                  </div>`
                  )
                  .join('')}
              </div>`
            : `<p class="microcopy">No trips yet. Pack your bags, we’re going somewhere.</p>`
        }
      </div>
    `;
  }

  // ========== TRIPS LIST ==========
  function renderTripsList() {
    const trips = [...state.trips].sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));

    return `
      <div class="trips-header">
        <div>
          <h1 class="page-title">My Trips</h1>
          <p class="page-subtitle">All your adventures in one place.</p>
        </div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" id="exportBtn">Export JSON</button>
          <button class="btn btn-secondary btn-sm" id="importBtn">Import</button>
          <button class="btn btn-primary" id="listNewTrip">+ New Trip</button>
        </div>
      </div>

      ${
        trips.length
          ? `<div class="trips-grid">
              ${trips
                .map(t => {
                  const isFav = state.favorites.includes(t.id);
                  return `
                  <div class="trip-card" data-trip="${t.id}">
                    <div class="cover">
                      <img src="${t.coverImage || getRandomCover()}" alt="${t.name}" loading="lazy" />
                      <button class="fav ${isFav ? 'active' : ''}" data-fav="${t.id}" title="Favorite">${isFav ? '❤️' : '🤍'}</button>
                    </div>
                    <div class="body">
                      <h3>${t.name}</h3>
                      <div class="dest">📍 ${t.destination || 'Somewhere'}</div>
                      <div class="dates">${formatDateRange(t.startDate, t.endDate)} · ${daysBetween(t.startDate, t.endDate) || '?'} days</div>
                    </div>
                  </div>`;
                })
                .join('')}
            </div>`
          : `<div class="empty-state">
              <span class="emoji">✈️</span>
              <h3>No trips yet</h3>
              <p>Pack your bags, we’re going somewhere. Create your first trip and start the adventure.</p>
              <button class="btn btn-primary" id="emptyNewTrip">+ Create trip</button>
            </div>`
      }
    `;
  }

  // ========== TRIP DETAIL ==========
  function renderTripDetail() {
    const trip = getTrip(currentTripId);
    if (!trip) {
      return `<div class="empty-state"><h3>Trip not found</h3><button class="btn btn-primary" data-action="all-trips">Back to trips</button></div>`;
    }

    const tabs = [
      { id: 'overview', label: 'Overview' },
      { id: 'itinerary', label: 'Itinerary' },
      { id: 'places', label: 'Places' },
      { id: 'budget', label: 'Budget' },
      { id: 'packing', label: 'Packing' },
      { id: 'journal', label: 'Journal' }
    ];

    let panel = '';
    if (currentTripTab === 'overview') panel = renderOverview(trip);
    else if (currentTripTab === 'itinerary') panel = renderItinerary(trip);
    else if (currentTripTab === 'places') panel = renderPlaces(trip);
    else if (currentTripTab === 'budget') panel = renderBudget(trip);
    else if (currentTripTab === 'packing') panel = renderPacking(trip);
    else if (currentTripTab === 'journal') panel = renderJournal(trip);

    return `
      <button class="btn btn-ghost btn-sm mb-2" data-action="all-trips">← Back to trips</button>
      <div class="trip-detail-header">
        <img src="${trip.coverImage || getRandomCover()}" alt="${trip.name}" />
        <div class="overlay"></div>
        <div class="header-content">
          <h1>${trip.name}</h1>
          <div class="hero-meta">
            <span>📍 ${trip.destination || '—'}</span>
            <span>📅 ${formatDateRange(trip.startDate, trip.endDate)}</span>
            ${trip.companions ? `<span>👥 ${trip.companions}</span>` : ''}
          </div>
        </div>
      </div>

      <div class="trip-tabs">
        ${tabs.map(t => `<button class="trip-tab ${currentTripTab === t.id ? 'active' : ''}" data-tab="${t.id}">${t.label}</button>`).join('')}
      </div>

      <div class="tab-panel">${panel}</div>
    `;
  }

  function renderOverview(trip) {
    const countdown = getCountdown(trip.startDate);
    const weather = getWeatherPreview(trip.destination);
    const spent = (trip.expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const budget = Number(trip.budget) || 0;
    const remaining = budget - spent;
    const packed = trip.packing || [];
    const packedPct = packed.length ? Math.round((packed.filter(p => p.checked).length / packed.length) * 100) : 0;

    return `
      <div class="dashboard-grid">
        <div class="card card-padding">
          <h3 class="section-title">About this trip</h3>
          <p style="color:var(--text-soft);margin-bottom:1rem">${trip.description || 'No description yet. Add a little story about this adventure.'}</p>
          <div style="display:flex;flex-wrap:wrap;gap:1rem;font-size:0.9rem;color:var(--text-muted)">
            <span>🗓️ ${daysBetween(trip.startDate, trip.endDate) || '?'} days</span>
            <span>📍 ${(trip.places || []).length} places</span>
            <span>📝 ${(trip.journal || []).length} journal entries</span>
          </div>
          ${
            countdown && !countdown.past
              ? `<div class="mt-2"><strong>Countdown:</strong> ${countdown.days}d ${countdown.hours}h left</div>`
              : ''
          }
        </div>
        <div class="side-stack">
          <div class="card weather-card">
            <div class="weather-icon">${weather.icon}</div>
            <div class="weather-info">
              <h3>Weather preview</h3>
              <p>${weather.temp} · ${weather.desc}</p>
            </div>
          </div>
          <div class="card card-padding">
            <div class="section-title">Budget snapshot</div>
            <p style="font-size:1.4rem;font-weight:700;color:var(--accent)">${formatMoney(remaining, currency())} left</p>
            <p style="font-size:0.85rem;color:var(--text-muted)">of ${formatMoney(budget, currency())} · spent ${formatMoney(spent, currency())}</p>
          </div>
          <div class="card card-padding">
            <div class="section-title">Packing</div>
            <p style="font-size:1.4rem;font-weight:700;color:var(--accent)">${packedPct}%</p>
            <p style="font-size:0.85rem;color:var(--text-muted)">${packed.filter(p => p.checked).length}/${packed.length} items packed</p>
          </div>
        </div>
      </div>
      <div class="mt-2 flex-between">
        <button class="btn btn-secondary btn-sm" id="editTripBtn">Edit trip details</button>
        <button class="btn btn-secondary btn-sm" id="printItineraryBtn">🖨️ Print itinerary</button>
        <button class="btn btn-danger btn-sm" id="deleteTripBtn">Delete trip</button>
      </div>
    `;
  }

  // ========== ITINERARY ==========
  function renderItinerary(trip) {
    const days = getTripDays(trip);
    const activities = trip.itinerary || [];

    if (!days.length) {
      return `
        <div class="empty-state">
          <span class="emoji">📅</span>
          <h3>Set your dates first</h3>
          <p>Add start & end dates to build a day-by-day itinerary.</p>
          <button class="btn btn-primary" id="editTripBtn">Edit dates</button>
        </div>`;
    }

    return `
      <div class="flex-between mb-2">
        <p class="microcopy">Drag cards to reorder · Click to edit</p>
        <button class="btn btn-primary btn-sm" id="addActivityBtn">+ Add activity</button>
      </div>
      ${days
        .map((day, idx) => {
          const dayActs = activities
            .filter(a => a.day === idx)
            .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
          return `
          <div class="itinerary-day" data-day="${idx}">
            <div class="itinerary-day-header">
              <h3>Day ${idx + 1} · ${formatDate(day)}</h3>
              <button class="btn btn-ghost btn-sm add-day-act" data-day="${idx}">+ Add</button>
            </div>
            <div class="timeline" data-day="${idx}">
              ${
                dayActs.length
                  ? dayActs
                      .map(a => {
                        const cat = ACTIVITY_CATEGORIES.find(c => c.id === a.category) || ACTIVITY_CATEGORIES[6];
                        return `
                      <div class="timeline-item" draggable="true" data-id="${a.id}">
                        <div class="timeline-dot"></div>
                        <div class="timeline-card" data-id="${a.id}">
                          <div class="time">${a.time || '—:—'} ${cat.emoji}</div>
                          <div class="title">${a.title}</div>
                          <div class="meta">
                            ${a.location ? `<span>📍 ${a.location}</span>` : ''}
                            <span class="cat-pill">${cat.label}</span>
                          </div>
                          ${a.notes ? `<p style="font-size:0.85rem;color:var(--text-muted);margin-top:0.4rem">${a.notes}</p>` : ''}
                          <div class="actions">
                            <button class="btn btn-ghost btn-sm edit-act" data-id="${a.id}">Edit</button>
                            <button class="btn btn-danger btn-sm del-act" data-id="${a.id}">Delete</button>
                          </div>
                        </div>
                      </div>`;
                      })
                      .join('')
                  : `<p style="color:var(--text-muted);font-size:0.9rem;padding:0.5rem 0">No activities yet. Add something fun.</p>`
              }
            </div>
          </div>`;
        })
        .join('')}
    `;
  }

  function getTripDays(trip) {
    if (!trip.startDate || !trip.endDate) return [];
    const days = [];
    const start = new Date(trip.startDate + 'T00:00:00');
    const end = new Date(trip.endDate + 'T00:00:00');
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  }

  // ========== PLACES ==========
  function renderPlaces(trip) {
    const places = trip.places || [];
    return `
      <div class="flex-between mb-2">
        <p class="microcopy">${places.length} place${places.length !== 1 ? 's' : ''} saved</p>
        <button class="btn btn-primary btn-sm" id="addPlaceBtn">+ Add place</button>
      </div>
      ${
        places.length
          ? `<div class="places-grid">
              ${places
                .map(p => {
                  const cat = PLACE_CATEGORIES.find(c => c.id === p.category) || PLACE_CATEGORIES[0];
                  return `
                  <div class="place-card">
                    <div class="img-wrap">
                      <img src="${p.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80'}" alt="${p.name}" loading="lazy" />
                      <button class="fav-btn toggle-place-fav" data-id="${p.id}">${p.favorite ? '❤️' : '🤍'}</button>
                    </div>
                    <div class="body">
                      <h4>${cat.emoji} ${p.name}</h4>
                      <div class="loc">${p.location || '—'}</div>
                      <div class="rating">${'★'.repeat(Math.round(p.rating || 0))}${'☆'.repeat(5 - Math.round(p.rating || 0))} ${p.rating || 0}</div>
                      ${p.notes ? `<p style="font-size:0.8rem;color:var(--text-muted);margin-top:0.4rem">${p.notes}</p>` : ''}
                      <div style="margin-top:0.6rem;display:flex;gap:0.35rem">
                        <button class="btn btn-ghost btn-sm edit-place" data-id="${p.id}">Edit</button>
                        <button class="btn btn-danger btn-sm del-place" data-id="${p.id}">Delete</button>
                      </div>
                    </div>
                  </div>`;
                })
                .join('')}
            </div>`
          : `<div class="empty-state">
              <span class="emoji">📍</span>
              <h3>No places yet</h3>
              <p>Start collecting spots you want to visit — cafés, photo spots, hidden gems.</p>
              <button class="btn btn-primary" id="addPlaceBtnEmpty">+ Add place</button>
            </div>`
      }
    `;
  }

  // ========== BUDGET ==========
  function renderBudget(trip) {
    const expenses = trip.expenses || [];
    const budget = Number(trip.budget) || 0;
    const spent = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const remaining = budget - spent;
    const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

    // Chart by category
    const byCat = {};
    BUDGET_CATEGORIES.forEach(c => (byCat[c.id] = 0));
    expenses.forEach(e => {
      byCat[e.category] = (byCat[e.category] || 0) + (Number(e.amount) || 0);
    });
    const maxCat = Math.max(...Object.values(byCat), 1);

    return `
      <div class="flex-between mb-2">
        <div>
          <label style="font-size:0.85rem;color:var(--text-muted)">Currency </label>
          <select id="currencySelect" style="padding:0.35rem 0.6rem;border-radius:8px;border:1px solid var(--border);background:var(--card);color:var(--text)">
            ${CURRENCIES.map(c => `<option value="${c.code}" ${state.settings.currency === c.code ? 'selected' : ''}>${c.symbol} ${c.code}</option>`).join('')}
          </select>
        </div>
        <div style="display:flex;gap:0.5rem">
          <button class="btn btn-secondary btn-sm" id="setBudgetBtn">Set budget</button>
          <button class="btn btn-primary btn-sm" id="addExpenseBtn">+ Add expense</button>
        </div>
      </div>

      <div class="budget-summary">
        <div class="budget-stat total">
          <div class="label">Total budget</div>
          <div class="value">${formatMoney(budget, currency())}</div>
        </div>
        <div class="budget-stat spent">
          <div class="label">Spent</div>
          <div class="value">${formatMoney(spent, currency())}</div>
        </div>
        <div class="budget-stat remaining">
          <div class="label">Remaining</div>
          <div class="value">${formatMoney(remaining, currency())}</div>
        </div>
      </div>

      <div class="budget-progress">
        <div class="budget-progress-bar" style="width:${pct}%"></div>
      </div>
      <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:1.25rem;text-align:center">${pct}% of budget used</p>

      <div class="chart-wrap">
        <div class="section-title">By category</div>
        <div class="chart-bars">
          ${BUDGET_CATEGORIES.map(c => {
            const val = byCat[c.id] || 0;
            const h = Math.max(4, (val / maxCat) * 100);
            return `
              <div class="chart-bar-group">
                <div class="chart-bar" style="height:${h}%" title="${formatMoney(val, currency())}"></div>
                <div class="chart-bar-label">${c.emoji}<br>${c.label}</div>
              </div>`;
          }).join('')}
        </div>
      </div>

      <div class="section-title">Expense history</div>
      ${
        expenses.length
          ? `<div class="expense-list">
              ${expenses
                .slice()
                .reverse()
                .map(e => {
                  const cat = BUDGET_CATEGORIES.find(c => c.id === e.category) || BUDGET_CATEGORIES[5];
                  return `
                  <div class="expense-item">
                    <div class="expense-icon">${cat.emoji}</div>
                    <div class="expense-info">
                      <h4>${e.title}</h4>
                      <p>${cat.label} · ${e.date ? formatDate(e.date) : '—'}</p>
                    </div>
                    <div class="expense-amount">${formatMoney(e.amount, currency())}</div>
                    <button class="btn btn-ghost btn-sm del-expense" data-id="${e.id}" style="margin-left:0.5rem">✕</button>
                  </div>`;
                })
                .join('')}
            </div>`
          : `<p class="microcopy">No expenses yet. Track every coffee and ticket.</p>`
      }
    `;
  }

  // ========== PACKING ==========
  function renderPacking(trip) {
    const packing = trip.packing || [];
    const checked = packing.filter(p => p.checked).length;
    const pct = packing.length ? Math.round((checked / packing.length) * 100) : 0;

    return `
      <div class="packing-progress">
        <div class="progress-ring">
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle class="bg" cx="36" cy="36" r="30" />
            <circle class="fg" cx="36" cy="36" r="30"
              stroke-dasharray="${2 * Math.PI * 30}"
              stroke-dashoffset="${2 * Math.PI * 30 * (1 - pct / 100)}" />
          </svg>
          <div class="pct">${pct}%</div>
        </div>
        <div>
          <h3 style="font-weight:600">${checked} of ${packing.length} packed</h3>
          <p style="font-size:0.85rem;color:var(--text-muted)">You’re almost ready to go 🎒</p>
        </div>
        <button class="btn btn-primary btn-sm" id="addPackItem" style="margin-left:auto">+ Add item</button>
      </div>

      <div class="packing-list">
        ${
          packing.length
            ? packing
                .map(
                  p => `
              <div class="pack-item ${p.checked ? 'checked' : ''}" data-id="${p.id}">
                <div class="pack-check">${p.checked ? '✓' : ''}</div>
                <span class="pack-label">${p.label}</span>
                <button class="pack-delete" data-id="${p.id}">✕</button>
              </div>`
                )
                .join('')
            : `<div class="empty-state"><span class="emoji">🎒</span><h3>Empty packing list</h3><p>Add the essentials so you don’t forget anything.</p></div>`
        }
      </div>
      ${packing.length === 0 ? `<button class="btn btn-secondary btn-sm mt-2" id="loadDefaultPack">Load suggested items</button>` : ''}
    `;
  }

  // ========== JOURNAL ==========
  function renderJournal(trip) {
    const entries = (trip.journal || []).slice().reverse();
    return `
      <div class="flex-between mb-2">
        <p class="microcopy">Your travel scrapbook</p>
        <button class="btn btn-primary btn-sm" id="addJournalBtn">+ New entry</button>
      </div>
      ${
        entries.length
          ? `<div class="journal-timeline">
              ${entries
                .map(
                  e => `
                <div class="journal-entry">
                  <div class="photo">
                    <img src="${e.image || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80'}" alt="" loading="lazy" />
                  </div>
                  <div class="content">
                    <div class="date">${e.date ? formatDate(e.date) : '—'}</div>
                    <div class="loc">📍 ${e.location || 'Somewhere'}</div>
                    <div class="story">${e.story || ''}</div>
                    <span class="mood">${e.mood || '😊'}</span>
                    <div style="margin-top:0.5rem">
                      <button class="btn btn-ghost btn-sm edit-journal" data-id="${e.id}">Edit</button>
                      <button class="btn btn-danger btn-sm del-journal" data-id="${e.id}">Delete</button>
                    </div>
                  </div>
                </div>`
                )
                .join('')}
            </div>`
          : `<div class="empty-state">
              <span class="emoji">📸</span>
              <h3>No journal entries yet</h3>
              <p>Capture the little moments — the views, the meals, the feelings.</p>
              <button class="btn btn-primary" id="addJournalBtnEmpty">+ Write first entry</button>
            </div>`
      }
    `;
  }

  // ========== EXPLORE ==========
  function renderExplore() {
    return `
      <h1 class="page-title">Explore</h1>
      <p class="page-subtitle">Find your next obsession. Big visuals, bigger dreams.</p>
      <div class="explore-grid">
        ${EXPLORE_DESTINATIONS.map(
          d => `
          <div class="explore-card" data-dest="${d.name}">
            <img src="${d.image}" alt="${d.name}" loading="lazy" />
            <div class="overlay">
              <h3>${d.mood} ${d.name}</h3>
              <p>${d.tagline} · ${d.country}</p>
            </div>
          </div>`
        ).join('')}
      </div>
    `;
  }

  // ========== FAVORITES ==========
  function renderFavorites() {
    const favTrips = state.trips.filter(t => state.favorites.includes(t.id));
    return `
      <h1 class="page-title">Favorites</h1>
      <p class="page-subtitle">Trips you’ve hearted.</p>
      ${
        favTrips.length
          ? `<div class="trips-grid">
              ${favTrips
                .map(
                  t => `
                <div class="trip-card" data-trip="${t.id}">
                  <div class="cover">
                    <img src="${t.coverImage || getRandomCover()}" alt="${t.name}" loading="lazy" />
                    <button class="fav active" data-fav="${t.id}">❤️</button>
                  </div>
                  <div class="body">
                    <h3>${t.name}</h3>
                    <div class="dest">📍 ${t.destination || '—'}</div>
                    <div class="dates">${formatDateRange(t.startDate, t.endDate)}</div>
                  </div>
                </div>`
                )
                .join('')}
            </div>`
          : `<div class="empty-state">
              <span class="emoji">❤️</span>
              <h3>No favorites yet</h3>
              <p>Heart the trips you love and they’ll show up here.</p>
            </div>`
      }
    `;
  }

  // ========== MODALS ==========
  function openNewTripModal(prefill = {}) {
    UI.openModal({
      title: 'New trip',
      bodyHTML: `
        <div class="form-group">
          <label>Trip name</label>
          <input type="text" id="fName" placeholder="e.g. Tokyo spring escape" value="${prefill.name || ''}" />
        </div>
        <div class="form-group">
          <label>Destination</label>
          <input type="text" id="fDest" placeholder="City or country" value="${prefill.destination || ''}" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Start date</label>
            <input type="date" id="fStart" value="${prefill.startDate || ''}" />
          </div>
          <div class="form-group">
            <label>End date</label>
            <input type="date" id="fEnd" value="${prefill.endDate || ''}" />
          </div>
        </div>
        <div class="form-group">
          <label>Cover image URL</label>
          <input type="url" id="fCover" placeholder="Paste Unsplash or any image URL" value="${prefill.coverImage || ''}" />
        </div>
        <div class="form-group">
          <label>Travel companions</label>
          <input type="text" id="fCompanions" placeholder="Solo, friends, family…" value="${prefill.companions || ''}" />
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea id="fDesc" placeholder="A little vibe check for this trip…">${prefill.description || ''}</textarea>
        </div>
      `,
      footerHTML: `
        <button class="btn btn-secondary" id="modalCancel">Cancel</button>
        <button class="btn btn-primary" id="modalSaveTrip">Create trip</button>
      `,
      onOpen() {
        document.getElementById('modalCancel').onclick = () => UI.closeModal();
        document.getElementById('modalSaveTrip').onclick = () => {
          const name = document.getElementById('fName').value.trim();
          if (!name) {
            UI.showToast('Give your trip a name', 'error');
            return;
          }
          const trip = {
            id: uid(),
            name,
            destination: document.getElementById('fDest').value.trim(),
            startDate: document.getElementById('fStart').value,
            endDate: document.getElementById('fEnd').value,
            coverImage: document.getElementById('fCover').value.trim() || getRandomCover(),
            companions: document.getElementById('fCompanions').value.trim(),
            description: document.getElementById('fDesc').value.trim(),
            budget: 0,
            itinerary: [],
            places: [],
            expenses: [],
            packing: DEFAULT_PACKING.map(label => ({ id: uid(), label, checked: false })),
            journal: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          state.trips.push(trip);
          persist();
          UI.closeModal();
          UI.showToast('Trip created. Let’s plan something unforgettable.', 'success');
          addNotification(`New trip created: ${trip.name}`);
          navigate('trip', trip.id, 'overview');
        };
      }
    });
  }

  function openEditTripModal(trip) {
    UI.openModal({
      title: 'Edit trip',
      bodyHTML: `
        <div class="form-group">
          <label>Trip name</label>
          <input type="text" id="fName" value="${trip.name || ''}" />
        </div>
        <div class="form-group">
          <label>Destination</label>
          <input type="text" id="fDest" value="${trip.destination || ''}" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Start date</label>
            <input type="date" id="fStart" value="${trip.startDate || ''}" />
          </div>
          <div class="form-group">
            <label>End date</label>
            <input type="date" id="fEnd" value="${trip.endDate || ''}" />
          </div>
        </div>
        <div class="form-group">
          <label>Cover image URL</label>
          <input type="url" id="fCover" value="${trip.coverImage || ''}" />
        </div>
        <div class="form-group">
          <label>Travel companions</label>
          <input type="text" id="fCompanions" value="${trip.companions || ''}" />
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea id="fDesc">${trip.description || ''}</textarea>
        </div>
      `,
      footerHTML: `
        <button class="btn btn-secondary" id="modalCancel">Cancel</button>
        <button class="btn btn-primary" id="modalSaveTrip">Save changes</button>
      `,
      onOpen() {
        document.getElementById('modalCancel').onclick = () => UI.closeModal();
        document.getElementById('modalSaveTrip').onclick = () => {
          trip.name = document.getElementById('fName').value.trim() || trip.name;
          trip.destination = document.getElementById('fDest').value.trim();
          trip.startDate = document.getElementById('fStart').value;
          trip.endDate = document.getElementById('fEnd').value;
          trip.coverImage = document.getElementById('fCover').value.trim() || trip.coverImage;
          trip.companions = document.getElementById('fCompanions').value.trim();
          trip.description = document.getElementById('fDesc').value.trim();
          trip.updatedAt = new Date().toISOString();
          persist();
          UI.closeModal();
          UI.showToast('Trip updated', 'success');
          render();
        };
      }
    });
  }

  function openActivityModal(trip, activity = null, dayIndex = 0) {
    const isEdit = !!activity;
    const a = activity || { day: dayIndex, time: '09:00', title: '', location: '', notes: '', category: 'other' };
    UI.openModal({
      title: isEdit ? 'Edit activity' : 'Add activity',
      bodyHTML: `
        <div class="form-row">
          <div class="form-group">
            <label>Day</label>
            <select id="fDay">
              ${getTripDays(trip)
                .map((d, i) => `<option value="${i}" ${a.day === i ? 'selected' : ''}>Day ${i + 1} · ${formatDate(d)}</option>`)
                .join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Time</label>
            <input type="time" id="fTime" value="${a.time || '09:00'}" />
          </div>
        </div>
        <div class="form-group">
          <label>Activity</label>
          <input type="text" id="fTitle" placeholder="e.g. Breakfast at café" value="${a.title || ''}" />
        </div>
        <div class="form-group">
          <label>Location</label>
          <input type="text" id="fLoc" placeholder="Optional" value="${a.location || ''}" />
        </div>
        <div class="form-group">
          <label>Category</label>
          <select id="fCat">
            ${ACTIVITY_CATEGORIES.map(c => `<option value="${c.id}" ${a.category === c.id ? 'selected' : ''}>${c.emoji} ${c.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Notes</label>
          <textarea id="fNotes" placeholder="Optional notes">${a.notes || ''}</textarea>
        </div>
      `,
      footerHTML: `
        <button class="btn btn-secondary" id="modalCancel">Cancel</button>
        <button class="btn btn-primary" id="modalSaveAct">${isEdit ? 'Save' : 'Add'}</button>
      `,
      onOpen() {
        document.getElementById('modalCancel').onclick = () => UI.closeModal();
        document.getElementById('modalSaveAct').onclick = () => {
          const title = document.getElementById('fTitle').value.trim();
          if (!title) {
            UI.showToast('Add an activity title', 'error');
            return;
          }
          if (!trip.itinerary) trip.itinerary = [];
          if (isEdit) {
            activity.day = Number(document.getElementById('fDay').value);
            activity.time = document.getElementById('fTime').value;
            activity.title = title;
            activity.location = document.getElementById('fLoc').value.trim();
            activity.category = document.getElementById('fCat').value;
            activity.notes = document.getElementById('fNotes').value.trim();
          } else {
            trip.itinerary.push({
              id: uid(),
              day: Number(document.getElementById('fDay').value),
              time: document.getElementById('fTime').value,
              title,
              location: document.getElementById('fLoc').value.trim(),
              category: document.getElementById('fCat').value,
              notes: document.getElementById('fNotes').value.trim()
            });
          }
          trip.updatedAt = new Date().toISOString();
          persist();
          UI.closeModal();
          UI.showToast(isEdit ? 'Activity updated' : 'Activity added', 'success');
          render();
        };
      }
    });
  }

  function openPlaceModal(trip, place = null) {
    const isEdit = !!place;
    const p = place || { name: '', location: '', category: 'cafe', rating: 4, notes: '', image: '', favorite: false };
    UI.openModal({
      title: isEdit ? 'Edit place' : 'Add place',
      bodyHTML: `
        <div class="form-group">
          <label>Name</label>
          <input type="text" id="fName" value="${p.name || ''}" placeholder="Place name" />
        </div>
        <div class="form-group">
          <label>Location</label>
          <input type="text" id="fLoc" value="${p.location || ''}" placeholder="Address or area" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Category</label>
            <select id="fCat">
              ${PLACE_CATEGORIES.map(c => `<option value="${c.id}" ${p.category === c.id ? 'selected' : ''}>${c.emoji} ${c.label}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Rating (1–5)</label>
            <input type="number" id="fRating" min="1" max="5" step="0.5" value="${p.rating || 4}" />
          </div>
        </div>
        <div class="form-group">
          <label>Image URL</label>
          <input type="url" id="fImg" value="${p.image || ''}" placeholder="Optional photo URL" />
        </div>
        <div class="form-group">
          <label>Notes</label>
          <textarea id="fNotes">${p.notes || ''}</textarea>
        </div>
      `,
      footerHTML: `
        <button class="btn btn-secondary" id="modalCancel">Cancel</button>
        <button class="btn btn-primary" id="modalSavePlace">${isEdit ? 'Save' : 'Add'}</button>
      `,
      onOpen() {
        document.getElementById('modalCancel').onclick = () => UI.closeModal();
        document.getElementById('modalSavePlace').onclick = () => {
          const name = document.getElementById('fName').value.trim();
          if (!name) {
            UI.showToast('Name is required', 'error');
            return;
          }
          if (!trip.places) trip.places = [];
          if (isEdit) {
            place.name = name;
            place.location = document.getElementById('fLoc').value.trim();
            place.category = document.getElementById('fCat').value;
            place.rating = Number(document.getElementById('fRating').value) || 0;
            place.image = document.getElementById('fImg').value.trim();
            place.notes = document.getElementById('fNotes').value.trim();
          } else {
            trip.places.push({
              id: uid(),
              name,
              location: document.getElementById('fLoc').value.trim(),
              category: document.getElementById('fCat').value,
              rating: Number(document.getElementById('fRating').value) || 0,
              image: document.getElementById('fImg').value.trim() || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80',
              notes: document.getElementById('fNotes').value.trim(),
              favorite: false
            });
          }
          trip.updatedAt = new Date().toISOString();
          persist();
          UI.closeModal();
          UI.showToast(isEdit ? 'Place updated' : 'Place added', 'success');
          render();
        };
      }
    });
  }

  function openExpenseModal(trip) {
    UI.openModal({
      title: 'Add expense',
      bodyHTML: `
        <div class="form-group">
          <label>Title</label>
          <input type="text" id="fTitle" placeholder="e.g. Flight tickets" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Amount</label>
            <input type="number" id="fAmount" min="0" step="0.01" placeholder="0" />
          </div>
          <div class="form-group">
            <label>Category</label>
            <select id="fCat">
              ${BUDGET_CATEGORIES.map(c => `<option value="${c.id}">${c.emoji} ${c.label}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Date</label>
          <input type="date" id="fDate" value="${new Date().toISOString().slice(0, 10)}" />
        </div>
      `,
      footerHTML: `
        <button class="btn btn-secondary" id="modalCancel">Cancel</button>
        <button class="btn btn-primary" id="modalSaveExp">Add</button>
      `,
      onOpen() {
        document.getElementById('modalCancel').onclick = () => UI.closeModal();
        document.getElementById('modalSaveExp').onclick = () => {
          const title = document.getElementById('fTitle').value.trim();
          const amount = Number(document.getElementById('fAmount').value);
          if (!title || isNaN(amount)) {
            UI.showToast('Title and amount required', 'error');
            return;
          }
          if (!trip.expenses) trip.expenses = [];
          trip.expenses.push({
            id: uid(),
            title,
            amount,
            category: document.getElementById('fCat').value,
            date: document.getElementById('fDate').value
          });
          trip.updatedAt = new Date().toISOString();
          persist();
          UI.closeModal();
          UI.showToast('Expense added', 'success');
          render();
        };
      }
    });
  }

  function openBudgetModal(trip) {
    UI.openModal({
      title: 'Set total budget',
      bodyHTML: `
        <div class="form-group">
          <label>Total budget (${currency()})</label>
          <input type="number" id="fBudget" min="0" step="1" value="${trip.budget || 0}" />
        </div>
      `,
      footerHTML: `
        <button class="btn btn-secondary" id="modalCancel">Cancel</button>
        <button class="btn btn-primary" id="modalSaveBudget">Save</button>
      `,
      onOpen() {
        document.getElementById('modalCancel').onclick = () => UI.closeModal();
        document.getElementById('modalSaveBudget').onclick = () => {
          trip.budget = Number(document.getElementById('fBudget').value) || 0;
          trip.updatedAt = new Date().toISOString();
          persist();
          UI.closeModal();
          UI.showToast('Budget updated', 'success');
          render();
        };
      }
    });
  }

  function openPackModal(trip) {
    UI.openModal({
      title: 'Add packing item',
      bodyHTML: `
        <div class="form-group">
          <label>Item</label>
          <input type="text" id="fItem" placeholder="e.g. Passport" />
        </div>
      `,
      footerHTML: `
        <button class="btn btn-secondary" id="modalCancel">Cancel</button>
        <button class="btn btn-primary" id="modalSavePack">Add</button>
      `,
      onOpen() {
        document.getElementById('modalCancel').onclick = () => UI.closeModal();
        document.getElementById('modalSavePack').onclick = () => {
          const label = document.getElementById('fItem').value.trim();
          if (!label) return;
          if (!trip.packing) trip.packing = [];
          trip.packing.push({ id: uid(), label, checked: false });
          trip.updatedAt = new Date().toISOString();
          persist();
          UI.closeModal();
          UI.showToast('Item added', 'success');
          render();
        };
      }
    });
  }

  function openJournalModal(trip, entry = null) {
    const isEdit = !!entry;
    const e = entry || { date: new Date().toISOString().slice(0, 10), location: '', story: '', mood: '😊', image: '' };
    UI.openModal({
      title: isEdit ? 'Edit entry' : 'New journal entry',
      bodyHTML: `
        <div class="form-row">
          <div class="form-group">
            <label>Date</label>
            <input type="date" id="fDate" value="${e.date || ''}" />
          </div>
          <div class="form-group">
            <label>Mood</label>
            <select id="fMood">
              ${MOODS.map(m => `<option value="${m}" ${e.mood === m ? 'selected' : ''}>${m}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Location</label>
          <input type="text" id="fLoc" value="${e.location || ''}" placeholder="Where were you?" />
        </div>
        <div class="form-group">
          <label>Photo URL</label>
          <input type="url" id="fImg" value="${e.image || ''}" placeholder="Optional image URL" />
        </div>
        <div class="form-group">
          <label>Story</label>
          <textarea id="fStory" placeholder="What happened? How did it feel?">${e.story || ''}</textarea>
        </div>
      `,
      footerHTML: `
        <button class="btn btn-secondary" id="modalCancel">Cancel</button>
        <button class="btn btn-primary" id="modalSaveJournal">${isEdit ? 'Save' : 'Add'}</button>
      `,
      onOpen() {
        document.getElementById('modalCancel').onclick = () => UI.closeModal();
        document.getElementById('modalSaveJournal').onclick = () => {
          const story = document.getElementById('fStory').value.trim();
          if (!story) {
            UI.showToast('Write a short story', 'error');
            return;
          }
          if (!trip.journal) trip.journal = [];
          if (isEdit) {
            entry.date = document.getElementById('fDate').value;
            entry.location = document.getElementById('fLoc').value.trim();
            entry.mood = document.getElementById('fMood').value;
            entry.image = document.getElementById('fImg').value.trim();
            entry.story = story;
          } else {
            trip.journal.push({
              id: uid(),
              date: document.getElementById('fDate').value,
              location: document.getElementById('fLoc').value.trim(),
              mood: document.getElementById('fMood').value,
              image: document.getElementById('fImg').value.trim() || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80',
              story
            });
          }
          trip.updatedAt = new Date().toISOString();
          persist();
          UI.closeModal();
          UI.showToast(isEdit ? 'Entry updated' : 'Memory saved', 'success');
          render();
        };
      }
    });
  }

  // ---------- Drag & drop itinerary ----------
  function setupDragDrop(trip) {
    const items = document.querySelectorAll('.timeline-item[draggable]');
    items.forEach(item => {
      item.addEventListener('dragstart', e => {
        dragSrcEl = item;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        dragSrcEl = null;
      });
      item.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });
      item.addEventListener('drop', e => {
        e.preventDefault();
        if (!dragSrcEl || dragSrcEl === item) return;
        const srcId = dragSrcEl.dataset.id;
        const targetId = item.dataset.id;
        const day = Number(item.closest('.timeline').dataset.day);
        const acts = (trip.itinerary || []).filter(a => a.day === day);
        const srcIdx = acts.findIndex(a => a.id === srcId);
        const tgtIdx = acts.findIndex(a => a.id === targetId);
        if (srcIdx < 0 || tgtIdx < 0) return;
        // Reorder within day by swapping time order conceptually via array reorder
        const all = trip.itinerary;
        const srcAct = all.find(a => a.id === srcId);
        const tgtAct = all.find(a => a.id === targetId);
        if (!srcAct || !tgtAct) return;
        // Simple: swap times so visual order changes after sort
        const tmpTime = srcAct.time;
        srcAct.time = tgtAct.time;
        tgtAct.time = tmpTime;
        // Also move day if different (shouldn't happen within same timeline)
        srcAct.day = day;
        persist();
        render();
      });
    });
  }

  // ---------- Event binding ----------
  function bindPageEvents() {
    // Dashboard
    document.getElementById('dashNewTrip')?.addEventListener('click', () => openNewTripModal());
    document.querySelectorAll('.quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'new-trip') openNewTripModal();
        else if (action === 'explore') navigate('explore');
        else if (action === 'all-trips') navigate('trips');
        else if (action === 'export') doExport();
        else if (action === 'import') doImport();
      });
    });
    document.querySelectorAll('[data-action="all-trips"]').forEach(el =>
      el.addEventListener('click', () => navigate('trips'))
    );
    document.querySelectorAll('.upcoming-hero[data-trip], .trip-mini[data-trip], .trip-card[data-trip]').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.closest('[data-fav]')) return;
        navigate('trip', el.dataset.trip, 'overview');
      });
    });

    // Favorites toggle
    document.querySelectorAll('[data-fav]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = btn.dataset.fav;
        const idx = state.favorites.indexOf(id);
        if (idx >= 0) state.favorites.splice(idx, 1);
        else state.favorites.push(id);
        persist();
        UI.showToast(idx >= 0 ? 'Removed from favorites' : 'Added to favorites', 'success');
        render();
      });
    });

    // Trips list buttons
    document.getElementById('listNewTrip')?.addEventListener('click', () => openNewTripModal());
    document.getElementById('emptyNewTrip')?.addEventListener('click', () => openNewTripModal());
    document.getElementById('exportBtn')?.addEventListener('click', doExport);
    document.getElementById('importBtn')?.addEventListener('click', doImport);

    // Trip detail tabs
    document.querySelectorAll('.trip-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        currentTripTab = tab.dataset.tab;
        render();
      });
    });

    const trip = currentTripId ? getTrip(currentTripId) : null;
    if (trip) {
      document.getElementById('editTripBtn')?.addEventListener('click', () => openEditTripModal(trip));
      document.getElementById('deleteTripBtn')?.addEventListener('click', () => {
        if (confirm('Delete this trip permanently?')) {
          state.trips = state.trips.filter(t => t.id !== trip.id);
          state.favorites = state.favorites.filter(id => id !== trip.id);
          persist();
          UI.showToast('Trip deleted', 'info');
          navigate('trips');
        }
      });
      document.getElementById('printItineraryBtn')?.addEventListener('click', () => window.print());

      // Itinerary
      document.getElementById('addActivityBtn')?.addEventListener('click', () => openActivityModal(trip));
      document.querySelectorAll('.add-day-act').forEach(btn =>
        btn.addEventListener('click', () => openActivityModal(trip, null, Number(btn.dataset.day)))
      );
      document.querySelectorAll('.edit-act').forEach(btn => {
        btn.addEventListener('click', () => {
          const act = (trip.itinerary || []).find(a => a.id === btn.dataset.id);
          if (act) openActivityModal(trip, act);
        });
      });
      document.querySelectorAll('.del-act').forEach(btn => {
        btn.addEventListener('click', () => {
          trip.itinerary = (trip.itinerary || []).filter(a => a.id !== btn.dataset.id);
          persist();
          UI.showToast('Activity removed', 'info');
          render();
        });
      });
      setupDragDrop(trip);

      // Places
      document.getElementById('addPlaceBtn')?.addEventListener('click', () => openPlaceModal(trip));
      document.getElementById('addPlaceBtnEmpty')?.addEventListener('click', () => openPlaceModal(trip));
      document.querySelectorAll('.edit-place').forEach(btn => {
        btn.addEventListener('click', () => {
          const p = (trip.places || []).find(x => x.id === btn.dataset.id);
          if (p) openPlaceModal(trip, p);
        });
      });
      document.querySelectorAll('.del-place').forEach(btn => {
        btn.addEventListener('click', () => {
          trip.places = (trip.places || []).filter(p => p.id !== btn.dataset.id);
          persist();
          UI.showToast('Place removed', 'info');
          render();
        });
      });
      document.querySelectorAll('.toggle-place-fav').forEach(btn => {
        btn.addEventListener('click', () => {
          const p = (trip.places || []).find(x => x.id === btn.dataset.id);
          if (p) {
            p.favorite = !p.favorite;
            persist();
            render();
          }
        });
      });

      // Budget
      document.getElementById('addExpenseBtn')?.addEventListener('click', () => openExpenseModal(trip));
      document.getElementById('setBudgetBtn')?.addEventListener('click', () => openBudgetModal(trip));
      document.getElementById('currencySelect')?.addEventListener('change', e => {
        const cur = CURRENCIES.find(c => c.code === e.target.value);
        if (cur) {
          state.settings.currency = cur.code;
          state.settings.currencySymbol = cur.symbol;
          persist();
          render();
        }
      });
      document.querySelectorAll('.del-expense').forEach(btn => {
        btn.addEventListener('click', () => {
          trip.expenses = (trip.expenses || []).filter(e => e.id !== btn.dataset.id);
          persist();
          UI.showToast('Expense removed', 'info');
          render();
        });
      });

      // Packing
      document.getElementById('addPackItem')?.addEventListener('click', () => openPackModal(trip));
      document.getElementById('loadDefaultPack')?.addEventListener('click', () => {
        trip.packing = DEFAULT_PACKING.map(label => ({ id: uid(), label, checked: false }));
        persist();
        render();
      });
      document.querySelectorAll('.pack-item').forEach(item => {
        item.addEventListener('click', e => {
          if (e.target.classList.contains('pack-delete')) return;
          const p = (trip.packing || []).find(x => x.id === item.dataset.id);
          if (p) {
            p.checked = !p.checked;
            persist();
            render();
          }
        });
      });
      document.querySelectorAll('.pack-delete').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          trip.packing = (trip.packing || []).filter(p => p.id !== btn.dataset.id);
          persist();
          render();
        });
      });

      // Journal
      document.getElementById('addJournalBtn')?.addEventListener('click', () => openJournalModal(trip));
      document.getElementById('addJournalBtnEmpty')?.addEventListener('click', () => openJournalModal(trip));
      document.querySelectorAll('.edit-journal').forEach(btn => {
        btn.addEventListener('click', () => {
          const entry = (trip.journal || []).find(j => j.id === btn.dataset.id);
          if (entry) openJournalModal(trip, entry);
        });
      });
      document.querySelectorAll('.del-journal').forEach(btn => {
        btn.addEventListener('click', () => {
          trip.journal = (trip.journal || []).filter(j => j.id !== btn.dataset.id);
          persist();
          UI.showToast('Entry deleted', 'info');
          render();
        });
      });
    }

    // Explore → create trip with destination
    document.querySelectorAll('.explore-card').forEach(card => {
      card.addEventListener('click', () => {
        const dest = card.dataset.dest;
        const destData = EXPLORE_DESTINATIONS.find(d => d.name === dest);
        openNewTripModal({
          name: `${dest} trip`,
          destination: dest,
          coverImage: destData?.image || getRandomCover()
        });
      });
    });
  }

  function doExport() {
    const json = exportTrips(state);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kyaas-trips-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    UI.showToast('Trips exported', 'success');
  }

  function doImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        state = importTrips(text, state);
        UI.showToast('Import successful', 'success');
        addNotification('Trips imported from file');
        render();
      } catch (err) {
        UI.showToast('Import failed: invalid file', 'error');
      }
    };
    input.click();
  }

  // ---------- Global UI bindings ----------
  function initGlobal() {
    // Nav
    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(item => {
      item.addEventListener('click', () => navigate(item.dataset.page));
    });

    document.getElementById('menuBtn')?.addEventListener('click', () => {
      document.getElementById('sidebar').classList.add('open');
    });
    document.getElementById('sidebarClose')?.addEventListener('click', () => {
      document.getElementById('sidebar').classList.remove('open');
    });

    document.getElementById('newTripBtn')?.addEventListener('click', () => openNewTripModal());

    // Theme
    UI.applyTheme(state.settings.theme);
    document.getElementById('themeToggle')?.addEventListener('click', () => {
      state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
      persist();
      UI.applyTheme(state.settings.theme);
    });

    // Modal close
    document.getElementById('modalClose')?.addEventListener('click', () => UI.closeModal());
    document.getElementById('modalOverlay')?.addEventListener('click', e => {
      if (e.target.id === 'modalOverlay') UI.closeModal();
    });

    // Notifications
    UI.updateNotifBadge(state.notifications.length);
    UI.renderNotifs(state.notifications);
    document.getElementById('notifBtn')?.addEventListener('click', () => {
      const panel = document.getElementById('notifPanel');
      panel.hidden = !panel.hidden;
    });
    document.getElementById('clearNotifs')?.addEventListener('click', () => {
      state.notifications = [];
      persist();
      UI.updateNotifBadge(0);
      UI.renderNotifs([]);
    });

    // Search (simple filter on trips page)
    document.getElementById('globalSearch')?.addEventListener('input', e => {
      const q = e.target.value.toLowerCase().trim();
      if (currentPage !== 'trips' && currentPage !== 'dashboard') return;
      // Simple: re-render with filter feel — for demo just toast
      if (q.length > 2) {
        const matches = state.trips.filter(
          t =>
            t.name.toLowerCase().includes(q) ||
            (t.destination || '').toLowerCase().includes(q)
        );
        if (matches.length === 1) {
          // soft hint
        }
      }
    });

    // Keyboard
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        UI.closeModal();
        document.getElementById('notifPanel').hidden = true;
      }
    });
  }

  // Boot
  initGlobal();
  render();

  // Sample data if empty (first visit)
  if (state.trips.length === 0) {
    // Optional: leave empty for clean first experience
  }
})();
