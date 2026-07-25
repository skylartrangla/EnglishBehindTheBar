import { allAvatarItems } from "../data/game.js";

function itemById(id) {
  return allAvatarItems.find((item) => item.id === id);
}

export default function BartenderAvatar({ equipped = {}, compact = false }) {
  const outfit = itemById(equipped.outfit) || itemById("classic-apron");
  const head = itemById(equipped.head);
  const accessory = itemById(equipped.accessory);
  const background = itemById(equipped.background);

  return (
    <div
      className={`avatar-stage${compact ? " compact" : ""}`}
      style={{
        "--avatar-bg": background?.color || "#06364a",
        "--avatar-glow": background?.accent || "#14c4d8",
        "--outfit": outfit?.color || "#087b95",
        "--outfit-accent": outfit?.accent || "#59ddea",
      }}
      aria-label="Pu’s customizable bartender character"
    >
      <div className="avatar-bubbles" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <svg viewBox="0 0 260 300" role="img" aria-label="Pu behind an ocean-blue bar">
        <defs>
          <linearGradient id="hair" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#142f3b" />
            <stop offset="1" stopColor="#07131d" />
          </linearGradient>
        </defs>
        <path d="M36 270h188v28H36z" fill="#031923" opacity=".8" />
        <path d="M77 268c3-67 23-96 53-96s50 29 53 96z" fill="var(--outfit)" />
        <path d="M105 178h50l15 90H90z" fill="var(--outfit-accent)" opacity=".88" />
        <path d="M95 182l35 34 35-34" fill="none" stroke="#eafcff" strokeWidth="6" />
        <circle cx="130" cy="125" r="53" fill="#e5b38f" />
        <path
          d="M78 127c-10-50 20-82 58-82 42 0 66 35 48 89-7-26-15-44-31-59-13 18-35 29-75 34z"
          fill="url(#hair)"
        />
        <path d="M78 116c-2 38 8 54 18 67-25-11-31-47-18-67zm106-5c4 42-5 61-20 75 28-10 34-49 20-75z" fill="url(#hair)" />
        <circle cx="111" cy="129" r="4" fill="#142f3b" />
        <circle cx="150" cy="129" r="4" fill="#142f3b" />
        <path d="M116 151c9 8 20 8 29 0" fill="none" stroke="#a75956" strokeWidth="4" strokeLinecap="round" />
        <path d="M67 199c-24 22-29 48-28 69m154-69c24 22 29 48 28 69" fill="none" stroke="#e5b38f" strokeWidth="18" strokeLinecap="round" />
        <path d="M207 216l11 47-23 5-9-47z" fill="#d7ebee" stroke="#59ddea" strokeWidth="3" />
      </svg>
      {head && (
        <span className="avatar-head-item" style={{ color: head.color }} title={head.name}>
          {head.icon}
        </span>
      )}
      {accessory && (
        <span
          className="avatar-accessory-item"
          style={{ color: accessory.color }}
          title={accessory.name}
        >
          {accessory.icon}
        </span>
      )}
      <div className="avatar-nameplate">
        <strong>PU</strong>
        <span>ENGLISH BEHIND THE BAR</span>
      </div>
    </div>
  );
}
