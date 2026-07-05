import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  accessToken: localStorage.getItem('accessToken') || null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { accessToken, user } = action.payload;
      if (accessToken) {
        state.accessToken = accessToken;
        state.isAuthenticated = true;
        localStorage.setItem('accessToken', accessToken);
      }
      if (user) {
        state.user = user;
      }
      state.error = null;
    },
    updateUserSuccess: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('accessToken');
    },
    setAuthError: (state, action) => {
      state.error = action.payload;
    },
    clearAuthError: (state) => {
      state.error = null;
    }
  },
});

export const { setCredentials, updateUserSuccess, logout, setAuthError, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
