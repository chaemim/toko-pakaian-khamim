ALTER TABLE "sales" ADD COLUMN "client_id" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX "sales_client_id_unique" ON "sales" USING btree ("client_id");