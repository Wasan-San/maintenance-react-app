import { supabase } from '../lib/supabase.js';

const BUCKET = 'maintenance-photos';

function safeFileName(name = 'photo') {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function uploadTicketPhotos({ ticketId, storeId, photos, photoType, stage }) {
  if (!photos?.length) return [];

  const uploaded = [];

  for (const photo of photos) {
    const file = photo.file || photo;
    const stamp = `${Date.now()}-${crypto.randomUUID()}`;
    const path = `${storeId}/${ticketId}/${photoType}/${stamp}-${safeFileName(file.name)}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: false });

    if (uploadError) throw uploadError;

    const { data: meta, error: metaError } = await supabase
      .from('ticket_photos')
      .insert({
        ticket_id: ticketId,
        storage_path: path,
        photo_type: photoType,
        stage: photo.stage || stage || null
      })
      .select('photo_id, storage_path, photo_type, stage, created_at')
      .single();

    if (metaError) {
      await supabase.storage.from(BUCKET).remove([path]);
      throw metaError;
    }

    uploaded.push(meta);
  }

  return uploaded;
}

export async function addSignedPhotoUrls(request) {
  const records = request.photoRecords || [];
  if (!records.length) return { ...request, reportedPhotos: [], adminPhotos: [] };

  const hydrated = await Promise.all(records.map(async (photo) => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(photo.path, 3600);

    if (error) throw error;

    return {
      ...photo,
      name: photo.path.split('/').pop(),
      data: data.signedUrl
    };
  }));

  return {
    ...request,
    reportedPhotos: hydrated.filter((photo) => photo.type === 'reported'),
    adminPhotos: hydrated.filter((photo) => photo.type === 'admin')
  };
}
