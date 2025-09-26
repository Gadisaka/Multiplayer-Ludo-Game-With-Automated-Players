import React, { useState, useEffect, useCallback } from "react";
import "../../public/style.css";
import socket from "../socket";
import { useGame } from "../context/GameContext";
import useUserStore from "../store/zutstand";
import useAdsStore from "../store/adsStore";
import Token from "./Token";
import { safeZoneStar } from "./Dies";
import GameResult from "./GameResult";
import { useNavigate } from "react-router-dom";
import { paths } from "../logic/ludoPaths";

const LudoBoard = ({ roomId }) => {
  const {
    currentTurn,
    players,
    setGameStatus,
    value: diceValue,
    isRolling,
    lastRoll,
    gameState: contextGameState,
    setGameState: setContextGameState,
  } = useGame();
  const setCurrentPlayerColor = useUserStore(
    (state) => state.setCurrentPlayerColor
  );
  const { ads, fetchAds } = useAdsStore();
  // Use context gameState as the primary source, with local state as fallback
  const [localGameState, setLocalGameState] = useState({
    pieces: {
      // red: ["rh1", "rh2", "rh3", "rh4"],
      green: ["gh1", "gh2", "gh3", "gh4"],
      blue: ["bh1", "bh2", "bh3", "bh4"],
      // yellow: ["yh1", "yh2", "yh3", "yh4"],
    },
  });

  // Use context gameState if available, otherwise use local state
  const gameState =
    contextGameState && contextGameState.pieces
      ? contextGameState
      : localGameState;
  const setGameState =
    contextGameState && contextGameState.pieces
      ? setContextGameState
      : setLocalGameState;
  const [, setError] = useState(null);
  const [newPath, setNewPath] = useState(null);
  const [step, setStep] = useState(null);
  const [lastValidPosition, setLastValidPosition] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [matchResults, setMatchResults] = useState(null);

  // New state for backwards animation
  const [backwardsAnimation, setBackwardsAnimation] = useState(null);

  // State for win zone entry animation
  const [winZoneAnimation, setWinZoneAnimation] = useState(false);

  // Disconnect and auto-move tracking states
  const [disconnectedPlayers, setDisconnectedPlayers] = useState({});
  const [autoMoveProgress, setAutoMoveProgress] = useState({});
  const [countdownTimers, setCountdownTimers] = useState({});

  // Get current player's color
  const playerColor = players.find((p) => p.id === socket.id)?.color;
  setCurrentPlayerColor(playerColor);

  const navigate = useNavigate();

  // Sync local gameState with context gameState
  useEffect(() => {
    if (contextGameState && contextGameState.pieces) {
      console.log(
        "[LudoBoard] Syncing with context gameState:",
        contextGameState
      );
      setLocalGameState(contextGameState);
    }
  }, [contextGameState, setGameState]);

  // Helper to get the color of the current turn
  const currentTurnColor = players.find((p) => p.id === currentTurn)?.color;
  const isMyTurn = socket.id === currentTurn;

  // Debug: Log socket.id, currentTurn, isMyTurn
  useEffect(() => {
    console.log(
      "Socket ID:",
      socket.id,
      "CurrentTurn:",
      currentTurn,
      "isMyTurn:",
      isMyTurn
    );
  }, [currentTurn, isMyTurn]);

  // Fetch ads on component mount
  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  // Helper function to generate step-by-step path for bot movement
  const generateBotMovementPath = useCallback(
    (color, fromPosition, toPosition) => {
      console.log(`[GENERATE_BOT_PATH] Called with:`, {
        color,
        fromPosition,
        toPosition,
      });

      const colorPath = paths[color];
      if (!colorPath) {
        console.log(`[GENERATE_BOT_PATH] No path found for color:`, color);
        return [];
      }

      // Handle special cases
      if (fromPosition.startsWith(`${color[0]}h`)) {
        // Moving from home - start from the first position on the path
        const startPos = colorPath[0];
        if (startPos === toPosition) return [startPos];

        const startIndex = colorPath.indexOf(startPos);
        const endIndex = colorPath.indexOf(toPosition);
        if (startIndex === -1 || endIndex === -1) return [];

        return colorPath.slice(startIndex, endIndex + 1);
      }

      if (toPosition === `${color}WinZone`) {
        // Moving to win zone - use the last 6 positions
        const lastSixPositions = colorPath.slice(-6);
        const fromIndex = lastSixPositions.indexOf(fromPosition);
        if (fromIndex === -1) return [];

        return lastSixPositions.slice(fromIndex + 1);
      }

      // Normal movement along the path
      const fromIndex = colorPath.indexOf(fromPosition);
      const toIndex = colorPath.indexOf(toPosition);

      if (fromIndex === -1 || toIndex === -1) return [];

      // Handle wrapping around the board
      if (toIndex < fromIndex) {
        // Wrapping around - go from current to end, then from start to target
        const firstPart = colorPath.slice(fromIndex);
        const secondPart = colorPath.slice(0, toIndex + 1);
        return [...firstPart, ...secondPart];
      } else {
        return colorPath.slice(fromIndex + 1, toIndex + 1);
      }
    },
    []
  );

  // Function to animate bot movement step by step
  const animateBotMovement = useCallback(
    (color, pieceIndex, fromPosition, toPosition) => {
      console.log(`[ANIMATE_BOT_MOVEMENT] Called with:`, {
        color,
        pieceIndex,
        fromPosition,
        toPosition,
      });

      const movementPath = generateBotMovementPath(
        color,
        fromPosition,
        toPosition
      );

      if (movementPath.length === 0) {
        // No path to animate, just update the position
        console.log(
          `[ANIMATE_BOT_MOVEMENT] No path to animate, setting final position directly`
        );
        setStep({ color, index: pieceIndex, position: toPosition });
        return;
      }

      console.log(
        `[BOT ANIMATION] Animating ${color} piece ${pieceIndex} from ${fromPosition} to ${toPosition}`
      );
      console.log(`[BOT ANIMATION] Movement path:`, movementPath);

      // Start the step-by-step animation
      let currentStep = 0;
      const animateStep = () => {
        if (currentStep < movementPath.length) {
          const currentPosition = movementPath[currentStep];
          console.log(
            `[BOT ANIMATION] Step ${currentStep + 1}/${
              movementPath.length
            }: ${currentPosition}`
          );

          setStep({ color, index: pieceIndex, position: currentPosition });
          currentStep++;

          // Continue to next step after a delay
          setTimeout(animateStep, 300); // 300ms delay between steps for smoother animation
        } else {
          // Animation complete, set final position
          console.log(
            `[BOT ANIMATION] Animation complete for ${color} piece ${pieceIndex}`
          );
          setStep({ color, index: pieceIndex, position: toPosition });

          // Clean up animation state
        }
      };

      // Start animation after a short delay
      setTimeout(animateStep, 100);
    },
    [generateBotMovementPath]
  );

  // Handle socket errors
  const handleError = useCallback((message) => {
    setError(message);
    console.log(message);

    setTimeout(() => setError(null), 3000); // Clear error after 3 seconds
  }, []);

  // Check if position is in win zone
  const isWinZone = (position, color) => {
    // Check if position starts with 'w' (win zone positions)
    return position && position.startsWith(`${color}WinZone`);
  };

  // Check if position is home
  const isHome = (position) => {
    return (
      position &&
      (position.endsWith("h1") ||
        position.endsWith("h2") ||
        position.endsWith("h3") ||
        position.endsWith("h4"))
    );
  };

  // Generate backwards path from current position to home
  const generateBackwardsPath = useCallback((color, currentPosition) => {
    const colorPath = paths[color];
    if (!colorPath) return [];

    // If piece is already at home or in win zone, no backwards path needed
    if (isHome(currentPosition) || isWinZone(currentPosition, color)) {
      return [];
    }

    const currentIndex = colorPath.indexOf(currentPosition);
    if (currentIndex === -1) return []; // Position not found in path

    // Get positions from current to start in reverse order
    return colorPath.slice(0, currentIndex + 1).reverse();
  }, []);

  // Animate piece backwards movement
  const animatePieceBackwards = useCallback(
    (color, pieceIndex, backwardsPath, currentPosition) => {
      if (backwardsPath.length === 0) return;

      console.log(
        `[BACKWARDS ANIMATION] Starting backwards animation for ${color} piece ${pieceIndex} from ${currentPosition}`
      );
      console.log(`[BACKWARDS ANIMATION] Backwards path:`, backwardsPath);

      // Set the piece as being animated backwards
      setBackwardsAnimation({ color, pieceIndex, currentPosition });

      // Animate through each position in the backwards path
      backwardsPath.forEach((position, index) => {
        setTimeout(() => {
          console.log(
            `[BACKWARDS ANIMATION] Moving ${color} piece ${pieceIndex} to position ${position} (step ${
              index + 1
            }/${backwardsPath.length})`
          );
          setStep({ color, index: pieceIndex, position });

          // When animation completes, reset and send to home
          if (index === backwardsPath.length - 1) {
            setTimeout(() => {
              console.log(
                `[BACKWARDS ANIMATION] Completed backwards animation for ${color} piece ${pieceIndex}`
              );
              setBackwardsAnimation(null);
              setStep(null);
            }, 200);
          }
        }, index * 80); // 80ms delay between each step for faster backwards animation
      });
    },
    []
  );

  // Listen for initial game state
  useEffect(() => {
    socket.on("piece_move_step", ({ color, index, position }) => {
      setStep({ color, index, position });
      if (position) {
        setLastValidPosition(position);
      }
    });

    return () => {
      socket.off("piece_move_step");
    };
  }, [step]);

  // Effect to handle game result when piece reaches win zone
  useEffect(() => {
    if (step && isWinZone(step.position, step.color) && matchResults) {
      const isWinner = matchResults.winner.id === socket.id;
      setGameResult({
        isWinner,
        winner: matchResults.winner,
        loser: matchResults.loser,
        gameDuration: matchResults.gameDuration,
        requiredPieces: matchResults.requiredPieces,
        stake: matchResults.stake,
      });
    }
  }, [step, matchResults]);

  // Effect to trigger win zone animation when a token enters the win zone
  useEffect(() => {
    if (step && isWinZone(step.position, step.color)) {
      setWinZoneAnimation(true);

      // Hide animation after 2 seconds
      setTimeout(() => {
        setWinZoneAnimation(false);
      }, 2000);
    }
  }, [step]);

  // Effect to handle game result when game ends (for bot wins or other scenarios)
  useEffect(() => {
    if (matchResults && !gameResult) {
      const isWinner = matchResults.winner.id === socket.id;
      setGameResult({
        isWinner,
        winner: matchResults.winner,
        loser: matchResults.loser,
        gameDuration: matchResults.gameDuration,
        requiredPieces: matchResults.requiredPieces,
        stake: matchResults.stake,
      });
    }
  }, [matchResults, gameResult]);

  // Countdown timer effect for disconnected players
  useEffect(() => {
    const timers = {};

    Object.entries(disconnectedPlayers).forEach(([playerId, data]) => {
      if (data.timeout > 0) {
        timers[playerId] = setInterval(() => {
          setCountdownTimers((prev) => {
            const currentTime = prev[playerId] || data.timeout;
            const newTime = currentTime - 1;

            if (newTime <= 0) {
              clearInterval(timers[playerId]);
              return { ...prev, [playerId]: 0 };
            }

            return { ...prev, [playerId]: newTime };
          });
        }, 1000);

        // Initialize countdown
        setCountdownTimers((prev) => ({ ...prev, [playerId]: data.timeout }));
      }
    });

    return () => {
      Object.values(timers).forEach((timer) => clearInterval(timer));
    };
  }, [disconnectedPlayers]);

  // Listen for game events
  useEffect(() => {
    socket.on("error_message", handleError);

    socket.on("piece_moved", (pieces) => {
      console.log("[PIECE_MOVED] Event received:", pieces);
      console.log("[PIECE_MOVED] Current turn:", currentTurn);
      console.log("[PIECE_MOVED] Players:", players);

      // Check if this is a bot move that needs animation
      const currentPlayer = players.find((p) => p.id === currentTurn);
      console.log("[PIECE_MOVED] Current player:", currentPlayer);

      if (currentPlayer && currentPlayer.isBot) {
        console.log("[PIECE_MOVED] Bot move detected, starting animation");
        // This is a bot move - find which piece moved and animate it
        const newPieces = pieces.pieces || pieces;
        Object.entries(newPieces).forEach(([color, colorPieces]) => {
          colorPieces.forEach((newPosition, pieceIndex) => {
            const oldPosition = gameState.pieces[color]?.[pieceIndex];
            if (oldPosition && newPosition && oldPosition !== newPosition) {
              // Piece moved - animate the movement
              console.log(
                `[BOT MOVE] Bot ${color} piece ${pieceIndex} moved from ${oldPosition} to ${newPosition}`
              );
              animateBotMovement(color, pieceIndex, oldPosition, newPosition);
            }
          });
        });

        // For bot moves, delay updating the game state until animation completes
        setTimeout(() => {
          console.log("[PIECE_MOVED] Updating game state after bot animation");
          setGameState(pieces);
          setNewPath(pieces.path);
        }, 2000); // Wait for animation to complete (increased for slower animation)
      } else {
        console.log("[PIECE_MOVED] Human move detected, updating immediately");
        // Human player move - update immediately
        setGameState(pieces);
        setNewPath(pieces.path);
      }
    });

    socket.on("piece_killed", ({ color, pieceIndex, currentPosition }) => {
      console.log(
        `${color} piece ${pieceIndex} was killed at position ${currentPosition}!`
      );

      // Generate backwards path and animate
      const backwardsPath = generateBackwardsPath(color, currentPosition);
      if (backwardsPath.length > 0) {
        animatePieceBackwards(
          color,
          pieceIndex,
          backwardsPath,
          currentPosition
        );
      }
    });

    socket.on("game_over", (results) => {
      setMatchResults(results);
    });

    // Handle player disconnect events
    socket.on("player_disconnected", ({ playerId, playerName, timeout }) => {
      console.log(
        `[DISCONNECT] Player ${playerName} (${playerId}) disconnected`
      );
      setDisconnectedPlayers((prev) => ({
        ...prev,
        [playerId]: { playerName, timeout, isAutoMoving: false },
      }));
    });

    // Handle player reconnect events
    socket.on("player_reconnected", ({ playerId, playerName }) => {
      console.log(`[RECONNECT] Player ${playerName} (${playerId}) reconnected`);
      setDisconnectedPlayers((prev) => {
        const updated = { ...prev };
        delete updated[playerId];
        return updated;
      });
      setCountdownTimers((prev) => {
        const updated = { ...prev };
        delete updated[playerId];
        return updated;
      });
      setAutoMoveProgress((prev) => {
        const updated = { ...prev };
        delete updated[playerId];
        return updated;
      });
    });

    // Handle auto-move start events
    socket.on("auto_move_started", ({ playerId, playerName }) => {
      console.log(
        `[AUTO_MOVE] Auto-move started for ${playerName} (${playerId})`
      );
      setDisconnectedPlayers((prev) => ({
        ...prev,
        [playerId]: { ...prev[playerId], isAutoMoving: true },
      }));
      setAutoMoveProgress((prev) => ({
        ...prev,
        [playerId]: { currentMove: 0, totalMoves: 5 },
      }));
    });

    // Handle auto-move progress events
    socket.on("auto_move_progress", ({ playerId, currentMove, totalMoves }) => {
      console.log(
        `[AUTO_MOVE] Progress for ${playerId}: ${currentMove}/${totalMoves}`
      );
      setAutoMoveProgress((prev) => ({
        ...prev,
        [playerId]: { currentMove, totalMoves },
      }));
    });

    // Handle auto-move complete events
    socket.on("auto_move_complete", ({ playerId, reason }) => {
      console.log(`[AUTO_MOVE] Complete for ${playerId}: ${reason}`);
      if (reason === "limit_reached" || reason === "game_won") {
        setDisconnectedPlayers((prev) => {
          const updated = { ...prev };
          delete updated[playerId];
          return updated;
        });
        setAutoMoveProgress((prev) => {
          const updated = { ...prev };
          delete updated[playerId];
          return updated;
        });
      }
    });

    return () => {
      socket.off("error_message");
      socket.off("piece_moved");
      socket.off("piece_killed");
      socket.off("game_over");
      socket.off("player_disconnected");
      socket.off("player_reconnected");
      socket.off("auto_move_started");
      socket.off("auto_move_progress");
      socket.off("auto_move_complete");
    };
  }, [
    setGameStatus,
    gameState,
    handleError,
    newPath,
    generateBackwardsPath,
    animatePieceBackwards,
    animateBotMovement,
    players,
    currentTurn,
  ]);

  const handleTryAgain = () => {
    setGameResult(null);
    setMatchResults(null);
    socket.emit("leave_room", { roomId });
    navigate("/");
  };

  const movePieceByColor = useCallback(
    (color, index) => {
      if (socket.id !== currentTurn) {
        console.log("Not your turn!");
        return;
      }

      if (color !== playerColor) {
        console.log("You can only move your own pieces!");
        return;
      }

      socket.emit("move_piece", {
        roomId,
        color,
        pieceIndex: index,
      });
    },
    [currentTurn, playerColor, roomId]
  );

  let positions = [];
  function isInSamePosition(pos) {
    if (pos === null) return false;
    if (positions.some((p) => p === pos)) {
      positions.push(pos);
      return true;
    } else {
      positions.push(pos);
      return false;
    }
  }
  const getMovableTokens = useCallback(
    (color) => {
      const tokens = gameState.pieces[color] || [];
      const path = color && paths[color];
      if (!path) return [];
      let movable = [];
      tokens.forEach((pos, idx) => {
        // Skip if position is null or undefined
        if (!pos) return;

        const isHome =
          pos.endsWith("h1") ||
          pos.endsWith("h2") ||
          pos.endsWith("h3") ||
          pos.endsWith("h4");
        if (isHome) {
          if (diceValue === 6) movable.push(idx);
          return;
        }
        // If in win zone, skip
        if (pos.startsWith(color + "WinZone")) return;
        // Find current index in path
        const pathIdx = path.indexOf(pos);
        if (pathIdx === -1) return;
        // Check if move stays in path
        if (pathIdx + diceValue <= path.length) {
          movable.push(idx);
        }
      });
      return movable;
    },
    [gameState.pieces, diceValue]
  );

  // Auto-move effect
  useEffect(() => {
    if (!playerColor || socket.id !== currentTurn || isRolling) return;
    const movable = getMovableTokens(playerColor);
    if (movable.length === 1) {
      // Only one move, auto-move it
      movePieceByColor(playerColor, movable[0]);
    }
  }, [
    diceValue,
    currentTurn,
    playerColor,
    gameState,
    isRolling,
    getMovableTokens,
    movePieceByColor,
  ]);

  // Only allow movable tokens if it's my turn AND I have rolled the dice
  const hasRolled = lastRoll && lastRoll.roller === socket.id;
  const movableTokenIndices =
    isMyTurn && hasRolled && playerColor ? getMovableTokens(playerColor) : [];

  // Render disconnect notification component
  const renderDisconnectNotification = () => {
    const disconnectedEntries = Object.entries(disconnectedPlayers);
    if (disconnectedEntries.length === 0) return null;

    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-999">
        {disconnectedEntries.map(([playerId, data]) => {
          const countdown = countdownTimers[playerId];
          const autoMove = autoMoveProgress[playerId];

          return (
            <div
              key={playerId}
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg mb-2 shadow-lg animate-pulse"
            >
              {data.isAutoMoving ? (
                <div className="text-center">
                  <p className="font-semibold">
                    Player {data.playerName} disconnected
                  </p>
                  <p className="text-sm">
                    Auto-moves: {autoMove?.currentMove || 0}/
                    {autoMove?.totalMoves || 5} moves started
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="font-semibold">
                    Player {data.playerName} disconnected
                  </p>
                  <p className="text-sm">
                    Waiting {countdown || data.timeout} sec to return
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {renderDisconnectNotification()}
      <div className="ludoContainer">
        <div id="ludoBoard">
          <div
            id="red-Board"
            className={`board relative ${
              isMyTurn && currentTurnColor === "red"
                ? "bg-red-700 animate-blink"
                : ""
            }`}
          >
            <div className="">
              {ads.redboardad ? (
                <div className="absolute inset-0 ml-4 mt-4 flex items-center justify-center pointer-events-none z-10 overflow-hidden">
                  <img
                    src={ads.redboardad.url || ads.redboardad}
                    alt="Red Board Advertisement"
                    className="w-[100%] h-[100%] object-cover ml-28 mt-28 opacity-80 hover:opacity-100 transition-opacity duration-300 transform -translate-x-1/4 -translate-y-1/4"
                    style={{
                      minWidth: "100%",
                      minHeight: "100%",
                      transform: "scale(1.2) translate(-16.67%, -16.67%)",
                    }}
                  />
                </div>
              ) : (
                <>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </>
              )}
            </div>
            {/* Red Board Ad Overlay */}
          </div>
          <div className="ludoBox verticalPath" id="p1"></div>
          <div className="ludoBox verticalPath" id="p2">
            <svg
              width="14px"
              height="14px"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="rotate-180 mt-1 ml-0.5"
            >
              <path
                d="M6 8L2 8L2 6L8 5.24536e-07L14 6L14 8L10 8L10 16L6 16L6 8Z"
                fill="#009A2A"
              />
            </svg>
          </div>
          <div className="ludoBox verticalPath" id="p3"></div>
          <div className="ludoBox verticalPath" id="p4"></div>
          <div className="ludoBox verticalPath greenLudoBox" id="p5"></div>
          <div className="ludoBox verticalPath greenLudoBox" id="p6"></div>
          <div className="ludoBox verticalPath" id="p7">
            <span className="ml-0.5 mt-1 ">{safeZoneStar}</span>
          </div>
          <div className="ludoBox verticalPath greenLudoBox" id="p8"></div>
          <div className="ludoBox verticalPath" id="p9"></div>
          <div className="ludoBox verticalPath" id="p10"></div>
          <div className="ludoBox verticalPath greenLudoBox" id="p11"></div>
          <div className="ludoBox verticalPath" id="p12"></div>
          <div className="ludoBox verticalPath" id="p13"></div>
          <div className="ludoBox verticalPath greenLudoBox" id="p14"></div>
          <div className="ludoBox verticalPath" id="p15"></div>
          <div className="ludoBox verticalPath" id="p16"></div>
          <div className="ludoBox verticalPath greenLudoBox" id="p17"></div>
          <div className="ludoBox verticalPath" id="p18"></div>
          <div
            id="green-Board"
            className={`board ${
              isMyTurn && currentTurnColor === "green"
                ? "bg-green-700 animate-blink"
                : ""
            }`}
          >
            <div>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <div className="ludoBox horizontalPath" id="p19"></div>
          <div className="ludoBox horizontalPath " id="p20">
            <svg
              width="14px"
              height="14px"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="rotate-270 ml-1 mt-0.5 "
            >
              <path
                d="M6 8L2 8L2 6L8 5.24536e-07L14 6L14 8L10 8L10 16L6 16L6 8Z"
                fill="#FEE800"
              />
            </svg>
          </div>
          <div className="ludoBox horizontalPath" id="p21"></div>
          <div className="ludoBox horizontalPath" id="p22"></div>
          <div className="ludoBox horizontalPath yellowLudoBox" id="p23"></div>
          <div className="ludoBox horizontalPath yellowLudoBox" id="p24"></div>
          <div className="ludoBox horizontalPath" id="p25">
            <span className="ml-1">{safeZoneStar}</span>
          </div>
          <div className="ludoBox horizontalPath  yellowLudoBox" id="p26"></div>
          <div className="ludoBox horizontalPath  " id="p27"></div>
          <div className="ludoBox horizontalPath  " id="p28"></div>
          <div className="ludoBox horizontalPath  yellowLudoBox" id="p29"></div>
          <div className="ludoBox horizontalPath " id="p30"></div>
          <div className="ludoBox horizontalPath" id="p31"></div>
          <div className="ludoBox horizontalPath yellowLudoBox" id="p32"></div>
          <div className="ludoBox horizontalPath" id="p33"></div>
          <div className="ludoBox horizontalPath" id="p34"></div>
          <div className="ludoBox horizontalPath yellowLudoBox" id="p35"></div>
          <div className="ludoBox horizontalPath" id="p36"></div>
          <div id="win-Zone" className="relative">
            <div
              className="absolute w-full h-full"
              style={{
                clipPath: "polygon(0% 0%, 50% 50%, 0% 100%)",
                backgroundColor: "#FA0000",
              }}
            ></div>

            {/* Top-Right: Green Triangle */}
            <div
              className="absolute w-full h-full"
              style={{
                clipPath: "polygon(0% 0%, 100% 0%, 50% 50%)",
                backgroundColor: "#009A2A",
              }}
            ></div>

            {/* Bottom-Right: Yellow Triangle */}
            <div
              className="absolute w-full h-full"
              style={{
                clipPath: "polygon(50% 50%, 100% 0%, 100% 100%)",
                backgroundColor: "#FEE800",
              }}
            ></div>

            {/* Bottom-Left: Blue Triangle */}
            <div
              className="absolute w-full h-full"
              style={{
                clipPath: "polygon(0% 100%, 50% 50%, 100% 100%)",
                backgroundColor: "#00ACFF",
              }}
            ></div>

            {/* Golden Win Zone Animation */}
            {winZoneAnimation && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 border-4 border-yellow-400 rounded-lg animate-pulse shadow-lg shadow-yellow-400/50"></div>
                <div className="absolute inset-1 border-2 border-yellow-300 rounded-lg animate-ping opacity-75"></div>
                <div className="absolute inset-2 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 rounded-md opacity-20 animate-pulse"></div>
                {/* Sparkle effects */}
                <div className="absolute top-1 left-1 w-2 h-2 bg-yellow-200 rounded-full animate-ping"></div>
                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-ping delay-300"></div>
                <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping delay-500"></div>
                <div className="absolute bottom-1 right-1 w-2 h-2 bg-yellow-200 rounded-full animate-ping delay-700"></div>
              </div>
            )}
          </div>
          <div className="ludoBox horizontalPath" id="p37"></div>
          <div className="ludoBox horizontalPath redLudoBox" id="p38"></div>
          <div className="ludoBox horizontalPath" id="p39"></div>
          <div className="ludoBox horizontalPath" id="p40"></div>
          <div className="ludoBox horizontalPath" id="p41"></div>
          <div className="ludoBox horizontalPath" id="p42"></div>
          <div className="ludoBox horizontalPath " id="p43">
            <svg
              width="14px"
              height="14px"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="rotate-90 ml-1 mt-0.5 "
            >
              <path
                d="M6 8L2 8L2 6L8 5.24536e-07L14 6L14 8L10 8L10 16L6 16L6 8Z"
                fill="#FA0000"
              />
            </svg>
          </div>
          <div className="ludoBox horizontalPath redLudoBox" id="p44"></div>
          <div className="ludoBox horizontalPath redLudoBox" id="p45"></div>
          <div className="ludoBox horizontalPath redLudoBox" id="p46"></div>
          <div className="ludoBox horizontalPath redLudoBox" id="p47"></div>
          <div className="ludoBox horizontalPath redLudoBox" id="p48"></div>
          <div className="ludoBox horizontalPath" id="p49"></div>
          <div className="ludoBox horizontalPath" id="p50"></div>
          <div className="ludoBox horizontalPath" id="p51">
            <span className="ml-1">{safeZoneStar}</span>
          </div>
          <div className="ludoBox horizontalPath" id="p52"></div>
          <div className="ludoBox horizontalPath " id="p53"></div>
          <div className="ludoBox horizontalPath" id="p54"></div>
          <div
            id="blue-Board"
            className={`board ${
              isMyTurn && currentTurnColor === "blue"
                ? "bg-blue-700 animate-blink"
                : ""
            }`}
          >
            <div>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <div className="ludoBox verticalPath" id="p55"></div>
          <div className="ludoBox verticalPath blueLudoBox" id="p56"></div>
          <div className="ludoBox verticalPath" id="p57"></div>
          <div className="ludoBox verticalPath" id="p58"></div>
          <div className="ludoBox verticalPath blueLudoBox" id="p59"></div>
          <div className="ludoBox verticalPath" id="p60"></div>
          <div className="ludoBox verticalPath" id="p61"></div>
          <div className="ludoBox verticalPath blueLudoBox" id="p62"></div>
          <div className="ludoBox verticalPath" id="p63"></div>
          <div className="ludoBox verticalPath" id="p64"></div>
          <div className="ludoBox verticalPath blueLudoBox" id="p65"></div>
          <div className="ludoBox verticalPath" id="p66">
            <span className="ml-0.5 mt-1 ">{safeZoneStar}</span>
          </div>
          <div className="ludoBox verticalPath blueLudoBox" id="p67"></div>
          <div className="ludoBox verticalPath blueLudoBox" id="p68"></div>
          <div className="ludoBox verticalPath" id="p69"></div>
          <div className="ludoBox verticalPath" id="p70"></div>
          <div className="ludoBox verticalPath" id="p71">
            <svg
              width="14px"
              height="14px"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mt-1 ml-0.5 "
            >
              <path
                d="M6 8L2 8L2 6L8 5.24536e-07L14 6L14 8L10 8L10 16L6 16L6 8Z"
                fill="#00ACFF"
              />
            </svg>
          </div>
          <div className="ludoBox verticalPath" id="p72"></div>
          <div
            id="yellow-Board"
            className={`board relative ${
              isMyTurn && currentTurnColor === "yellow"
                ? "bg-yellow-700 animate-blink"
                : ""
            }`}
          >
            <div>
              {ads.yellowboardad ? (
                <div className="absolute inset-0 ml-4 mt-4 flex items-center justify-center pointer-events-none z-10 overflow-hidden">
                  <img
                    src={ads.yellowboardad.url || ads.yellowboardad}
                    alt="Yellow Board Advertisement"
                    className="w-[100%] h-[100%] object-cover ml-28 mt-28 opacity-80 hover:opacity-100 transition-opacity duration-300 transform -translate-x-1/4 -translate-y-1/4"
                    style={{
                      minWidth: "100%",
                      minHeight: "100%",
                      transform: "scale(1.2) translate(-16.67%, -16.67%)",
                    }}
                  />
                </div>
              ) : (
                <>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </>
              )}
            </div>
            {/* Yellow Board Ad Overlay */}
          </div>
          {Object.entries(gameState.pieces).map(([color, tokens]) =>
            tokens.map((pos, index) => {
              const isStepMatch =
                step && step.color === color && step.index === index;
              const shouldResetToPos = isStepMatch && step?.position === pos;

              // Check if this piece is being animated backwards
              const isBackwardsAnimating =
                backwardsAnimation &&
                backwardsAnimation.color === color &&
                backwardsAnimation.pieceIndex === index;

              // Highlight movable tokens for current player only after rolling
              const isMovable =
                isMyTurn &&
                hasRolled &&
                color === playerColor &&
                movableTokenIndices.includes(index) &&
                !isBackwardsAnimating; // Don't allow movement during backwards animation

              return (
                <Token
                  key={`${color}-${index}`}
                  position={
                    shouldResetToPos
                      ? pos
                      : isStepMatch
                      ? step?.position || lastValidPosition
                      : pos
                  }
                  color={color}
                  onClick={() => movePieceByColor(color, index)}
                  path={newPath}
                  samePosition={isInSamePosition(pos)}
                  isMovable={isMovable}
                  isBackwardsAnimating={isBackwardsAnimating}
                />
              );
            })
          )}
        </div>
      </div>
      {gameResult && (
        <GameResult result={gameResult} onTryAgain={handleTryAgain} />
      )}
    </>
  );
};

export default LudoBoard;
