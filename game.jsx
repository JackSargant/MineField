// MINEFIELD — drinking game prototype
const { useState, useEffect, useRef, useMemo } = React;

// ─── DESIGN TOKENS ────────────────────────────────────────────
const C = {
  bg:        '#0b0a08',
  bgDeep:    '#050504',
  surface:   '#161410',
  surface2:  '#1f1c16',
  line:      '#2a261d',
  hazard:    '#f5d000',
  hazardDim: '#8a7600',
  danger:    '#ff3a2d',
  dangerDim: '#7a1a14',
  olive:     '#7d8a4a',
  fg:        '#f4ede0',
  dim:       '#6b6657',
  dim2:      '#3d3a32',
};

const FONT_DISPLAY = '"Big Shoulders Stencil Display", "Big Shoulders Display", Impact, sans-serif';
const FONT_MONO    = '"Space Mono", "JetBrains Mono", ui-monospace, monospace';

// Player colors — vivid, distinct, tactical
const PLAYER_COLORS = [
  '#f5d000', // hazard yellow
  '#ff3a2d', // danger red
  '#3da9ff', // tactical blue
  '#7dd956', // toxic green
  '#c77dff', // purple
  '#ff8d2a', // orange
  '#ff6fa3', // pink
  '#e8e3d4', // off-white
];

// ─── TILE GENERATION ──────────────────────────────────────────
// Tile types: prompt-drink, prompt-dare, prompt-hotseat, prompt-rule, prompt-safe, mine, roulette
function generateBoard(length, seed) {
  // Weighted distribution. Always START at 0, FINISH at length-1.
  // Sprinkle: ~35% mine, ~18% roulette, ~47% prompts/safe
  const weights = [
    ['drink',     22],
    ['dare',      12],
    ['hotseat',   6],
    ['rule',      4],
    ['safe',      3],
    ['mine',      35],
    ['roulette',  18],
  ];
  const bag = [];
  weights.forEach(([k, w]) => { for (let i = 0; i < w; i++) bag.push(k); });

  // simple seeded RNG
  let s = seed;
  const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };

  const tiles = [{ kind: 'start' }];
  // ensure not too many mines in a row
  let mineStreak = 0;
  for (let i = 1; i < length - 1; i++) {
    let pick;
    for (let tries = 0; tries < 6; tries++) {
      pick = bag[Math.floor(rand() * bag.length)];
      if (pick === 'mine' && mineStreak >= 2) continue;
      break;
    }
    mineStreak = pick === 'mine' ? mineStreak + 1 : 0;
    tiles.push({ kind: pick, revealed: false });
  }
  tiles.push({ kind: 'finish' });
  return tiles;
}

// ─── SNAKE PATH LAYOUT ────────────────────────────────────────
// Returns {col, row} for each tile index, going right→down→left→down…
function snakeCoord(i, cols) {
  const row = Math.floor(i / cols);
  const inRow = i % cols;
  const col = row % 2 === 0 ? inRow : (cols - 1 - inRow);
  return { col, row };
}

// ═════════════════════════════════════════════════════════════
// ROOT APP
// ═════════════════════════════════════════════════════════════
function App() {
  const tweakDefaults = /*EDITMODE-BEGIN*/{
    "boardLength": 28,
    "boardCols": 4,
    "intensity": "spicy",
    "mineFlash": true
  }/*EDITMODE-END*/;
  const [t, setTweak] = useTweaks(tweakDefaults);

  const [screen, setScreen] = useState('intro'); // intro | setup | armory | game | win
  const [players, setPlayers] = useState([
    { name: 'KAI',    color: PLAYER_COLORS[0], pos: 0, drinks: 0 },
    { name: 'JESS',   color: PLAYER_COLORS[1], pos: 0, drinks: 0 },
    { name: 'OMAR',   color: PLAYER_COLORS[2], pos: 0, drinks: 0 },
  ]);
  const [board, setBoard] = useState(() => generateBoard(28, 42));
  const [turn, setTurn] = useState(0);
  const [winner, setWinner] = useState(null);
  const [prompts, setPromptsState] = useState(() => {
    const loaded = loadPrompts();
    window.MINEFIELD_PROMPTS = loaded; // ensure live pool ready before first game
    return loaded;
  });
  const setPrompts = (p) => { savePrompts(p); setPromptsState(p); };

  const startGame = (newPlayers) => {
    setPlayers(newPlayers.map(p => ({ ...p, pos: 0, drinks: 0 })));
    setBoard(generateBoard(t.boardLength, Math.floor(Math.random() * 999999)));
    setTurn(0);
    setWinner(null);
    setScreen('game');
  };

  return (
    <>
    <IOSDevice width={402} height={874} dark>
      <div style={{
        position: 'absolute', inset: 0, background: C.bg,
        color: C.fg, fontFamily: FONT_MONO, overflow: 'hidden',
      }}>
        {screen === 'intro' && <IntroScreen onStart={() => setScreen('setup')} onArmory={() => setScreen('armory')} />}
        {screen === 'armory' && (
          <ArmoryScreen prompts={prompts} setPrompts={setPrompts} onBack={() => setScreen('intro')} />
        )}
        {screen === 'setup' && (
          <SetupScreen
            initial={players}
            tweaks={t}
            setTweak={setTweak}
            onBack={() => setScreen('intro')}
            onStart={startGame}
          />
        )}
        {screen === 'game' && (
          <GameScreen
            players={players} setPlayers={setPlayers}
            board={board} setBoard={setBoard}
            turn={turn} setTurn={setTurn}
            cols={t.boardCols}
            mineFlash={t.mineFlash}
            onWin={(p) => { setWinner(p); setScreen('win'); }}
            onQuit={() => setScreen('intro')}
          />
        )}
        {screen === 'win' && (
          <WinScreen winner={winner} players={players}
            onAgain={() => setScreen('setup')}
            onHome={() => setScreen('intro')} />
        )}
      </div>
    </IOSDevice>

    <TweaksPanel title="Tweaks">
      <TweakSection label="Board" />
      <TweakSlider label="Path length" value={t.boardLength} min={16} max={40} step={2}
        onChange={(v) => setTweak('boardLength', v)} />
      <TweakSlider label="Columns" value={t.boardCols} min={3} max={5} step={1}
        onChange={(v) => setTweak('boardCols', v)} />
      <TweakSection label="Atmosphere" />
      <TweakRadio label="Intensity" value={t.intensity}
        options={[{value:'mild',label:'MILD'},{value:'spicy',label:'SPICY'},{value:'wild',label:'WILD'}]}
        onChange={(v) => setTweak('intensity', v)} />
      <TweakToggle label="Mine flash" value={t.mineFlash}
        onChange={(v) => setTweak('mineFlash', v)} />
    </TweaksPanel>
    </>
  );
}

// ═════════════════════════════════════════════════════════════
// SHARED ATOMS
// ═════════════════════════════════════════════════════════════
function HazardStripes({ height = 12, opacity = 1, style = {} }) {
  return (
    <div style={{
      height, width: '100%', opacity,
      backgroundImage: `repeating-linear-gradient(135deg, ${C.hazard} 0 14px, #0b0a08 14px 28px)`,
      ...style,
    }} />
  );
}

function StencilButton({ children, onClick, kind = 'primary', disabled, style = {} }) {
  const base = {
    primary: { bg: C.hazard, fg: '#0a0a0a', border: C.hazard },
    danger:  { bg: C.danger, fg: '#fff',    border: C.danger },
    ghost:   { bg: 'transparent', fg: C.fg, border: C.line },
  }[kind];
  return (
    <button onClick={onClick} disabled={disabled} style={{
      fontFamily: FONT_DISPLAY, fontWeight: 900,
      fontSize: 22, letterSpacing: 1.2,
      padding: '16px 22px',
      background: base.bg, color: base.fg,
      border: `2px solid ${base.border}`,
      borderRadius: 4,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      width: '100%',
      textTransform: 'uppercase',
      transition: 'transform 80ms',
      ...style,
    }}
    onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = 'translateY(1px)')}
    onMouseUp={(e) => (e.currentTarget.style.transform = '')}
    onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
    >{children}</button>
  );
}

function Tag({ children, color = C.hazard, style = {} }) {
  return (
    <span style={{
      fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 1.5,
      color, border: `1px solid ${color}`,
      padding: '3px 7px 2px', borderRadius: 2,
      textTransform: 'uppercase', ...style,
    }}>{children}</span>
  );
}

function Crosshair({ size = 14, color = C.hazard }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" style={{ display: 'block' }}>
      <circle cx="7" cy="7" r="5" stroke={color} strokeWidth="1" fill="none" />
      <line x1="7" y1="0" x2="7" y2="3" stroke={color} strokeWidth="1" />
      <line x1="7" y1="11" x2="7" y2="14" stroke={color} strokeWidth="1" />
      <line x1="0" y1="7" x2="3" y2="7" stroke={color} strokeWidth="1" />
      <line x1="11" y1="7" x2="14" y2="7" stroke={color} strokeWidth="1" />
      <circle cx="7" cy="7" r="1" fill={color} />
    </svg>
  );
}

// Export to window for sibling scripts
Object.assign(window, {
  App, C, FONT_DISPLAY, FONT_MONO, PLAYER_COLORS,
  HazardStripes, StencilButton, Tag, Crosshair,
  generateBoard, snakeCoord,
});
