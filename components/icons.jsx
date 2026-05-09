// Lightweight inline SVG icon set — original, geometric, no third-party glyphs
const Icon = ({ name, size = 18, stroke = 1.6, className = "", style = {} }) => {
  const s = { width: size, height: size, ...style };
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  const paths = {
    home: <><path d="M3 11.5 12 4l9 7.5" {...common} /><path d="M5 10v10h14V10" {...common} /></>,
    sword: <><path d="M14.5 3l6.5 0 0 6.5L9 21.5l-3.2-3.2 1.4-2.6-2.6 1.4L1.5 14L14.5 3z" {...common} /></>,
    scroll: <><rect x="4" y="4" width="16" height="16" rx="2" {...common} /><path d="M8 8h8M8 12h8M8 16h5" {...common} /></>,
    users: <><circle cx="9" cy="9" r="3.5" {...common} /><circle cx="17" cy="10" r="2.5" {...common} /><path d="M3 19c0-3 2.7-5 6-5s6 2 6 5" {...common} /><path d="M15 19c0-2 1.5-4 4-4s2 1 2 4" {...common} /></>,
    book: <><path d="M4 4h7a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4z" {...common} /><path d="M20 4h-7a3 3 0 0 0-3 3v13h7a3 3 0 0 0 3-3V4z" {...common} /></>,
    dice: <><path d="M12 3 21 8v8l-9 5-9-5V8l9-5z" {...common} /><path d="M3 8l9 5 9-5M12 13v8" {...common} /></>,
    shield: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" {...common} /></>,
    spark: <><path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.5 5.5l4 4M14.5 14.5l4 4M18.5 5.5l-4 4M9.5 14.5l-4 4" {...common} /></>,
    plus: <><path d="M12 5v14M5 12h14" {...common} /></>,
    search: <><circle cx="11" cy="11" r="6.5" {...common} /><path d="M16 16l4 4" {...common} /></>,
    bell: <><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2.5h-15L6 16z" {...common} /><path d="M10 21h4" {...common} /></>,
    settings: <><circle cx="12" cy="12" r="3" {...common} /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" {...common} /></>,
    chevron: <><path d="M9 6l6 6-6 6" {...common} /></>,
    chevronDown: <><path d="M6 9l6 6 6-6" {...common} /></>,
    edit: <><path d="M14 4l6 6L9 21H3v-6L14 4z" {...common} /></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" {...common} /></>,
    play: <><path d="M7 4l13 8-13 8V4z" {...common} /></>,
    map: <><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z" {...common} /><path d="M9 4v16M15 6v16" {...common} /></>,
    crown: <><path d="M3 8l4 6 5-9 5 9 4-6v11H3V8z" {...common} /></>,
    heart: <><path d="M12 20S3 14 3 8.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9 2.5C21 14 12 20 12 20z" {...common} /></>,
    flame: <><path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-3 2-6 1 1 2 1 3-4z" {...common} /></>,
    target: <><circle cx="12" cy="12" r="9" {...common} /><circle cx="12" cy="12" r="5" {...common} /><circle cx="12" cy="12" r="1.5" {...common} /></>,
    moon: <><path d="M20 14a8 8 0 1 1-10-10 6 6 0 0 0 10 10z" {...common} /></>,
    leaf: <><path d="M5 19c0-9 7-15 15-15-1 9-6 15-15 15z" {...common} /><path d="M5 19l9-9" {...common} /></>,
    bolt: <><path d="M13 3L4 14h6l-1 7 9-11h-6l1-7z" {...common} /></>,
    skull: <><path d="M5 11a7 7 0 0 1 14 0v4l-2 2v3h-3v-2h-4v2H7v-3l-2-2v-4z" {...common} /><circle cx="9" cy="11" r="1.2" {...common} /><circle cx="15" cy="11" r="1.2" {...common} /></>,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" {...common} /><circle cx="12" cy="12" r="3" {...common} /></>,
    close: <><path d="M6 6l12 12M18 6L6 18" {...common} /></>,
    x: <><path d="M6 6l12 12M18 6L6 18" {...common} /></>,
    zap: <><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" {...common} /></>,
    check: <><path d="M5 12l5 5L20 7" {...common} /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" {...common} /></>,
    star: <><path d="M12 3l2.5 6 6.5.5-5 4.5 1.5 6.5L12 17l-5.5 3.5L8 14 3 9.5 9.5 9 12 3z" {...common} /></>,
    chat: <><path d="M4 5h16v11h-9l-5 4v-4H4V5z" {...common} /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" {...common} /><rect x="14" y="3" width="7" height="7" rx="1" {...common} /><rect x="3" y="14" width="7" height="7" rx="1" {...common} /><rect x="14" y="14" width="7" height="7" rx="1" {...common} /></>,
    list: <><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" {...common} /></>,
    upload: <><path d="M12 16V4M6 10l6-6 6 6M4 20h16" {...common} /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" {...common} /><path d="M3 10h18M8 3v4M16 3v4" {...common} /></>,
    coin: <><circle cx="12" cy="12" r="9" {...common} /><path d="M12 7v10M9 9.5c0-1 1-2 3-2s3 1 3 2-1 1.5-3 1.5-3 0.5-3 1.5 1 2 3 2 3-1 3-2" {...common} /></>,
    potion: <><path d="M9 3h6v4l3 5a6 6 0 1 1-12 0l3-5V3z" {...common} /><path d="M9 3h6" {...common} /></>,
    feather: <><path d="M20 4c-7 0-13 5-13 12v4l4-4c5-1 9-4 9-12z" {...common} /><path d="M20 4L7 17" {...common} /></>,
    user: <><circle cx="12" cy="8" r="4" {...common} /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" {...common} /></>,
  };
  return (
    <svg viewBox="0 0 24 24" style={s} className={className} xmlns="http://www.w3.org/2000/svg">
      {paths[name] || null}
    </svg>
  );
};

window.Icon = Icon;
