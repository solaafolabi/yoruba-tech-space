// src/components/ScratchEmbed.jsx
import React from "react";

const ScratchEmbed = () => {
  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <iframe
        src="/scratch/index.html"
        style={{ width: "100%", height: "100%", border: "none" }}
        title="Scratch GUI"
      />
    </div>
  );
};

export default ScratchEmbed;
