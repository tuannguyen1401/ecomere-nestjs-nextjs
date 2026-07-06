const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Kiểm tra file trước khi upload (client-side).
 * Trả về { valid: true } hoặc { valid: false, error: "..." }
 */
export function validateFile(file: File): ValidationResult {
  // Kiểm tra định dạng
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXT.includes(ext)) {
    return { valid: false, error: `Chỉ chấp nhận file ảnh: ${ALLOWED_EXT.join(', ')}` };
  }

  // Kiểm tra kích thước
  if (file.size > MAX_SIZE) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return { valid: false, error: `File quá lớn (${mb}MB). Tối đa 5MB.` };
  }

  return { valid: true };
}

/**
 * Upload file lên server với progress tracking.
 * Dùng XMLHttpRequest thay vì fetch để có thể theo dõi tiến trình.
 *
 * @param file - File cần upload
 * @param onProgress - Callback nhận % hoàn thành (0-100)
 * @returns Promise<UploadResult>
 */
export function uploadFile(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem('token');
    const BASE_URL = process.env.NEXT_PUBLIC_API || 'http://localhost:3010/api';

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        // TransformInterceptor wrap response dạng { data: { url: ... } }
        const url = data?.data?.url || data?.url;
        if (!url) {
          reject(new Error('Upload response missing URL'));
          return;
        }
        resolve({
          url,
          filename: file.name,
          size: file.size,
        });
      } catch {
        reject(new Error('Invalid response from server'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.onabort = () => reject(new Error('Upload cancelled'));

    xhr.open('POST', `${BASE_URL}/file/upload`);
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    xhr.send(formData);
  });
}

/**
 * Format kích thước file sang dạng dễ đọc (KB/MB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}
