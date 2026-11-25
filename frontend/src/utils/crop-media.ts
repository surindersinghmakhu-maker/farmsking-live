import { Platform } from 'react-native';
import { apiClient, resolveMediaUrl } from '@/src/api/client';

export const MAX_REMARK_CHARS = 150;
export const MAX_AUDIO_SECONDS = 60;
export const MEDIA_DISPLAY_DAYS = 7;
export const MEDIA_DISPLAY_MS = MEDIA_DISPLAY_DAYS * 24 * 60 * 60 * 1000;

export type MediaCaptureSource = 'LIVE' | 'UPLOADED';

export interface MediaStoreRecord {
  id: string;
  uploadedById?: string | null;
  cropId?: string | null;
  fileUrl: string;
  thumbnailUrl?: string | null;
  mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO' | string;
  mimeType?: string;
  originalName?: string;
  sizeBytes?: number;
  provider?: string;
  isArchived?: boolean;
  expiresAt?: string | null;
  createdAt?: string;
}

export type CropGalleryRecord = MediaStoreRecord;
export type CropGalleryBatch = CropMediaHistoryBatch;

export interface CropRemarkHistoryEntry {
  id: string;
  remarksText: string;
  createdAt: string;
  expiresAt?: string | null;
  isActiveDisplay: boolean;
}

export interface CropRemarkResponse {
  cropId: string;
  remarksText: string;
  createdAt: string | null;
  expiresAt: string | null;
  isActiveDisplay: boolean;
  history: CropRemarkHistoryEntry[];
}

export interface CropMediaHistoryBatch {
  batchKey: string;
  dateLabel: string;
  savedAt: string;
  expiresAt: string;
  isActiveDisplay: boolean;
  daysRemaining: number;
  photos: Array<{ url: string; source: MediaCaptureSource; createdAt: string }>;
  video: string | null;
  audio: string | null;
  remarksText: string;
}

export interface HydratedCropMedia {
  photos: string[];
  video: string | null;
  audio: string | null;
  recordsByUrl: Record<string, string>;
  sourcesByUrl: Record<string, MediaCaptureSource>;
  datesByUrl: Record<string, string>;
  activeWindowStartedAt: string | null;
  activeWindowExpiresAt: string | null;
  daysRemaining: number;
  isActiveWindowLocked: boolean;
  hasExpiredArchive: boolean;
  rawRows: MediaStoreRecord[];
}

export interface WatermarkOptions {
  sourceType: MediaCaptureSource;
  farmerName?: string;
  plotName?: string;
  cropName?: string;
  capturedAt?: Date;
}

const DEAD_DEMO_URL_PATTERN = /assets\.farmsking\.com\/demo_crop_video/i;

/**
 * Resolves FarmsKing's favicon URL safely on both Metro web bundles and static public serving.
 */
export function resolveFaviconUrl(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const asset = require('@/assets/images/favicon.png');
    if (typeof asset === 'string' && asset.length > 0) return asset;
    if (asset && typeof asset === 'object') {
      if (typeof asset.uri === 'string' && asset.uri.length > 0) return asset.uri;
      if (typeof asset.default === 'string' && asset.default.length > 0) return asset.default;
    }
  } catch {
    // fallback to public static root favicon
  }
  return '/favicon.png';
}

/**
 * Formats Date & Time cleanly in 100% standard English for media watermarks.
 */
export function formatMediaTimestamp(input?: Date | string | null): { dateStr: string; timeStr: string; full: string } {
  const d = input ? new Date(input) : new Date();
  const safeDate = Number.isNaN(d.getTime()) ? new Date() : d;
  const dateStr = safeDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = safeDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return { dateStr, timeStr, full: `${dateStr} · ${timeStr}` };
}

/**
 * Infers whether a media item was captured live or uploaded from gallery using filename/URL tags.
 */
export function detectMediaCaptureSource(
  url?: string | null,
  originalName?: string | null,
): MediaCaptureSource {
  const combined = `${url || ''} ${originalName || ''}`.toLowerCase();
  if (combined.includes('_uploaded_')) return 'UPLOADED';
  return 'LIVE';
}

/**
 * Returns true if a persisted URL is safe/valid to display across sessions.
 * Filters out ephemeral `blob:` URLs from stale localStorage and dead placeholder URLs.
 */
export function isUsablePersistedMediaUri(uri?: string | null, allowEphemeralBlob = false): boolean {
  if (!uri || typeof uri !== 'string') return false;
  const trimmed = uri.trim();
  if (!trimmed) return false;
  if (DEAD_DEMO_URL_PATTERN.test(trimmed)) return false;
  if (!allowEphemeralBlob && trimmed.startsWith('blob:')) return false;
  return true;
}

/**
 * Returns true when a URI points to an unsaved local asset (`data:`, `blob:`, `file:`, `content:`, `ph:`)
 * that must be uploaded to `/media-store` before closing.
 */
export function isLocalPendingMediaUri(uri?: string | null): boolean {
  if (!uri) return false;
  const trimmed = uri.trim();
  return /^(data:|blob:|file:|content:|ph:)/i.test(trimmed);
}

/**
 * Resolves any crop photo/video URI for rendering, ignoring legacy dead placeholder URLs.
 */
export function resolveCropMediaDisplayUri(uri?: string | null): string | undefined {
  if (!uri || DEAD_DEMO_URL_PATTERN.test(uri)) return undefined;
  return resolveMediaUrl(uri) || uri;
}

/**
 * Sunday is strictly Day 1, Saturday is Day 7.
 * Calculates the current or reference calendar week's Sunday (Day 1 00:00:00) and Saturday (Day 7 23:59:59.999).
 */
export function getCalendarWeekRange(refDate: Date | string | number = new Date()): {
  weekStartSunday: Date;
  weekEndSaturday: Date;
  dayNumber: number; // 1 (Sunday) to 7 (Saturday)
  dayName: string;
  daysRemaining: number; // 7 (Sunday) down to 1 (Saturday)
  dateLabel: string;
  weekKey: string;
} {
  const d = new Date(refDate);
  const safeDate = Number.isNaN(d.getTime()) ? new Date() : d;
  const dayIndex = safeDate.getDay(); // 0 is Sunday, 6 is Saturday
  const dayNumber = dayIndex + 1; // 1 is Sunday (Day 1), 7 is Saturday (Day 7)

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[dayIndex] || 'Sunday';

  const sunday = new Date(safeDate);
  sunday.setDate(safeDate.getDate() - dayIndex);
  sunday.setHours(0, 0, 0, 0);

  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  saturday.setHours(23, 59, 59, 999);

  const nowMs = Date.now();
  const satMs = saturday.getTime();
  const daysRemaining = satMs >= nowMs ? Math.max(1, Math.ceil((satMs - nowMs) / (24 * 60 * 60 * 1000))) : 0;

  const startFmt = sunday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const endFmt = saturday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const dateLabel = `${startFmt} – ${endFmt}`;
  const weekKey = sunday.toISOString().slice(0, 10);

  return {
    weekStartSunday: sunday,
    weekEndSaturday: saturday,
    dayNumber,
    dayName,
    daysRemaining,
    dateLabel,
    weekKey,
  };
}

/**
 * Checks whether a timestamped record is still within the active Sunday to Saturday calendar week cycle.
 */
export function isRecordWithinDisplayWindow(
  createdAt?: string | null,
  expiresAt?: string | null,
  nowMs: number = Date.now(),
): boolean {
  if (createdAt) {
    const createdMs = new Date(createdAt).getTime();
    if (!Number.isNaN(createdMs)) {
      const currentWeek = getCalendarWeekRange(new Date(nowMs));
      return createdMs >= currentWeek.weekStartSunday.getTime() && createdMs <= currentWeek.weekEndSaturday.getTime();
    }
  }
  if (expiresAt) {
    const expMs = new Date(expiresAt).getTime();
    if (!Number.isNaN(expMs)) return expMs >= nowMs;
  }
  return false;
}

export function computeDaysRemaining(expiresAt?: string | null, createdAt?: string | null): number {
  const currentWeek = getCalendarWeekRange();
  if (createdAt) {
    const recWeek = getCalendarWeekRange(createdAt);
    if (recWeek.weekKey === currentWeek.weekKey) {
      return currentWeek.daysRemaining;
    }
    return 0;
  }
  if (expiresAt) {
    const expMs = new Date(expiresAt).getTime();
    const nowMs = Date.now();
    if (expMs && !Number.isNaN(expMs) && expMs > nowMs) {
      return Math.max(1, Math.ceil((expMs - nowMs) / (24 * 60 * 60 * 1000)));
    }
  }
  return currentWeek.daysRemaining;
}

/**
 * Checks if locally cached GPS media metadata is still within its 7-day active display cycle.
 */
export function isLocalGpsMediaActive(gps?: {
  mediaCycleSavedAt?: string;
  mediaDisplayExpiresAt?: string;
  updatedAt?: string;
  fieldPhotos?: string[];
  fieldVideo?: string;
  fieldAudio?: string;
  farmerRemarks?: string;
} | null): boolean {
  if (!gps) return false;
  if (gps.mediaDisplayExpiresAt) {
    return isRecordWithinDisplayWindow(gps.mediaCycleSavedAt || gps.updatedAt, gps.mediaDisplayExpiresAt);
  }
  if (gps.mediaCycleSavedAt) {
    return isRecordWithinDisplayWindow(gps.mediaCycleSavedAt, null);
  }
  // Legacy entries created before 7-day window field was introduced
  const hasAny =
    Boolean(gps.fieldPhotos?.length) ||
    Boolean(gps.fieldVideo) ||
    Boolean(gps.fieldAudio) ||
    Boolean(gps.farmerRemarks?.trim());
  if (!hasAny) return false;
  return isRecordWithinDisplayWindow(gps.updatedAt, null);
}

/**
 * Fetches saved photos, live video, and voice feedback audio for a crop from Crop Gallery.
 * Returns active (<= 7 days) items for display plus raw history so Crop Activities preserves all uploads permanently.
 */
export async function fetchCropMediaFromStore(cropId: string): Promise<HydratedCropMedia> {
  const res = await apiClient.get<MediaStoreRecord[]>(`/crop-gallery/crop/${encodeURIComponent(cropId)}`);
  const rows = Array.isArray(res.data) ? res.data : [];

  const photos: string[] = [];
  const seenPhotos = new Set<string>();
  const recordsByUrl: Record<string, string> = {};
  const sourcesByUrl: Record<string, MediaCaptureSource> = {};
  const datesByUrl: Record<string, string> = {};
  let video: string | null = null;
  let audio: string | null = null;
  let hasExpiredArchive = false;
  let activeWindowStartedAt: string | null = null;
  let activeWindowExpiresAt: string | null = null;

  const nowMs = Date.now();
  // Backend returns ORDER BY createdAt DESC; reverse for chronological photo order
  const chronological = [...rows].reverse();

  for (const row of chronological) {
    const resolved = resolveCropMediaDisplayUri(row.fileUrl);
    if (!resolved) continue;

    const within7Days = !row.isArchived && isRecordWithinDisplayWindow(row.createdAt, row.expiresAt, nowMs);
    if (!within7Days) {
      hasExpiredArchive = true;
      continue;
    }

    recordsByUrl[resolved] = row.id;
    const detectedSource = detectMediaCaptureSource(resolved, row.originalName);
    sourcesByUrl[resolved] = detectedSource;
    if (row.createdAt) {
      datesByUrl[resolved] = row.createdAt;
      if (!activeWindowStartedAt || row.createdAt > activeWindowStartedAt) {
        activeWindowStartedAt = row.createdAt;
        activeWindowExpiresAt =
          row.expiresAt ||
          new Date(new Date(row.createdAt).getTime() + MEDIA_DISPLAY_MS).toISOString();
      }
    }
    if (row.fileUrl) {
      recordsByUrl[row.fileUrl] = row.id;
      sourcesByUrl[row.fileUrl] = detectedSource;
      if (row.createdAt) datesByUrl[row.fileUrl] = row.createdAt;
    }

    const rowMediaType = String(row.mediaType || '').toUpperCase();
    const rowMime = String(row.mimeType || '').toLowerCase();
    const isAudio =
      rowMediaType === 'AUDIO' ||
      rowMime.startsWith('audio/') ||
      /\.(mp3|m4a|wav|ogg|aac|opus)(\?|$)/i.test(resolved);
    const isVideo =
      !isAudio &&
      (rowMediaType === 'VIDEO' ||
        rowMime.startsWith('video/') ||
        /\.(mp4|webm|mov|mkv|m4v|3gp)(\?|$)/i.test(resolved));

    if (isAudio) {
      audio = resolved;
    } else if (isVideo) {
      video = resolved;
    } else if (!seenPhotos.has(resolved)) {
      seenPhotos.add(resolved);
      photos.push(resolved);
    }
  }

  const daysRemaining = computeDaysRemaining(activeWindowExpiresAt, activeWindowStartedAt);
  const isActiveWindowLocked =
    daysRemaining > 0 && (photos.length > 0 || Boolean(video) || Boolean(audio));

  return {
    photos: photos.slice(0, 6),
    video,
    audio,
    recordsByUrl,
    sourcesByUrl,
    datesByUrl,
    activeWindowStartedAt,
    activeWindowExpiresAt,
    daysRemaining,
    isActiveWindowLocked,
    hasExpiredArchive,
    rawRows: rows,
  };
}

/**
 * Fetches farmer's saved written crop remarks (active 7-day text + complete permanent history).
 */
export async function fetchCropRemarkFromStore(cropId: string): Promise<CropRemarkResponse> {
  try {
    const res = await apiClient.get<CropRemarkResponse>(
      `/crop-gallery/crop/${encodeURIComponent(cropId)}/remark`,
    );
    const data = res.data;
    return {
      cropId,
      remarksText: String(data?.remarksText || '').slice(0, MAX_REMARK_CHARS),
      createdAt: data?.createdAt || null,
      expiresAt: data?.expiresAt || null,
      isActiveDisplay: Boolean(data?.isActiveDisplay),
      history: Array.isArray(data?.history) ? data.history : [],
    };
  } catch {
    return {
      cropId,
      remarksText: '',
      createdAt: null,
      expiresAt: null,
      isActiveDisplay: false,
      history: [],
    };
  }
}

/**
 * Builds complete Crop Activities media & remarks timeline batches (including archived > 7 day entries).
 */
export function buildCropActivityMediaBatches(
  rawRows: MediaStoreRecord[],
  remarkHistory: CropRemarkHistoryEntry[],
): CropMediaHistoryBatch[] {
  const batches = new Map<string, CropMediaHistoryBatch>();
  const nowMs = Date.now();

  const ensureBatch = (dateIso: string, expiresIso?: string | null) => {
    const parsed = new Date(dateIso || Date.now());
    const safeDate = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    const weekInfo = getCalendarWeekRange(safeDate);
    const key = weekInfo.weekKey;
    const effectiveExp = expiresIso || weekInfo.weekEndSaturday.toISOString();
    const active = isRecordWithinDisplayWindow(safeDate.toISOString(), effectiveExp, nowMs);

    const existing = batches.get(key);
    if (existing) {
      if (safeDate.toISOString() > existing.savedAt) existing.savedAt = safeDate.toISOString();
      if (active) existing.isActiveDisplay = true;
      const rem = computeDaysRemaining(effectiveExp, safeDate.toISOString());
      if (rem > existing.daysRemaining) {
        existing.daysRemaining = rem;
        existing.expiresAt = effectiveExp;
      }
      return existing;
    }

    const batch: CropMediaHistoryBatch = {
      batchKey: key,
      dateLabel: `Week of ${weekInfo.dateLabel} (Sun–Sat)`,
      savedAt: safeDate.toISOString(),
      expiresAt: effectiveExp,
      isActiveDisplay: active,
      daysRemaining: computeDaysRemaining(effectiveExp, safeDate.toISOString()),
      photos: [],
      video: null,
      audio: null,
      remarksText: '',
    };
    batches.set(key, batch);
    return batch;
  };

  for (const row of [...rawRows].reverse()) {
    const resolved = resolveCropMediaDisplayUri(row.fileUrl);
    if (!resolved) continue;
    const b = ensureBatch(row.createdAt || new Date().toISOString(), row.expiresAt);
    const rowMediaType = String(row.mediaType || '').toUpperCase();
    const rowMime = String(row.mimeType || '').toLowerCase();
    const isAudio =
      rowMediaType === 'AUDIO' ||
      rowMime.startsWith('audio/') ||
      /\.(mp3|m4a|wav|ogg|aac|opus)(\?|$)/i.test(resolved);
    const isVideo =
      !isAudio &&
      (rowMediaType === 'VIDEO' ||
        rowMime.startsWith('video/') ||
        /\.(mp4|webm|mov|mkv|m4v|3gp)(\?|$)/i.test(resolved));

    if (isAudio) {
      b.audio = resolved;
    } else if (isVideo) {
      b.video = resolved;
    } else if (!b.photos.some((p) => p.url === resolved)) {
      b.photos.push({
        url: resolved,
        source: detectMediaCaptureSource(resolved, row.originalName),
        createdAt: row.createdAt || b.savedAt,
      });
    }
  }

  for (const rem of remarkHistory || []) {
    if (!rem.remarksText?.trim()) continue;
    const b = ensureBatch(rem.createdAt || new Date().toISOString(), rem.expiresAt);
    if (!b.remarksText) {
      b.remarksText = rem.remarksText.trim().slice(0, MAX_REMARK_CHARS);
    }
  }

  return Array.from(batches.values()).sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
}

/**
 * Saves farmer's written crop remarks (max 150 chars) to Crop Gallery.
 */
export async function saveCropRemarkToStore(cropId: string, remarksText: string): Promise<string> {
  const clean = String(remarksText || '').trim().slice(0, MAX_REMARK_CHARS);
  const res = await apiClient.put<CropRemarkResponse>(
    `/crop-gallery/crop/${encodeURIComponent(cropId)}/remark`,
    { remarksText: clean },
  );
  return String(res.data?.remarksText || clean).slice(0, MAX_REMARK_CHARS);
}

/**
 * Merges backend Crop Gallery URLs with valid locally cached URLs without duplicates or stale dead URIs.
 */
export function mergeCropMediaLists(
  backendPhotos: string[],
  localPhotos?: string[],
  backendVideo?: string | null,
  localVideo?: string | null,
  backendAudio?: string | null,
  localAudio?: string | null,
): { photos: string[]; video: string | null; audio: string | null } {
  const mergedPhotos: string[] = [];
  const seen = new Set<string>();

  for (const raw of backendPhotos) {
    const resolved = resolveCropMediaDisplayUri(raw);
    if (resolved && isUsablePersistedMediaUri(resolved, false) && !seen.has(resolved)) {
      seen.add(resolved);
      mergedPhotos.push(resolved);
    }
  }

  for (const raw of localPhotos || []) {
    if (!isUsablePersistedMediaUri(raw, false)) continue;
    const resolved = resolveCropMediaDisplayUri(raw);
    if (resolved && !seen.has(resolved)) {
      seen.add(resolved);
      mergedPhotos.push(resolved);
    }
  }

  let finalVideo: string | null = null;
  if (backendVideo && isUsablePersistedMediaUri(backendVideo, false)) {
    finalVideo = resolveCropMediaDisplayUri(backendVideo) || backendVideo;
  } else if (localVideo && isUsablePersistedMediaUri(localVideo, false)) {
    finalVideo = resolveCropMediaDisplayUri(localVideo) || localVideo;
  }

  let finalAudio: string | null = null;
  if (backendAudio && isUsablePersistedMediaUri(backendAudio, false)) {
    finalAudio = resolveCropMediaDisplayUri(backendAudio) || backendAudio;
  } else if (localAudio && isUsablePersistedMediaUri(localAudio, false)) {
    finalAudio = resolveCropMediaDisplayUri(localAudio) || localAudio;
  }

  return { photos: mergedPhotos.slice(0, 6), video: finalVideo, audio: finalAudio };
}

function inferFilenameFromMime(baseName: string, mimeType?: string): string {
  const mime = (mimeType || '').toLowerCase();
  let ext = '.jpg';
  if (mime.includes('png')) ext = '.png';
  else if (mime.includes('webp')) ext = '.webp';
  else if (mime.includes('webm')) ext = '.webm';
  else if (mime.includes('mpeg') || mime.includes('mp3')) ext = '.mp3';
  else if (mime.includes('m4a') || mime.includes('audio/mp4')) ext = '.m4a';
  else if (mime.includes('ogg') || mime.includes('opus')) ext = '.ogg';
  else if (mime.includes('wav')) ext = '.wav';
  else if (mime.includes('aac')) ext = '.aac';
  else if (mime.includes('quicktime')) ext = '.mov';
  else if (mime.includes('matroska')) ext = '.mkv';
  else if (mime.includes('mp4') || mime.startsWith('video/')) ext = '.mp4';
  else if (mime.startsWith('audio/')) ext = '.webm';
  const cleanBase = baseName.replace(/\.[a-z0-9]+$/i, '');
  return `${cleanBase}${ext}`;
}

/**
 * Uploads a single photo, video, or voice audio URI (`data:`, `blob:`, `file:`, `content:`) to Crop Gallery
 * and returns a permanent resolved URL. Throws on upload error so invalid/blank URLs are never saved.
 */
export async function uploadSingleCropMedia(
  uri: string,
  options: {
    cropId?: string;
    mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO';
    filenamePrefix: string;
    sourceType?: MediaCaptureSource;
  },
): Promise<string> {
  const trimmed = (uri || '').trim();
  if (!trimmed) {
    throw new Error('Empty media URI cannot be uploaded.');
  }

  if (DEAD_DEMO_URL_PATTERN.test(trimmed)) {
    throw new Error('Invalid placeholder video URL cannot be saved. Please record a live video.');
  }

  // Already a permanent backend or remote URL
  if (!isLocalPendingMediaUri(trimmed)) {
    return resolveCropMediaDisplayUri(trimmed) || trimmed;
  }

  const tagSuffix = options.sourceType === 'UPLOADED' ? '_uploaded' : '_live';
  const taggedPrefix = options.filenamePrefix.includes('_live') || options.filenamePrefix.includes('_uploaded')
    ? options.filenamePrefix
    : `${options.filenamePrefix}${tagSuffix}`;

  // Base64 Data URI (e.g., canvas-watermarked JPEG)
  if (trimmed.startsWith('data:')) {
    const ext = options.mediaType === 'VIDEO' ? 'mp4' : options.mediaType === 'AUDIO' ? 'webm' : 'jpg';
    const res = await apiClient.post(
      '/crop-gallery/upload-base64',
      {
        dataUri: trimmed,
        cropId: options.cropId || undefined,
        mediaType: options.mediaType,
        filename: `${taggedPrefix}_${Date.now()}.${ext}`,
      },
      { timeout: 120000 },
    );
    const fileUrl = res.data?.fileUrl;
    if (!fileUrl) {
      throw new Error('Crop Gallery upload did not return a file URL.');
    }
    return resolveCropMediaDisplayUri(fileUrl) || fileUrl;
  }

  // Multipart binary upload for blob:, file:, content:, ph: URIs
  const formData = new FormData();

  if (Platform.OS === 'web') {
    const response = await fetch(trimmed);
    if (!response.ok) {
      throw new Error('Selected local media file could not be read. Please capture or record it again.');
    }
    const blob = await response.blob();
    if (!blob || blob.size === 0) {
      throw new Error('Recorded media file is empty.');
    }
    const defaultMime =
      options.mediaType === 'AUDIO'
        ? 'audio/webm'
        : options.mediaType === 'VIDEO'
          ? 'video/webm'
          : 'image/jpeg';
    const mimeType = blob.type || defaultMime;
    const filename = inferFilenameFromMime(`${taggedPrefix}_${Date.now()}`, mimeType);
    formData.append('file', blob, filename);
  } else {
    const lower = trimmed.toLowerCase();
    let mimeType =
      options.mediaType === 'AUDIO'
        ? 'audio/mp4'
        : options.mediaType === 'VIDEO'
          ? 'video/mp4'
          : 'image/jpeg';
    let ext = options.mediaType === 'AUDIO' ? 'm4a' : options.mediaType === 'VIDEO' ? 'mp4' : 'jpg';
    if (lower.endsWith('.webm')) {
      mimeType = options.mediaType === 'AUDIO' ? 'audio/webm' : 'video/webm';
      ext = 'webm';
    } else if (lower.endsWith('.mp3')) {
      mimeType = 'audio/mpeg';
      ext = 'mp3';
    } else if (lower.endsWith('.wav')) {
      mimeType = 'audio/wav';
      ext = 'wav';
    } else if (lower.endsWith('.ogg')) {
      mimeType = 'audio/ogg';
      ext = 'ogg';
    } else if (lower.endsWith('.mov')) {
      mimeType = 'video/quicktime';
      ext = 'mov';
    } else if (lower.endsWith('.png')) {
      mimeType = 'image/png';
      ext = 'png';
    } else if (lower.endsWith('.webp')) {
      mimeType = 'image/webp';
      ext = 'webp';
    }
    formData.append('file', {
      uri: trimmed,
      name: `${taggedPrefix}_${Date.now()}.${ext}`,
      type: mimeType,
    } as any);
  }

  if (options.cropId) {
    formData.append('cropId', options.cropId);
  }
  formData.append('mediaType', options.mediaType);

  const uploadRes = await apiClient.post('/crop-gallery/upload', formData, {
    timeout: 180000,
    headers: { 'Content-Type': undefined as any },
  });

  const savedUrl = uploadRes.data?.fileUrl;
  if (!savedUrl) {
    throw new Error('Server did not return a file URL after upload.');
  }
  return resolveCropMediaDisplayUri(savedUrl) || savedUrl;
}

/**
 * Deletes removed Crop Gallery records in the background without blocking UX if a record is already missing.
 */
export async function deleteRemovedMediaStoreRecords(
  previousUrls: string[],
  currentUrls: string[],
  recordsByUrl: Record<string, string>,
): Promise<void> {
  const currentSet = new Set(currentUrls.map((u) => resolveCropMediaDisplayUri(u) || u));
  const idsToDelete = new Set<string>();

  for (const prev of previousUrls) {
    const normalizedPrev = resolveCropMediaDisplayUri(prev) || prev;
    if (!currentSet.has(normalizedPrev)) {
      const recordId = recordsByUrl[normalizedPrev] || recordsByUrl[prev];
      if (recordId) idsToDelete.add(recordId);
    }
  }

  if (idsToDelete.size === 0) return;

  await Promise.allSettled(
    Array.from(idsToDelete).map((id) => apiClient.delete(`/crop-gallery/${encodeURIComponent(id)}`)),
  );
}

/**
 * Purges heavy 60-second field videos when a crop cycle is completed,
 * while permanently preserving verified live photos, remarks & financial history.
 */
export async function purgeCropVideosFromStore(cropId: string): Promise<number> {
  try {
    const res = await apiClient.post<{ deletedVideosCount: number }>(
      `/crop-gallery/purge-videos/${encodeURIComponent(cropId)}`,
    );
    return res.data?.deletedVideosCount ?? 0;
  } catch (err: any) {
    console.warn(`[crop-media] purgeCropVideosFromStore error for crop ${cropId}:`, err?.message);
    return 0;
  }
}

/**
 * Draws a clean FarmsKing watermark onto any HTML5 canvas (shared by Photo stamping and Live Video recording):
 * - Top-Left: "● LIVE" (for camera capture) OR "UPLOADED" (for gallery upload)
 * - Top-Right: FarmsKing Favicon icon
 * - Bottom Strip: Date, Time, Farmer Name, Plot Name
 */
export function drawWatermarkOnCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: WatermarkOptions,
  faviconImg?: HTMLImageElement | null,
): void {
  const {
    sourceType,
    farmerName = 'Registered Farmer',
    plotName = 'Field Plot',
    capturedAt,
  } = options;

  const { dateStr, timeStr } = formatMediaTimestamp(capturedAt || new Date());
  const minDim = Math.min(width, height);
  const pad = Math.max(14, Math.round(minDim * 0.025));

  // 1. Top subtle dark gradient scrim for crisp badge & favicon visibility
  const topScrimH = Math.max(62, Math.round(height * 0.14));
  const topGrad = ctx.createLinearGradient(0, 0, 0, topScrimH);
  topGrad.addColorStop(0, 'rgba(9, 14, 23, 0.78)');
  topGrad.addColorStop(1, 'rgba(9, 14, 23, 0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, width, topScrimH);

  // 2. Top-Left Badge: LIVE (red) or UPLOADED (blue)
  const badgeFontSize = Math.max(14, Math.round(minDim * 0.026));
  const badgeH = Math.max(30, Math.round(badgeFontSize * 1.9));
  const labelText = sourceType === 'LIVE' ? 'LIVE' : 'UPLOADED';
  ctx.font = `800 ${badgeFontSize}px sans-serif`;
  const textMetrics = ctx.measureText(labelText);
  const dotSpace = sourceType === 'LIVE' ? badgeFontSize * 1.1 : 0;
  const badgeW = Math.round(textMetrics.width + dotSpace + badgeFontSize * 1.4);

  ctx.fillStyle = sourceType === 'LIVE' ? '#dc2626' : '#0284c7';
  ctx.beginPath();
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(pad, pad, badgeW, badgeH, Math.round(badgeH / 2));
  } else {
    ctx.rect(pad, pad, badgeW, badgeH);
  }
  ctx.fill();

  let textStartX = pad + Math.round(badgeFontSize * 0.7);
  if (sourceType === 'LIVE') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pad + Math.round(badgeFontSize * 0.75), pad + badgeH / 2, Math.max(4, badgeFontSize * 0.24), 0, Math.PI * 2);
    ctx.fill();
    textStartX += Math.round(badgeFontSize * 0.9);
  }

  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(labelText, textStartX, pad + badgeH / 2 + 1);

  // 3. Top-Right: FarmsKing Favicon
  const favBoxSize = Math.max(38, Math.round(minDim * 0.085));
  const favX = width - pad - favBoxSize;
  const favY = pad;

  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
  ctx.beginPath();
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(favX - 4, favY - 4, favBoxSize + 8, favBoxSize + 8, 10);
  } else {
    ctx.rect(favX - 4, favY - 4, favBoxSize + 8, favBoxSize + 8);
  }
  ctx.fill();

  if (faviconImg && faviconImg.complete && faviconImg.naturalWidth > 0) {
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(favX, favY, favBoxSize, favBoxSize, 8);
    } else {
      ctx.rect(favX, favY, favBoxSize, favBoxSize);
    }
    ctx.clip();
    ctx.drawImage(faviconImg, favX, favY, favBoxSize, favBoxSize);
  } else {
    ctx.fillStyle = '#22c55e';
    ctx.font = `900 ${Math.round(favBoxSize * 0.52)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FK', favX + favBoxSize / 2, favY + favBoxSize / 2);
  }
  ctx.restore();

  // 4. Bottom Solid Dark Backdrop with Date, Time, Farmer Name & Plot Name
  // Guaranteed zero vertical overlap: uses textBaseline = 'top' with explicit lineHeight and verticalGap
  const baseFontSize = Math.max(13, Math.min(22, Math.round(minDim * 0.024)));
  const padX = Math.max(16, Math.round(minDim * 0.028));
  const padY = Math.max(10, Math.round(minDim * 0.016));
  const maxContentW = Math.max(120, width - padX * 2);

  // Truncate helper if text is wider than available canvas width
  const fitText = (text: string, fontSpec: string, maxW: number): string => {
    ctx.font = fontSpec;
    if (ctx.measureText(text).width <= maxW) return text;
    let truncated = text;
    while (truncated.length > 4 && ctx.measureText(`${truncated}…`).width > maxW) {
      truncated = truncated.slice(0, -1);
    }
    return `${truncated}…`;
  };

  const cleanFarmer = (farmerName || 'Farmer').trim();
  const cleanPlot = (plotName || 'Field Plot').trim();
  const rawLine1 = `Date: ${dateStr}   ·   Time: ${timeStr}`;
  const rawLine2 = `Farmer: ${cleanFarmer}   |   Plot: ${cleanPlot}`;

  const fontLine1 = `700 ${baseFontSize}px sans-serif`;
  const fontLine2 = `600 ${baseFontSize}px sans-serif`;

  const line1 = fitText(rawLine1, fontLine1, maxContentW);
  const line2 = fitText(rawLine2, fontLine2, maxContentW);

  const lineHeight = Math.round(baseFontSize * 1.45);
  const verticalGap = Math.max(6, Math.round(baseFontSize * 0.35));
  const stripH = padY * 2 + lineHeight * 2 + verticalGap;
  const stripY = height - stripH;

  // Dark background strip with crisp neon green top border for 100% legibility on any image
  ctx.save();
  ctx.fillStyle = 'rgba(9, 14, 23, 0.88)';
  ctx.fillRect(0, stripY, width, stripH);

  ctx.fillStyle = '#10b981';
  ctx.fillRect(0, stripY, width, 2);

  // Line 1: Date & Time in High-Contrast Yellow
  const yLine1 = stripY + padY;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = fontLine1;
  ctx.fillStyle = '#fde047';
  ctx.fillText(line1, padX, yLine1);

  // Line 2: Farmer & Plot in Crisp White (Guaranteed separated by lineHeight + verticalGap)
  const yLine2 = yLine1 + lineHeight + verticalGap;
  ctx.font = fontLine2;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(line2, padX, yLine2);
  ctx.restore();
}

/**
 * Loads FarmsKing Favicon HTMLImageElement cleanly for Canvas stamping (non-blocking if unavailable).
 */
export function loadFaviconForCanvas(): Promise<HTMLImageElement | null> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    const img = document.createElement('img');
    const url = resolveFaviconUrl();
    if (/^https?:/i.test(url)) {
      img.crossOrigin = 'anonymous';
    }
    const timer = setTimeout(() => resolve(null), 1500);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Stamps FarmsKing's new watermark onto captured/uploaded crop photos (Web Canvas, max 1600px).
 * - LIVE badge on Top-Left for live camera captures, UPLOADED badge for gallery picks
 * - FarmsKing Favicon on Top-Right
 * - Date, Time, Farmer Name, Plot Name on Bottom
 */
export async function stampWatermarkOnImage(
  imageUri: string,
  watermarkOpts: WatermarkOptions,
): Promise<string> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return imageUri;
  }

  const faviconImg = await loadFaviconForCanvas();

  return new Promise((resolve) => {
    const img = document.createElement('img');
    if (/^https?:/i.test(imageUri)) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(imageUri);

        const rawW = img.naturalWidth || img.width || 1280;
        const rawH = img.naturalHeight || img.height || 720;
        const maxDim = 1600;
        const scale = Math.min(1, maxDim / Math.max(rawW, rawH));

        canvas.width = Math.max(1, Math.round(rawW * scale));
        canvas.height = Math.max(1, Math.round(rawH * scale));

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        drawWatermarkOnCanvas(ctx, canvas.width, canvas.height, watermarkOpts, faviconImg);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
        resolve(dataUrl);
      } catch {
        resolve(imageUri);
      }
    };
    img.onerror = () => resolve(imageUri);
    img.src = imageUri;
  });
}

/**
 * Browser file picker returning `blob:` object URLs for Gallery image selection fallback on Web.
 */
export function pickWebMediaFiles(accept: 'image/*', multiple = false): Promise<string[]> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return Promise.resolve([]);
  }

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple;
    input.style.display = 'none';

    let settled = false;
    const finish = (urls: string[]) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(urls);
    };

    input.onchange = () => {
      const files = Array.from(input.files || []);
      const urls = files.map((file) => URL.createObjectURL(file));
      finish(urls);
    };

    const onWindowFocus = () => {
      setTimeout(() => {
        if (!settled && (!input.files || input.files.length === 0)) {
          finish([]);
        }
        window.removeEventListener('focus', onWindowFocus);
      }, 450);
    };
    window.addEventListener('focus', onWindowFocus);

    document.body.appendChild(input);
    input.click();
  });
}

/**
 * Triggers safe browser or device download for watermarked crop photo.
 */
export async function downloadCropPhoto(
  uri: string,
  filename = 'farmsking_crop_photo.jpg',
): Promise<void> {
  const resolved = resolveCropMediaDisplayUri(uri) || uri;
  if (!resolved) return;

  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      const res = await fetch(resolved);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      window.open(resolved, '_blank');
    }
  } else {
    try {
      if (typeof window !== 'undefined' && window.open) {
        window.open(resolved, '_blank');
      }
    } catch {
      // ignore
    }
  }
}

/**
 * Validates whether a crop cycle has complete mandatory media records before adopting a Crop Doctor.
 * Mandatory requirement:
 * 1. Minimum 3 field photos
 * 2. Minimum 1 field video
 * 3. Voice note (AUDIO) or crop description/farmer remarks
 */
export async function validateCropGalleryCompleteness(
  cropId: string,
  localGpsData?: any,
): Promise<{
  isComplete: boolean;
  photoCount: number;
  hasVideo: boolean;
  hasVoiceOrNotes: boolean;
  missingItems: string[];
}> {
  let photos: string[] = [];
  let video: string | null = null;
  let audio: string | null = null;
  let remarks: string | null = null;

  try {
    const [mediaRes, remarkRes] = await Promise.all([
      fetchCropMediaFromStore(cropId),
      fetchCropRemarkFromStore(cropId),
    ]);
    photos = Array.isArray(mediaRes.photos) ? mediaRes.photos : [];
    video = mediaRes.video || null;
    audio = mediaRes.audio || null;
    remarks = remarkRes.remarksText || null;
  } catch {
    // fallback to local GPS cache
  }

  // Fallback to local GPS cache if remote store had partial/empty fields
  if (localGpsData) {
    if (photos.length === 0 && Array.isArray(localGpsData.fieldPhotos) && localGpsData.fieldPhotos.length > 0) {
      photos = localGpsData.fieldPhotos;
    }
    if (!video && localGpsData.fieldVideo) {
      video = localGpsData.fieldVideo;
    }
    if (!audio && localGpsData.fieldAudio) {
      audio = localGpsData.fieldAudio;
    }
    if (!remarks && localGpsData.farmerRemarks?.trim()) {
      remarks = localGpsData.farmerRemarks.trim();
    }
  }

  const photoCount = photos.length;
  const hasVideo = Boolean(video);
  const hasVoiceOrNotes = Boolean(audio) || Boolean(remarks?.trim());

  const missingItems: string[] = [];
  if (photoCount < 3) {
    missingItems.push(`At least 3 field photos (current: ${photoCount}/3)`);
  }
  if (!hasVideo) {
    missingItems.push('At least 1 crop field video (current: 0/1)');
  }
  if (!hasVoiceOrNotes) {
    missingItems.push('A voice record or crop description notes');
  }

  return {
    isComplete: photoCount >= 3 && hasVideo && hasVoiceOrNotes,
    photoCount,
    hasVideo,
    hasVoiceOrNotes,
    missingItems,
  };
}

