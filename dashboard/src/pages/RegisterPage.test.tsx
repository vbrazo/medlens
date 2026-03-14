import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router-dom';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import RegisterPage from './RegisterPage';

const mockRegister = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../api/client', () => ({
  api: {
    auth: {
      register: (...args: unknown[]) => mockRegister(...args),
    },
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the registration form with email, password, role and submit button', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('combobox', {name: /role/i})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /create account/i})).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    expect(screen.getByRole('link', {name: /sign in/i})).toHaveAttribute('href', '/login');
  });

  it('calls api.auth.register and navigates to /login on success', async () => {
    mockRegister.mockResolvedValueOnce({id: '1', email: 'u@test.com', role: 'patient'});
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );
    await user.type(screen.getByPlaceholderText('you@example.com'), 'u@test.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password1');
    await user.click(screen.getByRole('button', {name: /create account/i}));
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('u@test.com', 'password1', 'patient');
      expect(mockNavigate).toHaveBeenCalledWith('/login', {replace: true});
    });
  });

  it('shows error when registration returns 409', async () => {
    mockRegister.mockRejectedValueOnce(new Error('409 Conflict'));
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );
    await user.type(screen.getByPlaceholderText('you@example.com'), 'dup@test.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password12');
    await user.click(screen.getByRole('button', {name: /create account/i}));
    expect(await screen.findByText('Email already registered.')).toBeInTheDocument();
  });
});
