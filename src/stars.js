const SHADES = ['#101f42', '#14254e', '#1a3268', '#213a73', '#23407f', '#2b4b95', '#3568d4', '#6d90d8'];

export function makeStars() {
  let rects = '';
  for (let i = 0; i < 14; i++) {
    const x = (Math.random() * 31) | 0;
    const y = (Math.random() * 31) | 0;
    const w = Math.random() < 0.16 ? 2 : 1;
    const shade = SHADES[(Math.random() * SHADES.length) | 0];
    rects += "<rect x='" + x + "' y='" + y + "' width='" + w + "' height='" + w + "' fill='" + shade + "'/>";
  }
  const svg =
    "<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' shape-rendering='crispEdges'>" +
    rects +
    '</svg>';
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}
