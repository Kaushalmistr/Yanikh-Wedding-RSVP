// Default placeholder image as a data URI (simple gradient with heart)
// We use an SVG data URI so it works in single-file mode
export const DEFAULT_COVER_IMAGE = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f43f5e"/>
      <stop offset="50%" style="stop-color:#ec4899"/>
      <stop offset="100%" style="stop-color:#a855f7"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#bg)"/>
  <text x="400" y="220" text-anchor="middle" fill="white" font-size="80" font-family="serif">♥</text>
  <text x="400" y="300" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-size="28" font-family="sans-serif" font-weight="bold">Wedding Celebration</text>
  <text x="400" y="340" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="16" font-family="sans-serif">Upload a cover photo to personalize</text>
</svg>
`)}`;

export const HERO_BG_GRADIENT = 'bg-gradient-to-br from-rose-600 via-pink-600 to-purple-700';
