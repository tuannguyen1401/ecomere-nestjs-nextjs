import { ApiError } from "./api-error";
import { getErrorMessage } from "./error";

const BASE_URL = process.env.NEXT_PUBLIC_API || "http://localhost:3010/api";

/**
 * apiRequest – wrapper fetch chuẩn cho toàn bộ app.
 *
 * Tính năng:
 * - Tự động attach Authorization header (nếu có token)
 * - Parse response JSON
 * - Throw ApiError với message thân thiện (qua getErrorMessage)
 * - ApiError chứa statusCode + errorCode để component dễ xử lý
 */
export async function apiRequest(path: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers = new Headers(options.headers || {});
  // Không set Content-Type cho FormData (multipart)
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (err) {
    // Network error (offline, timeout, DNS fail...)
    throw new ApiError(
      getErrorMessage(err, "Cannot connect to server. Please check your connection."),
      0,
      "NETWORK_ERROR",
    );
  }

  const text = await response.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: "Invalid response from server" };
  }

  if (!response.ok) {
    // Lấy message từ response, xử lý qua getErrorMessage để chắc chắn
    const rawMessage = data?.message || data?.error || "Something went wrong";
    const message = getErrorMessage(rawMessage);
    throw new ApiError(message, response.status, data?.errorCode || null);
  }

  return data;
}
