import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import { API_URL } from "../../constants.js";
import socket from "../socket.js";

const useWalletStore = create(
  persist(
    (set) => ({
      balance: 0,
      transactions: [],
      notifications: [],
      unreadCount: 0,
      loading: false,
      error: null,

      // Set balance
      setBalance: (balance) => set({ balance }),

      // Get wallet balance
      getBalance: async () => {
        try {
          set({ loading: true, error: null });
          const token = JSON.parse(localStorage.getItem("auth-storage"))?.state
            ?.token;

          if (!token) {
            throw new Error("No authentication token");
          }

          const response = await axios.get(`${API_URL}/wallet/balance`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          set({
            balance: response.data.balance,
            loading: false,
          });

          return response.data.balance;
        } catch (error) {
          console.error("Error fetching balance:", error);
          // Don't throw error for balance fetch, just set loading to false
          set({
            error: error.response?.data?.message || "Failed to fetch balance",
            loading: false,
          });
          return 0;
        }
      },

      // Deposit funds
      deposit: async (amount, paymentMethod, phoneNumber) => {
        try {
          set({ loading: true, error: null });
          const token = JSON.parse(localStorage.getItem("auth-storage"))?.state
            ?.token;

          if (!token) {
            throw new Error("No authentication token");
          }

          const response = await axios.post(
            `${API_URL}/wallet/deposit`,
            {
              amount: parseFloat(amount),
              paymentMethod,
              phoneNumber,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          // Update balance
          set({
            balance: response.data.newBalance,
            loading: false,
          });

          // Emit socket event to get real-time updates
          socket.emit("get_wallet_balance");

          return response.data;
        } catch (error) {
          console.error("Error depositing funds:", error);
          set({
            error: error.response?.data?.message || "Failed to process deposit",
            loading: false,
          });
          throw error;
        }
      },

      // Withdraw funds
      withdraw: async (amount, withdrawalMethod, accountDetails) => {
        try {
          set({ loading: true, error: null });
          const token = JSON.parse(localStorage.getItem("auth-storage"))?.state
            ?.token;

          if (!token) {
            throw new Error("No authentication token");
          }

          const response = await axios.post(
            `${API_URL}/wallet/withdraw`,
            {
              amount: parseFloat(amount),
              withdrawalMethod,
              accountDetails,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          // Update balance (balance is always deducted for withdrawals)
          set({
            balance: response.data.newBalance,
            loading: false,
          });

          // Emit socket event to get real-time updates
          socket.emit("get_wallet_balance");

          return response.data;
        } catch (error) {
          console.error("Error withdrawing funds:", error);
          set({
            error:
              error.response?.data?.message || "Failed to process withdrawal",
            loading: false,
          });
          throw error;
        }
      },

      // Get transaction history
      getTransactions: async (page = 1, limit = 10) => {
        try {
          set({ loading: true, error: null });
          const token = JSON.parse(localStorage.getItem("auth-storage"))?.state
            ?.token;

          if (!token) {
            throw new Error("No authentication token");
          }

          const response = await axios.get(
            `${API_URL}/wallet/transactions?page=${page}&limit=${limit}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          set({
            transactions: response.data.transactions,
            loading: false,
          });

          return response.data;
        } catch (error) {
          console.error("Error fetching transactions:", error);
          set({
            error:
              error.response?.data?.message || "Failed to fetch transactions",
            loading: false,
          });
          throw error;
        }
      },

      // Get notifications
      getNotifications: async (page = 1, limit = 20) => {
        try {
          set({ loading: true, error: null });
          const token = JSON.parse(localStorage.getItem("auth-storage"))?.state
            ?.token;

          if (!token) {
            throw new Error("No authentication token");
          }

          const response = await axios.get(
            `${API_URL}/wallet/notifications?page=${page}&limit=${limit}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          set({
            notifications: response.data.notifications,
            unreadCount: response.data.unreadCount,
            loading: false,
          });

          return response.data;
        } catch (error) {
          console.error("Error fetching notifications:", error);
          set({
            error:
              error.response?.data?.message || "Failed to fetch notifications",
            loading: false,
          });
          throw error;
        }
      },

      // Mark notification as read
      markNotificationAsRead: async (notificationId) => {
        try {
          const token = JSON.parse(localStorage.getItem("auth-storage"))?.state
            ?.token;

          if (!token) {
            throw new Error("No authentication token");
          }

          await axios.put(
            `${API_URL}/wallet/notifications/${notificationId}/read`,
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          // Update local state
          set((state) => ({
            notifications: state.notifications.map((notification) =>
              notification._id === notificationId
                ? { ...notification, status: "READ" }
                : notification
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          }));
        } catch (error) {
          console.error("Error marking notification as read:", error);
          throw error;
        }
      },

      // Mark all notifications as read
      markAllNotificationsAsRead: async () => {
        try {
          const token = JSON.parse(localStorage.getItem("auth-storage"))?.state
            ?.token;

          if (!token) {
            throw new Error("No authentication token");
          }

          await axios.put(
            `${API_URL}/wallet/notifications/read-all`,
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          // Update local state
          set((state) => ({
            notifications: state.notifications.map((notification) => ({
              ...notification,
              status: "READ",
            })),
            unreadCount: 0,
          }));
        } catch (error) {
          console.error("Error marking all notifications as read:", error);
          throw error;
        }
      },

      // Add notification (for real-time updates)
      addNotification: (notification) => {
        console.log("Adding notification to store:", notification);
        set((state) => {
          const newState = {
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
          };
          console.log("Updated unreadCount:", newState.unreadCount);
          return newState;
        });
      },

      // Update balance (for real-time updates)
      updateBalance: (newBalance) => {
        set({ balance: newBalance });
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Reset store
      reset: () =>
        set({
          balance: 0,
          transactions: [],
          notifications: [],
          unreadCount: 0,
          loading: false,
          error: null,
        }),
    }),
    { name: "wallet-storage" }
  )
);

export default useWalletStore;
