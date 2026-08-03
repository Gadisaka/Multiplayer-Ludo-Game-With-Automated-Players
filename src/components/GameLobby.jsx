import React, { useState, useEffect } from "react";
import socket from "../socket";
import useUserStore from "../store/zutstand";
import useWalletStore from "../store/walletStore";
import GameDetails from "./GameDetails";
import { useNavigate } from "react-router-dom";
import diceGif from "../assets/Dice.gif";
import { Plus, RefreshCw, Users, Coins, Crown } from "lucide-react";

const DiceRollingAnimation = ({ isVisible, onComplete }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onComplete();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-[#061410]/70 backdrop-blur-md flex items-center justify-center z-50">
      <div className="animate-dice-intro flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute -inset-8 rounded-full bg-[radial-gradient(circle,rgba(240,193,75,0.35),transparent_70%)] blur-lg" />
          <div className="relative w-44 h-44 flex items-center justify-center rounded-3xl border border-[rgba(240,193,75,0.35)] bg-[rgba(16,40,32,0.85)] shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            <img
              src={diceGif}
              alt="Dice Rolling Animation"
              className="w-36 h-36 object-contain"
            />
          </div>
        </div>
        <p className="font-display text-[#f0c14b] tracking-wide animate-fade-rise">
          Finding tables…
        </p>
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
  const username = useUserStore((state) => state.username);
  const { balance, getBalance, getNotifications } = useWalletStore();
  const [showGameDetails, setShowGameDetails] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setShowDiceAnimation(true);
    if (socket.connected) {
      socket.emit("get_available_games");
    }
  }, []);

  useEffect(() => {
    getBalance();
    getNotifications();
  }, [getBalance, getNotifications]);

  useEffect(() => {
    const interval = setInterval(() => {
      getNotifications();
    }, 30000);
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

    socket.once("room_update", (data) => {
      console.log("Successfully joined room:", data);
      navigate(`/game/${roomId}`);
    });

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
  };

  return (
    <>
      <DiceRollingAnimation
        isVisible={showDiceAnimation}
        onComplete={handleDiceAnimationComplete}
      />

      <div className="flex flex-col gap-5 max-w-xl mx-auto animate-rise-in">
        <header className="flex flex-col gap-1">
          <p className="font-display text-[11px] uppercase tracking-[0.2em] text-[#f0c14b]/75">
            Live Arena
          </p>
          <h1 className="font-display text-3xl font-extrabold text-[#f6ead0] tracking-tight">
            Game Lobby
          </h1>
        </header>

        <div className="panel-arena px-4 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={22}
              height={22}
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle cx="12" cy="12" r="10" fill="#F0C14B" />
              <ellipse cx="12" cy="16" rx="7" ry="2" fill="#D4A02A" />
              <circle cx="12" cy="12" r="7" fill="#F6D78A" />
              <ellipse cx="12" cy="10" rx="4" ry="1.2" fill="#FFF4C8" />
            </svg>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#c9dfd3]/55 font-display">
                Balance
              </p>
              <p className="font-display text-lg font-bold text-[#f6ead0] leading-tight">
                {balance !== undefined
                  ? `${balance.toFixed(2)} ብር`
                  : "Loading..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGameDetails(true)}
              className="btn-arena px-4 py-2.5 text-sm flex items-center gap-1.5"
            >
              <Plus size={16} strokeWidth={2.5} />
              New
            </button>
            <button
              onClick={() => {
                setShowDiceAnimation(true);
                socket.emit("get_available_games");
                getNotifications();
              }}
              disabled={!isConnected}
              title="Reload games"
              className={`btn-arena-ghost p-2.5 ${
                !isConnected ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <RefreshCw size={18} className="text-[#f0c14b]" />
            </button>
          </div>
        </div>

        {isConnecting && (
          <div className="panel-arena-soft px-4 py-3 flex items-center justify-between gap-3 animate-fade-rise">
            <p className="text-[#f0c14b] text-sm">Connecting to server…</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-arena-ghost px-3 py-1.5 text-xs"
            >
              Refresh
            </button>
          </div>
        )}

        {error && (
          <p className="text-[#ff8a8a] text-sm px-1 animate-fade-rise">{error}</p>
        )}

        <div className="w-full">
          {isConnected ? (
            availableGames && availableGames.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h2 className="font-display text-lg text-[#f6ead0]">
                    Open Tables
                  </h2>
                  <span className="text-xs text-[#c9dfd3]/60 font-display">
                    {availableGames.length} live
                  </span>
                </div>
                {availableGames.map((game, index) => (
                  <div
                    key={game.roomId}
                    className="animate-room-in group relative overflow-hidden rounded-2xl border border-[rgba(240,193,75,0.22)] bg-[linear-gradient(135deg,rgba(22,54,44,0.95),rgba(10,31,26,0.98))] p-4 transition-transform duration-200 hover:-translate-y-0.5"
                    style={{ animationDelay: `${index * 0.07}s` }}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[linear-gradient(180deg,#0b8a3d,#f5d000,#d4212c)]" />
                    <div className="flex items-center justify-between gap-3 pl-2">
                      <div className="space-y-1.5 min-w-0">
                        <p className="font-display text-[#f6ead0] font-semibold truncate">
                          <span className="text-[#f0c14b]">@{game.hostName}</span>
                        </p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#c9dfd3]/80">
                          <span className="inline-flex items-center gap-1">
                            <Users size={12} className="text-[#f0c14b]" />
                            {game.playerCount}/2
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Coins size={12} className="text-[#f0c14b]" />
                            {game.stake} ብር
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Crown size={12} className="text-[#f0c14b]" />
                            {game.requiredPieces} ባነገሰ
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleJoinGame(game.roomId)}
                        className="btn-arena shrink-0 px-4 py-2 text-sm"
                      >
                        Join
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="panel-arena-soft px-6 py-12 text-center animate-fade-rise">
                <div className="mx-auto mb-4 w-14 h-14 rounded-2xl border border-[rgba(240,193,75,0.3)] bg-[#f0c14b]/10 flex items-center justify-center">
                  <Crown className="text-[#f0c14b]" size={26} />
                </div>
                <p className="font-display text-[#f6ead0] text-lg mb-1">
                  No open tables
                </p>
                <p className="text-sm text-[#c9dfd3]/70 mb-5">
                  Create a room and wait for an opponent.
                </p>
                <button
                  onClick={() => setShowGameDetails(true)}
                  className="btn-arena px-6 py-2.5 text-sm"
                >
                  Create Game
                </button>
              </div>
            )
          ) : null}

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
