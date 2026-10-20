// Common dress-code colour names, so picking a colour fills in a name guests understand.
const NAMED_COLORS: [string, string][] = [
  ['White', '#FFFFFF'],
  ['Ivory', '#F6F1E1'],
  ['Cream', '#EFE0BD'],
  ['Champagne', '#E8D3A9'],
  ['Beige', '#D9C4A0'],
  ['Khaki', '#BDAE87'],
  ['Taupe', '#8B7D6B'],
  ['Earth Brown', '#8B7355'],
  ['Mocha', '#967259'],
  ['Brown', '#6F4E37'],
  ['Chocolate', '#4A2C21'],
  ['Light Grey', '#D3D3D3'],
  ['Silver', '#B8B8B8'],
  ['Grey', '#808080'],
  ['Charcoal', '#36454F'],
  ['Black', '#000000'],
  ['Blush', '#F4C9C4'],
  ['Dusty Pink', '#D8A7A7'],
  ['Pink', '#F4A7B9'],
  ['Rose', '#C9647A'],
  ['Fuchsia', '#C2185B'],
  ['Red', '#C62828'],
  ['Maroon', '#800000'],
  ['Burgundy', '#6D1A36'],
  ['Peach', '#F7C5A0'],
  ['Coral', '#F08070'],
  ['Terracotta', '#C8664A'],
  ['Rust', '#B7410E'],
  ['Orange', '#F28C28'],
  ['Mustard', '#D4A017'],
  ['Yellow', '#F5D547'],
  ['Gold', '#C9A44C'],
  ['Mint', '#C8DEC8'],
  ['Sage', '#9CAF88'],
  ['Olive', '#808000'],
  ['Moss', '#6B7F3A'],
  ['Green', '#2E8B57'],
  ['Emerald', '#1F7A4D'],
  ['Forest Green', '#2D4F2D'],
  ['Teal', '#0F7C7C'],
  ['Turquoise', '#40C4C4'],
  ['Baby Blue', '#BCD8EE'],
  ['Sky Blue', '#87CEEB'],
  ['Dusty Blue', '#8AA4BE'],
  ['Blue', '#2F6DB5'],
  ['Royal Blue', '#2349A8'],
  ['Navy', '#000080'],
  ['Lavender', '#C9B8E0'],
  ['Lilac', '#B79CC9'],
  ['Mauve', '#A87D94'],
  ['Purple', '#6A3D9A'],
  ['Plum', '#5E2750']
];

type Lab = [number, number, number];

function hexToRgb(hex: string): [number, number, number] | null {
  let value = hex.replace('#', '');
  if (value.length === 3) value = value.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}/.test(value)) return null;
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16)) as [number, number, number];
}

// sRGB → CIELAB (D65), where plain distance is close to how different colours look.
function toLab([r, g, b]: [number, number, number]): Lab {
  const [lr, lg, lb] = [r, g, b].map((c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  const x = (lr * 0.4124 + lg * 0.3576 + lb * 0.1805) / 0.95047;
  const y = lr * 0.2126 + lg * 0.7152 + lb * 0.0722;
  const z = (lr * 0.0193 + lg * 0.1192 + lb * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

const NAMED_LABS = NAMED_COLORS.map(([name, hex]) => [name, toLab(hexToRgb(hex)!)] as const);

// The closest common name for a hex colour like "#7A9E7A" ('' if it isn't a valid colour).
export function colorName(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '';
  const lab = toLab(rgb);
  let best = '';
  let bestDistance = Infinity;
  for (const [name, named] of NAMED_LABS) {
    const distance = (lab[0] - named[0]) ** 2 + (lab[1] - named[1]) ** 2 + (lab[2] - named[2]) ** 2;
    if (distance < bestDistance) {
      best = name;
      bestDistance = distance;
    }
  }
  return best;
}
