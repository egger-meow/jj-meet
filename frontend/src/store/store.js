import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import swipeReducer from './slices/swipeSlice';
import matchReducer from './slices/matchSlice';
import chatReducer from './slices/chatSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    swipe: swipeReducer,
    match: matchReducer,
    chat: chatReducer,
  },
});
