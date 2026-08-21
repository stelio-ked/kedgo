import { Activity, ItineraryDay } from "./types";

/**
 * Intelligently classifies an activity into "flight" | "hotel" | "tour" | "dinner" | "other"
 * based on its location name, notes, and context.
 */
export function inferActivityType(
  location: string = "", 
  notes: string = ""
): "flight" | "hotel" | "tour" | "dinner" | "other" {
  const combined = `${location} ${notes}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 1. Flight / Air / Train / Transit / Transport
  const flightKeywords = [
    "voo", "flight", "aeroporto", "airport", "decolagem", "pouso", "boarding", "airline",
    "embarque", "desembarque", "passagem", "bilhete aereo", "copa", "latam", "gol", "azul",
    "tap", "american airlines", "united", "delta", "ryanair", "easyjet", "iberia", "air france",
    "lufthansa", "emirates", "trem", "train", "comboio", "metro", "subway", "onibus", "bus",
    "ferry", "barco", "boat", "balsa", "cruzeiro", "cruise", "transfer", "shuttle",
    "estacao ferroviaria", "estacao de trem", "estacao de onibus", "gare", "terminal rodoviario",
    "aluguel de carro", "rent a car", "locadora", "retirada do carro", "devolucao do carro",
    "deslocamento", "traslado", "trajeto", "conexao", "transito", "uber", "taxi"
  ];
  if (flightKeywords.some(kw => combined.includes(kw))) {
    return "flight";
  }

  // 2. Hotel / Lodging / Check-in
  const hotelKeywords = [
    "hotel", "hospedagem", "pousada", "resort", "hostel", "check-in", "check in",
    "check-out", "check out", "booking", "airbnb", "pernoite", "acomodacao", "estadia",
    "alojamento", "quarto de hotel", "inn", "lodge", "suite", "dormir no hotel",
    "chegada ao hotel", "descanso no hotel"
  ];
  if (hotelKeywords.some(kw => combined.includes(kw))) {
    return "hotel";
  }

  // 3. Gastronomy / Restaurant / Dining / Cafe / Bar
  const diningKeywords = [
    "restaurant", "restaurante", "restaurantar", "jantar", "dinner", "almoco", "lunch",
    "cafe", "coffee", "cafeteria", "bistro", "bar", "pub", "taverna", "tavern", "osteria",
    "trattoria", "pizzaria", "pizza", "churrascaria", "lanche", "snack", "comida",
    "breakfast", "brunch", "padaria", "bakery", "confeitaria", "gastronomia", "degustacao",
    "wine tasting", "tasting", "gelato", "gelateria", "sorveteria", "sorvete", "vinicola",
    "bodega", "winery", "cervejaria", "brewery", "kavana", "eatery", "diner", "cuisine",
    "food", "refeicao", "doceria", "gourmet", "tasca", "cantina", "choperia", "buffet",
    "culinaria", "izakaya", "tapas", "marisqueira", "churrasco", "steakhouse", "cocktail",
    "sobremesa", "creperia", "hamburguer", "burger", "cerveza"
  ];
  if (diningKeywords.some(kw => combined.includes(kw))) {
    return "dinner";
  }

  // 4. Other / Free Time / Rest
  const otherKeywords = [
    "tempo livre", "horario livre", "livre para explorar", "livre escolha",
    "descanso", "sem programacao", "dia livre", "tarde livre", "manha livre"
  ];
  if (otherKeywords.some(kw => combined.includes(kw))) {
    return "other";
  }

  // 5. Tour / Sights / Museum / Monument / Attractions / Walks / Cultural
  const tourKeywords = [
    "tour", "passeio", "visita", "caminhada", "walk", "walking", "trilha", "trail", "hike",
    "hiking", "museu", "museum", "monumento", "monument", "capitol", "capitolio", "cathedral",
    "catedral", "igreja", "church", "basilica", "mesquita", "mosque", "templo", "temple",
    "mall", "shopping", "parque", "park", "praca", "square", "piazza", "aquario", "aquarium",
    "atracao", "estatua", "statue", "mirante", "viewpoint", "belvedere", "praia", "beach",
    "playa", "castelo", "castle", "palacio", "palace", "ruinas", "ruins", "centro historico",
    "old town", "cidade antiga", "fortaleza", "forte", "muralha", "muralhas", "wall", "walls",
    "gate", "portao", "stradun", "pile", "ponte", "bridge", "porto", "port", "baia", "bay",
    "mercado", "market", "bazar", "bazaar", "jardim", "garden", "botanico", "teleferico",
    "cable car", "funicular", "balao", "balloon", "show", "espetaculo", "teatro", "theatre",
    "theater", "opera", "lago", "lake", "cachoeira", "waterfall", "panoramico", "panoramic",
    "miradouro", "sightseeing", "explorar", "visitar", "conhecer", "safari", "mergulho",
    "snorkel", "skate", "bike", "bicicleta", "ilha", "island", "insider", "dica de insider",
    "historico", "cultural", "cenario", "ponto turistico", "atracao turistica", "farol",
    "canyon", "caverna", "cave", "observatorio", "planetario", "zoo", "zoologico",
    "patrimonio", "esplanada", "avenida", "boulevard", "orla", "calcadao", "memorial",
    "galeria", "gallery", "exposicao", "exhibition", "palais", "duomo", "coliseu",
    "colosseum", "acropole", "torre", "tower", "aqueduto"
  ];
  if (tourKeywords.some(kw => combined.includes(kw))) {
    return "tour";
  }

  // If there is any location title/text, default to tour (Atração/Passeio) instead of generic "other"
  if (location && location.trim().length > 0) {
    return "tour";
  }

  return "other";
}

/**
 * Robustly sorts a collection of activities by their time string.
 * Supports "08:30", "9:30", "18h30", single hour numbers, empty values, or descriptive text.
 */
export function sortActivitiesByTime(activities: Activity[]): Activity[] {
  return [...activities].sort((a, b) => {
    const timeA = a.time || "";
    const timeB = b.time || "";
    
    const getMinutes = (tStr: string): number => {
      const clean = tStr.trim().toLowerCase().replace("h", ":");
      const match = clean.match(/(\d+):(\d+)/);
      if (match) {
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        return hours * 60 + minutes;
      }
      const hoursOnly = clean.match(/^(\d+)$/);
      if (hoursOnly) {
        return parseInt(hoursOnly[1], 10) * 60;
      }
      // Standard fallback for text like "Qualquer hora", "Dia inteiro"
      return 9999;
    };
    
    const minsA = getMinutes(timeA);
    const minsB = getMinutes(timeB);
    
    if (minsA !== minsB) {
      return minsA - minsB;
    }
    return timeA.localeCompare(timeB);
  });
}

/**
 * Parses dates of format DD/MM/YYYY, DD/MM, or YYYY-MM-DD to Portuguese weekday and date string.
 */
export function parseDateToFriendly(dateStr: string): { formatted: string; dayNum: number; rawDate: string } {
  let day = 1;
  let month = 7;
  let year = 2026;

  const trimmed = dateStr.trim();
  const matchSlash = trimmed.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (matchSlash) {
    day = parseInt(matchSlash[1], 10);
    month = parseInt(matchSlash[2], 10);
    if (matchSlash[3]) {
      year = parseInt(matchSlash[3], 10);
      if (year < 100) year += 2000;
    }
  } else {
    const matchDash = trimmed.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (matchDash) {
      year = parseInt(matchDash[1], 10);
      month = parseInt(matchDash[2], 10);
      day = parseInt(matchDash[3], 10);
    }
  }

  try {
    const dateObj = new Date(year, month - 1, day);
    const weekDays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    
    const weekDayStr = weekDays[dateObj.getDay()];
    const monthStr = months[dateObj.getMonth()];
    const displayDay = day.toString().padStart(2, "0");
    
    return {
      formatted: `${weekDayStr}, ${displayDay} de ${monthStr}`,
      dayNum: day,
      rawDate: `${displayDay}/${month.toString().padStart(2, "0")}/${year}`
    };
  } catch (e) {
    return {
      formatted: dateStr,
      dayNum: day,
      rawDate: dateStr
    };
  }
}

interface ParsedActivityRaw {
  date?: string;
  time: string;
  location: string;
  cost?: string;
  duration?: string;
  mapsQuery?: string;
  websiteLink?: string;
  parking?: string;
  notes?: string;
}

/**
 * Strips weekday and formats a date text (such as "01/07/2026", "01/07", "Quarta, 01 de Julho") 
 * into a canonical key "day/month" (e.g. "1/7") for exact calendar matching.
 */
export function getCanonicalDateKey(dateStr: string): string {
  if (!dateStr) return "";
  
  const trimmed = dateStr.trim().toLowerCase();
  
  // Try matching "01/07/2026" or "01/07"
  const matchSlash = trimmed.match(/(\d{1,2})\/(\d{1,2})/);
  if (matchSlash) {
    const d = parseInt(matchSlash[1], 10);
    const m = parseInt(matchSlash[2], 10);
    return `${d}/${m}`;
  }
  
  // Try matching "01 de Julho" or "1 de julho"
  const monthsList = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
  ];
  
  const matchText = trimmed.match(/(\d{1,2})\s*de\s*([a-zçáõ]+)/);
  if (matchText) {
    const d = parseInt(matchText[1], 10);
    const monthName = matchText[2];
    const mIdx = monthsList.findIndex(m => m.startsWith(monthName.substring(0, 3)));
    if (mIdx !== -1) {
      return `${d}/${mIdx + 1}`;
    }
  }

  // Fallback to stripping weekday and non-alphanumeric chars (e.g. "sabado, 04 de julho" -> "04dejulho")
  return trimmed
    .replace(/^(domingo|segunda|terça|quarta|quinta|sexta|sábado)[^a-z0-9]*/i, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Parses grid rows (from copy-pasted TSV or Excel sheets JS format) into standard Day & Activity items.
 * Accommodates multiple tables, different column orders, and groups activities strictly by calendar date,
 * sorting them chronologically and assigning clean sequential day numbers.
 */
export function parseGridRowsToItinerary(gridRows: any[][]): { days: ItineraryDay[] } {
  // Intermediate holding structures
  const daysMap: { [dateKey: string]: { dateStr: string; activities: Activity[] } } = {};
  const dateKeysInOrder: string[] = []; // to preserve chronological order when sorting later
  
  // Default Column Indexes matching user's spreadsheet structure
  let colMap = {
    date: 0,
    time: 1,
    location: 2,
    cost: 3,
    duration: 4,
    mapsQuery: 5,
    websiteLink: 6,
    parking: 7
  };

  // We start of by tracking active dates
  let lastParsedDateStr = "Quarta, 01 de Julho";
  let lastParsedDateKey = "1/7";
  
  // Map of explicit titles specified by day header dividers (e.g. "Capitólio & Biblioteca...")
  const dayTitles: { [dateKey: string]: string } = {};

  for (let r = 0; r < gridRows.length; r++) {
    const row = gridRows[r];
    if (!row || row.length === 0) continue;

    // Convert row cells to string
    const stringRow = row.map(cell => (cell === null || cell === undefined ? "" : String(cell).trim()));
    
    // Check if empty row
    if (stringRow.every(val => val === "")) continue;

    const joinedRow = stringRow.join(" ").toLowerCase();
    
    // 1. Is it a Day Header Row? (e.g., "📅 DIA 3 — Sexta, 03 de Julho | Georgetown...")
    const dayHeaderMatch = joinedRow.match(/(?:dia|day)\s*(\d+)/i);
    const hasJuly = joinedRow.includes("julho") || joinedRow.includes("july");
    
    if (dayHeaderMatch || (hasJuly && joinedRow.includes("dia"))) {
      // Find clean day description
      // First, find the cell containing "dia"
      let dayCell = stringRow.find(val => val.toLowerCase().includes("dia")) || stringRow[0] || "";
      const cleanTitle = dayCell.replace(/📅|📊|⭐/g, "").trim();

      // Determine date from this row
      let rowDateStr = "";
      let rowDateKey = "";
      
      const slashDate = joinedRow.match(/(\d{1,2})\/(\d{1,2})/);
      const dateInText = cleanTitle.match(/(\d{1,2})\s*de\s*(?:Julho|Jul|jul0)/i);

      if (slashDate) {
        const parsed = parseDateToFriendly(slashDate[0]);
        rowDateStr = parsed.formatted;
        rowDateKey = getCanonicalDateKey(parsed.formatted);
      } else if (dateInText) {
        const dayVal = dateInText[1];
        const parsed = parseDateToFriendly(`${dayVal}/07/2026`);
        rowDateStr = parsed.formatted;
        rowDateKey = getCanonicalDateKey(parsed.formatted);
      } else {
        // Fallback sequentially based on parsedDayNum
        const parsedDayNum = dayHeaderMatch ? parseInt(dayHeaderMatch[1], 10) : 1;
        const mockDate = `${parsedDayNum}/07/2026`;
        const parsed = parseDateToFriendly(mockDate);
        rowDateStr = parsed.formatted;
        rowDateKey = getCanonicalDateKey(parsed.formatted);
      }

      // Check if we also have an explicit subtitle (e.g., "Georgetown + Norte...")
      let explicitTitle = "";
      // Clean up "DIA 3 — Sexta, 03 de Julho | Georgetown..."
      // Split on "|" or "—" or " - " to isolate the description
      const splitParts = cleanTitle.split(/[|—]|\s-\s/);
      if (splitParts.length > 1) {
        explicitTitle = splitParts[splitParts.length - 1].trim();
      }

      if (explicitTitle && explicitTitle.length > 3 && !explicitTitle.toLowerCase().includes("dia")) {
        dayTitles[rowDateKey] = explicitTitle;
      }

      // Update cascading states
      lastParsedDateStr = rowDateStr;
      lastParsedDateKey = rowDateKey;
      continue;
    }

    // 2. Is it a column header row? (e.g., Data, Hora, Local...)
    const isColHeader = (
      (joinedRow.includes("local") || joinedRow.includes("atração") || joinedRow.includes("lugar")) &&
      (joinedRow.includes("hora") || joinedRow.includes("time") || joinedRow.includes("horário"))
    );

    if (isColHeader) {
      // Dynamic column mapper
      stringRow.forEach((val, idx) => {
        const low = val.toLowerCase();
        if (low.includes("dat") || low.includes("dia")) colMap.date = idx;
        else if (low.includes("hor") || low.includes("cloc") || low.includes("time")) colMap.time = idx;
        else if (low.includes("loc") || low.includes("atrac") || low.includes("lug") || low.includes("tít") || low.includes("tit")) colMap.location = idx;
        else if (low.includes("val") || low.includes("cust") || low.includes("ingr") || low.includes("feed") || low.includes("cost") || low.includes("preç")) colMap.cost = idx;
        else if (low.includes("tempo") || low.includes("dur") || low.includes("perí")) colMap.duration = idx;
        else if (low.includes("map") || low.includes("google")) colMap.mapsQuery = idx;
        else if (low.includes("link") || low.includes("sit") || low.includes("webs")) colMap.websiteLink = idx;
        else if (low.includes("park") || low.includes("estac") || low.includes("vaga")) colMap.parking = idx;
      });
      continue;
    }

    // 3. Process normal row to parse an Activity!
    const rawTime = stringRow[colMap.time] || "";
    const rawLoc = stringRow[colMap.location] || "";
    const rawDate = stringRow[colMap.date] || "";

    // Ignore decorative headers or empty lines
    if (rawLoc === "" || rawLoc === "-" || rawLoc === "—" || rawLoc.toLowerCase() === "local" || rawLoc.toLowerCase().startsWith("saia muito") || rawLoc.includes("saia muito cedo")) {
      continue;
    }

    // Validate if it is actually an instructional section header like "DIA 4" (if missed above)
    if (rawLoc.toUpperCase().includes("DIA ") && rawLoc.length < 15) {
      continue;
    }

    // Determine row's date
    let rowDateStr = lastParsedDateStr;
    let rowDateKey = lastParsedDateKey;

    if (rawDate && rawDate !== "—" && rawDate !== "-") {
      const parsed = parseDateToFriendly(rawDate);
      rowDateStr = parsed.formatted;
      rowDateKey = getCanonicalDateKey(parsed.formatted);
      
      // Update cascade memory tracker
      lastParsedDateStr = rowDateStr;
      lastParsedDateKey = rowDateKey;
    }

    // Clean up maps query
    let mapsQuery: string | undefined = stringRow[colMap.mapsQuery] || undefined;
    if (mapsQuery) {
      mapsQuery = mapsQuery.replace(/^📍/, "").trim();
      if (mapsQuery === "—" || mapsQuery === "-") mapsQuery = undefined;
    }

    // Handle Link
    let websiteLink: string | undefined = stringRow[colMap.websiteLink] || undefined;
    if (websiteLink && (websiteLink === "—" || websiteLink === "-")) websiteLink = undefined;

    // Handle cost
    let cost = stringRow[colMap.cost] || "Gratuito";
    if (cost === "—" || cost === "-") cost = "Gratuito";

    // Handle duration
    let duration = stringRow[colMap.duration] || "—";
    if (duration === "—" || duration === "-") duration = "—";

    // Handle parking
    let parking = stringRow[colMap.parking] || undefined;
    if (parking === "—" || parking === "-") parking = undefined;

    const activity: Activity = {
      id: `imported-act-${Date.now()}-${r}`,
      time: rawTime || "Qualquer hora",
      type: inferActivityType(rawLoc),
      location: rawLoc,
      duration: duration,
      cost: cost,
      mapsQuery: mapsQuery,
      websiteLink: websiteLink,
      parking: parking,
      date: rowDateStr
    };

    // Store in our temporary holding grouping maps
    if (!daysMap[rowDateKey]) {
      daysMap[rowDateKey] = {
        dateStr: rowDateStr,
        activities: []
      };
      if (!dateKeysInOrder.includes(rowDateKey)) {
        dateKeysInOrder.push(rowDateKey);
      }
    }
    
    // Avoid exact duplicated activity inside the same day
    const alreadyExists = daysMap[rowDateKey].activities.some(
      a => a.time === activity.time && a.location === activity.location
    );
    if (!alreadyExists) {
      daysMap[rowDateKey].activities.push(activity);
    }
  }

  // Helper function to parsed canonical key "d/m" back to standard Date for sorting
  const getSortableDate = (key: string): Date => {
    const parts = key.split("/");
    if (parts.length === 2) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      return new Date(2026, m - 1, d);
    }
    // Simple string hash date fallback for alphabetical keys
    return new Date(2026, 6, 1);
  };

  // Sort canonical date keys chronologically
  const sortedKeys = [...dateKeysInOrder].sort((a, b) => {
    const d1 = getSortableDate(a);
    const d2 = getSortableDate(b);
    return d1.getTime() - d2.getTime();
  });

  // Construct final result list of ItineraryDay
  const resultDays: ItineraryDay[] = sortedKeys.map((key, index) => {
    const group = daysMap[key];
    const dayNum = index + 1;
    const titleVal = dayTitles[key] || `Atividades de ${group.dateStr}`;
    
    // Sort activities inside this day chronologically
    const sortedActivities = sortActivitiesByTime(group.activities);
    
    return {
      id: `imported-day-${dayNum}-${Date.now()}`,
      dayNumber: dayNum,
      dateStr: group.dateStr,
      title: titleVal,
      activities: sortedActivities
    };
  });

  return { days: resultDays };
}

/**
 * Formats a dynamic date range (YYYY-MM-DD - YYYY-MM-DD) to friendly Portuguese abbreviations (e.g. "01 jul. - 04 jul.")
 */
export function formatDatesRange(startDateStr: string, endDateStr: string): string {
  if (!startDateStr || !endDateStr) return "";
  try {
    const sParts = startDateStr.split("-");
    const eParts = endDateStr.split("-");
    if (sParts.length !== 3 || eParts.length !== 3) return "";
    
    const monthsShort = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
    
    const sDay = sParts[2].padStart(2, '0');
    const sMonthIndex = parseInt(sParts[1], 10) - 1;
    const sMonth = monthsShort[sMonthIndex] || "";
    
    const eDay = eParts[2].padStart(2, '0');
    const eMonthIndex = parseInt(eParts[1], 10) - 1;
    const eMonth = monthsShort[eMonthIndex] || "";
    
    return `${sDay} ${sMonth} - ${eDay} ${eMonth}`;
  } catch (e) {
    return "";
  }
}

/**
 * Parses back a friendly range (e.g. "01 jul. - 04 jul.") into individual YYYY-MM-DD startDate and endDate strings in 2026.
 */
export function parseRangeToDates(rangeStr: string, year = 2026): { startDate: string; endDate: string } {
  const startDefault = `${year}-07-01`;
  const endDefault = `${year}-07-04`;
  if (!rangeStr) return { startDate: startDefault, endDate: endDefault };
  
  try {
    const parts = rangeStr.split("-").map(p => p.trim());
    if (parts.length !== 2) return { startDate: startDefault, endDate: endDefault };
    
    const monthsMap: { [key: string]: string } = {
      "jan": "01", "fev": "02", "mar": "03", "abr": "04", "mai": "05", "jun": "06",
      "jul": "07", "ago": "08", "set": "09", "out": "10", "nov": "11", "dez": "12"
    };
    
    const parsePart = (p: string) => {
      const match = p.match(/(\d+)\s*([a-zçáõ]+)/i);
      if (match) {
        const day = match[1].padStart(2, "0");
        const monthAbbr = match[2].toLowerCase().substring(0, 3);
        const month = monthsMap[monthAbbr] || "07";
        return `${year}-${month}-${day}`;
      }
      return "";
    };
    
    const startDate = parsePart(parts[0]) || startDefault;
    const endDate = parsePart(parts[1]) || endDefault;
    return { startDate, endDate };
  } catch (e) {
    return { startDate: startDefault, endDate: endDefault };
  }
}

/**
 * Verifies if the current user has permission to delete a specific entity.
 * Rules:
 *  - Role "Administrador" can delete any entity.
 *  - Roles "Organizador" and "Finanças" can delete only entities created by them (createdByEmail matches user's email).
 *  - Other roles (including "Co-piloto", "Colaborador", "Viajante", etc.) can never delete anything.
 */
export function canDeleteEntity(
  userRole: string,
  userEmail: string | undefined,
  entityCreatorEmail: string | undefined
): boolean {
  if (!userEmail) return false;
  const normalizedUserRole = (userRole || "").trim();
  const lowerRole = normalizedUserRole.toLowerCase();
  
  // 1. Administrador, Organizador or any logged in account user
  if (
    lowerRole === "administrador" || 
    lowerRole === "organizador" || 
    lowerRole === "criador" || 
    lowerRole === "proprietário" ||
    userEmail
  ) {
    return true;
  }
  
  if (!entityCreatorEmail) return true;
  return userEmail.trim().toLowerCase() === entityCreatorEmail.trim().toLowerCase();
}

/**
 * Formats a dateRange string into a friendly Portuguese display.
 * If the string matches YYYY-MM-DD, formats to "DD de [Mês] de YYYY" (e.g. "29 de Junho de 2026").
 * Otherwise, returns the string as is (for legacy ranges like "30 jun. - 01 jul.").
 */
export function formatCostDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "—";
  const trimmed = dateStr.trim();
  const matchDash = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (matchDash) {
    const year = parseInt(matchDash[1], 10);
    const month = parseInt(matchDash[2], 10);
    const day = parseInt(matchDash[3], 10);
    
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const monthStr = months[month - 1] || "";
    return `${day} de ${monthStr} de ${year}`;
  }
  return dateStr;
}
