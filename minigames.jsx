// MINEFIELD — Gamble tile mini-games
// Triggered when a player lands on 🎰 (roulette). Randomly picks one of four.
const { useState: useG, useEffect: useGE, useMemo: useGM, useRef: useGR } = React;

// ═════════════════════════════════════════════════════════════
// DISPATCHER
// ═════════════════════════════════════════════════════════════
const MINIGAMES = ['wheel', 'flip', 'higher', 'bomb'];

function MiniGameReveal({ players, starter, onClose }) {
  const [game] = useG(() => MINIGAMES[Math.floor(Math.random() * MINIGAMES.length)]);
  const [phase, setPhase] = useG('intro'); // intro → game

  const meta = {
    wheel:  { label: 'WHEEL OF MISFORTUNE', tag: 'Spin. Pray. Drink.',
              body: 'A wheel spins. Wherever it stops — that player drinks 2.' },
    flip:   { label: 'FLIP & BET',          tag: 'Heads or tails. No fence.',
              body: 'Everyone secretly picks a side. Coin flips. Anyone on the wrong side drinks 1.' },
    higher: { label: 'HIGHER OR LOWER',     tag: 'You vs the deck.',
              body: 'A card is drawn. You bet the next is higher or lower. Win the chain (3) or drink.' },
    bomb:   { label: 'NUMBER BOMB',         tag: 'Pass the phone. Pick blind.',
              body: 'Each player picks one of N hidden tiles. One is the bomb. Bomb drinks 3.' },
  }[game];

  if (phase === 'intro') {
    return (
      <Overlay onClose={() => {}}>
        <div style={{
          background: C.surface, border: `2px solid ${C.olive}`, borderRadius: 4, overflow: 'hidden',
          animation: 'mfPop 200ms ease-out',
        }}>
          <div style={{ background: C.olive, color: '#0a0a0a', padding: '8px 14px',
            fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 2,
            display: 'flex', justifyContent: 'space-between' }}>
            <span>// GAMBLE TILE</span><span>◎ {game.toUpperCase()}</span>
          </div>
          <div style={{ padding: '22px' }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.dim, letterSpacing: 2 }}>
              ROULETTE ROLLED
            </div>
            <div style={{
              fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 40, lineHeight: 0.9,
              color: C.olive, marginTop: 6, letterSpacing: -0.5,
            }}>{meta.label}.</div>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 13, color: C.fg, lineHeight: 1.55, marginTop: 14,
            }}>{meta.body}</div>
          </div>
          <HazardStripes height={6} opacity={0.5} />
          <div style={{ padding: 14 }}>
            <StencilButton onClick={() => setPhase('game')}>▶ BEGIN</StencilButton>
          </div>
        </div>
      </Overlay>
    );
  }

  if (game === 'wheel')  return <WheelGame players={players} starter={starter} onClose={onClose} />;
  if (game === 'flip')   return <FlipGame  players={players} starter={starter} onClose={onClose} />;
  if (game === 'higher') return <HigherLowerGame players={players} starter={starter} onClose={onClose} />;
  return <RouletteReveal players={players} starter={starter} onClose={onClose} />;
}

// ═════════════════════════════════════════════════════════════
// 1. WHEEL OF MISFORTUNE
// ═════════════════════════════════════════════════════════════
function WheelGame({ players, starter, onClose }) {
  const N = players.length;
  const segAngle = 360 / N;
  const [phase, setPhase] = useG('ready'); // ready | spinning | done
  const [rotation, setRotation] = useG(0);
  const [victim, setVictim] = useG(null);

  const spin = () => {
    if (phase !== 'ready') return;
    const target = Math.floor(Math.random() * N);
    // Segment i is centered at angle (i * segAngle + segAngle/2) measured clockwise from top.
    // We want that center to end up at top (under indicator), so rotate by -center mod 360.
    const baseStop = (360 - (target * segAngle + segAngle / 2) + 360) % 360;
    // small jitter within segment so it doesn't always land dead-center
    const jitter = (Math.random() - 0.5) * (segAngle * 0.5);
    const total = 360 * 6 + baseStop + jitter;
    setPhase('spinning');
    setRotation(total);
    setTimeout(() => {
      setVictim(target);
      setPhase('done');
    }, 4200);
  };

  // Build SVG wheel
  const R = 110;
  const cx = 130, cy = 130;
  const polar = (a, r) => [cx + r * Math.sin(a * Math.PI / 180), cy - r * Math.cos(a * Math.PI / 180)];

  const segments = players.map((p, i) => {
    const a0 = i * segAngle;
    const a1 = (i + 1) * segAngle;
    const [x0, y0] = polar(a0, R);
    const [x1, y1] = polar(a1, R);
    const largeArc = segAngle > 180 ? 1 : 0;
    const d = `M ${cx} ${cy} L ${x0} ${y0} A ${R} ${R} 0 ${largeArc} 1 ${x1} ${y1} Z`;
    return { d, p, a: a0 + segAngle / 2, i };
  });

  return (
    <Overlay onClose={() => {}}>
      <div style={{
        background: C.surface, border: `2px solid ${C.olive}`, borderRadius: 4, overflow: 'hidden',
        animation: 'mfPop 200ms ease-out',
      }}>
        <div style={{ background: C.olive, color: '#0a0a0a', padding: '8px 14px',
          fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 2,
          display: 'flex', justifyContent: 'space-between' }}>
          <span>// WHEEL OF MISFORTUNE</span><span>⟳</span>
        </div>

        <div style={{ padding: '16px 14px 0', position: 'relative' }}>
          {/* indicator (fixed) */}
          <div style={{
            position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0, zIndex: 3,
            borderLeft: '14px solid transparent',
            borderRight: '14px solid transparent',
            borderTop: `22px solid ${C.danger}`,
            filter: 'drop-shadow(0 1px 0 #000)',
          }} />
          {/* wheel */}
          <div style={{
            width: 260, height: 260, margin: '0 auto', position: 'relative',
          }}>
            <svg width="260" height="260" viewBox="0 0 260 260" style={{
              transform: `rotate(${rotation}deg)`,
              transition: phase === 'spinning' ? 'transform 4s cubic-bezier(.18,.7,.2,1)' : 'none',
              filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.5))',
            }}>
              {segments.map(({ d, p, a, i }) => (
                <g key={i}>
                  <path d={d} fill={p.color} stroke="#0a0a0a" strokeWidth="2" />
                  <text
                    x={cx + (R * 0.62) * Math.sin(a * Math.PI / 180)}
                    y={cy - (R * 0.62) * Math.cos(a * Math.PI / 180)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${a}, ${cx + (R * 0.62) * Math.sin(a * Math.PI / 180)}, ${cy - (R * 0.62) * Math.cos(a * Math.PI / 180)})`}
                    fill="#0a0a0a"
                    fontFamily="Big Shoulders Stencil Display, Impact, sans-serif"
                    fontWeight="900"
                    fontSize={Math.max(14, Math.min(22, 200 / N))}
                    letterSpacing="0.5"
                  >{p.name}</text>
                </g>
              ))}
              {/* center hub */}
              <circle cx={cx} cy={cy} r="14" fill={C.bg} stroke={C.hazard} strokeWidth="2" />
              <circle cx={cx} cy={cy} r="4" fill={C.hazard} />
            </svg>
          </div>
        </div>

        <div style={{ padding: '16px 18px 0', textAlign: 'center', minHeight: 86 }}>
          {phase === 'ready' && (
            <>
              <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.dim, lineHeight: 1.5 }}>
                Tap to spin. Whoever it lands on takes <b style={{ color: C.danger }}>2 sips</b>.
              </div>
              <div style={{ marginTop: 14 }}>
                <StencilButton onClick={spin}>⟳ SPIN IT</StencilButton>
              </div>
            </>
          )}
          {phase === 'spinning' && (
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 30, color: C.hazard, letterSpacing: 1 }}>
              SPINNING…
            </div>
          )}
          {phase === 'done' && victim !== null && (
            <>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.dim, letterSpacing: 2 }}>
                THE WHEEL HAS CHOSEN
              </div>
              <div style={{
                fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 44, lineHeight: 0.9,
                color: players[victim].color, marginTop: 4, textShadow: '3px 3px 0 #000',
              }}>{players[victim].name}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.fg, marginTop: 6 }}>
                drinks <b style={{ color: C.danger }}>2</b>. No mercy.
              </div>
            </>
          )}
        </div>

        <HazardStripes height={6} opacity={0.6} style={{ marginTop: 14 }} />
        <div style={{ padding: 14 }}>
          <StencilButton kind={phase === 'done' ? 'danger' : 'ghost'}
            disabled={phase !== 'done'}
            onClick={() => onClose(2, victim)}>
            {phase === 'done' ? `↓ ${players[victim].name} DRANK` : 'WAITING…'}
          </StencilButton>
        </div>
      </div>
    </Overlay>
  );
}

// ═════════════════════════════════════════════════════════════
// 2. FLIP & BET
// ═════════════════════════════════════════════════════════════
function FlipGame({ players, starter, onClose }) {
  const N = players.length;
  const order = useGM(() => Array.from({ length: N }, (_, i) => (starter + i) % N), [N, starter]);
  const [phase, setPhase] = useG('handoff'); // handoff | pick | flipping | reveal
  const [picks, setPicks] = useG({});        // playerIdx -> 'H' | 'T'
  const [turn, setTurn] = useG(0);
  const [outcome, setOutcome] = useG(null);  // 'H' | 'T'

  const cur = players[order[turn]];

  const handlePick = (side) => {
    const next = { ...picks, [order[turn]]: side };
    setPicks(next);
    if (turn + 1 >= N) {
      // all picked → flip
      setPhase('flipping');
      setTimeout(() => {
        const result = Math.random() < 0.5 ? 'H' : 'T';
        setOutcome(result);
        setPhase('reveal');
      }, 1800);
    } else {
      setTurn(turn + 1);
      setPhase('handoff');
    }
  };

  if (phase === 'handoff') {
    return (
      <Overlay onClose={() => {}}>
        <div style={{
          background: C.surface, border: `2px solid ${cur.color}`, padding: 26, borderRadius: 4,
          textAlign: 'center', animation: 'mfPop 200ms ease-out',
        }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.dim, letterSpacing: 2 }}>
            PASS PHONE TO
          </div>
          <div style={{
            fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 56, color: cur.color,
            margin: '10px 0 8px', textShadow: '3px 3px 0 #000',
          }}>{cur.name}</div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.dim, lineHeight: 1.5 }}>
            Cup the screen. Pick heads or tails.
            <br/>{turn + 1} / {N}
          </div>
          <div style={{ marginTop: 18 }}>
            <StencilButton onClick={() => setPhase('pick')}>I'M ALONE — SHOW COIN</StencilButton>
          </div>
        </div>
      </Overlay>
    );
  }

  if (phase === 'pick') {
    return (
      <Overlay onClose={() => {}}>
        <div style={{
          background: C.surface, border: `2px solid ${cur.color}`, borderRadius: 4, padding: 18,
        }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.dim, letterSpacing: 2, marginBottom: 4 }}>
            <span style={{ color: cur.color }}>{cur.name}</span> — CALL IT
          </div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: C.fg, marginBottom: 16 }}>
            Heads or tails?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <CoinButton side="H" onClick={() => handlePick('H')} />
            <CoinButton side="T" onClick={() => handlePick('T')} />
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.dim, textAlign: 'center', marginTop: 12 }}>
            Pick locks. Next player up after.
          </div>
        </div>
      </Overlay>
    );
  }

  if (phase === 'flipping') {
    return (
      <Overlay onClose={() => {}} dim={0.9}>
        <div style={{
          background: C.surface, border: `2px solid ${C.hazard}`, padding: 26, borderRadius: 4, textAlign: 'center',
        }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.hazard, letterSpacing: 2 }}>
            // FLIPPING
          </div>
          <div style={{
            margin: '20px auto',
            width: 120, height: 120, borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, ${C.hazard}, ${C.hazardDim})`,
            border: '3px solid #0a0a0a',
            animation: 'mfFlip 600ms cubic-bezier(.4,0,.4,1) infinite',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 56, color: '#0a0a0a',
          }}>?</div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, color: C.fg, letterSpacing: 1 }}>
            COIN IN THE AIR…
          </div>
        </div>
      </Overlay>
    );
  }

  // REVEAL
  const wrongPlayerIdxs = Object.entries(picks)
    .filter(([, side]) => side !== outcome)
    .map(([pIdx]) => Number(pIdx));

  return (
    <Overlay onClose={() => {}} dim={0.95}>
      <div style={{
        background: C.surface, border: `2px solid ${C.danger}`, borderRadius: 4, overflow: 'hidden',
        animation: 'mfPop 300ms ease-out',
      }}>
        <div style={{ height: 6,
          backgroundImage: `repeating-linear-gradient(135deg, ${C.danger} 0 10px, #0a0a0a 10px 20px)` }} />
        <div style={{ padding: '18px 22px 6px', textAlign: 'center' }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.dim, letterSpacing: 2 }}>
            THE COIN LANDED
          </div>
          <div style={{
            margin: '12px auto',
            width: 100, height: 100, borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, ${C.hazard}, ${C.hazardDim})`,
            border: '3px solid #0a0a0a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 56, color: '#0a0a0a',
          }}>{outcome}</div>
        </div>

        <div style={{ padding: '0 18px 12px' }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.dim, letterSpacing: 2, marginBottom: 8 }}>
            // RESULTS
          </div>
          {players.map((p, idx) => {
            const pick = picks[idx];
            if (!pick) return null;
            const wrong = pick !== outcome;
            return (
              <div key={idx} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', marginBottom: 6,
                background: wrong ? '#2a0c0a' : C.surface2,
                border: `1px solid ${wrong ? C.danger : C.line}`, borderRadius: 3,
              }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: p.color }} />
                <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 18, flex: 1 }}>{p.name}</span>
                <span style={{
                  fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 18,
                  color: wrong ? C.danger : C.olive,
                }}>{pick}</span>
                <span style={{
                  fontFamily: FONT_MONO, fontSize: 10, color: wrong ? C.danger : C.dim, letterSpacing: 1,
                }}>{wrong ? '✗ DRINKS 1' : '✓ SAFE'}</span>
              </div>
            );
          })}
        </div>

        <HazardStripes height={6} opacity={0.6} />
        <div style={{ padding: 14 }}>
          <StencilButton kind="danger" onClick={() => {
            // apply drinks to each wrong player
            // We close in a batch via onClose-then-set... but onClose only accepts 1 victim.
            // So we just close, then the GameScreen handler applies one drink — for FLIP we
            // hand them off as a list via a callback shape: onClose({drinks: [{idx, n}, ...]})
            onClose({ drinks: wrongPlayerIdxs.map(i => ({ idx: i, n: 1 })) });
          }}>
            ↓ DRINKERS DRANK
          </StencilButton>
        </div>
      </div>
    </Overlay>
  );
}

function CoinButton({ side, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '20px 0',
      background: C.surface2, border: `2px solid ${C.hazard}`, borderRadius: 4,
      color: C.hazard, cursor: 'pointer',
      fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 60, letterSpacing: 1,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      transition: 'transform 80ms, background 100ms',
    }}
    onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(1px)'}
    onMouseUp={(e) => e.currentTarget.style.transform = ''}
    onMouseLeave={(e) => e.currentTarget.style.transform = ''}>
      <span>{side}</span>
      <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.dim, letterSpacing: 2 }}>
        {side === 'H' ? 'HEADS' : 'TAILS'}
      </span>
    </button>
  );
}

// ═════════════════════════════════════════════════════════════
// 3. HIGHER OR LOWER
// ═════════════════════════════════════════════════════════════
const SUITS = [
  { ch: '♠', color: '#0a0a0a' },
  { ch: '♥', color: C.danger },
  { ch: '♦', color: C.danger },
  { ch: '♣', color: '#0a0a0a' },
];
function randCard() {
  const v = 1 + Math.floor(Math.random() * 13);
  const s = SUITS[Math.floor(Math.random() * 4)];
  return { v, s };
}
function cardLabel(v) {
  return v === 1 ? 'A' : v === 11 ? 'J' : v === 12 ? 'Q' : v === 13 ? 'K' : String(v);
}

function HigherLowerGame({ players, starter, onClose }) {
  const player = players[starter];
  const [current, setCurrent] = useG(() => randCard());
  const [next, setNext] = useG(null);
  const [chain, setChain] = useG(0);       // successful guesses
  const [phase, setPhase] = useG('guess'); // guess | revealing | won | lost
  const MAX_CHAIN = 3;

  const guess = (dir) => {
    if (phase !== 'guess') return;
    const nx = randCard();
    setNext(nx);
    setPhase('revealing');
    setTimeout(() => {
      // If equal, treat as loss (house edge — the deck wins ties)
      const correct = dir === 'higher' ? nx.v > current.v : nx.v < current.v;
      if (!correct) {
        setPhase('lost');
      } else if (chain + 1 >= MAX_CHAIN) {
        setPhase('won');
      } else {
        setChain(chain + 1);
        setCurrent(nx);
        setNext(null);
        setPhase('guess');
      }
    }, 800);
  };

  // Drinks on loss = card value capped sensibly: face cards = 4, ace = 5, otherwise value/3 rounded up min 1
  const drinksFor = (v) => {
    if (v === 1) return 4;       // ace
    if (v >= 11) return 3;       // face
    return Math.max(1, Math.ceil(v / 3));
  };

  // WON — let them gift drinks
  const [giftIdx, setGiftIdx] = useG(null);

  return (
    <Overlay onClose={() => {}}>
      <div style={{
        background: C.surface, border: `2px solid ${C.hazard}`, borderRadius: 4, overflow: 'hidden',
        animation: 'mfPop 200ms ease-out',
      }}>
        <div style={{ background: C.hazard, color: '#0a0a0a', padding: '8px 14px',
          fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 2,
          display: 'flex', justifyContent: 'space-between' }}>
          <span>// HIGHER OR LOWER</span>
          <span>{player.name} · CHAIN {chain}/{MAX_CHAIN}</span>
        </div>

        <div style={{ padding: '18px 18px 6px' }}>
          {/* card pair */}
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, minHeight: 170,
          }}>
            <Card card={current} flipped={false} />
            <div style={{ fontFamily: FONT_MONO, fontSize: 22, color: C.dim }}>→</div>
            <Card card={next} flipped={!next} accent={
              phase === 'lost' ? C.danger : phase === 'won' ? C.olive :
              phase === 'revealing' ? C.hazard : C.line
            }/>
          </div>

          {phase === 'guess' && (
            <>
              <div style={{
                fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 28, color: C.hazard,
                textAlign: 'center', marginTop: 6,
              }}>NEXT CARD?</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                <StencilButton onClick={() => guess('higher')}>▲ HIGHER</StencilButton>
                <StencilButton onClick={() => guess('lower')}>▼ LOWER</StencilButton>
              </div>
              <div style={{
                fontFamily: FONT_MONO, fontSize: 10, color: C.dim2, textAlign: 'center', marginTop: 8, letterSpacing: 1,
              }}>TIES GO TO THE DECK. ACE LOW.</div>
            </>
          )}

          {phase === 'revealing' && (
            <div style={{
              fontFamily: FONT_DISPLAY, fontSize: 26, color: C.hazard, textAlign: 'center', marginTop: 12,
            }}>FLIPPING…</div>
          )}

          {phase === 'lost' && (
            <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.danger, letterSpacing: 2 }}>
                ⚠ WRONG CALL
              </div>
              <div style={{
                fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 38, color: C.danger, lineHeight: 1, marginTop: 4,
              }}>{player.name}<br/>DRINKS {drinksFor(next.v)}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.dim, marginTop: 6 }}>
                The {cardLabel(next.v)}{next.s.ch} doesn't lie.
              </div>
            </div>
          )}

          {phase === 'won' && giftIdx === null && (
            <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.olive, letterSpacing: 2 }}>
                ✓ HOUSE BROKEN
              </div>
              <div style={{
                fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 32, color: C.olive, marginTop: 4,
              }}>HAND OUT <span style={{ color: C.hazard }}>3</span></div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.dim, marginTop: 6, marginBottom: 10 }}>
                Pick someone to drink three. Cannot pick yourself.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                {players.map((p, i) => (
                  i === starter ? null : (
                    <button key={i} onClick={() => setGiftIdx(i)} style={{
                      padding: '6px 10px',
                      background: C.surface2, border: `1px solid ${p.color}`, borderRadius: 3,
                      color: p.color, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16,
                      cursor: 'pointer', letterSpacing: 0.5,
                    }}>{p.name}</button>
                  )
                ))}
              </div>
            </div>
          )}

          {phase === 'won' && giftIdx !== null && (
            <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
              <div style={{
                fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 32,
                color: players[giftIdx].color, marginTop: 4,
              }}>{players[giftIdx].name}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.fg, marginTop: 4 }}>
                drinks <b style={{ color: C.danger }}>3</b>. Compliments of {player.name}.
              </div>
            </div>
          )}
        </div>

        <HazardStripes height={6} opacity={0.6} style={{ marginTop: 12 }} />
        <div style={{ padding: 14 }}>
          {phase === 'lost' && (
            <StencilButton kind="danger" onClick={() => onClose(drinksFor(next.v), starter)}>
              ↓ {player.name} DRANK
            </StencilButton>
          )}
          {phase === 'won' && giftIdx !== null && (
            <StencilButton kind="danger" onClick={() => onClose(3, giftIdx)}>
              ↓ {players[giftIdx].name} DRANK
            </StencilButton>
          )}
          {phase === 'won' && giftIdx === null && (
            <StencilButton disabled kind="ghost">SELECT A TARGET ABOVE</StencilButton>
          )}
          {(phase === 'guess' || phase === 'revealing') && (
            <StencilButton disabled kind="ghost">PLAY THE HAND</StencilButton>
          )}
        </div>
      </div>
    </Overlay>
  );
}

function Card({ card, flipped, accent = C.line }) {
  const w = 84, h = 116;
  if (flipped || !card) {
    return (
      <div style={{
        width: w, height: h, borderRadius: 6,
        background: C.surface2, border: `2px solid ${accent}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 4, borderRadius: 4,
          backgroundImage: `repeating-linear-gradient(45deg, ${C.hazardDim} 0 4px, ${C.bgDeep} 4px 8px)`,
          opacity: 0.6,
        }} />
        <div style={{
          position: 'relative', zIndex: 1,
          fontFamily: FONT_DISPLAY, fontSize: 36, fontWeight: 900, color: C.hazard,
        }}>?</div>
      </div>
    );
  }
  const lbl = cardLabel(card.v);
  return (
    <div style={{
      width: w, height: h, borderRadius: 6,
      background: '#f4ede0', border: `2px solid ${accent}`,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      padding: '8px 10px', position: 'relative', color: card.s.color,
      fontFamily: FONT_DISPLAY, fontWeight: 900,
      boxShadow: '0 3px 0 #0a0a0a',
    }}>
      <div style={{ fontSize: 22, lineHeight: 1, letterSpacing: -0.5 }}>
        {lbl}<br/>
        <span style={{ fontSize: 18 }}>{card.s.ch}</span>
      </div>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        fontSize: 44, fontWeight: 900,
      }}>{card.s.ch}</div>
      <div style={{ fontSize: 22, lineHeight: 1, letterSpacing: -0.5, alignSelf: 'flex-end', transform: 'rotate(180deg)' }}>
        {lbl}<br/>
        <span style={{ fontSize: 18 }}>{card.s.ch}</span>
      </div>
    </div>
  );
}

Object.assign(window, { MiniGameReveal, WheelGame, FlipGame, HigherLowerGame });
