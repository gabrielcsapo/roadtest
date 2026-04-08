interface LogoProps {
  size?: number;
  id?: string;
}

export default function Logo({ size = 32, id = "logo" }: LogoProps) {
  const coinId = `${id}-coin`;
  const coverId = `${id}-cover`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id={coinId} cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#e2a820" />
          <stop offset="55%" stopColor="#c8880e" />
          <stop offset="100%" stopColor="#a86508" />
        </radialGradient>
        <linearGradient id={coverId} x1="0%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#2d6a4f" />
          <stop offset="100%" stopColor="#1b4332" />
        </linearGradient>
      </defs>
      <g transform="translate(87,97) rotate(-7)">
        <rect x="-38" y="-56" width="80" height="112" rx="2" fill="#ede8d5" />
        <rect x="-44" y="-61" width="89" height="122" rx="5" fill="#153d29" />
        <rect x="-44" y="-61" width="87" height="120" rx="5" fill={`url(#${coverId})`} />
        <rect x="-44" y="-61" width="15" height="120" rx="5" fill="#153d29" />
        <rect x="-37" y="-61" width="8" height="120" fill="#153d29" />
        <rect x="-16" y="-40" width="48" height="2.5" rx="1.25" fill="rgba(255,255,255,0.28)" />
        <rect x="-16" y="-31" width="36" height="2" rx="1" fill="rgba(255,255,255,0.16)" />
        <rect x="-16" y="-23" width="42" height="2" rx="1" fill="rgba(255,255,255,0.16)" />
        <rect x="-44" y="16" width="87" height="5" rx="2.5" fill="#c9960f" opacity="0.88" />
      </g>
      <g transform="translate(134,134)">
        <circle r="33" fill="#8a5200" />
        <circle r="30" fill={`url(#${coinId})`} />
        <circle r="24.5" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" />
        <path
          d="M-10 1 L-2 11 L13,-10"
          stroke="#6b3a00"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
