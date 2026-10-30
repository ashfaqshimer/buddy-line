import fs from 'node:fs';

const pngBuf = fs.readFileSync('public/buddyline-logo-512.png');
const base64Png = pngBuf.toString('base64');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%" aria-label="Buddy Line Logo">
  <defs>
    <radialGradient id="bl-bg-glow" cx="50%" cy="50%" r="50%">
      <stop offset="70%" stop-color="#131822" stop-opacity="1" />
      <stop offset="100%" stop-color="#0e121a" stop-opacity="1" />
    </radialGradient>
    <linearGradient id="bl-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#c084fc" />
    </linearGradient>
    <filter id="bl-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.5" />
      <feDropShadow dx="0" dy="0" stdDeviation="12" flood-color="#38bdf8" flood-opacity="0.2" />
    </filter>
    <clipPath id="bl-circle-clip">
      <circle cx="256" cy="256" r="250" />
    </clipPath>
  </defs>

  <g filter="url(#bl-shadow)">
    <!-- Base dark circular backing -->
    <circle cx="256" cy="256" r="250" fill="url(#bl-bg-glow)" />

    <!-- High-definition circular emblem artwork -->
    <image
      href="data:image/png;base64,${base64Png}"
      x="6"
      y="6"
      width="500"
      height="500"
      clip-path="url(#bl-circle-clip)"
      preserveAspectRatio="xMidYMid meet"
    />

    <!-- Crisp neon gradient outer rim -->
    <circle
      cx="256"
      cy="256"
      r="249"
      fill="none"
      stroke="url(#bl-ring-gradient)"
      stroke-width="3"
      stroke-opacity="0.75"
    />
  </g>
</svg>
`;

fs.writeFileSync('public/buddyline-logo.svg', svgContent, 'utf-8');
fs.writeFileSync('public/buddylineLogo.svg', svgContent, 'utf-8');
fs.writeFileSync('public/logo.svg', svgContent, 'utf-8');
console.log('Successfully written SVG files!');
console.log('File size:', fs.statSync('public/buddyline-logo.svg').size, 'bytes');
