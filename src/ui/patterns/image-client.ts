/**
 * Browser-side image preparation for the uploader (issue #6):
 * EXIF-orientation correction + downscale + re-encode, so a 12 MP phone photo
 * arrives as a ~1–2 MB image that still has enough detail for analysis.
 * Runs only in the browser.
 */

const MAX_DIMENSION = 2000;
const QUALITY = 0.82;

export interface PreparedImage {
  blob: Blob;
  type: string;
  width: number;
  height: number;
  previewUrl: string;
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  // createImageBitmap with imageOrientation:'from-image' applies EXIF rotation.
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // HEIC or an unsupported decode — hand the original bytes to the server as-is.
    return {
      blob: file,
      type: file.type || "application/octet-stream",
      width: 0,
      height: 0,
      previewUrl: URL.createObjectURL(file),
    };
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return {
      blob: file,
      type: file.type,
      width: bitmap.width,
      height: bitmap.height,
      previewUrl: URL.createObjectURL(file),
    };
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const outType = "image/jpeg";
  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b ?? file), outType, QUALITY),
  );

  return { blob, type: outType, width, height, previewUrl: URL.createObjectURL(blob) };
}

/** Read the first bytes for a client-side magic-byte pre-check. */
export async function firstBytes(file: File, n = 16): Promise<Uint8Array> {
  const slice = file.slice(0, n);
  return new Uint8Array(await slice.arrayBuffer());
}
