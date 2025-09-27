// src/features/kids/lessonview/blocks/mazeBlocks.js
import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";

// --- MOVE FORWARD ---
Blockly.Blocks["maze_move_forward"] = {
  init: function () {
    this.appendDummyInput().appendField("move forward");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(160);
    this.setTooltip("Move the character one step forward");
  },
};
javascriptGenerator.forBlock["maze_move_forward"] = function () {
  return "moveForward();\n";
};

// --- TURN LEFT ---
Blockly.Blocks["maze_turn_left"] = {
  init: function () {
    this.appendDummyInput().appendField("turn left");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(160);
    this.setTooltip("Turn the character left");
  },
};
javascriptGenerator.forBlock["maze_turn_left"] = function () {
  return "turnLeft();\n";
};

// --- TURN RIGHT ---
Blockly.Blocks["maze_turn_right"] = {
  init: function () {
    this.appendDummyInput().appendField("turn right");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(160);
    this.setTooltip("Turn the character right");
  },
};
javascriptGenerator.forBlock["maze_turn_right"] = function () {
  return "turnRight();\n";
};

// --- IF PATH FORWARD ---
Blockly.Blocks["maze_if_path_forward"] = {
  init: function () {
    this.appendValueInput("DO").setCheck(null).appendField("if path forward");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(210);
    this.setTooltip("Do something if there is a path forward");
  },
};
javascriptGenerator.forBlock["maze_if_path_forward"] = function (block) {
  const branch = javascriptGenerator.statementToCode(block, "DO");
  return `if (isPathForward()) {\n${branch}}\n`;
};

// --- IF PATH LEFT ---
Blockly.Blocks["maze_if_path_left"] = {
  init: function () {
    this.appendValueInput("DO").setCheck(null).appendField("if path left");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(210);
  },
};
javascriptGenerator.forBlock["maze_if_path_left"] = function (block) {
  const branch = javascriptGenerator.statementToCode(block, "DO");
  return `if (isPathLeft()) {\n${branch}}\n`;
};

// --- IF PATH RIGHT ---
Blockly.Blocks["maze_if_path_right"] = {
  init: function () {
    this.appendValueInput("DO").setCheck(null).appendField("if path right");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(210);
  },
};
javascriptGenerator.forBlock["maze_if_path_right"] = function (block) {
  const branch = javascriptGenerator.statementToCode(block, "DO");
  return `if (isPathRight()) {\n${branch}}\n`;
};
