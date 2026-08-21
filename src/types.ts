export interface Traveler {
  id: string;
  name: string;
  role?: string;
  email?: string;
  checkedActivities?: string;
  packingItems?: string;
  createdByEmail?: string;
  isDeleted?: boolean;
}

export interface CostCategory {
  id: string;
  label: string;
  color: string;
}

export interface CostItem {
  id: string;
  category: "hotel" | "flight" | "car" | "activity" | "other" | string;
  description: string;
  notes?: string;
  link?: string;
  totalCostBRL: number;
  status: "Pago" | "Pgto no local" | "Falta pagar";
  dateRange?: string;
  destinationId?: string;
  isPersonal?: boolean;
  createdByEmail?: string;
  receiptName?: string;
  receiptData?: string;
  isDeleted?: boolean;
}

export interface Activity {
  id: string;
  time: string; // e.g. "08:30"
  location: string;
  duration: string; // e.g. "15 min" or "1h30"
  cost: string; // e.g. "Gratuito" or "US$ 15-25/pess."
  mapsQuery?: string; // used for Google Maps links
  websiteLink?: string;
  parking?: string;
  notes?: string;
  ticketFileName?: string;
  ticketFileData?: string;
  date?: string; // Display date of the activity (e.g., "01/07" or "01 de Julho")
  latitude?: number;
  longitude?: number;
  type?: "flight" | "hotel" | "tour" | "dinner" | "other" | string;
  createdByEmail?: string;
}

export interface ItineraryDay {
  id: string;
  dayNumber: number;
  dateStr: string; // e.g. "Quarta, 01 de Julho"
  title: string; // e.g. "Capitol Hill + Waterfront"
  activities: Activity[];
}

export interface Destination {
  id: string;
  city: string;
  state: string;
  country: string;
  dates: string; // e.g. "01 jul. - 04 jul."
  startDate?: string; // e.g. "2026-07-01"
  endDate?: string; // e.g. "2026-07-04"
  hotelName: string;
  hotelLink?: string;
  hotelAddress?: string;
  hotelCoords?: { lat: number; lng: number }; // mock coords for distance estimation
  checkInTime?: string; // e.g. "15:00"
  checkOutTime?: string; // e.g. "11:00"
  checkInDate?: string; // e.g. "2026-07-01T15:00:00"
  notes?: string;
  ratings?: Record<string, number>; // key: user email or traveler name -> rating 1..5
  days: ItineraryDay[];
  createdByEmail?: string;
  isDeleted?: boolean;
}

export interface TravelDocument {
  id: string;
  type: "eticket" | "passport" | "rg" | "other";
  title: string;
  airline?: string;
  flightNumber?: string;
  passengerName: string;
  fileData?: string; // Base64 encoded or simple mocked upload
  fileName?: string;
  notes?: string;
  uploadedAt: string;
  createdByEmail?: string;
  isDeleted?: boolean;
}

export interface FlightPassenger {
  id: string;
  name: string;
  seat?: string;
  ticketFileName?: string;
  ticketFileData?: string;
}

export interface FlightInfo {
  id: string;
  airline: string;
  logoUrl?: string;
  flightCode: string;
  departureCity: string;
  departureCode: string;
  departureTime: string;
  arrivalCity: string;
  arrivalCode: string;
  arrivalTime: string;
  duration: string;
  dateStr: string;
  arrivalDateStr?: string;
  status: "Confirmado" | "Atrasado" | "Em voo" | "Cancelado" | "Check-in aberto" | "Embarque" | "Finalizado";
  isDeleted?: boolean;
  gate?: string;
  locator?: string;
  passengers?: string;
  seats?: string;
  passengersList?: FlightPassenger[];
  ticketFileName?: string;
  ticketFileData?: string;
  createdByEmail?: string;
}

export interface GeneralTip {
  id: string;
  category: string; // e.g. "Nova York", "Geral"
  title: string;
  content: string;
}

export interface NotificationAlert {
  id: string;
  title: string;
  description?: string;
  message?: string;
  time: string;
  read: boolean;
  type: "gate" | "schedule" | "important" | "system";
}

export interface ChatMessage {
  id: string;
  itineraryId: number;
  senderName: string;
  senderAvatar?: string;
  recipientName?: string;
  isRead?: boolean;
  content?: string;
  fileData?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  timestamp: string;
}

export interface NearbyPlace {
  id: string;
  itineraryId: number;
  destinationId: string;
  category: "postos_combustivel" | "supermercados" | "lojas_conveniencia" | "pontos_importantes" | string;
  name: string;
  address?: string | null;
  rating?: string | null;
  distance?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  mapsLink?: string | null;
  createdAt?: string;
}

export type PlanType = 'starter' | 'pass' | 'annual' | 'founders_lifetime' | 'pro_lifetime';

export interface FoundersStatus {
  totalLimit: number;
  soldUnits: number;
  remainingUnits: number;
  isAvailable: boolean;
}

