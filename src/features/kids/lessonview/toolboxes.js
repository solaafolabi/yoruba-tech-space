
export const TOOLBOXES = {
  // ------------------ MAZE GAME ------------------
  maze: `
    <xml>
      <category name="🚶 Movement" colour="#5CA699">
        <block type="maze_move_forward"></block>
        <block type="maze_turn_left"></block>
        <block type="maze_turn_right"></block>
        <block type="maze_if_path_forward"></block>
      </category>
      <category name="🎠 Loops" colour="#FFCC66">
        <block type="controls_repeat_ext">
          <value name="TIMES">
            <shadow type="math_number"><field name="NUM">3</field></shadow>
          </value>
        </block>
        <block type="controls_whileUntil"></block>
      </category>
      <category name="✨ Logic" colour="#FF99CC">
        <block type="controls_if"></block>
        <block type="logic_compare"></block>
        <block type="logic_operation"></block>
        <block type="logic_boolean"></block>
      </category>
      <category name="📌 Variables" colour="#FF6961" custom="VARIABLE"></category>
      <category name="⚙️ Functions" colour="#9A66FF" custom="PROCEDURE"></category>
    </xml>
  `,

  // ------------------ MATH QUIZ ------------------
  mathquiz: `
    <xml>
      <category name="🧮 Numbers & Math" colour="#5C81A6">
        <block type="math_number"></block>
        <block type="math_arithmetic"></block>
        <block type="math_single"></block>
        <block type="math_trig"></block>
        <block type="math_constant"></block>
        <block type="math_number_property"></block>
        <block type="math_round"></block>
        <block type="math_modulo"></block>
        <block type="math_random_int"></block>
      </category>
      <category name="✨ Logic" colour="#FF99CC">
        <block type="controls_if"></block>
        <block type="logic_compare"></block>
        <block type="logic_boolean"></block>
      </category>
      <category name="💬 Output" colour="#CC99FF">
        <block type="text_print"></block>
      </category>
      <category name="📌 Variables" colour="#FF6961" custom="VARIABLE"></category>
    </xml>
  `,

  // ------------------ WORD MATCH ------------------
  wordmatch: `
    <xml>
      <category name="💬 Text" colour="#CC99FF">
        <block type="text"></block>
        <block type="text_join"></block>
        <block type="text_length"></block>
        <block type="text_isEmpty"></block>
        <block type="text_indexOf"></block>
        <block type="text_charAt"></block>
        <block type="text_getSubstring"></block>
        <block type="text_changeCase"></block>
        <block type="text_trim"></block>
      </category>
      <category name="✨ Logic" colour="#FF99CC">
        <block type="controls_if"></block>
        <block type="logic_compare"></block>
        <block type="logic_operation"></block>
      </category>
      <category name="📌 Variables" colour="#FF6961" custom="VARIABLE"></category>
    </xml>
  `,

  // ------------------ MEMORY GAME ------------------
  memory: `
    <xml>
      <category name="🎴 Memory Blocks" colour="#5CA699">
        <block type="controls_if"></block>
        <block type="logic_compare"></block>
        <block type="logic_operation"></block>
      </category>
      <category name="📌 Variables" colour="#FF6961" custom="VARIABLE"></category>
      <category name="✨ Loops" colour="#FFCC66">
        <block type="controls_repeat_ext"></block>
      </category>
    </xml>
  `,

  // ------------------ SORTING GAME ------------------
  sorting: `
    <xml>
      <category name="🧺 Sorting" colour="#F6A5C0">
        <block type="lists_create_with"></block>
        <block type="lists_sort"></block>
        <block type="lists_getIndex"></block>
      </category>
      <category name="✨ Loops" colour="#FFCC66">
        <block type="controls_forEach"></block>
      </category>
      <category name="📌 Variables" colour="#FF6961" custom="VARIABLE"></category>
    </xml>
  `,

  // ------------------ SHAPES ------------------
  shapes: `
    <xml>
      <category name="🔺 Shapes & Colors" colour="#8CC152">
        <block type="draw_circle"></block>
        <block type="draw_rectangle"></block>
        <block type="draw_triangle"></block>
        <block type="set_color"></block>
      </category>
      <category name="✨ Loops" colour="#FFCC66">
        <block type="controls_repeat_ext"></block>
      </category>
    </xml>
  `,

  // ------------------ SEQUENCE ------------------
  sequence: `
    <xml>
      <category name="📖 Story Steps" colour="#FFB347">
        <block type="text"></block>
        <block type="lists_create_with"></block>
        <block type="controls_repeat_ext"></block>
      </category>
    </xml>
  `,

  // ------------------ SPELLING ------------------
  spelling: `
    <xml>
      <category name="🔤 Letters & Words" colour="#CC99FF">
        <block type="text"></block>
        <block type="text_join"></block>
        <block type="text_charAt"></block>
        <block type="text_length"></block>
      </category>
      <category name="✨ Logic" colour="#FF99CC">
        <block type="logic_compare"></block>
      </category>
    </xml>
  `,

  // ------------------ ADVENTURE ------------------
  adventure: `
    <xml>
      <category name="🚀 Movement" colour="#5CA699">
        <block type="maze_move_forward"></block>
        <block type="maze_turn_left"></block>
        <block type="maze_turn_right"></block>
      </category>
      <category name="✨ Logic" colour="#FF99CC">
        <block type="controls_if"></block>
        <block type="logic_compare"></block>
      </category>
      <category name="🎠 Loops" colour="#FFCC66">
        <block type="controls_repeat_ext"></block>
      </category>
      <category name="📌 Variables" colour="#FF6961" custom="VARIABLE"></category>
    </xml>
  `,

  // ------------------ ROBOT / TURTLE GRAPHICS ------------------
  robot_graphics: `
    <xml>
      <category name="🤖 Robot Movement" colour="#8CC152">
        <block type="artist_move_forward"></block>
        <block type="artist_turn_left"></block>
        <block type="artist_turn_right"></block>
        <block type="artist_pen_up"></block>
        <block type="artist_pen_down"></block>
        <block type="artist_set_color"></block>
      </category>
      <category name="✨ Loops" colour="#FFCC66">
        <block type="controls_repeat_ext"></block>
        <block type="controls_whileUntil"></block>
      </category>
      <category name="📌 Variables" colour="#FF6961" custom="VARIABLE"></category>
      <category name="⚙️ Functions" colour="#9A66FF" custom="PROCEDURE"></category>
    </xml>
  `,

  // ------------------ SIMULATION ------------------
  simulation: `
    <xml>
      <category name="⚡ Events" colour="#FFCC66">
        <block type="controls_if"></block>
        <block type="controls_repeat_ext"></block>
      </category>
      <category name="📊 Variables" colour="#FF6961" custom="VARIABLE"></category>
      <category name="✨ Logic" colour="#FF99CC">
        <block type="logic_compare"></block>
        <block type="logic_operation"></block>
      </category>
    </xml>
  `,

  // ------------------ PUZZLE / LOGIC ------------------
  puzzle: `
    <xml>
      <category name="🧩 Logic" colour="#FF99CC">
        <block type="controls_if"></block>
        <block type="logic_compare"></block>
        <block type="logic_operation"></block>
        <block type="logic_boolean"></block>
      </category>
      <category name="✨ Loops" colour="#FFCC66">
        <block type="controls_repeat_ext"></block>
      </category>
    </xml>
  `,

  // ------------------ INTERACTIVE ------------------
  interactive: `
    <xml>
      <category name="🖱️ Events" colour="#F6A5C0">
        <block type="event_onclick"></block>
        <block type="event_onkey"></block>
      </category>
      <category name="⚡ Actions" colour="#8CC152">
        <block type="text_print"></block>
        <block type="artist_move_forward"></block>
      </category>
    </xml>
  `,

  // ------------------ AI CHALLENGE ------------------
  ai_challenge: `
    <xml>
      <category name="🤖 AI Decisions" colour="#5CA699">
        <block type="controls_if"></block>
        <block type="logic_compare"></block>
        <block type="logic_operation"></block>
      </category>
      <category name="📊 Variables" colour="#FF6961" custom="VARIABLE"></category>
      <category name="✨ Loops" colour="#FFCC66">
        <block type="controls_repeat_ext"></block>
      </category>
    </xml>
  `,

  // ------------------ MUSIC ------------------
  music: `
    <xml>
      <category name="🎵 Music" colour="#FFB347">
        <block type="music_play_note"></block>
        <block type="music_set_instrument"></block>
        <block type="controls_repeat_ext"></block>
      </category>
    </xml>
  `,

  // ------------------ BIRDS ------------------
  birds: `
    <xml>
      <category name="🐦 Bird Movement" colour="#5CA699">
        <block type="bird_move_up"></block>
        <block type="bird_move_down"></block>
        <block type="bird_flap"></block>
      </category>
      <category name="✨ Logic" colour="#FF99CC">
        <block type="controls_if"></block>
        <block type="logic_compare"></block>
      </category>
      <category name="🎠 Loops" colour="#FFCC66">
        <block type="controls_repeat_ext"></block>
      </category>
    </xml>
  `,
};
