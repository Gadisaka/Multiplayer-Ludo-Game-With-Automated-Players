import React, { useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import useUserStore from "../store/zutstand";
import useWalletStore from "../store/walletStore";
import img from "../assets/ludoimage.png";
import { Home, Bell, Clock, User } from "lucide-react";
const Navbar = () => {
  const avatar = useUserStore((state) => state.avatar);
  const unreadCount = useWalletStore((state) => state.unreadCount);

  // Zustand store to manage user data

  useEffect(() => {
    if (avatar === null) {
      console.log("No avatar set. Please choose an avatar.");
    }
  }, [avatar]);

  return (
    <div className="w-full h-16  flex fixed bottom-0 left-0  items-center justify-center px-4">
      <div className="flex items-center  justify-between w-full h-full px-8 rounded-t-xl  bg-gray-950 ">
        <NavLink className="" to="/">
          {({ isActive }) => (
            <Home
              size={isActive ? 32 : 30}
              className={`text-gray-800 hover:text-amber-700 transition-transform duration-200 ${
                isActive ? "scale-125" : "scale-100"
              } active:scale-90`}
              color={isActive ? "#22c55e" : "#fff"}
            />
          )}
        </NavLink>
        <NavLink className="relative" to="/notification">
          {({ isActive }) => (
            <div className="relative">
              <Bell
                size={isActive ? 32 : 30}
                className={`transition-transform duration-200 ${
                  isActive ? "scale-125" : "scale-100"
                } active:scale-90`}
                color={isActive ? "#22c55e" : "#fff"}
              />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {unreadCount > 10 ? "10+" : unreadCount}
                </span>
              )}
            </div>
          )}
        </NavLink>
        <NavLink
          className=" border-8 mb-10 border-gray-900 rounded-full "
          to="/game"
        >
          {({ isActive }) => (
            <img
              src={img}
              alt="img"
              className={`rounded-full transition-transform duration-200 w-[60px] h-[60px]  ${
                isActive ? "ring-4 ring-green-500 scale-125" : "scale-100"
              } active:scale-90`}
            />
          )}
        </NavLink>
        <NavLink className="" to="/history">
          {({ isActive }) => (
            <Clock
              size={isActive ? 32 : 30}
              className={`transition-transform duration-200 ${
                isActive ? "scale-125" : "scale-100"
              } active:scale-90`}
              color={isActive ? "#22c55e" : "#fff"}
            />
          )}
        </NavLink>
        <NavLink className=" " to="/profile">
          {({ isActive }) => (
            <User
              size={isActive ? 32 : 30}
              className={`transition-transform duration-200 ${
                isActive ? "scale-125" : "scale-100"
              } active:scale-90`}
              color={isActive ? "#22c55e" : "#fff"}
            />
          )}
        </NavLink>
      </div>
    </div>
  );
};

export default Navbar;
