import authReducer, {
  setUser,
  clearError,
} from '../slices/authSlice';

describe('authSlice', () => {
  const initialState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  };

  const mockUser = {
    id: '1',
    email: 'test@test.com',
    name: 'Test User',
    user_type: 'tourist',
    is_guide: false,
    has_car: false,
    has_motorcycle: false,
  };

  it('should return the initial state', () => {
    const state = authReducer(undefined, { type: 'unknown' });
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should handle setUser', () => {
    const actual = authReducer(initialState, setUser(mockUser));

    expect(actual.user).toEqual(mockUser);
    expect(actual.isAuthenticated).toBe(true);
  });

  it('should handle clearError', () => {
    const stateWithError = {
      ...initialState,
      error: 'Some error',
    };

    const actual = authReducer(stateWithError, clearError());

    expect(actual.error).toBeNull();
  });

  it('should handle login.fulfilled', () => {
    const action = {
      type: 'auth/login/fulfilled',
      payload: mockUser,
    };

    const actual = authReducer(initialState, action);

    expect(actual.user).toEqual(mockUser);
    expect(actual.isAuthenticated).toBe(true);
    expect(actual.isLoading).toBe(false);
  });

  it('should handle login.rejected', () => {
    const action = {
      type: 'auth/login/rejected',
      payload: 'Login failed',
    };

    const actual = authReducer(initialState, action);

    expect(actual.error).toBe('Login failed');
    expect(actual.isLoading).toBe(false);
  });

  it('should handle logout.fulfilled', () => {
    const loggedInState = {
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    };

    const action = { type: 'auth/logout/fulfilled' };
    const actual = authReducer(loggedInState, action);

    expect(actual.user).toBeNull();
    expect(actual.isAuthenticated).toBe(false);
  });
});
