"use client";

import { useState, useEffect } from "react";

/**
 * Debounce một giá trị.
 * Trả về giá trị đã được "làm chậm" – chỉ cập nhật sau `delay` ms kể từ lần thay đổi cuối.
 *
 * Dùng để tránh gọi API liên tục khi user gõ search input.
 *
 * @param value - Giá trị cần debounce
 * @param delay - Thời gian delay tính bằng milliseconds (mặc định 300ms)
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
