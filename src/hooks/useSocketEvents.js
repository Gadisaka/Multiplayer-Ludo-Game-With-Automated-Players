// src/hooks/useSocketEvents.js
import { useEffect } from "react";
import socket from "../socket";
import { useGame } from "../context/GameContext";

const useSocketEvents = (roomId) => {
  const {
    setPlayers,
    setCurrentTurn,
    setGameStatus,
    setLastRoll,
    setValue,
    setIsRolling,
    setError,
    setIsConnected,
    setGameSettings,
  } = useGame();

  // Debug: Log the setGameSettings function reference
  console.log("useSocketEvents: setGameSettings function:", setGameSettings);

  useEffect(() => {
    socket.on("connect", () => {
      setIsConnected(true);
      setError("");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      setError("Disconnected from server. Trying to reconnect...");
    });

    // CRITICAL: Debounce room_update events to prevent rapid state changes
    let roomUpdateTimeout;
    socket.on(
      "room_update",
      ({ players, currentTurn, gameStatus, lastRoll, gameSettings }) => {
        // Clear previous timeout
        if (roomUpdateTimeout) {
          clearTimeout(roomUpdateTimeout);
        }

        // Debounce rapid room updates (especially during bot joining)
        roomUpdateTimeout = setTimeout(() => {
          console.log("[useSocketEvents] Processing debounced room_update:", {
            players: players?.length || 0,
            currentTurn,
            gameStatus,
            hasGameSettings: !!gameSettings,
          });

          setPlayers(players);
          setCurrentTurn(currentTurn);
          setGameStatus(gameStatus);
          setLastRoll(lastRoll);
          if (gameSettings) {
            setGameSettings(gameSettings);
          }
          setIsRolling(false);
          setError("");
        }, 50); // 50ms debounce to handle rapid bot join events
      }
    );

    // Listen for fresh game data (when component loads or game changes)
    socket.on("gameData", (gameData) => {
      console.log("Received fresh game data:", gameData);

      // Always overwrite with fresh data
      if (gameData.gameSettings) {
        console.log("Setting game settings in context:", gameData.gameSettings);
        console.log("About to call setGameSettings function:", setGameSettings);
        setGameSettings(gameData.gameSettings);
        console.log("setGameSettings function called");
      }
      if (gameData.players) {
        console.log("Setting players in context:", gameData.players);
        setPlayers(gameData.players);
      }
      if (gameData.currentTurn) {
        console.log("Setting current turn in context:", gameData.currentTurn);
        setCurrentTurn(gameData.currentTurn);
      }
      if (gameData.gameStatus) {
        console.log("Setting game status in context:", gameData.gameStatus);
        setGameStatus(gameData.gameStatus);
      }
      if (gameData.lastRoll) {
        console.log("Setting last roll in context:", gameData.lastRoll);
        setLastRoll(gameData.lastRoll);
      }
    });

    // Listen for room info updates (when component loads)
    socket.on(
      "room_info",
      ({ gameSettings, players, currentTurn, gameStatus }) => {
        if (gameSettings) {
          setGameSettings(gameSettings);
        }
        if (players) setPlayers(players);
        if (currentTurn) setCurrentTurn(currentTurn);
        if (gameStatus) setGameStatus(gameStatus);
      }
    );

    // Listen for game status changes
    socket.on("game_status_changed", ({ status, message }) => {
      setGameStatus(status);
      setError(message);
      // Clear the message after 5 seconds
      setTimeout(() => setError(""), 5000);
    });

    // Listen for player disconnection
    socket.on("player_disconnected", ({ playerName, timeout }) => {
      setError(
        `${playerName} has disconnected. They have ${timeout} seconds to reconnect.`
      );
    });

    // Listen for player reconnection
    socket.on("player_reconnected", ({ playerName }) => {
      setError(`${playerName} has reconnected!`);
      // Clear the error message after 3 seconds
      setTimeout(() => setError(""), 3000);
    });

    // Listen for auto-play (for disconnected player)
    socket.on("auto_play", ({ playerColor, value, moved, pieceIndex }) => {
      setIsRolling(false);
      setValue(value);
      setError(
        `Auto-play: ${playerColor} rolled ${value}${
          moved ? ` and moved piece ${pieceIndex}` : " but could not move"
        }`
      );
      setTimeout(() => setError(""), 2000);
    });

    // Listen for player lost due to disconnect
    socket.on("player_lost_due_to_disconnect", ({ playerColor }) => {
      setError(`Player (${playerColor}) lost due to disconnect.`);
      setTimeout(() => setError(""), 4000);
    });

    // listed for while the die is rolling
    socket.on("rolling_dice", () => {
      setIsRolling(true);
      setError("");
    });

    socket.on("roll_dice", ({ value }) => {
      setValue(value);
      setIsRolling(false);
      setError("");
    });

    socket.on("error_message", (msg) => {
      setError(msg);
      setIsRolling(false);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("room_update");
      socket.off("room_info");
      socket.off("gameData");
      socket.off("roll_dice");
      socket.off("error_message");
      socket.off("player_disconnected");
      socket.off("player_reconnected");
      socket.off("game_status_changed");
      socket.off("auto_play");
      socket.off("player_lost_due_to_disconnect");
      socket.off("rolling_dice");
    };
  }, [roomId]);
};

export default useSocketEvents;
