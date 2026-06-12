// src/lib/inertia-stubs.ts - Minimal stubs for @inertiajs/react (Server Component compatible)
import Link from 'next/link';

// Stub for Link component - use Next.js Link
export { Link };

// Stub for usePage - returns mock page props (synchronous, no hooks)
export function usePage() {
  return {
    props: {
      auth: { user: null, lang: 'en' },
      defaultLanguages: ['en'],
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
export function useRouter() {
  return {
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
  };
}

// Stub for usePage (alias)
export const usePageProps = usePage;
