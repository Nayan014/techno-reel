import React from "react";
import { useTheme } from "../context";

/** Your @handle, top centre, just below Instagram's header. */
export const Handle: React.FC<{ text: string }> = ({ text }) => {
  const theme = useTheme();
  return (
    <div
      style={{
        position: "absolute",
        top: 196,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          ...theme.surface(theme.card),
          border: theme.edge(4),
          boxShadow: theme.shadow(4),
          borderRadius: 999,
          padding: "8px 26px",
          fontWeight: 800,
          fontSize: 32,
          letterSpacing: 1,
        }}
      >
        {text}
      </div>
    </div>
  );
};
