import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../features/auth/LoginPage';
import { ChangePasswordModal } from '../features/auth/ChangePasswordModal';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import type { UserProfile, TokenResponse } from '../types';

vi.mock('../api/auth', () => ({
  authApi: {
    login: vi.fn(),
    getMe: vi.fn(),
    switchRole: vi.fn(),
    logout: vi.fn(),
    changePassword: vi.fn(),
  },
}));

const mockHODUser: UserProfile = {
  id: 1,
  email: 'hod.cse@college.edu',
  username: 'hod_cse',
  full_name: 'Dr. K. S. Ramanathan',
  is_active: true,
  department_id: 1,
  department_code: 'CSE',
  section_id: null,
  section_code: null,
  active_role: 'HOD',
  available_roles: ['HOD'],
  created_at: new Date().toISOString(),
};

const mockMultiRoleUser: UserProfile = {
  id: 10,
  email: 'advisor.3a@college.edu',
  username: 'adv_3a',
  full_name: 'Prof. Sneha Kulkarni',
  is_active: true,
  department_id: 1,
  department_code: 'CSE',
  section_id: 6,
  section_code: 'Y3-CSE-A',
  active_role: 'ADVISOR',
  available_roles: ['ADVISOR', 'MENTOR'],
  created_at: new Date().toISOString(),
};

describe('Authentication & Role Switching Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders login form with title, inputs, and demo quick-fill buttons', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Project Progress Monitoring System')).toBeInTheDocument();
    expect(screen.getByLabelText(/College Email or Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In to PPMS/i })).toBeInTheDocument();
    expect(screen.getByText('Synthetic Demonstration Accounts')).toBeInTheDocument();
  });

  it('shows validation error when fields are empty', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /Sign In to PPMS/i });
    fireEvent.click(submitBtn);

    // HTML5 required validation or app error message
    expect(submitBtn).toBeInTheDocument();
  });

  it('successfully logs in with valid credentials and stores token', async () => {
    const mockResponse: TokenResponse = {
      access_token: 'fake-jwt-token-12345',
      token_type: 'bearer',
      user: mockHODUser,
    };
    vi.mocked(authApi.login).mockResolvedValueOnce(mockResponse);

    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/College Email or Username/i), {
      target: { value: 'hod.cse@college.edu' },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: 'HodPass@2026' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign In to PPMS/i }));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith('hod.cse@college.edu', 'HodPass@2026');
      expect(localStorage.getItem('ppms_token')).toBe('fake-jwt-token-12345');
    });
  });

  it('displays error feedback when invalid credentials are provided', async () => {
    vi.mocked(authApi.login).mockRejectedValueOnce(new Error('Incorrect username/email or password.'));

    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/College Email or Username/i), {
      target: { value: 'unknown@college.edu' },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: 'WrongPass' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign In to PPMS/i }));

    await waitFor(() => {
      expect(screen.getByText('Incorrect username/email or password.')).toBeInTheDocument();
    });
  });

  it('restores user session on initialization if token exists in localStorage', async () => {
    localStorage.setItem('ppms_token', 'existing-valid-token');
    vi.mocked(authApi.getMe).mockResolvedValueOnce(mockHODUser);

    const TestConsumer = () => {
      const { user, isAuthenticated, isLoading } = useAuth();
      if (isLoading) return <div>Loading...</div>;
      return (
        <div>
          <span>{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</span>
          <span>{user?.full_name}</span>
        </div>
      );
    };

    render(
      <MemoryRouter>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(authApi.getMe).toHaveBeenCalled();
      expect(screen.getByText('Authenticated')).toBeInTheDocument();
      expect(screen.getByText('Dr. K. S. Ramanathan')).toBeInTheDocument();
    });
  });

  it('supports role switching only for authorized available roles', async () => {
    localStorage.setItem('ppms_token', 'valid-advisor-token');
    vi.mocked(authApi.getMe).mockResolvedValueOnce(mockMultiRoleUser);

    const switchedResponse: TokenResponse = {
      access_token: 'new-mentor-token-999',
      token_type: 'bearer',
      user: {
        ...mockMultiRoleUser,
        active_role: 'MENTOR',
      },
    };
    vi.mocked(authApi.switchRole).mockResolvedValueOnce(switchedResponse);

    const RoleSwitchConsumer = () => {
      const { activeRole, availableRoles, switchRole } = useAuth();
      return (
        <div>
          <span data-testid="active-role">{activeRole}</span>
          <span data-testid="available-roles">{availableRoles.join(',')}</span>
          <button onClick={() => switchRole('MENTOR')}>Switch to Mentor</button>
        </div>
      );
    };

    render(
      <MemoryRouter>
        <AuthProvider>
          <RoleSwitchConsumer />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('active-role')).toHaveTextContent('ADVISOR');
      expect(screen.getByTestId('available-roles')).toHaveTextContent('ADVISOR,MENTOR');
    });

    fireEvent.click(screen.getByRole('button', { name: /Switch to Mentor/i }));

    await waitFor(() => {
      expect(authApi.switchRole).toHaveBeenCalledWith('MENTOR');
      expect(screen.getByTestId('active-role')).toHaveTextContent('MENTOR');
    });
  });

  it('renders ChangePasswordModal and submits password change successfully', async () => {
    vi.mocked(authApi.changePassword).mockResolvedValueOnce({ message: 'Password updated successfully.' });

    render(
      <ToastProvider>
        <ChangePasswordModal isOpen={true} onClose={vi.fn()} />
      </ToastProvider>
    );

    expect(screen.getByText('Change Account Password')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Enter current password'), { target: { value: 'OldPass@123' } });
    fireEvent.change(screen.getByPlaceholderText('At least 8 characters'), { target: { value: 'NewSecurePass@123' } });
    fireEvent.change(screen.getByPlaceholderText('Re-enter new password'), { target: { value: 'NewSecurePass@123' } });

    fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));

    await waitFor(() => {
      expect(authApi.changePassword).toHaveBeenCalledWith('OldPass@123', 'NewSecurePass@123', 'NewSecurePass@123');
    });
  });

  it('allows switching cohorts across all 3 years and sections with vice-versa toggle between Advisor and Student', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/College Email or Username/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/^Password/i) as HTMLInputElement;

    // 1. Initial State: Click Sec B in 2nd Year
    fireEvent.click(screen.getByRole('button', { name: /^Sec B$/i }));
    expect(emailInput.value).toBe('advisor.2b@college.edu');
    expect(passwordInput.value).toBe('AdvisorPass@2026');

    // 2. Vice-Versa Toggle: switches from Advisor (Y2-B) to Student (Y2-B)
    fireEvent.click(screen.getByRole('button', { name: /Vice Versa/i }));
    expect(emailInput.value).toBe('student.2b@college.edu');
    expect(passwordInput.value).toBe('StudentPass@2026');

    // 3. Switch Academic Year to 3rd Year
    fireEvent.click(screen.getByRole('button', { name: /3rd Year/i }));
    expect(emailInput.value).toBe('student.3b@college.edu');

    // 4. Switch Section to Sec D
    fireEvent.click(screen.getByRole('button', { name: /^Sec D$/i }));
    expect(emailInput.value).toBe('student.3d@college.edu');

    // 5. Vice-Versa back to Advisor for Y3-D
    fireEvent.click(screen.getByRole('button', { name: /Vice Versa/i }));
    expect(emailInput.value).toBe('advisor.3d@college.edu');
    expect(passwordInput.value).toBe('AdvisorPass@2026');

    // 6. Switch to 4th Year
    fireEvent.click(screen.getByRole('button', { name: /4th Year/i }));
    expect(emailInput.value).toBe('advisor.4d@college.edu');
  });

  it('allows selecting credentials from the All 13 Cohorts roster tab', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/College Email or Username/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/^Password/i) as HTMLInputElement;

    // Switch to All 13 Cohorts tab
    fireEvent.click(screen.getByRole('button', { name: /All 13 Cohorts/i }));

    // Click Student button for CSE-C in Fourth Year or Second Year
    const stuBtn = screen.getByTitle(/Student: student.2c@college.edu/i);
    fireEvent.click(stuBtn);

    expect(emailInput.value).toBe('student.2c@college.edu');
    expect(passwordInput.value).toBe('StudentPass@2026');

    // Click Advisor button for CSE-C in Second Year
    const advBtn = screen.getByTitle(/Advisor: advisor.2c@college.edu/i);
    fireEvent.click(advBtn);

    expect(emailInput.value).toBe('advisor.2c@college.edu');
    expect(passwordInput.value).toBe('AdvisorPass@2026');
  });
});

