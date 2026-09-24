import { CATEGORIES } from '../data.js';
import { formatMoney } from '../utils.js';

const CATEGORY_COLORS = [
  ['#5f93ef','#7fa9f7'], ['#7fb7e9','#9ed1f5'], ['#9fb9ef','#b8c9f3'], ['#9fd8d2','#bce8e3'],
  ['#9fd9ae','#c3efcb'], ['#f0c77b','#f8ddb1'], ['#f0a57f','#f6c6aa'], ['#ef9fb0','#f4c4ce']
];

export default function Overview({ requests }) {
  const total = requests.length;
  const completed = requests.filter(r => r.status === 'Completed').length;
  const holdCancelled = requests.filter(r => ['Hold','Cancelled','Invalid Request'].includes(r.status)).length;
  const inProgress = total - completed - holdCancelled;
  const spent = requests.reduce((sum, r) => sum + Number(r.actualCost || 0), 0);
  const budget = 1200000;
  const remaining = Math.max(budget - spent, 0);
  const counts = CATEGORIES.map(category => ({
    category,
    count: requests.filter(r => r.category === category).length
  }));
  const maxCount = Math.max(...counts.map(x => x.count), 1);

  return (
    <main className="shell">
      <section className="kpi-grid" aria-label="Maintenance summary">
        <Kpi label="Total Requests" value={total} wash="#edf4ff" icon="#2f6fed" symbol="▧" />
        <Kpi label="In Progress" value={inProgress} wash="#fff3e8" icon="#ef7c1b" symbol="◷" />
        <Kpi label="Completed" value={completed} wash="#eaf8f2" icon="#15a36a" symbol="✓" />
        <Kpi label="Hold / Cancelled" value={holdCancelled} wash="#fff0f3" icon="#e22b3e" symbol="×" />
      </section>

      <section className="analysis-grid">
        <article className="card analysis-card">
          <div className="card-head"><h2>Maintenance by Category</h2><select className="select-lite" defaultValue="This Month"><option>This Month</option></select></div>
          <div className="category-layout">
            <div className="donut" role="img" aria-label="Maintenance category summary">
              <div className="donut-center"><strong>{total}</strong><span>Total Requests</span></div>
            </div>
            <div className="category-bars">
              {counts.map(({ category, count }, index) => (
                <div className="category-bar" key={category}>
                  <span>{category}</span>
                  <span className="bar-track">
                    <i className="bar-fill" style={{ '--w': `${(count / maxCount) * 100}%`, '--c1': CATEGORY_COLORS[index][0], '--c2': CATEGORY_COLORS[index][1] }}></i>
                  </span>
                  <b>{count}</b>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="card analysis-card">
          <div className="card-head"><h2>Maintenance by Cost</h2><select className="select-lite" defaultValue="This Year"><option>This Year</option></select></div>
          <div className="cost-summary">
            <CostMini label="Budget" value={formatMoney(budget)} note="Annual maintenance budget" />
            <CostMini label="Spent" value={formatMoney(spent)} note={`${Math.round((spent / budget) * 100)}% of budget`} />
            <CostMini label="Remaining" value={formatMoney(remaining)} note={`${Math.round((remaining / budget) * 100)}% remaining`} />
          </div>
          <div className="chart-head"><h3>Monthly Cost Trend</h3><div className="chart-key"><span><i className="dot" style={{background:'#bed0f8'}}></i>Cost</span><span><i className="line-swatch"></i>Budget</span></div></div>
          <div className="chart-box" aria-label="Monthly maintenance cost chart">
            <div className="y-axis"><span>200K</span><span>150K</span><span>100K</span><span>50K</span><span>0</span></div>
            <div className="gridlines"><i></i><i></i><i></i><i></i><i></i></div>
            <div className="bars"><i className="bar" style={{'--h':'45%'}}></i><i className="bar" style={{'--h':'56%'}}></i><i className="bar" style={{'--h':'68%'}}></i><i className="bar" style={{'--h':'59%'}}></i><i className="bar" style={{'--h':'49%'}}></i><i className="bar" style={{'--h':'39%'}}></i><i className="bar" style={{'--h':'56%'}}></i></div>
            <div className="trend-line"><svg viewBox="0 0 700 180" preserveAspectRatio="none"><polyline points="12,96 124,74 236,42 348,72 460,42 572,70 688,88" fill="none" stroke="#2f6fed" strokeWidth="3"/><g fill="#2f6fed"><circle cx="12" cy="96" r="5"/><circle cx="124" cy="74" r="5"/><circle cx="236" cy="42" r="5"/><circle cx="348" cy="72" r="5"/><circle cx="460" cy="42" r="5"/><circle cx="572" cy="70" r="5"/><circle cx="688" cy="88" r="5"/></g></svg></div>
            <div className="x-axis"><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span></div>
          </div>
        </article>
      </section>
    </main>
  );
}

function Kpi({ label, value, wash, icon, symbol }) {
  return <article className="card kpi" style={{'--wash':wash,'--icon':icon,'--delta':'#1a9b68'}}><div className="icon-bubble">{symbol}</div><div><div className="kpi-label">{label}</div><div className="kpi-row"><strong className="kpi-value">{value}</strong></div><small>Current data</small></div></article>;
}

function CostMini({ label, value, note }) {
  return <div className="cost-mini"><div className="mini-icon" style={{background:'#edf4ff',color:'#2f6fed'}}>฿</div><label>{label}</label><strong>{value}</strong><small>{note}</small></div>;
}
