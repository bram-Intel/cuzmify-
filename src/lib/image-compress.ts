/**
 * Compresses and resizes browser image uploads on `<canvas>` to lightweight WebP
 * (max 1200px dimension, ~60-110KB) so mobile uploads work smoothly on slow 3G/4G
 * connections and never bloat database payloads.
 */
export async function compressImageFileToWebP(
  file: File,
  maxDimension = 1200,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const rawDataUrl = reader.result as string;
      // Non-image fallback
      if (!file.type.startsWith('image/')) {
        resolve(rawDataUrl);
        return;
      }

      const img = new Image();
      img.onerror = () => resolve(rawDataUrl);
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width >= height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const webpUrl = canvas.toDataURL('image/webp', quality);
          // Fallback to JPEG if browser lacks WebP encoding
          if (!webpUrl.startsWith('data:image/webp')) {
            resolve(canvas.toDataURL('image/jpeg', quality));
            return;
          }
          resolve(webpUrl);
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}
