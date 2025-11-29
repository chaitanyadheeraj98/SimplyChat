import React, { useState } from "react";

export default function ChatInputBar({ onSend, onResponse }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const send = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;
    setError(null);
    setLoading(true);
    setInput("");

    // Notify parent immediately that a user message was sent
    try {
      onSend?.(trimmed);
    } catch (_) {}

    // If parent handles AI, don't call backend here
    if (typeof onResponse === "function" && onResponse.length === 0) {
      // parent expects to fetch itself; nothing more to do
      setLoading(false);
      return;
    }

    // Otherwise, call local API endpoint and forward assistant reply
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      // Expecting { reply: "..." } from backend
      if (data?.reply) {
        onResponse?.(data.reply);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      setError(err.message || "Failed to get reply");
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="chat-input-bar" style={{ display: "flex", gap: 8 }}>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Type your message and press Enter to send"
        rows={2}
        style={{ flex: 1, resize: "vertical" }}
        disabled={loading}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <button onClick={() => send()} disabled={loading || !input.trim()}>
          {loading ? "Sending..." : "Send"}
        </button>
        {error && (
          <div style={{ color: "crimson", fontSize: 12 }}>{error}</div>
        )}
      </div>
    </div>
  );
}