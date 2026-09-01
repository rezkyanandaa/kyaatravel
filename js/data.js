/* Sample data & constants */

const EXPLORE_DESTINATIONS = [
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    tagline: 'Neon nights & quiet temples',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
    mood: '🏙️'
  },
  {
    id: 'seoul',
    name: 'Seoul',
    country: 'South Korea',
    tagline: 'K-culture capital',
    image: 'https://images.unsplash.com/photo-1517154426307-4ac2d309c702?w=800&q=80',
    mood: '✨'
  },
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    tagline: 'City of light & café mornings',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
    mood: '🥐'
  },
  {
    id: 'bali',
    name: 'Bali',
    country: 'Indonesia',
    tagline: 'Island of the gods',
    image: 'https://images.unsplash.com/photo-1537996194471-e6677233ea1a?w=800&q=80',
    mood: '🌴'
  },
  {
    id: 'singapore',
    name: 'Singapore',
    country: 'Singapore',
    tagline: 'Garden city dreams',
    image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80',
    mood: '🌿'
  },
  {
    id: 'newyork',
    name: 'New York',
    country: 'USA',
    tagline: 'The city that never sleeps',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80',
    mood: '🗽'
  },
  {
    id: 'kyoto',
    name: 'Kyoto',
    country: 'Japan',
    tagline: 'Timeless temples & tea',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
    mood: '⛩️'
  },
  {
    id: 'santorini',
    name: 'Santorini',
    country: 'Greece',
    tagline: 'Blue domes & sunset cliffs',
    image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800&q=80',
    mood: '🌅'
  }
];

const PLACE_CATEGORIES = [
  { id: 'cafe', label: 'Cafe', emoji: '☕' },
  { id: 'food', label: 'Food', emoji: '🍜' },
  { id: 'culture', label: 'Culture', emoji: '🏛️' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { id: 'nature', label: 'Nature', emoji: '🌿' },
  { id: 'photo', label: 'Photo Spot', emoji: '📸' }
];

const BUDGET_CATEGORIES = [
  { id: 'transport', label: 'Transport', emoji: '✈️' },
  { id: 'hotel', label: 'Hotel', emoji: '🏨' },
  { id: 'food', label: 'Food', emoji: '🍜' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { id: 'tickets', label: 'Tickets', emoji: '🎟️' },
  { id: 'others', label: 'Others', emoji: '✨' }
];

const DEFAULT_PACKING = [
  'Passport',
  'Charger',
  'Camera',
  'Clothes',
  'Toiletries',
  'Medicine',
  'Travel documents',
  'Headphones',
  'Power bank',
  'Sunglasses'
];

const ACTIVITY_CATEGORIES = [
  { id: 'food', label: 'Food', emoji: '🍜' },
  { id: 'culture', label: 'Culture', emoji: '🏛️' },
  { id: 'nature', label: 'Nature', emoji: '🌿' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { id: 'relax', label: 'Relax', emoji: '☕' },
  { id: 'photo', label: 'Photo', emoji: '📸' },
  { id: 'other', label: 'Other', emoji: '✨' }
];

const MOODS = ['😊', '🤩', '😌', '🥰', '😎', '🥺', '💪', '🎉'];

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'KRW', symbol: '₩', name: 'Korean Won' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' }
];

const COVER_IMAGES = [
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80',
  'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&q=80',
  'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800&q=80',
  'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=800&q=80'
];

function getRandomCover() {
  return COVER_IMAGES[Math.floor(Math.random() * COVER_IMAGES.length)];
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateRange(start, end) {
  if (!start) return 'Dates TBD';
  if (!end) return formatDate(start);
  return `${formatDate(start)} – ${formatDate(end)}`;
}

function daysBetween(start, end) {
  if (!start || !end) return 0;
  const a = new Date(start + 'T00:00:00');
  const b = new Date(end + 'T00:00:00');
  return Math.max(0, Math.round((b - a) / (1000 * 60 * 60 * 24)) + 1);
}

function getCountdown(startDate) {
  if (!startDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(startDate + 'T00:00:00');
  const diff = start - now;
  if (diff < 0) return { past: true, days: 0, hours: 0, mins: 0 };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { past: false, days, hours, mins };
}

function formatMoney(amount, symbol = '$') {
  const n = Number(amount) || 0;
  if (symbol === 'Rp') {
    return symbol + ' ' + n.toLocaleString('id-ID');
  }
  return symbol + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function getWeatherPreview(destination) {
  // Simulated weather based on destination hash
  const weathers = [
    { icon: '☀️', temp: '28°', desc: 'Sunny & warm' },
    { icon: '🌤️', temp: '24°', desc: 'Partly cloudy' },
    { icon: '🌧️', temp: '19°', desc: 'Light rain' },
    { icon: '❄️', temp: '5°', desc: 'Chilly' },
    { icon: '🌴', temp: '31°', desc: 'Tropical heat' }
  ];
  let hash = 0;
  const str = (destination || 'default').toLowerCase();
  for (let i = 0; i < str.length; i++) hash = (hash + str.charCodeAt(i) * (i + 1)) % weathers.length;
  return weathers[hash];
}

window.KyaaData = {
  EXPLORE_DESTINATIONS,
  PLACE_CATEGORIES,
  BUDGET_CATEGORIES,
  DEFAULT_PACKING,
  ACTIVITY_CATEGORIES,
  MOODS,
  CURRENCIES,
  COVER_IMAGES,
  getRandomCover,
  formatDate,
  formatDateRange,
  daysBetween,
  getCountdown,
  formatMoney,
  getWeatherPreview
};
