"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Target, Trophy, AlertCircle, Send, X } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function GuessGame() {
  const [messages, setMessages] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [guess, setGuess] = useState("");
  const [prize, setPrize] = useState(1.0);
  const [gameStarted, setGameStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  const addNotification = (message: string) => {
    setNotifications((prev) => [...prev, message]);
    setTimeout(() => {
      setNotifications((prev) => prev.slice(1));
    }, 5000);
  };

  const startGame = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8080/start");
      if (!res.ok) throw new Error("Failed to start the game");
      const data = await res.json();
      setMessages([data.message]);
      setPrize(data.prize);
      setGameStarted(true);
      addNotification("New game started!");
    } catch (error) {
      addNotification("Error: Failed to start the game.");
    } finally {
      setIsLoading(false);
    }
  };

  const sendGuess = async () => {
    const guessNumber = Number(guess);
    if (isNaN(guessNumber) || guessNumber < 1 || guessNumber > 100) {
      setShake(true);
      addNotification("Please enter a valid number between 1 and 100.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8080/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guess: guessNumber }),
      });
      if (!res.ok) throw new Error("Failed to submit guess");
      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      setPrize(data.prize);
      setGuess("");
      addNotification(data.message);

      if (data.message.includes("Correct")) {
        setDialogOpen(true);
      }
    } catch (error) {
      addNotification("Error: Failed to submit guess.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!walletAddress) {
      addNotification("Error: Wallet address is required.");
      return;
    }

    addNotification(`Prize of ${prize.toFixed(4)} SOL claimed by ${walletAddress}.`);
    setDialogOpen(false);
    setWalletAddress("");
  };

  useEffect(() => {
    if (shake) {
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [shake]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
      {/* Notifications */}
      <div className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center">
        {notifications.map((notification, index) => (
          <Alert key={index} className="mb-2 bg-blue-500 text-white w-full max-w-md mx-auto">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{notification}</AlertDescription>
            <button
              onClick={() => setNotifications((prev) => prev.filter((_, i) => i !== index))}
              className="ml-auto"
            >
              {/* <X className="h-4 w-4" /> */}
            </button>
          </Alert>
        ))}
      </div>

      <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
        <div className="flex items-center justify-center space-x-2 mb-8">
          <Target className="w-8 h-8 text-blue-400" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Guess Master
          </h1>
        </div>

        <div className="mb-8">
          <button
            onClick={startGame}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-6 py-3 rounded-lg font-semibold transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-5 h-5" />
            <span>{isLoading ? "Starting..." : "Start New Game"}</span>
          </button>
        </div>

        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Current Prize:</span>
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-xl font-bold text-yellow-400">
                {prize.toFixed(4)} SOL
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className={`transform transition-all ${shake ? "animate-shake" : ""}`}>
            <input
              type="number"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your guess (1-100)"
            />
          </div>
          <button
            onClick={sendGuess}
            disabled={!gameStarted || isLoading}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-6 py-3 rounded-lg font-semibold transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Submitting..." : "Submit Guess"}
          </button>
        </div>

        {/* <div className="bg-gray-700 rounded-lg p-4 h-40 overflow-y-auto">
          {messages.map((msg, index) => (
            <Alert key={index} className="mb-2 bg-gray-800 border-gray-700">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{msg}</AlertDescription>
            </Alert>
          ))}
        </div> */}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center mb-4">
              🎉 Congratulations! You Won!
            </DialogTitle>
            <DialogDescription className="text-center text-gray-300">
              <p className="font-bold">⚠️🚨 Never Share Your Private Key with Anyone! 🚨⚠️</p>
              Enter your private key  to claim your prize of {prize.toFixed(4)} SOL.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col space-y-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Enter your wallet address"
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleClaim}
                className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Claim</span>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
