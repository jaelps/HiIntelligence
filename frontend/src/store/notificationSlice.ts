import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  severity: 'Critical' | 'Warning' | 'Informational';
  storeId: number | null;
  recommendedAction: string;
  timestamp: string;
  isRead: boolean;
}

interface NotificationState {
  items: NotificationItem[];
  unreadCount: number;
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<NotificationItem, 'isRead'>>) => {
      const newItem: NotificationItem = {
        ...action.payload,
        isRead: false,
      };
      // Insert at the beginning of the array
      state.items.unshift(newItem);
      state.unreadCount += 1;

      // Keep maximum 100 notifications in memory
      if (state.items.length > 100) {
        state.items.pop();
      }
    },
    markAsRead: (state, action: PayloadAction<number>) => {
      const item = state.items.find((n) => n.id === action.payload);
      if (item && !item.isRead) {
        item.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.items.forEach((item) => {
        item.isRead = true;
      });
      state.unreadCount = 0;
    },
    clearNotifications: (state) => {
      state.items = [];
      state.unreadCount = 0;
    },
  },
});

export const { addNotification, markAsRead, markAllAsRead, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
