import { DATA_VERSION, DATA_VERSION_KEY, SAMPLE_REQUESTS, STORAGE_KEY } from './data.js';

export function loadInitialRequests() {
  try {
    const version = localStorage.getItem(DATA_VERSION_KEY);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (version === DATA_VERSION && Array.isArray(stored) && stored.length) return stored;
  } catch {
    // Fall through to demo data.
  }
  localStorage.setItem(DATA_VERSION_KEY, DATA_VERSION);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_REQUESTS));
  return SAMPLE_REQUESTS;
}

export function saveRequests(requests) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

export function formatDate(value) {
  if (!value) return '–';
  const d = new Date(value.includes('T') ? value : value + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '–';
  return new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatMoney(value) {
  return `THB ${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

export function statusClass(status) {
  if (status === 'Completed') return 's-complete';
  if (status === 'Hold') return 's-hold';
  if (status === 'Cancelled' || status === 'Invalid Request') return 's-cancel';
  if (status === 'New Request' || status === 'Inform Contractor') return 's-open';
  return 's-progress';
}

export function generateWorkCode(reportedDate, requests) {
  const year = new Date((reportedDate || new Date().toISOString().slice(0, 10)) + 'T00:00:00').getFullYear();
  const prefix = `MT-${year}-`;
  const max = requests.reduce((highest, request) => {
    if (!String(request.workCode || '').startsWith(prefix)) return highest;
    const n = Number(String(request.workCode).split('-').pop());
    return Number.isFinite(n) ? Math.max(highest, n) : highest;
  }, 0);
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

export function readFiles(files) {
  return Promise.all([...files].map(file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, type: file.type, size: file.size, data: reader.result });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  })));
}

export function today() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
