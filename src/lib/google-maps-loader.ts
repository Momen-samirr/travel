/**
 * Shared utility to load Google Maps API only once
 * Prevents multiple script tags from being added to the page
 */

let mapsScriptLoaded = false;
let mapsScriptLoading = false;
let mapsLoadPromise: Promise<void> | null = null;

export function loadGoogleMapsScript(
  apiKey: string,
  libraries: string[] = []
): Promise<void> {
  // If already loaded, return resolved promise
  if (mapsScriptLoaded && typeof window !== "undefined" && window.google?.maps) {
    return Promise.resolve();
  }

  // If currently loading, return the existing promise
  if (mapsScriptLoading && mapsLoadPromise) {
    return mapsLoadPromise;
  }

  // Check if script already exists in DOM
  if (typeof window !== "undefined") {
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );
    if (existingScript) {
      mapsScriptLoaded = true;
      return Promise.resolve();
    }
  }

  mapsScriptLoading = true;
  mapsLoadPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Window is not defined"));
      return;
    }

    // Check again after async check
    if (window.google?.maps) {
      mapsScriptLoaded = true;
      mapsScriptLoading = false;
      resolve();
      return;
    }

    const script = document.createElement("script");
    const librariesParam = libraries.length > 0 ? `&libraries=${libraries.join(",")}` : "";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}${librariesParam}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      mapsScriptLoaded = true;
      mapsScriptLoading = false;
      resolve();
    };
    script.onerror = () => {
      mapsScriptLoading = false;
      mapsLoadPromise = null;
      reject(new Error("Failed to load Google Maps script"));
    };

    document.head.appendChild(script);
  });

  return mapsLoadPromise;
}

