// On-brand vector product mockups for the Print & Ship catalog cards. These are
// placeholders that look intentional; swap in real product photos when
// available by replacing the rendered art per product key.

function QrMotif({ x, y, s }: { x: number; y: number; s: number }) {
  // A small stylized QR: three finder squares plus a scatter of modules.
  const u = s / 11; // module unit
  const ink = "#0A2540";
  const finder = (fx: number, fy: number) => (
    <>
      <rect
        x={x + fx * u}
        y={y + fy * u}
        width={u * 3}
        height={u * 3}
        rx={u * 0.7}
        fill="none"
        stroke={ink}
        strokeWidth={u * 0.7}
      />
      <rect
        x={x + (fx + 1) * u}
        y={y + (fy + 1) * u}
        width={u}
        height={u}
        rx={u * 0.3}
        fill={ink}
      />
    </>
  );
  const dots: [number, number][] = [
    [5, 1], [7, 1], [9, 0], [5, 3], [9, 3], [4, 5], [6, 5], [8, 5], [10, 5],
    [1, 9], [3, 9], [5, 7], [7, 9], [9, 7], [10, 9], [5, 10], [8, 8], [9, 10],
    [7, 7],
  ];
  return (
    <g>
      {finder(0, 0)}
      {finder(8, 0)}
      {finder(0, 8)}
      {dots.map(([dx, dy], i) => (
        <rect
          key={i}
          x={x + dx * u}
          y={y + dy * u}
          width={u}
          height={u}
          rx={u * 0.3}
          fill={ink}
        />
      ))}
    </g>
  );
}

export function ProductArt({ kind }: { kind: string }) {
  const common = (
    <defs>
      <filter id="pa-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow
          dx="0"
          dy="6"
          stdDeviation="9"
          floodColor="#0A2540"
          floodOpacity="0.16"
        />
      </filter>
      <linearGradient id="pa-glass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#e8f1fd" />
        <stop offset="1" stopColor="#d3e4fa" />
      </linearGradient>
    </defs>
  );

  if (kind === "window_decal") {
    return (
      <svg
        viewBox="0 0 320 150"
        className="h-full w-full"
        role="img"
        aria-label="Window decal mockup"
      >
        {common}
        {/* glass pane */}
        <rect x="40" y="14" width="240" height="122" rx="10" fill="url(#pa-glass)" />
        {/* reflection streaks */}
        <path d="M70 14 L120 14 L60 136 L40 136 L40 120 Z" fill="#ffffff" opacity="0.35" />
        <path d="M150 14 L172 14 L96 136 L80 136 Z" fill="#ffffff" opacity="0.22" />
        {/* frame */}
        <rect
          x="40"
          y="14"
          width="240"
          height="122"
          rx="10"
          fill="none"
          stroke="#bcd0ec"
          strokeWidth="2"
        />
        {/* applied decal */}
        <g filter="url(#pa-shadow)">
          <rect x="125" y="36" width="78" height="78" rx="12" fill="#ffffff" />
        </g>
        <QrMotif x={135} y={46} s={58} />
      </svg>
    );
  }

  if (kind === "counter_sign") {
    return (
      <svg
        viewBox="0 0 320 150"
        className="h-full w-full"
        role="img"
        aria-label="Countertop sign mockup"
      >
        {common}
        {/* easel stand */}
        <path d="M150 132 L138 150 L150 150 Z" fill="#c2cedd" />
        <path d="M170 132 L182 150 L170 150 Z" fill="#c2cedd" />
        {/* sign board (portrait) */}
        <g filter="url(#pa-shadow)">
          <rect x="120" y="10" width="80" height="124" rx="8" fill="#ffffff" />
        </g>
        {/* logo bar */}
        <rect x="134" y="20" width="52" height="9" rx="3" fill="#2587DE" />
        {/* QR */}
        <QrMotif x={138} y={38} s={44} />
        {/* headline lines */}
        <rect x="132" y="92" width="56" height="7" rx="2" fill="#0A2540" />
        <rect x="140" y="103" width="40" height="7" rx="2" fill="#0A2540" />
        {/* URL pill */}
        <rect x="134" y="118" width="52" height="9" rx="4.5" fill="#1f7a3d" />
      </svg>
    );
  }

  // die_cut_decal (default)
  return (
    <svg
      viewBox="0 0 320 150"
      className="h-full w-full"
      role="img"
      aria-label="Die-cut decal mockup"
    >
      {common}
      <g transform="rotate(-6 160 75)">
        {/* white die-cut contour border */}
        <g filter="url(#pa-shadow)">
          <rect x="110" y="20" width="100" height="100" rx="20" fill="#ffffff" />
        </g>
        {/* inner code */}
        <QrMotif x={124} y={34} s={72} />
        {/* subtle lifted corner */}
        <path
          d="M196 104 Q210 110 210 120 L210 120 L186 120 Z"
          fill="#eef2f7"
        />
      </g>
    </svg>
  );
}
