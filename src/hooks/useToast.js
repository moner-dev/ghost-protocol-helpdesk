/**
 * GHOST PROTOCOL — useToast Hook
 *
 * Re-export of the useToast hook for clean imports across the app.
 *
 * Usage:
 *   import { useToast } from '@/hooks/useToast';
 *
 *   const toast = useToast();
 *   toast.success('Operation completed');
 *   toast.error('Something went wrong');
 *   toast.warning('Please review');
 *   toast.info('New update available');
 */

export { useToast } from '@/components/ui/Toast';
