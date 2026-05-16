// MINEFIELD — screens (intro, setup, win)
const { useState: useS1, useEffect: useE1, useRef: useR1 } = React;

// ── Pixel army-man defusing mines ────────────────────────────
function MineDefuserAnimation() {
  const canvasRef = useR1(null);

  useE1(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.clientWidth  || 400;
    const H = canvas.clientHeight || 640;
    canvas.width  = W;
    canvas.height = H;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const P = 4; // css-px per sprite-pixel

    const PAL = {
      '.': null,
      'H': '#2e4018', 'h': '#3c5420',  // helmet
      'G': '#4a6825', 'g': '#3a5218',  // uniform
      'F': '#c07848', 'E': '#0c0c08',  // skin / eye
      'B': '#18180e',                  // boots
      'Y': '#e8c000',                  // wire tool
      'D': '#14140c', 'r': '#780a0a', 'R': '#aa1818', 'K': '#0a0a06', // mine
    };

    const draw = (rows, x, y) => {
      rows.forEach((row, ry) => {
        for (let rx = 0; rx < row.length; rx++) {
          const col = PAL[row[rx]];
          if (!col) continue;
          ctx.fillStyle = col;
          ctx.fillRect(Math.round(x + rx * P), Math.round(y + ry * P), P, P);
        }
      });
    };

    // ── Sprite definitions ────────────────────────────────
    const WALK = [
      [ '..HHH...', '.hHHHh..', '..HHH...', '..FFF...', '..FEF...',
        'GGGGGGG.', '.GGGGG..', '.gGgGg..', '..G.G...', '.GG.G...', '.B..B...' ],
      [ '..HHH...', '.hHHHh..', '..HHH...', '..FFF...', '..FEF...',
        'GGGGGGG.', '.GGGGG..', '.gGgGg..', '..G.G...', '..G.GG..', '..B..B..' ],
    ];
    const STAND =
      [ '..HHH...', '.hHHHh..', '..HHH...', '..FFF...', '..FEF...',
        'GGGGGGG.', '.GGGGG..', '.gGgGg..', '..G.G...', '..G.G...', '..B.B...' ];
    const CROUCH =
      [ '....HHH.', '...hHHHh', '....HHH.', '.....FF.', '.....EF.',
        '.GGGGGG.', 'gGGGGGg.', 'GG..BB..' ];
    const WORK = [
      [ '....HHH.', '...hHHHh', '....HHH.', '.....FF.', '.....EF.',
        '.GGGGGG.', 'gGGGGGg.', 'GYY.BB..' ],
      [ '....HHH.', '...hHHHh', '....HHH.', '.....FF.', '.....EF.',
        '.GGGGGG.', 'gGGGGGg.', 'GYYY.B..' ],
    ];
    const MINE =
      [ '..K..', '..D..', '.DrD.', 'DrRrD', 'DrRrD', '.DDD.' ];

    // ── Layout ────────────────────────────────────────────
    const GROUND    = H * 0.78;
    const MINE_PW   = MINE[0].length * P;
    const MINE_PH   = MINE.length    * P;
    const SOL_PW    = WALK[0][0].length * P;
    const MINE_XS   = [W * 0.22, W * 0.50, W * 0.78];

    const defused = [false, false, false];
    let flash = null;
    let sol = {
      x: -SOL_PW - 4, phase: 'walk', nextMine: 0,
      walkFrame: 0, workFrame: 0,
      timer: 0, walkT: 0, workT: 0,
    };
    let lastT = null, raf;
    const SPEED = 0.07; // px per ms

    const loop = (t) => {
      if (lastT === null) lastT = t;
      const dt = Math.min(t - lastT, 50);
      lastT = t;

      // ── Update ──────────────────────────────────────────
      if (sol.phase === 'walk') {
        sol.x   += SPEED * dt;
        sol.walkT += dt;
        if (sol.walkT > 160) { sol.walkFrame ^= 1; sol.walkT = 0; }

        if (sol.x > W + SOL_PW) {
          sol.x = -SOL_PW - 4; sol.nextMine = 0;
          defused[0] = defused[1] = defused[2] = false;
        } else if (sol.nextMine < MINE_XS.length) {
          const stopX = MINE_XS[sol.nextMine] - MINE_PW / 2 - SOL_PW - P;
          if (sol.x >= stopX) {
            sol.x = stopX; sol.phase = 'pause'; sol.timer = 0;
          }
        }
      } else if (sol.phase === 'pause') {
        sol.timer += dt;
        if (sol.timer > 300) { sol.phase = 'crouch'; sol.timer = 0; }
      } else if (sol.phase === 'crouch') {
        sol.timer += dt;
        if (sol.timer > 400) { sol.phase = 'work'; sol.timer = 0; sol.workT = 0; }
      } else if (sol.phase === 'work') {
        sol.timer += dt; sol.workT += dt;
        if (sol.workT > 220) { sol.workFrame ^= 1; sol.workT = 0; }
        if (sol.timer > 1800) {
          const mi = sol.nextMine;
          defused[mi] = true;
          flash = { x: MINE_XS[mi], t: 350 };
          sol.nextMine++;
          sol.phase = 'rise'; sol.timer = 0;
        }
      } else if (sol.phase === 'rise') {
        sol.timer += dt;
        if (sol.timer > 400) { sol.phase = 'walk'; sol.timer = 0; }
      }
      if (flash) { flash.t -= dt; if (flash.t <= 0) flash = null; }

      // ── Render ──────────────────────────────────────────
      ctx.clearRect(0, 0, W, H);

      // faint ground line
      ctx.fillStyle = 'rgba(74,104,37,0.12)';
      ctx.fillRect(0, GROUND, W, 2);

      // mines
      MINE_XS.forEach((mx, i) => {
        if (!defused[i]) draw(MINE, mx - MINE_PW / 2, GROUND - MINE_PH);
      });

      // defuse flash
      if (flash) {
        const a = flash.t / 350;
        ctx.fillStyle = `rgba(245,208,0,${a * 0.65})`;
        ctx.beginPath();
        ctx.arc(flash.x, GROUND - MINE_PH / 2, 20, 0, Math.PI * 2);
        ctx.fill();
      }

      // soldier
      let sp;
      if      (sol.phase === 'walk')   sp = WALK[sol.walkFrame];
      else if (sol.phase === 'pause')  sp = STAND;
      else if (sol.phase === 'crouch') sp = CROUCH;
      else if (sol.phase === 'work')   sp = WORK[sol.workFrame];
      else if (sol.phase === 'rise')   sp = STAND;
      if (sp) draw(sp, sol.x, GROUND - sp.length * P);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      pointerEvents: 'none', opacity: 0.3, imageRendering: 'pixelated',
    }} />
  );
}

function IntroScreen({ onStart, onArmory }) {
  const [armed, setArmed] = useS1(false);
  useE1(() => { const t = setTimeout(() => setArmed(true), 700); return () => clearTimeout(t); }, []);

  return (
    <div style={{
      position: 'absolute', inset: 0, paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
      display: 'flex', flexDirection: 'column', alignItems: 'stretch', isolation: 'isolate',
      background: `
        radial-gradient(ellipse 60% 40% at 50% 20%, rgba(245,208,0,0.06), transparent 70%),
        radial-gradient(ellipse 80% 50% at 50% 100%, rgba(255,58,45,0.08), transparent 70%),
        ${C.bg}
      `,
    }}>
      {/* Background animation */}
      <MineDefuserAnimation />

      {/* CRT scan lines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.06,
        backgroundImage: `repeating-linear-gradient(0deg, transparent 0 2px, #fff 2px 3px)`,
      }} />

      {/* Top bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '4px 22px 0', fontFamily: FONT_MONO, fontSize: 10, color: C.dim, letterSpacing: 1.5,
      }}>
        <span>◉ REC · 21:47:03</span>
        <span>v1.0 // PARTY-PROTOCOL</span>
      </div>

      <HazardStripes height={10} style={{ marginTop: 14 }} />

      {/* Logo block */}
      <div style={{ padding: '32px 24px 0', position: 'relative' }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.danger, letterSpacing: 3, marginBottom: 8 }}>
          ⚠ HOSTILE TERRAIN
        </div>
        <h1 style={{
          fontFamily: FONT_DISPLAY, fontWeight: 900,
          fontSize: 104, lineHeight: 0.85, letterSpacing: -1,
          margin: 0, color: C.fg,
          textShadow: armed ? `4px 4px 0 ${C.danger}` : `0 0 0 ${C.danger}`,
          transition: 'text-shadow 400ms cubic-bezier(.2,.8,.2,1)',
        }}>
          MINE<br/>FIELD.
        </h1>
        <div style={{
          marginTop: 18, fontFamily: FONT_MONO, fontSize: 13, color: C.dim, lineHeight: 1.6,
        }}>
          A snake-path drinking game.<br/>
          Roll. Step. Pray.
        </div>
      </div>

      {/* Mid: warning crate */}
      <div style={{ flex: 1, padding: '32px 24px 0', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div style={{
          border: `1px dashed ${C.hazardDim}`, padding: '14px 16px',
          fontFamily: FONT_MONO, fontSize: 11, lineHeight: 1.7, color: C.dim,
          background: 'rgba(245,208,0,0.03)', marginBottom: 22,
        }}>
          <div style={{ color: C.hazard, marginBottom: 6, letterSpacing: 2 }}>// BRIEFING</div>
          ▸ Roll 1–3. Move that many.<br/>
          ▸ Tile is face-down. Surprise.<br/>
          ▸ Mines bite. Roulette gambles.<br/>
          ▸ Reach FINISH. Survive.
        </div>

        <StencilButton onClick={onStart}>▶ DEPLOY</StencilButton>
        <button onClick={onArmory} style={{
          marginTop: 10, width: '100%', padding: '14px',
          background: 'transparent', border: `1px solid ${C.line}`,
          color: C.dim, fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 2,
          cursor: 'pointer', borderRadius: 4,
        }}>⚒ ARMORY — EDIT PROMPTS</button>
        <div style={{
          marginTop: 14, textAlign: 'center', fontFamily: FONT_MONO,
          fontSize: 9, color: C.dim2, letterSpacing: 2,
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
        }}>
          DRINK RESPONSIBLY · KNOW YOUR LIMITS
        </div>
      </div>

      <HazardStripes height={10} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
function SetupScreen({ initial, tweaks, setTweak, onBack, onStart }) {
  const [players, setPlayers] = useS1(initial);
  const canAdd = players.length < 8;

  const addPlayer = () => {
    if (!canAdd) return;
    const used = new Set(players.map(p => p.color));
    const color = PLAYER_COLORS.find(c => !used.has(c)) || PLAYER_COLORS[players.length % 8];
    setPlayers([...players, { name: `P${players.length + 1}`, color, pos: 0, drinks: 0 }]);
  };
  const removePlayer = (i) => setPlayers(players.filter((_, idx) => idx !== i));
  const renamePlayer = (i, name) => setPlayers(players.map((p, idx) => idx === i ? { ...p, name } : p));
  const cyclePlayerColor = (i) => {
    const used = new Set(players.filter((_, idx) => idx !== i).map(p => p.color));
    const cur = PLAYER_COLORS.indexOf(players[i].color);
    for (let k = 1; k <= PLAYER_COLORS.length; k++) {
      const nxt = PLAYER_COLORS[(cur + k) % PLAYER_COLORS.length];
      if (!used.has(nxt)) {
        setPlayers(players.map((p, idx) => idx === i ? { ...p, color: nxt } : p));
        return;
      }
    }
  };

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: C.bg }}>
      {/* header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 22px 0' }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: C.dim, fontFamily: FONT_MONO,
          fontSize: 11, letterSpacing: 2, padding: 0, cursor: 'pointer',
        }}>◂ ABORT</button>
        <h2 style={{
          fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 44,
          margin: '12px 0 4px', letterSpacing: -0.5,
        }}>ROSTER</h2>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.dim, letterSpacing: 1 }}>
          {players.length} OPERATIVES · MIN 2 · MAX 8
        </div>
      </div>

      <HazardStripes height={8} style={{ marginTop: 16 }} />

      {/* roster list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 22px 12px' }}>
        {players.map((p, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', marginBottom: 8,
            background: C.surface, border: `1px solid ${C.line}`, borderRadius: 4,
          }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.dim, width: 16 }}>
              {String(i + 1).padStart(2, '0')}
            </div>
            <button onClick={() => cyclePlayerColor(i)} style={{
              width: 30, height: 30, borderRadius: '50%',
              background: p.color, border: '2px solid #000',
              boxShadow: `0 0 0 2px ${p.color}55`,
              cursor: 'pointer', flexShrink: 0,
            }} aria-label="cycle color" />
            <input
              value={p.name}
              onChange={(e) => renamePlayer(i, e.target.value.slice(0, 12).toUpperCase())}
              style={{
                flex: 1, background: 'transparent', border: 'none',
                color: C.fg, fontFamily: FONT_DISPLAY, fontWeight: 700,
                fontSize: 22, letterSpacing: 0.5, outline: 'none', minWidth: 0,
              }}
            />
            <button onClick={() => removePlayer(i)} style={{
              background: 'none', border: 'none', color: C.dim,
              fontSize: 18, cursor: 'pointer', padding: '0 4px',
            }} aria-label="remove">✕</button>
          </div>
        ))}
        {canAdd && (
          <button onClick={addPlayer} style={{
            width: '100%', padding: '12px', background: 'transparent',
            border: `1px dashed ${C.line}`, color: C.dim,
            fontFamily: FONT_MONO, fontSize: 12, letterSpacing: 2, cursor: 'pointer',
            borderRadius: 4,
          }}>+ ADD OPERATIVE</button>
        )}

        {/* Board config */}
        <div style={{
          marginTop: 22, padding: 14, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 4,
        }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.hazard, letterSpacing: 2, marginBottom: 10 }}>
            // BOARD CONFIG
          </div>
          <SetupSlider label="PATH LENGTH" value={tweaks.boardLength} min={16} max={40} step={2}
            onChange={(v) => setTweak('boardLength', v)} />
          <div style={{ height: 10 }} />
          <SetupSlider label="COLUMNS" value={tweaks.boardCols} min={3} max={5} step={1}
            onChange={(v) => setTweak('boardCols', v)} />
        </div>
      </div>

      {/* footer */}
      <div style={{ padding: '14px 22px calc(env(safe-area-inset-bottom, 0px) + 20px)', borderTop: `1px solid ${C.line}` }}>
        <StencilButton
          disabled={players.length < 2}
          onClick={() => onStart(players)}
        >▶ ARM THE FIELD</StencilButton>
      </div>
    </div>
  );
}

function SetupSlider({ label, value, min, max, step, onChange }) {
  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontFamily: FONT_MONO, fontSize: 10, color: C.dim, letterSpacing: 1.5, marginBottom: 6,
      }}>
        <span>{label}</span>
        <span style={{ color: C.hazard }}>{value}</span>
      </div>
      <input type="range" value={value} min={min} max={max} step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: C.hazard }} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
function WinScreen({ winner, players, onAgain, onHome }) {
  if (!winner) return null;
  const ranked = [...players].sort((a, b) => b.pos - a.pos);

  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      background: `radial-gradient(ellipse 60% 40% at 50% 20%, ${winner.color}22, transparent 70%), ${C.bg}`,
      paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
    }}>
      <HazardStripes height={10} style={{ marginTop: 6 }} />
      <div style={{ flex: 1, padding: '40px 24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.dim, letterSpacing: 3 }}>
          ✓ EXTRACTION COMPLETE
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: winner.color, letterSpacing: 2, marginTop: 24 }}>
          SURVIVOR
        </div>
        <h2 style={{
          fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 108, lineHeight: 0.85, margin: '8px 0 0',
          color: winner.color, textShadow: `4px 4px 0 #000`,
          wordBreak: 'break-word',
        }}>{winner.name}</h2>
        <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.dim, marginTop: 14 }}>
          made it out alive.
        </div>

        <div style={{ marginTop: 36, fontFamily: FONT_MONO, fontSize: 11, color: C.hazard, letterSpacing: 2 }}>
          // LEADERBOARD
        </div>
        <div style={{ marginTop: 10 }}>
          {ranked.map((p, i) => (
            <div key={p.name} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', marginBottom: 6,
              background: i === 0 ? `${winner.color}15` : C.surface,
              border: `1px solid ${i === 0 ? winner.color : C.line}`,
              borderRadius: 4,
            }}>
              <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.dim, width: 20 }}>{i + 1}.</span>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: p.color }} />
              <span style={{ flex: 1, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 22 }}>{p.name}</span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.danger }}>
                {p.drinks}×🍷
              </span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '12px 22px calc(env(safe-area-inset-bottom, 0px) + 20px)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <StencilButton onClick={onAgain}>▶ RUN IT BACK</StencilButton>
        <StencilButton kind="ghost" onClick={onHome}>◂ HOME</StencilButton>
      </div>
      <HazardStripes height={10} />
    </div>
  );
}

Object.assign(window, { IntroScreen, SetupScreen, WinScreen });
