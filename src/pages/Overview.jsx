import { CATEGORIES, SPECIAL_STATUSES } from '../data.js';
import { formatMoney } from '../utils.js';

const CATEGORY_COLORS = [
  '#5f93ef',
  '#7fb7e9',
  '#9fb9ef',
  '#9fd8d2',
  '#9fd9ae',
  '#f0c77b',
  '#f0a57f',
  '#ef9fb0'
];

export default function Overview({ requests }) {
  const total = requests.length;
  const completed = requests.filter(
    request => request.status === 'Completed'
  ).length;

  const holdCancelled = requests.filter(request =>
    SPECIAL_STATUSES.includes(request.status)
  ).length;

  const inProgress = total - completed - holdCancelled;

  const categoryCounts = CATEGORIES.map(category => ({
    category,
    count: requests.filter(request => request.category === category).length
  }));

  const maxCategoryCount = Math.max(
    ...categoryCounts.map(item => item.count),
    1
  );

  const donutBackground = buildCategoryGradient(categoryCounts, total);

  const recordedCost = requests.reduce(
    (sum, request) => sum + Number(request.actualCost || 0),
    0
  );

  const requestsWithCost = requests.filter(
    request => Number(request.actualCost || 0) > 0
  ).length;

  const averageCost = requestsWithCost
    ? recordedCost / requestsWithCost
    : 0;

  const monthlyCosts = buildMonthlyCosts(requests);
  const maxMonthlyCost = Math.max(
    ...monthlyCosts.map(item => item.amount),
    0
  );

  return (
    <main className="shell">
      <section className="kpi-grid" aria-label="Maintenance summary">
        <Kpi
          label="Total Requests"
          value={total}
          wash="#edf4ff"
          icon="#2f6fed"
          symbol="▧"
        />
        <Kpi
          label="In Progress"
          value={inProgress}
          wash="#fff3e8"
          icon="#ef7c1b"
          symbol="◷"
        />
        <Kpi
          label="Completed"
          value={completed}
          wash="#eaf8f2"
          icon="#15a36a"
          symbol="✓"
        />
        <Kpi
          label="Hold / Cancelled"
          value={holdCancelled}
          wash="#fff0f3"
          icon="#e22b3e"
          symbol="×"
        />
      </section>

      <section className="analysis-grid">
        <article className="card analysis-card">
          <div className="card-head">
            <h2>Maintenance by Category</h2>
            <span className="data-note">Live DB data</span>
          </div>

          <div className="category-layout">
            <div
              className="donut"
              role="img"
              aria-label="Maintenance category summary"
              style={{ background: donutBackground }}
            >
              <div className="donut-center">
                <strong>{total}</strong>
                <span>Total Requests</span>
              </div>
            </div>

            <div className="category-bars">
              {categoryCounts.map(({ category, count }, index) => (
                <div className="category-bar" key={category}>
                  <span>{category}</span>
                  <span className="bar-track">
                    <i
                      className="bar-fill"
                      style={{
                        '--w': `${(count / maxCategoryCount) * 100}%`,
                        '--c1': CATEGORY_COLORS[index],
                        '--c2': CATEGORY_COLORS[index]
                      }}
                    />
                  </span>
                  <b>{count}</b>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="card analysis-card">
          <div className="card-head">
            <h2>Maintenance by Cost</h2>
            <span className="data-note">Recorded actual cost only</span>
          </div>

          <div className="cost-summary">
            <CostMini
              label="Recorded Cost"
              value={formatMoney(recordedCost)}
              note="Sum of actual cost in tickets"
            />
            <CostMini
              label="Requests With Cost"
              value={requestsWithCost}
              note={`${total - requestsWithCost} request(s) still THB 0`}
            />
            <CostMini
              label="Average Cost"
              value={formatMoney(averageCost)}
              note="Average of requests with recorded cost"
            />
          </div>

          <div className="chart-head">
            <h3>Monthly Recorded Cost</h3>
            <div className="chart-key">
              <span>
                <i className="dot" style={{ background: '#bed0f8' }} />
                Actual Cost
              </span>
            </div>
          </div>

          {maxMonthlyCost > 0 ? (
            <MonthlyCostChart
              monthlyCosts={monthlyCosts}
              maxMonthlyCost={maxMonthlyCost}
            />
          ) : (
            <div className="chart-empty">
              <strong>No cost data yet</strong>
              <span>
                Add Actual Cost to a maintenance request and this chart will
                update automatically.
              </span>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}

function Kpi({ label, value, wash, icon, symbol }) {
  return (
    <article
      className="card kpi"
      style={{ '--wash': wash, '--icon': icon, '--delta': '#1a9b68' }}
    >
      <div className="icon-bubble">{symbol}</div>
      <div>
        <div className="kpi-label">{label}</div>
        <div className="kpi-row">
          <strong className="kpi-value">{value}</strong>
        </div>
        <small>Current data</small>
      </div>
    </article>
  );
}

function CostMini({ label, value, note }) {
  return (
    <div className="cost-mini">
      <div
        className="mini-icon"
        style={{ background: '#edf4ff', color: '#2f6fed' }}
      >
        ฿
      </div>
      <label>{label}</label>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function MonthlyCostChart({ monthlyCosts, maxMonthlyCost }) {
  const axisValues = [
    maxMonthlyCost,
    maxMonthlyCost * 0.75,
    maxMonthlyCost * 0.5,
    maxMonthlyCost * 0.25,
    0
  ];

  const columns = `repeat(${monthlyCosts.length}, 1fr)`;

  return (
    <div className="chart-box" aria-label="Monthly maintenance cost chart">
      <div className="y-axis">
        {axisValues.map((value, index) => (
          <span key={index}>{formatAxisMoney(value)}</span>
        ))}
      </div>

      <div className="gridlines">
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>

      <div className="bars" style={{ gridTemplateColumns: columns }}>
        {monthlyCosts.map(item => (
          <i
            className="bar"
            key={item.month}
            title={`${item.label}: ${formatMoney(item.amount)}`}
            style={{
              '--h': `${Math.max((item.amount / maxMonthlyCost) * 100, 3)}%`
            }}
          />
        ))}
      </div>

      <div className="x-axis" style={{ gridTemplateColumns: columns }}>
        {monthlyCosts.map(item => (
          <span key={item.month}>{item.shortLabel}</span>
        ))}
      </div>
    </div>
  );
}

function buildCategoryGradient(counts, total) {
  if (!total) return '#eef2f8';

  let start = 0;
  const segments = [];

  counts.forEach((item, index) => {
    if (!item.count) return;

    const end = start + (item.count / total) * 100;
    segments.push(
      `${CATEGORY_COLORS[index]} ${start.toFixed(2)}% ${end.toFixed(2)}%`
    );
    start = end;
  });

  return `conic-gradient(${segments.join(', ')})`;
}

function buildMonthlyCosts(requests) {
  const monthlyMap = new Map();

  requests.forEach(request => {
    const month = request.reportedDate?.slice(0, 7);
    if (!month) return;

    const current = monthlyMap.get(month) || 0;
    monthlyMap.set(month, current + Number(request.actualCost || 0));
  });

  return [...monthlyMap.entries()]
    .sort(([monthA], [monthB]) => monthA.localeCompare(monthB))
    .slice(-7)
    .map(([month, amount]) => {
      const date = new Date(`${month}-01T00:00:00`);

      return {
        month,
        amount,
        label: date.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        }),
        shortLabel: date.toLocaleDateString('en-US', {
          month: 'short'
        })
      };
    });
}

function formatAxisMoney(value) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }

  if (value >= 1000) {
    return `${Math.round(value / 1000)}K`;
  }

  return Math.round(value).toString();
}
