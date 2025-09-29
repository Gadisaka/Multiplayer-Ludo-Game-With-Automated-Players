import React from "react";
import Navbar from "./Navbar";
import WalletProvider from "./WalletProvider";
import { Outlet } from "react-router-dom";

const ProtectedLayout = () => {
  return (
    <WalletProvider>
      <div className="min-h-screen w-full bg-gray-900 pb-16">
        {" "}
        {/* pb-16 for navbar space */}
        <Outlet />
        <Navbar />
      </div>
    </WalletProvider>
  );
};

export default ProtectedLayout;
