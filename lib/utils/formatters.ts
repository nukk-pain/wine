/**
 * Formatting utilities for Wine Tracker
 * Extracted from components for reuse across the application
 */

/**
 * Format a number as Korean Won (₩) with thousands separators
 * @param value - The value to format (number, string, null, or undefined)
 * @returns Formatted price string or '-' if invalid
 */
export function formatKRW(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
        return '-';
    }

    return `₩${numValue.toLocaleString('ko-KR')}`;
}

/**
 * Format a date for display
 * @param date - Date string or Date object
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
    date: string | Date | null | undefined,
    options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }
): string {
    if (!date) {
        return '-';
    }

    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(dateObj.getTime())) {
            return '-';
        }
        return dateObj.toLocaleDateString('ko-KR', options);
    } catch {
        return '-';
    }
}

/**
 * Format file size for display (e.g., "1.5 MB")
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) {
        return text || '';
    }
    return text.slice(0, maxLength - 3) + '...';
}

/**
 * Format vintage year with validation
 * @param vintage - Vintage year
 * @returns Formatted vintage string or '-' if invalid
 */
export function formatVintage(vintage: number | null | undefined): string {
    if (vintage === null || vintage === undefined) {
        return '-';
    }

    const currentYear = new Date().getFullYear();
    if (vintage < 1800 || vintage > currentYear + 1) {
        return '-';
    }

    return vintage.toString();
}
