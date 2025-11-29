import React, { useState } from "react";
import "./App.css";
import ChatInputBar from "./ChatInputBar";

export default function App() {
  const [messages, setMessages] = useState([]);

  const handleUserMessage = (text) => {
    setMessages((prev) => [...prev, { role: "user", content: text }]);
  };

  const handleAssistantResponse = (reply) => {
    setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
  };

  return (
    <div className="App" style={{ padding: 20 }}>
      <h2>SimplyChat</h2>

      <div
        className="messages"
        style={{
          border: "1px solid #eee",
          borderRadius: 6,
          padding: 12,
          minHeight: 240,
          maxHeight: "60vh",
          overflow: "auto",
          marginBottom: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {messages.length === 0 && (
          <div style={{ color: "#666" }}>No messages yet — say hi!</div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`msg msg-${m.role}`}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "#daf1ff" : "#f1f1f1",
              padding: "8px 12px",
              borderRadius: 8,
              maxWidth: "75%",
            }}
          >
            <strong style={{ display: "block", marginBottom: 4 }}>
              {m.role === "user" ? "You" : "AI"}
            </strong>
            <div>{m.content}</div>
          </div>
        ))}
      </div>

      <ChatInputBar onSend={handleUserMessage} onResponse={handleAssistantResponse} />
    </div>
  );
}
