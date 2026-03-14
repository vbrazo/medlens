const TOKEN_KEY = 'medlens_token';
const ROLE_KEY = 'medlens_role';

export type UserRole = 'patient' | 'admin';

export function useAuth() {
  function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getRole(): UserRole | null {
    return localStorage.getItem(ROLE_KEY) as UserRole | null;
  }

  function login(token: string, role: UserRole = 'admin') {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(ROLE_KEY, role);
  }

  function setRole(role: UserRole) {
    localStorage.setItem(ROLE_KEY, role);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
  }

  const role = getRole();

  return {
    token: getToken(),
    role,
    isAuthenticated: Boolean(getToken()),
    isAdmin: role === 'admin',
    login,
    setRole,
    logout,
  };
}
