/**
 * Gửi yêu cầu xóa cache (revalidate) sang frontend cho một hoặc nhiều tag.
 * Hàm này chạy bất đồng bộ dưới background (non-blocking) để tránh làm chậm API của Backend.
 * 
 * @param tags - Một tag (chuỗi) hoặc danh sách các tag cần revalidate
 */
export function revalidateFrontendTags(tags: string | string[]): void {
  try {
    const feUrl = process.env.FRONTEND_URL || "http://localhost:3009";
    const tagArray = Array.isArray(tags) ? tags : [tags];

    // Chạy ngầm dưới background bằng cách không trả về Promise cho hàm gọi và tự catch lỗi
    Promise.all(
      tagArray.map((tag) =>
        fetch(`${feUrl}/api/revalidate?tag=${encodeURIComponent(tag)}`)
          .then((res) => {
            if (!res.ok) {
              console.warn(`[Revalidate] Failed to revalidate tag: ${tag}, status: ${res.status}`);
            } else {
              console.log(`[Revalidate] Successfully revalidated tag: ${tag}`);
            }
          })
          .catch((err) => {
            console.error(`[Revalidate] Error revalidating tag: ${tag}`, err);
          })
      )
    ).catch((err) => {
      console.error('[Revalidate] Unexpected error in Promise.all of revalidation:', err);
    });
  } catch (error) {
    console.error('[Revalidate] Unexpected error in revalidateFrontendTags:', error);
  }
}
