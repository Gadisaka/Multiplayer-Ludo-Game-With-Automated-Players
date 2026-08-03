import React from "react";
import GameLobby from "../components/GameLobby";

const Game = () => {
  return (
    <div className="arena-shell min-h-screen">
      <div className="arena-flag-beam" />
      <div className="arena-orb arena-orb--gold" />
      <div className="arena-orb arena-orb--leaf" />
      <div className="w-full py-5 px-4">
        <GameLobby />
      </div>
    </div>
  );
};

export default Game;
