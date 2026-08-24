export function StaticNetwork() {
  return (
    <svg
      aria-hidden="true"
      className="static-network"
      data-testid="static-network"
      focusable="false"
      viewBox="0 0 640 640"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="static-network-core" cx="50%" cy="45%" r="58%">
          <stop offset="0" stopColor="#fff2dd" stopOpacity="0.96" />
          <stop offset="0.3" stopColor="#ffb457" stopOpacity="0.72" />
          <stop offset="1" stopColor="#ff7a59" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="static-network-line" x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#ffb457" stopOpacity="0.62" />
          <stop offset="1" stopColor="#ff7a59" stopOpacity="0.18" />
        </linearGradient>
        <filter id="static-network-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      <circle cx="320" cy="320" fill="none" r="248" stroke="#ffb457" strokeDasharray="3 12" strokeOpacity="0.2" />
      <circle cx="320" cy="320" fill="none" r="172" stroke="#ff7a59" strokeOpacity="0.2" />
      <g
        data-network-links="true"
        fill="none"
        stroke="url(#static-network-line)"
        strokeWidth="1.4"
      >
        <path d="M320 320 170 144 92 318 196 493 320 320 472 130 554 294 465 500 320 320" />
        <path d="M170 144 472 130M92 318 196 493M554 294 465 500" strokeOpacity="0.45" />
      </g>
      <g fill="#ffb457">
        <circle cx="170" cy="144" data-network-node="north-west" r="5" />
        <circle cx="92" cy="318" data-network-node="west" r="4" />
        <circle cx="196" cy="493" data-network-node="south-west" r="5" />
        <circle cx="472" cy="130" data-network-node="north-east" r="4" />
        <circle cx="554" cy="294" data-network-node="east" r="5" />
        <circle cx="465" cy="500" data-network-node="south-east" fill="#ff7a59" r="5" />
      </g>
      <circle cx="320" cy="320" fill="#ffb457" filter="url(#static-network-glow)" opacity="0.46" r="62" />
      <circle cx="320" cy="320" fill="url(#static-network-core)" r="54" />
      <circle cx="320" cy="320" fill="#fff2dd" r="7" />
    </svg>
  );
}
