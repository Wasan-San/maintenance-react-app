import { useState } from 'react';
import { ALL_STATUSES, CATEGORIES, CONTRACTORS, NORMAL_STATUSES } from '../data.js';
import { formatDate, formatDateTime, formatMoney, readFiles, statusClass } from '../utils.js';

export default function Database({ requests, onUpdateRequest, showToast }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [contractor, setContractor] = useState('');
  const [month, setMonth] = useState('');
  const [selectedCode, setSelectedCode] = useState(null);
  const [draft, setDraft] = useState(null);
  const [snapshot, setSnapshot] = useState('');
  const [pendingPhotos, setPendingPhotos] = useState([]);
  const [confirmClose, setConfirmClose] = useState(false);
  const [photoStage, setPhotoStage] = useState('Additional Inspection');
  const [lightbox, setLightbox] = useState(null);

  const filtered = requests.filter(request => {
    const hay = [request.workCode, request.storeCode, request.storeName, request.issueTitle].join(' ').toLowerCase();
    const requestMonth = request.reportedDate?.slice(0, 7) || '';
    return (!search || hay.includes(search.trim().toLowerCase())) && (!status || request.status === status) && (!category || request.category === category) && (!contractor || request.contractor === contractor) && (!month || requestMonth === month);
  });

  const months = [...new Set(requests.map(r => r.reportedDate?.slice(0, 7)).filter(Boolean))].sort().reverse();
  const contractors = [...new Set([...CONTRACTORS, ...requests.map(r => r.contractor).filter(Boolean)])];
  const selected = requests.find(r => r.workCode === selectedCode);

  const makeSnapshot = (value, photos = []) => JSON.stringify({
    status: value?.status || '', chargeType: value?.chargeType || '', costCategory: value?.costCategory || '',
    contractor: value?.contractor || '', actualCost: Number(value?.actualCost || 0), adminNotes: value?.adminNotes || '',
    pending: photos.map(p => `${p.name}-${p.stage}`)
  });

  const openRequest = (request) => {
    const editable = { ...request };
    setSelectedCode(request.workCode);
    setDraft(editable);
    setPendingPhotos([]);
    setSnapshot(makeSnapshot(editable, []));
    setConfirmClose(false);
  };

  const closeModal = () => {
    setSelectedCode(null); setDraft(null); setPendingPhotos([]); setConfirmClose(false);
  };

  const requestClose = () => {
    if (draft && snapshot !== makeSnapshot(draft, pendingPhotos)) setConfirmClose(true);
    else closeModal();
  };

  const updateDraft = (field, value) => setDraft({ ...draft, [field]: value });

  const addAdminPhotos = async (event) => {
    const files = [...event.target.files];
    if (files.some(file => !['image/jpeg','image/png'].includes(file.type) || file.size > 5 * 1024 * 1024)) {
      showToast('Photos must be JPG/PNG and max 5 MB each.', 'error');
      return;
    }
    const photos = await readFiles(files);
    setPendingPhotos([...pendingPhotos, ...photos.map(photo => ({ ...photo, stage: photoStage, date: new Date().toISOString() }))]);
    event.target.value = '';
  };

  const saveChanges = () => {
    if (!draft) return;
    const now = new Date().toISOString();
    const original = requests.find(r => r.workCode === draft.workCode);
    let history = [...(original?.history || [])];
    if (original && draft.status !== original.status) history = [...history, { status: draft.status, date: now, by: 'Admin' }];
    const updated = {
      ...original, ...draft,
      actualCost: Number(draft.actualCost || 0),
      adminNotes: draft.adminNotes.trim(),
      adminPhotos: [...(original?.adminPhotos || []), ...pendingPhotos],
      history, lastUpdate: now
    };
    onUpdateRequest(updated);
    setDraft(updated);
    setPendingPhotos([]);
    setSnapshot(makeSnapshot(updated, []));
    showToast('Changes saved successfully.');
  };

  const exportCSV = () => {
    if (!filtered.length) return showToast('No requests to export.', 'error');
    const headers = ['Work Code','Reported Date','Store Code','Store Name','Category','Issue Title','Urgent','Status','Contractor','Last Update','Actual Cost'];
    const rows = filtered.map(r => [r.workCode,r.reportedDate,r.storeCode,r.storeName,r.category,r.issueTitle,r.urgent?'Yes':'No',r.status,r.contractor||'',r.lastUpdate,r.actualCost||0]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v ?? '').replaceAll('"','""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `maintenance-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <main className="shell">
      <section className="card database-card">
        <div className="database-toolbar">
          <div className="filter search-control"><label>Search</label><input className="control" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search work code, store code, store name, or issue..." /></div>
          <Filter label="Status" value={status} onChange={setStatus} first="All Status" options={ALL_STATUSES}/>
          <Filter label="Category" value={category} onChange={setCategory} first="All Categories" options={CATEGORIES}/>
          <Filter label="Contractor" value={contractor} onChange={setContractor} first="All Contractors" options={contractors}/>
          <div className="filter"><label>Month</label><select className="control" value={month} onChange={e => setMonth(e.target.value)}><option value="">All Months</option>{months.map(value => <option value={value} key={value}>{new Date(value + '-01T00:00:00').toLocaleDateString('en-US',{month:'long',year:'numeric'})}</option>)}</select></div>
          <button className="btn primary" type="button" onClick={exportCSV}>Export CSV</button>
        </div>
        <div className="database-meta"><span>Showing {filtered.length} request{filtered.length === 1 ? '' : 's'}</span><span>Click any row to open request details</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Work Code</th><th>Reported Date</th><th>Store Code</th><th>Store Name</th><th>Category</th><th>Issue Title</th><th>Urgent</th><th>Status</th><th>Contractor</th><th>Last Update</th><th>Actual Cost</th></tr></thead>
            <tbody>{filtered.map(request => <tr key={request.workCode} onClick={() => openRequest(request)}><td><span className="code-link">{request.workCode}</span></td><td>{formatDate(request.reportedDate)}</td><td>{request.storeCode || '–'}</td><td>{request.storeName}</td><td>{request.category}</td><td>{request.issueTitle}</td><td>{request.urgent ? <span className="urgent-badge">URGENT</span> : '–'}</td><td><span className={`status-pill ${statusClass(request.status)}`}>{request.status}</span></td><td>{request.contractor || '–'}</td><td>{formatDate(request.lastUpdate)}</td><td>{formatMoney(request.actualCost)}</td></tr>)}</tbody>
          </table>
          {!filtered.length && <div className="empty-state" style={{display:'block'}}>No maintenance requests found.</div>}
        </div>
        <div className="pager"><span>{filtered.length} rows on this page</span><div className="pages"></div></div>
      </section>

      {selected && draft && <RequestModal request={selected} draft={draft} updateDraft={updateDraft} pendingPhotos={pendingPhotos} photoStage={photoStage} setPhotoStage={setPhotoStage} addAdminPhotos={addAdminPhotos} requestClose={requestClose} saveChanges={saveChanges} openLightbox={setLightbox}/>}      
      {confirmClose && <div className="confirm-modal open"><div className="confirm-card card"><h3>Discard unsaved changes?</h3><p>Your changes will not be saved.</p><div className="confirm-actions"><button className="btn" onClick={() => setConfirmClose(false)}>Stay</button><button className="btn primary" onClick={closeModal}>Discard</button></div></div></div>}
      {lightbox && <div className="photo-lightbox open" aria-hidden="false" onClick={() => setLightbox(null)}><button className="photo-lightbox-close" type="button" aria-label="Close photo">✕</button><img src={lightbox.src} alt="Photo preview"/><div>{lightbox.caption}</div></div>}
    </main>
  );
}

function Filter({ label, value, onChange, first, options }) {
  return <div className="filter"><label>{label}</label><select className="control" value={value} onChange={e => onChange(e.target.value)}><option value="">{first}</option>{options.map(option => <option key={option}>{option}</option>)}</select></div>;
}

function RequestModal({ request, draft, updateDraft, pendingPhotos, photoStage, setPhotoStage, addAdminPhotos, requestClose, saveChanges, openLightbox }) {
  const currentIndex = NORMAL_STATUSES.indexOf(draft.status);
  const photos = [...(request.adminPhotos || []), ...pendingPhotos];
  return <div className="js-modal open" aria-hidden="false"><div className="modal-backdrop" onClick={requestClose}></div><div className="card modal-panel js-modal-panel"><div className="modal-head"><div><h2>Maintenance Request Details</h2><p>View and update maintenance request information (Admin)</p></div><button className="close-x" type="button" onClick={requestClose}>✕</button></div><div className="detail-grid"><div><section className="detail-section"><h3>Basic Information</h3><div className="detail-fields"><ReadField label="Work Code" value={request.workCode}/><ReadField label="Reported Date" value={formatDate(request.reportedDate)}/><ReadField label="Store Code" value={request.storeCode || '–'}/><ReadField label="Store Name" value={request.storeName}/><ReadField label="Category" value={request.category}/><ReadField label="Urgent" value={request.urgent ? 'YES' : 'No'}/><ReadField label="Issue Title" value={request.issueTitle} span="span-3"/><div className="field span-3"><label>Description</label><textarea className="control textarea" value={request.details} readOnly /></div></div><div className="reported-photo-section"><h4>Reported Photos</h4><PhotoGallery photos={request.reportedPhotos || []} openLightbox={openLightbox}/></div></section><section className="detail-section" style={{marginTop:12}}><h3>Admin Update</h3><div className="detail-fields"><EditSelect label="Current Status" value={draft.status} onChange={v => updateDraft('status',v)} options={ALL_STATUSES}/><EditSelect label="Charge Type" value={draft.chargeType || ''} onChange={v => updateDraft('chargeType',v)} options={['Chargeable','No Charge','Under Warranty']} first="Select..."/><EditSelect label="Cost Category" value={draft.costCategory || request.category} onChange={v => updateDraft('costCategory',v)} options={CATEGORIES}/><EditSelect label="Contractor" value={draft.contractor || ''} onChange={v => updateDraft('contractor',v)} options={CONTRACTORS} first="Select contractor..." span="span-2"/><div className="field"><label>Actual Cost <small>Before VAT</small></label><input className="control admin-input" type="number" min="0" step="0.01" value={draft.actualCost || 0} onChange={e => updateDraft('actualCost',e.target.value)}/></div><div className="field span-3"><label>Admin Notes</label><textarea className="control textarea admin-input" value={draft.adminNotes || ''} onChange={e => updateDraft('adminNotes',e.target.value)}/></div></div></section></div><aside><section className="detail-section"><h3>Status Workflow</h3><div className="timeline">{NORMAL_STATUSES.map((status,index) => { const h=[...(request.history || [])].reverse().find(x => x.status === status); const done=currentIndex >= 0 && index <= currentIndex; return <div className={`step ${done?'done':''}`} key={status}><div className="step-dot">{done?'✓':index+1}</div><div><b>{status}</b>{h ? <small>{formatDateTime(h.date)}<br/>{h.by || 'Admin'}</small> : (index === currentIndex + 1 ? <small>Next workflow step</small> : null)}</div></div>; })}</div><div className="exception-status"><span className="status-pill s-hold">Hold</span><span className="status-pill s-cancel">Cancelled</span><span className="status-pill s-cancel">Invalid Request</span></div></section><section className="detail-section" style={{marginTop:12}}><h3>Admin / Follow-up Photos</h3><label className="photo-type-label">Photo stage<select className="control" value={photoStage} onChange={e => setPhotoStage(e.target.value)}><option>Additional Inspection</option><option>Work Progress</option><option>Completed Work</option></select></label><input id="adminPhotoInputReact" type="file" accept="image/jpeg,image/png" multiple hidden onChange={addAdminPhotos}/><label htmlFor="adminPhotoInputReact" className="upload-main upload-button"><div><b>Add photos</b><small>JPG, PNG · choose stage above</small></div></label><PhotoGallery photos={photos} openLightbox={openLightbox} compact/></section><section className="detail-section" style={{marginTop:12}}><h3>Last Updated</h3><div className="placeholder">{formatDateTime(request.lastUpdate)}<br/>By Admin</div></section></aside></div><div className="modal-actions"><button className="btn" type="button" onClick={requestClose}>Close</button><button className="btn primary" type="button" onClick={saveChanges}>Save Changes &nbsp; →</button></div></div></div>;
}

function ReadField({ label, value, span = '' }) { return <div className={`field ${span}`}><label>{label}</label><input className="control" value={value} readOnly /></div>; }
function EditSelect({ label, value, onChange, options, first, span='' }) { return <div className={`field ${span}`}><label>{label}</label><select className="control admin-input" value={value} onChange={e => onChange(e.target.value)}>{first && <option value="">{first}</option>}{options.map(option => <option key={option}>{option}</option>)}</select></div>; }
function PhotoGallery({ photos, openLightbox, compact=false }) { if (!photos.length) return <span className="placeholder">No reported photos.</span>; return <div className={`photo-gallery ${compact?'compact':''}`}>{photos.map((photo,index) => <button className="gallery-item photo-view-btn" type="button" key={`${photo.name}-${index}`} onClick={() => openLightbox({src:photo.data,caption:photo.stage ? `${photo.stage} · ${photo.name}` : photo.name})}><img src={photo.data} alt={photo.name}/><span>{photo.stage || photo.name}</span></button>)}</div>; }
