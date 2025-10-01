import React, { useEffect, useState } from "react";
import socket from "../socket";
import useUserStore from "../store/zutstand";
import { crown } from "./Dies";
import useWalletStore from "../store/walletStore";
import { FaArrowLeft, FaLock } from "react-icons/fa";
import { useGame } from "../context/GameContext";

const GameDetails = ({ onClose, onGameStart }) => {
  const [step, setStep] = useState(1); // 1: stake, 2: pieces, 3: confirmation
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
  // const balance = 230.0;
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
    // Listen for room creation response
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

    // Optionally, reset the game state as well
    setGameState({
      pieces: {
        green: ["gh1", "gh2", "gh3", "gh4"],
        blue: ["bh1", "bh2", "bh3", "bh4"],
      },
    });
    setGameStatus("waiting"); // <-- reset status to prevent redirect

    socket.emit("create_room", {
      playerName: playerName.trim(),
      requiredPieces: selectedPieces,
      stake: selectedStake,
    });
  };

  return (
    <div className="fixed  left-0 right-0 text-yellow-500 pt-[1px] px-[1px] rounded-xl border border-transparent bg-gradient-to-r from-red-500 via-blue-500 to-purple-500 animate-gradient-x-border">
      {step === 1 && (
        <div className="space-y-4 bg-gray-700 p-4 rounded-xl flex flex-col justify-center items-center">
          <div className="flex justify-between items-center w-full">
            <h2 className="text-xl font-bold text-center">
              Select Stake Amount
            </h2>
            <button onClick={onClose}>X</button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {stakeOptions.map((stake) => (
              <button
                key={stake}
                disabled={stake > balance}
                onClick={() => handleStakeSelect(stake)}
                className={`p-3  flex flex-col justify-center items-center  rounded-lg hover:bg-gray-950 transition ${
                  stake > balance ? "bg-gray-900/50" : "bg-gray-900"
                } `}
              >
                {stake}
                {stake > balance && (
                  <h1 className="text-sm text-red-500">insufficient</h1>
                )}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 w-full justify-center items-center">
            <div className="flex gap-2 w-full justify-center items-center rounded-lg hover:bg-gray-540 transition">
              <input
                type="number"
                placeholder="Enter amount"
                onChange={(e) => setSelectedStake(Number(e.target.value))}
                className="p-3 flex flex-col justify-center items-center bg-gray-900 rounded-lg hover:bg-gray-540 transition"
              />
              <button
                onClick={() => handleStakeSelect(selectedStake)}
                className={`p-3 flex flex-col justify-center items-center  rounded-lg hover:bg-gray-540 transition ${
                  isLoading || selectedStake > balance || selectedStake < 20
                    ? "bg-gray-900/50"
                    : "bg-gray-900"
                }`}
                disabled={
                  isLoading || selectedStake > balance || selectedStake < 20
                }
              >
                Enter
              </button>
            </div>
            {selectedStake && selectedStake < 20 && (
              <p className="text-red-500 text-sm">Minimum bet is 20</p>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 bg-gray-700 p-4 rounded-xl py-16">
          <div className="flex justify-between items-center w-full">
            <h2 className="text-xl font-bold text-center">
              Select Number of Pieces
            </h2>
            <button onClick={() => setStep(1)}>
              <FaArrowLeft />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {pieceOptions.map((pieces) => {
              const isLocked =
                selectedStake < 500 && (pieces === 3 || pieces === 4);
              return (
                <button
                  key={pieces}
                  onClick={() => !isLocked && handlePiecesSelect(pieces)}
                  disabled={isLocked}
                  className={`p-3 flex flex-col justify-center items-center rounded-lg transition relative ${
                    isLocked
                      ? "bg-gray-900/50 cursor-not-allowed"
                      : "bg-gray-900 hover:bg-gray-540"
                  }`}
                >
                  {isLocked && (
                    <div className="absolute top-1 right-1">
                      <FaLock className="text-red-500 text-xs" />
                    </div>
                  )}
                  {crown}
                  {pieces} ባነገሰ
                  {isLocked && (
                    <span className="text-xs text-red-500 mt-1 text-center">
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
        <div className="space-y-4 bg-gray-700 p-4 rounded-xl ">
          <div className="space-x-2 text-center text-2xl gap-12 flex justify-center items-center">
            <p className="">{selectedStake} ብር </p>
            <span className="flex flex-col justify-center items-center ">
              {crown}
              {selectedPieces} ባነገሰ
            </span>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateGame}
              disabled={isLoading}
              className="px-4 py-1 text-white rounded-xl font-semibold 
             bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 
             bg-[length:300%_300%] animate-gradient-x transition-colors duration-300"
            >
              {isLoading ? "Creating..." : "Create Game"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameDetails;
