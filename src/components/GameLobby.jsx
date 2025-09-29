import React, { useState, useEffect } from "react";
import socket from "../socket";
import useUserStore from "../store/zutstand";
import useWalletStore from "../store/walletStore";
import GameDetails from "./GameDetails";
import { useNavigate } from "react-router-dom";
import diceGif from "../assets/Dice.gif";

// Dice rolling animation component using GIF
const DiceRollingAnimation = ({ isVisible, onComplete }) => {
  useEffect(() => {
    if (isVisible) {
      // Show animation for 2.5 seconds then hide
      const timer = setTimeout(() => {
        onComplete();
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
        <div className="relative ">
          {/* Dice GIF */}
          <div className="w-48 h-48 flex items-center justify-center">
            <img
              src={diceGif}
              alt="Dice Rolling Animation"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        {/* Rolling text */}
      </div>
    </div>
  );
};

const GameLobby = () => {
  const [playerName, setPlayerName] = useState("");
  const [availableGames, setAvailableGames] = useState([]);
  const [error, setError] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [showDiceAnimation, setShowDiceAnimation] = useState(true);
  // const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const username = useUserStore((state) => state.username);
  const { balance, getBalance, getNotifications } = useWalletStore();
  const [showGameDetails, setShowGameDetails] = useState(false);
  const navigate = useNavigate();

  // Page reload and dice animation on component mount
  useEffect(() => {
    // Show dice animation first
    setShowDiceAnimation(true);

    // Reload available games
    if (socket.connected) {
      socket.emit("get_available_games");
    }
  }, []);

  // Fetch balance and notifications on component mount
  useEffect(() => {
    getBalance();
    getNotifications();
  }, [getBalance, getNotifications]);

  // Set up periodic notification refresh
  useEffect(() => {
    const refreshNotifications = () => {
      getNotifications();
    };

    // Refresh notifications every 30 seconds
    const interval = setInterval(refreshNotifications, 30000);

    return () => clearInterval(interval);
  }, [getNotifications]);

  useEffect(() => {
    if (username) {
      setPlayerName(username);
    } else {
      setPlayerName("Guest");
    }
  }, [username]);

  useEffect(() => {
    const handleConnect = () => {
      console.log("Connected to server");
      setIsConnected(true);
      setIsConnecting(false);
      setError("");
      socket.emit("get_available_games");
      // Fetch notifications when connected
      getNotifications();
    };

    const handleDisconnect = (reason) => {
      console.log("Disconnected from server:", reason);
      setIsConnected(false);
      setIsConnecting(false);
      setError(
        `Disconnected from server. ${
          reason === "io server disconnect"
            ? "Server disconnected"
            : "Trying to reconnect..."
        }`
      );
    };

    const handleConnectError = (error) => {
      console.error("Connection error:", error);
      setError(
        "Failed to connect to server. Please check if the server is running."
      );
      setIsConnecting(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("available_games", (games) => {
      console.log("Received available games:", games);
      setAvailableGames(games);
    });
    socket.on("error_message", (msg) => {
      console.error("Server error:", msg);
      setError(msg);
    });

    // Initial connection check
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("available_games");
      socket.off("error_message");
    };
  }, [getNotifications]);

  const handleJoinGame = (roomId) => {
    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }
    console.log(
      "Attempting to join room:",
      roomId,
      "with name:",
      playerName.trim()
    );
    socket.emit("join_room", { roomId, playerName: playerName.trim() });

    // Listen for room update to confirm successful join
    socket.once("room_update", (data) => {
      console.log("Successfully joined room:", data);
      navigate(`/game/${roomId}`);
    });

    // Listen for any errors during join
    socket.once("error_message", (msg) => {
      console.error("Error joining room:", msg);
      setError(msg);
    });
  };

  const handleGameCreated = (roomId) => {
    navigate(`/game/${roomId}`);
  };

  const handleDiceAnimationComplete = () => {
    setShowDiceAnimation(false);
    // setShowWelcomeMessage(true);

    // Hide welcome message after 3 seconds
    setTimeout(() => {
      // setShowWelcomeMessage(false);
    }, 3000);
  };

  // welcome

  return (
    <>
      {/* Dice Rolling Animation */}
      <DiceRollingAnimation
        isVisible={showDiceAnimation}
        onComplete={handleDiceAnimationComplete}
      />

      {/* Main GameLobby Content */}
      <div className="flex  flex-col items-center gap-6 p-8 bg-gray-800 rounded-lg shadow-xl max-w-2xl mx-auto">
        <div className="flex justify-between items-center w-full h-ful">
          <div className="flex justify-center   items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={20}
              height={20}
              viewBox="0 0 24 24"
              fill="none"
              className="inline-block"
            >
              <circle cx="12" cy="12" r="10" fill="#FFD700" />
              <ellipse cx="12" cy="16" rx="7" ry="2" fill="#F6C700" />
              <circle cx="12" cy="12" r="7" fill="#FFE066" />
              <ellipse cx="12" cy="10" rx="4" ry="1.2" fill="#FFF9C4" />
            </svg>
            <h1 className="text-xl font-normal text-white ">
              {balance !== undefined
                ? `${balance.toFixed(2)} ብር`
                : "Loading..."}
            </h1>
          </div>
          <div className="flex justify-between items-center gap-2 ">
            <button
              onClick={() => setShowGameDetails(true)}
              className="px-4 py-2 text-white rounded-2xl font-semibold  bg-gradient-to-r from-green-400 via-green-700 to-green-600 hover:from-green-500  hover:to-green-700 transition-colors"
            >
              New +
            </button>
            <button
              onClick={() => {
                setShowDiceAnimation(true);
                socket.emit("get_available_games");
                // Also refresh notifications when reloading
                getNotifications();
              }}
              disabled={!isConnected}
              title="Reload games with dice animation"
              className={`p-2 rounded-full hover:bg-gray-700 transition-colors ${
                !isConnected ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {/* reload icon svg */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={20}
                height={20}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
            </button>
          </div>
        </div>

        {isConnecting && (
          <div className="text-yellow-500 mb-4">
            Connecting to server...{" "}
            <button
              onClick={() => window.location.reload()}
              className="text-white ml-2 bg-[#CD3760] rounded-md px-2 py-1 "
            >
              Refresh
            </button>
          </div>
        )}

        <div className="w-full max-w-md">
          {/* <input
          type="text"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="w-full px-4 py-2 rounded border text-white mb-4"
          disabled={!isConnected}
        /> */}

          {error && <p className="text-red-500 mb-4">{error}</p>}

          <div className="flex flex-col gap-4">
            {isConnected ? (
              availableGames && availableGames.length > 0 ? (
                <>
                  <h2 className="text-xl text-white mb-2">Available Games:</h2>
                  <div className="space-y-3">
                    {availableGames.map((game) => (
                      <div
                        key={game.roomId}
                        className="p-[1px] rounded-xl border border-transparent bg-gradient-to-r from-red-500 via-blue-500 to-purple-500 animate-gradient-x-border"
                      >
                        <div className="flex items-center justify-between bg-gray-700 p-4 rounded-xl">
                          <div className="text-white">
                            <p>
                              <span className="text-yellow-500 font-bold">
                                Host:
                              </span>{" "}
                              {game.hostName}
                            </p>
                            <p className="text-sm text-gray-300">
                              Players: {game.playerCount}/2
                            </p>
                            <p className="text-sm text-gray-300">
                              Stake: {game.stake}
                            </p>
                            <p className="text-sm text-gray-300">
                              Required Pieces: {game.requiredPieces}
                            </p>
                          </div>
                          <button
                            onClick={() => handleJoinGame(game.roomId)}
                            className="px-4 py-1 text-white rounded-full font-semibold 
                          bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 
                          bg-[length:300%_300%] animate-gradient-x transition-colors duration-300"
                          >
                            Join Game
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-300">
                  No available games. Create one to start playing!
                </div>
              )
            ) : null}
          </div>

          {showGameDetails && (
            <GameDetails
              onClose={() => setShowGameDetails(false)}
              onGameStart={handleGameCreated}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default GameLobby;
