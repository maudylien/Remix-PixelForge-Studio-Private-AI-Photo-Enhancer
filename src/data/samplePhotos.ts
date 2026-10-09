import { BatchItem } from '../types';

function createPhotoSvgDataUrl(
  title: string,
  category: 'portrait' | 'landscape' | 'vintage' | 'anime',
  w: number,
  h: number,
  bgHue: number,
  detailColor: string
): string {
  let innerGraphic = '';
  if (category === 'portrait') {
    innerGraphic = `
      <!-- Portrait Silhouette and Lighting -->
      <radialGradient id="faceGlow" cx="50%" cy="40%" r="50%">
        <stop offset="0%" stop-color="#fff" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.6"/>
      </radialGradient>
      <!-- Head / Face -->
      <circle cx="${w/2}" cy="${h*0.38}" r="${w*0.22}" fill="hsl(${bgHue}, 45%, 72%)" />
      <circle cx="${w/2}" cy="${h*0.38}" r="${w*0.22}" fill="url(#faceGlow)" />
      <!-- Eyes & Brows -->
      <ellipse cx="${w*0.42}" cy="${h*0.35}" rx="${w*0.035}" ry="${h*0.02}" fill="#1e293b" />
      <ellipse cx="${w*0.58}" cy="${h*0.35}" rx="${w*0.035}" ry="${h*0.02}" fill="#1e293b" />
      <circle cx="${w*0.42}" cy="${h*0.35}" r="${w*0.012}" fill="#38bdf8" />
      <circle cx="${w*0.58}" cy="${h*0.35}" r="${w*0.012}" fill="#38bdf8" />
      <!-- Nose & Smile -->
      <path d="M ${w/2} ${h*0.36} L ${w*0.48} ${h*0.41} L ${w/2} ${h*0.42}" stroke="#78350f" stroke-width="2" fill="none"/>
      <path d="M ${w*0.44} ${h*0.46} Q ${w/2} ${h*0.50} ${w*0.56} ${h*0.46}" stroke="#991b1b" stroke-width="3" fill="none" stroke-linecap="round"/>
      <!-- Shoulders / Clothes -->
      <path d="M ${w*0.2} ${h} Q ${w/2} ${h*0.58} ${w*0.8} ${h} Z" fill="hsl(${bgHue + 40}, 60%, 25%)" />
    `;
  } else if (category === 'landscape') {
    innerGraphic = `
      <!-- Mountain and Sun -->
      <circle cx="${w*0.75}" cy="${h*0.3}" r="${w*0.14}" fill="#f59e0b" opacity="0.9" />
      <polygon points="0,${h} ${w*0.35},${h*0.42} ${w*0.7},${h} " fill="hsl(${bgHue}, 35%, 32%)" />
      <polygon points="${w*0.25},${h} ${w*0.65},${h*0.48} ${w},${h} " fill="hsl(${bgHue + 20}, 40%, 25%)" />
      <rect x="0" y="${h*0.78}" width="${w}" height="${h*0.22}" fill="hsl(${bgHue - 15}, 50%, 18%)" />
    `;
  } else if (category === 'vintage') {
    innerGraphic = `
      <!-- Vintage Sepia Photo effect -->
      <rect width="${w}" height="${h}" fill="#5e4831" opacity="0.25" />
      <circle cx="${w/2}" cy="${h*0.4}" r="${w*0.2}" fill="#d4b483" />
      <path d="M ${w*0.25} ${h} Q ${w/2} ${h*0.6} ${w*0.75} ${h} Z" fill="#8c6d48" />
      <line x1="0" y1="${h*0.2}" x2="${w}" y2="${h*0.21}" stroke="#3d2c18" stroke-width="1" stroke-dasharray="4,8" opacity="0.6"/>
    `;
  } else {
    innerGraphic = `
      <!-- Anime Illustration Style -->
      <circle cx="${w/2}" cy="${h*0.4}" r="${w*0.24}" fill="#fed7aa" />
      <!-- Big Eyes -->
      <ellipse cx="${w*0.4}" cy="${h*0.38}" rx="${w*0.055}" ry="${h*0.04}" fill="#6366f1" />
      <ellipse cx="${w*0.6}" cy="${h*0.38}" rx="${w*0.055}" ry="${h*0.04}" fill="#6366f1" />
      <circle cx="${w*0.38}" cy="${h*0.36}" r="${w*0.02}" fill="#fff" />
      <circle cx="${w*0.58}" cy="${h*0.36}" r="${w*0.02}" fill="#fff" />
      <!-- Anime Hair -->
      <path d="M ${w*0.22} ${h*0.42} Q ${w*0.28} ${h*0.16} ${w/2} ${h*0.14} Q ${w*0.72} ${h*0.16} ${w*0.78} ${h*0.42} L ${w*0.65} ${h*0.26} L ${w/2} ${h*0.32} L ${w*0.35} ${h*0.26} Z" fill="hsl(${bgHue}, 80%, 45%)" />
      <path d="M ${w*0.26} ${h} Q ${w/2} ${h*0.65} ${w*0.74} ${h} Z" fill="#4338ca" />
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="hsl(${bgHue}, 30%, 20%)"/>
        <stop offset="100%" stop-color="hsl(${bgHue}, 20%, 10%)"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#bg)"/>
    ${innerGraphic}
    <!-- Badge Label -->
    <rect x="12" y="12" rx="6" width="${w - 24}" height="28" fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
    <text x="${w/2}" y="30" fill="${detailColor}" font-family="system-ui, sans-serif" font-size="12" font-weight="600" text-anchor="middle">${title} • ${w}x${h}</text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function generate30SamplePhotos(): BatchItem[] {
  const sampleConfigs: Array<{ name: string; cat: 'portrait' | 'landscape' | 'vintage' | 'anime'; w: number; h: number; hue: number; color: string; size: number }> = [
    // 15 Portraits of people (as requested: "photographs of people, portraits, faces")
    { name: 'portrait_family_grandpa_1985.jpg', cat: 'portrait', w: 640, h: 800, hue: 28, color: '#fef08a', size: 142 },
    { name: 'portrait_girl_natural_light.jpg', cat: 'portrait', w: 600, h: 750, hue: 340, color: '#fbcfe8', size: 128 },
    { name: 'portrait_man_studio_lighting.jpg', cat: 'portrait', w: 720, h: 960, hue: 215, color: '#bae6fd', size: 210 },
    { name: 'portrait_bride_wedding_outdoor.jpg', cat: 'portrait', w: 800, h: 1000, hue: 45, color: '#fef3c7', size: 245 },
    { name: 'portrait_toddler_candid_smile.jpg', cat: 'portrait', w: 540, h: 720, hue: 12, color: '#fed7aa', size: 115 },
    { name: 'portrait_executive_headshot_blur.jpg', cat: 'portrait', w: 640, h: 640, hue: 220, color: '#e2e8f0', size: 130 },
    { name: 'portrait_grandmother_traditional.jpg', cat: 'portrait', w: 500, h: 650, hue: 32, color: '#fde68a', size: 98 },
    { name: 'portrait_teen_outdoor_golden_hour.jpg', cat: 'portrait', w: 700, h: 880, hue: 38, color: '#fed7aa', size: 185 },
    { name: 'portrait_elderly_couple_anniversary.jpg', cat: 'portrait', w: 800, h: 600, hue: 25, color: '#fef08a', size: 175 },
    { name: 'portrait_musician_low_light.jpg', cat: 'portrait', w: 640, h: 800, hue: 260, color: '#e9d5ff', size: 160 },
    { name: 'portrait_graduation_diploma_day.jpg', cat: 'portrait', w: 600, h: 800, hue: 200, color: '#bae6fd', size: 140 },
    { name: 'portrait_child_birthday_party.jpg', cat: 'portrait', w: 550, h: 750, hue: 350, color: '#fecdd3', size: 122 },
    { name: 'portrait_street_photographer_candid.jpg', cat: 'portrait', w: 720, h: 900, hue: 180, color: '#a7f3d0', size: 195 },
    { name: 'portrait_asian_woman_monochrome.jpg', cat: 'portrait', w: 600, h: 750, hue: 0, color: '#f1f5f9', size: 110 },
    { name: 'portrait_athlete_close_up_sweat.jpg', cat: 'portrait', w: 640, h: 850, hue: 15, color: '#fed7aa', size: 165 },

    // 5 Vintage / Low-Res archive photos
    { name: 'vintage_family_gathering_1974.jpg', cat: 'vintage', w: 480, h: 640, hue: 30, color: '#fde68a', size: 84 },
    { name: 'vintage_school_photo_sepia_scan.jpg', cat: 'vintage', w: 420, h: 560, hue: 35, color: '#fed7aa', size: 76 },
    { name: 'vintage_classic_car_blackwhite.jpg', cat: 'vintage', w: 640, h: 480, hue: 40, color: '#e5e7eb', size: 92 },
    { name: 'vintage_old_city_monument_grain.jpg', cat: 'vintage', w: 500, h: 375, hue: 28, color: '#fef08a', size: 70 },
    { name: 'vintage_baby_photo_scratched.jpg', cat: 'vintage', w: 400, h: 520, hue: 32, color: '#fef3c7', size: 68 },

    // 5 Landscape and ordinary photos
    { name: 'landscape_mountain_sunrise_fog.jpg', cat: 'landscape', w: 800, h: 600, hue: 160, color: '#6ee7b7', size: 230 },
    { name: 'landscape_sunset_beach_silhouette.jpg', cat: 'landscape', w: 840, h: 560, hue: 25, color: '#fed7aa', size: 215 },
    { name: 'landscape_forest_autumn_trail.jpg', cat: 'landscape', w: 760, h: 570, hue: 35, color: '#fde68a', size: 205 },
    { name: 'landscape_tokyo_night_cyberpunk.jpg', cat: 'landscape', w: 900, h: 600, hue: 280, color: '#f0abfc', size: 270 },
    { name: 'landscape_architecture_minimal_facade.jpg', cat: 'landscape', w: 720, h: 540, hue: 200, color: '#bae6fd', size: 180 },

    // 5 Anime and illustrations
    { name: 'anime_character_magical_girl.png', cat: 'anime', w: 600, h: 800, hue: 310, color: '#f472b6', size: 190 },
    { name: 'anime_cyber_samurai_wallpaper.png', cat: 'anime', w: 800, h: 600, hue: 195, color: '#38bdf8', size: 220 },
    { name: 'anime_fantasy_dragon_rider.png', cat: 'anime', w: 700, h: 900, hue: 260, color: '#c084fc', size: 240 },
    { name: 'anime_chibi_pet_companion.png', cat: 'anime', w: 500, h: 500, hue: 50, color: '#fde047', size: 110 },
    { name: 'anime_retro_city_pop_cover.png', cat: 'anime', w: 640, h: 640, hue: 330, color: '#fb7185', size: 175 },
  ];

  return sampleConfigs.map((cfg, index) => {
    const dataUrl = createPhotoSvgDataUrl(cfg.name, cfg.cat, cfg.w, cfg.h, cfg.hue, cfg.color);
    // Simple deterministic hash
    const hash = `hash_${cfg.name.replace(/[^a-z0-9]/gi, '_')}_${cfg.w}x${cfg.h}_${index}`;
    return {
      id: `sample-${index + 1}`,
      filename: cfg.name,
      fileSizeKb: cfg.size,
      originalWidth: cfg.w,
      originalHeight: cfg.h,
      originalDataUrl: dataUrl,
      status: 'Waiting',
      fileHash: hash,
      category: cfg.cat,
    };
  });
}
