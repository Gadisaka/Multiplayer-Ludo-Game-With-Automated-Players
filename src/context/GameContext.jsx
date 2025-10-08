import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import socket from "../socket";
import useUserStore from "../store/zutstand";

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [diceValue, setDiceValue] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [players, setPlayers] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [currentTurnKey, setCurrentTurnKey] = useState(null);
  const [gameStatus, setGameStatus] = useState("waiting");
  const [lastRoll, setLastRoll] = useState(null);
  const [error, setError] = useState(null);
  const [gameSettings, setGameSettings] = useState({
    stake: 50,
    requiredPieces: 2,
  });
  const [isLoadingGameSettings, setIsLoadingGameSettings] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  // New timer system
  const [turnTimeLeft, setTurnTimeLeft] = useState(90);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const timerRef = useRef(null);
  const [showTimer, setShowTimer] = useState(false);
  const [gameState, setGameState] = useState({
    pieces: {
      green: ["gh1", "gh2", "gh3", "gh4"],
      blue: ["bh1", "bh2", "bh3", "bh4"],
    },
  });

  // Debug: Log when gameSettings changes
  useEffect(() => {
    console.log("Context: gameSettings changed to:", gameSettings);
  }, [gameSettings]);

  // Debug: Log when setGameSettings is called
  const debugSetGameSettings = (newSettings) => {
    console.log("Context: setGameSettings called with:", newSettings);
    setGameSettings(newSettings);
  };
  const username = useUserStore((state) => state.username);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Load current user id (stable identity) for turn checks
  useEffect(() => {
    try {
      const persisted = localStorage.getItem("auth-storage");
      if (persisted) {
        const parsed = JSON.parse(persisted);
        const uid = parsed?.state?.user?.id || parsed?.state?.user?._id || null;
        setCurrentUserId(uid);
        if (uid) localStorage.setItem("current-user-id", uid);
        console.log(`[GameContext] Loaded userId from localStorage: ${uid}`);
      }
    } catch (e) {
      console.log("load current-user-id failed", e);
    }
  }, []);

  // Listen for socket user authentication to get the actual user ID
  useEffect(() => {
    const handleSocketUser = (user) => {
      const uid = user?.id || user?._id || null;
      if (uid && uid !== currentUserId) {
        setCurrentUserId(uid);
        try {
          localStorage.setItem("current-user-id", uid);
          console.log(`[GameContext] Updated userId from socket: ${uid}`);
        } catch (e) {
          console.log("persist current-user-id failed", e);
        }
      }
    };

    // Listen for socket user events (if the backend emits them)
    socket.on("user_authenticated", handleSocketUser);

    return () => {
      socket.off("user_authenticated", handleSocketUser);
    };
  }, [currentUserId]);

  // Persist identity for reconnect flow
  useEffect(() => {
    try {
      if (username) localStorage.setItem("current-username", username);
    } catch (e) {
      console.log("persist username failed", e);
    }
  }, [username]);

  // Stop timer
  const stopTimer = () => {
    console.log(`[NEW_TIMER] Stopping timer`);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setShowTimer(false);
    setTurnTimeLeft(90);
  };

  // Reset timer (when player rolls dice)
  const resetTurnTimer = () => {
    console.log(
      `[NEW_TIMER] Resetting timer - isMyTurn: ${isMyTurn}, gameStatus: ${gameStatus}, showTimer: ${showTimer}`
    );
    if (isMyTurn && gameStatus === "playing" && showTimer) {
      console.log(`[NEW_TIMER] Resetting timer to 90 seconds after dice roll`);
      setTurnTimeLeft(90);
    }
  };

  // Handle turn changes (use socket.id for consistency with backend)
  useEffect(() => {
    if (currentTurn) {
      const isMyTurnNow = socket.id === currentTurn;
      console.log(
        `[NEW_TIMER] Turn changed - isMyTurnNow: ${isMyTurnNow}, currentTurn: ${currentTurn}, socketId: ${socket.id}`
      );

      setIsMyTurn(isMyTurnNow);

      if (isMyTurnNow && gameStatus === "playing") {
        // Start timer inline to avoid dependency issues
        console.log(
          `[NEW_TIMER] Starting timer - isMyTurn: ${isMyTurnNow}, gameStatus: ${gameStatus}`
        );

        // Clear any existing timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        setShowTimer(true);
        setTurnTimeLeft(90);

        timerRef.current = setInterval(() => {
          setTurnTimeLeft((prev) => {
            console.log(`[NEW_TIMER] Countdown: ${prev}`);
            if (prev <= 1) {
              console.log(`[NEW_TIMER] Time's up!`);
              setError("Time's up! Your turn has ended.");
              setShowTimer(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        stopTimer();
      }
    }
  }, [currentTurn, gameStatus]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const rollDice = (roomId, socket) => {
    if (!roomId) return setError("You must be in a room to roll!");
    if (isRolling) return;
    if (socket.id !== currentTurn) return setError("Not your turn!");
    if (gameStatus !== "playing") return setError("Game hasn't started yet!");

    setIsRolling(true);
    setError("");

    // Reset timer since player is taking action
    resetTurnTimer();

    socket.emit("roll_dice", { roomId });
  };

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      console.log(`[GameContext] Socket connected with ID: ${socket.id}`);
      // If we have a room ID and username, try to reconnect
      if (currentRoomId && username) {
        console.log(
          `[GameContext] Attempting to reconnect to room ${currentRoomId} as ${username}`
        );
        socket.emit("reconnect_to_room", {
          roomId: currentRoomId,
          playerName: username,
        });
        socket.emit("sync_state", { roomId: currentRoomId });
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [currentRoomId, username]);

  useEffect(() => {
    // CRITICAL: Debounce room_update events in GameContext as well
    let gameContextRoomUpdateTimeout;

    socket.on("room_update", (data) => {
      console.log("Room update received in GameContext:", data);

      // Clear previous timeout
      if (gameContextRoomUpdateTimeout) {
        clearTimeout(gameContextRoomUpdateTimeout);
      }

      // Debounce rapid room updates (especially during bot joining)
      gameContextRoomUpdateTimeout = setTimeout(() => {
        console.log("[GameContext] Processing debounced room_update:", {
          players: data.players?.length || 0,
          currentTurn: data.currentTurn,
          gameStatus: data.gameStatus,
          hasGameSettings: !!data.gameSettings,
        });

        setPlayers(data.players);
        setCurrentTurn(data.currentTurn);
        if (data.currentTurnKey) {
          setCurrentTurnKey(data.currentTurnKey);
          console.log(
            `[GameContext] Received currentTurnKey: ${data.currentTurnKey}, currentUserId: ${currentUserId}`
          );
        }
        setGameStatus(data.gameStatus);
        if (data.gameSettings) {
          console.log("Updating game settings:", data.gameSettings);
          setGameSettings(data.gameSettings);
          setIsLoadingGameSettings(false);
        }
      }, 50); // 50ms debounce to handle rapid bot join events
    });

    // Listen for fresh game data
    socket.on("gameData", (data) => {
      console.log("Fresh game data received in context:", data);
      if (data.gameSettings) {
        console.log("Context: Setting game settings to:", data.gameSettings);
        setGameSettings(data.gameSettings);
        setIsLoadingGameSettings(false);
        console.log("Context: Game settings updated, loading set to false");
      }
      if (data.players) setPlayers(data.players);
      if (data.currentTurn) setCurrentTurn(data.currentTurn);
      if (data.currentTurnKey) setCurrentTurnKey(data.currentTurnKey);
      if (data.gameStatus) setGameStatus(data.gameStatus);
      if (data.lastRoll) setLastRoll(data.lastRoll);
      if (data.gameState) {
        console.log("Context: Setting game state to:", data.gameState);
        setGameState(data.gameState);
      }
    });

    // Apply sync_state without mutating server turn
    socket.on("sync_state", (data) => {
      console.log("Sync state received:", data);
      if (data.players) setPlayers(data.players);
      if (data.currentTurn) setCurrentTurn(data.currentTurn);
      if (data.currentTurnKey) {
        setCurrentTurnKey(data.currentTurnKey);
        console.log(
          `[GameContext] Sync received currentTurnKey: ${data.currentTurnKey}, currentUserId: ${currentUserId}`
        );
      }
      if (data.gameStatus) setGameStatus(data.gameStatus);
      if (data.lastRoll) setLastRoll(data.lastRoll);
      if (data.gameSettings) setGameSettings(data.gameSettings);
      if (data.gameState) setGameState(data.gameState);
    });

    socket.on("room_created", (data) => {
      console.log("Room created data received:", data);
      setCurrentRoomId(data.roomId);
      setGameSettings(data.gameSettings);
      try {
        localStorage.setItem("current-room-id", data.roomId);
      } catch (e) {
        console.log("persist room id failed", e);
      }
    });

    socket.on("player_reconnected", (data) => {
      console.log(`${data.playerName} has reconnected`);
    });

    return () => {
      socket.off("room_update");
      socket.off("gameData");
      socket.off("sync_state");
      socket.off("room_created");
      socket.off("player_reconnected");
    };
  }, [currentUserId]);

  // Add this effect to reset game state when game status changes to "playing"
  useEffect(() => {
    if (gameStatus === "playing") {
      // Reset game state to initial positions when game starts
      console.log(
        "[GameContext] Game started, resetting game state to initial positions"
      );
      setGameState({
        pieces: {
          green: ["gh1", "gh2", "gh3", "gh4"],
          blue: ["bh1", "bh2", "bh3", "bh4"],
        },
      });
    }
  }, [gameStatus]);

  // Also listen for game state reset events from backend
  useEffect(() => {
    socket.on("game_state_reset", (data) => {
      console.log("[GameContext] Received game state reset from server:", data);
      if (data.gameState) {
        setGameState(data.gameState);
      }
    });

    return () => {
      socket.off("game_state_reset");
    };
  }, []);

  const contextValue = {
    value: diceValue,
    setValue: setDiceValue,
    isRolling,
    setIsRolling,
    players,
    setPlayers,
    currentTurn,
    setCurrentTurn,
    gameStatus,
    setGameStatus,
    lastRoll,
    setLastRoll,
    error,
    setError,
    gameSettings,
    setGameSettings: debugSetGameSettings,
    isLoadingGameSettings,
    isConnected,
    setIsConnected,
    rollDice,
    currentRoomId,
    setCurrentRoomId,
    turnTimeLeft,
    isMyTurn,
    showTimer,
    resetTurnTimer,
    gameState,
    setGameState,
    currentTurnKey,
    setCurrentTurnKey,
  };

  return (
    <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
