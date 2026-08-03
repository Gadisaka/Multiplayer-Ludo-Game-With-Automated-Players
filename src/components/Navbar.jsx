import React, { useEffect } from "react";
import { NavLink } from "react-router-dom";
import useUserStore from "../store/zutstand";
import useWalletStore from "../store/walletStore";
import img from "../assets/ludoimage.png";
import { Home, Bell, Clock, User } from "lucide-react";

const Navbar = () => {
  const avatar = useUserStore((state) => state.avatar);
  const unreadCount = useWalletStore((state) => state.unreadCount);

  useEffect(() => {
    if (avatar === null) {
      console.log("No avatar set. Please choose an avatar.");
    }
  }, [avatar]);

  const tabClass = (isActive) =>
    `flex flex-col items-center gap-0.5 transition-all duration-200 ${
      isActive ? "scale-110 text-[#f0c14b]" : "scale-100 text-[#c9dfd3]/70"
    } active:scale-90`;

  return (
    <div className="w-full h-[4.5rem] flex fixed bottom-0 left-0 items-end justify-center z-[100] pointer-events-none">
      <div className="pointer-events-auto flex items-end justify-between w-full max-w-lg mx-auto px-5 pb-2 pt-3 rounded-t-[1.75rem] border-t border-x border-[rgba(240,193,75,0.22)] bg-[linear-gradient(180deg,rgba(16,40,32,0.97),rgba(6,20,16,0.98))] shadow-[0_-12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <NavLink to="/">
          {({ isActive }) => (
            <div className={tabClass(isActive)}>
              <Home size={isActive ? 26 : 24} strokeWidth={isActive ? 2.4 : 2} />
            </div>
          )}
        </NavLink>

        <NavLink className="relative" to="/notification">
          {({ isActive }) => (
            <div className={`${tabClass(isActive)} relative`}>
              <Bell size={isActive ? 26 : 24} strokeWidth={isActive ? 2.4 : 2} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-[#d4212c] text-white text-[10px] rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center font-bold animate-fade-rise">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
          )}
        </NavLink>

        <NavLink to="/game" className="-mt-7">
          {({ isActive }) => (
            <div
              className={`relative rounded-full p-1 bg-[linear-gradient(135deg,#0b8a3d,#f5d000,#d4212c)] shadow-[0_8px_28px_rgba(240,193,75,0.35)] ${
                isActive ? "animate-nav-bob" : ""
              }`}
            >
              <div className="rounded-full bg-[#061410] p-1">
                <img
                  src={img}
                  alt="Play"
                  className={`rounded-full w-[52px] h-[52px] object-cover transition-transform duration-300 ${
                    isActive ? "scale-105 ring-2 ring-[#f0c14b]" : "scale-100"
                  }`}
                />
              </div>
            </div>
          )}
        </NavLink>

        <NavLink to="/history">
          {({ isActive }) => (
            <div className={tabClass(isActive)}>
              <Clock size={isActive ? 26 : 24} strokeWidth={isActive ? 2.4 : 2} />
            </div>
          )}
        </NavLink>

        <NavLink to="/profile">
          {({ isActive }) => (
            <div className={tabClass(isActive)}>
              <User size={isActive ? 26 : 24} strokeWidth={isActive ? 2.4 : 2} />
            </div>
          )}
        </NavLink>
      </div>
    </div>
  );
};

export default Navbar;
