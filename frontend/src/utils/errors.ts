// frontend/src/utils/errors.ts
import { AxiosError } from 'axios';

/**
 * Extract error message from various error types
 * 
 * Handles:
 * - Axios errors with backend detail messages
 * - Standard Error objects
 * - String errors
 * - Unknown error types
 */
export function getErrorMessage(error: unknown): string {
  // Axios error with response data
  if (error instanceof Error && 'isAxiosError' in error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    
    // Backend sends detailed error messages in response.data.detail
    if (axiosError.response?.data?.detail) {
      return axiosError.response.data.detail;
    }
    
    // Fallback to status text
    if (axiosError.response?.statusText) {
      return `${axiosError.response.status}: ${axiosError.response.statusText}`;
    }
    
    // Network error
    if (axiosError.message) {
      return axiosError.message;
    }
  }
  
  // Standard Error object
  if (error instanceof Error) {
    return error.message;
  }
  
  // String error
  if (typeof error === 'string') {
    return error;
  }
  
  // Unknown error type
  return 'An unknown error occurred';
}