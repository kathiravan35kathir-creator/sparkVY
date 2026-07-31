/**
 * Compresses an image file or data URL string using HTML Canvas.
 * Returns a compressed Data URL suitable for fast rendering and Firestore storage (< 100KB).
 */
export async function compressImage(
  fileOrDataUrl: File | string,
  maxWidth = 400,
  maxHeight = 400,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calculate scale ratio to maintain aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
        return;
      }

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const pngDataUrl = canvas.toDataURL('image/png');
        // If PNG is under 150KB, return PNG to keep transparency
        if (pngDataUrl.length < 200000) {
          resolve(pngDataUrl);
        } else {
          // Fallback to JPEG for smaller footprint if PNG is too dense
          resolve(canvas.toDataURL('image/jpeg', quality));
        }
      } catch (e) {
        resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
      }
    };

    img.onerror = (err) => {
      if (typeof fileOrDataUrl === 'string') {
        resolve(fileOrDataUrl);
      } else {
        reject(err);
      }
    };

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}
