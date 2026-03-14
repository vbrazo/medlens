import {Navigate, Outlet} from 'react-router-dom';
import {useAuth} from '../hooks/useAuth';

/**
 * Protects routes that require admin role.
 * Non-admin authenticated users are redirected to /overview.
 * Unauthenticated users are caught by the outer ProtectedRoute.
 */
export default function AdminRoute() {
  const {isAdmin} = useAuth();

  if (!isAdmin) {
    return <Navigate to="/overview" replace />;
  }

  return <Outlet />;
}
