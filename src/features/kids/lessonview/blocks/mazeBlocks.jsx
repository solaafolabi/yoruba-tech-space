// src/features/kids/lessonview/games/MazeGame.jsx
import React, { useEffect, useRef } from "react";

const CELL_SIZE = 40;

const MazeGame = ({ config, onFeedback }) => {
  const canvasRef = useRef(null);

  const { name, map, start = [0, 0], goal, rules = {} } = config;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Draw maze grid
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    map.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === "#") {
          ctx.fillStyle = "black";
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        } else if (cell === "S") {
          ctx.fillStyle = "green";
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        } else if (cell === "G") {
          ctx.fillStyle = "gold";
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        } else {
          ctx.fillStyle = "white";
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
        ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      });
    });

    onFeedback?.({ en: `🎮 Playing: ${name}`, yo: `🎮 Ẹ̀rọ ayélujára: ${name}` });
  }, [map, name, onFeedback]);

  return (
    <div>
      <h4>{name}</h4>
      <canvas
        ref={canvasRef}
        width={map[0].length * CELL_SIZE}
        height={map.length * CELL_SIZE}
        style={{ border: "1px solid #ccc" }}
      />
    </div>
  );
};

export default MazeGame;
