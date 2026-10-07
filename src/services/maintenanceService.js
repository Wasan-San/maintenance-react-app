import { supabase } from '../lib/supabase.js';
import { addSignedPhotoUrls, uploadTicketPhotos } from './photoService.js';

const REQUEST_SELECT = `
  ticket_id,
  ticket_code,
  request_date,
  store_id,
  vendor_id,
  category,
  urgency,
  issue_title,
  description,
  reporter_email,
  reporter_mobile,
  hq_support,
  status,
  charge_type,
  cost_category,
  actual_cost,
  admin_notes,
  created_at,
  last_update,
  history,
  ticket_photos (
    photo_id,
    storage_path,
    photo_type,
    stage,
    created_at
  ),
  stores (
    store_id,
    store_code,
    store_name,
    store_email,
    region
  ),
  vendors (
    vendor_id,
    vendor_name
  )
`;

export function mapRequestRow(row) {
  return {
    ticketId: row.ticket_id,
    workCode: row.ticket_code,
    reportedDate: row.request_date || '',
    storeId: row.store_id,
    storeCode: row.stores?.store_code || '',
    storeName: row.stores?.store_name || '',
    category: row.category || '',
    issueTitle: row.issue_title || row.description || '',
    status: row.status || 'New Request',
    contractor: row.vendors?.vendor_name || '',
    vendorId: row.vendor_id || null,
    actualCost: Number(row.actual_cost || 0),
    email: row.reporter_email || '',
    mobile: row.reporter_mobile || '',
    hqSupport: row.hq_support || '',
    details: row.description || '',
    urgent: row.urgency === 'Urgent',
    photoRecords: (row.ticket_photos || []).map(photo => ({
      id: photo.photo_id,
      path: photo.storage_path,
      type: photo.photo_type,
      stage: photo.stage || '',
      createdAt: photo.created_at || ''
    })),
    reportedPhotos: [],
    adminPhotos: [],
    chargeType: row.charge_type || '',
    costCategory: row.cost_category || row.category || '',
    adminNotes: row.admin_notes || '',
    createdAt: row.created_at || row.request_date || '',
    lastUpdate: row.last_update || row.created_at || row.request_date || '',
    history: Array.isArray(row.history) ? row.history : []
  };
}

export function mapStoreRow(row) {
  return {
    storeId: row.store_id,
    storeCode: row.store_code,
    storeName: row.store_name,
    storeEmail: row.store_email || '',
    region: row.region || '',
    isActive: row.is_active !== false
  };
}

export function mapVendorRow(row) {
  return {
    vendorId: row.vendor_id,
    vendorName: row.vendor_name,
    contactEmail: row.contact_email || '',
    contactPhone: row.contact_phone || '',
    isActive: row.is_active !== false
  };
}

export async function fetchRequests() {
  const { data, error } = await supabase
    .from('tickets')
    .select(REQUEST_SELECT)
    .order('request_date', { ascending: false })
    .order('ticket_id', { ascending: false });

  if (error) throw error;
  return Promise.all((data || []).map(row => addSignedPhotoUrls(mapRequestRow(row))));
}

export async function fetchStores() {
  const { data, error } = await supabase
    .from('stores')
    .select('store_id, store_code, store_name, store_email, region, is_active')
    .eq('is_active', true)
    .order('store_name');

  if (error) throw error;
  return (data || []).map(mapStoreRow);
}

export async function fetchVendors() {
  const { data, error } = await supabase
    .from('vendors')
    .select('vendor_id, vendor_name, contact_email, contact_phone, is_active')
    .eq('is_active', true)
    .order('vendor_name');

  if (error) throw error;
  return (data || []).map(mapVendorRow);
}

export async function createRequestRecord(request) {
  const payload = {
    request_date: request.reportedDate,
    store_id: request.storeId,
    category: request.category,
    urgency: request.urgent ? 'Urgent' : 'Normal',
    issue_title: request.issueTitle,
    description: request.details,
    reporter_email: request.email,
    reporter_mobile: request.mobile || null,
    hq_support: request.hqSupport || null,
    status: 'New Request',
    charge_type: null,
    cost_category: request.category,
    actual_cost: 0,
    admin_notes: null,
    history: request.history || []
  };

  const { data, error } = await supabase
    .from('tickets')
    .insert(payload)
    .select(REQUEST_SELECT)
    .single();

  if (error) throw error;

  let photoUploadError = null;

  if (request.reportedPhotos?.length) {
    try {
      await uploadTicketPhotos({
        ticketId: data.ticket_id,
        storeId: data.store_id,
        photos: request.reportedPhotos,
        photoType: 'reported',
        stage: 'Reported'
      });
    } catch (error) {
      // ticket ถูกบันทึกแล้ว → ห้าม throw ไม่งั้นผู้ใช้จะคิดว่าไม่ได้บันทึก
      console.error('Photo upload failed after ticket was created:', error);
      photoUploadError = error.message || 'Photo upload failed.';
    }
  }

  const saved = await fetchRequestById(data.ticket_id);
  return { ...saved, photoUploadError };
}

export async function fetchRequestById(ticketId) {
  const { data, error } = await supabase
    .from('tickets')
    .select(REQUEST_SELECT)
    .eq('ticket_id', ticketId)
    .single();

  if (error) throw error;
  return addSignedPhotoUrls(mapRequestRow(data));
}

export async function updateRequestRecord(request, vendors = [], pendingPhotos = []) {
  const matchedVendor = request.contractor
    ? vendors.find(vendor => vendor.vendorName === request.contractor)
    : null;

  const payload = {
    vendor_id: matchedVendor?.vendorId || null,
    status: request.status,
    charge_type: request.chargeType || null,
    cost_category: request.costCategory || request.category || null,
    actual_cost: Number(request.actualCost || 0),
    admin_notes: request.adminNotes || null,
    last_update: new Date().toISOString(),
    history: request.history || []
  };

  const { data, error } = await supabase
    .from('tickets')
    .update(payload)
    .eq('ticket_id', request.ticketId)
    .select(REQUEST_SELECT)
    .single();

  if (error) throw error;

  if (pendingPhotos?.length) {
    await uploadTicketPhotos({
      ticketId: data.ticket_id,
      storeId: data.store_id,
      photos: pendingPhotos,
      photoType: 'admin',
      stage: 'Additional Inspection'
    });
  }

  return fetchRequestById(data.ticket_id);
}

export async function deleteRequestRecord(ticketId) {
  const { data: photos, error: photoError } = await supabase
    .from('ticket_photos')
    .select('storage_path')
    .eq('ticket_id', ticketId);

  if (photoError) throw photoError;

  const paths = (photos || []).map((photo) => photo.storage_path);
  if (paths.length) {
    const { error: storageError } = await supabase.storage
      .from('maintenance-photos')
      .remove(paths);

    if (storageError) throw storageError;
  }

  const { error } = await supabase
    .from('tickets')
    .delete()
    .eq('ticket_id', ticketId);

  if (error) throw error;
}
