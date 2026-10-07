import { supabase } from '../lib/supabase.js';

const BUCKET = 'maintenance-photos';

function safeFileName(name = 'photo') {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const MAX_SIDE = 1600;      // ด้านยาวสุดของรูปหลังย่อ (px)
const JPEG_QUALITY = 0.8;   // คุณภาพ JPEG 0–1

async function compressImage(file) {
  // ไม่ใช่รูป หรือเป็น JPEG ขนาดเล็กอยู่แล้ว → ไม่ต้องย่อ
  if (!file.type.startsWith('image/')) return file;
  if (file.type === 'image/jpeg' && file.size < 300 * 1024) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
    );
    if (!blob) return file;

    const baseName = (file.name || 'photo').replace(/\.[^.]+$/, '');
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
  } catch (error) {
    console.warn('Image compression skipped:', error);
    return file; // ย่อไม่ได้ → ใช้ไฟล์เดิม
  }
}

export async function uploadTicketPhotos({ ticketId, storeId, photos, photoType, stage }) {
  if (!photos?.length) return [];

  const uploaded = [];

  for (const photo of photos) {
    const file = await compressImage(photo.file || photo);
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
