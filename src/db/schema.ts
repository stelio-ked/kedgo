import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
  doublePrecision,
} from "drizzle-orm/pg-core";

// Define the 'users' table.
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  favoriteItineraryId: integer("favorite_itinerary_id"),
  isVerified: boolean("is_verified").default(true),
  provider: text("provider").default("email"),
  referralCode: text("referral_code").unique(),
  referredBy: text("referred_by"),
  referralCount: integer("referral_count").default(0).notNull(),
  planType: text("plan_type").default("starter").notNull(), // 'starter' | 'pass' | 'annual' | 'founders_lifetime' | 'pro_lifetime'
  isLifetimePro: boolean("is_lifetime_pro").default(false).notNull(),
  isAnnualPro: boolean("is_annual_pro").default(false).notNull(),
  annualExpiresAt: timestamp("annual_expires_at"),
  activeTripPassId: integer("active_trip_pass_id"),
  trialStartedAt: timestamp("trial_started_at").defaultNow(),
});

// Defining a travel itinerary table
export const itineraries = pgTable("itineraries", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id")
    .references(() => users.id)
    .notNull(),
  title: text("title").notNull(),
  isShared: boolean("is_shared").default(false),
  ecoMode: boolean("eco_mode").default(false),
  passPurchased: boolean("pass_purchased").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  referredUserId: integer("referred_user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status: text("status").default("pending").notNull(), // 'pending' | 'signup' | 'completed'
  rewardApplied: boolean("reward_applied").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tracks email invites sent before the invitee has registered
export const referralInvites = pgTable("referral_invites", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  inviteeEmail: text("invitee_email").notNull(),
  referralCode: text("referral_code").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

export const travelers = pgTable("travelers", {
  id: text("id").primaryKey(),
  itineraryId: integer("itinerary_id").references(() => itineraries.id, { onDelete: 'cascade' }).notNull(),
  name: text("name").notNull(),
  role: text("role"),
  email: text("email"),
  checkedActivities: text("checked_activities"),
  packingItems: text("packing_items"),
  createdByEmail: text("created_by_email"),
});

export const destinations = pgTable("destinations", {
  id: text("id").primaryKey(),
  itineraryId: integer("itinerary_id").references(() => itineraries.id, { onDelete: 'cascade' }).notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  country: text("country").notNull(),
  dates: text("dates").notNull(),
  startDate: text("start_date"),
  endDate: text("end_date"),
  hotelName: text("hotel_name").notNull(),
  hotelLink: text("hotel_link"),
  hotelAddress: text("hotel_address"),
  hotelCoordsLat: doublePrecision("hotel_coords_lat"),
  hotelCoordsLng: doublePrecision("hotel_coords_lng"),
  checkInTime: text("check_in_time"),
  checkOutTime: text("check_out_time"),
  checkInDate: text("check_in_date"),
  notes: text("notes"),
  ratings: text("ratings"),
  createdByEmail: text("created_by_email"),
});

export const itineraryDays = pgTable("itinerary_days", {
  id: text("id").primaryKey(),
  destinationId: text("destination_id").references(() => destinations.id, { onDelete: 'cascade' }).notNull(),
  dayNumber: integer("day_number").notNull(),
  dateStr: text("date_str").notNull(),
  title: text("title").notNull(),
});

export const activities = pgTable("activities", {
  id: text("id").primaryKey(),
  dayId: text("day_id").references(() => itineraryDays.id, { onDelete: 'cascade' }).notNull(),
  time: text("time").notNull(),
  type: text("type"),
  location: text("location").notNull(),
  duration: text("duration").notNull(),
  cost: text("cost").notNull(),
  mapsQuery: text("maps_query"),
  websiteLink: text("website_link"),
  parking: text("parking"),
  notes: text("notes"),
  ticketFileName: text("ticket_file_name"),
  ticketFileData: text("ticket_file_data"),
  date: text("date"),
  createdByEmail: text("created_by_email"),
});

export const costCategories = pgTable("cost_categories", {
  id: text("id").primaryKey(),
  itineraryId: integer("itinerary_id").references(() => itineraries.id, { onDelete: 'cascade' }).notNull(),
  label: text("label").notNull(),
  color: text("color").notNull(),
});

export const costs = pgTable("costs", {
  id: text("id").primaryKey(),
  itineraryId: integer("itinerary_id").references(() => itineraries.id, { onDelete: 'cascade' }).notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  notes: text("notes"),
  link: text("link"),
  totalCostBRL: doublePrecision("total_cost_brl").notNull(),
  status: text("status").notNull(),
  dateRange: text("date_range"),
  destinationId: text("destination_id"),
  isPersonal: boolean("is_personal").default(false).notNull(),
  createdByEmail: text("created_by_email"),
  receiptName: text("receipt_name"),
  receiptData: text("receipt_data"),
});

export const documents = pgTable("documents", {
  id: text("id").primaryKey(),
  itineraryId: integer("itinerary_id").references(() => itineraries.id, { onDelete: 'cascade' }).notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  airline: text("airline"),
  flightNumber: text("flight_number"),
  passengerName: text("passenger_name").notNull(),
  fileData: text("file_data"),
  fileName: text("file_name"),
  notes: text("notes"),
  uploadedAt: text("uploaded_at").notNull(),
  createdByEmail: text("created_by_email"),
});

export const flights = pgTable("flights", {
  id: text("id").primaryKey(),
  itineraryId: integer("itinerary_id").references(() => itineraries.id, { onDelete: 'cascade' }).notNull(),
  airline: text("airline").notNull(),
  logoUrl: text("logo_url"),
  flightCode: text("flight_code").notNull(),
  departureCity: text("departure_city").notNull(),
  departureCode: text("departure_code").notNull(),
  departureTime: text("departure_time").notNull(),
  arrivalCity: text("arrival_city").notNull(),
  arrivalCode: text("arrival_code").notNull(),
  arrivalTime: text("arrival_time").notNull(),
  duration: text("duration").notNull(),
  dateStr: text("date_str").notNull(),
  arrivalDateStr: text("arrival_date_str"),
  status: text("status").notNull(),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  gate: text("gate"),
  locator: text("locator"),
  passengers: text("passengers"),
  seats: text("seats"),
  ticketFileName: text("ticket_file_name"),
  ticketFileData: text("ticket_file_data"),
  createdByEmail: text("created_by_email"),
});

export const flightPassengers = pgTable("flight_passengers", {
  id: text("id").primaryKey(),
  flightId: text("flight_id")
    .references(() => flights.id, { onDelete: 'cascade' })
    .notNull(),
  name: text("name").notNull(),
  seat: text("seat"),
  ticketFileName: text("ticket_file_name"),
  ticketFileData: text("ticket_file_data"),
});

export const generalTips = pgTable("general_tips", {
  id: text("id").primaryKey(),
  itineraryId: integer("itinerary_id").references(() => itineraries.id, { onDelete: 'cascade' }).notNull(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
});

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  itineraryId: integer("itinerary_id").references(() => itineraries.id, { onDelete: 'cascade' }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  time: text("time").notNull(),
  read: boolean("read").notNull().default(false),
  type: text("type").notNull(),
});

export const nearbyPlaces = pgTable("nearby_places", {
  id: text("id").primaryKey(),
  itineraryId: integer("itinerary_id").references(() => itineraries.id, { onDelete: 'cascade' }).notNull(),
  destinationId: text("destination_id").references(() => destinations.id, { onDelete: 'cascade' }).notNull(),
  category: text("category").notNull(), // postos_combustivel, supermercados, lojas_conveniencia, pontos_importantes
  name: text("name").notNull(),
  address: text("address"),
  rating: text("rating"),
  distance: text("distance"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  mapsLink: text("maps_link"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  itineraries: many(itineraries),
}));

export const itinerariesRelations = relations(itineraries, ({ one, many }) => ({
  owner: one(users, { fields: [itineraries.ownerId], references: [users.id] }),
  travelers: many(travelers),
  destinations: many(destinations),
  costCategories: many(costCategories),
  costs: many(costs),
  documents: many(documents),
  flights: many(flights),
  generalTips: many(generalTips),
  notifications: many(notifications),
  transactionLogs: many(transactionLogs),
  nearbyPlaces: many(nearbyPlaces),
}));

export const destinationsRelations = relations(destinations, ({ one, many }) => ({
  itinerary: one(itineraries, { fields: [destinations.itineraryId], references: [itineraries.id] }),
  days: many(itineraryDays),
  nearbyPlaces: many(nearbyPlaces),
}));

export const nearbyPlacesRelations = relations(nearbyPlaces, ({ one }) => ({
  itinerary: one(itineraries, { fields: [nearbyPlaces.itineraryId], references: [itineraries.id] }),
  destination: one(destinations, { fields: [nearbyPlaces.destinationId], references: [destinations.id] }),
}));

export const itineraryDaysRelations = relations(itineraryDays, ({ one, many }) => ({
  destination: one(destinations, { fields: [itineraryDays.destinationId], references: [destinations.id] }),
  activities: many(activities),
}));

export const travelersRelations = relations(travelers, ({ one }) => ({
  itinerary: one(itineraries, { fields: [travelers.itineraryId], references: [itineraries.id] }),
}));

export const costCategoriesRelations = relations(costCategories, ({ one }) => ({
  itinerary: one(itineraries, { fields: [costCategories.itineraryId], references: [itineraries.id] }),
}));

export const costsRelations = relations(costs, ({ one }) => ({
  itinerary: one(itineraries, { fields: [costs.itineraryId], references: [itineraries.id] }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  itinerary: one(itineraries, { fields: [documents.itineraryId], references: [itineraries.id] }),
}));

export const flightsRelations = relations(flights, ({ one, many }) => ({
  itinerary: one(itineraries, { fields: [flights.itineraryId], references: [itineraries.id] }),
  passengersList: many(flightPassengers),
}));

export const flightPassengersRelations = relations(flightPassengers, ({ one }) => ({
  flight: one(flights, { fields: [flightPassengers.flightId], references: [flights.id] }),
}));

export const generalTipsRelations = relations(generalTips, ({ one }) => ({
  itinerary: one(itineraries, { fields: [generalTips.itineraryId], references: [itineraries.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  itinerary: one(itineraries, { fields: [notifications.itineraryId], references: [itineraries.id] }),
}));

export const transactionLogs = pgTable("transaction_logs", {
  id: text("id").primaryKey(),
  itineraryId: integer("itinerary_id").references(() => itineraries.id, { onDelete: 'cascade' }).notNull(),
  user: text("user").notNull(),
  userEmail: text("user_email").notNull(),
  action: text("action").notNull(),
  itemType: text("item_type").notNull(),
  itemId: text("item_id").notNull(),
  itemDesc: text("item_desc").notNull(),
  timestamp: text("timestamp").notNull(),
});

export const transactionLogsRelations = relations(transactionLogs, ({ one }) => ({
  itinerary: one(itineraries, { fields: [transactionLogs.itineraryId], references: [itineraries.id] }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  day: one(itineraryDays, { fields: [activities.dayId], references: [itineraryDays.id] }),
}));

export const chatMessages = pgTable("chat_messages", {
  id: text("id").primaryKey(),
  itineraryId: integer("itinerary_id").references(() => itineraries.id, { onDelete: 'cascade' }).notNull(),
  senderName: text("sender_name").notNull(),
  senderAvatar: text("sender_avatar"),
  recipientName: text("recipient_name"),
  isRead: boolean("is_read").default(false).notNull(),
  content: text("content"),
  fileData: text("file_data"),
  fileName: text("file_name"),
  fileType: text("file_type"),
  fileSize: integer("file_size"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  itinerary: one(itineraries, { fields: [chatMessages.itineraryId], references: [itineraries.id] }),
}));

export const accessLogs = pgTable("access_logs", {
  id: serial("id").primaryKey(),
  itineraryId: integer("itinerary_id").references(() => itineraries.id, { onDelete: 'cascade' }),
  userEmail: text("user_email").notNull(),
  status: text("status").notNull(), // 'success', 'denied'
  attemptedAt: timestamp("attempted_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
});

export const accessLogsRelations = relations(accessLogs, ({ one }) => ({
  itinerary: one(itineraries, { fields: [accessLogs.itineraryId], references: [itineraries.id] }),
}));

export const apiUsageLogs = pgTable("api_usage_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  itineraryId: integer("itinerary_id").references(() => itineraries.id, { onDelete: 'cascade' }),
  dateString: text("date_string").notNull(), // e.g., '2026-06-20'
  callCount: integer("call_count").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// AI Prompt history — stores every successful AI generation session for template reuse
export const aiPromptLogs = pgTable("ai_prompt_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  originalPrompt: text("original_prompt").notNull(),
  questions: text("questions"),       // JSON: SuggestedQuestion[]
  answers: text("answers"),           // JSON: Record<string, string>
  generatedTitle: text("generated_title"),
  success: boolean("success").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiPromptLogsRelations = relations(aiPromptLogs, ({ one }) => ({
  user: one(users, { fields: [aiPromptLogs.userId], references: [users.id] }),
}));

// Lote de Fundadores (Founders Pass) — Controle atômico das 200 licenças vitalícias
export const foundersQuota = pgTable("founders_quota", {
  id: serial("id").primaryKey(),
  totalLimit: integer("total_limit").default(200).notNull(),
  soldUnits: integer("sold_units").default(38).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


