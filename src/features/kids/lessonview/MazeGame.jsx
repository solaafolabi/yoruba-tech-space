import React, { useState, useEffect } from "react";
import Interpreter from "js-interpreter";

export default function MazeGame({ level, code }) {
  const [grid, setGrid] = useState(level.grid);
  const [player, setPlayer] = useState(level.start);
  const [direction, setDirection] = useState("E"); // N, E, S, W
  const [message, setMessage] = useState("");

  // Helper: check if path is free
  const isPathForward = () => {
    let { x, y } = player;
    if (direction === "N") y--;
    if (direction === "S") y++;
    if (direction === "E") x++;
    if (direction === "W") x--;

    return grid[y] && grid[y][x] !== 0; // not wall
  };

  // Game API for Blockly
  const api = {
    moveForward: () => {
      setPlayer((prev) => {
        let { x, y } = prev;
        if (direction === "N") y--;
        if (direction === "S") y++;
        if (direction === "E") x++;
        if (direction === "W") x--;
        if (grid[y] && grid[y][x] !== 0) return { x, y };
        return prev; // blocked
      });
    },
    turnLeft: () => {
      setDirection((prev) => {
        const dirs = ["N", "W", "S", "E"];
        return dirs[(dirs.indexOf(prev) + 1) % 4];
      });
    },
    turnRight: () => {
      setDirection((prev) => {
        const dirs = ["N", "E", "S", "W"];
        return dirs[(dirs.indexOf(prev) + 1) % 4];
      });
    },
    isPathForward: () => isPathForward(),
  };

  // Run student code
  useEffect(() => {
    if (!code) return;
    setMessage(""); // reset

    const interpreter = new Interpreter(code, (interpreter, global) => {
      Object.keys(api).forEach((fn) => {
        interpreter.setProperty(
          global,
          fn,
          interpreter.createNativeFunction(api[fn])
        );
      });
    });

    function nextStep() {
      if (interpreter.step()) {
        setTimeout(nextStep, 400); // animate
      } else {
        // check win condition
        if (grid[player.y][player.x] === "E") {
          setMessage("🎉 You reached the goal!");
        } else {
          setMessage("Try again!");
        }
      }
    }
    nextStep();
  }, [code]);

  return (
    <div className="p-4">
      <div className="grid grid-cols-8 gap-1">
        {grid.map((row, y) =>
          row.map((cell, x) => {
            const isPlayer = player.x === x && player.y === y;
            return (
              <div
                key={`${x}-${y}`}
                className={`w-10 h-10 flex items-center justify-center rounded ${
                  cell === 0
                    ? "bg-gray-700"
                    : cell === "E"
                    ? "bg-green-500"
                    : "bg-gray-200"
                }`}
              >
                {isPlayer ? "🤖" : cell === "E" ? "🏁" : ""}
              </div>
            );
          })
        )}
      </div>
      {message && <p className="mt-4 text-lg font-bold">{message}</p>}
    </div>
  );
}
