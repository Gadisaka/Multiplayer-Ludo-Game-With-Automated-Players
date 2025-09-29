import { useEffect } from "react";
import socket from "../socket.js";
import useWalletStore from "../store/walletStore.js";

const useWalletSocket = () => {
  const { updateBalance, addNotification, getBalance, getNotifications } =
    useWalletStore();

  useEffect(() => {
    // Listen for wallet balance updates
    const handleWalletUpdate = (data) => {
      console.log("Wallet update received:", data);
      updateBalance(data.balance);

      // Refresh balance and notifications
      getBalance();
      getNotifications();
    };

    // Listen for new notifications
    const handleNewNotification = (data) => {
      console.log("New notification received:", data);
      addNotification({
        _id: data.notificationId,
        message: data.message,
        type: data.type || "SUCCESS",
        status: "UNREAD",
        createdAt: new Date(),
      });
    };

    // Get user ID from localStorage
    const getUser = () => {
      try {
        const persisted = localStorage.getItem("auth-storage");
        if (persisted) {
          const parsed = JSON.parse(persisted);
          return parsed?.state?.user;
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
      return null;
    };

    // Set up socket listeners with a delay to ensure user data is available
    const setupSocketListeners = () => {
      const user = getUser();
      console.log("Socket user:", user);
      if (user?.id) {
        console.log(`Setting up socket listeners for user: ${user.id}`);
        // Listen for user-specific wallet updates
        socket.on(`wallet_update_${user.id}`, handleWalletUpdate);

        // Listen for user-specific notifications
        socket.on(`notification_${user.id}`, handleNewNotification);
      } else {
        console.log("No user ID found, retrying in 1 second...");
        setTimeout(setupSocketListeners, 1000);
      }
    };

    setupSocketListeners();

    // Listen for general wallet events
    socket.on("wallet_balance", (data) => {
      console.log("Wallet balance received:", data);
      updateBalance(data.balance);
    });

    socket.on("transactions_list", (data) => {
      console.log("Transactions list received:", data);
      // You can add a setTransactions function to the store if needed
    });

    socket.on("notifications_list", (data) => {
      console.log("Notifications list received:", data);
      // You can add a setNotifications function to the store if needed
    });

    // Cleanup function
    return () => {
      const user = getUser();
      if (user?.id) {
        socket.off(`wallet_update_${user.id}`, handleWalletUpdate);
        socket.off(`notification_${user.id}`, handleNewNotification);
      }
      socket.off("wallet_balance", handleWalletUpdate);
      socket.off("transactions_list");
      socket.off("notifications_list");
    };
  }, [updateBalance, addNotification, getBalance, getNotifications]);

  // Function to request wallet balance
  const requestBalance = () => {
    socket.emit("get_wallet_balance");
  };

  // Function to request transactions
  const requestTransactions = () => {
    socket.emit("get_transactions");
  };

  // Function to request notifications
  const requestNotifications = () => {
    socket.emit("get_notifications");
  };

  // Function to mark notification as read
  const markNotificationRead = (notificationId) => {
    socket.emit("mark_notification_read", { notificationId });
  };

  // Function to mark all notifications as read
  const markAllNotificationsRead = () => {
    socket.emit("mark_all_notifications_read");
  };

  return {
    requestBalance,
    requestTransactions,
    requestNotifications,
    markNotificationRead,
    markAllNotificationsRead,
  };
};

export default useWalletSocket;
