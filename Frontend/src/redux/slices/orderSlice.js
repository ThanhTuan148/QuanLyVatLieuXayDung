// src/redux/slices/orderSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  orders: [],
  isLoading: false,
  error: null,
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    fetchOrdersStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchOrdersSuccess: (state, action) => {
      state.isLoading = false;
      state.orders = action.payload;
    },
    fetchOrdersFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    addOrder: (state, action) => {
      state.orders.push(action.payload);
    },
    updateOrder: (state, action) => {
      const index = state.orders.findIndex(o => o.orderId === action.payload.orderId);
      if (index !== -1) {
        state.orders[index] = action.payload;
      }
    },
    deleteOrder: (state, action) => {
      state.orders = state.orders.filter(o => o.orderId !== action.payload);
    },
  },
});

export const {
  fetchOrdersStart,
  fetchOrdersSuccess,
  fetchOrdersFailure,
  addOrder,
  updateOrder,
  deleteOrder,
} = orderSlice.actions;

export default orderSlice.reducer;
