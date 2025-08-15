import React from "react";

export default function NotFound() {
  const path = typeof window !== "undefined"
    ? (window.location.hash || window.location.pathname)
    : "";
  return (
    <div style={{ padding: 16 }}>
      <h2>Not Found</h2>
      <code>{path}</code>
    </div>
  );
}
