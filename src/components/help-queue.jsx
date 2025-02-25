import React, { useState, useEffect } from "react";
import {
  Clock,
  UserPlus,
  XCircle,
  CheckCircle,
  Key,
  UserCog,
  HelpCircle,
  Copy,
  Check,
} from "lucide-react";
import { db } from "../lib/firebase";
import { ref, onValue, push, update, remove } from "firebase/database";

const HelpQueue = () => {
  const [queue, setQueue] = useState([]);
  const [authorizedName, setAuthorizedName] = useState(
    localStorage.getItem("queueNames") || ""
  );
  const [names, setNames] = useState("");
  const [problem, setProblem] = useState("");
  const [currentlyHelping, setCurrentlyHelping] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [timeUpdate, setTimeUpdate] = useState(0);
  const [copied, setCopied] = useState(false);

  // Get the current URL in a cleaner format for display
  const displayUrl = window.location.href.replace(/^https?:\/\/(www\.)?/, "");

  // Function to copy URL to clipboard
  const copyUrlToClipboard = () => {
    navigator.clipboard.writeText(displayUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    });
  };

  const getButtonState = () => {
    const currentNames = authorizedName;
    if (!names.trim()) {
      return {
        text: "Join Queue",
        disabled: true,
        icon: UserPlus,
      };
    }
    if (names.trim().toLowerCase() === "admin") {
      return {
        text: "Admin Login",
        disabled: false,
        icon: Key,
      };
    }
    if (!problem.trim()) {
      return {
        text: currentNames === names.trim() ? "Update Name" : "Set Name",
        disabled: false,
        icon: UserCog,
      };
    }
    return {
      text: "Ask for Help",
      disabled: false,
      icon: HelpCircle,
    };
  };

  useEffect(() => {
    const queueRef = ref(db, "queue");
    const unsubscribe = onValue(queueRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const queueArray = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value,
        }));
        setQueue(queueArray.sort((a, b) => a.timestamp - b.timestamp));
      } else {
        setQueue([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const savedNames = localStorage.getItem("queueNames");
    if (savedNames) {
      setNames(savedNames);
      setAuthorizedName(savedNames); // Add this line
      setIsAdmin(savedNames.trim().toLowerCase() === "admin");
    }
  }, []);

  // Set up timer to update times every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeUpdate((prev) => prev + 1);
    }, 60000); // Update every minute

    return () => clearInterval(timer); // Cleanup on unmount
  }, []);

  const addToQueue = async () => {
    if (!names.trim()) return;

    const trimmedNames = names.trim();
    const newIsAdmin = trimmedNames.toLowerCase() === "admin";

    // Always update name in localStorage, admin state, and authorized name state
    setIsAdmin(newIsAdmin);
    localStorage.setItem("queueNames", trimmedNames);
    setAuthorizedName(trimmedNames); // Add this line

    // Only add to queue if we have a new help request and we're not in admin mode
    if (!newIsAdmin && problem.trim()) {
      const queueRef = ref(db, "queue");
      const newRequest = {
        names: trimmedNames,
        problem: problem.trim(),
        timestamp: Date.now(),
        status: "waiting",
      };

      try {
        await push(queueRef, newRequest);
        setProblem(""); // Clear problem field after successful add
      } catch (error) {
        console.error("Error adding request:", error);
      }
    }
  };

  const startHelping = async (id) => {
    const request = queue.find((r) => r.id === id);
    if (!request || !canModifyRequest(request)) return;
    const requestRef = ref(db, `queue/${id}`);
    try {
      await update(requestRef, { status: "helping" });
      setCurrentlyHelping(id);
    } catch (error) {
      console.error("Error updating request:", error);
    }
  };

  const resolveRequest = async (id) => {
    const request = queue.find((r) => r.id === id);
    if (!request || !canModifyRequest(request)) return;
    const requestRef = ref(db, `queue/${id}`);
    try {
      await remove(requestRef);
      if (currentlyHelping === id) {
        setCurrentlyHelping(null);
      }
    } catch (error) {
      console.error("Error removing request:", error);
    }
  };

  const formatWaitTime = (timestamp) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    return minutes === 0 ? "Just now" : `${minutes}m ago`;
  };

  const canModifyRequest = (request) => {
    if (!authorizedName) return false;

    return (
      authorizedName.toLowerCase() === "admin" ||
      authorizedName === request.names
    );
  };

  const buttonState = getButtonState();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className={`p-6 ${isAdmin ? "bg-brand-gold" : "bg-brand-royal"}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white">Lab Help Queue</h2>
              {isAdmin && (
                <div className="text-white text-sm bg-black/20 px-2 py-1 rounded">
                  Admin Mode
                </div>
              )}
            </div>
            <button
              onClick={copyUrlToClipboard}
              className="flex items-center font-mono font-bold gap-2 text-white text-sm bg-white/20 px-3 py-1.5 rounded hover:bg-white/30 transition-colors"
            >
              {displayUrl}
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault(); // Prevent default form submission
              addToQueue();
            }}
            className="grid grid-cols-1 md:grid-cols-12 gap-4"
          >
            <input
              type="text"
              placeholder="Names (e.g. Alice & Bob)"
              value={names}
              onChange={(e) => setNames(e.target.value)}
              className="md:col-span-4 h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="What's the issue? (e.g. Lab 3: Part 2)"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              className="md:col-span-6 h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={buttonState.disabled}
              className={`md:col-span-2 h-10 text-white rounded-md flex items-center justify-center gap-2 ${
                !buttonState.disabled
                  ? "bg-brand-royal hover:bg-brand-bright-blue cursor-pointer"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              {React.createElement(buttonState.icon, { className: "h-4 w-4" })}
              <span>{buttonState.text}</span>
            </button>
          </form>

          {/* Queue List */}
          <div className="space-y-4">
            {queue.map((request) => (
              <div
                key={request.id}
                className={(() => {
                  const baseClasses = "rounded-lg p-4 transition-colors";

                  // Check conditions in order of precedence
                  if (request.status === "helping") {
                    if (request.names === authorizedName) {
                      return `${baseClasses} bg-green-50 border-4 shadow-lg border-green-500`;
                    }
                    return `${baseClasses} bg-green-50 border-2 border-green-500`;
                  }

                  if (request.names === authorizedName) {
                    return `${baseClasses} bg-white border-4 border-brand-royal shadow-lg`;
                  }

                  // Default styling
                  return `${baseClasses} bg-white border border-gray-200 hover:border-gray-300`;
                })()}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div
                      className={`${
                        request.names === authorizedName
                          ? "text-black font-bold"
                          : "text-gray-600 font-medium"
                      }`}
                    >
                      {request.names}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {request.problem}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center mt-2">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatWaitTime(request.timestamp)}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {request.status === "waiting" &&
                      canModifyRequest(request) && (
                        <button
                          onClick={() => startHelping(request.id)}
                          className="px-3 py-1.5 text-sm bg-gray-100 text-green-600 border border-green-600 rounded-md hover:bg-green-600 hover:text-white transition-colors"
                        >
                          Start Helping
                        </button>
                      )}
                    {canModifyRequest(request) && (
                      <button
                        onClick={() => resolveRequest(request.id)}
                        className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                        title={
                          request.status === "helping"
                            ? "Mark as Resolved"
                            : "Remove from Queue"
                        }
                      >
                        {request.status === "helping" ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {queue.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg">
                  No requests in the queue
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpQueue;
