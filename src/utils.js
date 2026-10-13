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

export function today() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
