import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  token: string | null;
  username: string | null;
  role: 'Administrator' | 'RegionalManager' | 'StoreManager' | null;
  assignedRegion: string | null;
  assignedStoreId: number | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  token: localStorage.getItem('token'),
  username: localStorage.getItem('username'),
  role: localStorage.getItem('role') as any || null,
  assignedRegion: localStorage.getItem('assignedRegion'),
  assignedStoreId: localStorage.getItem('assignedStoreId') 
    ? parseInt(localStorage.getItem('assignedStoreId')!) 
    : null,
  isAuthenticated: !!localStorage.getItem('token'),
};

interface LoginPayload {
  token: string;
  username: string;
  role: 'Administrator' | 'RegionalManager' | 'StoreManager';
  assignedRegion: string | null;
  assignedStoreId: number | null;
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<LoginPayload>) => {
      const { token, username, role, assignedRegion, assignedStoreId } = action.payload;
      
      state.token = token;
      state.username = username;
      state.role = role;
      state.assignedRegion = assignedRegion;
      state.assignedStoreId = assignedStoreId;
      state.isAuthenticated = true;

      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
      localStorage.setItem('role', role);
      if (assignedRegion) localStorage.setItem('assignedRegion', assignedRegion);
      if (assignedStoreId) localStorage.setItem('assignedStoreId', assignedStoreId.toString());
    },
    logout: (state) => {
      state.token = null;
      state.username = null;
      state.role = null;
      state.assignedRegion = null;
      state.assignedStoreId = null;
      state.isAuthenticated = false;

      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      localStorage.removeItem('assignedRegion');
      localStorage.removeItem('assignedStoreId');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
