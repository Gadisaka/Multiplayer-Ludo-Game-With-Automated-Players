import React, { useState, useEffect, useRef } from "react";
import DieRollingPage from "./Dierollingbutton";
import LudoBoard from "./Ludoboard";
import socket from "../socket";
import { useGame } from "../context/GameContext";
import useSocketEvents from "../hooks/useSocketEvents";
import useAccountDeactivation from "../hooks/useAccountDeactivation";
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

  // Set up account deactivation monitoring
  useAccountDeactivation();
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
            navigate("/game");
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
      navigate("/game");
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
      console.log("Current game state when room deleted:", {
        gameStatus,
        players,
        currentTurn,
        roomId,
      });
      // Do NOT redirect automatically. Just log or show a message if you want.
    };

    const handleLeftRoom = (data) => {
      console.log("Left room:", data);
      // Redirect to the lobby or home page after leaving
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


  const handleRefresh = () => {
    console.log("Manual recovery triggered");
    setIsRefreshing(true);

    if (!socket.connected) {
      socket.connect();
      setTimeout(() => {
        socket.emit("reconnect_to_room", {
          roomId: roomId,
          playerName: username || "unknown",
          preserveTurn: true,
          currentTurn: currentTurn,
        });
        socket.emit("getGameData", { gameId: roomId });
      }, 1000);
    } else {
      socket.emit("reconnect_to_room", {
        roomId: roomId,
        playerName: username || "unknown",
        preserveTurn: true,
        currentTurn: currentTurn,
      });
      socket.emit("getGameData", { gameId: roomId });
    }

    setTimeout(() => {
      setIsRefreshing(false);
    }, 3000);
  };

  return (
    <div className="text-white relative flex flex-col w-full min-h-screen items-center py-6 px-3 overflow-hidden">
      <img
        src={bg}
        alt="bg"
        className="absolute top-0 left-0 min-h-screen w-full object-cover scale-105"
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(240,193,75,0.12),transparent_45%),linear-gradient(180deg,rgba(6,20,16,0.55),rgba(6,20,16,0.82))]" />
      <div className="arena-flag-beam" />

      <div className="w-full flex flex-col items-center px-2 space-y-2.5 z-10 animate-rise-in">
        {gameStatus === "waiting" &&
          players.length === 1 &&
          waitingTime < MAX_WAITING_TIME && (
            <div className="w-full absolute top-1/3 flex flex-col justify-center items-center py-4 z-20">
              <span className="font-display text-[#f0c14b] text-base font-semibold bg-[rgba(6,20,16,0.88)] px-6 py-3 rounded-2xl shadow-lg border border-[rgba(240,193,75,0.35)] flex flex-col items-center animate-fade-rise">
                Waiting for opponent…
                <span className="text-xs text-[#c9dfd3]/80 mt-1">
                  {formatTime(waitingTime)}
                </span>
                <span className="mt-2 flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f0c14b] animate-bounce" />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[#f5d000] animate-bounce"
                    style={{ animationDelay: "0.12s" }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[#d4212c] animate-bounce"
                    style={{ animationDelay: "0.24s" }}
                  />
                </span>
              </span>
            </div>
          )}

        <div className="w-full flex justify-center items-center gap-2 z-10">
          <button
            className="rounded-full p-1.5 cursor-pointer bg-[#d4212c] hover:brightness-110 transition shadow-[0_6px_18px_rgba(212,33,44,0.4)]"
            onClick={() => onLeaveGame()}
            title="Leave game"
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 25 25"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="rotate-180"
            >
              <path
                d="M16.5 15V19.5H5.5V5.5H16.5V10M10 12.5H22.5"
                stroke="#fff"
                strokeWidth="1.2"
              />
              <path
                d="M20 10L22.5 12.5L20 15"
                stroke="#fff"
                strokeWidth="1.2"
              />
            </svg>
          </button>

          <button
            className="rounded-full p-2 cursor-pointer transition-colors bg-[#f0c14b] hover:brightness-105 shadow-[0_6px_18px_rgba(240,193,75,0.35)]"
            onClick={handleRefresh}
            title="Reload game and reconnect"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-[#061410]"
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

          <div className="flex justify-between items-center px-4 font-display text-base font-bold text-[#f6ead0] z-10 w-[80%] h-[50px] rounded-2xl border border-[rgba(240,193,75,0.28)] bg-[rgba(6,20,16,0.55)] backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
            <p className="flex gap-1.5 justify-center items-center">
              <span className="text-[#c9dfd3]/60 text-xs uppercase tracking-wider font-normal">
                Prize
              </span>
              <b className="text-[#f0c14b]">
                {isLoadingGameSettings
                  ? "…"
                  : Math.round(
                      calculateWinnings(gameSettings?.stake, cutPercentage)
                    ) || "…"}
              </b>
              <img src={coin} alt="coin" className="w-5 h-5" />
            </p>
            <p className="flex gap-1 justify-center items-center">
              <b>
                {isLoadingGameSettings
                  ? "…"
                  : gameSettings?.requiredPieces || "…"}
              </b>
              <span className="text-sm font-normal text-[#c9dfd3]/80">
ባነገሰ
              </span>
              {crown}
            </p>
          </div>
        </div>

        <div className="w-[320px] h-[56px] rounded-xl text-[#061410] z-10 flex justify-center items-center overflow-hidden border border-[rgba(240,193,75,0.2)] bg-white/90">
          {ads.ingamead ? (
            <img
              src={ads.ingamead.url || ads.ingamead}
              alt="In-Game Advertisement"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-[#061410]/50 text-sm font-display">
              Advertisement
            </span>
          )}
        </div>
      </div>

      <div className="relative z-10 my-2 animate-board-glow rounded-xl">
        <LudoBoard roomId={roomId} />
      </div>

      <div className="flex w-full justify-center items-center z-10 gap-2 px-1">
        {players[0] && (
          <div
            key={players[0].id}
            className={`flex items-center justify-center py-2 px-2 w-[100px] rounded-xl border transition-all duration-300 ${
              players[0].id === currentTurn
                ? "bg-[rgba(240,193,75,0.18)] border-[#f0c14b] animate-turn-pulse"
                : "bg-[rgba(6,20,16,0.45)] border-[rgba(240,193,75,0.15)]"
            }`}
          >
            <span
              className={`font-display text-sm font-bold truncate ${
                players[0].id === currentTurn
                  ? "text-[#f0c14b]"
                  : "text-[#f6ead0]"
              }`}
            >
              @{players[0].name}
            </span>
          </div>
        )}

        <DieRollingPage
          value={value}
          isRolling={isRolling}
          isMyTurn={isMyTurn}
          gameStatus={gameStatus}
          onRoll={() => rollDice(roomId, socket)}
          players={players}
          currentTurn={currentTurn}
        />

        {showTimer && gameStatus === "playing" && isMyTurn && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50">
            <div className="px-6 py-2">
              <div className="w-48 bg-[rgba(6,20,16,0.55)] rounded-full h-2.5 border border-[rgba(240,193,75,0.2)] overflow-hidden">
                <div
                  className="bg-[linear-gradient(90deg,#f0c14b,#d4212c)] h-full rounded-full transition-all duration-1000"
                  style={{ width: `${(turnTimeLeft / 90) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {players[1] && (
          <div
            key={players[1].id}
            className={`flex items-center justify-center py-2 px-2 w-[100px] rounded-xl border transition-all duration-300 ${
              players[1].id === currentTurn
                ? "bg-[rgba(240,193,75,0.18)] border-[#f0c14b] animate-turn-pulse"
                : "bg-[rgba(6,20,16,0.45)] border-[rgba(240,193,75,0.15)]"
            }`}
          >
            <span
              className={`font-display text-sm font-bold truncate ${
                players[1].id === currentTurn
                  ? "text-[#f0c14b]"
                  : "text-[#f6ead0]"
              }`}
            >
              @{players[1].name}
            </span>
          </div>
        )}
      </div>

      {isRefreshing && (
        <div className="fixed inset-0 bg-[#061410]/85 backdrop-blur-md flex items-center justify-center z-[9999]">
          <div className="panel-arena p-8 text-center max-w-md mx-4 animate-result-burst">
            <div className="mb-6">
              <div className="flex justify-center mb-4">
                <svg
                  width="56"
                  height="56"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-[#f0c14b] animate-spin"
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
              <h2 className="font-display text-2xl font-bold text-[#f6ead0] mb-2">
                Reloading Game
              </h2>
              <p className="text-[#c9dfd3]/80">
                Reconnecting and restoring game state…
              </p>
            </div>
            <div className="flex justify-center space-x-1.5">
              <div className="w-2 h-2 bg-[#0b8a3d] rounded-full animate-bounce" />
              <div
                className="w-2 h-2 bg-[#f5d000] rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              />
              <div
                className="w-2 h-2 bg-[#d4212c] rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              />
            </div>
          </div>
        </div>
      )}

      {showLeaveCountdown && (
        <div className="fixed inset-0 bg-[#061410]/70 backdrop-blur-md flex items-center justify-center z-[999]">
          <div className="panel-arena p-8 text-center max-w-md mx-4 animate-result-burst">
            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold text-[#f6ead0] mb-2">
                Leaving Game
              </h2>
              <p className="text-[#c9dfd3]/80">You will leave the game in:</p>
            </div>

            <div className="mb-6">
              <div className="font-display text-6xl font-extrabold text-[#d4212c] mb-3">
                {Math.floor(leaveCountdown / 60)}:
                {String(leaveCountdown % 60).padStart(2, "0")}
              </div>
              <div className="w-full bg-[#061410]/60 rounded-full h-2 overflow-hidden border border-[rgba(212,33,44,0.3)]">
                <div
                  className="bg-[#d4212c] h-2 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${((60 - leaveCountdown) / 60) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={cancelLeaveGame}
              className="btn-arena-ghost px-6 py-3 font-display font-semibold"
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
