import { useEffect, useMemo, useState } from 'react';
import { CATEGORIES } from '../data.js';
import { today } from '../utils.js';
import { ClipboardPlusIcon } from '../components/Icons.jsx';

const makeEmptyForm = (email = '') => ({
  reportedDate: today(),
  storeId: '',
  storeName: '',
  storeCode: '',
  email,
  mobile: '',
  category: '',
  hqSupport: '',
  issueTitle: '',
  details: '',
  urgent: false
});

export default function NewRequest({ stores, profile, userEmail, onAddRequest, onNavigate, showToast }) {
  const [form, setForm] = useState(() => makeEmptyForm(userEmail));
  const [photos, setPhotos] = useState([]);
  const [errors, setErrors] = useState({});
  const [confirmMode, setConfirmMode] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const storeLocked = profile?.role === 'store';
  const allowedStores = useMemo(() => {
    if (!storeLocked) return stores;
    return stores.filter((store) => Number(store.storeId) === Number(profile.storeId));
  }, [stores, storeLocked, profile?.storeId]);

  useEffect(() => {
    if (!storeLocked || !allowedStores.length || form.storeId) return;
    const store = allowedStores[0];
    setForm((current) => ({
      ...current,
      storeId: store.storeId,
      storeName: store.storeName,
      storeCode: store.storeCode,
      email: current.email || userEmail || ''
    }));
  }, [storeLocked, allowedStores, form.storeId, userEmail]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const handleStoreChange = (value) => {
    const store = allowedStores.find((item) => String(item.storeId) === String(value));
    setForm((current) => ({
      ...current,
      storeId: store?.storeId || '',
      storeName: store?.storeName || '',
      storeCode: store?.storeCode || ''
    }));
    setErrors((current) => ({ ...current, storeName: '' }));
  };

  const addPhotos = (event) => {
    const selected = [...event.target.files].slice(0, Math.max(0, 5 - photos.length));
    const next = selected.map((file) => ({
      file,
      name: file.name,
      preview: URL.createObjectURL(file),
      stage: 'Reported'
    }));
    setPhotos((current) => [...current, ...next]);
    event.target.value = '';
  };

  const removePhoto = (index) => {
    setPhotos((current) => {
      URL.revokeObjectURL(current[index].preview);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const validate = () => {
    const next = {};
    if (!form.storeId) next.storeName = 'Please select a store.';
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Please enter a valid email.';
    if (!form.category) next.category = 'Please select a category.';
    if (!form.issueTitle.trim()) next.issueTitle = 'Please enter an issue title.';
    if (!form.details.trim()) next.details = 'Please describe the issue.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submitRequest = async (event) => {
    event.preventDefault();
    if (!validate()) {
      showToast('Please complete the required fields.', 'error');
      return;
    }

    const now = new Date().toISOString();
    const request = {
      ...form,
      email: form.email.trim(),
      mobile: form.mobile.trim(),
      issueTitle: form.issueTitle.trim(),
      details: form.details.trim(),
      reportedPhotos: photos,
      status: 'New Request',
      chargeType: '',
      costCategory: form.category,
      contractor: '',
      actualCost: 0,
      adminNotes: '',
      createdAt: now,
      lastUpdate: now,
      history: [{ status: 'New Request', date: now, by: profile?.displayName || userEmail || 'User' }]
    };

    try {
      setSubmitting(true);
      const created = await onAddRequest(request);
            if (created.photoUploadError) {
        const nextStep = profile?.role === 'admin'
          ? 'Please open the request and add photos again.'
          : 'Please ask an admin to add the photos.';
        showToast(
          `${created.workCode} saved, but photos failed to upload. ${nextStep} (${created.photoUploadError})`,
          'error',
          8000
        );
      } else {
        showToast(`${created.urgent ? 'URGENT · ' : ''}${created.workCode} submitted successfully.`);
      }
      photos.forEach((photo) => URL.revokeObjectURL(photo.preview));
      setPhotos([]);
      setForm(makeEmptyForm(userEmail));
    } catch (error) {
      console.error('Create request failed:', error);
      showToast(error.message || 'Unable to submit request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const dirty = Object.entries(form).some(([key, value]) => {
    if (key === 'reportedDate') return value !== today();
    if (key === 'email') return value !== (userEmail || '');
    if (key === 'urgent') return value === true;
    return Boolean(value);
  }) || photos.length > 0;

  const resetForm = () => {
    photos.forEach((photo) => URL.revokeObjectURL(photo.preview));
    setPhotos([]);
    setForm(makeEmptyForm(userEmail));
    setErrors({});
    setConfirmMode(null);
  };

  const cancel = () => {
    setConfirmMode(null);
    onNavigate('overview');
  };

  return (
    <main className="shell form-layout">
      <section className="card form-card">
        <div className="form-title">
          <div className="form-title-left"><div className="icon-bubble" style={{'--wash':'#edf4ff','--icon':'#2f6fed'}}><ClipboardPlusIcon /></div><h2>Create New Request</h2></div>
          <div className="required-note"><span className="req">*</span> Required fields</div>
        </div>

        <form className="form-grid" onSubmit={submitRequest} noValidate>
          <Field label="Reported Date" thai="วันที่แจ้งเรื่อง" required><input className="control" type="date" value={form.reportedDate} onChange={(e) => updateField('reportedDate', e.target.value)} /></Field>
          <Field label="Store Name" thai="ชื่อสาขา" required error={errors.storeName}><select className="control" value={form.storeId} onChange={(e) => handleStoreChange(e.target.value)} disabled={storeLocked}><option value="">Search and select store...</option>{allowedStores.map((store) => <option key={store.storeId} value={store.storeId}>{store.storeName}</option>)}</select></Field>
          <Field label="Store Code" thai="รหัสสาขา"><input className="control" value={form.storeCode} placeholder="Auto-filled from Store Name" readOnly /></Field>
          <Field span="span-3" label="Email" thai="อีเมลผู้แจ้ง" required error={errors.email}><input className="control" type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="yourname@company.com" /></Field>
          <Field span="span-3" label="Mobile Number" thai="เบอร์มือถือ"><input className="control" type="tel" value={form.mobile} onChange={(e) => updateField('mobile', e.target.value)} placeholder="e.g. 081 234 5678" /></Field>
          <Field span="span-3" label="Category" thai="ประเภทงาน" required error={errors.category}><select className="control" value={form.category} onChange={(e) => updateField('category', e.target.value)}><option value="">Select a category</option>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></Field>
          <Field span="span-3" label="Support from HQ" thai="ต้องการการสนับสนุนจากสำนักงานใหญ่หรือไม่"><select className="control" value={form.hqSupport} onChange={(e) => updateField('hqSupport', e.target.value)}><option value="">Select an option</option><option>Equipment and Worker</option><option>Only Equipment</option><option>Only Worker</option><option>Coordinate with the landlord</option><option>No support required</option></select></Field>
          <Field span="span-6 full-mobile" label="Issue Title" thai="หัวข้อปัญหา" required error={errors.issueTitle}><input className="control" value={form.issueTitle} onChange={(e) => updateField('issueTitle', e.target.value)} placeholder="e.g. AC not working, Water leak, Light issue, etc." /></Field>
          <Field span="span-6 full-mobile" label="Details" thai="รายละเอียดเพิ่มเติม" required error={errors.details}><textarea className="control textarea" value={form.details} onChange={(e) => updateField('details', e.target.value)} placeholder="Please describe the issue in detail..." /></Field>

          <div className="field span-6 full-mobile">
            <label>Photo <small>Supabase Storage · up to 5 files</small></label>
            <div className="upload-row">
              <label className="upload-main upload-button">
                <input type="file" accept="image/*" multiple hidden onChange={addPhotos} disabled={photos.length >= 5} />
                <div><b>{photos.length >= 5 ? 'Maximum 5 photos selected' : 'Choose maintenance photos'}</b><small>Files upload after the ticket is created.</small></div>
              </label>
            </div>
            {photos.length > 0 && <div className="photo-preview-strip">{photos.map((photo, index) => <div className="photo-thumb" key={`${photo.name}-${index}`}><img src={photo.preview} alt={photo.name} /><button type="button" onClick={() => removePhoto(index)}>×</button></div>)}</div>}
          </div>

          <Field span="span-6 full-mobile" label="Urgent" thai="เป็นเรื่องเร่งด่วนหรือไม่"><div className="radio-row"><label><input type="radio" name="urgent" checked={form.urgent} onChange={() => updateField('urgent', true)} /> Yes</label><label><input type="radio" name="urgent" checked={!form.urgent} onChange={() => updateField('urgent', false)} /> No</label></div></Field>

          <div className="form-actions span-6" style={{justifyContent:'space-between'}}>
            <button className="btn" type="button" onClick={() => dirty ? setConfirmMode('cancel') : onNavigate('overview')}>Cancel</button>
            <div style={{display:'flex',gap:12}}><button className="btn" type="button" onClick={() => dirty ? setConfirmMode('reset') : resetForm()}>Reset</button><button className="btn primary" type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Request →'}</button></div>
          </div>
        </form>
      </section>

      <aside className="side-stack">
        <section className="card side-card"><h3>Before you submit</h3><p>Please check the following to help us resolve your request faster.</p><div className="check-list"><Check text="Provide a clear and concise issue title" thai="ระบุหัวข้อปัญหาให้ชัดเจน"/><Check text="Include detailed information" thai="อธิบายรายละเอียดเพิ่มเติม"/><Check text="Select the correct category" thai="เลือกประเภทงานให้ถูกต้อง"/><Check text="Check if this is an urgent request" thai="ตรวจสอบว่าเป็นเรื่องเร่งด่วนหรือไม่"/></div></section>
        <section className="card side-card"><h3>Your Access</h3><p><b>{profile?.role || 'user'}</b> account. Store users are locked to their assigned store; viewer/admin can choose a store.</p></section>
      </aside>

      {confirmMode && <div className="confirm-modal open"><div className="confirm-card card"><h3>{confirmMode === 'reset' ? 'Reset this form?' : 'Discard this request?'}</h3><p>{confirmMode === 'reset' ? 'All entered information will be cleared.' : 'Your entered information will not be saved.'}</p><div className="confirm-actions"><button className="btn" onClick={() => setConfirmMode(null)}>Stay</button><button className="btn primary" onClick={confirmMode === 'reset' ? resetForm : cancel}>{confirmMode === 'reset' ? 'Reset' : 'Discard'}</button></div></div></div>}
    </main>
  );
}

function Field({ label, thai, required, error, span = '', children }) {
  return <div className={`field ${span} ${error ? 'has-error' : ''}`}><label>{label} {required && <span className="req">*</span>}<small>{thai}</small></label>{children}{error && <small className="field-error">{error}</small>}</div>;
}

function Check({ text, thai }) {
  return <div className="check-item"><span className="checkmark">✓</span><div><b>{text}</b><small>{thai}</small></div></div>;
}
