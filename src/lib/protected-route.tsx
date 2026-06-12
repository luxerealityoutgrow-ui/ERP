import { useSessionContext } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedRoute({ allowedRoles, children }: {
  allowedRoles: string[];
  children: React.ReactNode;
}) {
  const { session } = useSessionContext();
  const router = useRouter();

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }
    // assume the user profile is stored in session.user.role
    const role = session.user?.role as string | undefined;
    if (!role || !allowedRoles.includes(role)) {
      router.push('/no-access');
    }
  }, [session]);

  return <>{children}</>;
}
