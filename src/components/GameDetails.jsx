import React, { useEffect, useState } from "react";
import socket from "../socket";
import useUserStore from "../store/zutstand";
import { crown } from "./Dies";
import useWalletStore from "../store/walletStore";
import { FaArrowLeft, FaLock } from "react-icons/fa";
import { useGame } from "../context/GameContext";
import { X } from "lucide-react";

const GameDetails = ({ onClose, onGameStart }) => {
  const [step, setStep] = useState(1);
  const [selectedStake, setSelectedStake] = useState(null);
  const [selectedPieces, setSelectedPieces] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const username = useUserStore((state) => state.username);
  const setGameSetting = useUserStore((state) => state.setGameSetting);
  const [error, setError] = useState("");
  const [isLoading, setIsLoadign] = useState(false);
  const { setGameState, setGameStatus } = useGame();

  setGameSetting({ stake: selectedStake, requiredPieces: selectedPieces });

  const stakeOptions = [20, 30, 40, 50, 100, 200, 500, 1000];
  const pieceOptions = [1, 2, 3, 4];
  const { balance, getBalance } = useWalletStore();

  useEffect(() => {
    getBalance();
  }, [getBalance]);

  useEffect(() => {
    if (username) {
      setPlayerName(username);
    } else {
      setPlayerName("Guest");
    }
  }, [username]);

  useEffect(() => {
    socket.on("room_created", ({ roomId }) => {
      onGameStart(roomId);
    });

    return () => {
      socket.off("room_created");
    };
  }, [onGameStart]);

  const handleStakeSelect = (stake) => {
    setSelectedStake(stake);
    setStep(2);
  };

  const handlePiecesSelect = (pieces) => {
    setSelectedPieces(pieces);
    setStep(3);
  };

  const handleCreateGame = () => {
    if (!playerName.trim()) {
      setError("Please enter your name");
      console.log(error);
      return;
    }
    setIsLoadign(true);

    setGameState({
      pieces: {
        green: ["gh1", "gh2", "gh3", "gh4"],
        blue: ["bh1", "bh2", "bh3", "bh4"],
      },
    });
    setGameStatus("waiting");

    socket.emit("create_room", {
      playerName: playerName.trim(),
      requiredPieces: selectedPieces,
      stake: selectedStake,
    });
  };

  const stepLabel =
    step === 1 ? "Stake" : step === 2 ? "Pieces" : "Confirm";

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-[#061410]/65 backdrop-blur-sm p-3">
      <div className="w-full max-w-md panel-arena overflow-hidden animate-result-burst shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <div className="h-1 w-full bg-[linear-gradient(90deg,#0b8a3d_0%,#0b8a3d_33%,#f5d000_33%,#f5d000_66%,#d4212c_66%,#d4212c_100%)]" />

        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <div>
            <p className="font-display text-[10px] uppercase tracking-[0.18em] text-[#f0c14b]/70">
              Step {step}/3 · {stepLabel}
            </p>
            <div className="mt-2 flex gap-1.5">
              {[1, 2, 3].map((s) => (
                <span
                  key={s}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    s <= step ? "w-8 bg-[#f0c14b]" : "w-4 bg-[#f0c14b]/20"
                  }`}
                />
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-arena-ghost p-2"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {step === 1 && (
          <div className="space-y-4 p-4 animate-fade-rise">
            <h2 className="font-display text-xl font-bold text-[#f6ead0]">
              Select Stake Amount
            </h2>
            <div className="grid grid-cols-4 gap-2.5">
              {stakeOptions.map((stake, i) => (
                <button
                  key={stake}
                  disabled={stake > balance}
                  onClick={() => handleStakeSelect(stake)}
                  style={{ animationDelay: `${i * 0.04}s` }}
                  className={`animate-stake-pop p-3 flex flex-col justify-center items-center rounded-xl font-display transition-all duration-200 ${
                    stake > balance
                      ? "bg-[#061410]/50 text-[#c9dfd3]/35 cursor-not-allowed"
                      : "bg-[#061410]/70 text-[#f6ead0] border border-[rgba(240,193,75,0.2)] hover:border-[#f0c14b] hover:bg-[#f0c14b]/10 hover:scale-105"
                  }`}
                >
                  {stake}
                  {stake > balance && (
                    <span className="text-[9px] text-[#ff8a8a] mt-0.5 leading-tight">
                      insufficient
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Custom amount"
                  onChange={(e) => setSelectedStake(Number(e.target.value))}
                  className="flex-1 px-3 py-3 rounded-xl bg-[#061410]/70 border border-[rgba(240,193,75,0.2)] text-[#f6ead0] placeholder:text-[#c9dfd3]/40 outline-none focus:border-[#f0c14b] transition"
                />
                <button
                  onClick={() => handleStakeSelect(selectedStake)}
                  className="btn-arena px-4 py-2 text-sm"
                  disabled={
                    isLoading || selectedStake > balance || selectedStake < 20
                  }
                >
                  Enter
                </button>
              </div>
              {selectedStake && selectedStake < 20 && (
                <p className="text-[#ff8a8a] text-sm">Minimum bet is 20</p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 p-4 py-8 animate-fade-rise">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-xl font-bold text-[#f6ead0]">
                Select Number of Pieces
              </h2>
              <button
                onClick={() => setStep(1)}
                className="btn-arena-ghost p-2 text-[#f0c14b]"
              >
                <FaArrowLeft />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {pieceOptions.map((pieces, i) => {
                const isLocked =
                  selectedStake < 500 && (pieces === 3 || pieces === 4);
                return (
                  <button
                    key={pieces}
                    onClick={() => !isLocked && handlePiecesSelect(pieces)}
                    disabled={isLocked}
                    style={{ animationDelay: `${i * 0.05}s` }}
                    className={`animate-stake-pop p-3 flex flex-col justify-center items-center rounded-xl transition relative ${
                      isLocked
                        ? "bg-[#061410]/50 cursor-not-allowed text-[#c9dfd3]/40"
                        : "bg-[#061410]/70 text-[#f6ead0] border border-[rgba(240,193,75,0.2)] hover:border-[#f0c14b] hover:scale-105"
                    }`}
                  >
                    {isLocked && (
                      <div className="absolute top-1.5 right-1.5">
                        <FaLock className="text-[#d4212c] text-xs" />
                      </div>
                    )}
                    {crown}
                    <span className="font-display text-sm mt-1">
                      {pieces} ባነገሰ
                    </span>
                    {isLocked && (
                      <span className="text-[9px] text-[#ff8a8a] mt-1 text-center leading-tight">
                        bet must be above 500
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5 p-5 animate-fade-rise">
            <h2 className="font-display text-xl font-bold text-[#f6ead0] text-center">
              Ready to create?
            </h2>
            <div className="flex justify-center items-center gap-8 py-4 rounded-2xl bg-[#061410]/55 border border-[rgba(240,193,75,0.18)]">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-[#c9dfd3]/55 font-display">
                  Stake
                </p>
                <p className="font-display text-2xl font-bold text-[#f0c14b]">
                  {selectedStake} ብር
                </p>
              </div>
              <div className="w-px h-10 bg-[rgba(240,193,75,0.25)]" />
              <div className="text-center flex flex-col items-center">
                <p className="text-[10px] uppercase tracking-wider text-[#c9dfd3]/55 font-display mb-1">
                  Pieces
                </p>
                {crown}
                <p className="font-display text-lg font-bold text-[#f6ead0]">
                  {selectedPieces} ባነገሰ
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={onClose}
                className="btn-arena-ghost px-6 py-2.5 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGame}
                disabled={isLoading}
                className="btn-arena px-6 py-2.5 text-sm animate-cta-breathe"
              >
                {isLoading ? "Creating…" : "Create Game"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameDetails;
