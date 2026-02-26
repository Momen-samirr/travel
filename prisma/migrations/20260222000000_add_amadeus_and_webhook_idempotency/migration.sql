-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "amadeusError" TEXT,
ADD COLUMN "amadeusOrderId" TEXT,
ADD COLUMN "amadeusRetryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "amadeusStatus" TEXT,
ADD COLUMN "pnr" TEXT;

-- CreateTable
CREATE TABLE "WebhookIdempotency" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "bookingId" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookIdempotency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WebhookIdempotency_source_eventId_key" ON "WebhookIdempotency"("source", "eventId");

-- CreateIndex
CREATE INDEX "WebhookIdempotency_source_idx" ON "WebhookIdempotency"("source");

-- CreateIndex
CREATE INDEX "WebhookIdempotency_bookingId_idx" ON "WebhookIdempotency"("bookingId");

-- CreateIndex
CREATE INDEX "Booking_amadeusStatus_idx" ON "Booking"("amadeusStatus");
