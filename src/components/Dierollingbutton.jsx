import React from "react";
import {
  dieone,
  dietwo,
  diethree,
  diefour,
  diefive,
  diesix,
} from "../components/Dies";
import animation3d from "../assets/Animation - 1750682737621.gif";

const dieMap = {
  1: dieone,
  2: dietwo,
  3: diethree,
  4: diefour,
  5: diefive,
  6: diesix,
};

const DieRollingPage = ({
  value = 1,
  isRolling,
  isMyTurn,
  gameStatus,
  onRoll,
  players,
  currentTurn,
  currentTurnPlayerName,
  waitingForMove = false,
}) => {
  const isDisabled = isRolling || !isMyTurn || gameStatus !== "playing";
  const isGameActive = gameStatus === "playing";

  const currentPlayer = players?.find((player) => player.id === currentTurn);
  const displayTurnPlayerName =
    currentTurnPlayerName || currentPlayer?.name || "Unknown Player";

  const getContainerStyle = () => {
    if (!isGameActive) {
      return "bg-[rgba(16,40,32,0.55)] border-[rgba(240,193,75,0.15)]";
    }
    if (isMyTurn && !waitingForMove) {
      return "bg-[rgba(22,54,44,0.75)] border-[rgba(240,193,75,0.45)] shadow-[0_0_28px_rgba(240,193,75,0.18)] animate-turn-pulse";
    }
    return "bg-[rgba(16,40,32,0.45)] border-[rgba(240,193,75,0.18)]";
  };

  return (
    <div className="w-full max-w-md mx-auto mt-2">
      <div
        className={`flex items-center justify-between p-3 rounded-2xl border backdrop-blur-xl transition-all duration-300 ${getContainerStyle()}`}
      >
        <div className="flex flex-col space-y-1 flex-1 min-w-0">
          <div
            className={`font-display text-sm font-bold truncate ${
              isMyTurn ? "text-[#f0c14b]" : "text-[#f6ead0]"
            }`}
          >
            {isMyTurn ? "Your Turn!" : `${displayTurnPlayerName}'s Turn`}
          </div>
          <div className="flex items-center space-x-2 text-xs text-[#c9dfd3]/75">
            <div
              className={`w-2 h-2 rounded-full ${
                isMyTurn ? "bg-[#0b8a3d] animate-pulse" : "bg-[#c9dfd3]/40"
              }`}
            />
            <span>
              {!isGameActive
                ? "Game inactive"
                : waitingForMove && isMyTurn
                  ? "Make your move"
                  : isMyTurn
                    ? "Ready to roll"
                    : "Waiting for turn"}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {isRolling ? (
              <div className="flex items-center justify-center w-[4.25rem] h-[4.25rem] rounded-2xl border border-[rgba(240,193,75,0.35)] bg-[rgba(6,20,16,0.55)]">
                <img
                  src={animation3d}
                  alt="Rolling dice"
                  className="w-12 h-12 object-contain"
                />
              </div>
            ) : waitingForMove && isMyTurn ? (
              <div className="flex flex-col items-center justify-center w-[4.25rem] h-[4.25rem] rounded-2xl border border-[rgba(240,193,75,0.4)] bg-[#f0c14b]/15 animate-pulse">
                <div className="text-[10px] text-[#f0c14b] font-display font-bold text-center leading-tight">
                  Make
                  <br />
                  Move
                </div>
              </div>
            ) : (
              <button
                onClick={onRoll}
                disabled={isDisabled || waitingForMove}
                className={`w-[4.25rem] h-[4.25rem] p-1.5 rounded-2xl border transition-all duration-300 ${
                  isMyTurn && !isRolling && isGameActive && !waitingForMove
                    ? "border-[#f0c14b] bg-[rgba(240,193,75,0.18)] animate-dice-ready hover:scale-105 cursor-pointer"
                    : "border-[rgba(240,193,75,0.15)] bg-[rgba(6,20,16,0.4)] cursor-not-allowed opacity-60"
                }`}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-12 h-12 flex items-center justify-center">
                    {dieMap[value]}
                  </div>
                </div>
              </button>
            )}
          </div>
          {!waitingForMove && (
            <div className="text-center min-w-[2.5rem]">
              <div className="text-[10px] text-[#c9dfd3]/55 font-display uppercase tracking-wider">
                Last
              </div>
              <div className="text-xl font-display font-bold text-[#f6ead0]">
                {value}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DieRollingPage;
