import React from "react";
import Navbar from "./Navbar";
import WalletProvider from "./WalletProvider";
import { Outlet } from "react-router-dom";
import useAccountDeactivation from "../hooks/useAccountDeactivation";

const ProtectedLayout = () => {
  // Set up account deactivation monitoring
  useAccountDeactivation();

  return (
    <WalletProvider>
      <div className="min-h-screen w-full bg-[#061410] pb-20">
        <Outlet />
        <Navbar />
      </div>
    </WalletProvider>
  );
};

export default ProtectedLayout;
