'use client';

interface LogoProps {
  size?: number;
  className?: string;
  variant?: 'default' | 'color';
}

// Real Zoo logo: three overlapping circles (Venn diagram)
// From @zooai/logo — using currentColor for theme-aware rendering
function getMenuBarSVG(): string {
  return `<svg viewBox="98 102 828 828" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <clipPath id="outerCircleMenu">
        <circle cx="508" cy="510" r="283"></circle>
      </clipPath>
    </defs>
    <g clip-path="url(#outerCircleMenu)">
      <circle cx="513" cy="369" r="234" fill="none" stroke="currentColor" stroke-width="33"></circle>
      <circle cx="365" cy="595" r="234" fill="none" stroke="currentColor" stroke-width="33"></circle>
      <circle cx="643" cy="595" r="234" fill="none" stroke="currentColor" stroke-width="33"></circle>
      <circle cx="508" cy="510" r="265" fill="none" stroke="currentColor" stroke-width="33"></circle>
    </g>
  </svg>`;
}

function getColorSVG(): string {
  return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <clipPath id="outerCircleColor">
        <circle cx="512" cy="511" r="270"/>
      </clipPath>
      <clipPath id="greenClip">
        <circle cx="513" cy="369" r="234"/>
      </clipPath>
      <clipPath id="redClip">
        <circle cx="365" cy="595" r="234"/>
      </clipPath>
      <clipPath id="blueClip">
        <circle cx="643" cy="595" r="234"/>
      </clipPath>
    </defs>
    <g clip-path="url(#outerCircleColor)">
      <circle cx="513" cy="369" r="234" fill="#00A652"/>
      <circle cx="365" cy="595" r="234" fill="#ED1C24"/>
      <circle cx="643" cy="595" r="234" fill="#2E3192"/>
      <g clip-path="url(#greenClip)">
        <circle cx="365" cy="595" r="234" fill="#FCF006"/>
      </g>
      <g clip-path="url(#greenClip)">
        <circle cx="643" cy="595" r="234" fill="#01ACF1"/>
      </g>
      <g clip-path="url(#redClip)">
        <circle cx="643" cy="595" r="234" fill="#EA018E"/>
      </g>
      <g clip-path="url(#greenClip)">
        <g clip-path="url(#redClip)">
          <circle cx="643" cy="595" r="234" fill="#FFFFFF"/>
        </g>
      </g>
    </g>
  </svg>`;
}

export function Logo({ size = 24, className = '', variant = 'color' }: LogoProps) {
  const svg = variant === 'color' ? getColorSVG() : getMenuBarSVG();

  return (
    <div
      className={`logo-container inline-block ${className}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export function LogoWithText({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2 group logo-with-text">
      <Logo
        size={size}
        className="transition-transform duration-200 group-hover:scale-110"
      />
      <div className="relative h-6">
        <span className="font-bold text-lg inline-block transition-all duration-300 ease-out group-hover:opacity-0 group-hover:-translate-y-full">
          ZIPs
        </span>
        <span className="font-bold text-lg absolute left-0 top-0 opacity-0 translate-y-full transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-y-0 whitespace-nowrap">
          Zoo Proposals
        </span>
      </div>
    </div>
  );
}

export function LogoStatic({ size = 24, text = 'ZIPs' }: { size?: number; text?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Logo size={size} />
      <span className="font-bold text-lg">{text}</span>
    </div>
  );
}
