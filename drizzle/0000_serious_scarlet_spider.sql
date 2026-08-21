CREATE TABLE "access_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"itinerary_id" integer,
	"user_email" text NOT NULL,
	"status" text NOT NULL,
	"attempted_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text
);
--> statement-breakpoint
CREATE TABLE "activities" (
	"id" text PRIMARY KEY NOT NULL,
	"day_id" text NOT NULL,
	"time" text NOT NULL,
	"location" text NOT NULL,
	"duration" text NOT NULL,
	"cost" text NOT NULL,
	"maps_query" text,
	"website_link" text,
	"parking" text,
	"notes" text,
	"ticket_file_name" text,
	"ticket_file_data" text,
	"date" text,
	"created_by_email" text
);
--> statement-breakpoint
CREATE TABLE "api_usage_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"itinerary_id" integer,
	"date_string" text NOT NULL,
	"call_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"itinerary_id" integer NOT NULL,
	"sender_name" text NOT NULL,
	"sender_avatar" text,
	"recipient_name" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"content" text,
	"file_data" text,
	"file_name" text,
	"file_type" text,
	"file_size" integer,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cost_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"itinerary_id" integer NOT NULL,
	"label" text NOT NULL,
	"color" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "costs" (
	"id" text PRIMARY KEY NOT NULL,
	"itinerary_id" integer NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"notes" text,
	"link" text,
	"total_cost_brl" double precision NOT NULL,
	"status" text NOT NULL,
	"date_range" text,
	"destination_id" text,
	"is_personal" boolean DEFAULT false NOT NULL,
	"created_by_email" text,
	"receipt_name" text,
	"receipt_data" text
);
--> statement-breakpoint
CREATE TABLE "destinations" (
	"id" text PRIMARY KEY NOT NULL,
	"itinerary_id" integer NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"country" text NOT NULL,
	"dates" text NOT NULL,
	"start_date" text,
	"end_date" text,
	"hotel_name" text NOT NULL,
	"hotel_link" text,
	"hotel_address" text,
	"hotel_coords_lat" double precision,
	"hotel_coords_lng" double precision,
	"check_in_time" text,
	"check_out_time" text,
	"check_in_date" text,
	"notes" text,
	"created_by_email" text
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"itinerary_id" integer NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"airline" text,
	"flight_number" text,
	"passenger_name" text NOT NULL,
	"file_data" text,
	"file_name" text,
	"notes" text,
	"uploaded_at" text NOT NULL,
	"created_by_email" text
);
--> statement-breakpoint
CREATE TABLE "flight_passengers" (
	"id" text PRIMARY KEY NOT NULL,
	"flight_id" text NOT NULL,
	"name" text NOT NULL,
	"seat" text,
	"ticket_file_name" text,
	"ticket_file_data" text
);
--> statement-breakpoint
CREATE TABLE "flights" (
	"id" text PRIMARY KEY NOT NULL,
	"itinerary_id" integer NOT NULL,
	"airline" text NOT NULL,
	"logo_url" text,
	"flight_code" text NOT NULL,
	"departure_city" text NOT NULL,
	"departure_code" text NOT NULL,
	"departure_time" text NOT NULL,
	"arrival_city" text NOT NULL,
	"arrival_code" text NOT NULL,
	"arrival_time" text NOT NULL,
	"duration" text NOT NULL,
	"date_str" text NOT NULL,
	"arrival_date_str" text,
	"status" text NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"gate" text,
	"locator" text,
	"passengers" text,
	"seats" text,
	"ticket_file_name" text,
	"ticket_file_data" text,
	"created_by_email" text
);
--> statement-breakpoint
CREATE TABLE "general_tips" (
	"id" text PRIMARY KEY NOT NULL,
	"itinerary_id" integer NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "itineraries" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"title" text NOT NULL,
	"is_shared" boolean DEFAULT false,
	"eco_mode" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "itinerary_days" (
	"id" text PRIMARY KEY NOT NULL,
	"destination_id" text NOT NULL,
	"day_number" integer NOT NULL,
	"date_str" text NOT NULL,
	"title" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nearby_places" (
	"id" text PRIMARY KEY NOT NULL,
	"itinerary_id" integer NOT NULL,
	"destination_id" text NOT NULL,
	"category" text NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"rating" text,
	"distance" text,
	"latitude" double precision,
	"longitude" double precision,
	"maps_link" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"itinerary_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"time" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"type" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"itinerary_id" integer NOT NULL,
	"user" text NOT NULL,
	"user_email" text NOT NULL,
	"action" text NOT NULL,
	"item_type" text NOT NULL,
	"item_id" text NOT NULL,
	"item_desc" text NOT NULL,
	"timestamp" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "travelers" (
	"id" text PRIMARY KEY NOT NULL,
	"itinerary_id" integer NOT NULL,
	"name" text NOT NULL,
	"role" text,
	"email" text,
	"checked_activities" text,
	"packing_items" text,
	"created_by_email" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"password_reset_token" text,
	"password_reset_expires" timestamp,
	"favorite_itinerary_id" integer,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_itinerary_id_itineraries_id_fk" FOREIGN KEY ("itinerary_id") REFERENCES "public"."itineraries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_day_id_itinerary_days_id_fk" FOREIGN KEY ("day_id") REFERENCES "public"."itinerary_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_usage_logs" ADD CONSTRAINT "api_usage_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_usage_logs" ADD CONSTRAINT "api_usage_logs_itinerary_id_itineraries_id_fk" FOREIGN KEY ("itinerary_id") REFERENCES "public"."itineraries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_itinerary_id_itineraries_id_fk" FOREIGN KEY ("itinerary_id") REFERENCES "public"."itineraries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_categories" ADD CONSTRAINT "cost_categories_itinerary_id_itineraries_id_fk" FOREIGN KEY ("itinerary_id") REFERENCES "public"."itineraries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "costs" ADD CONSTRAINT "costs_itinerary_id_itineraries_id_fk" FOREIGN KEY ("itinerary_id") REFERENCES "public"."itineraries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_itinerary_id_itineraries_id_fk" FOREIGN KEY ("itinerary_id") REFERENCES "public"."itineraries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_itinerary_id_itineraries_id_fk" FOREIGN KEY ("itinerary_id") REFERENCES "public"."itineraries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flight_passengers" ADD CONSTRAINT "flight_passengers_flight_id_flights_id_fk" FOREIGN KEY ("flight_id") REFERENCES "public"."flights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flights" ADD CONSTRAINT "flights_itinerary_id_itineraries_id_fk" FOREIGN KEY ("itinerary_id") REFERENCES "public"."itineraries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "general_tips" ADD CONSTRAINT "general_tips_itinerary_id_itineraries_id_fk" FOREIGN KEY ("itinerary_id") REFERENCES "public"."itineraries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itineraries" ADD CONSTRAINT "itineraries_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itinerary_days" ADD CONSTRAINT "itinerary_days_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nearby_places" ADD CONSTRAINT "nearby_places_itinerary_id_itineraries_id_fk" FOREIGN KEY ("itinerary_id") REFERENCES "public"."itineraries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nearby_places" ADD CONSTRAINT "nearby_places_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_itinerary_id_itineraries_id_fk" FOREIGN KEY ("itinerary_id") REFERENCES "public"."itineraries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_logs" ADD CONSTRAINT "transaction_logs_itinerary_id_itineraries_id_fk" FOREIGN KEY ("itinerary_id") REFERENCES "public"."itineraries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travelers" ADD CONSTRAINT "travelers_itinerary_id_itineraries_id_fk" FOREIGN KEY ("itinerary_id") REFERENCES "public"."itineraries"("id") ON DELETE cascade ON UPDATE no action;