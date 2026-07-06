/**
 * Trích xuất message thân thiện từ error.
 * Xử lý nhiều dạng error khác nhau:
 * - Error object (err.message)
 * - API response (err.response?.data?.message)
 * - String
 * - Fetch/Network errors
 */
export function getErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (!err) return fallback;

  // Error object
  if (err instanceof Error) {
    // Network error (fetch failed)
    if (err.message === "Failed to fetch" || err.message === "NetworkError") {
      return "Cannot connect to server. Please check your connection.";
    }
    return err.message;
  }

  // Object with message field
  if (typeof err === "object" && err !== null) {
    const obj = err as Record<string, any>;

    // NestJS error response: { message: "...", statusCode: 400 }
    if (typeof obj.message === "string") return obj.message;

    // NestJS validation error: { message: ["field1 error", "field2 error"] }
    if (Array.isArray(obj.message)) return obj.message.join("; ");

    // Axios/RTK-like: { data: { message: "..." } }
    if (obj.data?.message) return obj.data.message;

    // Error with response (from fetch)
    if (obj.response?.data?.message) return obj.response.data.message;
  }

  // String
  if (typeof err === "string") return err;

  return fallback;
}
