import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import useAuthStore from "../store/authStore";

const useAccountDeactivation = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  useEffect(() => {
    // Handle account deactivation
    const handleAccountDeactivated = (data) => {
      console.log("Account deactivated:", data);

      // Show a prominent notification
      const notification = document.createElement("div");
      notification.className =
        "fixed top-0 left-0 right-0 z-50 bg-red-600 text-white p-4 text-center font-semibold shadow-lg";
      notification.innerHTML = `
        <div class="flex items-center justify-center gap-3">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
          <span>${data.message}</span>
        </div>
      `;
      document.body.appendChild(notification);

      // Logout user and redirect to login
      setTimeout(() => {
        logout();
        navigate("/login", {
          state: {
            message:
              "Your account has been deactivated. Please contact support.",
            type: "error",
          },
        });
      }, 3000); // Give user 3 seconds to read the message

      // Remove notification after 5 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 5000);
    };

    // Handle player kicked from game
    const handlePlayerKicked = (data) => {
      console.log("Player kicked:", data);

      // Show notification about player being kicked
      const notification = document.createElement("div");
      notification.className =
        "fixed top-16 left-4 right-4 z-40 bg-orange-500 text-white p-3 rounded-lg shadow-lg";
      notification.innerHTML = `
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>A player was removed from the game: ${data.reason}</span>
        </div>
      `;
      document.body.appendChild(notification);

      // Remove notification after 5 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 5000);
    };

    // Set up socket event listeners
    socket.on("account_deactivated", handleAccountDeactivated);
    socket.on("player_kicked", handlePlayerKicked);

    // Cleanup function
    return () => {
      socket.off("account_deactivated", handleAccountDeactivated);
      socket.off("player_kicked", handlePlayerKicked);
    };
  }, [navigate, logout]);

  return null; // This hook doesn't return anything, it just sets up listeners
};

export default useAccountDeactivation;
