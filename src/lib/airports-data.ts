/**
 * Static airport/city data for autocomplete. No Amadeus API.
 * Shape matches previous Amadeus locations response for AirportAutocomplete.
 */
export interface AirportLocation {
  iataCode: string;
  name: string;
  cityName?: string;
  countryName?: string;
  type: string;
}

export const AIRPORTS_DATA: AirportLocation[] = [
  { iataCode: "CAI", name: "Cairo International", cityName: "Cairo", countryName: "Egypt", type: "AIRPORT" },
  { iataCode: "HRG", name: "Hurghada International", cityName: "Hurghada", countryName: "Egypt", type: "AIRPORT" },
  { iataCode: "SSH", name: "Sharm El Sheikh International", cityName: "Sharm El Sheikh", countryName: "Egypt", type: "AIRPORT" },
  { iataCode: "ALY", name: "El Nouzha", cityName: "Alexandria", countryName: "Egypt", type: "AIRPORT" },
  { iataCode: "LHR", name: "London Heathrow", cityName: "London", countryName: "United Kingdom", type: "AIRPORT" },
  { iataCode: "LGW", name: "London Gatwick", cityName: "London", countryName: "United Kingdom", type: "AIRPORT" },
  { iataCode: "CDG", name: "Charles de Gaulle", cityName: "Paris", countryName: "France", type: "AIRPORT" },
  { iataCode: "ORY", name: "Paris Orly", cityName: "Paris", countryName: "France", type: "AIRPORT" },
  { iataCode: "FRA", name: "Frankfurt am Main", cityName: "Frankfurt", countryName: "Germany", type: "AIRPORT" },
  { iataCode: "MUC", name: "Munich", cityName: "Munich", countryName: "Germany", type: "AIRPORT" },
  { iataCode: "AMS", name: "Amsterdam Schiphol", cityName: "Amsterdam", countryName: "Netherlands", type: "AIRPORT" },
  { iataCode: "DXB", name: "Dubai International", cityName: "Dubai", countryName: "United Arab Emirates", type: "AIRPORT" },
  { iataCode: "AUH", name: "Abu Dhabi International", cityName: "Abu Dhabi", countryName: "United Arab Emirates", type: "AIRPORT" },
  { iataCode: "DOH", name: "Hamad International", cityName: "Doha", countryName: "Qatar", type: "AIRPORT" },
  { iataCode: "IST", name: "Istanbul", cityName: "Istanbul", countryName: "Turkey", type: "AIRPORT" },
  { iataCode: "SAW", name: "Istanbul Sabiha Gokcen", cityName: "Istanbul", countryName: "Turkey", type: "AIRPORT" },
  { iataCode: "JFK", name: "John F Kennedy International", cityName: "New York", countryName: "United States", type: "AIRPORT" },
  { iataCode: "EWR", name: "Newark Liberty International", cityName: "New York", countryName: "United States", type: "AIRPORT" },
  { iataCode: "LAX", name: "Los Angeles International", cityName: "Los Angeles", countryName: "United States", type: "AIRPORT" },
  { iataCode: "ORD", name: "Chicago O'Hare International", cityName: "Chicago", countryName: "United States", type: "AIRPORT" },
  { iataCode: "MIA", name: "Miami International", cityName: "Miami", countryName: "United States", type: "AIRPORT" },
  { iataCode: "YYZ", name: "Toronto Pearson International", cityName: "Toronto", countryName: "Canada", type: "AIRPORT" },
  { iataCode: "MAD", name: "Adolfo Suarez Madrid-Barajas", cityName: "Madrid", countryName: "Spain", type: "AIRPORT" },
  { iataCode: "BCN", name: "Barcelona-El Prat", cityName: "Barcelona", countryName: "Spain", type: "AIRPORT" },
  { iataCode: "FCO", name: "Fiumicino", cityName: "Rome", countryName: "Italy", type: "AIRPORT" },
  { iataCode: "MXP", name: "Malpensa", cityName: "Milan", countryName: "Italy", type: "AIRPORT" },
  { iataCode: "ATH", name: "Athens International", cityName: "Athens", countryName: "Greece", type: "AIRPORT" },
  { iataCode: "VIE", name: "Vienna International", cityName: "Vienna", countryName: "Austria", type: "AIRPORT" },
  { iataCode: "ZRH", name: "Zurich", cityName: "Zurich", countryName: "Switzerland", type: "AIRPORT" },
  { iataCode: "SVO", name: "Sheremetyevo International", cityName: "Moscow", countryName: "Russia", type: "AIRPORT" },
  { iataCode: "SIN", name: "Singapore Changi", cityName: "Singapore", countryName: "Singapore", type: "AIRPORT" },
  { iataCode: "HKG", name: "Hong Kong International", cityName: "Hong Kong", countryName: "Hong Kong", type: "AIRPORT" },
  { iataCode: "NRT", name: "Narita International", cityName: "Tokyo", countryName: "Japan", type: "AIRPORT" },
  { iataCode: "ICN", name: "Incheon International", cityName: "Seoul", countryName: "South Korea", type: "AIRPORT" },
  { iataCode: "BKK", name: "Suvarnabhumi", cityName: "Bangkok", countryName: "Thailand", type: "AIRPORT" },
  { iataCode: "KUL", name: "Kuala Lumpur International", cityName: "Kuala Lumpur", countryName: "Malaysia", type: "AIRPORT" },
  { iataCode: "SYD", name: "Sydney Kingsford Smith", cityName: "Sydney", countryName: "Australia", type: "AIRPORT" },
  { iataCode: "MEL", name: "Melbourne", cityName: "Melbourne", countryName: "Australia", type: "AIRPORT" },
  { iataCode: "JNB", name: "O R Tambo International", cityName: "Johannesburg", countryName: "South Africa", type: "AIRPORT" },
  { iataCode: "NBO", name: "Jomo Kenyatta International", cityName: "Nairobi", countryName: "Kenya", type: "AIRPORT" },
  { iataCode: "RUH", name: "King Khalid International", cityName: "Riyadh", countryName: "Saudi Arabia", type: "AIRPORT" },
  { iataCode: "JED", name: "King Abdulaziz International", cityName: "Jeddah", countryName: "Saudi Arabia", type: "AIRPORT" },
  { iataCode: "BAH", name: "Bahrain International", cityName: "Manama", countryName: "Bahrain", type: "AIRPORT" },
  { iataCode: "KWI", name: "Kuwait International", cityName: "Kuwait City", countryName: "Kuwait", type: "AIRPORT" },
  { iataCode: "MCT", name: "Muscat International", cityName: "Muscat", countryName: "Oman", type: "AIRPORT" },
  { iataCode: "BEY", name: "Beirut Rafic Hariri International", cityName: "Beirut", countryName: "Lebanon", type: "AIRPORT" },
  { iataCode: "AMM", name: "Queen Alia International", cityName: "Amman", countryName: "Jordan", type: "AIRPORT" },
  { iataCode: "TLV", name: "Ben Gurion", cityName: "Tel Aviv", countryName: "Israel", type: "AIRPORT" },
];

const MAX_RESULTS = 10;

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

export function searchAirports(query: string): AirportLocation[] {
  if (!query || query.length < 2) return [];
  const q = normalize(query);
  const scored = AIRPORTS_DATA.filter((loc) => {
    const code = normalize(loc.iataCode);
    const name = normalize(loc.name);
    const city = normalize(loc.cityName ?? "");
    const country = normalize(loc.countryName ?? "");
    return code.startsWith(q) || code.includes(q) || name.includes(q) || city.includes(q) || country.includes(q);
  });
  // Prefer IATA match, then city, then name
  scored.sort((a, b) => {
    const aCode = normalize(a.iataCode).startsWith(q) ? 0 : 1;
    const bCode = normalize(b.iataCode).startsWith(q) ? 0 : 1;
    if (aCode !== bCode) return aCode - bCode;
    const aCity = normalize(a.cityName ?? "").startsWith(q) ? 0 : 1;
    const bCity = normalize(b.cityName ?? "").startsWith(q) ? 0 : 1;
    if (aCity !== bCity) return aCity - bCity;
    return 0;
  });
  return scored.slice(0, MAX_RESULTS);
}
