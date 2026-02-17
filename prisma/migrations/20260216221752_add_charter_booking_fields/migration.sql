-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "charterDepartureOptionId" TEXT,
ADD COLUMN     "charterHotelOptionId" TEXT,
ADD COLUMN     "numberOfAdults" INTEGER,
ADD COLUMN     "numberOfChildren" INTEGER,
ADD COLUMN     "numberOfInfants" INTEGER,
ADD COLUMN     "roomType" TEXT,
ADD COLUMN     "selectedAddonIds" JSONB;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_charterHotelOptionId_fkey" FOREIGN KEY ("charterHotelOptionId") REFERENCES "CharterPackageHotelOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_charterDepartureOptionId_fkey" FOREIGN KEY ("charterDepartureOptionId") REFERENCES "CharterDepartureOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
