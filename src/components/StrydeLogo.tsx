export function StrydeLogo({ size = 64 }: { size?: number }) {
  return (
    <div
      className="relative flex items-center justify-center rounded-2xl bg-gradient-primary shadow-glow"
      style={{ width: size, height: size }}
      aria-label="STRYDE logo"
    >
      <svg viewBox="0 0 64 64" width={size * 0.7} height={size * 0.7} fill="none">
        {/* Shield outline */}
        <path
          d="M32 6 L52 14 V32 C52 44 42 54 32 58 C22 54 12 44 12 32 V14 Z"
          stroke="currentColor"
          strokeWidth="3"
          className="text-background"
          fill="none"
        />
        {/* Person silhouette */}
        <circle cx="32" cy="24" r="4.2" className="fill-background" />
        <path
          d="M32 30 L32 42 M32 34 L25 38 M32 34 L39 38 M32 42 L27 50 M32 42 L37 50"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          className="text-background"
        />
        {/* Signal dot */}
        <circle cx="46" cy="18" r="2.2" className="fill-background" />
      </svg>
    </div>
  );
}
