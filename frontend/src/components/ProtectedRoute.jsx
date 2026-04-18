import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated, getRole } from '../services/authService';

/**
 * ProtectedRoute  – redirects to /login when no token exists.
 *
 * RoleRoute       – extends ProtectedRoute; also checks role.
 *   <RoleRoute allowedRoles={['admin']} />  ← only admins pass through
 *   Unauthorized users are sent to /unauthorized instead of login.
 */

export const ProtectedRoute = () =>
  isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;

export const RoleRoute = ({ allowedRoles }) => {
  if (!isAuthenticated())              return <Navigate to="/login"        replace />;
  if (!allowedRoles.includes(getRole())) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
};

/* Default export keeps backward-compat with existing import in App.jsx */
export default ProtectedRoute;
