// src/components/Messaging.jsx
import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { Send, MessageSquare } from "lucide-react";

const socket = io("https://vistapro-backend.onrender.com", {
  transports: ["websocket"],
});

function Messaging() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    // Listen for incoming messages
    socket.on("receive-message", (messageData) => {
      setMessages((prev) => [...prev, messageData]);
    });

    return () => {
      socket.off("receive-message");
    };
  }, []);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    // Construct message object. You might include sender info from localStorage, etc.
    const messageData = {
      from: "currentUserId", // replace with actual sender id
      content: newMessage,
      timestamp: new Date().toISOString(),
    };
    // Emit the message to the server
    socket.emit("send-message", messageData);
    // Optionally add it to local state
    setMessages((prev) => [...prev, messageData]);
    setNewMessage("");
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <MessageSquare size={20} /> Messages
      </h2>
      <div className="border border-gray-200 rounded p-4 h-80 overflow-auto my-4">
        {messages.length === 0 ? (
          <p className="text-gray-500">No messages yet.</p>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className="mb-2">
              <p className="text-sm text-gray-600">
                <span className="font-bold">{msg.from}: </span>
                {msg.content}
              </p>
              <p className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleString()}</p>
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 border border-gray-300 rounded px-3 py-2"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
        >
          <Send size={16} className="mr-1" /> Send
        </button>
      </div>
    </div>
  );
}

export default Messaging;
