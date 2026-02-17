import { HotelProvider, IHotelService } from "./types";
import { InternalHotelService } from "./internalHotelService";
import { AmadeusHotelService } from "./amadeusHotelService";

/**
 * Factory to get the appropriate hotel service based on provider
 */
export class HotelProviderFactory {
  private static internalService: InternalHotelService | null = null;
  private static amadeusService: AmadeusHotelService | null = null;

  static getHotelService(provider: HotelProvider): IHotelService {
    switch (provider) {
      case HotelProvider.INTERNAL:
        if (!this.internalService) {
          this.internalService = new InternalHotelService();
        }
        return this.internalService;

      case HotelProvider.AMADEUS:
        if (!this.amadeusService) {
          this.amadeusService = new AmadeusHotelService();
        }
        return this.amadeusService;

      default:
        throw new Error(`Unknown hotel provider: ${provider}`);
    }
  }
}

