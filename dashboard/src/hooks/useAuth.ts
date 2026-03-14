const TOKEN_KEY = 'medlens_token';

export function useAuth() {
  function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  function login(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
  }

  return {
    token: getToken(),
    isAuthenticated: Boolean(getToken()),
    login,
    logout,
  };
}
