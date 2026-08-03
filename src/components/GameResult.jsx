import React, { useEffect, useState } from "react";
import { API_URL } from "../../constants";

const Confetti = () => {
  const [pieces] = useState(() => {
    const colors = [
      "#0b8a3d",
      "#f5d000",
      "#d4212c",
      "#f0c14b",
      "#1aa8d4",
      "#f6d78a",
    ];
    return Array.from({ length: 48 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.8,
      duration: 2.4 + Math.random() * 2.2,
      color: colors[i % colors.length],
      size: 6 + Math.random() * 8,
      radius: Math.random() > 0.5 ? "50%" : "2px",
    }));
  });

  return (
    <div className="fixed inset-0 pointer-events-none z-[2001] overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute top-0"
          style={{
            left: `${piece.left}%`,
            width: `${piece.size}px`,
            height: `${piece.size * 0.6}px`,
            backgroundColor: piece.color,
            borderRadius: piece.radius,
            animation: `confetti-fall ${piece.duration}s linear ${piece.delay}s infinite`,
            opacity: 0.9,
          }}
        />
      ))}
    </div>
  );
};

const GameResult = ({ result, onTryAgain }) => {
  const isWinner = result.isWinner;
  const playerData = isWinner ? result.winner : result.loser;
  const [cutPercentage, setCutPercentage] = useState(10);

  const calculateWinnings = (stake, cutPercentage = 10) => {
    if (!stake) return 0;
    return 2 * stake - (2 * stake * cutPercentage) / 100;
  };

  useEffect(() => {
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
      }
    };
    fetchCutPercentage();
  }, []);

  const gameDuration = Math.floor(result.gameDuration / 1000);

  const getResultMessage = () => {
    if (result.reason === "auto_move_win") {
      return isWinner
        ? "Won with auto-moves after disconnect!"
        : "Lost to disconnected player's auto-moves";
    }
    if (result.reason === "auto_move_limit_reached") {
      return isWinner
        ? "Won! Opponent exceeded auto-move limit"
        : "Lost due to auto-move limit exceeded";
    }
    if (result.reason === "opponent_left") {
      return isWinner
        ? "Won! Opponent left the game"
        : "Lost - You left the game";
    }
    if (result.reason === "both_disconnected") {
      return "Game ended - All players disconnected";
    }
    if (result.reason === "turn_timeout") {
      return isWinner
        ? "Won! Opponent timed out"
        : "Lost due to timeout - You took too long to play";
    }
    return isWinner ? "እንኳን ደስ አሎት!" : "እንደገና ይሞክሩ";
  };

  const getResultIcon = () => {
    if (result.reason === "both_disconnected") return "Game Ended";
    return isWinner ? "አሸናፊ!" : "Game Over!";
  };

  const reasonNote = (() => {
    if (result.reason === "auto_move_win") {
      return "Disconnected player completed the game automatically";
    }
    if (result.reason === "auto_move_limit_reached") {
      return "Disconnected player exceeded 5 auto-move limit";
    }
    if (result.reason === "opponent_left") {
      return "Player left the active game";
    }
    if (result.reason === "turn_timeout") {
      return "Player took too long to play their turn";
    }
    return null;
  })();

  return (
    <div className="fixed inset-0 bg-[#061410]/70 backdrop-blur-md flex items-center justify-center z-[2000] p-4">
      {isWinner && <Confetti />}

      <div
        className={`animate-result-burst w-full max-w-md overflow-hidden rounded-[1.5rem] border shadow-[0_28px_80px_rgba(0,0,0,0.55)] ${
          isWinner
            ? "border-[rgba(240,193,75,0.45)] bg-[linear-gradient(160deg,rgba(22,54,44,0.98),rgba(10,31,26,0.99))]"
            : "border-[rgba(212,33,44,0.35)] bg-[linear-gradient(160deg,rgba(40,16,18,0.96),rgba(10,12,14,0.99))]"
        }`}
      >
        <div
          className={`h-1.5 w-full ${
            isWinner
              ? "bg-[linear-gradient(90deg,#0b8a3d,#f5d000,#d4212c)]"
              : "bg-[linear-gradient(90deg,#d4212c,#7a1018)]"
          }`}
        />

        <div className="p-6 text-center space-y-4">
          <div
            className={`font-display text-4xl font-extrabold tracking-tight ${
              isWinner ? "brand-wordmark" : "text-[#ff8a8a]"
            }`}
          >
            {getResultIcon()}
          </div>

          <div className="space-y-2">
            <p className="font-display text-xl font-semibold text-[#f6ead0]">
              @{playerData.name}
            </p>
            <p className="text-[#c9dfd3]/85">{getResultMessage()}</p>

            {reasonNote && (
              <div className="rounded-xl border border-[rgba(240,193,75,0.25)] bg-[rgba(240,193,75,0.08)] p-3 mt-3">
                <p className="text-[#f6d78a] text-sm">{reasonNote}</p>
              </div>
            )}

            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                {
                  label: "Prize",
                  value: Math.round(
                    calculateWinnings(result.stake, cutPercentage)
                  ),
                },
                { label: "Duration", value: `${gameDuration}s` },
                { label: "ባነገሰ", value: result.requiredPieces },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl bg-[#061410]/55 border border-[rgba(240,193,75,0.14)] py-3 px-2"
                >
                  <p className="text-[10px] uppercase tracking-wider text-[#c9dfd3]/55 font-display">
                    {stat.label}
                  </p>
                  <p className="font-display text-lg font-bold text-[#f6ead0] mt-0.5">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onTryAgain}
            className="btn-arena w-full py-3.5 text-base animate-cta-breathe"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameResult;
