import React, { useEffect, useState, useRef } from "react";
import { Activity, Destination, NearbyPlace } from "../types";
import { getCoordsForLocation, getCityCenter } from "../utils/geocoding";
import { 
  MapPin, 
  Navigation, 
  Compass, 
  Map as MapIcon, 
  RotateCcw, 
  Search, 
  Layers, 
  Bed, 
  Info, 
  Check, 
  CheckCircle2 
} from "lucide-react";

interface ItineraryMapProps {
  destination: Destination;
  dayActivities: Activity[];
  nearbyPlaces?: NearbyPlace[];
}

interface ActivityWithCoords {
  activity: Activity;
  coords: { lat: number; lng: number };
}

declare global {
  interface Window {
    L: any; // Leaflet global
    triggerActivityHighlight: (actId: string) => void;
  }
}

export function ItineraryMap({ destination, dayActivities, nearbyPlaces = [] }: ItineraryMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [activitiesWithCoords, setActivitiesWithCoords] = useState<ActivityWithCoords[]>([]);
  const [loadingCoords, setLoadingCoords] = useState(false);
  const [tileStyle, setTileStyle] = useState<"voyager" | "positron" | "dark">("voyager");
  const [mapToast, setMapToast] = useState<string | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  
  // Track Leaflet map instance and active markers
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  // Keep a ref of selectedActivityId setter so static/global window callbacks can refer to it safely
  const setSelectedActivityIdRef = useRef<(id: string | null) => void>(() => {});
  useEffect(() => {
    setSelectedActivityIdRef.current = setSelectedActivityId;
  }, [setSelectedActivityId]);

  // Toast notifier helper
  const showTemporaryToast = (message: string) => {
    setMapToast(message);
    setTimeout(() => {
      setMapToast(null);
    }, 3500);
  };

  // 1. Dynamic Leaflet loading from CDN
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    const linkId = "leaflet-stylesheet";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const scriptId = "leaflet-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => setLeafletLoaded(true);
      document.body.appendChild(script);
    } else {
      const checkInterval = setInterval(() => {
        if (window.L) {
          setLeafletLoaded(true);
          clearInterval(checkInterval);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }
  }, []);

  // 2. Load coordinates for all activities of the day
  useEffect(() => {
    let active = true;
    const fetchAllCoords = async () => {
      setLoadingCoords(true);
      const items: ActivityWithCoords[] = [];

      // Sort activities chronologically by time to display route sequence correctly
      const sorted = [...dayActivities].sort((a, b) => {
        return (a.time || "").localeCompare(b.time || "");
      });

      for (const act of sorted) {
        // If the activity directly specifies coordinates, use them immediately
        if (typeof act.latitude === "number" && typeof act.longitude === "number") {
          items.push({
            activity: act,
            coords: { lat: act.latitude, lng: act.longitude }
          });
          continue;
        }

        const searchQuery = act.location || act.mapsQuery || "";
        if (!searchQuery) continue;

        try {
          const coords = await getCoordsForLocation(searchQuery, destination.city);
          if (coords) {
            items.push({ activity: act, coords });
          }
        } catch (err) {
          console.warn("Geocoding failed for activity", act.location, err);
        }
      }

      if (active) {
        setActivitiesWithCoords(items);
        setLoadingCoords(false);
        // Automatically default selected activity to the very first point of the route
        if (items.length > 0) {
          setSelectedActivityId(items[0].activity.id);
        }
      }
    };

    if (dayActivities.length > 0) {
      setActivitiesWithCoords([]);
      fetchAllCoords();
    } else {
      setActivitiesWithCoords([]);
      setLoadingCoords(false);
    }

    return () => {
      active = false;
    };
  }, [dayActivities, destination.city]);

  // 3. Initialize & update Leaflet Map and Map Tile Swap dynamically
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return;

    const L = window.L;
    const fallbackCenter = getCityCenter(destination.city);

    // Initialize map if it doesn't exist
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        zoomControl: false, // Cleaner, app-styled custom layout
        scrollWheelZoom: true,
      }).setView([fallbackCenter.lat, fallbackCenter.lng], 13);
    }

    // Swapping Map Background Tile Skins
    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    let tileUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
    if (tileStyle === "positron") {
      tileUrl = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
    } else if (tileStyle === "dark") {
      tileUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    }

    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(mapInstanceRef.current);

    // Clear old elements from the map instance
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    // Center to fallback if no markers are mapped
    if (activitiesWithCoords.length === 0) {
      mapInstanceRef.current.setView([fallbackCenter.lat, fallbackCenter.lng], 13);
      return;
    }

    // Build teardrop markers and map routes with a smart jitter offset to prevent complete overlapping of pins
    const polylineCoords: any[] = [];
    const bounds = L.latLngBounds([]);

    // Keep track of counts for identical coordinates to shift subsequent duplicates slightly
    const coordUsage: Record<string, number> = {};
    const adjustedLocations = activitiesWithCoords.map((item) => {
      const key = `${item.coords.lat.toFixed(6)},${item.coords.lng.toFixed(6)}`;
      const count = coordUsage[key] || 0;
      coordUsage[key] = count + 1;

      if (count > 0) {
        // Nudge overlapping coordinate in a spiral pattern
        const angle = count * 0.785; // ~45 degree increments
        const offsetRadius = 0.00015 * Math.ceil(count / 3); // shift slightly further for higher counts
        return {
          ...item,
          coords: {
            lat: item.coords.lat + Math.sin(angle) * offsetRadius,
            lng: item.coords.lng + Math.cos(angle) * offsetRadius,
          }
        };
      }
      return item;
    });

    adjustedLocations.forEach((item, index) => {
      const latlng = [item.coords.lat, item.coords.lng];
      polylineCoords.push(latlng);
      bounds.extend(latlng);

      // Create beautiful custom teardrop pointer pins pointing straight down exactly like the photo
      const markerHtml = `
        <div class="relative flex items-center justify-center cursor-pointer">
          <!-- Soft drop shadow underneath pointer -->
          <div class="absolute -bottom-1 w-2.5 h-1 bg-slate-950/25 rounded-full blur-[1px] scale-y-[0.4]"></div>
          
          <!-- Pulsing ring animation behind active items -->
          <div class="absolute w-7 h-7 rounded-full bg-indigo-500/20 animate-ping" style="animation-duration: 2.2s"></div>

          <!-- Teardrop shape rotated to point down -->
          <div class="w-7 h-7 rounded-t-full rounded-r-full bg-indigo-600 flex items-center justify-center border-2 border-white shadow-md transform -rotate-45 transition-all hover:scale-110 duration-200">
            <!-- Counter-rotated text -->
            <span class="transform rotate-45 text-white font-extrabold text-[10px] leading-none select-none">
              ${index + 1}
            </span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: "custom-travel-marker",
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -25]
      });

      const popupContent = `
        <div class="font-sans p-2.5 max-w-[200px] text-xs">
          <div class="flex items-center gap-1.5 font-bold uppercase text-[9px] text-indigo-600 mb-1">
            <span class="px-1.5 py-0.5 bg-indigo-100/50 rounded">PARADA ${index + 1}</span>
            <span>⏱️ ${item.activity.time || "N/A"}</span>
          </div>
          <h4 class="font-extrabold text-slate-800 text-sm leading-snug mb-1">${item.activity.location}</h4>
          ${item.activity.duration ? `<p class="text-slate-500 text-[10px] mb-0.5">⏱️ <strong>Duração:</strong> ${item.activity.duration}</p>` : ""}
          ${item.activity.cost ? `<p class="text-slate-500 text-[10px] mb-1.5">🎟️ <strong>Investimento:</strong> ${item.activity.cost}</p>` : ""}
          
          <div class="flex gap-1.5 mt-2.5 pt-2 border-t border-slate-100">
            <button onclick="window?.triggerActivityHighlight('${item.activity.id}')" class="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black uppercase rounded shadow-2xs cursor-pointer transition-colors w-full text-center">
              Focar Atividade
            </button>
          </div>
        </div>
      `;

      const marker = L.marker(latlng, { icon: customIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(popupContent, { closeButton: false });

      marker.on("click", () => {
        mapInstanceRef.current.setView(latlng, 15);
        setSelectedActivityId(item.activity.id);
      });

      markersRef.current.push(marker);
    });

    // Custom global callbacks for high-lighting cards
    window.triggerActivityHighlight = (actId: string) => {
      setSelectedActivityIdRef.current(actId);
      const element = document.getElementById(`activity-card-${actId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.classList.add("ring-4", "ring-indigo-500/40", "bg-indigo-50/70", "scale-[1.01]");
        setTimeout(() => {
          element.classList.remove("ring-4", "ring-indigo-500/40", "bg-indigo-50/70", "scale-[1.01]");
        }, 3000);
      }
    };

    // Draw route connector lines
    if (polylineCoords.length > 1) {
      polylineRef.current = L.polyline(polylineCoords, {
        color: "#6366f1",
        weight: 3,
        opacity: 0.8,
        dashArray: "6, 6", // dotted/dashed path style matching references
        lineJoin: "round"
      }).addTo(mapInstanceRef.current);
    }

    // Draw smart nearby search places on Leaflet Map
    if (nearbyPlaces && nearbyPlaces.length > 0) {
      nearbyPlaces.forEach((place) => {
        if (!place.latitude || !place.longitude) return;
        const lat = typeof place.latitude === "string" ? parseFloat(place.latitude) : place.latitude;
        const lng = typeof place.longitude === "string" ? parseFloat(place.longitude) : place.longitude;
        if (isNaN(lat) || isNaN(lng)) return;

        const latlng = [lat, lng];

        // Styling depending on category
        let color = "#1e293b"; // charcoal default
        let iconChar = "📍";
        let catLabel = "PONTO IMPORTANTE";

        if (place.category === "postos_combustivel") {
          color = "#f97316"; // orange
          iconChar = "⛽";
          catLabel = "POSTO DE COMBUSTÍVEL";
        } else if (place.category === "supermercados") {
          color = "#22c55e"; // green
          iconChar = "🛒";
          catLabel = "SUPERMERCADO / MERCADO";
        } else if (place.category === "lojas_conveniencia") {
          color = "#06b6d4"; // cyan
          iconChar = "🏪";
          catLabel = "LOJA DE CONVENIÊNCIA";
        }

        const markerHtml = `
          <div class="relative flex items-center justify-center cursor-pointer">
            <div class="absolute -bottom-1 w-2.5 h-1 bg-slate-950/20 rounded-full blur-[1px] scale-y-[0.4]"></div>
            <div class="w-6.5 h-6.5 rounded-full flex items-center justify-center border-2 border-white shadow-md text-[11px] text-white" style="background-color: ${color}">
              <span class="select-none leading-none">${iconChar}</span>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: markerHtml,
          className: "custom-nearby-marker",
          iconSize: [26, 26],
          iconAnchor: [13, 26],
          popupAnchor: [0, -22]
        });

        const popupContent = `
          <div class="font-sans p-2 text-xs min-w-[170px] max-w-[220px]">
            <div class="flex items-center gap-1 font-extrabold text-[8px] uppercase tracking-wider" style="color: ${color}">
              <span>${catLabel}</span>
            </div>
            <h4 class="font-black text-slate-800 text-xs mt-1 leading-snug">${place.name}</h4>
            ${place.address ? `<p class="text-slate-500 text-[10px] mt-1 leading-normal font-medium">${place.address}</p>` : ""}
            <div class="flex flex-wrap gap-1.5 mt-1.5 pt-1 border-t border-slate-100 items-center justify-between">
              ${place.distance ? `<span class="text-slate-600 bg-slate-100 text-[9px] font-black px-1.5 py-0.5 rounded">🚶 ${place.distance}</span>` : ""}
              ${place.rating ? `<span class="text-amber-600 bg-amber-50 text-[9px] font-bold px-1.5 py-0.5 rounded font-bold">⭐ ${place.rating}</span>` : ""}
            </div>
            ${place.mapsLink ? `
              <div class="mt-2 pt-1.5 border-t border-slate-50 flex justify-end">
                <a href="${place.mapsLink}" target="_blank" rel="noopener noreferrer" class="text-[9px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 uppercase tracking-wide">
                  Ver no Maps ↗
                </a>
              </div>
            ` : ""}
          </div>
        `;

        const marker = L.marker(latlng, { icon: customIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup(popupContent, { closeButton: false });

        markersRef.current.push(marker);
      });
    }

    // Set map bounds to frame coordinates
    if (activitiesWithCoords.length > 0) {
      if (activitiesWithCoords.length === 1) {
        mapInstanceRef.current.setView([activitiesWithCoords[0].coords.lat, activitiesWithCoords[0].coords.lng], 14);
      } else {
        mapInstanceRef.current.fitBounds(bounds, {
          padding: [40, 40],
          maxZoom: 16
        });
      }
    }

    // Force redraw layout
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 400);

  }, [leafletLoaded, activitiesWithCoords, destination.city, tileStyle, nearbyPlaces]);

  // Focus and trigger POPUP active
  const focusOnMarker = (item: ActivityWithCoords, index: number) => {
    if (!mapInstanceRef.current) return;
    
    mapInstanceRef.current.setView([item.coords.lat, item.coords.lng], 15);
    setSelectedActivityId(item.activity.id);
    
    const targetMarker = markersRef.current[index];
    if (targetMarker) {
      targetMarker.openPopup();
    }

    // Auto-scroll the details item below if exists
    const element = document.getElementById(`activity-card-${item.activity.id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleResetView = () => {
    if (!mapInstanceRef.current || activitiesWithCoords.length === 0) return;
    const L = window.L;
    const bounds = L.latLngBounds([]);
    activitiesWithCoords.forEach((item) => bounds.extend([item.coords.lat, item.coords.lng]));
    mapInstanceRef.current.fitBounds(bounds, { padding: [35, 35] });
    showTemporaryToast("🔎 Enquadramento da rota redefinido!");
  };

  // Find hotel and focus
  const handleLocateHotel = () => {
    if (!mapInstanceRef.current) return;
    
    const hotelItem = activitiesWithCoords.find(item => {
      const name = item.activity.location.toLowerCase();
      return name.includes("hotel") || name.includes("check-in") || name.includes("clarion") || name.includes("pousada") || name.includes("hospedagem") || name.includes("stay");
    });

    if (hotelItem) {
      const idx = activitiesWithCoords.indexOf(hotelItem);
      focusOnMarker(hotelItem, idx);
      showTemporaryToast("🏨 Hotel / Hospedagem focado no mapa!");
    } else {
      showTemporaryToast("📌 Nenhuma atividade de Hospedagem identificada hoje.");
    }
  };

  const handleLocateCityCenter = () => {
    if (!mapInstanceRef.current) return;
    const center = getCityCenter(destination.city);
    mapInstanceRef.current.setView([center.lat, center.lng], 13);
    showTemporaryToast(`📍 Centralizado no coração de ${destination.city}`);
  };

  return (
    <div id="interactive-itinerary-map" className="bg-white border border-slate-100 rounded-3xl p-4 shadow-xs space-y-3">
      {/* Header and Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
            <MapIcon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm">Mapa Itinerário Ativo</h4>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
              {destination.city} • {activitiesWithCoords.length} pontos mapeados
            </span>
          </div>
        </div>
      </div>

      {/* Map stage canvas */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-150 shadow-inner group/map">
        <div 
          ref={mapContainerRef} 
          style={{ height: "320px" }} 
          className="w-full h-full z-0 bg-slate-50"
        />

        {/* Custom Pro Export Badge on Top-Left/Right overlay matching reference photo */}
        <div className="absolute top-4 right-4 z-40 flex items-center gap-1.5 bg-white/95 backdrop-blur-3xs border border-slate-200/85 px-3 py-1.5 rounded-full shadow-md text-[10px] font-black uppercase text-slate-700 select-none">
          <div className="w-4 h-4 rounded bg-indigo-100 flex items-center justify-center text-indigo-600 font-extrabold text-[8px]">
            L
          </div>
          <span className="tracking-wide">ROTEIRO MAPS</span>
          <span className="bg-amber-100 text-amber-850 text-[8px] font-black px-1.5 py-0.5 rounded-md">PRO</span>
        </div>

        {/* Left-bottom Floating Fit all places button exactly matching reference screenshot */}
        {activitiesWithCoords.length > 1 && (
          <button
            id="itinerary-map-focus-all-btn"
            onClick={handleResetView}
            className="absolute bottom-4 left-4 z-40 flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-850 border border-slate-200 rounded-full font-bold text-xs transition-all cursor-pointer shadow-md active:scale-95 hover:scale-[1.02]"
            title="Enquadrar todos os locais do roteiro"
          >
            <Compass className="w-4 h-4 text-indigo-650 animate-pulse" />
            <span>Focar todos os locais</span>
          </button>
        )}

        {/* Right side floating action container exactly like reference screenshot */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2">
          {/* Centering button */}
          <button
            id="itinerary-map-locate-center-btn"
            onClick={handleLocateCityCenter}
            className="w-10 h-10 bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-650 border border-slate-200 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95 group/btn"
            title="Locar centro urbano"
          >
            <Search className="w-4 h-4 text-slate-500 group-hover/btn:scale-110 transition-transform" />
          </button>

          {/* Toggle tile styles */}
          <button
            id="itinerary-map-toggle-style-btn"
            onClick={() => {
              setTileStyle(prev => prev === "voyager" ? "positron" : prev === "positron" ? "dark" : "voyager");
              showTemporaryToast(`Estilo: ${tileStyle === "voyager" ? "Clássico" : tileStyle === "positron" ? "Minimalista" : "Alto Contraste"}`);
            }}
            className="w-10 h-10 bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-650 border border-slate-200 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95 group/btn"
            title="Alternar estilo visual do mapa"
          >
            <Layers className="w-4 h-4 text-slate-500 group-hover/btn:scale-110 transition-transform" />
          </button>

          {/* Hotel shortcuts */}
          <button
            id="itinerary-map-locate-hotel-btn"
            onClick={handleLocateHotel}
            className="w-10 h-10 bg-white hover:bg-slate-50 text-slate-755 hover:text-indigo-650 border border-slate-200 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95 group/btn"
            title="Sinalizar Hotel / Hospedagem"
          >
            <Bed className="w-4 h-4 text-slate-500 group-hover/btn:scale-110 transition-transform" />
          </button>
        </div>

        {/* Map In-flight notifications inside map overlay */}
        {mapToast && (
          <div className="absolute top-4 left-4 z-45 bg-indigo-900/90 backdrop-blur-3xs text-white px-3 py-1.5 rounded-xl shadow-lg border border-indigo-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 animate-bounce">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{mapToast}</span>
          </div>
        )}

        {/* Loading indicators */}
        {(loadingCoords || !leafletLoaded) && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-3xs z-50 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sincronizando coordenadas...</p>
          </div>
        )}

        {/* Empty status check popup */}
        {leafletLoaded && activitiesWithCoords.length === 0 && !loadingCoords && (
          <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-3xs z-20 flex flex-col items-center justify-center text-center p-6 space-y-2">
            <Compass className="w-10 h-10 text-slate-300 mx-auto animate-spin" style={{ animationDuration: "10s" }} />
            <p className="text-xs font-black text-slate-700">Aguardando localizações</p>
            <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed">
              Adicione atrativos, nomes ou queries do Google Maps nas suas atividades para traçar rota e pins neste dia!
            </p>
          </div>
        )}
      </div>

      {/* Location Pill Carousel Row - Highly visible sequential navigation pills matching screenshot */}
      {activitiesWithCoords.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Linha do Tempo Roteiro:</p>
          <div className="flex gap-2 overflow-x-auto pb-2 pt-0.5 scrollbar-thin select-none max-w-full">
            {activitiesWithCoords.map((item, index) => {
              const isSelected = selectedActivityId === item.activity.id;
              return (
                <button
                  key={item.activity.id}
                  onClick={() => focusOnMarker(item, index)}
                  className={`inline-flex items-center gap-2 px-3 py-2 border rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer hover:scale-102 active:scale-95 shadow-2xs ${
                    isSelected 
                      ? "bg-indigo-600 text-white border-indigo-600 scale-[1.03]" 
                      : "bg-white hover:bg-slate-50 text-slate-750 border-slate-150"
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] ${
                    isSelected ? "bg-white text-indigo-700" : "bg-indigo-100 text-indigo-900"
                  }`}>
                    {index + 1}
                  </span>
                  <span>{item.activity.location}</span>
                  <span className={`text-[9px] font-mono font-medium ${
                    isSelected ? "text-indigo-200" : "text-slate-400"
                  }`}>
                    ({item.activity.time || "S/H"})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
