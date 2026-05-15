// MINEFIELD — game screen: board, dice, tile reveals
const { useState: useS2, useEffect: useE2, useRef: useR2, useMemo: useM2 } = React;

// ═════════════════════════════════════════════════════════════
// GAME SCREEN
// ═════════════════════════════════════════════════════════════
function GameScreen({ players, setPlayers, board, setBoard, turn, setTurn, cols, mineFlash, onWin, onQuit }) {
  const [dice, setDice] = useS2(null);            // last roll
  const [rolling, setRolling] = useS2(false);
  const [moving, setMoving] = useS2(false);       // animation in progress
  const [reveal, setReveal] = useS2(null);        // { type, prompt, mineIdx, tileIdx } | null
  const [showQuit, setShowQuit] = useS2(false);

  const current = players[turn];

  const roll = () => {
    if (rolling || moving || reveal) return;
    setRolling(true);
    let n = 0;
    const interval = setInterval(() => {
      setDice(1 + Math.floor(Math.random() * 6));
      n++;
      if (n > 10) {
        clearInterval(interval);
        const final = 1 + Math.floor(Math.random() * 6);
        setDice(final);
        setRolling(false);
        setTimeout(() => doMove(final), 400);
      }
    }, 70);
  };

  const doMove = (steps) => {
    setMoving(true);
    const start = current.pos;
    const end = Math.min(start + steps, board.length - 1);
    let i = start;
    const tick = () => {
      i++;
      setPlayers(ps => ps.map((p, idx) => idx === turn ? { ...p, pos: i } : p));
      if (i < end) setTimeout(tick, 240);
      else setTimeout(() => onLand(end), 320);
    };
    setTimeout(tick, 200);
  };

  const onLand = (idx) => {
    setMoving(false);
    const tile = board[idx];
    // mark revealed
    setBoard(b => b.map((t, k) => k === idx ? { ...t, revealed: true } : t));

    if (idx === board.length - 1) {
      // WIN
      setTimeout(() => onWin(current), 300);
      return;
    }
    if (tile.kind === 'mine') {
      setReveal({ type: 'mine', tileIdx: idx });
    } else if (tile.kind === 'roulette') {
      setReveal({ type: 'roulette', tileIdx: idx });
    } else {
      // prompt of some kind
      const pool = window.MINEFIELD_PROMPTS[tile.kind] || window.MINEFIELD_PROMPTS.drink;
      const prompt = pool[Math.floor(Math.random() * pool.length)];
      setReveal({ type: 'prompt', kind: tile.kind, prompt, tileIdx: idx });
    }
  };

  const closeReveal = (drinkCount = 0, victimIdx = turn) => {
    // Support multi-victim payload: closeReveal({ drinks: [{idx, n}, ...] })
    if (drinkCount && typeof drinkCount === 'object' && Array.isArray(drinkCount.drinks)) {
      const drinks = drinkCount.drinks;
      setPlayers(ps => ps.map((p, idx) => {
        const hit = drinks.find(d => d.idx === idx);
        return hit ? { ...p, drinks: p.drinks + hit.n } : p;
      }));
    } else if (typeof drinkCount === 'number' && drinkCount > 0) {
      setPlayers(ps => ps.map((p, idx) => idx === victimIdx ? { ...p, drinks: p.drinks + drinkCount } : p));
    }
    setReveal(null);
    setDice(null);
    setTurn((turn + 1) % players.length);
  };

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: C.bg }}>
      {/* Header bar */}
      <GameHeader turn={turn} players={players} onQuit={() => setShowQuit(true)} />

      {/* Board */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px 8px' }}>
        <Board board={board} players={players} cols={cols} currentPlayerIdx={turn} />
      </div>

      {/* Bottom HUD */}
      <BottomHUD
        current={current}
        dice={dice}
        rolling={rolling}
        moving={moving || !!reveal}
        onRoll={roll}
      />

      {/* Reveal overlays */}
      {reveal?.type === 'prompt' && (
        <PromptReveal data={reveal} player={current} onClose={closeReveal} />
      )}
      {reveal?.type === 'mine' && (
        <MineReveal player={current} onClose={closeReveal} flash={mineFlash} />
      )}
      {reveal?.type === 'roulette' && (
        <MiniGameReveal players={players} starter={turn} onClose={closeReveal} />
      )}

      {/* Quit confirm */}
      {showQuit && (
        <Overlay onClose={() => setShowQuit(false)}>
          <div style={{
            background: C.surface, border: `1px solid ${C.danger}`, padding: 22, borderRadius: 4, maxWidth: 300,
          }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, marginBottom: 8 }}>ABORT MISSION?</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.dim, marginBottom: 18 }}>
              The minefield doesn't forget cowards.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <StencilButton kind="ghost" onClick={() => setShowQuit(false)}>STAY</StencilButton>
              <StencilButton kind="danger" onClick={onQuit}>QUIT</StencilButton>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}

// ─── HEADER ────────────────────────────────────────────────────
function GameHeader({ turn, players, onQuit }) {
  return (
    <div style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '4px 18px',
        fontFamily: FONT_MONO, fontSize: 10, color: C.dim, letterSpacing: 1.5,
      }}>
        <span>◉ LIVE</span>
        <span>SECTOR-07 // EXFIL</span>
        <button onClick={onQuit} style={{
          background: 'none', border: 'none', color: C.dim,
          fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 1.5, cursor: 'pointer', padding: 0,
        }}>QUIT ✕</button>
      </div>
      <HazardStripes height={6} style={{ marginTop: 8, opacity: 0.7 }} />

      {/* Player chips */}
      <div style={{
        display: 'flex', gap: 6, padding: '10px 14px 8px', overflowX: 'auto',
      }}>
        {players.map((p, i) => {
          const active = i === turn;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 8px',
              border: `1px solid ${active ? p.color : C.line}`,
              borderRadius: 3,
              background: active ? `${p.color}15` : 'transparent',
              flexShrink: 0,
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, boxShadow: active ? `0 0 8px ${p.color}` : 'none' }} />
              <span style={{
                fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 14, letterSpacing: 0.5,
                color: active ? p.color : C.dim,
              }}>{p.name}</span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.dim }}>{p.drinks}×</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── BOARD ─────────────────────────────────────────────────────
function Board({ board, players, cols, currentPlayerIdx }) {
  const [viewW, setViewW] = useS2(() => Math.min(window.innerWidth, 480));
  useE2(() => {
    const onResize = () => setViewW(Math.min(window.innerWidth, 480));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // horizontal space consumed: GameScreen 14px/side + grid padding 8px/side = 44px total
  const cellGap = 6;
  const usableW = viewW - 44;
  const cellSize = Math.floor((usableW - cellGap * (cols - 1)) / cols);

  // Precompute tile positions
  const positions = useM2(() => board.map((_, i) => snakeCoord(i, cols)), [board, cols]);
  const rows = Math.ceil(board.length / cols);

  // Group players by tile so we can stack
  const playersByTile = {};
  players.forEach((p, idx) => {
    if (!playersByTile[p.pos]) playersByTile[p.pos] = [];
    playersByTile[p.pos].push({ p, idx });
  });

  return (
    <div style={{ padding: '10px 0 14px', position: 'relative' }}>
      {/* coord readout */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontFamily: FONT_MONO, fontSize: 10, color: C.dim, letterSpacing: 1.5, marginBottom: 8,
      }}>
        <span>// GRID {cols}×{rows}</span>
        <span>TILES {board.length}</span>
      </div>

      {/* faint perimeter */}
      <div style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gap: cellGap,
        padding: 8,
        background: C.bgDeep,
        border: `1px solid ${C.line}`,
        backgroundImage: `
          linear-gradient(${C.line} 1px, transparent 1px),
          linear-gradient(90deg, ${C.line} 1px, transparent 1px)
        `,
        backgroundSize: `${cellSize + cellGap}px ${cellSize + cellGap}px`,
        backgroundPosition: '8px 8px',
      }}>
        {/* Draw snake path lines between consecutive tiles */}
        <PathLines positions={positions} cellSize={cellSize} cellGap={cellGap} pad={8} cols={cols} />

        {board.map((tile, i) => {
          const { col, row } = positions[i];
          const occupants = playersByTile[i] || [];
          return (
            <div key={i} style={{
              gridColumn: col + 1, gridRow: row + 1,
              width: cellSize, height: cellSize, position: 'relative',
            }}>
              <Tile tile={tile} index={i} total={board.length} size={cellSize}
                occupants={occupants} currentIdx={currentPlayerIdx} />
            </div>
          );
        })}
      </div>

      {/* legend */}
      <div style={{
        marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap',
        fontFamily: FONT_MONO, fontSize: 9, color: C.dim, letterSpacing: 1,
      }}>
        <LegendItem color={C.dim} label="? UNREVEALED" />
        <LegendItem color={C.hazard} label="PROMPT" />
        <LegendItem color={C.danger} label="MINE" />
        <LegendItem color={C.olive} label="ROULETTE" />
      </div>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 7, height: 7, background: color, display: 'inline-block' }} />{label}
    </span>
  );
}

function PathLines({ positions, cellSize, cellGap, pad, cols }) {
  // Use SVG positioned absolutely behind tiles
  if (positions.length < 2) return null;
  const step = cellSize + cellGap;
  const w = cols * cellSize + (cols - 1) * cellGap;
  const rows = Math.max(...positions.map(p => p.row)) + 1;
  const h = rows * cellSize + (rows - 1) * cellGap;

  const center = (p) => ({
    x: p.col * step + cellSize / 2,
    y: p.row * step + cellSize / 2,
  });

  let d = '';
  positions.forEach((p, i) => {
    const c = center(p);
    d += i === 0 ? `M ${c.x} ${c.y} ` : `L ${c.x} ${c.y} `;
  });

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{
      position: 'absolute', top: pad, left: pad, pointerEvents: 'none', zIndex: 0,
    }}>
      <path d={d} stroke={C.dim2} strokeWidth="2" fill="none" strokeDasharray="3 4" />
    </svg>
  );
}

// ─── TILE ──────────────────────────────────────────────────────
function Tile({ tile, index, total, size, occupants, currentIdx }) {
  const isStart = index === 0;
  const isFinish = index === total - 1;
  const revealed = tile.revealed || isStart || isFinish;

  let bg = C.surface;
  let border = C.line;
  let glyph = null;
  let glyphColor = C.dim;

  if (isStart) {
    bg = C.surface2; border = C.olive; glyph = 'GO'; glyphColor = C.olive;
  } else if (isFinish) {
    bg = C.hazard; border = C.hazard; glyph = '★'; glyphColor = '#0a0a0a';
  } else if (!revealed) {
    bg = C.surface; border = C.line; glyph = '?'; glyphColor = C.dim;
  } else if (tile.kind === 'mine') {
    bg = '#2a0c0a'; border = C.danger; glyph = '💥'; glyphColor = C.danger;
  } else if (tile.kind === 'roulette') {
    bg = '#1a1f10'; border = C.olive; glyph = '◎'; glyphColor = C.olive;
  } else {
    // some prompt
    bg = '#1a1605'; border = C.hazard;
    const map = { drink: '🥃', dare: '!', hotseat: '☼', rule: '§', safe: '✓' };
    glyph = map[tile.kind] || '◆';
    glyphColor = C.hazard;
  }

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      background: bg, border: `1.5px solid ${border}`, borderRadius: 3,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', zIndex: 1,
    }}>
      {/* corner index */}
      <div style={{
        position: 'absolute', top: 3, left: 4,
        fontFamily: FONT_MONO, fontSize: 8, color: revealed && (isFinish) ? '#0a0a0a99' : C.dim, letterSpacing: 0.5,
      }}>
        {String(index).padStart(2, '0')}
      </div>

      {/* texture for unrevealed */}
      {!revealed && (
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.4,
          backgroundImage: `repeating-linear-gradient(45deg, transparent 0 3px, ${C.dim2} 3px 4px)`,
        }} />
      )}

      {/* hazard stripes for finish */}
      {isFinish && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `repeating-linear-gradient(135deg, ${C.hazard} 0 4px, #0a0a0a 4px 8px)`,
          opacity: 0.55,
        }} />
      )}

      <div style={{
        position: 'relative', zIndex: 1,
        fontFamily: glyph === '?' || glyph === 'GO' ? FONT_DISPLAY : 'inherit',
        fontSize: size > 56 ? 22 : 18, fontWeight: 900,
        color: glyphColor, letterSpacing: 0,
      }}>{glyph}</div>

      {/* Player pawns */}
      {occupants.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 3, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', gap: 2,
          flexWrap: 'wrap', zIndex: 2,
        }}>
          {occupants.map(({ p, idx }) => (
            <div key={idx} style={{
              width: 10, height: 10, borderRadius: '50%',
              background: p.color,
              border: '1.5px solid #0a0a0a',
              boxShadow: idx === currentIdx ? `0 0 6px ${p.color}` : 'none',
              animation: idx === currentIdx ? 'mfPulse 1.4s ease-in-out infinite' : 'none',
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── BOTTOM HUD ────────────────────────────────────────────────
function BottomHUD({ current, dice, rolling, moving, onRoll }) {
  return (
    <div style={{
      borderTop: `1px solid ${C.line}`,
      background: `linear-gradient(180deg, ${C.bg}, ${C.bgDeep})`,
      padding: '14px 18px calc(env(safe-area-inset-bottom, 0px) + 18px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Whose turn */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.dim, letterSpacing: 2 }}>
            UP NEXT
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginTop: 4,
          }}>
            <div style={{
              width: 16, height: 16, borderRadius: '50%', background: current.color,
              boxShadow: `0 0 10px ${current.color}`,
            }} />
            <div style={{
              fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 26, letterSpacing: 0.5,
              color: current.color, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap',
            }}>{current.name}</div>
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.dim, marginTop: 2 }}>
            POS {String(current.pos).padStart(2, '0')} · {current.drinks}× drinks
          </div>
        </div>

        {/* Dice + roll button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <DieFace value={dice} rolling={rolling} />
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <StencilButton onClick={onRoll} disabled={rolling || moving}>
          {rolling ? '⟳ ROLLING…' : moving ? '· · ·' : '▶ ROLL 1–6'}
        </StencilButton>
      </div>
    </div>
  );
}

function DieFace({ value, rolling }) {
  const dot = (cx, cy) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" fill={C.bg} />;
  // 48×48 viewbox — 3 columns at 10/24/38, 3 rows at 10/24/38
  const L = 10, M = 24, R = 38;
  const layout = {
    1: [[M, M]],
    2: [[L, L], [R, R]],
    3: [[L, L], [M, M], [R, R]],
    4: [[L, L], [R, L], [L, R], [R, R]],
    5: [[L, L], [R, L], [M, M], [L, R], [R, R]],
    6: [[L, L], [R, L], [L, M], [R, M], [L, R], [R, R]],
  };
  const v = value || 1;
  return (
    <div style={{
      width: 56, height: 56, borderRadius: 6,
      background: C.hazard, position: 'relative',
      boxShadow: `0 0 0 1px #000, 0 4px 0 ${C.hazardDim}`,
      transform: rolling ? 'rotate(8deg)' : 'rotate(-3deg)',
      transition: 'transform 100ms',
    }}>
      {value !== null && (
        <svg width="48" height="48" viewBox="0 0 48 48" style={{ position: 'absolute', top: 4, left: 4 }}>
          {layout[v].map(([x, y]) => dot(x, y))}
        </svg>
      )}
      {value === null && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 30, color: C.bg,
        }}>?</div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// REVEAL OVERLAYS
// ═════════════════════════════════════════════════════════════
function Overlay({ children, onClose, dim = 0.85 }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: `rgba(5,5,4,${dim})`,
      backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 22,
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 340 }}>
        {children}
      </div>
    </div>
  );
}

function PromptReveal({ data, player, onClose }) {
  const { kind, prompt } = data;
  const kindMeta = {
    drink:   { label: 'DRINK',     color: C.hazard, icon: '🥃' },
    dare:    { label: 'DARE',      color: C.hazard, icon: '!' },
    hotseat: { label: 'HOT SEAT',  color: C.hazard, icon: '☼' },
    rule:    { label: 'NEW RULE',  color: C.hazard, icon: '§' },
    safe:    { label: 'SAFE',      color: C.olive,  icon: '✓' },
  }[kind] || { label: 'PROMPT', color: C.hazard, icon: '◆' };

  return (
    <Overlay onClose={() => onClose(0)}>
      <div style={{
        background: C.surface, border: `2px solid ${kindMeta.color}`, padding: 0, borderRadius: 4,
        animation: 'mfPop 200ms ease-out',
      }}>
        <div style={{
          background: kindMeta.color, color: '#0a0a0a',
          padding: '8px 14px', fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 2,
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span>// TILE REVEAL</span>
          <span>{kindMeta.label}</span>
        </div>
        <div style={{ padding: '22px 22px 4px' }}>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 11, color: C.dim, letterSpacing: 1.5, marginBottom: 8,
          }}>FOR <span style={{ color: player.color }}>{player.name}</span></div>
          <div style={{
            fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 44, lineHeight: 0.9,
            color: kindMeta.color, marginBottom: 14,
          }}>{prompt.title}</div>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 14, lineHeight: 1.55, color: C.fg, marginBottom: 22,
          }}>{prompt.body}</div>
        </div>
        <HazardStripes height={6} opacity={0.6} />
        <div style={{ padding: 14, display: 'flex', gap: 8 }}>
          {kind === 'safe' ? (
            <StencilButton onClick={() => onClose(0)}>OK</StencilButton>
          ) : (
            <>
              <StencilButton kind="ghost" onClick={() => onClose(1)} style={{ fontSize: 16 }}>I DRANK ↓</StencilButton>
              <StencilButton onClick={() => onClose(0)} style={{ fontSize: 16 }}>DONE ▶</StencilButton>
            </>
          )}
        </div>
      </div>
    </Overlay>
  );
}

function MineReveal({ player, onClose, flash }) {
  const [phase, setPhase] = useS2(0);
  useE2(() => {
    if (!flash) { setPhase(2); return; }
    const t1 = setTimeout(() => setPhase(1), 80);
    const t2 = setTimeout(() => setPhase(2), 350);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [flash]);

  if (phase < 2) {
    return (
      <div style={{
        position: 'absolute', inset: 0, zIndex: 100,
        background: phase === 0 ? '#fff' : C.danger,
        transition: 'background 100ms',
      }} />
    );
  }

  return (
    <Overlay onClose={() => onClose(2)} dim={0.95}>
      <div style={{
        background: '#1a0606', border: `2px solid ${C.danger}`, padding: 0, borderRadius: 4,
        animation: 'mfPop 300ms cubic-bezier(.2,.8,.2,1)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* danger stripes */}
        <div style={{
          height: 8,
          backgroundImage: `repeating-linear-gradient(135deg, ${C.danger} 0 12px, #0a0a0a 12px 24px)`,
        }} />
        <div style={{ padding: '28px 22px 0', textAlign: 'center' }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.danger, letterSpacing: 3 }}>
            ⚠ DETONATION
          </div>
          <div style={{
            fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 92, lineHeight: 0.85,
            color: C.danger, marginTop: 8,
            textShadow: `3px 3px 0 #000, -3px -3px 0 #000`,
          }}>BOOM</div>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 13, color: C.fg, marginTop: 16, lineHeight: 1.5,
          }}>
            <span style={{ color: player.color }}>{player.name}</span> stepped on a mine.
          </div>
          <div style={{
            marginTop: 18,
            fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 30, color: C.hazard,
            border: `2px dashed ${C.hazard}`, padding: '12px',
          }}>
            TAKE 2 SIPS.
          </div>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 10, color: C.dim, letterSpacing: 2, marginTop: 14,
          }}>NO NEGOTIATION.</div>
        </div>
        <div style={{ padding: 14 }}>
          <StencilButton kind="danger" onClick={() => onClose(2)}>↓ DRANK</StencilButton>
        </div>
        <div style={{
          height: 8,
          backgroundImage: `repeating-linear-gradient(135deg, ${C.danger} 0 12px, #0a0a0a 12px 24px)`,
        }} />
      </div>
    </Overlay>
  );
}

// ─── ROULETTE ──────────────────────────────────────────────────
// Each player picks a hidden slot in turn (passing the phone).
// One slot is the BOMB. All reveal at the end.
function RouletteReveal({ players, starter, onClose }) {
  const N = players.length;
  const [bombSlot] = useS2(() => Math.floor(Math.random() * N));
  // picks[playerIdx] = slotIdx, or undefined
  const [picks, setPicks] = useS2({});
  const [turnIdx, setTurnIdx] = useS2(0); // 0..N-1 within roulette order
  const [phase, setPhase] = useS2('intro'); // intro | handoff | pick | reveal
  const order = useM2(() => {
    // start with the player who triggered, then around the table
    return Array.from({ length: N }, (_, i) => (starter + i) % N);
  }, [N, starter]);

  const currentPickerIdx = order[turnIdx];
  const currentPicker = players[currentPickerIdx];
  const usedSlots = new Set(Object.values(picks));

  const pickSlot = (s) => {
    if (usedSlots.has(s)) return;
    const next = { ...picks, [currentPickerIdx]: s };
    setPicks(next);
    if (turnIdx + 1 >= N) {
      // all picked — go to reveal
      setTimeout(() => setPhase('reveal'), 300);
    } else {
      setTurnIdx(turnIdx + 1);
      setPhase('handoff');
    }
  };

  if (phase === 'intro') {
    return (
      <Overlay onClose={() => {}}>
        <div style={{
          background: C.surface, border: `2px solid ${C.olive}`, padding: 0, borderRadius: 4,
          animation: 'mfPop 200ms ease-out',
        }}>
          <div style={{ background: C.olive, color: '#0a0a0a', padding: '8px 14px',
            fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 2,
            display: 'flex', justifyContent: 'space-between' }}>
            <span>// TILE REVEAL</span><span>ROULETTE</span>
          </div>
          <div style={{ padding: '22px' }}>
            <div style={{
              fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 46, lineHeight: 0.9,
              color: C.olive, marginBottom: 12,
            }}>NUMBER<br/>ROULETTE.</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.fg, lineHeight: 1.55 }}>
              Pass the phone. Each player picks one of <b>{N}</b> face-down numbers.
              <br/><br/>
              One of them is <span style={{ color: C.danger }}>the BOMB</span>.
              <br/><br/>
              Reveal together. Bomb drinks <b>3</b>.
            </div>
          </div>
          <HazardStripes height={6} opacity={0.5} />
          <div style={{ padding: 14 }}>
            <StencilButton onClick={() => setPhase('handoff')}>
              ▶ START — {currentPicker.name}, YOU'RE UP
            </StencilButton>
          </div>
        </div>
      </Overlay>
    );
  }

  if (phase === 'handoff') {
    return (
      <Overlay onClose={() => {}}>
        <div style={{
          background: C.surface, border: `2px solid ${currentPicker.color}`, padding: 26, borderRadius: 4,
          textAlign: 'center', animation: 'mfPop 200ms ease-out',
        }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.dim, letterSpacing: 2 }}>
            PASS THE PHONE TO
          </div>
          <div style={{
            fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 64, color: currentPicker.color,
            margin: '12px 0', textShadow: `3px 3px 0 #000`,
          }}>{currentPicker.name}</div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.dim, marginBottom: 18 }}>
            Don't let anyone see your pick.
            <br/>
            Pick one of {N - turnIdx} remaining.
          </div>
          <StencilButton onClick={() => setPhase('pick')}>I'M ALONE — PICK</StencilButton>
        </div>
      </Overlay>
    );
  }

  if (phase === 'pick') {
    return (
      <Overlay onClose={() => {}}>
        <div style={{ background: C.surface, border: `2px solid ${currentPicker.color}`, padding: 18, borderRadius: 4 }}>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 11, color: C.dim, letterSpacing: 2, marginBottom: 4,
          }}>
            <span style={{ color: currentPicker.color }}>{currentPicker.name}</span> — TAP ONE
          </div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: C.fg, marginBottom: 14 }}>
            Pick a tile. Don't ask.
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(N, 4)}, 1fr)`,
            gap: 8, marginBottom: 8,
          }}>
            {Array.from({ length: N }).map((_, s) => {
              const used = usedSlots.has(s);
              return (
                <button key={s} onClick={() => pickSlot(s)} disabled={used} style={{
                  aspectRatio: '1', borderRadius: 4,
                  background: used ? '#0a0a0a' : C.surface2,
                  border: `2px solid ${used ? C.dim2 : C.hazard}`,
                  color: used ? C.dim2 : C.hazard,
                  fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 36,
                  cursor: used ? 'not-allowed' : 'pointer',
                  position: 'relative', overflow: 'hidden',
                }}>
                  {used ? '✕' : '?'}
                  {!used && (
                    <div style={{
                      position: 'absolute', inset: 0, opacity: 0.25,
                      backgroundImage: `repeating-linear-gradient(45deg, transparent 0 3px, ${C.hazardDim} 3px 4px)`,
                    }} />
                  )}
                </button>
              );
            })}
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.dim, textAlign: 'center', marginTop: 8 }}>
            {turnIdx + 1} / {N} picks · bomb hidden
          </div>
        </div>
      </Overlay>
    );
  }

  // REVEAL — show all slots, highlight bomb
  // Build slot→player map
  const slotToPlayer = {};
  Object.entries(picks).forEach(([pIdx, s]) => { slotToPlayer[s] = players[pIdx]; });
  const victim = slotToPlayer[bombSlot];

  return (
    <Overlay onClose={() => onClose(3, players.indexOf(victim))} dim={0.95}>
      <div style={{
        background: C.surface, border: `2px solid ${C.danger}`, borderRadius: 4, overflow: 'hidden',
        animation: 'mfPop 300ms cubic-bezier(.2,.8,.2,1)',
      }}>
        <div style={{
          height: 6,
          backgroundImage: `repeating-linear-gradient(135deg, ${C.danger} 0 10px, #0a0a0a 10px 20px)`,
        }} />
        <div style={{ padding: '20px 22px 8px' }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.danger, letterSpacing: 3 }}>
            ⚠ DETONATION
          </div>
          <div style={{
            fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 52, lineHeight: 0.9,
            color: C.fg, marginTop: 6,
          }}>BOMB WAS<br/><span style={{ color: C.danger }}>#{bombSlot + 1}.</span></div>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: `repeat(${Math.min(N, 4)}, 1fr)`,
          gap: 8, padding: '8px 18px 14px',
        }}>
          {Array.from({ length: N }).map((_, s) => {
            const p = slotToPlayer[s];
            const isBomb = s === bombSlot;
            return (
              <div key={s} style={{
                aspectRatio: '1', borderRadius: 4,
                background: isBomb ? C.danger : C.surface2,
                border: `2px solid ${isBomb ? C.danger : C.line}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                color: isBomb ? '#fff' : C.fg,
                position: 'relative',
              }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: isBomb ? '#fff' : C.dim, position: 'absolute', top: 3, left: 4 }}>
                  #{s + 1}
                </div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 900 }}>
                  {isBomb ? '💥' : '·'}
                </div>
                {p && (
                  <div style={{
                    fontFamily: FONT_DISPLAY, fontSize: 12, fontWeight: 700,
                    color: isBomb ? '#fff' : p.color, marginTop: 2,
                  }}>{p.name}</div>
                )}
              </div>
            );
          })}
        </div>

        {victim && (
          <div style={{ padding: '0 18px 14px', textAlign: 'center' }}>
            <div style={{
              fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 28,
              color: victim.color, marginBottom: 4,
            }}>{victim.name}</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.fg }}>
              drinks <b style={{ color: C.danger }}>3</b>. No appeal.
            </div>
          </div>
        )}

        <HazardStripes height={6} opacity={0.6} />
        <div style={{ padding: 14 }}>
          <StencilButton kind="danger"
            onClick={() => onClose(3, players.indexOf(victim))}>
            ↓ {victim ? victim.name : 'OK'} DRANK
          </StencilButton>
        </div>
      </div>
    </Overlay>
  );
}

Object.assign(window, { GameScreen });
