import React from "react";

interface SectionDividerProps {
  variant?: "sawtooth-outline" | "sawtooth-solid" | "chevron-dark" | "wave";
  className?: string;
}

export function SectionDivider({
  variant = "sawtooth-outline",
  className = "",
}: SectionDividerProps) {
  if (variant === "sawtooth-solid") {
    return (
      <div
        className={`w-full overflow-hidden leading-none text-[#EC2929] select-none ${className}`}
        aria-hidden="true"
      >
        <svg
          className="w-full h-4 sm:h-6 block"
          viewBox="0 0 1200 24"
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path d="M0,0 L15,24 L30,0 L45,24 L60,0 L75,24 L90,0 L105,24 L120,0 L135,24 L150,0 L165,24 L180,0 L195,24 L210,0 L225,24 L240,0 L255,24 L270,0 L285,24 L300,0 L315,24 L330,0 L345,24 L360,0 L375,24 L390,0 L405,24 L420,0 L435,24 L450,0 L465,24 L480,0 L495,24 L510,0 L525,24 L540,0 L556,24 L570,0 L585,24 L600,0 L615,24 L630,0 L645,24 L660,0 L675,24 L690,0 L705,24 L720,0 L735,24 L750,0 L765,24 L780,0 L795,24 L810,0 L825,24 L840,0 L855,24 L870,0 L885,24 L900,0 L915,24 L930,0 L945,24 L960,0 L975,24 L990,0 L1005,24 L1020,0 L1035,24 L1050,0 L1065,24 L1080,0 L1095,24 L1110,0 L1125,24 L1140,0 L1155,24 L1170,0 L1185,24 L1200,0 Z" />
        </svg>
      </div>
    );
  }

  if (variant === "chevron-dark") {
    return (
      <div
        className={`w-full overflow-hidden leading-none text-[#230D10] select-none relative py-1 ${className}`}
        aria-hidden="true"
      >
        <svg
          className="w-full h-4 sm:h-5 block"
          viewBox="0 0 1200 20"
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path d="M0,10 L15,0 L30,10 L45,0 L60,10 L75,0 L90,10 L105,0 L120,10 L135,0 L150,10 L165,0 L180,10 L195,0 L210,10 L225,0 L240,10 L255,0 L270,10 L285,0 L300,10 L315,0 L330,10 L345,0 L360,10 L375,0 L390,10 L405,0 L420,10 L435,0 L450,10 L465,0 L480,10 L495,0 L510,10 L525,0 L540,10 L555,0 L570,10 L585,0 L600,10 L615,0 L630,10 L645,0 L660,10 L675,0 L690,10 L705,0 L720,10 L735,0 L750,10 L765,0 L780,10 L795,0 L810,10 L825,0 L840,10 L855,0 L870,10 L885,0 L900,10 L915,0 L930,10 L945,0 L960,10 L975,0 L990,10 L1005,0 L1020,10 L1035,0 L1050,10 L1065,0 L1080,10 L1095,0 L1110,10 L1125,0 L1140,10 L1155,0 L1170,10 L1185,0 L1200,10 L1200,20 L0,20 Z" />
        </svg>
      </div>
    );
  }

  if (variant === "wave") {
    return (
      <div
        className={`w-full overflow-hidden leading-none select-none ${className}`}
        aria-hidden="true"
      >
        <svg
          className="w-full h-4 sm:h-6 text-[#EC2929]"
          viewBox="0 0 1200 24"
          preserveAspectRatio="none"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M0,12 Q30,0 60,12 T120,12 T180,12 T240,12 T300,12 T360,12 T420,12 T480,12 T540,12 T600,12 T660,12 T720,12 T780,12 T840,12 T900,12 T960,12 T1020,12 T1080,12 T1140,12 T1200,12" />
        </svg>
      </div>
    );
  }

  // Default: sawtooth-outline
  return (
    <div
      className={`w-full overflow-hidden leading-none select-none text-[#EC2929] ${className}`}
      aria-hidden="true"
    >
      <svg
        className="w-full h-3 sm:h-5 block"
        viewBox="0 0 1200 16"
        preserveAspectRatio="none"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M0,16 L15,2 L30,16 L45,2 L60,16 L75,2 L90,16 L105,2 L120,16 L135,2 L150,16 L165,2 L180,16 L195,2 L210,16 L225,2 L240,16 L255,2 L270,16 L285,2 L300,16 L315,2 L330,16 L345,2 L360,16 L375,2 L390,16 L405,2 L420,16 L435,2 L450,16 L465,2 L480,16 L495,2 L510,16 L525,2 L540,16 L555,2 L570,16 L585,2 L600,16 L615,2 L630,16 L645,2 L660,16 L675,2 L690,16 L705,2 L720,16 L735,2 L750,16 L765,2 L780,16 L795,2 L810,16 L825,2 L840,16 L855,2 L870,16 L885,2 L900,16 L915,2 L930,16 L945,2 L960,16 L975,2 L990,16 L1005,2 L1020,16 L1035,2 L1050,16 L1065,2 L1080,16 L1095,2 L1110,16 L1125,2 L1140,16 L1155,2 L1170,16 L1185,2 L1200,16" />
      </svg>
    </div>
  );
}
