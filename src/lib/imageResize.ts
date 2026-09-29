/**
 * Downscale and re-encode an image in the browser before it is uploaded.
 *
 * Why this runs on the client rather than on the server:
 *
 *   - The server is deployed by copying `dist/` onto the host. A native
 *     image library (sharp and friends) would need an `npm install` with a
 *     matching platform binary on that host, which the deploy does not do.
 *   - The upload travels as base64 inside a JSON body. Shrinking first means
 *     a 3 MB photo crosses the network as ~250 KB instead of ~4 MB encoded,
 *     so the editor stops waiting on the upload as well.
 *   - No server CPU is spent on it.
 *
 * The budget is set by the strictest consumer rather than by what looks good
 * in the editor: any uploaded image can later be chosen as the article's
 * share image, and WhatsApp silently declines an og:image much over 300 KB.
 * Encoding every upload under that ceiling means an editor never has to know
 * which images are share images.
 */

/** Longest edge, in pixels, after scaling. */
const MAX_EDGE = 1600;

/**
 * Byte ceiling for the re-encoded file. Sits under WhatsApp's ~300 KB
 * thumbnail limit with room to spare.
 */
const MAX_BYTES = 280_000;

/** Quality ladder, tried high to low until one lands under MAX_BYTES. */
const QUALITY_STEPS = [0.86, 0.78, 0.7, 0.62, 0.55, 0.45];

export interface ResizedImage {
  /** Base64 payload with no data-URL prefix — what the upload API expects. */
  data: string;
  /** Filename with the extension corrected if the format changed. */
  filename: string;
  /** Media type actually encoded. */
  type: string;
  bytes: number;
  width: number;
  height: number;
  /** Byte size of the file the user picked, for reporting. */
  originalBytes: number;
  /** True when the original was returned untouched. */
  untouched: boolean;
}

/** Read a File as bare base64 (no `data:...;base64,` prefix). */
function readAsBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(reader.error || new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

/** Decode to something drawable, preferring the off-thread path. */
async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      /* Safari has historically refused some files here — fall through. */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('decode failed'));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Does the drawn image actually use its alpha channel?
 *
 * Most PNGs coming out of a phone or a screenshot tool are fully opaque and
 * belong in JPEG, which is far smaller. Only genuinely transparent artwork —
 * logos, badges — needs a format that keeps alpha. Sampling a small grid is
 * enough to tell the two apart without reading megapixels of data.
 */
function hasAlpha(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  const step = Math.max(1, Math.floor(Math.min(w, h) / 32));
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (ctx.getImageData(x, y, 1, 1).data[3] < 255) return true;
    }
  }
  return false;
}

function swapExtension(name: string, type: string): string {
  const ext = type === 'image/jpeg' ? 'jpg' : type === 'image/webp' ? 'webp' : 'png';
  const base = name.replace(/\.[^.]+$/, '') || 'image';
  return `${base}.${ext}`;
}

/**
 * Shrink `file` for upload.
 *
 * Returns the original untouched when re-encoding would not help or would be
 * wrong: vector art, animated formats (a canvas would flatten them to their
 * first frame), anything already small enough, and — as a backstop — any case
 * where the re-encoded result came out no smaller than what we started with.
 */
export async function resizeForUpload(file: File): Promise<ResizedImage> {
  const originalBytes = file.size;
  const passthrough = async (): Promise<ResizedImage> => ({
    data: await readAsBase64(file),
    filename: file.name,
    type: file.type || 'application/octet-stream',
    bytes: originalBytes,
    width: 0,
    height: 0,
    originalBytes,
    untouched: true,
  });

  // SVG is vector: rasterising it would make it both larger and worse. GIF is
  // very often animated, and a canvas keeps only frame one — silently
  // destroying an animation is worse than leaving the bytes alone.
  const type = (file.type || '').toLowerCase();
  if (type === 'image/svg+xml' || type === 'image/gif') return passthrough();
  if (typeof document === 'undefined') return passthrough();

  let source: ImageBitmap | HTMLImageElement;
  try {
    source = await decode(file);
  } catch {
    return passthrough(); // let the server reject it if it is genuinely broken
  }

  const srcW = 'width' in source ? source.width : 0;
  const srcH = 'height' in source ? source.height : 0;
  if (!srcW || !srcH) return passthrough();

  // Already small in both senses — nothing to gain.
  if (srcW <= MAX_EDGE && srcH <= MAX_EDGE && originalBytes <= MAX_BYTES) {
    return passthrough();
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(srcW, srcH));
  const width = Math.max(1, Math.round(srcW * scale));
  const height = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return passthrough();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source as CanvasImageSource, 0, 0, width, height);
  if ('close' in source) source.close();

  // Transparent artwork keeps its alpha via WebP; everything else goes to
  // JPEG, where the quality ladder can actually hit a byte budget.
  const keepAlpha = type === 'image/png' || type === 'image/webp' ? hasAlpha(ctx, width, height) : false;
  const outType = keepAlpha ? 'image/webp' : 'image/jpeg';

  let best: Blob | null = null;
  for (const q of QUALITY_STEPS) {
    const blob = await canvasToBlob(canvas, outType, q);
    if (!blob) continue;
    best = blob;
    if (blob.size <= MAX_BYTES) break;
  }
  // Nothing encoded, or the "smaller" version is not smaller: keep the original.
  if (!best || best.size >= originalBytes) return passthrough();

  return {
    data: await readAsBase64(best),
    filename: swapExtension(file.name, outType),
    type: outType,
    bytes: best.size,
    width,
    height,
    originalBytes,
    untouched: false,
  };
}

/** "3.2 MB → 241 KB (1600×1045)" for the editor to show after an upload. */
export function describeResize(r: ResizedImage): string | null {
  if (r.untouched) return null;
  const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);
  return `${kb(r.originalBytes)} → ${kb(r.bytes)} (${r.width}×${r.height})`;
}
