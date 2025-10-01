import React, { useState, useEffect, useRef } from "react";
import DieRollingPage from "./Dierollingbutton";
import LudoBoard from "./Ludoboard";
import socket from "../socket";
import { useGame } from "../context/GameContext";
import useSocketEvents from "../hooks/useSocketEvents";
import useAdsStore from "../store/adsStore";
import bg from "../assets/Picsart_25-06-24_16-26-17-659.jpg";
import { crown } from "./Dies";
import coin from "../assets/coin.png";
import { useParams, useNavigate } from "react-router-dom";
import { API_URL } from "../../constants";
import useUserStore from "../store/zutstand";
import useAuthStore from "../store/authStore";

const PlayingPage = () => {
  const { gameID: roomId } = useParams();
  const navigate = useNavigate();
  // Timer state
  const [waitingTime, setWaitingTime] = useState(0);
  const timerRef = useRef(null);
  const MAX_WAITING_TIME = 50; // Maximum waiting time in seconds (1 minute)

  // Leave countdown state
  const [showLeaveCountdown, setShowLeaveCountdown] = useState(false);
  const [leaveCountdown, setLeaveCountdown] = useState(60);
  const leaveTimerRef = useRef(null);

  // Cut percentage state
  const [cutPercentage, setCutPercentage] = useState(10); // Default 10%

  // Refreshing state
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Game finished state
  // const [showGameFinished, setShowGameFinished] = useState(false);

  const {
    value,
    isRolling,
    players,
    currentTurn,
    gameStatus,
    rollDice,
    gameSettings,
    isLoadingGameSettings,
    turnTimeLeft,
    isMyTurn,
    showTimer,
    setCurrentRoomId,
  } = useGame();

  // Ads store
  const { ads, fetchAds } = useAdsStore();

  // User store
  const usernameFromUserStore = useUserStore((state) => state.username);

  // Auth store
  const { user } = useAuthStore();

  // Get username from multiple sources as fallback
  const getUsername = () => {
    if (usernameFromUserStore) return usernameFromUserStore;
    if (user?.username) return user.username;

    // Try to get from localStorage as last resort
    try {
      const persisted = localStorage.getItem("auth-storage");
      if (persisted) {
        const parsed = JSON.parse(persisted);
        return parsed?.state?.user?.username || "";
      }
    } catch (error) {
      console.error("Error parsing auth storage:", error);
    }

    return "";
  };

  const username = getUsername();

  // Calculate winnings (2 * stake - cut percentage)
  const calculateWinnings = (stake, cutPercentage = 10) => {
    if (!stake) return 0;
    return 2 * stake - (2 * stake * cutPercentage) / 100;
  };

  // Fetch cut percentage from backend
  const fetchCutPercentage = async () => {
    try {
      const response = await fetch(
        `${API_URL}/admin/settings/GAME_CUT_PERCENTAGE`
      );
      if (response.ok) {
        const data = await response.json();
        setCutPercentage(data.data.settingValue);
      }
    } catch (error) {
      console.error("Error fetching cut percentage:", error);
      // Keep default value of 10%
    }
  };

  // Debug: Log current game settings
  useEffect(() => {
    console.log(
      "PlayingPage - Current gameSettings from context:",
      gameSettings
    );
    console.log("PlayingPage - isLoadingGameSettings:", isLoadingGameSettings);
  }, [gameSettings, isLoadingGameSettings]);

  // Debug: Log gameStatus changes
  // useEffect(() => {
  //   console.log("🎮 PlayingPage - gameStatus changed:", gameStatus);
  //   console.log("🎮 PlayingPage - players:", players);
  //   console.log("🎮 PlayingPage - currentTurn:", currentTurn);

  // Redirect to lobby if game is finished
  //   if (gameStatus === "finished") {
  //     console.log("🎮 Game finished, redirecting to lobby...");
  //     setShowGameFinished(true);
  //     setTimeout(() => {
  //       navigate("/game");
  //     }, 5000); // Give user 5 seconds to see the result
  //   }
  // }, [gameStatus, players, currentTurn, navigate]);

  // Fetch ads on component mount
  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  // Simple hook for socket events
  useSocketEvents(roomId);

  // Note: Game settings are now managed entirely through the GameContext

  // Fetch latest game data when component mounts
  useEffect(() => {
    if (roomId) {
      // Set current room ID in context for reconnection
      setCurrentRoomId(roomId);

      // Emit socket event to get fresh game data
      socket.emit("getGameData", { gameId: roomId });
      console.log("Requesting fresh game data for room:", roomId);
    }
    // Fetch cut percentage
    fetchCutPercentage();
  }, [roomId, setCurrentRoomId]);

  // Timer effect: start when waiting, stop/reset otherwise
  useEffect(() => {
    if (gameStatus === "waiting" && players.length === 1) {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setWaitingTime((prev) => {
            if (prev >= MAX_WAITING_TIME) {
              // Stop timer when max waiting time is reached
              clearInterval(timerRef.current);
              timerRef.current = null;
              return MAX_WAITING_TIME;
            }
            return prev + 1;
          });
        }, 1000);
      }
    } else {
      setWaitingTime(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameStatus, players.length, MAX_WAITING_TIME]);

  function formatTime(seconds) {
    const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  function onLeaveGame() {
    // Debug logging to understand the issue
    console.log("🔍 onLeaveGame called:");
    console.log("   gameStatus:", gameStatus);
    console.log("   players:", players);
    console.log("   players.length:", players.length);
    console.log("   gameStatus === 'playing':", gameStatus === "playing");
    console.log("   players.length >= 2:", players.length >= 2);
    console.log(
      "   Should show countdown:",
      gameStatus === "playing" || players.length >= 2
    );

    // Only show countdown if game is actively playing (or has 2 players)
    if (gameStatus === "playing" || players.length >= 2) {
      console.log("✅ Starting leave countdown timer");
      setShowLeaveCountdown(true);
      setLeaveCountdown(60);

      // Start countdown timer
      leaveTimerRef.current = setInterval(() => {
        setLeaveCountdown((prev) => {
          if (prev <= 1) {
            // Timer finished - leave the game
            clearInterval(leaveTimerRef.current);
            setShowLeaveCountdown(false);
            handleLeaveRoom();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      console.log("❌ Game not playing, leaving immediately");
      console.log("   Current gameStatus:", gameStatus);
      // If game is waiting or not started, leave immediately
      handleLeaveRoom();
    }
  }

  function handleLeaveRoom() {
    console.log(`Leaving room ${roomId}`);
    socket.emit("leave_room", { roomId });
  }

  function cancelLeaveGame() {
    setShowLeaveCountdown(false);
    setLeaveCountdown(60);
    if (leaveTimerRef.current) {
      clearInterval(leaveTimerRef.current);
    }
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) {
        clearInterval(leaveTimerRef.current);
      }
    };
  }, []);

  // Socket event listeners for leave room responses and reconnection
  useEffect(() => {
    const handleRoomDeleted = (data) => {
      console.log("Room deleted:", data);
      navigate("/game");
    };

    const handleLeftRoom = (data) => {
      console.log("Left room:", data);
      navigate("/game");
    };

    const handlePlayerLeft = (data) => {
      console.log("Player left room:", data);
      // Handle other player leaving (not applicable for current user)
    };

    const handlePlayerReconnected = (data) => {
      console.log("Player reconnected event received:", data);
      // Refresh game data when any player reconnects
      socket.emit("getGameData", { gameId: roomId });
    };

    const handleGameData = (data) => {
      console.log("Fresh game data received in PlayingPage:", data);
      // This will be handled by the GameContext, but we can add additional logic here if needed
    };

    const handleReconnectSuccess = (data) => {
      console.log("Reconnection successful:", data);
    };

    const handleErrorMessage = (message) => {
      console.log("Error message received:", message);
      console.log("Current game state:", {
        currentTurn,
        socketId: socket.id,
        players,
        gameStatus,
        username,
        isMyTurn,
        socketConnected: socket.connected,
      });

      // Log error but don't attempt automatic recovery
      // Users can use the manual refresh button if needed
    };

    // Add event listeners
    socket.on("room_deleted", handleRoomDeleted);
    socket.on("left_room", handleLeftRoom);
    socket.on("player_left", handlePlayerLeft);
    socket.on("player_reconnected", handlePlayerReconnected);
    socket.on("gameData", handleGameData);
    socket.on("error_message", handleErrorMessage);
    socket.on("reconnect_success", handleReconnectSuccess);

    // Cleanup event listeners
    return () => {
      socket.off("room_deleted", handleRoomDeleted);
      socket.off("left_room", handleLeftRoom);
      socket.off("player_left", handlePlayerLeft);
      socket.off("player_reconnected", handlePlayerReconnected);
      socket.off("gameData", handleGameData);
      socket.off("error_message", handleErrorMessage);
      socket.off("reconnect_success", handleReconnectSuccess);
    };
  }, [navigate, roomId, username, currentTurn, gameStatus, isMyTurn, players]);

  // const [displayName, setDisplayName] = useState("");
  // {error && <p className="text-red-500 text-center">{error}</p>}

  return (
    <div className="text-white relative flex flex-col w-full h-screen justify- items-center py-8 px-4">
      <img
        src={bg}
        alt="bg"
        className="absolute top-0 left-0 min-h-screen w-full object-cover "
      />
      <div className="w-full  flex flex-col items-center px-4 space-y-2 z-100 ">
        {/* Show waiting message if game is waiting and only one player */}
        {gameStatus === "waiting" &&
          players.length === 1 &&
          waitingTime < MAX_WAITING_TIME && (
            <div className="w-full absolute top-1/3 flex flex-col justify-center items-center py-4 z-100">
              <span className="text-yellow-400 text-lg font-semibold bg-gray-900/80 px-6 py-2 rounded-lg shadow-lg border border-yellow-500/30 flex flex-col items-center">
                waiting for opponent to join...
                <span className="text-xs text-gray-300 mt-1">
                  Waiting time: {formatTime(waitingTime)}
                </span>
              </span>
            </div>
          )}
        {/* <div className="w-full flex justify-between items-center">
          <button
            onClick={onLeaveGame}
            className="px-3 py-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-100"
          >
            Leave Game
          </button>
          <p className="text-sm text-gray-300 z-100">
            Room ID: <b>{roomId}</b>
          </p>
        </div> */}

        {/* Game Settings Display */}
        <div className="w-full h-[50px] flex justify-center items-center gap-1 z-100">
          <button
            className=" rounded-full p-1 cursor-pointer "
            onClick={() => onLeaveGame()}
          >
            <svg
              width="30px"
              height="30px"
              viewBox="0 0 25 25"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="rotate-180 bg-red-500 rounded-full"
            >
              <path
                d="M16.5 15V19.5H5.5V5.5H16.5V10M10 12.5H22.5"
                stroke="#121923"
                stroke-width="1.2"
              />
              <path
                d="M20 10L22.5 12.5L20 15"
                stroke="#121923"
                stroke-width="1.2"
              />
            </svg>
          </button>

          {/* Reload Game Button */}
          <button
            className="rounded-full p-1 cursor-pointer transition-colors bg-yellow-500 hover:bg-yellow-600"
            onClick={() => {
              console.log("Manual recovery triggered");
              console.log("Current state:", {
                roomId,
                username,
                currentTurn,
                socketId: socket.id,
                players,
                socketConnected: socket.connected,
                gameStatus,
                isMyTurn,
              });

              // Show loading animation
              setIsRefreshing(true);

              // First ensure socket is connected
              if (!socket.connected) {
                console.log("Socket not connected, attempting to connect...");
                socket.connect();
                // Wait a bit for connection
                setTimeout(() => {
                  console.log("Socket connected, now sending reconnection...");
                  socket.emit("reconnect_to_room", {
                    roomId: roomId,
                    playerName: username || "unknown",
                  });
                  socket.emit("getGameData", { gameId: roomId });
                }, 1000);
              } else {
                console.log(
                  "Socket already connected, sending reconnection..."
                );
                socket.emit("reconnect_to_room", {
                  roomId: roomId,
                  playerName: username || "unknown",
                });
                socket.emit("getGameData", { gameId: roomId });
              }

              // Hide loading animation after 3 seconds
              setTimeout(() => {
                setIsRefreshing(false);
              }, 3000);
            }}
            title="Reload game and reconnect"
          >
            <svg
              width="20px"
              height="20px"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-white"
            >
              <path
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582M20 20v-5h-.581M19.418 9A7.978 7.978 0 0012 4c-3.042 0-5.824 1.721-7.418 4M4.582 15A7.978 7.978 0 0012 20c3.042 0 5.824-1.721 7.418-4"
              />
            </svg>
          </button>

          <div className="flex justify-between items-center px-5 text-xl font-bold text-gray-300 z-100 w-[80%] h-[50px] bg-gray-800/30 border rounded-lg border-white/20  backdrop-blur-md  ">
            <p className="flex gap-2 justify-center items-center">
              Prize:{" "}
              <b>
                {isLoadingGameSettings
                  ? "..."
                  : Math.round(
                      calculateWinnings(gameSettings?.stake, cutPercentage)
                    ) || "..."}
              </b>{" "}
              <img src={coin} alt="coin" className="w-6 h-6" />
            </p>
            <p className="flex gap-1 justify-center items-center">
              <b>
                {isLoadingGameSettings
                  ? "..."
                  : gameSettings?.requiredPieces || "..."}
              </b>{" "}
              ባነገሰ {crown}
            </p>
          </div>
        </div>
        <div className="w-[320px] h-[60px] bg-white rounded-lg text-black z-100 flex justify-center items-center overflow-hidden">
          {ads.ingamead ? (
            <img
              src={ads.ingamead.url || ads.ingamead}
              alt="In-Game Advertisement"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-gray-500 text-sm">Advertisement Space</span>
          )}
        </div>
      </div>
      <LudoBoard roomId={roomId} />

      <div className="flex w-full justify-center items-center z-100 gap-2 ">
        {/* First player (left) */}
        {players[0] && (
          <div
            key={players[0].id}
            className={`flex items-center justify-center py-2 w-[100px] h-fit rounded ${
              players[0].id === currentTurn
                ? "bg-blue-500/20"
                : "bg-gray-700/50"
            }`}
          >
            {players[0].id === currentTurn && <span>🎲</span>}
            <span
              className={`text-white text-xl font-bold ${
                players[0].id === currentTurn ? "text-yellow-500" : ""
              }`}
            >
              @{players[0].name}
            </span>
          </div>
        )}

        {/* DieRollingPage (center) */}
        <DieRollingPage
          value={value}
          isRolling={isRolling}
          isMyTurn={socket.id === currentTurn}
          gameStatus={gameStatus}
          onRoll={() => rollDice(roomId, socket)}
          players={players}
          currentTurn={currentTurn}
        />

        {/* Turn Countdown Timer - Progress Bar Only */}
        {showTimer && gameStatus === "playing" && isMyTurn && (
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-50">
            <div className=" px-6 py-3  ">
              <div className="w-48 bg-gray-900/50 rounded-full h-3">
                <div
                  className="bg-red-500 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${(turnTimeLeft / 90) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Second player (right) */}
        {players[1] && (
          <div
            key={players[1].id}
            className={`flex items-center justify-center py-2 w-[100px] h-fit rounded ${
              players[1].id === currentTurn
                ? "bg-blue-500/20"
                : "bg-gray-700/50"
            }`}
          >
            {players[1].id === currentTurn && <span>🎲</span>}
            <span
              className={`text-white text-xl font-bold ${
                players[1].id === currentTurn ? "text-yellow-500" : ""
              }`}
            >
              @{players[1].name}
            </span>
          </div>
        )}
      </div>

      {/* Reloading Game Overlay */}
      {isRefreshing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-gray-900/90 border border-gray-600 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-md max-w-md mx-4">
            <div className="mb-6">
              {/* Spinning reload icon */}
              <div className="flex justify-center mb-4">
                <svg
                  width="60px"
                  height="60px"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-yellow-500 animate-spin"
                >
                  <path
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582M20 20v-5h-.581M19.418 9A7.978 7.978 0 0012 4c-3.042 0-5.824 1.721-7.418 4M4.582 15A7.978 7.978 0 0012 20c3.042 0 5.824-1.721 7.418-4"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Reloading Game
              </h2>
              <p className="text-gray-300">
                Reconnecting and restoring game state...
              </p>
            </div>

            {/* Loading dots animation */}
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Game Finished Overlay */}

      {/* Leave Countdown Overlay */}
      {showLeaveCountdown && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-999">
          <div className="bg-gray-800/20 border border-gray-600 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-md max-w-md mx-4">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Leaving Game
              </h2>
              <p className="text-gray-300">You will leave the game in:</p>
            </div>

            <div className="mb-6">
              <div className="text-6xl font-bold text-red-400 mb-2">
                {Math.floor(leaveCountdown / 60)}:
                {String(leaveCountdown % 60).padStart(2, "0")}
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${((60 - leaveCountdown) / 60) * 100}%` }}
                ></div>
              </div>
            </div>

            <button
              onClick={cancelLeaveGame}
              className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-500 text-white px-6 py-3 rounded-lg transition-colors duration-200 font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayingPage;
