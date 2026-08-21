import { Activity } from "../types";

// Predefined static coordinate maps for standard itinerary locations
const STATIC_LOCATIONS: Record<string, { lat: number; lng: number }> = {
  // Washington D.C.
  "capitólio dos eua (tour guiado)": { lat: 38.8899, lng: -77.0090 },
  "biblioteca do congresso (bíblia de gutenberg)": { lat: 38.8887, lng: -77.0047 },
  "suprema corte dos eua": { lat: 38.8906, lng: -77.0044 },
  "jardim botânico dos eua": { lat: 38.8880, lng: -77.0125 },
  "museu dos arquivos nacionais (national archives)": { lat: 38.8929, lng: -77.0230 },
  "penn quarter / chinatown": { lat: 38.8994, lng: -77.0221 },
  "jantar de boas-vindas em penn quarter / chinatown": { lat: 38.8994, lng: -77.0221 },
  "monumento a washington (obelisco)": { lat: 38.8895, lng: -77.0353 },
  "memorial martin luther king, jr. & tidal basin": { lat: 38.8862, lng: -77.0442 },
  "memorial do lincoln e espelho d'água": { lat: 38.8893, lng: -77.0502 },
  "almoço no the wharf washington": { lat: 38.8778, lng: -77.0226 },
  "the wharf washington": { lat: 38.8778, lng: -77.0226 },
  "smithsonian museu nacional de história natural": { lat: 38.8913, lng: -77.0261 },
  "passeio de fim de tarde em georgetown & jantar": { lat: 38.9097, lng: -77.0654 },
  "georgetown": { lat: 38.9097, lng: -77.0654 },
  "smithsonian museu nacional do ar e espaço": { lat: 38.8882, lng: -77.0199 },
  "fachada da casa branca (the white house)": { lat: 38.8977, lng: -77.0365 },
  "casa branca": { lat: 38.8977, lng: -77.0365 },
  "cemitério nacional de arlington & memorial iwo jima": { lat: 38.8776, lng: -77.0722 },
  "memorial thomas jefferson": { lat: 38.8814, lng: -77.0365 },
  "compras & jantar no pentagon city mall": { lat: 38.8617, lng: -77.0592 },
  "pentagon city mall": { lat: 38.8617, lng: -77.0592 },

  // New York City
  "hotel moca nyc": { lat: 40.7621, lng: -73.8302 },
  "check-in hotel moca nyc": { lat: 40.7621, lng: -73.8302 },
  "check-in hotel moca nyc (2ª estada)": { lat: 40.7621, lng: -73.8302 },
  "9/11 memorial": { lat: 40.7115, lng: -74.0125 },
  "9/11 memorial & museum": { lat: 40.7115, lng: -74.0125 },
  "oculus wtc": { lat: 40.7118, lng: -74.0113 },
  "zuccotti park": { lat: 40.7093, lng: -74.0113 },
  "almoço próximo ao wtc": { lat: 40.7093, lng: -74.0113 },
  "almoço no financial district": { lat: 40.7042, lng: -74.0101 },
  "macy's 4th of july fireworks preview": { lat: 40.7410, lng: -73.9575 },
  "manha no central park (strawberry fields)": { lat: 40.7758, lng: -73.9749 },
  "manhã no central park (strawberry fields)": { lat: 40.7758, lng: -73.9749 },
  "almoço no shake shack (midtown)": { lat: 40.7585, lng: -73.9882 },
  "shake shack (midtown)": { lat: 40.7585, lng: -73.9882 },
  "visita ao moma (museu de arte moderna)": { lat: 40.7614, lng: -73.9776 },
  "times square e passeio noturno broadway": { lat: 40.7580, lng: -73.9855 },
  "embarque de balsa para estátua da liberdade": { lat: 40.7033, lng: -74.0170 },
  "almoço no financial district (stone street)": { lat: 40.7042, lng: -74.0101 },
  "wall street & touro de bronze": { lat: 40.7056, lng: -74.0134 },
  "9/11 memorial plaza & oculus de calatrava": { lat: 40.7115, lng: -74.0115 },
  "high line park (parque suspenso)": { lat: 40.7480, lng: -74.0048 },
  "chelsea market & little island": { lat: 40.7420, lng: -74.0062 },
  "little island (pier 55)": { lat: 40.7460, lng: -74.0100 },
  "vessel & hudson yards": { lat: 40.7538, lng: -74.0018 },
  "caminhada pela 5ª avenida & st. patrick's": { lat: 40.7586, lng: -73.9763 },
  "observatório top of the rock": { lat: 40.7591, lng: -73.9794 },
  "visita à new york public library & bryant park": { lat: 40.7532, lng: -73.9822 },
  "travessia a pé da brooklyn bridge": { lat: 40.7061, lng: -73.9969 },
  "dumbo (foto icônica washington st)": { lat: 40.7033, lng: -73.9897 },
  "almoço na grimaldi's pizza ou juliana's": { lat: 40.7026, lng: -73.9935 },
  "caminhada pelo brooklyn bridge park": { lat: 40.7022, lng: -73.9965 },
  "grand central terminal (estação histórica)": { lat: 40.7527, lng: -73.9772 },
  "chrysler building (área externa)": { lat: 40.7516, lng: -73.9753 },
  "observatório moderno summit one vanderbilt": { lat: 40.7530, lng: -73.9785 },
  "parque gantry plaza state park (long island city)": { lat: 40.7456, lng: -73.9585 },
  "teleférico de roosevelt island tramway": { lat: 40.7612, lng: -73.9641 },
  "compras de eletrônicos e lembranças na b&h photo video": { lat: 40.7531, lng: -73.9965 },
  "museu de arte metropolitan (the met)": { lat: 40.7794, lng: -73.9632 },
  "reservatório de jacqueline kennedy onassis": { lat: 40.7870, lng: -73.9626 },
  "central park zoo": { lat: 40.7678, lng: -73.9718 },
  "visita ao navio-museu intrepid sea, air & space": { lat: 40.7645, lng: -74.0008 },

  // Philadelphia
  "sino do sino da liberdade (liberty bell pavilion)": { lat: 39.9496, lng: -75.1503 },
  "independence hall vista externa": { lat: 39.9489, lng: -75.1500 },
  "estátua e escadaria do rocky (philly museum of art)": { lat: 39.9654, lng: -75.1800 },
  "almoço no reading terminal market": { lat: 39.9532, lng: -75.1588 },
  "prisão histórica eastern state penitentiary": { lat: 39.9683, lng: -75.1727 },
  "caminhada histórica pela elfreth's alley": { lat: 39.9528, lng: -75.1425 },

  // Atlantic City
  "caminhada clássica pelo boardwalk": { lat: 39.3564, lng: -74.4372 },
  "parque de diversões no histórico steel pier": { lat: 39.3575, lng: -74.4178 },
  "subida ao farol absecon": { lat: 39.3661, lng: -74.4137 },
  "tarde de compras nos outlets tanger": { lat: 39.3601, lng: -74.4365 },

  // Chantilly
  "steven f. udvar-hazy center (anexo smithsonian)": { lat: 38.9109, lng: -77.4442 }
};

const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  "washington": { lat: 38.9072, lng: -77.0369 },
  "new york": { lat: 40.7128, lng: -74.0060 },
  "nyc": { lat: 40.7128, lng: -74.0060 },
  "philadelphia": { lat: 39.9526, lng: -75.1652 },
  "philly": { lat: 39.9526, lng: -75.1652 },
  "atlantic city": { lat: 39.3643, lng: -74.4229 },
  "chantilly": { lat: 38.8943, lng: -77.4311 },
  "boston": { lat: 42.3601, lng: -71.0589 },
  "miami": { lat: 25.7617, lng: -80.1918 }
};

// Simple runtime in-memory cache for Nominatim query results
const GEOLOCATION_CACHE: Record<string, { lat: number; lng: number }> = {};

// Save geolocations inside localStorage to persist across navigation actions
const loadCachedCoords = () => {
  try {
    const serialized = localStorage.getItem("travel_planner_geocodes");
    if (serialized) {
      const parsed = JSON.parse(serialized);
      Object.assign(GEOLOCATION_CACHE, parsed);
    }
  } catch (err) {
    console.warn("Could not read geocoding cache from localStorage:", err);
  }
};

const saveCachedCoords = () => {
  try {
    localStorage.setItem("travel_planner_geocodes", JSON.stringify(GEOLOCATION_CACHE));
  } catch (err) {
    console.warn("Could not write geocoding cache to localStorage:", err);
  }
};

// Auto-run once on module import
if (typeof window !== "undefined") {
  loadCachedCoords();
}

/**
 * Strips emojis, icon characters, parentheticals, and common Portuguese action words.
 */
function cleanQueryString(rawStr: string): string {
  if (!rawStr) return "";
  
  // Remove emojis and symbols
  let str = rawStr.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, '').trim();
  
  // Remove parentheticals "(...)"
  str = str.replace(/\([^)]*\)/g, '').trim();

  // Remove common Portuguese prefixed actions/verbs
  const prefixes = [
    /^\s*check-in\s+(?:no\s+|na\s+|em\s+)?/i,
    /^\s*check-out\s+(?:no\s+|na\s+|em\s+)?/i,
    /^\s*almoço\s+(?:no\s+|na\s+|em\s+|próximo\s+ao\s+|próximo\s+à\s+|próximo\s+a\s+|pròximo\s+ao\s+)?/i,
    /^\s*jantar\s+(?:no\s+|na\s+|em\s+|de\s+boas-vindas\s+em\s+)?/i,
    /^\s*visita\s+(?:ao\s+|à\s+|na\s+|no\s+|em\s+|do\s+|da\s+)?/i,
    /^\s*manhã\s+(?:no\s+|na\s+|em\s+)?/i,
    /^\s*tarde\s+(?:no\s+|na\s+|em\s+|de\s+compras\s+(?:no|nos|na|nas)?\s+)?/i,
    /^\s*caminhada\s+(?:clássica\s+pelo\s+|clássica\s+pela\s+|pela\s+|pelo\s+|em\s+)?/i,
    /^\s*passeio\s+(?:de\s+fim\s+de\s+tarde\s+em\s+|de\s+fim\s+de\s+tarde\s+no\s+|noturno\s+pelo\s+|noturno\s+na\s+|noturno\s+|pelo\s+|na\s+|em\s+)?/i,
    /^\s*compras\s+(?:&\s+jantar\s+no\s+|no\s+|na\s+|em\s+)?/i,
    /^\s*tour\s+guiado\s+(?:no\s+|na\s+|pelo\s+)?/i,
    /^\s*embarque\s+de\s+balsa\s+(?:para\s+)?/i,
    /^\s*travessia\s+a\s+pé\s+(?:da\s+|do\s+)?/i,
    /^\s*travessia\s+(?:da\s+|do\s+)?/i,
    /^\s*observatório\s+(?:moderno\s+)?/i,
    /^\s*parque\s+/i,
    /^\s*hotel\s+/i,
    /^\s*teleférico\s+de\s+/i,
    /^\s*subida\s+ao\s+/i,
    /^\s*lanchonetes\s*\/\s*food\s+court\s+/i,
    /^\s*lanchonete\s+/i,
    /^\s*restaurante\s+/i,
    /^\s*café\s+/i,
    /^\s*bar\s+/i,
    /^\s*ponto\s+de\s+encontro\s+/i,
    /^\s*mirante\s+/i,
    /^\s*vista\s+para\s+/i,
    /^\s*vista\s+/i
  ];

  for (const pattern of prefixes) {
    str = str.replace(pattern, '');
  }

  // Remove starting/trailing non-alphanumeric symbols
  str = str.replace(/^[^a-zA-Z0-9'\s]+/, '').trim();
  
  // Normalize double whitespaces
  str = str.replace(/\s+/g, ' ').trim();

  return str;
}

/**
 * Resolves latitude and longitude coordinates for a given location / activity.
 */
export async function getCoordsForLocation(
  query: string,
  cityName: string,
  isOffline: boolean = false
): Promise<{ lat: number; lng: number } | null> {
  const normalizedCity = cityName.toLowerCase().trim();
  
  // Try to parse explicit decimal lat/long coordinates (e.g. "40.7621, -73.8302" or enclosed in text)
  const coordMatch = query.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }

  const cleanedQuery = cleanQueryString(query);

  if (!cleanedQuery) {
    return getCityCenter(cityName);
  }

  // 1. Check all exact/subpart static dictionary matches
  const parts = query.split(/—|–|-/);
  for (const part of parts) {
    const rawPart = part.toLowerCase().trim();
    if (STATIC_LOCATIONS[rawPart]) {
      return STATIC_LOCATIONS[rawPart];
    }
    const cleanSub = cleanQueryString(part).toLowerCase().trim();
    if (STATIC_LOCATIONS[cleanSub]) {
      return STATIC_LOCATIONS[cleanSub];
    }
    // Look up within the dictionary
    for (const key of Object.keys(STATIC_LOCATIONS)) {
      if (cleanSub && (key === cleanSub || key.includes(cleanSub) || cleanSub.includes(key))) {
        return STATIC_LOCATIONS[key];
      }
    }
  }

  // Review the full clean query against STATIC_LOCATIONS
  const fullCleanLower = cleanedQuery.toLowerCase();
  for (const key of Object.keys(STATIC_LOCATIONS)) {
    if (key === fullCleanLower || key.includes(fullCleanLower) || fullCleanLower.includes(key)) {
      return STATIC_LOCATIONS[key];
    }
  }

  // 2. Check cached values (ignore if cache has a city center fallback, to allow recalculation)
  const cacheKey = `${fullCleanLower}::${normalizedCity}`;
  if (GEOLOCATION_CACHE[cacheKey]) {
    const cached = GEOLOCATION_CACHE[cacheKey];
    const cityCenter = getCityCenter(cityName);
    if (Math.abs(cached.lat - cityCenter.lat) > 0.0001 || Math.abs(cached.lng - cityCenter.lng) > 0.0001) {
      return cached;
    }
  }

  if (isOffline) {
    return getCityCenter(cityName);
  }

  // 3. Build lookup candidates
  const candidates: string[] = [];
  const cleanParts = parts.map(p => cleanQueryString(p)).filter(p => p.length >= 2);
  
  // Address pattern detection: e.g. "507 W 181st St"
  const hasDigitsAndSt = (s: string) => /\d{1,5}\s+[a-zA-Z]/.test(s) || (/(?:st|ave|rd|road|street|avenida|praça|plaza|square)/i.test(s) && /\d+/.test(s));
  
  const addressPart = cleanParts.find(p => hasDigitsAndSt(p));
  if (addressPart) {
    candidates.push(addressPart);
  }

  if (cleanParts[0] && cleanParts[0] !== addressPart) {
    candidates.push(cleanParts[0]);
  }

  cleanParts.forEach((p, idx) => {
    if (p !== addressPart && idx > 0 && !candidates.includes(p)) {
      candidates.push(p);
    }
  });

  const fullCleaned = cleanQueryString(query);
  if (fullCleaned && !candidates.includes(fullCleaned)) {
    candidates.push(fullCleaned);
  }

  // 4. Run through search terms sequentially on OpenStreetMap Nominatim
  for (const term of candidates) {
    const fullQuery = `${term}, ${cityName}`;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullQuery)}&limit=1`,
        {
          headers: {
            "Accept": "application/json",
            "User-Agent": "TravelPlannerAgent/1.0"
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const coords = {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
          };
          
          // Store inside persistent local caches
          GEOLOCATION_CACHE[cacheKey] = coords;
          saveCachedCoords();
          return coords;
        }
      }
    } catch (err) {
      console.warn(`Dynamic geocoding failed for: "${fullQuery}"`, err);
    }
  }

  // 5. General fallback search in pre-defined database
  for (const key of Object.keys(STATIC_LOCATIONS)) {
    if (fullCleanLower.includes(key) || key.includes(fullCleanLower)) {
      return STATIC_LOCATIONS[key];
    }
  }

  // Absolute fallback to center city marker
  return getCityCenter(cityName);
}

/**
 * Returns clean coordinates for a city center.
 */
export function getCityCenter(cityName: string): { lat: number; lng: number } {
  const norm = cityName.toLowerCase().trim();
  for (const key of Object.keys(CITY_CENTERS)) {
    if (norm.includes(key) || key.includes(norm)) {
      return CITY_CENTERS[key];
    }
  }
  return { lat: 38.9072, lng: -77.0369 }; // Washington DC default fallback
}
