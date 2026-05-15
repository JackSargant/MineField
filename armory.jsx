// MINEFIELD — Prompt Armory: view & edit all dares/drinks/etc.
const { useState: useSA, useEffect: useEA, useMemo: useMA, useRef: useRA } = React;

const ARMORY_KINDS = [
  { key: 'drink',   label: 'DRINK',    color: '#f5d000', icon: '🥃', sub: 'sips & shots' },
  { key: 'dare',    label: 'DARE',     color: '#f5d000', icon: '!',  sub: 'do the thing' },
  { key: 'hotseat', label: 'HOT SEAT', color: '#f5d000', icon: '☼',  sub: 'spotlight on you' },
  { key: 'rule',    label: 'RULE',     color: '#f5d000', icon: '§',  sub: 'sticky table laws' },
  { key: 'safe',    label: 'SAFE',     color: '#7d8a4a', icon: '✓',  sub: 'rare mercy' },
];

const ARMORY_STORAGE_KEY = 'minefield.prompts.v1';

// Load prompts from storage, fall back to defaults baked into prompts.js
function loadPrompts() {
  try {
    const raw = localStorage.getItem(ARMORY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const currentVersion = window.MINEFIELD_DEFAULT_PROMPTS._version || 1;
      const storedVersion  = parsed._version || 1;
      // Bust cache when prompts.js has been updated
      if (storedVersion !== currentVersion) {
        localStorage.removeItem(ARMORY_STORAGE_KEY);
        return JSON.parse(JSON.stringify(window.MINEFIELD_DEFAULT_PROMPTS));
      }
      const out = {};
      ARMORY_KINDS.forEach(({ key }) => {
        out[key] = Array.isArray(parsed[key]) ? parsed[key] : (window.MINEFIELD_DEFAULT_PROMPTS[key] || []);
      });
      return out;
    }
  } catch (e) { /* fall through */ }
  return JSON.parse(JSON.stringify(window.MINEFIELD_DEFAULT_PROMPTS));
}

function savePrompts(prompts) {
  try {
    const version = window.MINEFIELD_DEFAULT_PROMPTS._version || 1;
    localStorage.setItem(ARMORY_STORAGE_KEY, JSON.stringify({ ...prompts, _version: version }));
  } catch (e) {}
  window.MINEFIELD_PROMPTS = prompts;
}

// ═════════════════════════════════════════════════════════════
// ARMORY SCREEN
// ═════════════════════════════════════════════════════════════
function ArmoryScreen({ prompts, setPrompts, onBack }) {
  const [activeKind, setActiveKind] = useSA('drink');
  const [editing, setEditing] = useSA(null); // { kind, index, title, body, isNew }
  const [showReset, setShowReset] = useSA(false);

  const list = prompts[activeKind] || [];

  const startEdit = (kind, index) => {
    const p = prompts[kind][index];
    setEditing({ kind, index, title: p.title, body: p.body, isNew: false });
  };
  const startNew = () => {
    setEditing({ kind: activeKind, index: -1, title: '', body: '', isNew: true });
  };
  const saveEdit = () => {
    if (!editing) return;
    const title = editing.title.trim();
    const body  = editing.body.trim();
    if (!title || !body) return;
    const next = { ...prompts, [editing.kind]: [...prompts[editing.kind]] };
    if (editing.isNew) next[editing.kind].push({ title, body });
    else next[editing.kind][editing.index] = { title, body };
    setPrompts(next);
    setEditing(null);
  };
  const deletePrompt = () => {
    if (!editing || editing.isNew) { setEditing(null); return; }
    const next = { ...prompts, [editing.kind]: prompts[editing.kind].filter((_, i) => i !== editing.index) };
    setPrompts(next);
    setEditing(null);
  };
  const resetAll = () => {
    const fresh = JSON.parse(JSON.stringify(window.MINEFIELD_DEFAULT_PROMPTS));
    setPrompts(fresh);
    setShowReset(false);
  };

  const counts = useMA(() => {
    const c = {};
    ARMORY_KINDS.forEach(({ key }) => { c[key] = (prompts[key] || []).length; });
    return c;
  }, [prompts]);

  const activeMeta = ARMORY_KINDS.find(k => k.key === activeKind);

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: C.bg }}>
      {/* Header */}
      <div style={{ padding: '64px 22px 0' }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: C.dim, fontFamily: FONT_MONO,
          fontSize: 11, letterSpacing: 2, padding: 0, cursor: 'pointer',
        }}>◂ BACK</button>
        <h2 style={{
          fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 44, margin: '12px 0 4px', letterSpacing: -0.5,
        }}>ARMORY</h2>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 11, color: C.dim, letterSpacing: 1, lineHeight: 1.5,
        }}>
          THE FULL DECK. EDIT, ADD, NUKE.
        </div>
      </div>

      <HazardStripes height={8} style={{ marginTop: 16 }} />

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, padding: '12px 14px 8px', overflowX: 'auto',
        borderBottom: `1px solid ${C.line}`,
      }}>
        {ARMORY_KINDS.map((k) => {
          const active = activeKind === k.key;
          return (
            <button key={k.key} onClick={() => setActiveKind(k.key)} style={{
              flexShrink: 0, padding: '6px 10px',
              background: active ? k.color : 'transparent',
              color: active ? '#0a0a0a' : C.dim,
              border: `1px solid ${active ? k.color : C.line}`,
              borderRadius: 3,
              fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 14, letterSpacing: 0.5,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span>{k.label}</span>
              <span style={{
                fontFamily: FONT_MONO, fontSize: 9,
                color: active ? '#0a0a0a99' : C.dim2,
              }}>{counts[k.key]}</span>
            </button>
          );
        })}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px 16px' }}>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 10, color: C.dim, letterSpacing: 2, marginBottom: 10,
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span>// {activeMeta.label} — {activeMeta.sub.toUpperCase()}</span>
          <span>{list.length} ENTRIES</span>
        </div>

        {list.length === 0 && (
          <div style={{
            padding: 20, textAlign: 'center', border: `1px dashed ${C.line}`,
            fontFamily: FONT_MONO, fontSize: 12, color: C.dim, borderRadius: 4,
          }}>
            Empty arsenal. Add one below.
          </div>
        )}

        {list.map((p, i) => (
          <button key={i} onClick={() => startEdit(activeKind, i)} style={{
            display: 'block', width: '100%', textAlign: 'left', marginBottom: 8,
            padding: '12px 14px',
            background: C.surface, border: `1px solid ${C.line}`, borderRadius: 4,
            cursor: 'pointer', color: C.fg, fontFamily: 'inherit',
            transition: 'border-color 100ms, background 100ms',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = activeMeta.color; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.line; }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8,
            }}>
              <div style={{
                fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 22,
                color: activeMeta.color, letterSpacing: 0.5,
                textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap',
              }}>{p.title}</div>
              <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.dim2 }}>EDIT ▸</span>
            </div>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 12, color: C.dim, marginTop: 4, lineHeight: 1.45,
            }}>{p.body}</div>
          </button>
        ))}

        <button onClick={startNew} style={{
          width: '100%', padding: '12px', marginTop: 4,
          background: 'transparent',
          border: `1px dashed ${activeMeta.color}`,
          color: activeMeta.color,
          fontFamily: FONT_MONO, fontSize: 12, letterSpacing: 2, cursor: 'pointer', borderRadius: 4,
        }}>+ ADD {activeMeta.label}</button>

        <button onClick={() => setShowReset(true)} style={{
          width: '100%', marginTop: 16, padding: '10px',
          background: 'transparent', border: `1px solid ${C.line}`,
          color: C.dim, fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 2,
          cursor: 'pointer', borderRadius: 4,
        }}>↻ RESET ALL TO DEFAULTS</button>
      </div>

      {/* Editor modal */}
      {editing && (
        <PromptEditor
          editing={editing}
          setEditing={setEditing}
          onSave={saveEdit}
          onDelete={deletePrompt}
          onCancel={() => setEditing(null)}
          kindMeta={ARMORY_KINDS.find(k => k.key === editing.kind)}
        />
      )}

      {/* Reset confirm */}
      {showReset && (
        <Overlay onClose={() => setShowReset(false)}>
          <div style={{
            background: C.surface, border: `1px solid ${C.danger}`, padding: 22, borderRadius: 4,
          }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, marginBottom: 8 }}>WIPE ALL EDITS?</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.dim, marginBottom: 18 }}>
              Restores every category to the factory deck. Your custom prompts will be lost.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <StencilButton kind="ghost" onClick={() => setShowReset(false)}>KEEP</StencilButton>
              <StencilButton kind="danger" onClick={resetAll}>WIPE</StencilButton>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}

// ─── EDITOR MODAL ──────────────────────────────────────────────
function PromptEditor({ editing, setEditing, onSave, onDelete, onCancel, kindMeta }) {
  const titleRef = useRA(null);
  useEA(() => { if (titleRef.current) titleRef.current.focus(); }, []);

  const valid = editing.title.trim() && editing.body.trim();

  return (
    <Overlay onClose={onCancel}>
      <div style={{
        background: C.surface, border: `2px solid ${kindMeta.color}`, borderRadius: 4, overflow: 'hidden',
        animation: 'mfPop 200ms ease-out',
      }}>
        <div style={{
          background: kindMeta.color, color: '#0a0a0a',
          padding: '8px 14px', fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 2,
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span>// {editing.isNew ? 'NEW' : 'EDIT'} {kindMeta.label}</span>
          <span>{kindMeta.icon}</span>
        </div>

        <div style={{ padding: '18px 18px 8px' }}>
          <label style={{
            fontFamily: FONT_MONO, fontSize: 10, color: C.dim, letterSpacing: 2, display: 'block', marginBottom: 6,
          }}>TITLE</label>
          <input
            ref={titleRef}
            value={editing.title}
            onChange={(e) => setEditing({ ...editing, title: e.target.value.slice(0, 32).toUpperCase() })}
            placeholder="E.G. WATERFALL"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: C.bgDeep, color: kindMeta.color,
              border: `1px solid ${C.line}`, borderRadius: 3,
              padding: '10px 12px',
              fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 24, letterSpacing: 0.5,
              outline: 'none',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = kindMeta.color; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = C.line; }}
          />

          <label style={{
            fontFamily: FONT_MONO, fontSize: 10, color: C.dim, letterSpacing: 2,
            display: 'block', margin: '14px 0 6px',
          }}>BODY</label>
          <textarea
            value={editing.body}
            onChange={(e) => setEditing({ ...editing, body: e.target.value.slice(0, 220) })}
            placeholder="What happens when someone lands here?"
            rows={5}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: C.bgDeep, color: C.fg,
              border: `1px solid ${C.line}`, borderRadius: 3,
              padding: '10px 12px',
              fontFamily: FONT_MONO, fontSize: 13, lineHeight: 1.5,
              outline: 'none', resize: 'none',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = kindMeta.color; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = C.line; }}
          />
          <div style={{
            fontFamily: FONT_MONO, fontSize: 9, color: C.dim2, textAlign: 'right',
            marginTop: 4, letterSpacing: 1,
          }}>{editing.body.length}/220</div>
        </div>

        <HazardStripes height={6} opacity={0.5} />

        <div style={{ padding: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <StencilButton kind="ghost" onClick={onCancel} style={{ fontSize: 16, flex: 1 }}>
            CANCEL
          </StencilButton>
          {!editing.isNew && (
            <StencilButton kind="danger" onClick={onDelete} style={{ fontSize: 16, flex: 1 }}>
              DELETE
            </StencilButton>
          )}
          <StencilButton onClick={onSave} disabled={!valid} style={{ fontSize: 16, flex: 1 }}>
            SAVE ▶
          </StencilButton>
        </div>
      </div>
    </Overlay>
  );
}

Object.assign(window, { ArmoryScreen, loadPrompts, savePrompts, ARMORY_KINDS });
