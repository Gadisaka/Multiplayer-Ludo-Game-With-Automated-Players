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

  // Handle turn changes
  useEffect(() => {
    if (currentTurn) {
      const isMyTurnNow = socket.id === currentTurn;
      console.log(
        `[NEW_TIMER] Turn changed - isMyTurnNow: ${isMyTurnNow}, currentTurn: ${currentTurn}`
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
    socket.on("room_update", (data) => {
      console.log("Room update received:", data);
      setPlayers(data.players);
      setCurrentTurn(data.currentTurn);
      setGameStatus(data.gameStatus);
      if (data.gameSettings) {
        console.log("Updating game settings:", data.gameSettings);
        setGameSettings(data.gameSettings);
        setIsLoadingGameSettings(false);
      }
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
      if (data.gameStatus) setGameStatus(data.gameStatus);
      if (data.lastRoll) setLastRoll(data.lastRoll);
      if (data.gameState) {
        console.log("Context: Setting game state to:", data.gameState);
        setGameState(data.gameState);
      }
    });

    socket.on("room_created", (data) => {
      console.log("Room created data received:", data);
      setCurrentRoomId(data.roomId);
      setGameSettings(data.gameSettings);
    });

    socket.on("player_reconnected", (data) => {
      console.log(`${data.playerName} has reconnected`);
    });

    return () => {
      socket.off("room_update");
      socket.off("gameData");
      socket.off("room_created");
      socket.off("player_reconnected");
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
