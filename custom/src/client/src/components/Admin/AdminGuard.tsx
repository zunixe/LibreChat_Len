import { Navigate } from 'react-router-dom';
import { SystemRoles } from 'librechat-data-provider';
import { useAuthContext } from '~/hooks';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const authContext = useAuthContext();
  const user = authContext?.user;

  if (!authContext?.isAuthenticated) {
    return <Navigate to="/login" replace={true} />;
  }

  if (user?.role !== SystemRoles.ADMIN) {
    return <Navigate to="/" replace={true} />;
  }

  return <>{children}</>;
}
