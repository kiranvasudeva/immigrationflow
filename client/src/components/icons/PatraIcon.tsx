interface PatraIconProps {
  className?: string;
  size?: number;
}

export default function PatraIcon({ className = "h-8 w-8", size = 32 }: PatraIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Modern geometric document processing icon */}
      {/* Base document shape */}
      <rect
        x="4"
        y="6"
        width="16"
        height="20"
        rx="2"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      
      {/* Folded corner */}
      <path
        d="M16 6L20 10V8C20 6.89543 19.1046 6 18 6H16Z"
        fill="currentColor"
        fillOpacity="0.3"
      />
      
      {/* Processing layers/sheets */}
      <rect
        x="8"
        y="4"
        width="16"
        height="20"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />
      
      <rect
        x="12"
        y="2"
        width="16"
        height="20"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.3"
      />
      
      {/* Document content lines */}
      <line
        x1="7"
        y1="12"
        x2="15"
        y2="12"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.7"
      />
      <line
        x1="7"
        y1="15"
        x2="13"
        y2="15"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.7"
      />
      <line
        x1="7"
        y1="18"
        x2="14"
        y2="18"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.7"
      />
      
      {/* Processing arrow/flow indicator */}
      <path
        d="M22 16L26 12M26 12L22 8M26 12H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}