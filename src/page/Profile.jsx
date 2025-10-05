import React, { useState, useEffect } from "react";
import {
  FaUser,
  FaWallet,
  FaTrophy,
  FaClock,
  FaArrowUp,
  FaArrowDown,
  FaPlus,
  FaMinus,
} from "react-icons/fa";
import useAuthStore from "../store/authStore";
import useWalletStore from "../store/walletStore";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { balance, transactions, getBalance, getTransactions } =
    useWalletStore();
  const [recentTransactions, setRecentTransactions] = useState([]);

  const logout = useAuthStore((state) => state.logout);
  const resetWallet = useWalletStore((state) => state.reset);
  const user = useAuthStore((state) => state.user);
  console.log(user);

  const navigate = useNavigate();

  // Fetch balance and transactions on component mount
  useEffect(() => {
    getBalance();
    getTransactions();
  }, [getBalance, getTransactions]);

  // Update recent transactions when transactions change
  useEffect(() => {
    if (transactions.length > 0) {
      const recent = transactions.slice(0, 6).map((tx) => ({
        id: tx._id,
        type: tx.type.toLowerCase(),
        amount:
          tx.type === "WITHDRAW" || tx.type === "GAME_STAKE"
            ? -tx.amount
            : tx.amount,
        date: new Date(tx.createdAt).toISOString().split("T")[0],
        time: new Date(tx.createdAt).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: tx.status.toLowerCase(),
      }));
      setRecentTransactions(recent);
    }
  }, [transactions]);

  const getTransactionIcon = (type) => {
    switch (type) {
      case "deposit":
        return <FaArrowUp className="w-4 h-4 text-green-400" />;
      case "withdraw":
        return <FaArrowDown className="w-4 h-4 text-red-400" />;
      case "game_stake":
        return <FaMinus className="w-4 h-4 text-red-400" />;
      case "game_winnings":
        return <FaTrophy className="w-4 h-4 text-yellow-400" />;
      case "win":
        return <FaTrophy className="w-4 h-4 text-yellow-400" />;
      case "loss":
        return <FaMinus className="w-4 h-4 text-red-400" />;
      default:
        return <FaClock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTransactionColor = (type, amount) => {
    if (amount > 0) return "text-green-400";
    if (amount < 0) return "text-red-400";
    return "text-gray-400";
  };

  const formatAmount = (amount) => {
    const absAmount = Math.abs(amount);
    return amount >= 0 ? `+${absAmount} ብር` : `-${absAmount} ብር`;
  };

  function handleClick(type) {
    navigate(`/${type}`);
  }

  const handleLogout = () => {
    logout();
    resetWallet();
    localStorage.removeItem("wallet-storage");
    localStorage.removeItem("current-user-id");
    localStorage.removeItem("current-username");
    // Remove any other user-related keys if needed
    navigate("/login");
  };

  return (
    <div className="h-full bg-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="bg-gray-900 border border-gray-700 shadow-2xl rounded-xl">
          <div className="p-8 flex flex-col items-center space-y-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center shadow-lg">
                <FaUser className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-gray-900"></div>
            </div>
            {/* Username */}
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-2">
                @{user.username}
              </h1>
            </div>
            {/* Balance */}
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
              <div className="text-center text-3xl font-bold text-white flex items-center justify-center gap-2 space-x-3 mb-2">
                <FaWallet className="w-6 h-6 text-yellow-400" />{" "}
                <span> {balance.toFixed(2)} ብር</span>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex space-x-4 w-full max-w-md">
              {/* deposit buttonn */}
              <button
                onClick={() => handleClick("deposit")}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center"
              >
                <FaPlus className="w-5 h-5 mr-2" /> Deposit
              </button>
              {/* withdraw button */}
              <button
                onClick={() => handleClick("withdraw")}
                className="flex border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white font-semibold p-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg  items-center justify-center"
              >
                {/* width="30px" height="30px" */}
                <svg
                  width="30px"
                  height="30px"
                  viewBox="-0.64 -0.64 17.28 17.28"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  xmlns:xlink="http://www.w3.org/1999/xlink"
                  fill="#ffffff"
                  stroke="#ffffff"
                  stroke-width="0.00016"
                >
                  <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    {" "}
                    <path
                      fill="#ffffff"
                      d="M8 0l2 3h-1v2h-2v-2h-1l2-3z"
                    ></path>{" "}
                    <path
                      fill="#ffffff"
                      d="M15 7v8h-14v-8h14zM16 6h-16v10h16v-10z"
                    ></path>{" "}
                    <path
                      fill="#ffffff"
                      d="M8 8c1.657 0 3 1.343 3 3s-1.343 3-3 3h5v-1h1v-4h-1v-1h-5z"
                    ></path>{" "}
                    <path
                      fill="#ffffff"
                      d="M5 11c0-1.657 1.343-3 3-3h-5v1h-1v4h1v1h5c-1.657 0-3-1.343-3-3z"
                    ></path>{" "}
                  </g>
                </svg>
              </button>
            </div>
          </div>
        </div>
        {/* Transaction History */}
        <div className="bg-gray-900 border border-gray-700 shadow-2xl rounded-xl">
          <div className="px-8 pt-6 pb-2">
            <div className="text-white text-xl flex items-center space-x-2 mb-4">
              <FaClock className="w-5 h-5 text-blue-400" />
              <span>Transaction History</span>
            </div>
            <div
              className="space-y-1 max-h-96 overflow-y-auto"
              style={{ maxHeight: "24rem" }}
            >
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-800 transition-colors duration-150 border-b border-gray-700 last:border-b-0"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="text-white font-medium capitalize">
                        {transaction.type === "win"
                          ? "Game Won"
                          : transaction.type === "loss"
                          ? "Game Lost"
                          : transaction.type === "game_stake"
                          ? "Game Stake"
                          : transaction.type === "game_winnings"
                          ? "Game Won"
                          : transaction.type === "withdraw" &&
                            transaction.status === "pending"
                          ? "Withdrawal Request"
                          : transaction.type}
                      </p>
                      <p className="text-sm text-gray-400">
                        {transaction.date} • {transaction.time}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold text-lg ${getTransactionColor(
                        transaction.type,
                        transaction.amount
                      )}`}
                    >
                      {formatAmount(transaction.amount)}
                    </p>
                    <p
                      className={`text-xs uppercase font-medium ${
                        transaction.status === "pending"
                          ? "text-yellow-400"
                          : transaction.status === "completed"
                          ? "text-green-400"
                          : transaction.status === "failed"
                          ? "text-red-400"
                          : "text-gray-400"
                      }`}
                    >
                      {transaction.status === "pending"
                        ? "⏳ Pending"
                        : transaction.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Stats Cards */}
        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 text-center">
            <FaTrophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">24</p>
            <p className="text-gray-400">Games Won</p>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 text-center">
            <FaArrowUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">1,250 ብር</p>
            <p className="text-gray-400">Total Winnings</p>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 text-center">
            <FaClock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">12h 45m</p>
            <p className="text-gray-400">Play Time</p>
          </div>
        </div> */}
        <div className="w-full flex justify-center items-center ">
          <button
            className="w-full border-green-500 py-3 hover:bg-green-700 font-bold  rounded-xl text-xl text-white bg-gray-900 "
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
