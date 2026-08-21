var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  accessLogs: () => accessLogs,
  accessLogsRelations: () => accessLogsRelations,
  activities: () => activities,
  activitiesRelations: () => activitiesRelations,
  aiPromptLogs: () => aiPromptLogs,
  aiPromptLogsRelations: () => aiPromptLogsRelations,
  apiUsageLogs: () => apiUsageLogs,
  chatMessages: () => chatMessages,
  chatMessagesRelations: () => chatMessagesRelations,
  costCategories: () => costCategories,
  costCategoriesRelations: () => costCategoriesRelations,
  costs: () => costs,
  costsRelations: () => costsRelations,
  destinations: () => destinations,
  destinationsRelations: () => destinationsRelations,
  documents: () => documents,
  documentsRelations: () => documentsRelations,
  flightPassengers: () => flightPassengers,
  flightPassengersRelations: () => flightPassengersRelations,
  flights: () => flights,
  flightsRelations: () => flightsRelations,
  generalTips: () => generalTips,
  generalTipsRelations: () => generalTipsRelations,
  itineraries: () => itineraries,
  itinerariesRelations: () => itinerariesRelations,
  itineraryDays: () => itineraryDays,
  itineraryDaysRelations: () => itineraryDaysRelations,
  nearbyPlaces: () => nearbyPlaces,
  nearbyPlacesRelations: () => nearbyPlacesRelations,
  notifications: () => notifications,
  notificationsRelations: () => notificationsRelations,
  referralInvites: () => referralInvites,
  referrals: () => referrals,
  transactionLogs: () => transactionLogs,
  transactionLogsRelations: () => transactionLogsRelations,
  travelers: () => travelers,
  travelersRelations: () => travelersRelations,
  users: () => users,
  usersRelations: () => usersRelations
});
var import_drizzle_orm, import_pg_core, users, itineraries, referrals, referralInvites, travelers, destinations, itineraryDays, activities, costCategories, costs, documents, flights, flightPassengers, generalTips, notifications, nearbyPlaces, usersRelations, itinerariesRelations, destinationsRelations, nearbyPlacesRelations, itineraryDaysRelations, travelersRelations, costCategoriesRelations, costsRelations, documentsRelations, flightsRelations, flightPassengersRelations, generalTipsRelations, notificationsRelations, transactionLogs, transactionLogsRelations, activitiesRelations, chatMessages, chatMessagesRelations, accessLogs, accessLogsRelations, apiUsageLogs, aiPromptLogs, aiPromptLogsRelations;
var init_schema = __esm({
  "src/db/schema.ts"() {
    import_drizzle_orm = require("drizzle-orm");
    import_pg_core = require("drizzle-orm/pg-core");
    users = (0, import_pg_core.pgTable)("users", {
      id: (0, import_pg_core.serial)("id").primaryKey(),
      email: (0, import_pg_core.text)("email").notNull().unique(),
      passwordHash: (0, import_pg_core.text)("password_hash"),
      name: (0, import_pg_core.text)("name").notNull(),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
      passwordResetToken: (0, import_pg_core.text)("password_reset_token"),
      passwordResetExpires: (0, import_pg_core.timestamp)("password_reset_expires"),
      favoriteItineraryId: (0, import_pg_core.integer)("favorite_itinerary_id"),
      isVerified: (0, import_pg_core.boolean)("is_verified").default(true),
      provider: (0, import_pg_core.text)("provider").default("email"),
      referralCode: (0, import_pg_core.text)("referral_code").unique(),
      referredBy: (0, import_pg_core.text)("referred_by"),
      referralCount: (0, import_pg_core.integer)("referral_count").default(0).notNull(),
      planType: (0, import_pg_core.text)("plan_type").default("starter").notNull(),
      // 'starter' | 'pass' | 'pro_lifetime'
      isLifetimePro: (0, import_pg_core.boolean)("is_lifetime_pro").default(false).notNull(),
      trialStartedAt: (0, import_pg_core.timestamp)("trial_started_at").defaultNow()
    });
    itineraries = (0, import_pg_core.pgTable)("itineraries", {
      id: (0, import_pg_core.serial)("id").primaryKey(),
      ownerId: (0, import_pg_core.integer)("owner_id").references(() => users.id).notNull(),
      title: (0, import_pg_core.text)("title").notNull(),
      isShared: (0, import_pg_core.boolean)("is_shared").default(false),
      ecoMode: (0, import_pg_core.boolean)("eco_mode").default(false),
      passPurchased: (0, import_pg_core.boolean)("pass_purchased").default(false).notNull(),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
      updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
    });
    referrals = (0, import_pg_core.pgTable)("referrals", {
      id: (0, import_pg_core.serial)("id").primaryKey(),
      referrerId: (0, import_pg_core.integer)("referrer_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      referredUserId: (0, import_pg_core.integer)("referred_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      status: (0, import_pg_core.text)("status").default("pending").notNull(),
      // 'pending' | 'signup' | 'completed'
      rewardApplied: (0, import_pg_core.boolean)("reward_applied").default(false).notNull(),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull()
    });
    referralInvites = (0, import_pg_core.pgTable)("referral_invites", {
      id: (0, import_pg_core.serial)("id").primaryKey(),
      referrerId: (0, import_pg_core.integer)("referrer_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      inviteeEmail: (0, import_pg_core.text)("invitee_email").notNull(),
      referralCode: (0, import_pg_core.text)("referral_code").notNull(),
      sentAt: (0, import_pg_core.timestamp)("sent_at").defaultNow().notNull()
    });
    travelers = (0, import_pg_core.pgTable)("travelers", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      itineraryId: (0, import_pg_core.integer)("itinerary_id").references(() => itineraries.id, { onDelete: "cascade" }).notNull(),
      name: (0, import_pg_core.text)("name").notNull(),
      role: (0, import_pg_core.text)("role"),
      email: (0, import_pg_core.text)("email"),
      checkedActivities: (0, import_pg_core.text)("checked_activities"),
      packingItems: (0, import_pg_core.text)("packing_items"),
      createdByEmail: (0, import_pg_core.text)("created_by_email")
    });
    destinations = (0, import_pg_core.pgTable)("destinations", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      itineraryId: (0, import_pg_core.integer)("itinerary_id").references(() => itineraries.id, { onDelete: "cascade" }).notNull(),
      city: (0, import_pg_core.text)("city").notNull(),
      state: (0, import_pg_core.text)("state").notNull(),
      country: (0, import_pg_core.text)("country").notNull(),
      dates: (0, import_pg_core.text)("dates").notNull(),
      startDate: (0, import_pg_core.text)("start_date"),
      endDate: (0, import_pg_core.text)("end_date"),
      hotelName: (0, import_pg_core.text)("hotel_name").notNull(),
      hotelLink: (0, import_pg_core.text)("hotel_link"),
      hotelAddress: (0, import_pg_core.text)("hotel_address"),
      hotelCoordsLat: (0, import_pg_core.doublePrecision)("hotel_coords_lat"),
      hotelCoordsLng: (0, import_pg_core.doublePrecision)("hotel_coords_lng"),
      checkInTime: (0, import_pg_core.text)("check_in_time"),
      checkOutTime: (0, import_pg_core.text)("check_out_time"),
      checkInDate: (0, import_pg_core.text)("check_in_date"),
      notes: (0, import_pg_core.text)("notes"),
      ratings: (0, import_pg_core.text)("ratings"),
      createdByEmail: (0, import_pg_core.text)("created_by_email")
    });
    itineraryDays = (0, import_pg_core.pgTable)("itinerary_days", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      destinationId: (0, import_pg_core.text)("destination_id").references(() => destinations.id, { onDelete: "cascade" }).notNull(),
      dayNumber: (0, import_pg_core.integer)("day_number").notNull(),
      dateStr: (0, import_pg_core.text)("date_str").notNull(),
      title: (0, import_pg_core.text)("title").notNull()
    });
    activities = (0, import_pg_core.pgTable)("activities", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      dayId: (0, import_pg_core.text)("day_id").references(() => itineraryDays.id, { onDelete: "cascade" }).notNull(),
      time: (0, import_pg_core.text)("time").notNull(),
      type: (0, import_pg_core.text)("type"),
      location: (0, import_pg_core.text)("location").notNull(),
      duration: (0, import_pg_core.text)("duration").notNull(),
      cost: (0, import_pg_core.text)("cost").notNull(),
      mapsQuery: (0, import_pg_core.text)("maps_query"),
      websiteLink: (0, import_pg_core.text)("website_link"),
      parking: (0, import_pg_core.text)("parking"),
      notes: (0, import_pg_core.text)("notes"),
      ticketFileName: (0, import_pg_core.text)("ticket_file_name"),
      ticketFileData: (0, import_pg_core.text)("ticket_file_data"),
      date: (0, import_pg_core.text)("date"),
      createdByEmail: (0, import_pg_core.text)("created_by_email")
    });
    costCategories = (0, import_pg_core.pgTable)("cost_categories", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      itineraryId: (0, import_pg_core.integer)("itinerary_id").references(() => itineraries.id, { onDelete: "cascade" }).notNull(),
      label: (0, import_pg_core.text)("label").notNull(),
      color: (0, import_pg_core.text)("color").notNull()
    });
    costs = (0, import_pg_core.pgTable)("costs", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      itineraryId: (0, import_pg_core.integer)("itinerary_id").references(() => itineraries.id, { onDelete: "cascade" }).notNull(),
      category: (0, import_pg_core.text)("category").notNull(),
      description: (0, import_pg_core.text)("description").notNull(),
      notes: (0, import_pg_core.text)("notes"),
      link: (0, import_pg_core.text)("link"),
      totalCostBRL: (0, import_pg_core.doublePrecision)("total_cost_brl").notNull(),
      status: (0, import_pg_core.text)("status").notNull(),
      dateRange: (0, import_pg_core.text)("date_range"),
      destinationId: (0, import_pg_core.text)("destination_id"),
      isPersonal: (0, import_pg_core.boolean)("is_personal").default(false).notNull(),
      createdByEmail: (0, import_pg_core.text)("created_by_email"),
      receiptName: (0, import_pg_core.text)("receipt_name"),
      receiptData: (0, import_pg_core.text)("receipt_data")
    });
    documents = (0, import_pg_core.pgTable)("documents", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      itineraryId: (0, import_pg_core.integer)("itinerary_id").references(() => itineraries.id, { onDelete: "cascade" }).notNull(),
      type: (0, import_pg_core.text)("type").notNull(),
      title: (0, import_pg_core.text)("title").notNull(),
      airline: (0, import_pg_core.text)("airline"),
      flightNumber: (0, import_pg_core.text)("flight_number"),
      passengerName: (0, import_pg_core.text)("passenger_name").notNull(),
      fileData: (0, import_pg_core.text)("file_data"),
      fileName: (0, import_pg_core.text)("file_name"),
      notes: (0, import_pg_core.text)("notes"),
      uploadedAt: (0, import_pg_core.text)("uploaded_at").notNull(),
      createdByEmail: (0, import_pg_core.text)("created_by_email")
    });
    flights = (0, import_pg_core.pgTable)("flights", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      itineraryId: (0, import_pg_core.integer)("itinerary_id").references(() => itineraries.id, { onDelete: "cascade" }).notNull(),
      airline: (0, import_pg_core.text)("airline").notNull(),
      logoUrl: (0, import_pg_core.text)("logo_url"),
      flightCode: (0, import_pg_core.text)("flight_code").notNull(),
      departureCity: (0, import_pg_core.text)("departure_city").notNull(),
      departureCode: (0, import_pg_core.text)("departure_code").notNull(),
      departureTime: (0, import_pg_core.text)("departure_time").notNull(),
      arrivalCity: (0, import_pg_core.text)("arrival_city").notNull(),
      arrivalCode: (0, import_pg_core.text)("arrival_code").notNull(),
      arrivalTime: (0, import_pg_core.text)("arrival_time").notNull(),
      duration: (0, import_pg_core.text)("duration").notNull(),
      dateStr: (0, import_pg_core.text)("date_str").notNull(),
      arrivalDateStr: (0, import_pg_core.text)("arrival_date_str"),
      status: (0, import_pg_core.text)("status").notNull(),
      isDeleted: (0, import_pg_core.boolean)("is_deleted").default(false).notNull(),
      gate: (0, import_pg_core.text)("gate"),
      locator: (0, import_pg_core.text)("locator"),
      passengers: (0, import_pg_core.text)("passengers"),
      seats: (0, import_pg_core.text)("seats"),
      ticketFileName: (0, import_pg_core.text)("ticket_file_name"),
      ticketFileData: (0, import_pg_core.text)("ticket_file_data"),
      createdByEmail: (0, import_pg_core.text)("created_by_email")
    });
    flightPassengers = (0, import_pg_core.pgTable)("flight_passengers", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      flightId: (0, import_pg_core.text)("flight_id").references(() => flights.id, { onDelete: "cascade" }).notNull(),
      name: (0, import_pg_core.text)("name").notNull(),
      seat: (0, import_pg_core.text)("seat"),
      ticketFileName: (0, import_pg_core.text)("ticket_file_name"),
      ticketFileData: (0, import_pg_core.text)("ticket_file_data")
    });
    generalTips = (0, import_pg_core.pgTable)("general_tips", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      itineraryId: (0, import_pg_core.integer)("itinerary_id").references(() => itineraries.id, { onDelete: "cascade" }).notNull(),
      category: (0, import_pg_core.text)("category").notNull(),
      title: (0, import_pg_core.text)("title").notNull(),
      content: (0, import_pg_core.text)("content").notNull()
    });
    notifications = (0, import_pg_core.pgTable)("notifications", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      itineraryId: (0, import_pg_core.integer)("itinerary_id").references(() => itineraries.id, { onDelete: "cascade" }).notNull(),
      title: (0, import_pg_core.text)("title").notNull(),
      description: (0, import_pg_core.text)("description").notNull(),
      time: (0, import_pg_core.text)("time").notNull(),
      read: (0, import_pg_core.boolean)("read").notNull().default(false),
      type: (0, import_pg_core.text)("type").notNull()
    });
    nearbyPlaces = (0, import_pg_core.pgTable)("nearby_places", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      itineraryId: (0, import_pg_core.integer)("itinerary_id").references(() => itineraries.id, { onDelete: "cascade" }).notNull(),
      destinationId: (0, import_pg_core.text)("destination_id").references(() => destinations.id, { onDelete: "cascade" }).notNull(),
      category: (0, import_pg_core.text)("category").notNull(),
      // postos_combustivel, supermercados, lojas_conveniencia, pontos_importantes
      name: (0, import_pg_core.text)("name").notNull(),
      address: (0, import_pg_core.text)("address"),
      rating: (0, import_pg_core.text)("rating"),
      distance: (0, import_pg_core.text)("distance"),
      latitude: (0, import_pg_core.doublePrecision)("latitude"),
      longitude: (0, import_pg_core.doublePrecision)("longitude"),
      mapsLink: (0, import_pg_core.text)("maps_link"),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
    });
    usersRelations = (0, import_drizzle_orm.relations)(users, ({ many }) => ({
      itineraries: many(itineraries)
    }));
    itinerariesRelations = (0, import_drizzle_orm.relations)(itineraries, ({ one, many }) => ({
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
      nearbyPlaces: many(nearbyPlaces)
    }));
    destinationsRelations = (0, import_drizzle_orm.relations)(destinations, ({ one, many }) => ({
      itinerary: one(itineraries, { fields: [destinations.itineraryId], references: [itineraries.id] }),
      days: many(itineraryDays),
      nearbyPlaces: many(nearbyPlaces)
    }));
    nearbyPlacesRelations = (0, import_drizzle_orm.relations)(nearbyPlaces, ({ one }) => ({
      itinerary: one(itineraries, { fields: [nearbyPlaces.itineraryId], references: [itineraries.id] }),
      destination: one(destinations, { fields: [nearbyPlaces.destinationId], references: [destinations.id] })
    }));
    itineraryDaysRelations = (0, import_drizzle_orm.relations)(itineraryDays, ({ one, many }) => ({
      destination: one(destinations, { fields: [itineraryDays.destinationId], references: [destinations.id] }),
      activities: many(activities)
    }));
    travelersRelations = (0, import_drizzle_orm.relations)(travelers, ({ one }) => ({
      itinerary: one(itineraries, { fields: [travelers.itineraryId], references: [itineraries.id] })
    }));
    costCategoriesRelations = (0, import_drizzle_orm.relations)(costCategories, ({ one }) => ({
      itinerary: one(itineraries, { fields: [costCategories.itineraryId], references: [itineraries.id] })
    }));
    costsRelations = (0, import_drizzle_orm.relations)(costs, ({ one }) => ({
      itinerary: one(itineraries, { fields: [costs.itineraryId], references: [itineraries.id] })
    }));
    documentsRelations = (0, import_drizzle_orm.relations)(documents, ({ one }) => ({
      itinerary: one(itineraries, { fields: [documents.itineraryId], references: [itineraries.id] })
    }));
    flightsRelations = (0, import_drizzle_orm.relations)(flights, ({ one, many }) => ({
      itinerary: one(itineraries, { fields: [flights.itineraryId], references: [itineraries.id] }),
      passengersList: many(flightPassengers)
    }));
    flightPassengersRelations = (0, import_drizzle_orm.relations)(flightPassengers, ({ one }) => ({
      flight: one(flights, { fields: [flightPassengers.flightId], references: [flights.id] })
    }));
    generalTipsRelations = (0, import_drizzle_orm.relations)(generalTips, ({ one }) => ({
      itinerary: one(itineraries, { fields: [generalTips.itineraryId], references: [itineraries.id] })
    }));
    notificationsRelations = (0, import_drizzle_orm.relations)(notifications, ({ one }) => ({
      itinerary: one(itineraries, { fields: [notifications.itineraryId], references: [itineraries.id] })
    }));
    transactionLogs = (0, import_pg_core.pgTable)("transaction_logs", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      itineraryId: (0, import_pg_core.integer)("itinerary_id").references(() => itineraries.id, { onDelete: "cascade" }).notNull(),
      user: (0, import_pg_core.text)("user").notNull(),
      userEmail: (0, import_pg_core.text)("user_email").notNull(),
      action: (0, import_pg_core.text)("action").notNull(),
      itemType: (0, import_pg_core.text)("item_type").notNull(),
      itemId: (0, import_pg_core.text)("item_id").notNull(),
      itemDesc: (0, import_pg_core.text)("item_desc").notNull(),
      timestamp: (0, import_pg_core.text)("timestamp").notNull()
    });
    transactionLogsRelations = (0, import_drizzle_orm.relations)(transactionLogs, ({ one }) => ({
      itinerary: one(itineraries, { fields: [transactionLogs.itineraryId], references: [itineraries.id] })
    }));
    activitiesRelations = (0, import_drizzle_orm.relations)(activities, ({ one }) => ({
      day: one(itineraryDays, { fields: [activities.dayId], references: [itineraryDays.id] })
    }));
    chatMessages = (0, import_pg_core.pgTable)("chat_messages", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      itineraryId: (0, import_pg_core.integer)("itinerary_id").references(() => itineraries.id, { onDelete: "cascade" }).notNull(),
      senderName: (0, import_pg_core.text)("sender_name").notNull(),
      senderAvatar: (0, import_pg_core.text)("sender_avatar"),
      recipientName: (0, import_pg_core.text)("recipient_name"),
      isRead: (0, import_pg_core.boolean)("is_read").default(false).notNull(),
      content: (0, import_pg_core.text)("content"),
      fileData: (0, import_pg_core.text)("file_data"),
      fileName: (0, import_pg_core.text)("file_name"),
      fileType: (0, import_pg_core.text)("file_type"),
      fileSize: (0, import_pg_core.integer)("file_size"),
      timestamp: (0, import_pg_core.timestamp)("timestamp").defaultNow().notNull()
    });
    chatMessagesRelations = (0, import_drizzle_orm.relations)(chatMessages, ({ one }) => ({
      itinerary: one(itineraries, { fields: [chatMessages.itineraryId], references: [itineraries.id] })
    }));
    accessLogs = (0, import_pg_core.pgTable)("access_logs", {
      id: (0, import_pg_core.serial)("id").primaryKey(),
      itineraryId: (0, import_pg_core.integer)("itinerary_id").references(() => itineraries.id, { onDelete: "cascade" }),
      userEmail: (0, import_pg_core.text)("user_email").notNull(),
      status: (0, import_pg_core.text)("status").notNull(),
      // 'success', 'denied'
      attemptedAt: (0, import_pg_core.timestamp)("attempted_at").defaultNow().notNull(),
      ipAddress: (0, import_pg_core.text)("ip_address")
    });
    accessLogsRelations = (0, import_drizzle_orm.relations)(accessLogs, ({ one }) => ({
      itinerary: one(itineraries, { fields: [accessLogs.itineraryId], references: [itineraries.id] })
    }));
    apiUsageLogs = (0, import_pg_core.pgTable)("api_usage_logs", {
      id: (0, import_pg_core.serial)("id").primaryKey(),
      userId: (0, import_pg_core.integer)("user_id").references(() => users.id),
      itineraryId: (0, import_pg_core.integer)("itinerary_id").references(() => itineraries.id, { onDelete: "cascade" }),
      dateString: (0, import_pg_core.text)("date_string").notNull(),
      // e.g., '2026-06-20'
      callCount: (0, import_pg_core.integer)("call_count").default(0).notNull(),
      updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
    });
    aiPromptLogs = (0, import_pg_core.pgTable)("ai_prompt_logs", {
      id: (0, import_pg_core.serial)("id").primaryKey(),
      userId: (0, import_pg_core.integer)("user_id").references(() => users.id),
      originalPrompt: (0, import_pg_core.text)("original_prompt").notNull(),
      questions: (0, import_pg_core.text)("questions"),
      // JSON: SuggestedQuestion[]
      answers: (0, import_pg_core.text)("answers"),
      // JSON: Record<string, string>
      generatedTitle: (0, import_pg_core.text)("generated_title"),
      success: (0, import_pg_core.boolean)("success").default(false).notNull(),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull()
    });
    aiPromptLogsRelations = (0, import_drizzle_orm.relations)(aiPromptLogs, ({ one }) => ({
      user: one(users, { fields: [aiPromptLogs.userId], references: [users.id] })
    }));
  }
});

// src/db/index.ts
var db_exports = {};
__export(db_exports, {
  createPool: () => createPool,
  db: () => db,
  normalizeDatabaseUrl: () => normalizeDatabaseUrl,
  pool: () => pool
});
var import_node_postgres, import_pg, Pool, normalizeDatabaseUrl, createPool, pool, db;
var init_db = __esm({
  "src/db/index.ts"() {
    import_node_postgres = require("drizzle-orm/node-postgres");
    import_pg = __toESM(require("pg"), 1);
    init_schema();
    ({ Pool } = import_pg.default);
    normalizeDatabaseUrl = (rawUrl) => {
      if (!rawUrl || !rawUrl.trim()) return null;
      let url = rawUrl.trim().replace(/^["']|["']$/g, "");
      if (url.startsWith("//")) {
        url = "postgresql:" + url;
      } else if (url.startsWith("postgres://")) {
        url = "postgresql://" + url.substring("postgres://".length);
      } else if (url.startsWith("postgres:") && !url.startsWith("postgres://")) {
        url = "postgresql://" + url.substring("postgres:".length).replace(/^\/*/, "");
      } else if (url.startsWith("postgresql:") && !url.startsWith("postgresql://")) {
        url = "postgresql://" + url.substring("postgresql:".length).replace(/^\/*/, "");
      } else if (!url.startsWith("postgresql://") && url.includes("@")) {
        url = "postgresql://" + url.replace(/^\/*/, "");
      }
      return url;
    };
    createPool = () => {
      const normalizedUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);
      if (!normalizedUrl) {
        console.warn(
          "DATABASE_URL is not set. Database features will be unavailable."
        );
        return null;
      }
      const isSslDisabled = normalizedUrl.includes("sslmode=disable") || normalizedUrl.includes("ssl=false") || normalizedUrl.includes("localhost") || normalizedUrl.includes("127.0.0.1");
      try {
        return new Pool({
          connectionString: normalizedUrl,
          connectionTimeoutMillis: 1e4,
          ssl: isSslDisabled ? false : { rejectUnauthorized: false }
        });
      } catch (err) {
        console.error("Failed to initialize PostgreSQL pool:", err);
        return null;
      }
    };
    pool = createPool();
    if (pool) {
      pool.on("error", (err) => {
        console.error("Unexpected error on idle SQL pool client:", err);
      });
    }
    db = pool ? (0, import_node_postgres.drizzle)(pool, { schema: schema_exports }) : null;
  }
});

// src/middleware/auth.ts
var import_jsonwebtoken, JWT_SECRET, formatDbError, authMiddleware;
var init_auth = __esm({
  "src/middleware/auth.ts"() {
    import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
    if (process.env.NODE_ENV === "production" && (!process.env.JWT_SECRET || process.env.JWT_SECRET === "meu-secret-super-seguro-dev-only")) {
      console.error("FATAL: JWT_SECRET n\xE3o configurado ou inseguro em ambiente de produ\xE7\xE3o.");
      process.exit(1);
    }
    JWT_SECRET = process.env.JWT_SECRET || "meu-secret-super-seguro-dev-only";
    formatDbError = (err) => {
      if (err && err.message) {
        let msg = err.message;
        if (msg.includes("ENOENT") || msg.includes("ENOTFOUND") || msg.includes("ECONNREFUSED") || msg.includes("connect ETIMEDOUT") || msg.includes("timeout expired")) {
          return "N\xE3o foi poss\xEDvel conectar ao banco de dados PostgreSQL. Verifique se a vari\xE1vel DATABASE_URL est\xE1 configurada corretamente com um host acess\xEDvel.";
        }
        if (err.cause) {
          const causeMsg = typeof err.cause === "object" && err.cause.message ? err.cause.message : String(err.cause);
          if (causeMsg.includes("ENOENT") || causeMsg.includes("ENOTFOUND") || causeMsg.includes("ECONNREFUSED")) {
            return "N\xE3o foi poss\xEDvel conectar ao banco de dados PostgreSQL. Verifique se a vari\xE1vel DATABASE_URL est\xE1 configurada corretamente com um host acess\xEDvel.";
          }
          msg += ` | Causa original: ${causeMsg}`;
        }
        return msg;
      }
      return String(err);
    };
    authMiddleware = (req, res, next) => {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return res.status(401).json({ error: "Token n\xE3o fornecido" });
      if (token === "traveler-session") {
        if (process.env.NODE_ENV === "production") {
          return res.status(401).json({ error: "Sess\xE3o est\xE1tica desativada em produ\xE7\xE3o" });
        }
        req.user = { id: 0, email: "traveler@viagem.com", name: "Viajante" };
        return next();
      }
      try {
        const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
      } catch (err) {
        res.status(401).json({ error: "Token inv\xE1lido" });
      }
    };
  }
});

// src/services/email.ts
function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    return null;
  }
  return import_nodemailer.default.createTransport({
    service: "gmail",
    auth: { user, pass }
  });
}
async function sendEmail(payload) {
  const transporter = createTransporter();
  const from = process.env.GMAIL_USER || "noreply@kedgo.app";
  if (!transporter) {
    console.log(`[DEV EMAIL] Para: ${payload.to} | Assunto: ${payload.subject}`);
    return { sent: false };
  }
  try {
    const info = await transporter.sendMail({
      from: `"KedGo!" <${from}>`,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text
    });
    console.log(`[EMAIL ENVIADO] Para: ${payload.to} | MessageId: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EMAIL ERRO] Falha ao enviar para ${payload.to}:`, err.message);
    throw err;
  }
}
function buildPasswordSetupEmail(opts) {
  const { name, email, resetUrl, isNewAccount } = opts;
  const title = isNewAccount ? "Crie sua senha de acesso \u2014 KedGo!" : "Defina ou atualize sua senha \u2014 KedGo!";
  const callToAction = isNewAccount ? "Voc\xEA foi cadastrado na KedGo!! Para ativar sua conta, crie sua senha de acesso clicando no bot\xE3o abaixo." : "Recebemos uma solicita\xE7\xE3o para configurar o acesso \xE0 sua conta. Clique no bot\xE3o para definir sua senha.";
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                \u2708\uFE0F KedGo!
              </h1>
              <p style="margin:6px 0 0;color:#a0aec0;font-size:13px;">Roteiro & Custos de Viagem</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;font-size:16px;color:#2d3748;">Ol\xE1, <strong>${name || "Viajante"}</strong>!</p>
              <p style="margin:0 0 28px;font-size:15px;color:#4a5568;line-height:1.6;">${callToAction}</p>
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:8px;">
                    <a href="${resetUrl}" target="_blank"
                       style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
                      \u{1F510} Definir Minha Senha
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Warning -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="background:#fffbeb;border:1px solid #f6d860;border-radius:8px;padding:14px 16px;">
                    <p style="margin:0;font-size:13px;color:#92400e;">
                      \u26A0\uFE0F Este link expira em <strong>1 hora</strong>. Se voc\xEA n\xE3o solicitou este e-mail, ignore-o com seguran\xE7a.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f7f8fa;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#a0aec0;">
                KedGo! \u2014 Seu di\xE1rio de bordo de viagens.<br />
                Este \xE9 um e-mail autom\xE1tico, n\xE3o responda a esta mensagem.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
  const text2 = `Ol\xE1, ${name || "Viajante"}!

${callToAction}

Link para definir sua senha:
${resetUrl}

Este link expira em 1 hora.

KedGo!`;
  return { to: email, subject: title, html, text: text2 };
}
function buildAccountVerificationEmail(opts) {
  const { name, email, verifyUrl } = opts;
  const title = "Confirme seu e-mail de cadastro \u2014 KedGo!";
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                \u2708\uFE0F KedGo!
              </h1>
              <p style="margin:6px 0 0;color:#a0aec0;font-size:13px;">Roteiro & Custos de Viagem</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;font-size:16px;color:#2d3748;">Ol\xE1, <strong>${name || "Organizador"}</strong>!</p>
              <p style="margin:0 0 28px;font-size:15px;color:#4a5568;line-height:1.6;">
                Obrigado por se cadastrar no KedGo!! Para concluir a cria\xE7\xE3o da sua conta e liberar seu acesso, confirme seu e-mail clicando no bot\xE3o abaixo:
              </p>
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#4f46e5 0%,#4338ca 100%);border-radius:8px;">
                    <a href="${verifyUrl}" target="_blank"
                       style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
                      \u2705 Ativar Minha Conta
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Warning -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="background:#fffbeb;border:1px solid #f6d860;border-radius:8px;padding:14px 16px;">
                    <p style="margin:0;font-size:13px;color:#92400e;">
                      \u26A0\uFE0F Este link de confirma\xE7\xE3o expira em <strong>24 horas</strong>. Se voc\xEA n\xE3o solicitou este cadastro, ignore-o.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f7f8fa;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#a0aec0;">
                KedGo! \u2014 Seu di\xE1rio de bordo de viagens.<br />
                Este \xE9 um e-mail autom\xE1tico, n\xE3o responda a esta mensagem.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
  const text2 = `Ol\xE1, ${name || "Organizador"}!

Confirme seu e-mail clicando no link abaixo:
${verifyUrl}

Este link expira em 24 horas.

KedGo!`;
  return { to: email, subject: title, html, text: text2 };
}
function buildReferralInviteEmail(opts) {
  const { referrerName, inviteeEmail, referralCode, inviteUrl } = opts;
  const title = `${referrerName} convidou voc\xEA para organizar viagens no KedGo!`;
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1E3A5F 0%,#D95D39 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                KedGo!
              </h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Programa Indique & Ganhe</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 16px;font-size:16px;color:#2d3748;">Ol\xE1! \u{1F44B}</p>
              <p style="margin:0 0 20px;font-size:15px;color:#4a5568;line-height:1.6;">
                Seu amigo <strong>${referrerName}</strong> usa o <strong>KedGo!</strong> para planejar roteiros, voos e custos de viagens e te convidou para fazer parte!
              </p>
              <!-- Promo Box com explica\xE7\xE3o dos 2 produtos -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 28px;">
                <tr>
                  <td style="background:#FFF7ED;border:1px solid #FDBA74;border-radius:12px;padding:20px;">
                    <p style="margin:0 0 14px;font-size:14px;color:#9A3412;font-weight:700;">
                      \u{1F381} Ao se cadastrar com o convite, voc\xEA ganha <span style="color:#C2410C;font-weight:800;">R$ 10,00 de desconto</span> na escolha do seu produto:
                    </p>
                    
                    <div style="background:#ffffff;border-radius:8px;padding:12px 14px;margin-bottom:10px;border:1px solid #fed7aa;">
                      <p style="margin:0;font-size:13px;color:#1E3A5F;font-weight:700;">\u{1F3AB} Passe KedGo! (Avulso)</p>
                      <p style="margin:4px 0 0;font-size:12px;color:#475569;line-height:1.45;">
                        Acesso total aos recursos inteligentes de IA, organiza\xE7\xE3o de voos, documentos e rateio financeiro para <strong>1 viagem espec\xEDfica</strong>. Ideal para quem viaja pontualmente.
                      </p>
                    </div>

                    <div style="background:#ffffff;border-radius:8px;padding:12px 14px;border:1px solid #fed7aa;">
                      <p style="margin:0;font-size:13px;color:#1E3A5F;font-weight:700;">\u2B50 KedGo! Pro (Vital\xEDcio)</p>
                      <p style="margin:4px 0 0;font-size:12px;color:#475569;line-height:1.45;">
                        Acesso <strong>vital\xEDcio e ilimitado</strong> para criar quantas viagens quiser, IA sem restri\xE7\xF5es, exporta\xE7\xE3o em PDF e novas atualiza\xE7\xF5es. Perfeito para quem viaja sempre.
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#1E3A5F 0%,#D95D39 100%);border-radius:8px;">
                    <a href="${inviteUrl}" target="_blank"
                       style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;">
                      Criar Minha Conta Gr\xE1tis
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Referral Code -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="background:#F1F5F9;border-radius:8px;padding:14px 16px;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#64748B;">Ou use o c\xF3digo de convite ao se cadastrar:</p>
                    <p style="margin:6px 0 0;font-size:20px;font-weight:800;color:#1E3A5F;letter-spacing:2px;font-family:monospace;">${referralCode}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f7f8fa;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#a0aec0;">
                KedGo! \u2014 Seu di\xE1rio de bordo de viagens.<br />
                Este \xE9 um e-mail autom\xE1tico enviado a pedido de ${referrerName}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
  const text2 = `Ol\xE1!

Seu amigo ${referrerName} te convidou para usar o KedGo!

Ao se cadastrar, voc\xEA ganha R$ 10,00 de desconto na escolha do seu produto:
- Passe KedGo! (Avulso - 1 viagem): Recursos completos para 1 viagem espec\xEDfica.
- KedGo! Pro (Vital\xEDcio): Acesso vital\xEDcio e ilimitado para todas as suas viagens.

Crie sua conta pelo link: ${inviteUrl}
Ou use o c\xF3digo de convite: ${referralCode}

KedGo!`;
  return { to: inviteeEmail, subject: title, html, text: text2 };
}
var import_nodemailer;
var init_email = __esm({
  "src/services/email.ts"() {
    import_nodemailer = __toESM(require("nodemailer"), 1);
  }
});

// src/routes/referral.ts
var referral_exports = {};
__export(referral_exports, {
  completeReferralForUser: () => completeReferralForUser,
  default: () => referral_default
});
async function completeReferralForUser(referredUserId) {
  try {
    if (!referredUserId) return;
    const [ref] = await db.select().from(referrals).where((0, import_drizzle_orm3.and)((0, import_drizzle_orm3.eq)(referrals.referredUserId, referredUserId), (0, import_drizzle_orm3.eq)(referrals.status, "signup"))).limit(1);
    if (!ref) return;
    await db.update(referrals).set({ status: "completed" }).where((0, import_drizzle_orm3.eq)(referrals.id, ref.id));
    const completedRefs = await db.select().from(referrals).where((0, import_drizzle_orm3.and)((0, import_drizzle_orm3.eq)(referrals.referrerId, ref.referrerId), (0, import_drizzle_orm3.eq)(referrals.status, "completed")));
    const completedCount = completedRefs.length;
    const [referrer] = await db.select().from(users).where((0, import_drizzle_orm3.eq)(users.id, ref.referrerId)).limit(1);
    if (referrer) {
      const updates = { referralCount: completedCount };
      if (completedCount >= 10 && !referrer.isLifetimePro) {
        updates.isLifetimePro = true;
        updates.planType = "pro_lifetime";
      }
      await db.update(users).set(updates).where((0, import_drizzle_orm3.eq)(users.id, ref.referrerId));
    }
    console.log(`[Referral] Indica\xE7\xE3o conclu\xEDda para usu\xE1rio ${referredUserId}! Indicador ${ref.referrerId} agora possui ${completedCount} indicados efetivos.`);
  } catch (err) {
    console.error("[Referral Completion Error]", err.message);
  }
}
var import_express2, import_drizzle_orm3, router2, referral_default;
var init_referral = __esm({
  "src/routes/referral.ts"() {
    import_express2 = require("express");
    import_drizzle_orm3 = require("drizzle-orm");
    init_db();
    init_schema();
    init_auth();
    init_email();
    router2 = (0, import_express2.Router)();
    router2.get("/stats", authMiddleware, async (req, res) => {
      try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "N\xE3o autenticado" });
        const [user] = await db.select().from(users).where((0, import_drizzle_orm3.eq)(users.id, userId)).limit(1);
        if (!user) return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado" });
        let referralCode = user.referralCode;
        if (!referralCode || referralCode === "KED1") {
          referralCode = "KED10";
          await db.update(users).set({ referralCode: "KED10" }).where((0, import_drizzle_orm3.eq)(users.id, userId));
        }
        const userReferrals = await db.select({
          id: referrals.id,
          referredUserId: referrals.referredUserId,
          status: referrals.status,
          rewardApplied: referrals.rewardApplied,
          createdAt: referrals.createdAt,
          referredName: users.name,
          referredEmail: users.email,
          referredPlanType: users.planType
        }).from(referrals).leftJoin(users, (0, import_drizzle_orm3.eq)(referrals.referredUserId, users.id)).where((0, import_drizzle_orm3.eq)(referrals.referrerId, userId));
        let completedCount = 0;
        for (const r of userReferrals) {
          let currentStatus = r.status;
          if (currentStatus === "signup" && r.referredPlanType && r.referredPlanType !== "starter") {
            currentStatus = "completed";
            await db.update(referrals).set({ status: "completed" }).where((0, import_drizzle_orm3.eq)(referrals.id, r.id));
            r.status = "completed";
          }
          if (currentStatus === "completed") {
            completedCount++;
          }
        }
        if (user.referralCount !== completedCount) {
          const updates = { referralCount: completedCount };
          if (completedCount >= 10 && !user.isLifetimePro) {
            updates.isLifetimePro = true;
            updates.planType = "pro_lifetime";
          }
          await db.update(users).set(updates).where((0, import_drizzle_orm3.eq)(users.id, userId));
        }
        const emailInvites = await db.select().from(referralInvites).where((0, import_drizzle_orm3.eq)(referralInvites.referrerId, userId));
        const registeredEmails = new Set(
          userReferrals.map((r) => r.referredEmail?.toLowerCase()).filter(Boolean)
        );
        const pendingEmailInvites = emailInvites.filter(
          (inv) => !registeredEmails.has(inv.inviteeEmail.toLowerCase())
        );
        const referralsList = [
          ...userReferrals.map((r) => ({
            id: r.id,
            inviteId: null,
            name: r.referredName || "Convidado",
            email: r.referredEmail ? r.referredEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3") : "",
            emailFull: null,
            // não retornamos e-mail completo de cadastrados
            status: r.status,
            date: r.createdAt,
            canResend: false
            // já tem conta, não faz sentido reenviar
          })),
          ...pendingEmailInvites.map((inv) => ({
            id: inv.id,
            inviteId: inv.id,
            name: "Aguardando cadastro",
            email: inv.inviteeEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3"),
            emailFull: inv.inviteeEmail,
            // precisamos para reenviar
            status: "invited",
            date: inv.sentAt,
            canResend: true
          }))
        ];
        res.json({
          referralCode,
          completedReferrals: completedCount,
          totalReferrals: userReferrals.length,
          isLifetimePro: user.isLifetimePro ?? false,
          planType: user.planType ?? "starter",
          referrals: referralsList
        });
      } catch (err) {
        console.error("[Referral Stats Error]", err.message);
        res.status(500).json({ error: "Erro ao buscar dados de indica\xE7\xE3o." });
      }
    });
    router2.post("/invite", authMiddleware, async (req, res) => {
      try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "N\xE3o autenticado" });
        const { email } = req.body;
        if (!email || !email.includes("@")) {
          return res.status(400).json({ error: "Por favor, informe um e-mail v\xE1lido." });
        }
        const [referrer] = await db.select().from(users).where((0, import_drizzle_orm3.eq)(users.id, userId)).limit(1);
        if (!referrer) return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado" });
        if (referrer.email.toLowerCase() === email.toLowerCase()) {
          return res.status(400).json({ error: "Voc\xEA n\xE3o pode convidar a si mesmo." });
        }
        const [existingInvitee] = await db.select().from(users).where((0, import_drizzle_orm3.eq)(users.email, email.toLowerCase())).limit(1);
        if (existingInvitee) {
          return res.status(400).json({ error: "Este e-mail j\xE1 possui uma conta no KedGo!" });
        }
        let referralCode = referrer.referralCode;
        if (!referralCode || referralCode === "KED1") {
          referralCode = "KED10";
          await db.update(users).set({ referralCode: "KED10" }).where((0, import_drizzle_orm3.eq)(users.id, userId));
        }
        try {
          await db.insert(referralInvites).values({
            referrerId: userId,
            inviteeEmail: email.toLowerCase(),
            referralCode
          }).onConflictDoUpdate({
            target: [referralInvites.referrerId, referralInvites.inviteeEmail],
            set: { sentAt: import_drizzle_orm3.sql`NOW()`, referralCode }
          });
        } catch (insertErr) {
          console.warn("[Referral Invite - Insert Warning]", insertErr.message);
        }
        const appUrl = (process.env.APP_URL || "https://crm-ked-kedgo.crl0uj.easypanel.host").replace(/\/$/, "");
        const inviteUrl = `${appUrl}?ref=${referralCode}`;
        const emailPayload = buildReferralInviteEmail({
          referrerName: referrer.name || "Um amigo",
          inviteeEmail: email,
          referralCode,
          inviteUrl
        });
        let sent = false;
        try {
          const result = await sendEmail(emailPayload);
          sent = result.sent;
        } catch (sendErr) {
          console.warn("[Referral Email Warning]", sendErr.message);
          sent = false;
        }
        res.json({
          success: true,
          sent,
          message: sent ? `Convite enviado com sucesso para ${email}!` : `Convite registrado! O e-mail ser\xE1 entregue em breve.`
        });
      } catch (err) {
        console.error("[Referral Invite Error]", err.message);
        res.status(500).json({ error: "Erro ao enviar convite." });
      }
    });
    router2.post("/resend", authMiddleware, async (req, res) => {
      try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "N\xE3o autenticado" });
        const { inviteId } = req.body;
        if (!inviteId) return res.status(400).json({ error: "ID do convite n\xE3o informado." });
        const [invite] = await db.select().from(referralInvites).where((0, import_drizzle_orm3.and)((0, import_drizzle_orm3.eq)(referralInvites.id, inviteId), (0, import_drizzle_orm3.eq)(referralInvites.referrerId, userId))).limit(1);
        if (!invite) return res.status(404).json({ error: "Convite n\xE3o encontrado." });
        const [existingInvitee] = await db.select().from(users).where((0, import_drizzle_orm3.eq)(users.email, invite.inviteeEmail)).limit(1);
        if (existingInvitee) {
          await db.delete(referralInvites).where((0, import_drizzle_orm3.eq)(referralInvites.id, inviteId));
          return res.status(400).json({ error: "Este convidado j\xE1 se cadastrou no KedGo!" });
        }
        const [referrer] = await db.select().from(users).where((0, import_drizzle_orm3.eq)(users.id, userId)).limit(1);
        if (!referrer) return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado" });
        const appUrl = (process.env.APP_URL || "https://crm-ked-kedgo.crl0uj.easypanel.host").replace(/\/$/, "");
        const inviteUrl = `${appUrl}?ref=${invite.referralCode}`;
        const emailPayload = buildReferralInviteEmail({
          referrerName: referrer.name || "Um amigo",
          inviteeEmail: invite.inviteeEmail,
          referralCode: invite.referralCode,
          inviteUrl
        });
        await db.update(referralInvites).set({ sentAt: import_drizzle_orm3.sql`NOW()` }).where((0, import_drizzle_orm3.eq)(referralInvites.id, inviteId));
        let sent = false;
        try {
          const result = await sendEmail(emailPayload);
          sent = result.sent;
        } catch (sendErr) {
          console.warn("[Referral Resend Email Warning]", sendErr.message);
        }
        res.json({
          success: true,
          sent,
          message: sent ? `Convite reenviado para ${invite.inviteeEmail}!` : `Convite registrado novamente. O e-mail ser\xE1 entregue em breve.`
        });
      } catch (err) {
        console.error("[Referral Resend Error]", err.message);
        res.status(500).json({ error: "Erro ao reenviar convite." });
      }
    });
    router2.get("/validate/:code", async (req, res) => {
      try {
        const { code } = req.params;
        if (!code) return res.status(400).json({ valid: false });
        const cleanCode = code.trim().toUpperCase();
        if (cleanCode === "KED10" || cleanCode === "KED1") {
          return res.json({
            valid: true,
            referrerName: "KedGo Promocional (KED10)",
            isPromo: true
          });
        }
        const [referrer] = await db.select({ id: users.id, name: users.name }).from(users).where((0, import_drizzle_orm3.eq)(users.referralCode, cleanCode)).limit(1);
        if (!referrer) {
          return res.json({ valid: false });
        }
        res.json({
          valid: true,
          referrerName: referrer.name || "Um amigo"
        });
      } catch (err) {
        console.error("[Referral Validate Error]", err.message);
        res.json({ valid: false });
      }
    });
    referral_default = router2;
  }
});

// server.ts
var import_dns = __toESM(require("dns"), 1);
var import_express10 = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_fs2 = __toESM(require("fs"), 1);
init_db();
init_schema();

// src/routes/auth.ts
var import_express = require("express");
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var import_drizzle_orm2 = require("drizzle-orm");
init_db();
init_schema();
init_auth();
init_email();
var router = (0, import_express.Router)();
var simulatedEmails = [];
function formatUserResponse(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    planType: user.planType ?? "starter",
    isLifetimePro: user.isLifetimePro ?? false,
    createdAt: user.createdAt,
    trialStartedAt: user.trialStartedAt || user.createdAt,
    referralCode: user.referralCode,
    referralCount: user.referralCount ?? 0
  };
}
function getAppUrl(req) {
  if (process.env.APP_URL && process.env.APP_URL.trim()) {
    return process.env.APP_URL.trim().replace(/\/$/, "");
  }
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const host = req.headers["x-forwarded-host"] || req.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}
async function processReferralCode(newUserId, referralCode) {
  if (!referralCode || !referralCode.trim()) return;
  try {
    const code = referralCode.trim().toUpperCase();
    if (code === "KED10") {
      await db.update(users).set({ referredBy: "KED10" }).where((0, import_drizzle_orm2.eq)(users.id, newUserId));
      console.log(`[Referral] User ${newUserId} cadastrado via cupom promocional KED10.`);
      return;
    }
    const [referrer] = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.referralCode, code)).limit(1);
    if (!referrer || referrer.id === newUserId) return;
    await db.insert(referrals).values({
      referrerId: referrer.id,
      referredUserId: newUserId,
      status: "signup",
      rewardApplied: false
    });
    await db.update(users).set({ referredBy: code }).where((0, import_drizzle_orm2.eq)(users.id, newUserId));
    console.log(`[Referral] User ${newUserId} cadastrado via c\xF3digo ${code} de ${referrer.email}. Indica\xE7\xE3o pendente at\xE9 compra de produto.`);
  } catch (err) {
    console.error("[Referral Processing Error]", err.message);
  }
}
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, referralCode: refCode } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: "Preencha todos os campos" });
    const existingUser = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.email, email)).limit(1);
    if (existingUser.length > 0) return res.status(400).json({ error: "E-mail j\xE1 cadastrado" });
    const salt = await import_bcryptjs.default.genSalt(10);
    const passwordHash = await import_bcryptjs.default.hash(password, salt);
    const verificationToken = import_crypto.default.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 3600 * 1e3);
    const [newUser] = await db.insert(users).values({
      email,
      passwordHash,
      name,
      isVerified: false,
      provider: "email",
      passwordResetToken: verificationToken,
      passwordResetExpires: expires
    }).returning();
    await processReferralCode(newUser.id, refCode);
    const appUrl = getAppUrl(req);
    const verifyUrl = `${appUrl}?action=verify_email&token=${verificationToken}&email=${encodeURIComponent(email)}`;
    const emailPayload = buildAccountVerificationEmail({ name, email, verifyUrl });
    let sent = false;
    try {
      const emailRes = await sendEmail(emailPayload);
      sent = emailRes.sent;
    } catch (sendErr) {
      console.warn("[Register Email Warning] Could not send via SMTP, falling back to simulated inbox:", sendErr.message);
      sent = false;
    }
    if (!sent) {
      const indexList = [];
      simulatedEmails.forEach((m, idx) => {
        if (m.to.toLowerCase() === email.toLowerCase()) indexList.push(idx);
      });
      for (let i = indexList.length - 1; i >= 0; i--) simulatedEmails.splice(indexList[i], 1);
      simulatedEmails.push({
        id: import_crypto.default.randomUUID ? import_crypto.default.randomUUID() : Math.random().toString(),
        to: email,
        subject: emailPayload.subject,
        body: emailPayload.text || emailPayload.html,
        link: verifyUrl,
        date: /* @__PURE__ */ new Date()
      });
    }
    res.json({
      success: true,
      requiresVerification: true,
      message: "Conta criada com sucesso! Enviamos um e-mail de confirma\xE7\xE3o para ativar o seu acesso.",
      email
    });
  } catch (err) {
    res.status(500).json({ error: formatDbError(err) });
  }
});
router.post("/verify-email", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: "Token de verifica\xE7\xE3o ausente." });
    }
    const [user] = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.passwordResetToken, token)).limit(1);
    if (!user) {
      return res.status(400).json({ error: "Link de ativa\xE7\xE3o inv\xE1lido ou j\xE1 utilizado." });
    }
    if (user.passwordResetExpires && /* @__PURE__ */ new Date() > new Date(user.passwordResetExpires)) {
      return res.status(400).json({ error: "Link de ativa\xE7\xE3o expirado. Por favor, solicite um novo cadastro ou suporte." });
    }
    await db.update(users).set({
      isVerified: true,
      passwordResetToken: null,
      passwordResetExpires: null
    }).where((0, import_drizzle_orm2.eq)(users.id, user.id));
    const appToken = import_jsonwebtoken2.default.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      success: true,
      message: "Conta ativada com sucesso! Seja bem-vindo ao KedGo!.",
      token: appToken,
      user: formatUserResponse(user)
    });
  } catch (err) {
    res.status(500).json({ error: "Erro ao ativar conta: " + err.message });
  }
});
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Preencha e-mail e senha" });
    const [user] = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.email, email)).limit(1);
    if (!user || !user.passwordHash) return res.status(400).json({ error: "Credenciais inv\xE1lidas" });
    const isValid = await import_bcryptjs.default.compare(password, user.passwordHash);
    if (!isValid) return res.status(400).json({ error: "Credenciais inv\xE1lidas" });
    if (user.isVerified === false) {
      return res.status(400).json({
        error: "Sua conta ainda n\xE3o foi ativada por e-mail. Por favor, acesse o link enviado \xE0 sua caixa postal para ativar seu acesso."
      });
    }
    const token = import_jsonwebtoken2.default.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ success: true, token, user: formatUserResponse(user) });
  } catch (err) {
    res.status(500).json({ error: formatDbError(err) });
  }
});
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId && userId !== 0) return res.status(401).json({ error: "N\xE3o autenticado" });
    if (userId === 0) return res.json({ user: req.user });
    const [user] = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.id, userId)).limit(1);
    if (!user) return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado" });
    res.json({ user: formatUserResponse(user) });
  } catch (err) {
    res.status(500).json({ error: formatDbError(err) });
  }
});
router.post("/change-my-password", authMiddleware, async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    const userId = req.user?.id;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "A nova senha deve ter pelo menos 6 caracteres." });
    }
    let user;
    if (userId === 0 && email) {
      const [foundUser] = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.email, email)).limit(1);
      if (foundUser) {
        user = foundUser;
      } else {
        user = { id: 0, email, passwordHash: null };
      }
    } else {
      const [foundUser] = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.id, userId)).limit(1);
      user = foundUser;
    }
    if (!user) {
      return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado." });
    }
    if (user.passwordHash) {
      if (!currentPassword) {
        return res.status(400).json({ error: "A senha atual \xE9 obrigat\xF3ria." });
      }
      const isMatch = await import_bcryptjs.default.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ error: "A senha atual est\xE1 incorreta." });
      }
    }
    const saltRounds = 10;
    const hash = await import_bcryptjs.default.hash(newPassword, saltRounds);
    if (user.id === 0) {
      await db.insert(users).values({ email: user.email, name: "Viajante", passwordHash: hash });
    } else {
      await db.update(users).set({ passwordHash: hash }).where((0, import_drizzle_orm2.eq)(users.id, user.id));
    }
    res.json({ success: true, message: "Senha alterada com sucesso." });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Erro interno ao alterar a senha." });
  }
});
router.post("/gmail-signup", async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: "E-mail e Nome s\xE3o obrigat\xF3rios." });
    }
    const isGmailOfGoogle = email.toLowerCase().endsWith("@gmail.com");
    if (!isGmailOfGoogle) {
      return res.status(400).json({ error: "Por favor, utilize uma conta de e-mail do Google (@gmail.com) v\xE1lida." });
    }
    const [existingUser] = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.email, email)).limit(1);
    let targetUserId;
    let isNewAccount = false;
    if (!existingUser) {
      const [newUser] = await db.insert(users).values({
        email,
        name,
        passwordHash: null
      }).returning();
      targetUserId = newUser.id;
      isNewAccount = true;
    } else {
      targetUserId = existingUser.id;
      isNewAccount = false;
    }
    const token = import_crypto.default.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600 * 1e3);
    await db.update(users).set({
      passwordResetToken: token,
      passwordResetExpires: expires
    }).where((0, import_drizzle_orm2.eq)(users.id, targetUserId));
    const appUrl = getAppUrl(req);
    const resetUrl = `${appUrl}?action=setup_password&token=${token}&email=${encodeURIComponent(email)}`;
    const emailPayload = buildPasswordSetupEmail({ name: name || "Viajante", email, resetUrl, isNewAccount });
    const { sent } = await sendEmail(emailPayload);
    if (!sent) {
      simulatedEmails.push({
        id: import_crypto.default.randomUUID ? import_crypto.default.randomUUID() : Math.random().toString(),
        to: email,
        subject: emailPayload.subject,
        body: emailPayload.text || emailPayload.html,
        link: resetUrl,
        date: /* @__PURE__ */ new Date()
      });
    }
    res.json({
      success: true,
      message: "E-mail enviado! Um link de configura\xE7\xE3o foi enviado para o seu e-mail do Google Gmail.",
      email,
      isNewAccount
    });
  } catch (err) {
    console.error("Gmail signup error:", err);
    res.status(500).json({ error: "Erro ao registrar com Gmail: " + err.message });
  }
});
router.post("/gmail-verify-token", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: "Token de verifica\xE7\xE3o ausente." });
    }
    const [user] = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.passwordResetToken, token)).limit(1);
    if (!user) {
      return res.status(400).json({ error: "Link de verifica\xE7\xE3o inv\xE1lido ou j\xE1 utilizado." });
    }
    if (user.passwordResetExpires && /* @__PURE__ */ new Date() > new Date(user.passwordResetExpires)) {
      return res.status(400).json({ error: "O link de seguran\xE7a expirou. Solicite um novo envio." });
    }
    res.json({ success: true, email: user.email, name: user.name });
  } catch (err) {
    res.status(500).json({ error: "Erro ao verificar token: " + err.message });
  }
});
router.post("/gmail-set-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: "Token e senha de acesso s\xE3o necess\xE1rios." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "A senha de seguran\xE7a deve conter no m\xEDnimo 6 caracteres." });
    }
    const [user] = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.passwordResetToken, token)).limit(1);
    if (!user) {
      return res.status(400).json({ error: "Token inv\xE1lido." });
    }
    if (user.passwordResetExpires && /* @__PURE__ */ new Date() > new Date(user.passwordResetExpires)) {
      return res.status(400).json({ error: "O prazo de expira\xE7\xE3o do link de seguran\xE7a expirou." });
    }
    const salt = await import_bcryptjs.default.genSalt(10);
    const passwordHash = await import_bcryptjs.default.hash(password, salt);
    await db.update(users).set({
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null
    }).where((0, import_drizzle_orm2.eq)(users.id, user.id));
    const userEmail = user.email;
    const indexList = [];
    simulatedEmails.forEach((m, idx) => {
      if (m.to.toLowerCase() === userEmail.toLowerCase()) {
        indexList.push(idx);
      }
    });
    for (let i = indexList.length - 1; i >= 0; i--) {
      simulatedEmails.splice(indexList[i], 1);
    }
    const authToken = import_jsonwebtoken2.default.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
    res.json({
      success: true,
      message: "Senha definida com sucesso! Acesso concedido.",
      token: authToken,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (err) {
    res.status(500).json({ error: "Erro ao definir senha: " + err.message });
  }
});
router.post("/firebase-google-login", async (req, res) => {
  try {
    const { email, name, provider } = req.body;
    if (!email) {
      return res.status(400).json({ error: "E-mail do Firebase \xE9 obrigat\xF3rio." });
    }
    if (!db) {
      return res.status(503).json({
        error: "Banco de dados PostgreSQL n\xE3o conectado ou DATABASE_URL n\xE3o configurado. Por favor, verifique as configura\xE7\xF5es do banco de dados."
      });
    }
    let [existingUser] = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.email, email)).limit(1);
    if (!existingUser) {
      const { referralCode: refCode } = req.body;
      const [newUser] = await db.insert(users).values({
        email,
        name: name || email.split("@")[0],
        passwordHash: null,
        isVerified: true,
        provider: provider || "google"
      }).returning();
      existingUser = newUser;
      await processReferralCode(newUser.id, refCode);
    } else if (existingUser.isVerified === false) {
      await db.update(users).set({ isVerified: true }).where((0, import_drizzle_orm2.eq)(users.id, existingUser.id));
    }
    const appToken = import_jsonwebtoken2.default.sign(
      { id: existingUser.id, email: existingUser.email, name: existingUser.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      success: true,
      token: appToken,
      user: formatUserResponse(existingUser)
    });
  } catch (err) {
    console.error("Firebase Social Auth login error:", err);
    res.status(500).json({ error: formatDbError(err) });
  }
});
router.post("/firebase-social-login", async (req, res) => {
  try {
    const { email, name, provider } = req.body;
    if (!email) {
      return res.status(400).json({ error: "E-mail \xE9 obrigat\xF3rio." });
    }
    if (!db) {
      return res.status(503).json({
        error: "Banco de dados PostgreSQL n\xE3o conectado ou DATABASE_URL n\xE3o configurado. Por favor, verifique as configura\xE7\xF5es do banco de dados."
      });
    }
    let [existingUser] = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.email, email)).limit(1);
    if (!existingUser) {
      const { referralCode: refCode } = req.body;
      const [newUser] = await db.insert(users).values({
        email,
        name: name || email.split("@")[0],
        passwordHash: null,
        isVerified: true,
        provider: provider || "social"
      }).returning();
      existingUser = newUser;
      await processReferralCode(newUser.id, refCode);
    } else if (existingUser.isVerified === false) {
      await db.update(users).set({ isVerified: true }).where((0, import_drizzle_orm2.eq)(users.id, existingUser.id));
    }
    const appToken = import_jsonwebtoken2.default.sign(
      { id: existingUser.id, email: existingUser.email, name: existingUser.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      success: true,
      token: appToken,
      user: formatUserResponse(existingUser)
    });
  } catch (err) {
    console.error("Firebase Social Auth login error:", err);
    res.status(500).json({ error: formatDbError(err) });
  }
});
router.post("/gmail-google-login", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "E-mail \xE9 obrigat\xF3rio." });
    }
    const isGmailOfGoogle = email.toLowerCase().endsWith("@gmail.com");
    if (!isGmailOfGoogle) {
      return res.status(400).json({ error: "Por favor, utilize uma conta de e-mail do Google (@gmail.com) v\xE1lida." });
    }
    const [user] = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.email, email)).limit(1);
    if (!user) {
      return res.status(404).json({ error: "Conta Gmail n\xE3o cadastrada. Por favor, clique em criar conta abaixo." });
    }
    if (!user.passwordHash) {
      const token = import_crypto.default.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 3600 * 1e3);
      await db.update(users).set({
        passwordResetToken: token,
        passwordResetExpires: expires
      }).where((0, import_drizzle_orm2.eq)(users.id, user.id));
      const appUrl = getAppUrl(req);
      const resetUrl = `${appUrl}?action=setup_password&token=${token}&email=${encodeURIComponent(user.email)}`;
      const indexList = [];
      simulatedEmails.forEach((m, idx) => {
        if (m.to.toLowerCase() === user.email.toLowerCase()) indexList.push(idx);
      });
      for (let i = indexList.length - 1; i >= 0; i--) simulatedEmails.splice(indexList[i], 1);
      const emailPayload = buildPasswordSetupEmail({
        name: user.name || "Viajante",
        email: user.email,
        resetUrl,
        isNewAccount: false
      });
      const { sent } = await sendEmail(emailPayload);
      if (!sent) {
        simulatedEmails.push({
          id: import_crypto.default.randomUUID ? import_crypto.default.randomUUID() : Math.random().toString(),
          to: user.email,
          subject: emailPayload.subject,
          body: emailPayload.text || emailPayload.html,
          link: resetUrl,
          date: /* @__PURE__ */ new Date()
        });
      }
      return res.status(400).json({
        error: "Esta conta foi cadastrada, mas sua senha de seguran\xE7a ainda n\xE3o est\xE1 ativa. Como voc\xEA tentou logar, acabamos de gerar e enviar um link para configurar sua senha na sua Caixa de Entrada Simulada abaixo! Por favor, verifique-a e crie sua senha.",
        requiresPasswordSetup: true
      });
    }
    const appToken = import_jsonwebtoken2.default.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
    res.json({
      success: true,
      token: appToken,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (err) {
    res.status(500).json({ error: "Erro no login com Google: " + err.message });
  }
});
var auth_default = router;

// src/routes/dev.ts
var import_express3 = require("express");
var router3 = (0, import_express3.Router)();
router3.get("/last-emails", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.json([]);
    }
    const filtered = simulatedEmails.filter(
      (m) => m.to.toLowerCase() === String(email).toLowerCase()
    );
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.delete("/last-emails/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const index = simulatedEmails.findIndex((m) => m.id === id);
    if (index !== -1) {
      simulatedEmails.splice(index, 1);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.post("/simulate-purchase", async (req, res) => {
  try {
    const { userEmail, planType } = req.body;
    if (!userEmail) return res.status(400).json({ error: "userEmail \xE9 obrigat\xF3rio" });
    const targetPlan = planType === "pass" ? "pass" : "pro_lifetime";
    const isPro = targetPlan === "pro_lifetime";
    const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { users: users2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { eq: eq11 } = await import("drizzle-orm");
    const [updatedUser] = await db2.update(users2).set({
      planType: targetPlan,
      isLifetimePro: isPro
    }).where(eq11(users2.email, userEmail.toLowerCase().trim())).returning();
    if (!updatedUser) {
      return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado no banco de dados." });
    }
    const { completeReferralForUser: completeReferralForUser2 } = await Promise.resolve().then(() => (init_referral(), referral_exports));
    await completeReferralForUser2(updatedUser.id);
    res.json({
      success: true,
      message: `Compra simulada com sucesso! Usu\xE1rio ${userEmail} atualizado para ${targetPlan}.`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        planType: updatedUser.planType,
        isLifetimePro: updatedUser.isLifetimePro
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
var dev_default = router3;

// src/routes/itineraries.ts
var import_express4 = require("express");
var import_drizzle_orm5 = require("drizzle-orm");
init_db();
init_schema();
init_auth();

// src/services/itineraryStorage.ts
init_schema();
var import_drizzle_orm4 = require("drizzle-orm");
function mapItineraryFromDb(itinerary) {
  const prefix = `${itinerary.id}_`;
  const strip = (id) => {
    if (!id) return "";
    return id.startsWith(prefix) ? id.slice(prefix.length) : id;
  };
  return {
    id: itinerary.id,
    ownerId: itinerary.ownerId,
    title: itinerary.title,
    ecoMode: itinerary.ecoMode || false,
    data: {
      travelers: (itinerary.travelers || []).map((t) => ({
        ...t,
        id: strip(t.id)
      })),
      destinations: (itinerary.destinations || []).map((d) => ({
        id: strip(d.id),
        city: d.city,
        state: d.state,
        country: d.country,
        dates: d.dates,
        startDate: d.startDate,
        endDate: d.endDate,
        hotelName: d.hotelName,
        hotelLink: d.hotelLink,
        hotelAddress: d.hotelAddress,
        hotelCoords: d.hotelCoordsLat && d.hotelCoordsLng ? { lat: d.hotelCoordsLat, lng: d.hotelCoordsLng } : void 0,
        checkInTime: d.checkInTime,
        checkOutTime: d.checkOutTime,
        checkInDate: d.checkInDate,
        notes: d.notes,
        ratings: (() => {
          if (!d.ratings) return {};
          try {
            return typeof d.ratings === "string" ? JSON.parse(d.ratings) : d.ratings;
          } catch {
            return {};
          }
        })(),
        days: (d.days || []).map((day) => ({
          id: strip(day.id),
          dayNumber: day.dayNumber,
          dateStr: day.dateStr,
          title: day.title,
          activities: (day.activities || []).map((act) => ({
            ...act,
            id: strip(act.id),
            dayId: strip(act.dayId)
          }))
        })).sort((a, b) => a.dayNumber - b.dayNumber)
      })),
      costs: (itinerary.costs || []).map((c) => ({
        ...c,
        id: strip(c.id),
        destinationId: c.destinationId ? strip(c.destinationId) : null
      })),
      costCategories: (itinerary.costCategories || []).map((cc) => ({
        ...cc,
        id: strip(cc.id)
      })),
      documents: (itinerary.documents || []).map((doc) => ({
        ...doc,
        id: strip(doc.id)
      })),
      flights: (itinerary.flights || []).map((f) => ({
        ...f,
        id: strip(f.id),
        passengersList: (f.passengersList || []).map((p) => ({
          ...p,
          id: strip(p.id),
          flightId: strip(p.flightId)
        }))
      })),
      generalTips: (itinerary.generalTips || []).map((tip) => ({
        ...tip,
        id: strip(tip.id)
      })),
      notifications: (itinerary.notifications || []).map((n) => ({
        ...n,
        id: strip(n.id)
      })),
      transactionLogs: (itinerary.transactionLogs || []).map((log) => ({
        ...log,
        id: strip(log.id)
      }))
    }
  };
}
async function saveItineraryData(tx, itineraryId, data, options = {}) {
  const {
    existingFlights = [],
    existingDocuments = [],
    existingCosts = [],
    existingActivities = []
  } = options;
  const prefix = `${itineraryId}_`;
  const p = (id, prefixType) => {
    if (!id) return `${prefix}${prefixType}-${Math.random().toString(36).substring(7)}`;
    const strId = String(id);
    if (strId.startsWith(prefix)) return strId;
    return `${prefix}${strId}`;
  };
  const seenTravelers = /* @__PURE__ */ new Set();
  const seenCostCategories = /* @__PURE__ */ new Set();
  const seenDestinations = /* @__PURE__ */ new Set();
  const seenDays = /* @__PURE__ */ new Set();
  const seenActivities = /* @__PURE__ */ new Set();
  const seenCosts = /* @__PURE__ */ new Set();
  const seenDocuments = /* @__PURE__ */ new Set();
  const seenFlights = /* @__PURE__ */ new Set();
  const seenPassengers = /* @__PURE__ */ new Set();
  const seenTips = /* @__PURE__ */ new Set();
  const seenNotifications = /* @__PURE__ */ new Set();
  const seenLogs = /* @__PURE__ */ new Set();
  if (data.travelers && data.travelers.length > 0) {
    const travelersToInsert = [];
    data.travelers.forEach((t) => {
      let tId = p(t.id, "t");
      if (seenTravelers.has(tId)) {
        tId = `${prefix}t-${Math.random().toString(36).substring(7)}-dup`;
      }
      seenTravelers.add(tId);
      travelersToInsert.push({
        id: tId,
        itineraryId,
        name: t.name || "",
        role: t.role || "",
        email: t.email || "",
        checkedActivities: t.checkedActivities || "",
        packingItems: t.packingItems || "",
        createdByEmail: t.createdByEmail || null
      });
    });
    if (travelersToInsert.length > 0) {
      await tx.insert(travelers).values(travelersToInsert);
    }
  }
  if (data.costCategories && data.costCategories.length > 0) {
    const costCategoriesToInsert = [];
    data.costCategories.forEach((c) => {
      let ccId = p(c.id, "cc");
      if (seenCostCategories.has(ccId)) {
        ccId = `${prefix}cc-${Math.random().toString(36).substring(7)}-dup`;
      }
      seenCostCategories.add(ccId);
      costCategoriesToInsert.push({
        id: ccId,
        itineraryId,
        label: c.label || "",
        color: c.color || "#94A3B8"
      });
    });
    if (costCategoriesToInsert.length > 0) {
      await tx.insert(costCategories).values(costCategoriesToInsert);
    }
  }
  if (data.destinations && data.destinations.length > 0) {
    const dbDestinationsValues = [];
    data.destinations.forEach((d) => {
      let dId = p(d.id, "d");
      if (seenDestinations.has(dId)) {
        dId = `${prefix}d-${Math.random().toString(36).substring(7)}-dup`;
      }
      seenDestinations.add(dId);
      dbDestinationsValues.push({
        id: dId,
        itineraryId,
        city: d.city || "",
        state: d.state || "",
        country: d.country || "",
        dates: d.dates || "",
        startDate: d.startDate || d.dates?.split(" - ")[0] || "",
        endDate: d.endDate || d.dates?.split(" - ")[1] || "",
        hotelName: d.hotelName || "",
        hotelLink: d.hotelLink || "",
        hotelAddress: d.hotelAddress || "",
        hotelCoordsLat: d.hotelCoords?.lat ?? null,
        hotelCoordsLng: d.hotelCoords?.lng ?? null,
        checkInTime: d.checkInTime || "",
        checkOutTime: d.checkOutTime || "",
        checkInDate: d.checkInDate || "",
        notes: d.notes || "",
        ratings: d.ratings ? typeof d.ratings === "object" ? JSON.stringify(d.ratings) : String(d.ratings) : "",
        createdByEmail: d.createdByEmail || null
      });
    });
    await tx.insert(destinations).values(dbDestinationsValues);
    const daysToInsert = [];
    const activitiesToInsert = [];
    data.destinations.forEach((d, dIdx) => {
      if (d.days && d.days.length > 0) {
        d.days.forEach((day) => {
          let dayDbId = p(day.id, "day");
          if (seenDays.has(dayDbId)) {
            dayDbId = `${prefix}day-${Math.random().toString(36).substring(7)}-dup`;
          }
          seenDays.add(dayDbId);
          daysToInsert.push({
            id: dayDbId,
            destinationId: dbDestinationsValues[dIdx].id,
            dayNumber: day.dayNumber || 0,
            dateStr: day.dateStr || "",
            title: day.title || ""
          });
          if (day.activities && day.activities.length > 0) {
            day.activities.forEach((act) => {
              let fileData = act.ticketFileData || "";
              if (fileData === "(large_preview_hidden_in_local_storage)") {
                const found = existingActivities.find((ea) => p(ea.id, "act") === p(act.id, "act"));
                if (found && found.ticketFileData && found.ticketFileData !== "(large_preview_hidden_in_local_storage)") {
                  fileData = found.ticketFileData;
                }
              }
              let actDbId = p(act.id, "act");
              if (seenActivities.has(actDbId)) {
                actDbId = `${prefix}act-${Math.random().toString(36).substring(7)}-dup`;
              }
              seenActivities.add(actDbId);
              activitiesToInsert.push({
                id: actDbId,
                dayId: dayDbId,
                time: act.time || "",
                type: act.type || null,
                location: act.location || "",
                duration: act.duration || "",
                cost: act.cost || "",
                mapsQuery: act.mapsQuery || "",
                websiteLink: act.websiteLink || "",
                parking: act.parking || "",
                notes: act.notes || "",
                ticketFileName: act.ticketFileName || "",
                ticketFileData: fileData,
                date: act.date || "",
                createdByEmail: act.createdByEmail || null
              });
            });
          }
        });
      }
    });
    if (daysToInsert.length > 0) {
      await tx.insert(itineraryDays).values(daysToInsert);
    }
    if (activitiesToInsert.length > 0) {
      const chunkSize = 20;
      for (let i = 0; i < activitiesToInsert.length; i += chunkSize) {
        const chunk = activitiesToInsert.slice(i, i + chunkSize);
        await tx.insert(activities).values(chunk);
      }
    }
  }
  if (data.costs && data.costs.length > 0) {
    const costsToInsert = [];
    data.costs.forEach((c) => {
      let costId = p(c.id, "c");
      if (seenCosts.has(costId)) {
        costId = `${prefix}c-${Math.random().toString(36).substring(7)}-dup`;
      }
      seenCosts.add(costId);
      let receiptData = c.receiptData || null;
      if (receiptData === "(large_preview_hidden_in_local_storage)") {
        const found = existingCosts.find((ec) => p(ec.id, "c") === p(c.id, "c"));
        if (found && found.receiptData && found.receiptData !== "(large_preview_hidden_in_local_storage)") {
          receiptData = found.receiptData;
        }
      }
      costsToInsert.push({
        id: costId,
        itineraryId,
        category: c.category || "",
        description: c.description || "",
        notes: c.notes || "",
        link: c.link || "",
        totalCostBRL: Number(c.totalCostBRL) || 0,
        status: c.status || "",
        dateRange: c.dateRange || "",
        destinationId: c.destinationId ? p(c.destinationId, "d") : null,
        isPersonal: c.isPersonal ?? false,
        createdByEmail: c.createdByEmail || null,
        receiptName: c.receiptName || null,
        receiptData
      });
    });
    if (costsToInsert.length > 0) {
      await tx.insert(costs).values(costsToInsert);
    }
  }
  if (data.documents && data.documents.length > 0) {
    const docsToInsert = [];
    data.documents.forEach((doc) => {
      let docId = p(doc.id, "doc");
      if (seenDocuments.has(docId)) {
        docId = `${prefix}doc-${Math.random().toString(36).substring(7)}-dup`;
      }
      seenDocuments.add(docId);
      let fileData = doc.fileData || "";
      if (fileData === "(large_preview_hidden_in_local_storage)") {
        const found = existingDocuments.find((ed) => p(ed.id, "doc") === p(doc.id, "doc"));
        if (found && found.fileData && found.fileData !== "(large_preview_hidden_in_local_storage)") {
          fileData = found.fileData;
        }
      }
      docsToInsert.push({
        id: docId,
        itineraryId,
        type: doc.type || "other",
        title: doc.title || "",
        airline: doc.airline || "",
        flightNumber: doc.flightNumber || "",
        passengerName: doc.passengerName || "",
        fileData,
        fileName: doc.fileName || "",
        notes: doc.notes || "",
        uploadedAt: doc.uploadedAt || (/* @__PURE__ */ new Date()).toISOString(),
        createdByEmail: doc.createdByEmail || null
      });
    });
    if (docsToInsert.length > 0) {
      await tx.insert(documents).values(docsToInsert);
    }
  }
  if (data.flights && data.flights.length > 0) {
    const flightsToInsert = data.flights.map((f) => {
      let flightId = p(f.id, "f");
      if (seenFlights.has(flightId)) {
        flightId = `${prefix}f-${Math.random().toString(36).substring(7)}-dup`;
      }
      seenFlights.add(flightId);
      let fileData = f.ticketFileData || "";
      if (fileData === "(large_preview_hidden_in_local_storage)") {
        const found = existingFlights.find((ef) => p(ef.id, "f") === p(f.id, "f"));
        if (found && found.ticketFileData && found.ticketFileData !== "(large_preview_hidden_in_local_storage)") {
          fileData = found.ticketFileData;
        }
      }
      return {
        id: flightId,
        itineraryId,
        airline: f.airline || "",
        logoUrl: f.logoUrl || "",
        flightCode: f.flightCode || "",
        departureCity: f.departureCity || "",
        departureCode: f.departureCode || "",
        departureTime: f.departureTime || "",
        arrivalCity: f.arrivalCity || "",
        arrivalCode: f.arrivalCode || "",
        arrivalTime: f.arrivalTime || "",
        duration: f.duration || "",
        dateStr: f.dateStr || "",
        arrivalDateStr: f.arrivalDateStr || "",
        status: f.status || "Confirmado",
        isDeleted: f.isDeleted || false,
        gate: f.gate || "",
        locator: f.locator || "",
        passengers: f.passengers || "",
        seats: f.seats || "",
        ticketFileName: f.ticketFileName || "",
        ticketFileData: fileData,
        createdByEmail: f.createdByEmail || null
      };
    });
    await tx.insert(flights).values(flightsToInsert);
    const passengersToInsert = [];
    data.flights.forEach((f, idx) => {
      const flightDbId = flightsToInsert[idx].id;
      if (f.passengersList && Array.isArray(f.passengersList)) {
        f.passengersList.forEach((pass) => {
          let passId = p(pass.id, "fp");
          if (seenPassengers.has(passId)) {
            passId = `${prefix}fp-${Math.random().toString(36).substring(7)}-dup`;
          }
          seenPassengers.add(passId);
          let fileData = pass.ticketFileData || null;
          if (fileData === "(large_preview_hidden_in_local_storage)") {
            const existingFlight = existingFlights.find((ef) => p(ef.id, "f") === p(f.id, "f"));
            const existingPassenger = existingFlight?.passengersList?.find((ep) => p(ep.id, "fp") === p(pass.id, "fp"));
            if (existingPassenger && existingPassenger.ticketFileData && existingPassenger.ticketFileData !== "(large_preview_hidden_in_local_storage)") {
              fileData = existingPassenger.ticketFileData;
            }
          }
          passengersToInsert.push({
            id: passId,
            flightId: flightDbId,
            name: pass.name || "",
            seat: pass.seat || "",
            ticketFileName: pass.ticketFileName || null,
            ticketFileData: fileData
          });
        });
      }
    });
    if (passengersToInsert.length > 0) {
      await tx.insert(flightPassengers).values(passengersToInsert);
    }
  }
  if (data.generalTips && data.generalTips.length > 0) {
    const tipsToInsert = [];
    data.generalTips.forEach((tip) => {
      let gtId = p(tip.id, "gt");
      if (seenTips.has(gtId)) {
        gtId = `${prefix}gt-${Math.random().toString(36).substring(7)}-dup`;
      }
      seenTips.add(gtId);
      tipsToInsert.push({
        id: gtId,
        itineraryId,
        category: tip.category || "",
        title: tip.title || "",
        content: tip.content || ""
      });
    });
    if (tipsToInsert.length > 0) {
      await tx.insert(generalTips).values(tipsToInsert);
    }
  }
  if (data.notifications && data.notifications.length > 0) {
    const notificationsToInsert = [];
    data.notifications.forEach((n) => {
      let notifId = p(n.id, "notif");
      if (seenNotifications.has(notifId)) {
        notifId = `${prefix}notif-${Math.random().toString(36).substring(7)}-dup`;
      }
      seenNotifications.add(notifId);
      notificationsToInsert.push({
        id: notifId,
        itineraryId,
        title: n.title || "",
        description: n.description || "",
        time: n.time || "",
        read: n.read || false,
        type: n.type || "system"
      });
    });
    if (notificationsToInsert.length > 0) {
      await tx.insert(notifications).values(notificationsToInsert);
    }
  }
  if (data.transactionLogs && data.transactionLogs.length > 0) {
    const logsToInsert = [];
    data.transactionLogs.forEach((log) => {
      let logId = p(log.id, "log");
      if (seenLogs.has(logId)) {
        logId = `${prefix}log-${Math.random().toString(36).substring(7)}-dup`;
      }
      seenLogs.add(logId);
      logsToInsert.push({
        id: logId,
        itineraryId,
        user: log.user || "",
        userEmail: log.userEmail || "",
        action: log.action || "",
        itemType: log.itemType || "",
        itemId: log.itemId ? p(log.itemId, "item") : "",
        itemDesc: log.itemDesc || "",
        timestamp: log.timestamp || ""
      });
    });
    if (logsToInsert.length > 0) {
      await tx.insert(transactionLogs).values(logsToInsert);
    }
  }
}
var recentAccessLogCache = /* @__PURE__ */ new Map();
async function shouldLogAccess(db2, email, itineraryId, accessLogsTable) {
  const normEmail = email.trim().toLowerCase();
  const key = `${normEmail}_${itineraryId || 0}`;
  const now = Date.now();
  const lastTime = recentAccessLogCache.get(key);
  if (lastTime && now - lastTime < 15 * 60 * 1e3) {
    return false;
  }
  recentAccessLogCache.set(key, now);
  try {
    const fifteenMinutesAgo = new Date(now - 15 * 60 * 1e3);
    const recentLogs = await db2.select().from(accessLogsTable).where(
      (0, import_drizzle_orm4.and)(
        (0, import_drizzle_orm4.eq)(accessLogsTable.userEmail, normEmail),
        itineraryId ? (0, import_drizzle_orm4.eq)(accessLogsTable.itineraryId, itineraryId) : import_drizzle_orm4.sql`${accessLogsTable.itineraryId} IS NULL`,
        import_drizzle_orm4.sql`${accessLogsTable.attemptedAt} > ${fifteenMinutesAgo}`
      )
    ).limit(1);
    if (recentLogs.length > 0) {
      return false;
    }
  } catch (err) {
    console.error("Error in shouldLogAccess check: ", err);
  }
  return true;
}

// src/routes/itineraries.ts
var router4 = (0, import_express4.Router)();
router4.get("/", authMiddleware, async (req, res) => {
  if (!db) return res.status(503).json({ error: "No DB configuration." });
  try {
    const cleanEmail = (req.user?.email || "").trim().toLowerCase();
    let travelerItineraryIds = [];
    if (cleanEmail) {
      const linkedTravelers = await db.select({ itineraryId: travelers.itineraryId }).from(travelers).where((0, import_drizzle_orm5.and)(
        (0, import_drizzle_orm5.isNotNull)(travelers.email),
        (0, import_drizzle_orm5.eq)(import_drizzle_orm5.sql`LOWER(TRIM(${travelers.email}))`, cleanEmail)
      ));
      travelerItineraryIds = Array.from(new Set(linkedTravelers.map((t) => t.itineraryId)));
    }
    let whereClause;
    if (travelerItineraryIds.length > 0) {
      whereClause = (0, import_drizzle_orm5.or)(
        (0, import_drizzle_orm5.eq)(itineraries.ownerId, req.user.id),
        (0, import_drizzle_orm5.inArray)(itineraries.id, travelerItineraryIds)
      );
    } else {
      whereClause = (0, import_drizzle_orm5.eq)(itineraries.ownerId, req.user.id);
    }
    const dbItineraries = await db.query.itineraries.findMany({
      where: whereClause,
      with: {
        travelers: true,
        costs: true,
        costCategories: true,
        documents: true,
        flights: {
          with: { passengersList: true }
        },
        generalTips: true,
        notifications: true,
        transactionLogs: true,
        destinations: {
          with: { days: { with: { activities: true } } }
        }
      }
    });
    try {
      if (dbItineraries.length > 0) {
        const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
        const clientIp = typeof ip === "string" ? ip : ip[0];
        const firstItinerary = dbItineraries[0];
        if (await shouldLogAccess(db, req.user.email, firstItinerary.id, accessLogs)) {
          await db.insert(accessLogs).values({
            itineraryId: firstItinerary.id,
            userEmail: req.user.email,
            status: "success",
            ipAddress: clientIp
          });
        }
      }
    } catch (err) {
      console.error("Erro ao registrar log de acesso para o itiner\xE1rio:", err);
    }
    const response = dbItineraries.map((itinerary) => mapItineraryFromDb(itinerary));
    const userRecord = await db.query.users.findFirst({
      where: (0, import_drizzle_orm5.eq)(users.id, req.user.id)
    });
    res.json({
      itineraries: response,
      favoriteItineraryId: userRecord?.favoriteItineraryId
    });
  } catch (error) {
    console.error("Fetch DB error:", error);
    res.status(500).json({ error: error.message });
  }
});
router4.post("/", authMiddleware, async (req, res) => {
  if (!db) return res.status(503).json({ error: "DATABASE_URL n\xE3o configurada." });
  try {
    const { title, data } = req.body;
    const [userRecord] = await db.select({ planType: users.planType, isLifetimePro: users.isLifetimePro }).from(users).where((0, import_drizzle_orm5.eq)(users.id, req.user.id)).limit(1);
    const isPro = userRecord?.isLifetimePro || userRecord?.planType === "pro_lifetime" || userRecord?.planType === "pass";
    if (!isPro) {
      const userItineraries = await db.select({ id: itineraries.id }).from(itineraries).where((0, import_drizzle_orm5.eq)(itineraries.ownerId, req.user.id));
      if (userItineraries.length >= 1) {
        return res.status(403).json({
          error: "O modo teste/gratuito permite gerenciar apenas 1 roteiro. Assine o KedGo Pro para criar roteiros ilimitados!",
          limitReached: true,
          planType: "starter"
        });
      }
    }
    const [itinerary] = await db.insert(itineraries).values({
      ownerId: req.user.id,
      title: title || "Nova Viagem",
      isShared: true
    }).returning();
    if (data) {
      await saveItineraryData(db, itinerary.id, data);
    }
    res.json({ success: true, itinerary: { id: itinerary.id, title: itinerary.title, data: data || {} } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: formatDbError(err) });
  }
});
router4.put("/:id", authMiddleware, async (req, res) => {
  if (!db) return res.status(503).json({ error: "DATABASE_URL n\xE3o configurada." });
  try {
    const itineraryId = parseInt(req.params.id);
    const { title, data, ecoMode } = req.body;
    if (isNaN(itineraryId)) return res.status(400).json({ error: "ID inv\xE1lido" });
    const [existing] = await db.select().from(itineraries).where((0, import_drizzle_orm5.eq)(itineraries.id, itineraryId)).limit(1);
    if (!existing) return res.status(404).json({ error: "Itiner\xE1rio n\xE3o encontrado" });
    if (existing.ownerId !== req.user.id) {
      const cleanEmail = req.user.email.trim().toLowerCase();
      const [isTraveler] = await db.select().from(travelers).where((0, import_drizzle_orm5.and)(
        (0, import_drizzle_orm5.eq)(travelers.itineraryId, itineraryId),
        (0, import_drizzle_orm5.eq)(import_drizzle_orm5.sql`LOWER(TRIM(${travelers.email}))`, cleanEmail)
      )).limit(1);
      if (!isTraveler) {
        return res.status(403).json({ error: "N\xE3o autorizado: Apenas o propriet\xE1rio ou viajantes podem editar." });
      }
    }
    await db.transaction(async (tx) => {
      let updateData = { updatedAt: /* @__PURE__ */ new Date() };
      if (title !== void 0) updateData.title = title;
      if (ecoMode !== void 0) updateData.ecoMode = ecoMode;
      await tx.update(itineraries).set(updateData).where((0, import_drizzle_orm5.eq)(itineraries.id, itineraryId));
      if (data) {
        const isPayloadEmpty = (!data.destinations || data.destinations.length === 0) && (!data.flights || data.flights.length === 0) && (!data.costs || data.costs.length === 0) && (!data.travelers || data.travelers.length <= 1);
        if (isPayloadEmpty) {
          const currentDestinations = await db.select().from(destinations).where((0, import_drizzle_orm5.eq)(destinations.itineraryId, itineraryId));
          const currentTravelers = await db.select().from(travelers).where((0, import_drizzle_orm5.eq)(travelers.itineraryId, itineraryId));
          if (currentDestinations.length > 0 || currentTravelers.length > 1) {
            console.warn(`[PUT /api/itineraries/${itineraryId}] Ignorando salvamento de payload vazio para proteger dados existentes.`);
            return res.json({ success: true, warning: "Payload vazio ignorado para preservar dados na nuvem." });
          }
        }
        let existingFlights = [];
        let existingDocuments = [];
        let existingCosts = [];
        let existingActivities = [];
        try {
          existingFlights = await tx.query.flights.findMany({
            where: (0, import_drizzle_orm5.eq)(flights.itineraryId, itineraryId),
            with: { passengersList: true }
          });
          existingDocuments = await tx.select().from(documents).where((0, import_drizzle_orm5.eq)(documents.itineraryId, itineraryId));
          existingCosts = await tx.select().from(costs).where((0, import_drizzle_orm5.eq)(costs.itineraryId, itineraryId));
          const existingDestinations = await tx.select().from(destinations).where((0, import_drizzle_orm5.eq)(destinations.itineraryId, itineraryId));
          const existingDestIds = existingDestinations.map((d) => d.id);
          if (existingDestIds.length > 0) {
            const existingDays = await tx.select().from(itineraryDays).where((0, import_drizzle_orm5.inArray)(itineraryDays.destinationId, existingDestIds));
            const existingDayIds = existingDays.map((dy) => dy.id);
            if (existingDayIds.length > 0) {
              existingActivities = await tx.select().from(activities).where((0, import_drizzle_orm5.inArray)(activities.dayId, existingDayIds));
            }
          }
        } catch (fetchErr) {
          console.error("Erro ao recuperar registros existentes para preservar arquivos:", fetchErr);
        }
        try {
          const existingDestinations = await tx.select().from(destinations).where((0, import_drizzle_orm5.eq)(destinations.itineraryId, itineraryId));
          const existingDestIds = existingDestinations.map((d) => d.id);
          if (existingDestIds.length > 0) {
            const existingDays = await tx.select().from(itineraryDays).where((0, import_drizzle_orm5.inArray)(itineraryDays.destinationId, existingDestIds));
            const existingDayIds = existingDays.map((dy) => dy.id);
            if (existingDayIds.length > 0) {
              await tx.delete(activities).where((0, import_drizzle_orm5.inArray)(activities.dayId, existingDayIds));
            }
            await tx.delete(itineraryDays).where((0, import_drizzle_orm5.inArray)(itineraryDays.destinationId, existingDestIds));
          }
        } catch (err) {
          console.error("Erro ao deletar de forma explicita dias e atividades:", err);
        }
        try {
          const existingFlightsForDelete = await tx.select().from(flights).where((0, import_drizzle_orm5.eq)(flights.itineraryId, itineraryId));
          const existingFlightIds = existingFlightsForDelete.map((f) => f.id);
          if (existingFlightIds.length > 0) {
            await tx.delete(flightPassengers).where((0, import_drizzle_orm5.inArray)(flightPassengers.flightId, existingFlightIds));
          }
        } catch (err) {
          console.error("Erro ao deletar de forma explicita passageiros de voo:", err);
        }
        await tx.delete(travelers).where((0, import_drizzle_orm5.eq)(travelers.itineraryId, itineraryId));
        await tx.delete(destinations).where((0, import_drizzle_orm5.eq)(destinations.itineraryId, itineraryId));
        await tx.delete(costs).where((0, import_drizzle_orm5.eq)(costs.itineraryId, itineraryId));
        await tx.delete(costCategories).where((0, import_drizzle_orm5.eq)(costCategories.itineraryId, itineraryId));
        await tx.delete(documents).where((0, import_drizzle_orm5.eq)(documents.itineraryId, itineraryId));
        await tx.delete(flights).where((0, import_drizzle_orm5.eq)(flights.itineraryId, itineraryId));
        await tx.delete(generalTips).where((0, import_drizzle_orm5.eq)(generalTips.itineraryId, itineraryId));
        await tx.delete(notifications).where((0, import_drizzle_orm5.eq)(notifications.itineraryId, itineraryId));
        await tx.delete(transactionLogs).where((0, import_drizzle_orm5.eq)(transactionLogs.itineraryId, itineraryId));
        await saveItineraryData(tx, itineraryId, data, {
          existingFlights,
          existingDocuments,
          existingCosts,
          existingActivities
        });
      }
    });
    res.json({ success: true, message: "Itiner\xE1rio atualizado com sucesso" });
  } catch (error) {
    console.error("Save error:", error);
    res.status(500).json({ error: error.message });
  }
});
router4.get("/:id/access_logs", authMiddleware, async (req, res) => {
  if (!db) return res.status(503).json({ error: "DATABASE_URL n\xE3o configurada." });
  try {
    const itineraryId = parseInt(req.params.id);
    if (isNaN(itineraryId)) return res.status(400).json({ error: "ID inv\xE1lido" });
    const [existing] = await db.select().from(itineraries).where((0, import_drizzle_orm5.eq)(itineraries.id, itineraryId)).limit(1);
    if (!existing) return res.status(404).json({ error: "Itiner\xE1rio n\xE3o encontrado" });
    if (existing.ownerId !== req.user.id) return res.status(403).json({ error: "N\xE3o autorizado" });
    let logs = [];
    try {
      logs = await db.select().from(accessLogs).where((0, import_drizzle_orm5.eq)(accessLogs.itineraryId, itineraryId)).orderBy(import_drizzle_orm5.sql`${accessLogs.attemptedAt} DESC`);
    } catch (err) {
      console.error("Erro ao carregar logs de acesso:", err);
    }
    res.json({ success: true, logs });
  } catch (error) {
    console.error("Access logs fetch error:", error);
    res.status(500).json({ error: error.message });
  }
});
router4.delete("/:id", authMiddleware, async (req, res) => {
  if (!db) return res.status(503).json({ error: "DATABASE_URL n\xE3o configurada." });
  try {
    const itineraryId = parseInt(req.params.id);
    if (isNaN(itineraryId)) return res.status(400).json({ error: "ID inv\xE1lido" });
    const [existing] = await db.select().from(itineraries).where((0, import_drizzle_orm5.eq)(itineraries.id, itineraryId)).limit(1);
    if (!existing) return res.status(404).json({ error: "Itiner\xE1rio n\xE3o encontrado" });
    if (existing.ownerId !== req.user.id) return res.status(403).json({ error: "N\xE3o autorizado" });
    await db.delete(itineraries).where((0, import_drizzle_orm5.eq)(itineraries.id, itineraryId));
    res.json({ success: true, message: "Itiner\xE1rio exclu\xEDdo com sucesso" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
var itineraries_default = router4;

// src/routes/chat.ts
var import_express5 = require("express");
var import_drizzle_orm6 = require("drizzle-orm");
init_db();
init_schema();
init_auth();
var import_jsonwebtoken3 = __toESM(require("jsonwebtoken"), 1);

// src/middleware/upload.ts
var import_multer = __toESM(require("multer"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var uploadDir = import_path.default.join(process.cwd(), "uploads");
if (!import_fs.default.existsSync(uploadDir)) {
  import_fs.default.mkdirSync(uploadDir, { recursive: true });
}
var storage = import_multer.default.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = import_path.default.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  }
});
var allowedMimetypes = [
  // Imagens
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  // Áudios (incluindo gravações de voz)
  "audio/webm",
  "audio/ogg",
  "audio/mp3",
  "audio/wav",
  "audio/mpeg",
  // Vídeos
  "video/mp4",
  "video/webm",
  "video/ogg",
  // Documentos
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
];
var chatUpload = (0, import_multer.default)({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (allowedMimetypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de arquivo n\xE3o suportado no chat."));
    }
  }
});

// src/routes/chat.ts
var router5 = (0, import_express5.Router)();
router5.post("/upload", authMiddleware, (req, res) => {
  chatUpload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado." });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      fileUrl,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size
    });
  });
});
var typingParticipants = {};
var sseConnections = /* @__PURE__ */ new Map();
function addSseClient(itineraryId, res) {
  if (!sseConnections.has(itineraryId)) {
    sseConnections.set(itineraryId, /* @__PURE__ */ new Set());
  }
  sseConnections.get(itineraryId).add(res);
}
function removeSseClient(itineraryId, res) {
  sseConnections.get(itineraryId)?.delete(res);
  if (sseConnections.get(itineraryId)?.size === 0) {
    sseConnections.delete(itineraryId);
  }
}
function broadcastToItinerary(itineraryId, event, data) {
  const clients = sseConnections.get(itineraryId);
  if (!clients || clients.size === 0) return;
  const payload = `event: ${event}
data: ${JSON.stringify(data)}

`;
  for (const res of clients) {
    try {
      res.write(payload);
    } catch {
    }
  }
}
router5.get("/stream/:itineraryId", async (req, res) => {
  if (!db) {
    res.status(503).json({ error: "DATABASE_URL n\xE3o configurada." });
    return;
  }
  const token = req.query.token;
  if (!token) {
    res.status(401).json({ error: "Token n\xE3o fornecido." });
    return;
  }
  let user;
  try {
    user = import_jsonwebtoken3.default.verify(token, JWT_SECRET);
  } catch {
    res.status(401).json({ error: "Token inv\xE1lido." });
    return;
  }
  const itId = parseInt(req.params.itineraryId);
  if (isNaN(itId)) {
    res.status(400).json({ error: "itineraryId inv\xE1lido." });
    return;
  }
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  addSseClient(itId, res);
  console.log(`[SSE] Cliente conectado: ${user.email} \u2192 itiner\xE1rio ${itId} (total: ${sseConnections.get(itId)?.size})`);
  try {
    const msgs = await db.select().from(chatMessages).where((0, import_drizzle_orm6.eq)(chatMessages.itineraryId, itId)).orderBy(chatMessages.timestamp);
    res.write(`event: connected
data: ${JSON.stringify({ messages: msgs })}

`);
  } catch (err) {
    res.write(`event: error
data: ${JSON.stringify({ error: err.message })}

`);
  }
  const heartbeat = setInterval(() => {
    try {
      res.write(`event: heartbeat
data: ${JSON.stringify({ ts: Date.now() })}

`);
    } catch {
      clearInterval(heartbeat);
    }
  }, 25e3);
  req.on("close", () => {
    clearInterval(heartbeat);
    removeSseClient(itId, res);
    console.log(`[SSE] Cliente desconectado: ${user.email} \u2192 itiner\xE1rio ${itId} (restam: ${sseConnections.get(itId)?.size ?? 0})`);
  });
});
router5.get("/:itineraryId", authMiddleware, async (req, res) => {
  if (!db) return res.status(503).json({ error: "DATABASE_URL n\xE3o configurada." });
  try {
    const itId = parseInt(req.params.itineraryId);
    if (isNaN(itId)) return res.json({ messages: [], typingUsers: [] });
    const username = (req.query.username || "").toString().trim();
    if (username) {
      const lowerUser = username.toLowerCase();
      const unreadMsgs = await db.select().from(chatMessages).where((0, import_drizzle_orm6.and)((0, import_drizzle_orm6.eq)(chatMessages.itineraryId, itId), (0, import_drizzle_orm6.eq)(chatMessages.isRead, false)));
      const idsToUpdate = unreadMsgs.filter((m) => m.recipientName && m.recipientName.trim().toLowerCase() === lowerUser).map((m) => m.id);
      if (idsToUpdate.length > 0) {
        await db.update(chatMessages).set({ isRead: true }).where((0, import_drizzle_orm6.inArray)(chatMessages.id, idsToUpdate));
      }
    }
    const sinceStr = req.query.since;
    let baseWhere = (0, import_drizzle_orm6.eq)(chatMessages.itineraryId, itId);
    if (sinceStr) {
      baseWhere = (0, import_drizzle_orm6.and)(baseWhere, import_drizzle_orm6.sql`${chatMessages.timestamp} > ${new Date(sinceStr)}`);
    }
    const msgs = await db.select().from(chatMessages).where(baseWhere).orderBy(chatMessages.timestamp);
    const now = Date.now();
    const typingUsers = [];
    if (typingParticipants[itId]) {
      for (const [user, timestamp2] of Object.entries(typingParticipants[itId])) {
        if (now - timestamp2 < 4e3) {
          if (user.trim().toLowerCase() !== username.toLowerCase()) typingUsers.push(user);
        } else {
          delete typingParticipants[itId][user];
        }
      }
    }
    res.json({ messages: msgs, typingUsers });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router5.post("/typing", authMiddleware, async (req, res) => {
  try {
    const { itineraryId, username, isTyping } = req.body;
    const itId = parseInt(itineraryId);
    if (isNaN(itId) || !username) {
      return res.status(400).json({ error: "Par\xE2metros inv\xE1lidos." });
    }
    if (!typingParticipants[itId]) typingParticipants[itId] = {};
    if (isTyping) {
      typingParticipants[itId][username] = Date.now();
    } else {
      delete typingParticipants[itId][username];
    }
    const now = Date.now();
    const typingUsers = Object.entries(typingParticipants[itId] || {}).filter(([, ts]) => now - ts < 4e3).map(([u]) => u);
    broadcastToItinerary(itId, "typing", { typingUsers });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router5.post("/", authMiddleware, async (req, res) => {
  if (!db) return res.status(503).json({ error: "DATABASE_URL n\xE3o configurada." });
  try {
    const { itineraryId, senderName, senderAvatar, recipientName, content, fileData, fileName, fileType, fileSize } = req.body;
    const itId = parseInt(itineraryId);
    if (isNaN(itId)) return res.status(400).json({ error: "Voc\xEA precisa sincronizar a viagem na nuvem para usar o chat." });
    const [msg] = await db.insert(chatMessages).values({
      id: "msg-" + Math.random().toString(36).substring(7),
      itineraryId: itId,
      senderName,
      senderAvatar,
      recipientName,
      content,
      fileData,
      fileName,
      fileType,
      fileSize
    }).returning();
    broadcastToItinerary(itId, "new_message", msg);
    res.json({ success: true, message: msg });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
var chat_default = router5;

// src/routes/ai.ts
var import_express6 = require("express");
var import_crypto2 = __toESM(require("crypto"), 1);
var import_drizzle_orm8 = require("drizzle-orm");
var import_genai2 = require("@google/genai");
init_db();
init_schema();
var import_drizzle_orm9 = require("drizzle-orm");
init_auth();

// src/middleware/geminiQuota.ts
init_db();
init_schema();
var import_drizzle_orm7 = require("drizzle-orm");
var MAX_PRO_CALLS_PER_DAY = 30;
var geminiQuotaMiddleware = async (req, res, next) => {
  const customUserApiKey = req.headers["x-gemini-api-key"]?.trim();
  if (customUserApiKey) {
    res.setHeader("X-AI-Mode", "personal-key");
    res.setHeader("X-AI-Remaining", "999");
    res.setHeader("X-AI-Limit", "unlimited");
    return next();
  }
  if (!req.user || req.user.id === 0) return next();
  const userId = req.user.id;
  const itineraryId = req.body?.itineraryId || req.query?.itineraryId || null;
  const dateStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  try {
    const [userRecord] = await db.select({ planType: users.planType, isLifetimePro: users.isLifetimePro }).from(users).where((0, import_drizzle_orm7.eq)(users.id, userId)).limit(1);
    const isPro = userRecord?.isLifetimePro || userRecord?.planType === "pro_lifetime" || userRecord?.planType === "pass";
    if (!isPro) {
      const isGeneratingItinerary = req.path.includes("generate-itinerary");
      const successfulGenerations = await db.select({ id: aiPromptLogs.id }).from(aiPromptLogs).where((0, import_drizzle_orm7.and)((0, import_drizzle_orm7.eq)(aiPromptLogs.userId, userId), (0, import_drizzle_orm7.eq)(aiPromptLogs.success, true)));
      const totalItinerariesGenerated = successfulGenerations.length;
      if (totalItinerariesGenerated >= 1 && (isGeneratingItinerary || req.path.includes("evaluate-prompt"))) {
        return res.status(403).json({
          error: "Voc\xEA atingiu o limite gratuito de 1 roteiro com IA. Assine o KedGo Pro para roteiros ilimitados ou cadastre sua pr\xF3pria chave gratuita do Google AI Studio nas Configura\xE7\xF5es!",
          limitReached: true,
          planType: "starter"
        });
      }
    } else {
      const existing2 = await db.query.apiUsageLogs.findFirst({
        where: (0, import_drizzle_orm7.and)(
          (0, import_drizzle_orm7.eq)(apiUsageLogs.userId, userId),
          (0, import_drizzle_orm7.eq)(apiUsageLogs.dateString, dateStr)
        )
      });
      const currentDayCount = existing2?.callCount ?? 0;
      if (currentDayCount >= MAX_PRO_CALLS_PER_DAY) {
        return res.status(429).json({
          error: `Limite di\xE1rio de seguran\xE7a da IA atingido (${MAX_PRO_CALLS_PER_DAY} usos/dia). Tente novamente amanh\xE3 ou utilize sua pr\xF3pria chave gratuita do Google Gemini nas Configura\xE7\xF5es.`
        });
      }
    }
    const existing = await db.query.apiUsageLogs.findFirst({
      where: (0, import_drizzle_orm7.and)(
        (0, import_drizzle_orm7.eq)(apiUsageLogs.userId, userId),
        (0, import_drizzle_orm7.eq)(apiUsageLogs.dateString, dateStr)
      )
    });
    if (existing) {
      await db.update(apiUsageLogs).set({
        callCount: existing.callCount + 1,
        updatedAt: /* @__PURE__ */ new Date()
      }).where((0, import_drizzle_orm7.eq)(apiUsageLogs.id, existing.id));
    } else {
      await db.insert(apiUsageLogs).values({
        userId,
        itineraryId,
        dateString: dateStr,
        callCount: 1
      });
    }
    const limit = isPro ? MAX_PRO_CALLS_PER_DAY : 1;
    const remaining = isPro ? Math.max(0, MAX_PRO_CALLS_PER_DAY - ((existing?.callCount ?? 0) + 1)) : 1;
    res.setHeader("X-AI-Remaining", remaining);
    res.setHeader("X-AI-Limit", limit);
  } catch (error) {
    console.warn("Failed to update API usage logs:", error);
  }
  next();
};

// src/services/ai.ts
var import_genai = require("@google/genai");
var AI_MODELS = {
  primary: "gemini-3.7-flash",
  // Principal: rápido, balanceado, multimodal, 1M tokens
  fallback1: "gemini-3.5-flash-lite",
  // Mais rápido/leve, alto volume, tarefas simples
  fallback2: "gemini-3.7-flash"
  // Redundante para garantir disponibilidade
};
var clientCache = /* @__PURE__ */ new Map();
function getGenAIClient(customApiKey) {
  const key = customApiKey?.trim() || process.env.GEMINI_API_KEY?.trim() || "";
  if (!key) throw new Error("Nenhuma API Key do Gemini configurada.");
  if (clientCache.has(key)) return clientCache.get(key);
  const client = new import_genai.GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
  clientCache.set(key, client);
  return client;
}
function isRateLimitError(err) {
  const msg = err?.message || JSON.stringify(err) || "";
  return msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("rate limit");
}
function isOverloadedError(err) {
  const msg = err?.message || JSON.stringify(err) || "";
  return msg.includes("503") || msg.includes("UNAVAILABLE") || msg.toLowerCase().includes("high demand") || msg.toLowerCase().includes("overloaded");
}
async function generateContentWithRetry(params, customApiKey, retries = 3, initialDelay = 1500) {
  const client = getGenAIClient(customApiKey);
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await client.models.generateContent(params);
    } catch (err) {
      lastError = err;
      if (isOverloadedError(err)) break;
      if (isRateLimitError(err) && !customApiKey?.trim()) break;
      if (i < retries - 1) {
        const sleepDelay = initialDelay * Math.pow(1.5, i);
        await new Promise((resolve) => setTimeout(resolve, sleepDelay));
      }
    }
  }
  const fallbackModel = AI_MODELS.fallback1;
  if (params.model !== fallbackModel) {
    try {
      console.warn(`[AI] Modelo ${params.model} indispon\xEDvel, tentando fallback: ${fallbackModel}`);
      return await client.models.generateContent({
        ...params,
        model: fallbackModel
      });
    } catch (fallbackErr) {
      lastError = fallbackErr;
    }
  }
  if (isRateLimitError(lastError)) {
    const customError = new Error(
      "Limite de requisi\xE7\xF5es do Gemini atingido. Aguarde alguns minutos ou configure sua pr\xF3pria chave gratuita do Google AI Studio (aistudio.google.com) nas configura\xE7\xF5es para uso ilimitado."
    );
    customError.status = 429;
    throw customError;
  }
  if (isOverloadedError(lastError)) {
    const customError = new Error(
      "Os servidores do Gemini est\xE3o sobrecarregados no momento. Tente novamente em alguns minutos."
    );
    customError.status = 503;
    throw customError;
  }
  throw lastError;
}

// src/utils.ts
function inferActivityType(location = "", notes = "") {
  const combined = `${location} ${notes}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const flightKeywords = [
    "voo",
    "flight",
    "aeroporto",
    "airport",
    "decolagem",
    "pouso",
    "boarding",
    "airline",
    "embarque",
    "desembarque",
    "passagem",
    "bilhete aereo",
    "copa",
    "latam",
    "gol",
    "azul",
    "tap",
    "american airlines",
    "united",
    "delta",
    "ryanair",
    "easyjet",
    "iberia",
    "air france",
    "lufthansa",
    "emirates",
    "trem",
    "train",
    "comboio",
    "metro",
    "subway",
    "onibus",
    "bus",
    "ferry",
    "barco",
    "boat",
    "balsa",
    "cruzeiro",
    "cruise",
    "transfer",
    "shuttle",
    "estacao ferroviaria",
    "estacao de trem",
    "estacao de onibus",
    "gare",
    "terminal rodoviario",
    "aluguel de carro",
    "rent a car",
    "locadora",
    "retirada do carro",
    "devolucao do carro",
    "deslocamento",
    "traslado",
    "trajeto",
    "conexao",
    "transito",
    "uber",
    "taxi"
  ];
  if (flightKeywords.some((kw) => combined.includes(kw))) {
    return "flight";
  }
  const hotelKeywords = [
    "hotel",
    "hospedagem",
    "pousada",
    "resort",
    "hostel",
    "check-in",
    "check in",
    "check-out",
    "check out",
    "booking",
    "airbnb",
    "pernoite",
    "acomodacao",
    "estadia",
    "alojamento",
    "quarto de hotel",
    "inn",
    "lodge",
    "suite",
    "dormir no hotel",
    "chegada ao hotel",
    "descanso no hotel"
  ];
  if (hotelKeywords.some((kw) => combined.includes(kw))) {
    return "hotel";
  }
  const diningKeywords = [
    "restaurant",
    "restaurante",
    "restaurantar",
    "jantar",
    "dinner",
    "almoco",
    "lunch",
    "cafe",
    "coffee",
    "cafeteria",
    "bistro",
    "bar",
    "pub",
    "taverna",
    "tavern",
    "osteria",
    "trattoria",
    "pizzaria",
    "pizza",
    "churrascaria",
    "lanche",
    "snack",
    "comida",
    "breakfast",
    "brunch",
    "padaria",
    "bakery",
    "confeitaria",
    "gastronomia",
    "degustacao",
    "wine tasting",
    "tasting",
    "gelato",
    "gelateria",
    "sorveteria",
    "sorvete",
    "vinicola",
    "bodega",
    "winery",
    "cervejaria",
    "brewery",
    "kavana",
    "eatery",
    "diner",
    "cuisine",
    "food",
    "refeicao",
    "doceria",
    "gourmet",
    "tasca",
    "cantina",
    "choperia",
    "buffet",
    "culinaria",
    "izakaya",
    "tapas",
    "marisqueira",
    "churrasco",
    "steakhouse",
    "cocktail",
    "sobremesa",
    "creperia",
    "hamburguer",
    "burger",
    "cerveza"
  ];
  if (diningKeywords.some((kw) => combined.includes(kw))) {
    return "dinner";
  }
  const otherKeywords = [
    "tempo livre",
    "horario livre",
    "livre para explorar",
    "livre escolha",
    "descanso",
    "sem programacao",
    "dia livre",
    "tarde livre",
    "manha livre"
  ];
  if (otherKeywords.some((kw) => combined.includes(kw))) {
    return "other";
  }
  const tourKeywords = [
    "tour",
    "passeio",
    "visita",
    "caminhada",
    "walk",
    "walking",
    "trilha",
    "trail",
    "hike",
    "hiking",
    "museu",
    "museum",
    "monumento",
    "monument",
    "capitol",
    "capitolio",
    "cathedral",
    "catedral",
    "igreja",
    "church",
    "basilica",
    "mesquita",
    "mosque",
    "templo",
    "temple",
    "mall",
    "shopping",
    "parque",
    "park",
    "praca",
    "square",
    "piazza",
    "aquario",
    "aquarium",
    "atracao",
    "estatua",
    "statue",
    "mirante",
    "viewpoint",
    "belvedere",
    "praia",
    "beach",
    "playa",
    "castelo",
    "castle",
    "palacio",
    "palace",
    "ruinas",
    "ruins",
    "centro historico",
    "old town",
    "cidade antiga",
    "fortaleza",
    "forte",
    "muralha",
    "muralhas",
    "wall",
    "walls",
    "gate",
    "portao",
    "stradun",
    "pile",
    "ponte",
    "bridge",
    "porto",
    "port",
    "baia",
    "bay",
    "mercado",
    "market",
    "bazar",
    "bazaar",
    "jardim",
    "garden",
    "botanico",
    "teleferico",
    "cable car",
    "funicular",
    "balao",
    "balloon",
    "show",
    "espetaculo",
    "teatro",
    "theatre",
    "theater",
    "opera",
    "lago",
    "lake",
    "cachoeira",
    "waterfall",
    "panoramico",
    "panoramic",
    "miradouro",
    "sightseeing",
    "explorar",
    "visitar",
    "conhecer",
    "safari",
    "mergulho",
    "snorkel",
    "skate",
    "bike",
    "bicicleta",
    "ilha",
    "island",
    "insider",
    "dica de insider",
    "historico",
    "cultural",
    "cenario",
    "ponto turistico",
    "atracao turistica",
    "farol",
    "canyon",
    "caverna",
    "cave",
    "observatorio",
    "planetario",
    "zoo",
    "zoologico",
    "patrimonio",
    "esplanada",
    "avenida",
    "boulevard",
    "orla",
    "calcadao",
    "memorial",
    "galeria",
    "gallery",
    "exposicao",
    "exhibition",
    "palais",
    "duomo",
    "coliseu",
    "colosseum",
    "acropole",
    "torre",
    "tower",
    "aqueduto"
  ];
  if (tourKeywords.some((kw) => combined.includes(kw))) {
    return "tour";
  }
  if (location && location.trim().length > 0) {
    return "tour";
  }
  return "other";
}

// src/routes/ai.ts
var router6 = (0, import_express6.Router)();
router6.post("/evaluate-prompt", authMiddleware, geminiQuotaMiddleware, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "O prompt n\xE3o pode ser vazio." });
    }
    const userApiKey = req.headers["x-gemini-api-key"]?.trim() || process.env.GEMINI_API_KEY;
    if (!userApiKey) {
      return res.json({
        isSpecific: false,
        reason: "Ol\xE1! Sou a KedIA, sua Arquiteta de Itiner\xE1rios. Para que seu roteiro fique hiperpersonalizado, selecione ou responda os pontos essenciais abaixo:",
        suggestedQuestions: [
          {
            id: "destination_transport",
            category: "Destino e Log\xEDstica B\xE1sica",
            question: "Qual o destino e como voc\xEA planeja se locomover (carro, transporte p\xFAblico, a p\xE9/Uber)?",
            options: ["Paris & Roma (Trem & Metr\xF4)", "T\xF3quio & Kyoto (Trens JR / Metr\xF4)", "Nova York (Metr\xF4 & A p\xE9)", "Orlando & Miami (Carro Alugado)", "Gramado & Canela (A p\xE9 & Uber)"],
            placeholder: "Ex: Roma e Floren\xE7a de trem de alta velocidade..."
          },
          {
            id: "duration_dates",
            category: "Destino e Log\xEDstica B\xE1sica",
            question: "Quantos dias exatos durar\xE1 a viagem e em qual \xE9poca/m\xEAs do ano?",
            options: ["5 dias (Pr\xF3ximas semanas)", "7 dias (F\xE9rias de Julho)", "10 dias (Primavera/Outono)", "14 dias ou mais"],
            placeholder: "Ex: 10 dias em outubro de 2026..."
          },
          {
            id: "group_profile",
            category: "Perfil do Grupo",
            question: "Quantas pessoas ir\xE3o viajar e qual o perfil do grupo?",
            options: ["Casal (Rom\xE2ntico)", "Fam\xEDlia com crian\xE7as", "Grupo de Amigos", "Solo / Viajante Individual", "Fam\xEDlia com Idosos"],
            placeholder: "Ex: Casal com 1 crian\xE7a de 7 anos..."
          },
          {
            id: "budget_pace",
            category: "Or\xE7amento e Estilo de Viagem",
            question: "Qual a faixa de or\xE7amento e o ritmo desejado para os dias?",
            options: ["Moderado / Confort\xE1vel (Ritmo Equilibrado)", "Econ\xF4mico / Mochileiro (Ritmo Intenso)", "Luxo & Exclusivo (Ritmo Relaxado)", "Moderado (Ritmo Intenso - Ver o m\xE1ximo)"],
            placeholder: "Ex: Or\xE7amento moderado, ritmo relaxado sem correria..."
          },
          {
            id: "interests_mustsee",
            category: "Interesses e Experi\xEAncias",
            question: "Quais s\xE3o os pilares priorit\xE1rios da viagem e h\xE1 atra\xE7\xF5es obrigat\xF3rias?",
            options: ["Gastronomia & Vinhos + Museus", "Natureza, Praias & Paisagens", "Hist\xF3ria, Monumentos & Cultura", "Compras, Vida Noturna & Shows", "Parques Tem\xE1ticos & Divers\xE3o"],
            placeholder: "Ex: Foco gastron\xF4mico, n\xE3o abro m\xE3o do Museu do Louvre..."
          }
        ]
      });
    }
    const response = await generateContentWithRetry({
      model: "gemini-3.7-flash",
      contents: `Prompt do Usu\xE1rio: "${prompt}"`,
      config: {
        systemInstruction: `Voc\xEA \xE9 a KedIA, Consultora S\xEAnior de Viagens e Arquiteta de Itiner\xE1rios hiperpersonalizados.
Sua miss\xE3o \xE9 criar roteiros eficientes, realistas, financeiramente precisos e atualizados.
Antes de gerar o roteiro, avalie rigorosamente o prompt inicial do usu\xE1rio de acordo com o [FASE 1: DIAGN\xD3STICO DO VIAJANTE].

Crit\xE9rios essenciais para um roteiro completo:
1. Destino e Log\xEDstica B\xE1sica (cidades espec\xEDficas, dura\xE7\xE3o em dias, meio de transporte planejado).
2. Perfil do Grupo (casal, fam\xEDlia, amigos, solo, presen\xE7a de crian\xE7as/idosos).
3. Or\xE7amento e Estilo de Viagem (faixa de custo: Econ\xF4mico, Moderado ou Luxo; ritmo: Intenso, Equilibrado ou Relaxado).
4. Interesses e Experi\xEAncias (gastronomia, cultura, natureza, compras, atra\xE7\xF5es obrigat\xF3rias e restri\xE7\xF5es).

REGRAS R\xCDGIDAS DE AVALIA\xC7\xC3O:
- Se qualquer um dos detalhes acima N\xC3O estiver 100% expl\xEDcito no prompt inicial, MARQUE "isSpecific" COMO false!
- Quando "isSpecific" for false, estruture de 3 a 5 perguntas objetivas, gentis e inteligentes em portugu\xEAs do Brasil organizadas pelos blocos do Diagn\xF3stico do Viajante.
- Para cada pergunta, ofere\xE7a 4 op\xE7\xF5es pr\xE1ticas e inspiradoras de resposta r\xE1pida ("options"), al\xE9m de um campo "category" e um "placeholder" com exemplo claro.

Retorne EXCLUSIVAMENTE um objeto JSON v\xE1lido correspondente a este schema:
{
  "isSpecific": boolean,
  "reason": string (resumo acolhedor da KedIA explicando os pontos que ser\xE3o personalizados com as respostas),
  "suggestedQuestions": [
    {
      "id": string (ex: "destination_transport", "duration_dates", "group_profile", "budget_pace", "interests_mustsee"),
      "category": string (ex: "Destino e Log\xEDstica B\xE1sica", "Perfil do Grupo", "Or\xE7amento e Estilo", "Interesses e Experi\xEAncias"),
      "question": string,
      "options": string[],
      "placeholder": string
    }
  ]
}`,
        responseMimeType: "application/json",
        temperature: 0.2
      }
    }, userApiKey);
    const text2 = response.text || "{}";
    const result = JSON.parse(text2.trim());
    res.json(result);
  } catch (err) {
    console.warn("Evaluation fallback triggered:", err?.message || err);
    res.json({
      isSpecific: false,
      reason: "Ol\xE1! Sou a KedIA. Vamos calibrar os detalhes do seu roteiro para ficar perfeito! Responda \xE0s op\xE7\xF5es r\xE1pidas abaixo:",
      suggestedQuestions: [
        {
          id: "destination_transport",
          category: "Destino e Log\xEDstica B\xE1sica",
          question: "Para quais cidades voc\xEA deseja ir e como prefere se locomover?",
          options: ["Paris & Roma (Trem & Metr\xF4)", "T\xF3quio & Kyoto (Trens JR / Metr\xF4)", "Nova York (Metr\xF4 & A p\xE9)", "Orlando & Miami (Carro Alugado)", "Gramado & Canela (A p\xE9 & Uber)"],
          placeholder: "Ex: Roma e Floren\xE7a de trem..."
        },
        {
          id: "duration_dates",
          category: "Destino e Log\xEDstica B\xE1sica",
          question: "Quantos dias de viagem e em que per\xEDodo/m\xEAs?",
          options: ["5 dias (Pr\xF3ximas semanas)", "7 dias (F\xE9rias de Julho)", "10 dias (Outubro)", "14 dias ou mais"],
          placeholder: "Ex: 7 dias em setembro de 2026..."
        },
        {
          id: "group_profile",
          category: "Perfil do Grupo",
          question: "Qual \xE9 o perfil de viajantes do grupo?",
          options: ["Casal (Rom\xE2ntico)", "Fam\xEDlia com crian\xE7as", "Grupo de Amigos", "Solo / Individual", "Melhor Idade"],
          placeholder: "Ex: Casal..."
        },
        {
          id: "budget_pace",
          category: "Or\xE7amento e Estilo de Viagem",
          question: "Qual o seu or\xE7amento e ritmo desejado?",
          options: ["Moderado / Confort\xE1vel (Equilibrado)", "Econ\xF4mico (Intenso - Ver tudo)", "Luxo & Exclusivo (Relaxado)", "Moderado (Relaxado)"],
          placeholder: "Ex: Moderado, ritmo tranquilo..."
        },
        {
          id: "interests_mustsee",
          category: "Interesses e Experi\xEAncias",
          question: "Quais s\xE3o os pilares priorit\xE1rios da viagem?",
          options: ["Gastronomia & Vinhos", "Hist\xF3ria, Museus & Monumentos", "Natureza, Praias & Trilhas", "Compras & Vida Noturna", "Parques & Lazer"],
          placeholder: "Ex: Bons restaurantes e museus..."
        }
      ]
    });
  }
});
router6.post("/optimize-route", authMiddleware, geminiQuotaMiddleware, async (req, res) => {
  try {
    const { city, activities: activities2 } = req.body;
    if (!city) {
      return res.status(400).json({ error: "O nome da cidade \xE9 obrigat\xF3rio." });
    }
    if (!activities2 || !Array.isArray(activities2) || activities2.length === 0) {
      return res.status(400).json({ error: "Nenhuma atividade fornecida para otimiza\xE7\xE3o." });
    }
    const userApiKey = req.headers["x-gemini-api-key"]?.trim() || process.env.GEMINI_API_KEY;
    if (!userApiKey) {
      return res.status(503).json({ error: "Chave Gemini API n\xE3o est\xE1 configurada no servidor (Settings > Secrets) nem no navegador." });
    }
    const minimalActivities = activities2.map((act) => ({
      id: act.id,
      time: act.time || "N\xE3o especificado",
      location: act.location || "Sem local espec\xEDfico",
      duration: act.duration || "N\xE3o especificada",
      notes: act.notes || "",
      latitude: act.latitude,
      longitude: act.longitude
    }));
    const response = await generateContentWithRetry({
      model: "gemini-3.7-flash",
      contents: `Cidade: "${city}"
Atividades:
${JSON.stringify(minimalActivities, null, 2)}`,
      config: {
        systemInstruction: `Voc\xEA \xE9 um guia tur\xEDstico e especialista em log\xEDstica urbana de viagens.
O usu\xE1rio fornecer\xE1 o nome de uma cidade de destino e uma lista de atividades que ele planeja realizar em um \xFAnico dia.
Sua miss\xE3o \xE9 reordenar essa lista de atividades para reduzir o tempo de deslocamento (proximidade geogr\xE1fica) e criar um itiner\xE1rio di\xE1rio que fa\xE7a sentido l\xF3gico das horas (manh\xE3 para tarde e noite, tempos de refei\xE7\xE3o adequados, etc.), considerando hor\xE1rios de funcionamento padr\xE3o da cidade.

Regras importantes:
1. Reordene as atividades pela l\xF3gica geogr\xE1fica real da cidade (ex: agrupar atra\xE7\xF5es pr\xF3ximas, evitar ziguezagues).
2. Proponha novos hor\xE1rios ("time" no formato de 24h, exemplo "09:00", "11:30") progressivos e organizados para cada atividade, cuidando para que uma atividade n\xE3o se sobreponha \xE0 outra considerando sua dura\xE7\xE3o.
3. Se alguma atividade tiver coordenadas (latitude e longitude), leve-as em s\xE9ria considera\xE7\xE3o.
4. Adicione opcionalmente uma pequena dica de log\xEDstica, transporte ou deslocamento no campo "notes" de cada atividade de forma resumida e inteligente (em portugu\xEAs do Brasil).
5. O resultado final deve conter TODOS os IDs de atividades originais enviados no mesmo array "optimizedOrderedIds" reordenado. N\xE3o adicione atividades fict\xEDcias que n\xE3o estavam na lista.

Retorne EXCLUSIVAMENTE um objeto JSON v\xE1lido correspondente a este schema:
{
  "optimizedOrderedIds": [
    {
      "id": string (ID original correspondente),
      "time": string (novo hor\xE1rio otimizado ex "09:30"),
      "notes": string (inclui a dica ou preserva o campo notes original com a nova dica \xFAtil curta)
    }
  ],
  "explanation": "Breve explica\xE7\xE3o sobre os benef\xEDcios da otimiza\xE7\xE3o proposta nesta rota (em portugu\xEAs)."
}`,
        responseMimeType: "application/json",
        temperature: 0.2
      }
    }, userApiKey);
    const text2 = response.text || "{}";
    const result = JSON.parse(text2.trim());
    const optimizedIds = result.optimizedOrderedIds || [];
    const mergedActivities = [];
    const placedIds = /* @__PURE__ */ new Set();
    for (const opt of optimizedIds) {
      const original = activities2.find((a) => a.id === opt.id);
      if (original) {
        mergedActivities.push({
          ...original,
          time: opt.time || original.time,
          notes: opt.notes ? opt.notes : original.notes
        });
        placedIds.add(original.id);
      }
    }
    for (const original of activities2) {
      if (!placedIds.has(original.id)) {
        mergedActivities.push(original);
      }
    }
    mergedActivities.sort((a, b) => {
      const timeA = a.time || "00:00";
      const timeB = b.time || "00:00";
      return timeA.localeCompare(timeB);
    });
    res.json({
      success: true,
      activities: mergedActivities,
      explanation: result.explanation || "Rota reordenada com sucesso!"
    });
  } catch (err) {
    console.error("Route optimization error:", err);
    res.status(500).json({ error: "Erro ao otimizar rota com IA: " + err.message });
  }
});
router6.post("/generate-itinerary", authMiddleware, geminiQuotaMiddleware, async (req, res) => {
  try {
    const { prompt, answers } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "O prompt n\xE3o pode ser vazio." });
    }
    const userApiKey = req.headers["x-gemini-api-key"]?.trim() || process.env.GEMINI_API_KEY;
    if (!userApiKey) {
      return res.status(503).json({ error: "Chave Gemini API n\xE3o est\xE1 configurada no servidor (Settings > Secrets) nem no navegador." });
    }
    let parsedAnswersStr = "";
    if (answers && Object.keys(answers).length > 0) {
      parsedAnswersStr = "\nPerguntas adicionais respondidas:\n" + Object.entries(answers).map(([key, val]) => `- ${key}: ${val}`).join("\n");
    }
    let requestedDays = 7;
    const promptMatch = prompt.match(/(\d+)\s*dias?/i);
    if (promptMatch) {
      requestedDays = parseInt(promptMatch[1], 10);
    }
    if (answers) {
      for (const val of Object.values(answers)) {
        if (typeof val === "string") {
          const match = val.match(/(\d+)\s*dias?/i);
          if (match) {
            requestedDays = parseInt(match[1], 10);
          }
        }
      }
    }
    const response = await generateContentWithRetry({
      model: "gemini-3.7-flash",
      contents: `Prompt original: "${prompt}"${parsedAnswersStr}`,
      config: {
        systemInstruction: `Voc\xEA \xE9 a KedIA, Consultora S\xEAnior de Viagens e Arquiteta de Itiner\xE1rios hiperpersonalizados da plataforma KedGo.
Sua miss\xE3o \xE9 executar a [FASE 2: ESTRUTURA DO ROTEIRO FINAL] com m\xE1xima excel\xEAncia, log\xEDstica fluida, realismo geogr\xE1fico e financeiro rigoroso (SEM ALUCINA\xC7\xD5ES DE PRE\xC7O OU DATAS).

\u{1F6A8} REGRA ABSOLUTA E INEGOCI\xC1VEL DE DURA\xC7\xC3O (OBRIGAT\xD3RIO):
- O usu\xE1rio especificou EXATAMENTE ${requestedDays} DIAS de viagem!
- O total de dias gerados somados em todos os destinos (no array "days" de cada destino, totalizando entre todos os destinos) DEVE SER EXATAMENTE ${requestedDays} DIAS (Do Dia 1 at\xE9 o Dia ${requestedDays}, numerados sequencialmente de 1 a ${requestedDays}).
- NUNCA retorne menos dias do que o solicitado (ex: se pediu 10 dias, retorne rigorosamente 10 dias de programa\xE7\xE3o completa).
- Se houver m\xFAltiplas cidades (ex: Dubrovnik, Split, Zagreb), divida os ${requestedDays} dias proporcionalmente entre elas (ex: 3 dias Dubrovnik, 3 dias Split, 4 dias Zagreb).

DIRETRIZES DA KEDIA PARA O ROTEIRO:

1. DURA\xC7\xC3O EXATA E QUANTIDADE DE DIAS:
   - Identifique a quantidade exata de dias informada no prompt ou no diagn\xF3stico (ex: "7 dias", "10 dias").
   - O array de dias "days" DEVE conter exatamente essa quantidade de dias somados entre todos os destinos (do Dia 1 ao \xFAltimo dia, sem saltar n\xFAmeros).
   - Se o usu\xE1rio especificou \xE9poca/datas (ex: "julho de 2026"), calibre as datas em startDate e endDate nos destinos.

2. LOG\xCDSTICA DE BASES E AGRUPAMENTO GEOGR\xC1FICO:
   - Organize as atividades de cada dia por proximidade geogr\xE1fica para eliminar ziguezagues e otimizar deslocamentos.
   - Para viagens de 7+ dias com m\xFAltiplos destinos, divida harmonicamente entre as cidades no array "destinations".
   - Cada dia deve ter divis\xE3o l\xF3gica das atividades entre MANH\xC3 (manh\xE3/in\xEDcio do dia), TARDE (almo\xE7o e passeios da tarde) e NOITE (jantar e atra\xE7\xF5es noturnas).

3. CLASSIFICA\xC7\xC3O OBRIGAT\xD3RIA E INTELIGENTE DE CADA ATIVIDADE (CAMPO "type"):
   - TODA e qualquer atividade no array "activities" DEVE ter o campo "type" preenchido com EXATAMENTE um destes 5 valores:
     * "tour": para TODOS os passeios tur\xEDsticos, atra\xE7\xF5es, museus, monumentos, caminhadas hist\xF3ricas, mirantes, parques, pra\xE7as, praias, castelos, templos, igrejas/catedrais, tours guiados, espet\xE1culos, shoppings/compras e pontos tur\xEDsticos. NUNCA cadastre atra\xE7\xF5es tur\xEDsticas como "other"!
     * "dinner": para TODAS as paradas gastron\xF4micas, almo\xE7os, jantares, restaurantes, caf\xE9s, bistr\xF4s, confeitarias, bares, pubs, padarias, degusta\xE7\xF5es e experi\xEAncias culin\xE1rias. NUNCA cadastre restaurantes ou paradas para comer como "other"!
     * "flight": para voos, traslados/transfers, viagens de trem, metr\xF4, balsas/ferries, \xF4nibus rodovi\xE1rios, retirada/devolu\xE7\xE3o de carro alugado e deslocamentos log\xEDsticos.
     * "hotel": para momentos de check-in, check-out, chegada ao hotel ou acomoda\xE7\xE3o/hospedagem.
     * "other": APENAS E EXCLUSIVAMENTE para tempo livre/descanso n\xE3o programado (ex: "Tarde livre para compras pessoais" ou "Descanso no hotel").

4. GASTRONOMIA REAL E RECOMENDA\xC7\xD5ES PR\xD3XIMAS:
   - Para cada dia, inclua pelo menos 1 a 2 op\xE7\xF5es gastron\xF4micas reais pr\xF3ximas \xE0s atra\xE7\xF5es visitadas (sempre com type: "dinner").
   - No campo "notes" da atividade de almo\xE7o/jantar, detalhe:
     * Nome do restaurante / bistr\xF4
     * Tipo de culin\xE1ria
     * Faixa de pre\xE7o (ex: $$ Econ\xF4mico, $$$ Moderado ou $$$$ Alta Gastronomia)
     * Se exige reserva antecipada.

5. DICAS DE INSIDER (1 a 3 POR DIA):
   - No campo "notes" das atividades principais de cada dia, inclua dicas valiosas de insider:
     * Melhor hor\xE1rio para fotos com luz ideal e sem multid\xF5es
     * Como furar ou evitar filas (ex: compra online de ingresso, entrada priorit\xE1ria)
     * Dicas de vestimenta (ex: ombros cobertos em templos/igrejas) ou passes de transporte ideais.

6. LOG\xCDSTICA, CHECKLIST, APPS E ALERTAS (no array "generalTips"):
   - Inclua dicas estruturadas categorizadas:
     * "Ingressos Antecipados": lista de atra\xE7\xF5es que exigem compra pr\xE9via obrigat\xF3ria.
     * "Aplicativos Recomendados": apps locais essenciais (transporte, mapas offline, delivery, c\xE2mbio).
     * "Seguran\xE7a & Golpes Comuns": pegadinhas tur\xEDsticas comuns no destino e como evit\xE1-las.
     * "Clima & Etiqueta": dicas de vestimenta, moeda, gorjetas e feriados que impactam o roteiro.

7. ESTIMATIVAS FINANCEIRAS E PRE\xC7OS REAIS:
   - Valores honestos no array "costs" de acordo com o padr\xE3o escolhido (Econ\xF4mico, Moderado ou Luxo).
   - N\xE3o infle pre\xE7os arbitrariamente.

Retorne EXCLUSIVAMENTE um objeto JSON v\xE1lido correspondente a este schema:
{
  "destinations": [
    {
      "id": string (ex: "dest-1"),
      "city": string,
      "state": string,
      "country": string,
      "dates": string (ex: "01 out. - 07 out."),
      "startDate": string (formato YYYY-MM-DD, ex: 2026-10-01),
      "endDate": string (formato YYYY-MM-DD, ex: 2026-10-07),
      "hotelName": string,
      "hotelAddress": string,
      "checkInTime": string (ex: "15:00"),
      "checkOutTime": string (ex: "11:00"),
      "notes": string (estrat\xE9gia da base de hospedagem e comodidades),
      "days": [
        {
          "id": string (ex: "day-1"),
          "dayNumber": number (numera\xE7\xE3o cont\xEDnua de 1 at\xE9 o total de dias),
          "dateStr": string (ex: "Quinta, 01 de Outubro"),
          "title": string (ex: "Manh\xE3 Hist\xF3rica + Tarde no Rio Sena e Gastronomia"),
          "activities": [
            {
              "id": string (ex: "act-1"),
              "time": string (formato 24h, ex: "09:00"),
              "type": "tour" | "dinner" | "flight" | "hotel" | "other" (CLASSIFICA\xC7\xC3O OBRIGAT\xD3RIA: use "tour" para atra\xE7\xF5es/museus/passeios/pontos tur\xEDsticos, "dinner" para restaurantes/caf\xE9s/refei\xE7\xF5es, "flight" para voos/trens/transfers, "hotel" para check-in/hospedagem, "other" para tempo livre),
              "location": string,
              "duration": string (ex: "2h"),
              "cost": string (ex: "Gratuito" ou "\u20AC 17 / R$ 95"),
              "mapsQuery": string (termo para busca exata no Google Maps),
              "notes": string (detalhes da atividade + Dica de Insider ou Recomenda\xE7\xE3o Gastron\xF4mica com tipo de culin\xE1ria e faixa de pre\xE7o)
            }
          ]
        }
      ]
    }
  ],
  "costs": [
    {
      "id": string (ex: "cost-1"),
      "category": "hotel" | "flight" | "car" | "activity" | "other",
      "description": string,
      "totalCostBRL": number,
      "status": "Pago" | "Pgto no local" | "Falta pagar"
    }
  ],
  "flights": [
    {
      "id": string (ex: "flight-1"),
      "airline": string,
      "flightCode": string,
      "departureCity": string,
      "departureCode": string,
      "departureTime": string,
      "arrivalCity": string,
      "arrivalCode": string,
      "arrivalTime": string,
      "duration": string,
      "dateStr": string (YYYY-MM-DD),
      "status": "Confirmado"
    }
  ],
  "generalTips": [
    {
      "id": string (ex: "tip-1"),
      "category": string (ex: "Ingressos Antecipados", "Aplicativos Recomendados", "Seguran\xE7a & Golpes Comuns", "Clima & Etiqueta"),
      "title": string,
      "content": string
    }
  ]
}`,
        responseMimeType: "application/json",
        temperature: 0.4
      }
    }, userApiKey);
    const text2 = response.text || "{}";
    const result = JSON.parse(text2.trim());
    if (result && Array.isArray(result.destinations) && result.destinations.length > 0) {
      let currentTotalDays = 0;
      result.destinations.forEach((dest) => {
        if (Array.isArray(dest.days)) currentTotalDays += dest.days.length;
      });
      if (currentTotalDays < requestedDays && currentTotalDays > 0) {
        const lastDest = result.destinations[result.destinations.length - 1];
        if (lastDest && Array.isArray(lastDest.days) && lastDest.days.length > 0) {
          const lastDay = lastDest.days[lastDest.days.length - 1];
          let nextDayNum = currentTotalDays + 1;
          while (currentTotalDays < requestedDays) {
            const clonedDay = JSON.parse(JSON.stringify(lastDay));
            clonedDay.id = `day-${nextDayNum}-${Date.now()}`;
            clonedDay.dayNumber = nextDayNum;
            clonedDay.title = `Dia de Explora\xE7\xE3o Completa / Experi\xEAncias Locais em ${lastDest.city} (Dia ${nextDayNum})`;
            lastDest.days.push(clonedDay);
            currentTotalDays++;
            nextDayNum++;
          }
        }
      }
    }
    if (result && Array.isArray(result.destinations)) {
      result.destinations.forEach((dest) => {
        if (Array.isArray(dest.days)) {
          dest.days.forEach((day) => {
            if (Array.isArray(day.activities)) {
              day.activities.forEach((act) => {
                const validTypes = ["tour", "dinner", "flight", "hotel", "other"];
                if (!act.type || !validTypes.includes(act.type) || act.type === "other") {
                  act.type = inferActivityType(act.location, act.notes);
                }
              });
            }
          });
        }
      });
    }
    try {
      const userId = req.user?.id ?? null;
      const city = result?.destinations?.[0]?.city || "";
      const country = result?.destinations?.[0]?.country || "";
      const dates = result?.destinations?.[0]?.dates || "";
      const generatedTitle = `${city}${country ? `, ${country}` : ""} ${dates ? `(${dates})` : ""}`.trim();
      await db.insert(aiPromptLogs).values({
        userId,
        originalPrompt: prompt,
        questions: answers && Object.keys(answers).length > 0 ? JSON.stringify(answers) : null,
        answers: answers && Object.keys(answers).length > 0 ? JSON.stringify(answers) : null,
        generatedTitle: generatedTitle || null,
        success: true
      });
    } catch (logErr) {
      console.warn("Failed to save AI prompt log:", logErr);
    }
    res.json(result);
  } catch (err) {
    console.error("Generation error:", err);
    res.status(500).json({ error: "Erro ao gerar roteiro estruturado com IA: " + err.message });
  }
});
router6.get("/prompt-templates", authMiddleware, async (req, res) => {
  try {
    const rows = await db.select({
      id: aiPromptLogs.id,
      originalPrompt: aiPromptLogs.originalPrompt,
      generatedTitle: aiPromptLogs.generatedTitle
    }).from(aiPromptLogs).where((0, import_drizzle_orm8.eq)(aiPromptLogs.success, true)).orderBy(import_drizzle_orm9.sql`RANDOM()`).limit(4);
    const templates = rows.map((row) => ({
      label: row.generatedTitle || row.originalPrompt.slice(0, 40),
      text: row.originalPrompt
    }));
    res.json({ templates });
  } catch (err) {
    console.error("prompt-templates error:", err);
    res.json({ templates: [] });
  }
});
router6.post("/ocr-flight", authMiddleware, geminiQuotaMiddleware, async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "O arquivo de imagem n\xE3o pode ser vazio." });
    }
    const userApiKey = req.headers["x-gemini-api-key"]?.trim() || process.env.GEMINI_API_KEY;
    if (!userApiKey) {
      return res.status(503).json({ error: "Chave Gemini API n\xE3o configurada no servidor nem no navegador." });
    }
    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/png",
        data: imageBase64
      }
    };
    const textPart = {
      text: `Analise cuidadosamente este bilhete de voo ou confirma\xE7\xE3o de embarque.
Extraia todas as informa\xE7\xF5es dos trechos de voo (segmentos de voo) presentes no documento.
Extraia campos cruciais como airline, flightCode, departureCity, departureCode, departureTime, arrivalCity, arrivalCode, arrivalTime, duration, dateStr, arrivalDateStr, gate, locator, passengers, seats, passengersList.
Retorne estritamente um JSON que cont\xE9m um array de voos.`
    };
    const response = await generateContentWithRetry({
      model: "gemini-3.7-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction: "Voc\xEA \xE9 um especialista em OCR e extra\xE7\xE3o estruturada de dados de cart\xF5es de embarque, recibos de viagem e de passagens a\xE9reas.",
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai2.Type.OBJECT,
          properties: {
            flights: {
              type: import_genai2.Type.ARRAY,
              items: {
                type: import_genai2.Type.OBJECT,
                properties: {
                  airline: { type: import_genai2.Type.STRING },
                  flightCode: { type: import_genai2.Type.STRING },
                  departureCity: { type: import_genai2.Type.STRING },
                  departureCode: { type: import_genai2.Type.STRING },
                  departureTime: { type: import_genai2.Type.STRING },
                  arrivalCity: { type: import_genai2.Type.STRING },
                  arrivalCode: { type: import_genai2.Type.STRING },
                  arrivalTime: { type: import_genai2.Type.STRING },
                  duration: { type: import_genai2.Type.STRING },
                  dateStr: { type: import_genai2.Type.STRING },
                  arrivalDateStr: { type: import_genai2.Type.STRING },
                  gate: { type: import_genai2.Type.STRING },
                  locator: { type: import_genai2.Type.STRING },
                  passengers: { type: import_genai2.Type.STRING },
                  seats: { type: import_genai2.Type.STRING },
                  passengersList: {
                    type: import_genai2.Type.ARRAY,
                    items: {
                      type: import_genai2.Type.OBJECT,
                      properties: {
                        name: { type: import_genai2.Type.STRING },
                        seat: { type: import_genai2.Type.STRING }
                      },
                      required: ["name"]
                    }
                  }
                },
                required: [
                  "airline",
                  "flightCode",
                  "departureCity",
                  "departureCode",
                  "departureTime",
                  "arrivalCity",
                  "arrivalCode",
                  "arrivalTime",
                  "dateStr"
                ]
              }
            }
          },
          required: ["flights"]
        },
        temperature: 0.1
      }
    }, userApiKey);
    const text2 = response.text || "{}";
    const result = JSON.parse(text2.trim());
    res.json(result);
  } catch (err) {
    console.error("Flight OCR Scan error:", err);
    res.status(500).json({ error: "Erro ao escanear bilhete com IA OCR: " + err.message });
  }
});
router6.post("/ocr-receipt", authMiddleware, geminiQuotaMiddleware, async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "O arquivo de imagem n\xE3o pode ser vazio." });
    }
    const userApiKey = req.headers["x-gemini-api-key"]?.trim() || process.env.GEMINI_API_KEY;
    if (!userApiKey) {
      return res.status(503).json({ error: "Chave Gemini API n\xE3o configurada no servidor nem no navegador." });
    }
    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/png",
        data: imageBase64
      }
    };
    const textPart = {
      text: `Analise cuidadosamente esta nota fiscal, cupom fiscal, recibo de viagem ou comanda de restaurante.
Fa\xE7a a transcri\xE7\xE3o dos itens principais e traduza tudo para o portugu\xEAs.
Extraia: description, category, totalCostBRL (number), notes.
Retorne estritamente um JSON que cont\xE9m estes campos.`
    };
    const response = await generateContentWithRetry({
      model: "gemini-3.7-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction: "Voc\xEA \xE9 um especialista em OCR, tradu\xE7\xE3o de idiomas e extra\xE7\xE3o estruturada de dados de cupons fiscais, recibos, despesas de viagem e comandas de restaurante de todo o mundo.",
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai2.Type.OBJECT,
          properties: {
            description: { type: import_genai2.Type.STRING },
            category: { type: import_genai2.Type.STRING },
            totalCostBRL: { type: import_genai2.Type.NUMBER },
            notes: { type: import_genai2.Type.STRING }
          },
          required: ["description", "category", "totalCostBRL", "notes"]
        },
        temperature: 0.1
      }
    }, userApiKey);
    const text2 = response.text || "{}";
    const result = JSON.parse(text2.trim());
    res.json(result);
  } catch (err) {
    console.error("Receipt OCR Scan error:", err);
    res.status(500).json({ error: "Erro ao escanear comanda com IA OCR: " + err.message });
  }
});
router6.post("/monitor-flight", authMiddleware, geminiQuotaMiddleware, async (req, res) => {
  try {
    const { flightCode, airline, departureCode, arrivalCode, currentStatus, forceCheckInOpen } = req.body;
    if (!flightCode) {
      return res.status(400).json({ error: "O c\xF3digo do voo \xE9 obrigat\xF3rio." });
    }
    const userApiKey = req.headers["x-gemini-api-key"]?.trim() || process.env.GEMINI_API_KEY;
    if (!userApiKey) {
      return res.status(503).json({ error: "Chave Gemini API n\xE3o configurada no servidor nem no navegador." });
    }
    const promptText = `Voc\xEA \xE9 um monitor autom\xE1tico inteligente integrado a um app de viagens. Seu objetivo \xE9 simular e retornar de forma realista/criativa o status de monitoramento do voo.
Voo de Refer\xEAncia: Voo ${flightCode} operado por ${airline || "N/A"} saindo de ${departureCode || "N/A"} com destino a ${arrivalCode || "N/A"}.
O status atual cadastrado na viagem \xE9: "${currentStatus || "Confirmado"}".

As op\xE7\xF5es de status v\xE1lidas s\xE3o estritamente: "Confirmado", "Atrasado", "Cancelado", "Embarque", "Check-in aberto" ou "Finalizado".
${forceCheckInOpen ? "IMPORTANTE: Voc\xEA DEVE OBRIGATORIAMENTE mudar o status do voo para 'Check-in aberto'." : ""}

Forne\xE7a a sa\xEDda estritamente em formato JSON.`;
    const response = await generateContentWithRetry({
      model: "gemini-3.7-flash",
      contents: { parts: [{ text: promptText }] },
      config: {
        systemInstruction: "Voc\xEA \xE9 um rob\xF4 perito de status de aeroporto e voos simulados do assistente de viagem.",
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai2.Type.OBJECT,
          properties: {
            status: {
              type: import_genai2.Type.STRING,
              description: "Novo status do voo."
            },
            previousStatus: { type: import_genai2.Type.STRING },
            statusChanged: { type: import_genai2.Type.BOOLEAN },
            gate: { type: import_genai2.Type.STRING },
            message: { type: import_genai2.Type.STRING }
          },
          required: ["status", "previousStatus", "statusChanged", "message"]
        },
        temperature: 0.7
      }
    }, userApiKey);
    const text2 = response.text || "{}";
    const result = JSON.parse(text2.trim());
    res.json(result);
  } catch (err) {
    console.error("Flight Monitoring error:", err);
    res.status(500).json({ error: "Erro ao monitorar status do voo com Gemini: " + err.message });
  }
});
router6.post("/nearby-search", authMiddleware, geminiQuotaMiddleware, async (req, res) => {
  try {
    const { itineraryId, destinationId, hotelName, hotelAddress, city, refresh } = req.body;
    if (!itineraryId || !destinationId) {
      return res.status(400).json({ error: "O ID do roteiro e ID do destino s\xE3o obrigat\xF3rios." });
    }
    const hName = hotelName || "";
    const hAddr = hotelAddress || hName || "";
    const cityName = city || "";
    if (!hAddr) {
      return res.status(400).json({ error: "\xC9 necess\xE1rio que a hospedagem tenha nome ou endere\xE7o preenchido para realizar a busca das proximidades." });
    }
    if (!refresh) {
      const cached = await db.select().from(nearbyPlaces).where((0, import_drizzle_orm8.eq)(nearbyPlaces.destinationId, destinationId));
      if (cached && cached.length > 0) {
        return res.json({ success: true, places: cached, cached: true });
      }
    }
    const userApiKey = req.headers["x-gemini-api-key"]?.trim() || process.env.GEMINI_API_KEY;
    if (!userApiKey) {
      return res.status(503).json({ error: "Chave Gemini API n\xE3o configurada no servidor nem no navegador." });
    }
    const promptText = `Fa\xE7a uma pesquisa detalhada de locais reais pr\xF3ximos ao ponto hoteleiro: ${hName}, ${hAddr}, ${cityName}.
Retorne 3 categorias: Food, Medical, Services.
Responda apenas em formato JSON Array.`;
    let text2 = "[]";
    try {
      const response = await generateContentWithRetry({
        model: "gemini-3.7-flash",
        contents: { parts: [{ text: promptText }] },
        config: {
          systemInstruction: "Voc\xEA \xE9 um crawler de intelig\xEAncia geogr\xE1fica que pesquisa dados de locais reais no Google Search para viajantes.",
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }],
          responseSchema: {
            type: import_genai2.Type.ARRAY,
            items: {
              type: import_genai2.Type.OBJECT,
              properties: {
                category: { type: import_genai2.Type.STRING },
                name: { type: import_genai2.Type.STRING },
                address: { type: import_genai2.Type.STRING },
                rating: { type: import_genai2.Type.STRING },
                distance: { type: import_genai2.Type.STRING },
                latitude: { type: import_genai2.Type.NUMBER },
                longitude: { type: import_genai2.Type.NUMBER },
                mapsLink: { type: import_genai2.Type.STRING }
              },
              required: ["category", "name", "address", "distance"]
            }
          },
          temperature: 0.3
        }
      }, userApiKey);
      text2 = response.text || "[]";
    } catch (apiError) {
      text2 = JSON.stringify([
        { category: "Food", name: "Restaurante e Bistr\xF4 Local", address: "Ao redor do centro", rating: "4.5", distance: "200m a p\xE9" },
        { category: "Food", name: "Mercado Principal", address: "Av. Central, 50", rating: "4.2", distance: "350m a p\xE9" },
        { category: "Medical", name: "Farm\xE1cia 24h", address: "Rua do Com\xE9rcio", rating: "4.0", distance: "450m a p\xE9" },
        { category: "Services", name: "Caixa Eletr\xF4nico", address: "Dentro da Conveni\xEAncia", rating: "4.5", distance: "350m a p\xE9" }
      ]);
    }
    let parsedPlaces = [];
    try {
      parsedPlaces = JSON.parse(text2.trim());
    } catch (e) {
      throw new Error("Resposta da IA estruturada incorretamente.");
    }
    if (Array.isArray(parsedPlaces)) {
      await db.delete(nearbyPlaces).where((0, import_drizzle_orm8.eq)(nearbyPlaces.destinationId, destinationId));
      for (const p of parsedPlaces) {
        if (!p.name) continue;
        const finalMapsLink = p.mapsLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.name} ${cityName || hAddr}`)}`;
        await db.insert(nearbyPlaces).values({
          id: import_crypto2.default.randomUUID(),
          itineraryId: Number(itineraryId),
          destinationId: String(destinationId),
          category: p.category || "pontos_importantes",
          name: p.name,
          address: p.address || null,
          rating: p.rating ? String(p.rating) : null,
          distance: p.distance || null,
          latitude: p.latitude ? parseFloat(String(p.latitude)) : null,
          longitude: p.longitude ? parseFloat(String(p.longitude)) : null,
          mapsLink: finalMapsLink
        });
      }
    }
    const results = await db.select().from(nearbyPlaces).where((0, import_drizzle_orm8.eq)(nearbyPlaces.destinationId, destinationId));
    res.json({ success: true, places: results, cached: false });
  } catch (err) {
    console.error("Nearby Search AI error:", err);
    res.status(500).json({ error: "Erro ao varrer arredores com IA: " + err.message });
  }
});
router6.get("/nearby-places", authMiddleware, async (req, res) => {
  try {
    const { destinationId } = req.query;
    if (!destinationId) {
      return res.status(400).json({ error: "O destinationId \xE9 obrigat\xF3rio" });
    }
    const results = await db.select().from(nearbyPlaces).where((0, import_drizzle_orm8.eq)(nearbyPlaces.destinationId, String(destinationId)));
    res.json({ places: results });
  } catch (err) {
    console.error("Get nearby places error:", err);
    res.status(500).json({ error: "Erro ao recuperar locais pr\xF3ximos salvos: " + err.message });
  }
});
router6.post("/save-places", authMiddleware, async (req, res) => {
  try {
    const { itineraryId, destinationId, places } = req.body;
    if (!destinationId || !places || !Array.isArray(places)) {
      return res.status(400).json({ error: "Par\xE2metros inv\xE1lidos para salvar locais." });
    }
    await db.delete(nearbyPlaces).where((0, import_drizzle_orm8.eq)(nearbyPlaces.destinationId, String(destinationId)));
    for (const p of places) {
      if (!p.name) continue;
      const finalMapsLink = p.mapsLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.name} ${p.address || ""}`)}`;
      await db.insert(nearbyPlaces).values({
        id: import_crypto2.default.randomUUID(),
        itineraryId: Number(itineraryId) || 0,
        destinationId: String(destinationId),
        category: p.category || "pontos_importantes",
        name: p.name,
        address: p.address || null,
        rating: p.rating ? String(p.rating) : null,
        distance: p.distance || null,
        latitude: p.latitude ? parseFloat(String(p.latitude)) : null,
        longitude: p.longitude ? parseFloat(String(p.longitude)) : null,
        mapsLink: finalMapsLink
      });
    }
    const results = await db.select().from(nearbyPlaces).where((0, import_drizzle_orm8.eq)(nearbyPlaces.destinationId, String(destinationId)));
    res.json({ success: true, places: results });
  } catch (err) {
    console.error("Save places error:", err);
    res.status(500).json({ error: "Erro ao salvar locais no banco: " + err.message });
  }
});
var ai_default = router6;

// src/routes/admin.ts
var import_express7 = require("express");
var import_drizzle_orm10 = require("drizzle-orm");
init_db();
init_schema();
init_auth();
var router7 = (0, import_express7.Router)();
router7.put("/users/favorite", authMiddleware, async (req, res) => {
  if (!db) return res.status(503).json({ error: "DATABASE_URL n\xE3o configurada." });
  try {
    const { itineraryId } = req.body;
    await db.update(users).set({ favoriteItineraryId: itineraryId ? Number(itineraryId) : null }).where((0, import_drizzle_orm10.eq)(users.id, req.user.id));
    res.json({ success: true, favoriteItineraryId: itineraryId });
  } catch (error) {
    console.error("Favorite setting error:", error);
    res.status(500).json({ error: "Erro ao favoritar viagem." });
  }
});
router7.post("/migrate-local", authMiddleware, async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: "DATABASE_URL n\xE3o configurada." });
  }
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ error: "Dados s\xE3o obrigat\xF3rios." });
    }
    const user = req.user;
    await db.delete(itineraries).where((0, import_drizzle_orm10.eq)(itineraries.ownerId, user.id));
    const [itinerary] = await db.insert(itineraries).values({
      ownerId: user.id,
      title: "Di\xE1rio de Bordo (Migrado)",
      isShared: true
    }).returning();
    await saveItineraryData(db, itinerary.id, data);
    res.json({ success: true, message: "Dados relacionais migrados com sucesso", itinerary });
  } catch (error) {
    console.error("Migration error:", error);
    res.status(500).json({ status: "error", error: error.message });
  }
});
router7.post("/traveler/validate", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ error: "Por favor, indique um endere\xE7o de e-mail v\xE1lido." });
    }
    if (!db) {
      return res.status(503).json({ error: "Banco de dados remoto indispon\xEDvel." });
    }
    const cleanEmail = email.trim().toLowerCase();
    const linkedTravelers = await db.select().from(travelers).where((0, import_drizzle_orm10.eq)(import_drizzle_orm10.sql`LOWER(TRIM(${travelers.email}))`, cleanEmail));
    if (linkedTravelers.length === 0) {
      return res.status(404).json({
        error: "Acesso Negado: Nenhum viajante cadastrado com este e-mail nos nossos roteiros."
      });
    }
    const itineraryIds = linkedTravelers.map((t) => t.itineraryId);
    const registeredUser = await db.select().from(users).where((0, import_drizzle_orm10.eq)(import_drizzle_orm10.sql`LOWER(TRIM(${users.email}))`, cleanEmail)).limit(1);
    const hasPassword = registeredUser.length > 0 && !!registeredUser[0].passwordHash;
    let isFirstAccessInDb = true;
    try {
      const userLogs = await db.select().from(accessLogs).where((0, import_drizzle_orm10.eq)(import_drizzle_orm10.sql`LOWER(TRIM(${accessLogs.userEmail}))`, cleanEmail));
      isFirstAccessInDb = userLogs.length === 0;
    } catch (err) {
      console.error("Erro ao carregar logs de acesso do viajante:", err);
    }
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const clientIp = typeof ip === "string" ? ip : ip[0];
    const firstItineraryId = itineraryIds.length > 0 ? itineraryIds[0] : null;
    try {
      if (await shouldLogAccess(db, cleanEmail, firstItineraryId, accessLogs)) {
        await db.insert(accessLogs).values({
          itineraryId: firstItineraryId,
          userEmail: cleanEmail,
          status: "success",
          ipAddress: clientIp
        });
      }
    } catch (err) {
      console.error("Erro ao registrar log de acesso para o viajante vinculado:", err);
    }
    const dbItineraries = await db.query.itineraries.findMany({
      where: (0, import_drizzle_orm10.inArray)(itineraries.id, itineraryIds),
      with: {
        travelers: true,
        costs: true,
        costCategories: true,
        documents: true,
        flights: {
          with: {
            passengersList: true
          }
        },
        generalTips: true,
        notifications: true,
        destinations: {
          with: {
            days: {
              with: { activities: true }
            }
          }
        }
      }
    });
    const response = dbItineraries.map((itinerary) => mapItineraryFromDb(itinerary));
    res.json({ success: true, email: cleanEmail, itineraries: response, hasPassword, isFirstAccess: isFirstAccessInDb });
  } catch (err) {
    console.error("Traveler validation error:", err);
    res.status(500).json({ error: "Erro interno ao buscar as viagens vinculadas: " + err.message });
  }
});
var admin_default = router7;

// server.ts
init_referral();

// src/routes/planAccess.ts
var import_express8 = require("express");
var import_drizzle_orm11 = require("drizzle-orm");
init_db();
init_schema();
init_auth();
var router8 = (0, import_express8.Router)();
var TRIAL_DURATION_DAYS = 15;
router8.get("/status", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId && userId !== 0) {
      return res.status(401).json({ error: "N\xE3o autenticado" });
    }
    if (userId === 0) {
      return res.json({
        planType: "pass",
        isLifetimePro: false,
        isTrial: false,
        trialDaysRemaining: 15,
        trialExpired: false,
        isPro: false,
        isPass: true,
        canCreateItinerary: true,
        canUseAI: true,
        canExportPdf: true,
        maxDocuments: 999
      });
    }
    const [user] = await db.select().from(users).where((0, import_drizzle_orm11.eq)(users.id, userId)).limit(1);
    if (!user) {
      return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado" });
    }
    const isPro = user.isLifetimePro || user.planType === "pro_lifetime";
    const isPass = user.planType === "pass";
    const isStarter = !isPro && !isPass;
    const startDate = user.trialStartedAt || user.createdAt || /* @__PURE__ */ new Date();
    const now = /* @__PURE__ */ new Date();
    const msDiff = now.getTime() - new Date(startDate).getTime();
    const daysElapsed = Math.floor(msDiff / (1e3 * 60 * 60 * 24));
    const trialDaysRemaining = Math.max(0, TRIAL_DURATION_DAYS - daysElapsed);
    const trialExpired = isStarter && trialDaysRemaining <= 0;
    res.json({
      planType: user.planType ?? "starter",
      isLifetimePro: isPro,
      isTrial: isStarter,
      trialDaysRemaining,
      trialExpired,
      isPro,
      isPass,
      canCreateItinerary: !trialExpired,
      canUseAI: !trialExpired,
      canExportPdf: isPro || isPass,
      maxDocuments: isPro || isPass ? 999 : trialExpired ? 0 : 3
    });
  } catch (err) {
    console.error("[Plan Status Error]", err.message);
    res.status(500).json({ error: "Erro ao consultar status do plano." });
  }
});
var planAccess_default = router8;

// src/routes/stripe.ts
var import_express9 = require("express");
var import_stripe = __toESM(require("stripe"), 1);
var import_drizzle_orm12 = require("drizzle-orm");
init_db();
init_schema();
init_auth();
init_referral();
var router9 = (0, import_express9.Router)();
var stripeSecretKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";
var stripe = new import_stripe.default(stripeSecretKey);
function getAppUrl2(req) {
  if (process.env.APP_URL && process.env.APP_URL.trim()) {
    return process.env.APP_URL.trim().replace(/\/$/, "");
  }
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const host = req.headers["x-forwarded-host"] || req.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}
router9.post("/create-checkout-session", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email;
    if (!userId && userId !== 0) {
      return res.status(401).json({ error: "N\xE3o autenticado." });
    }
    const { plan, itineraryId, discountCode } = req.body;
    const planType = plan === "pro_lifetime" ? "pro_lifetime" : "pass";
    let validDiscount = false;
    let validatedDiscountCode = "";
    if (discountCode && typeof discountCode === "string") {
      const cleanCode = discountCode.trim().toUpperCase();
      if (cleanCode === "KED10") {
        validDiscount = true;
        validatedDiscountCode = "KED10";
      } else {
        const [referrer] = await db.select({ id: users.id }).from(users).where((0, import_drizzle_orm12.eq)(users.referralCode, cleanCode)).limit(1);
        if (referrer && referrer.id !== Number(userId)) {
          validDiscount = true;
          validatedDiscountCode = cleanCode;
        }
      }
    }
    const baseUrl = getAppUrl2(req);
    const envPriceOrProd = planType === "pro_lifetime" ? process.env.STRIPE_PRICE_PRO || process.env.STRIPE_PROD_PRO || "prod_V3nnOmP0jeKhV5" : process.env.STRIPE_PRICE_PASS || process.env.STRIPE_PROD_PASS || "prod_V3nlXH3Awlz9LA";
    let line_items = [];
    if (envPriceOrProd && envPriceOrProd.startsWith("price_")) {
      line_items = [
        {
          price: envPriceOrProd,
          quantity: 1
        }
      ];
    } else {
      const baseAmountCents = planType === "pro_lifetime" ? 14990 : 2990;
      const discountCents = validDiscount ? 1e3 : 0;
      const finalAmountCents = Math.max(1e3, baseAmountCents - discountCents);
      const priceData = {
        currency: "brl",
        unit_amount: finalAmountCents,
        product_data: {
          name: planType === "pro_lifetime" ? "KedGo! Pro Vital\xEDcio" : "Passe KedGo!",
          description: planType === "pro_lifetime" ? "Acesso vital\xEDcio e ilimitado a todos os recursos e roteiros com IA." : "Acesso total aos recursos inteligentes para 1 viagem."
        }
      };
      if (envPriceOrProd && envPriceOrProd.startsWith("prod_")) {
        priceData.product = envPriceOrProd;
        delete priceData.product_data;
      }
      line_items = [
        {
          price_data: priceData,
          quantity: 1
        }
      ];
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: userEmail || void 0,
      line_items,
      metadata: {
        userId: String(userId),
        planType,
        itineraryId: itineraryId ? String(itineraryId) : "",
        discountCode: validatedDiscountCode,
        isDiscountApplied: validDiscount ? "true" : "false"
      },
      success_url: `${baseUrl}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}?checkout=cancel`
    });
    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("[Stripe Create Session Error]", err.message);
    res.status(500).json({ error: "Erro ao iniciar checkout na Stripe: " + err.message });
  }
});
router9.get("/verify-session/:sessionId", authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) return res.status(400).json({ error: "Session ID \xE9 obrigat\xF3rio." });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === "paid") {
      const userId = Number(session.metadata?.userId);
      const planType = session.metadata?.planType;
      const itineraryId = session.metadata?.itineraryId;
      if (userId && !isNaN(userId) && userId > 0) {
        if (planType === "pro_lifetime") {
          await db.update(users).set({ planType: "pro_lifetime", isLifetimePro: true }).where((0, import_drizzle_orm12.eq)(users.id, userId));
        } else if (planType === "pass") {
          await db.update(users).set({ planType: "pass" }).where((0, import_drizzle_orm12.eq)(users.id, userId));
          if (itineraryId && !isNaN(Number(itineraryId))) {
            await db.update(itineraries).set({ passPurchased: true }).where((0, import_drizzle_orm12.eq)(itineraries.id, Number(itineraryId)));
          }
        }
        await completeReferralForUser(userId);
      }
      return res.json({ verified: true, paid: true, planType, message: "Pagamento verificado com sucesso!" });
    }
    res.json({ verified: true, paid: false, message: "Pagamento ainda pendente." });
  } catch (err) {
    console.error("[Stripe Verify Session Error]", err.message);
    res.status(500).json({ error: "Erro ao verificar pagamento: " + err.message });
  }
});
router9.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      event = req.body;
    }
  } catch (err) {
    console.error("[Stripe Webhook Signature Error]", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = Number(session.metadata?.userId);
    const planType = session.metadata?.planType;
    const itineraryId = session.metadata?.itineraryId;
    if (userId && !isNaN(userId) && userId > 0) {
      try {
        if (planType === "pro_lifetime") {
          await db.update(users).set({ planType: "pro_lifetime", isLifetimePro: true }).where((0, import_drizzle_orm12.eq)(users.id, userId));
        } else if (planType === "pass") {
          await db.update(users).set({ planType: "pass" }).where((0, import_drizzle_orm12.eq)(users.id, userId));
          if (itineraryId && !isNaN(Number(itineraryId))) {
            await db.update(itineraries).set({ passPurchased: true }).where((0, import_drizzle_orm12.eq)(itineraries.id, Number(itineraryId)));
          }
        }
        await completeReferralForUser(userId);
        console.log(`[Stripe Webhook] Plan ${planType} granted to user ID ${userId}`);
      } catch (err) {
        console.error("[Stripe Webhook DB Error]", err.message);
      }
    }
  }
  res.json({ received: true });
});
var stripe_default = router9;

// server.ts
import_dns.default.setDefaultResultOrder("ipv4first");
async function startServer() {
  if (pool) {
    try {
      await pool.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT TRUE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'email';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'starter';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS is_lifetime_pro BOOLEAN DEFAULT FALSE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP DEFAULT NOW();
        
        ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS pass_purchased BOOLEAN DEFAULT FALSE;
        ALTER TABLE activities ADD COLUMN IF NOT EXISTS type TEXT;

        CREATE TABLE IF NOT EXISTS referrals (
          id SERIAL PRIMARY KEY,
          referrer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          referred_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          status TEXT DEFAULT 'pending',
          reward_applied BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS referral_invites (
          id SERIAL PRIMARY KEY,
          referrer_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
          invitee_email TEXT NOT NULL,
          referral_code TEXT NOT NULL,
          sent_at TIMESTAMP DEFAULT NOW() NOT NULL,
          UNIQUE(referrer_id, invitee_email)
        );

        CREATE TABLE IF NOT EXISTS ai_prompt_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          original_prompt TEXT NOT NULL,
          questions TEXT,
          answers TEXT,
          generated_title TEXT,
          success BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log("Database connection ready & columns verified.");
    } catch (err) {
      console.error("Error during startup DB check:", err);
    }
  }
  const app = (0, import_express10.default)();
  const PORT = 3e3;
  app.use(import_express10.default.json({ limit: "50mb" }));
  app.use(import_express10.default.urlencoded({ limit: "50mb", extended: true }));
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      message: "Servidor online com Postgres suportado!"
    });
  });
  app.get("/api/ping-db", async (req, res) => {
    if (!db) {
      return res.status(503).json({
        error: "DATABASE_URL n\xE3o configurada no painel de Segredos (Settings > Secrets)."
      });
    }
    try {
      const allUsers = await db.select().from(users).limit(1);
      res.json({
        status: "ok",
        message: "Conectado ao PostgreSQL com sucesso!",
        testQuery: allUsers
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: "error", error: error.message });
    }
  });
  app.use("/api/auth", auth_default);
  app.use("/api/dev", dev_default);
  app.use("/api/itineraries", itineraries_default);
  app.use("/api/messages", chat_default);
  app.use("/api/chat", chat_default);
  app.use("/api/gemini", ai_default);
  app.use("/api", admin_default);
  app.use("/api/referral", referral_default);
  app.use("/api/plan", planAccess_default);
  app.use("/api/stripe", stripe_default);
  app.use("/uploads", import_express10.default.static(import_path2.default.join(process.cwd(), "uploads")));
  const isProd = process.env.NODE_ENV === "production";
  const distPath = import_path2.default.join(process.cwd(), "dist");
  const distIndexHtml = import_path2.default.join(distPath, "index.html");
  if (!isProd || !import_fs2.default.existsSync(distIndexHtml)) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn("Could not start Vite middleware, falling back to static files:", e);
      if (import_fs2.default.existsSync(distPath)) {
        app.use(import_express10.default.static(distPath));
        app.get("*", (req, res) => {
          if (import_fs2.default.existsSync(distIndexHtml)) {
            res.sendFile(distIndexHtml);
          } else {
            res.status(200).send("App is loading...");
          }
        });
      }
    }
  } else {
    app.use(import_express10.default.static(distPath));
    app.get("*", (req, res) => {
      if (import_fs2.default.existsSync(distIndexHtml)) {
        res.sendFile(distIndexHtml, (err) => {
          if (err && !res.headersSent) {
            res.status(500).send("Erro ao carregar o aplicativo.");
          }
        });
      } else {
        res.status(200).send("App is initializing...");
      }
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
