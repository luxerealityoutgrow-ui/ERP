// src/lib/inertia-stubs.ts - Minimal stubs for @inertiajs/react (Server Component compatible)
import Link from 'next/link';

// Stub for Link component - use Next.js Link
export { Link };

// Stub for usePage - returns mock page props (synchronous, no hooks)
export function usePage() {
  return {
    props: {
      auth: { user: null, lang: 'en' },
      defaultLanguages: [
        { code: 'en', name: 'English', countryCode: 'US', enabled: true },
        { code: 'hi', name: 'Hindi', countryCode: 'IN', enabled: true },
        { code: 'mr', name: 'Marathi', countryCode: 'IN', enabled: true }
      ],
      flash: {},
      errors: {},
    },
    url: '/',
    component: '',
    version: '',
    scrollRegions: [],
  };
}

// Stub for router - returns mock router functions (synchronous)
export const router = {
  visit: (url: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = url;
    }
  },
  replace: (url: string) => {
    if (typeof window !== 'undefined') {
      window.location.replace(url);
    }
  },
  reload: () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  },
  back: () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  },
  forward: () => {},
  remember: () => {},
  restore: () => {},
  post: (url: string, data?: any, options?: any) => {},
  put: (url: string, data?: any, options?: any) => {},
  patch: (url: string, data?: any, options?: any) => {},
  delete: (url: string, options?: any) => {},
  get: (url: string, data?: any, options?: any) => {},
};

export function useRouter() {
  return router;
}

// Stub for usePage (alias)
export const usePageProps = usePage;

