import React, { useState } from "react";
import { 
  MapPin, 
  Map, 
  Navigation, 
  Plane, 
  Calendar, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Plus, 
  ExternalLink,
  Milestone,
  HelpCircle,
  Clock,
  Car,
  Pencil,
  Trash2,
  User,
  Users,
  Sparkles,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  Ticket,
  Activity,
  RefreshCw,
  X,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import { Destination, FlightInfo, Traveler, CostItem, FlightPassenger } from "../types";
import { parseRangeToDates, formatDatesRange, canDeleteEntity } from "../utils";
import { motion, AnimatePresence } from "motion/react";
import AIPlannerWidget from "./AIPlannerWidget";
import MapsSelectorModal from "./MapsSelectorModal";
import TripCountdown from "./TripCountdown";
import { getAiHeaders } from "../utils/geminiClient";

interface OverviewTabProps {
  title?: string;
  destinations: Destination[];
  flights: FlightInfo[];
  travelers: Traveler[];
  costs: CostItem[];
  setActiveTab: (tab: string) => void;
  setSelectedDestinationId: (id: string) => void;
  onUpdateFlight: (updatedFlight: FlightInfo) => void;
  onAddFlight: (item: Omit<FlightInfo, "id">) => void;
  onRemoveFlight: (id: string) => void;
  token: string | null;
  isOffline: boolean;
  onImportGeneratedItinerary: (title: string, payload: any) => void;
  isReadOnly?: boolean;
  onEditDestination?: (id: string, updatedDest: Omit<Destination, "id" | "days">) => void;
  onRemoveDestination?: (id: string) => void;
  onRateDestination?: (destinationId: string, rating: number) => void;
  onAddNotification?: (notification: { title: string; description: string; type: "gate" | "schedule" | "important" | "system" }) => void;
  currentUser?: { email?: string; name?: string; isTraveler?: boolean } | null;
}

function formatFlightDate(dateStr: string): string {
  if (!dateStr) return "Pendente";
  if (!dateStr.includes("-")) {
    return dateStr; // Fallback for old formatted strings
  }
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    
    const weekday = date.toLocaleDateString("pt-BR", { weekday: "short", timeZone: "UTC" }).replace(".", "");
    const dayNum = date.toLocaleDateString("pt-BR", { day: "numeric", timeZone: "UTC" });
    const monthName = date.toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" }).replace(".", "");
    
    return `${weekday}, ${dayNum} ${monthName}`;
  } catch (error) {
    return dateStr;
  }
}

export default function OverviewTab({
  title,
  destinations,
  flights,
  travelers,
  costs,
  setActiveTab,
  setSelectedDestinationId,
  onUpdateFlight,
  onAddFlight,
  onRemoveFlight,
  token,
  isOffline,
  onImportGeneratedItinerary,
  isReadOnly = false,
  onEditDestination,
  onRemoveDestination,
  onRateDestination,
  onAddNotification,
  currentUser,
}: OverviewTabProps) {
  const userEmailNormalized = currentUser?.email?.toLowerCase().trim() || "";
  const currentUserTraveler = userEmailNormalized 
    ? travelers.find(t => t.email?.toLowerCase().trim() === userEmailNormalized)
    : undefined;
  const userRole = currentUserTraveler?.role || "Viajante";

  const sortedFlights = [...flights].sort((a, b) => {
    const dateA = a.dateStr || "";
    const dateB = b.dateStr || "";
    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }
    const timeA = a.departureTime || "";
    const timeB = b.departureTime || "";
    return timeA.localeCompare(timeB);
  });

  const [selectedHotelForRoute, setSelectedHotelForRoute] = useState<Destination | null>(null);
  const [mapModalTarget, setMapModalTarget] = useState<{
    title: string;
    query: string;
    latitude?: number;
    longitude?: number;
  } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState("");
  const [calculatedRoute, setCalculatedRoute] = useState<{
    distance: string;
    duration: string;
    steps: string[];
  } | null>(null);

  // Flight Editing States
  const [editingFlight, setEditingFlight] = useState<FlightInfo | null>(null);
  const [flightToDeleteId, setFlightToDeleteId] = useState<string | null>(null);
  const [editAirline, setEditAirline] = useState("");
  const [editFlightCode, setEditFlightCode] = useState("");
  const [editDepartureCity, setEditDepartureCity] = useState("");
  const [editDepartureCode, setEditDepartureCode] = useState("");
  const [editDepartureTime, setEditDepartureTime] = useState("");
  const [editArrivalCity, setEditArrivalCity] = useState("");
  const [editArrivalCode, setEditArrivalCode] = useState("");
  const [editArrivalTime, setEditArrivalTime] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editDateStr, setEditDateStr] = useState("");
  const [editArrivalDateStr, setEditArrivalDateStr] = useState("");
  const [editStatus, setEditStatus] = useState<FlightInfo["status"]>("Confirmado");
  const [editGate, setEditGate] = useState("");
  const [editLocator, setEditLocator] = useState("");
  const [editPassengersList, setEditPassengersList] = useState<FlightPassenger[]>([]);
  const [editTicketFileName, setEditTicketFileName] = useState("");
  const [editTicketFileData, setEditTicketFileData] = useState("");
  const [viewingBoardingPass, setViewingBoardingPass] = useState<{ flight: FlightInfo, passenger?: FlightPassenger } | null>(null);
  const [zoomScale, setZoomScale] = useState(1);

  // Flight Monitoring States
  const [monitoringId, setMonitoringId] = useState<string | null>(null);
  const [simulatedCheckInMap, setSimulatedCheckInMap] = useState<Record<string, boolean>>({});

  const handleMonitorFlight = async (flight: FlightInfo) => {
    if (!token) return;
    setMonitoringId(flight.id);
    const forceCheckInOpen = !!simulatedCheckInMap[flight.id];

    try {
      const response = await fetch("/api/gemini/monitor-flight", {
        method: "POST",
        headers: getAiHeaders({
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }),
        body: JSON.stringify({
          flightCode: flight.flightCode,
          airline: flight.airline,
          departureCode: flight.departureCode,
          arrivalCode: flight.arrivalCode,
          currentStatus: flight.status,
          forceCheckInOpen
        })
      });

      if (!response.ok) {
        throw new Error("Falha ao tentar se conectar ao serviço inteligente de monitoramento.");
      }

      const data = await response.json();
      
      // Update flight if status exists
      if (data.status) {
        let updated: FlightInfo = {
          ...flight,
          status: data.status,
        };
        if (data.gate) {
          updated.gate = data.gate;
        }
        onUpdateFlight(updated);

        // If status changed to 'Check-in aberto'
        if (data.status === "Check-in aberto" && flight.status !== "Check-in aberto") {
          if (onAddNotification) {
            onAddNotification({
              title: "Check-in Aberto!",
              description: data.message || `O check-in para o voo ${flight.flightCode} já está aberto.`,
              type: "important"
            });
          }
        } else if (data.statusChanged && onAddNotification) {
          onAddNotification({
            title: `Voo ${flight.flightCode} Atualizado`,
            description: data.message || `Mudança de status para ${data.status}.`,
            type: "gate"
          });
        }
      }
    } catch (err: any) {
      console.error("Monitor flight error:", err);
      if (onAddNotification) {
        onAddNotification({
          title: "Erro de Monitoramento",
          description: `Falha ao verificar status para ${flight.flightCode}: ${err.message}`,
          type: "system"
        });
      }
    } finally {
      setMonitoringId(null);
    }
  };

  const handleStartEdit = (flight: FlightInfo) => {
    setEditingFlight(flight);
    setEditAirline(flight.airline);
    setEditFlightCode(flight.flightCode);
    setEditDepartureCity(flight.departureCity);
    setEditDepartureCode(flight.departureCode);
    setEditDepartureTime(flight.departureTime);
    setEditArrivalCity(flight.arrivalCity);
    setEditArrivalCode(flight.arrivalCode);
    setEditArrivalTime(flight.arrivalTime);
    setEditDuration(flight.duration);
    setEditDateStr(flight.dateStr);
    setEditArrivalDateStr(flight.arrivalDateStr || "");
    setEditStatus(flight.status);
    setEditGate(flight.gate || "");
    setEditLocator(flight.locator || "");
    setEditPassengersList(flight.passengersList || []);
    setEditTicketFileName(flight.ticketFileName || "");
    setEditTicketFileData(flight.ticketFileData || "");
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFlight) return;

    onUpdateFlight({
      ...editingFlight,
      airline: editAirline.trim(),
      flightCode: editFlightCode.trim(),
      departureCity: editDepartureCity.trim(),
      departureCode: editDepartureCode.trim().toUpperCase(),
      departureTime: editDepartureTime.trim(),
      arrivalCity: editArrivalCity.trim(),
      arrivalCode: editArrivalCode.trim().toUpperCase(),
      arrivalTime: editArrivalTime.trim(),
      duration: editDuration.trim(),
      dateStr: editDateStr.trim(),
      arrivalDateStr: editArrivalDateStr.trim() || undefined,
      status: editStatus,
      gate: editGate.trim() || undefined,
      locator: editLocator.trim() || undefined,
      passengersList: editPassengersList,
      ticketFileName: editTicketFileName || undefined,
      ticketFileData: editTicketFileData || undefined
    });

    setEditingFlight(null);
  };

  // Flight Adding States
  const [showAddFlightModal, setShowAddFlightModal] = useState(false);
  const [addAirline, setAddAirline] = useState("");
  const [addFlightCode, setAddFlightCode] = useState("");
  const [addDepartureCity, setAddDepartureCity] = useState("");
  const [addDepartureCode, setAddDepartureCode] = useState("");
  const [addDepartureTime, setAddDepartureTime] = useState("");
  const [addArrivalCity, setAddArrivalCity] = useState("");
  const [addArrivalCode, setAddArrivalCode] = useState("");
  const [addArrivalTime, setAddArrivalTime] = useState("");
  const [addDuration, setAddDuration] = useState("");
  const [addDateStr, setAddDateStr] = useState("");
  const [addArrivalDateStr, setAddArrivalDateStr] = useState("");
  const [addStatus, setAddStatus] = useState<FlightInfo["status"]>("Confirmado");
  const [expandedFlightIds, setExpandedFlightIds] = useState<Record<string, boolean>>({});
  const [addGate, setAddGate] = useState("");
  const [addLocator, setAddLocator] = useState("");
  const [addPassengersList, setAddPassengersList] = useState<FlightPassenger[]>([]);
  const [addTicketFileName, setAddTicketFileName] = useState("");
  const [addTicketFileData, setAddTicketFileData] = useState("");

  // Destination Editing state
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null);
  const [editCityName, setEditCityName] = useState("");
  const [editCityStateName, setEditCityStateName] = useState("");
  const [editCountryName, setEditCountryName] = useState("");
  const [editDatesStr, setEditDatesStr] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editHotelName, setEditHotelName] = useState("");
  const [editHotelLink, setEditHotelLink] = useState("");
  const [editHotelAddress, setEditHotelAddress] = useState("");
  const [editCheckInTime, setEditCheckInTime] = useState("");
  const [editCheckOutTime, setEditCheckOutTime] = useState("");

  const handleStartEditDestination = (dest: Destination) => {
    setEditingDestination(dest);
    setEditCityName(dest.city || "");
    setEditCityStateName(dest.state || "");
    setEditCountryName(dest.country || "Estados Unidos");
    setEditDatesStr(dest.dates || "");
    
    // Automatically parse or find start and end dates
    if (dest.startDate) {
      setEditStartDate(dest.startDate);
    } else {
      const parsed = parseRangeToDates(dest.dates || "");
      setEditStartDate(parsed.startDate);
    }

    if (dest.endDate) {
      setEditEndDate(dest.endDate);
    } else {
      const parsed = parseRangeToDates(dest.dates || "");
      setEditEndDate(parsed.endDate);
    }

    setEditHotelName(dest.hotelName || "");
    setEditHotelLink(dest.hotelLink || "");
    setEditHotelAddress(dest.hotelAddress || "");
    setEditCheckInTime(dest.checkInTime || "");
    setEditCheckOutTime(dest.checkOutTime || "");
  };

  const handleSaveDestinationEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDestination || !onEditDestination) return;

    const finalStart = editStartDate || "2026-07-01";
    const finalEnd = editEndDate || "2026-07-04";
    const formattedRange = formatDatesRange(finalStart, finalEnd) || editDatesStr.trim();

    onEditDestination(editingDestination.id, {
      city: editCityName.trim(),
      state: editCityStateName.trim(),
      country: editCountryName.trim(),
      dates: formattedRange,
      startDate: finalStart,
      endDate: finalEnd,
      hotelName: editHotelName.trim(),
      hotelLink: editHotelLink.trim(),
      hotelAddress: editHotelAddress.trim(),
      checkInTime: editCheckInTime.trim(),
      checkOutTime: editCheckOutTime.trim(),
    });

    setEditingDestination(null);
  };

  // Flight OCR States
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatusText, setOcrStatusText] = useState("");
  const [ocrError, setOcrError] = useState("");
  const [ocrSuccess, setOcrSuccess] = useState("");
  const [ocrMultipleImported, setOcrMultipleImported] = useState(false);
  const [detectedFlights, setDetectedFlights] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFileForOcr = async (file: File) => {
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      setOcrError("Por favor, envie apenas arquivos de imagem (PNG, JPEG, WEBP) ou PDFs.");
      return;
    }

    setOcrLoading(true);
    setOcrProgress(5);
    setOcrStatusText("Lendo arquivo e convertendo formato...");
    setOcrError("");
    setOcrSuccess("");
    setOcrMultipleImported(false);
    setDetectedFlights([]);

    let progressInterval: NodeJS.Timeout | null = null;
    let simulatedProgress = 5;

    // Start simulating progress updates
    progressInterval = setInterval(() => {
      if (simulatedProgress < 98) {
        simulatedProgress += Math.floor(Math.random() * 8) + 2;
        if (simulatedProgress > 98) simulatedProgress = 98;
        
        let status = "Lendo arquivo e convertendo formato...";
        if (simulatedProgress >= 25 && simulatedProgress < 50) {
          status = "Criptografando e enviando para o servidor...";
        } else if (simulatedProgress >= 50 && simulatedProgress < 75) {
          status = "Analisando com IA do Gemini (OCR & extração)...";
        } else if (simulatedProgress >= 75 && simulatedProgress < 92) {
          status = "Estruturando rota, conexões e passageiros...";
        } else if (simulatedProgress >= 92) {
          status = "Finalizando preenchimento inteligente...";
        }
        
        setOcrProgress(simulatedProgress);
        setOcrStatusText(status);
      }
    }, 350);

    try {
      const reader = new FileReader();
      const { base64Data, dataUrl } = await new Promise<{base64Data: string; dataUrl: string}>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve({
            base64Data: result.split(",")[1],
            dataUrl: result
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/gemini/ocr-flight", {
        method: "POST",
        headers: getAiHeaders({
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }),
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: file.type,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Erro ao escanear o bilhete.");
      }

      const data = await res.json();
      if (data.flights && data.flights.length > 0) {
        if (data.flights.length > 1) {
          // Point 2: automatically insert all segments to the database
          data.flights.forEach((flight: any) => {
            onAddFlight({
              airline: flight.airline?.trim() || "",
              flightCode: flight.flightCode?.trim() || "",
              departureCity: flight.departureCity?.trim() || "",
              departureCode: flight.departureCode?.trim().toUpperCase() || "",
              departureTime: flight.departureTime?.trim() || "",
              arrivalCity: flight.arrivalCity?.trim() || "",
              arrivalCode: flight.arrivalCode?.trim().toUpperCase() || "",
              arrivalTime: flight.arrivalTime?.trim() || "",
              duration: flight.duration?.trim() || "",
              dateStr: flight.dateStr?.trim() || "",
              arrivalDateStr: (flight.arrivalDateStr || flight.dateStr)?.trim() || undefined,
              status: "Confirmado",
              gate: flight.gate?.trim() || undefined,
              locator: flight.locator?.trim() || undefined,
              passengersList: flight.passengersList && Array.isArray(flight.passengersList)
                ? flight.passengersList.map((p: any) => ({
                    id: p.id || `fp-${Math.random().toString(36).substring(7)}`,
                    name: p.name?.trim() || "",
                    seat: p.seat?.trim() || undefined
                  }))
                : undefined,
              ticketFileName: file.name,
              ticketFileData: dataUrl
            });
          });
          setOcrSuccess(`Sucesso! Encontramos ${data.flights.length} trechos de voo e inserimos todos automaticamente no seu roteiro.`);
          setOcrMultipleImported(true);
          setDetectedFlights([]);
        } else {
          setDetectedFlights(data.flights);
          setOcrSuccess(`Sucesso! Encontramos 1 trecho de voo.`);
          setAddTicketFileName(file.name);
          setAddTicketFileData(dataUrl);
          prefillFormWithFlight(data.flights[0]);
        }
      } else {
        setOcrError("Não conseguimos extrair voos estruturados deste bilhete. Tente novamente.");
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || "Falha ao escanear bilhete com IA.";
      
      // Improve 503 error handling specifically for API capacity issues
      if (errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("capacity") || errMsg.includes("demand")) {
        errMsg = "Os servidores de Inteligência Artificial estão com alta demanda no momento. Aguarde alguns instantes e tente novamente (Erro 503/Indisponível).";
      } else if (errMsg.includes("JSON")) {
        errMsg = "Erro interno ao processar a resposta da Inteligência Artificial. Tente novamente.";
      }
      
      setOcrError(errMsg);
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setOcrProgress(100);
      setOcrLoading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFileForOcr(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFileForOcr(file);
    }
  };

  const prefillFormWithFlight = (flight: any) => {
    setAddAirline(flight.airline || "");
    setAddFlightCode(flight.flightCode || "");
    setAddDepartureCity(flight.departureCity || "");
    setAddDepartureCode(flight.departureCode || "");
    setAddDepartureTime(flight.departureTime || "");
    setAddArrivalCity(flight.arrivalCity || "");
    setAddArrivalCode(flight.arrivalCode || "");
    setAddArrivalTime(flight.arrivalTime || "");
    setAddDuration(flight.duration || "");
    setAddDateStr(flight.dateStr || "");
    setAddArrivalDateStr(flight.arrivalDateStr || flight.dateStr || "");
    setAddGate(flight.gate || "");
    setAddLocator(flight.locator || "");
    if (flight.passengersList && Array.isArray(flight.passengersList)) {
      setAddPassengersList(
        flight.passengersList.map((p: any) => ({
          id: p.id || `fp-${Math.random().toString(36).substring(7)}`,
          name: p.name || "",
          seat: p.seat || ""
        }))
      );
    } else {
      setAddPassengersList([]);
    }
  };

  const handleImportAllDetected = () => {
    if (detectedFlights.length === 0) return;
    detectedFlights.forEach((flight) => {
      onAddFlight({
        airline: flight.airline?.trim() || "",
        flightCode: flight.flightCode?.trim() || "",
        departureCity: flight.departureCity?.trim() || "",
        departureCode: flight.departureCode?.trim().toUpperCase() || "",
        departureTime: flight.departureTime?.trim() || "",
        arrivalCity: flight.arrivalCity?.trim() || "",
        arrivalCode: flight.arrivalCode?.trim().toUpperCase() || "",
        arrivalTime: flight.arrivalTime?.trim() || "",
        duration: flight.duration?.trim() || "",
        dateStr: flight.dateStr?.trim() || "",
        arrivalDateStr: (flight.arrivalDateStr || flight.dateStr)?.trim() || undefined,
        status: "Confirmado",
        gate: flight.gate?.trim() || undefined,
        locator: flight.locator?.trim() || undefined,
        passengersList: flight.passengersList && Array.isArray(flight.passengersList)
          ? flight.passengersList.map((p: any) => ({
              id: p.id || `fp-${Math.random().toString(36).substring(7)}`,
              name: p.name?.trim() || "",
              seat: p.seat?.trim() || undefined
            }))
          : undefined
      });
    });
    setDetectedFlights([]);
    setOcrSuccess("");
    setShowAddFlightModal(false);
  };

  const handleStartAdd = () => {
    setAddAirline("");
    setAddFlightCode("");
    setAddDepartureCity("");
    setAddDepartureCode("");
    setAddDepartureTime("");
    setAddArrivalCity("");
    setAddArrivalCode("");
    setAddArrivalTime("");
    setAddDuration("");
    setAddDateStr("");
    setAddArrivalDateStr("");
    setAddStatus("Confirmado");
    setAddGate("");
    setAddLocator("");
    setAddPassengersList([]);
    setAddTicketFileName("");
    setAddTicketFileData("");
    setOcrLoading(false);
    setOcrError("");
    setOcrSuccess("");
    setOcrMultipleImported(false);
    setDetectedFlights([]);
    setIsDragging(false);
    setShowAddFlightModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddFlight({
      airline: addAirline.trim(),
      flightCode: addFlightCode.trim(),
      departureCity: addDepartureCity.trim(),
      departureCode: addDepartureCode.trim().toUpperCase(),
      departureTime: addDepartureTime.trim(),
      arrivalCity: addArrivalCity.trim(),
      arrivalCode: addArrivalCode.trim().toUpperCase(),
      arrivalTime: addArrivalTime.trim(),
      duration: addDuration.trim(),
      dateStr: addDateStr.trim(),
      arrivalDateStr: addArrivalDateStr.trim() || undefined,
      status: addStatus,
      gate: addGate.trim() || undefined,
      locator: addLocator.trim() || undefined,
      passengersList: addPassengersList,
      ticketFileName: addTicketFileName || undefined,
      ticketFileData: addTicketFileData || undefined
    });
    setShowAddFlightModal(false);
  };

  // Calculate quick stats
  const totalCost = costs.reduce((sum, c) => sum + c.totalCostBRL, 0);
  const totalPerPerson = totalCost / Math.max(1, travelers.length);

  // Setup geolocation routing
  const handleGetDirections = (destination: Destination) => {
    setSelectedHotelForRoute(destination);
    setCalculatedRoute(null);
    setUserLocation(null);
    setLocError("");
  };

  const startLocatingUser = () => {
    if (!navigator.geolocation) {
      setLocError("Geolocalização não é suportada pelo seu navegador.");
      return;
    }

    setLocLoading(true);
    setLocError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(coords);
        setLocLoading(false);

        // Generate high-fidelity simulated routing to the selected hotel Coords
        if (selectedHotelForRoute) {
          // We can calculate a realistic distance based on simple math or mock realistic road distance
          // Since they are probably in Brazil/abroad testing compared to USA, mock a clean routing simulation
          // Let's check coordinates. If they are very far (thousands of KM), say "Rota Intercontinental Calculada" or "Simulando Rota Local Desta Seção"
          const earthRadius = 6371; // km
          const dLat = (selectedHotelForRoute.hotelCoords!.lat - coords.lat) * Math.PI / 180;
          const dLng = (selectedHotelForRoute.hotelCoords!.lng - coords.lng) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(coords.lat * Math.PI / 180) * Math.cos(selectedHotelForRoute.hotelCoords!.lat * Math.PI / 180) * 
            Math.sin(dLng/2) * Math.sin(dLng/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distanceValue = earthRadius * c;

          const isOverSeas = distanceValue > 800; // if thousands of kms away

          let formattedDistance = "";
          let formattedDuration = "";
          let steps: string[] = [];

          if (isOverSeas) {
            formattedDistance = "7.842 km (Voo Comercial + Trânsito)";
            formattedDuration = "11h 15min";
            steps = [
              `Sair da sua localização atual em direção ao Aeroporto mais próximo.`,
              `Embarcar no voo em direção ao Aeroporto Internacional de Dulles (IAD) ou JFK.`,
              `Desembarcar nos Estados Unidos, retirar bagagens e passar na imigração.`,
              `Dirigir-se ao guichê de aluguel de carros (locadora reservada: R$ 11.318,58).`,
              `Acessar a rodovia principal US-50 E em direção a Washington / Nova York.`,
              `Pegar a saída em direção a ${selectedHotelForRoute.hotelAddress}.`,
              `Chegar ao ${selectedHotelForRoute.hotelName}. Check-in de 15:00 disponível!`
            ];
          } else {
            formattedDistance = `${distanceValue.toFixed(1)} km`;
            const durationMins = Math.round(distanceValue * 1.5);
            formattedDuration = `${durationMins} minutos de carro`;
            steps = [
              `Sair da sua localização em direção à via principal mais próxima.`,
              `Pegar acesso expresso em direção ao centro de ${selectedHotelForRoute.city}.`,
              `Utilizar a faixa da esquerda para tomar a saída expressa do aeroporto/rodovia.`,
              `Seguir as orientações de tráfego até o cruzamento local.`,
              `Vire à direita em direção ao endereço: ${selectedHotelForRoute.hotelAddress}.`,
              `O destino final ${selectedHotelForRoute.hotelName} estará à sua direita.`
            ];
          }

          setCalculatedRoute({
            distance: formattedDistance,
            duration: formattedDuration,
            steps
          });
        }
      },
      (error) => {
        console.error(error);
        setLocLoading(false);
        // Fallback simulated route for testability when location permission is blocked
        setLocError("Não foi possível obter sua localização real. Simulando de qualquer forma...");
        simulateMockRoute();
      },
      { timeout: 8000 }
    );
  };

  const simulateMockRoute = () => {
    if (!selectedHotelForRoute) return;
    setCalculatedRoute({
      distance: "8.5 km (Simulado)",
      duration: "14 min de carro",
      steps: [
        "Sair da sua localização atual (Aeroporto de Dulles / Centro Urbano).",
        "Seguir as placas para a I-66 E / Washington.",
        "Pegar a saída 14 em direção ao distrito do hotel.",
        "Seguir na faixa da esquerda até a New York Ave.",
        `Virar à direita no endereço: ${selectedHotelForRoute.hotelAddress}.`,
        `Chegar ao ${selectedHotelForRoute.hotelName} com sucesso.`
      ]
    });
  };

  return (
    <div className="space-y-6">
      
      {/* AI PLANNER COMPANION WIDGET */}
      <AIPlannerWidget 
        token={token}
        isOffline={isOffline}
        onImportGeneratedItinerary={onImportGeneratedItinerary}
        setActiveTab={setActiveTab}
        isReadOnly={isReadOnly}
      />
      
      {/* Top Welcome Title Banner */}
      <div className="bg-gradient-to-br from-[#1E3A5F] via-[#162B48] to-[#0F1E33] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-sm border border-[#1E3A5F]/60">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-12 translate-y-6">
          <Plane className="w-80 h-80" />
        </div>
        <div className="space-y-4 relative z-10 max-w-xl">
          <span className="text-[10px] bg-white/15 text-white font-extrabold px-3 py-1 rounded-full uppercase tracking-widest border border-white/10">
            Painel Central da Viagem
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight">{title || "Sua Viagem Personalizada"}</h2>
          <p className="text-sm text-slate-200 leading-relaxed">
            Aqui você encontra todos os detalhes do roteiro, localizações de estadias, planejamento financeiro unificado e os trajetos calculados para o seu grupo de {travelers.length} {travelers.length === 1 ? 'viajante' : 'viajantes'}.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button 
              onClick={() => setActiveTab("itinerary")}
              className="px-4 py-2 bg-white text-[#1E3A5F] rounded-xl text-xs font-black shadow-sm hover:bg-slate-100 transition-all cursor-pointer"
            >
              Ver Diários de Bordo
            </button>
            <button 
              onClick={() => setActiveTab("costs")}
              className="px-4 py-2 bg-[#D95D39] hover:bg-[#C86446] border border-[#D95D39]/40 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Painel Financeiro
            </button>
          </div>
        </div>
      </div>

      {/* COUNTDOWN / TRIP HIGHLIGHT BANNER */}
      <TripCountdown 
        destinations={destinations}
        flights={flights}
        travelers={travelers}
        costs={costs}
        title={title}
        currentUser={currentUser}
        onRateDestination={onRateDestination}
      />



      {/* COMPACT FLIGHT BLOCK (Just like Image 1) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-indigo-600" />
            <h3 className="font-extrabold text-slate-800 text-sm">Informações de Voos</h3>
          </div>
          <div className="flex items-center gap-2">
            {!isReadOnly && (
              <button
                onClick={handleStartAdd}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-100 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Trecho
              </button>
            )}
            <span className="text-[10px] bg-red-50 text-rose-700 font-extrabold px-3 py-1 rounded-full uppercase border border-rose-100">
              Internacional
            </span>
          </div>
        </div>

        {sortedFlights.length === 0 ? (
          <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-250">
            <p className="text-xs font-semibold text-slate-500">Nenhum trecho de voo cadastrado.</p>
            {!isReadOnly && (
              <button
                onClick={handleStartAdd}
                className="mt-2 text-xs font-bold text-indigo-650 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                Criar o Primeiro Trecho <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          sortedFlights.map((flight) => {
            if (flight.isDeleted) {
              return (
                <div key={flight.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 border-dashed flex justify-between items-center opacity-60 hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-sm font-bold text-slate-500 line-through decoration-slate-300">
                        {flight.departureCode} → {flight.arrivalCode} ({flight.airline})
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Marcado como excluído</p>
                    </div>
                  </div>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => onUpdateFlight({ ...flight, isDeleted: false })}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 focus:ring-2 focus:ring-emerald-500/20 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                      title="Restaurar este trecho"
                    >
                      Desfazer
                    </button>
                  )}
                </div>
              );
            }

            const isCollapsed = flight.status === "Finalizado" && !expandedFlightIds[flight.id];
            if (isCollapsed) {
              return (
                <div 
                  key={flight.id} 
                  onClick={() => setExpandedFlightIds(prev => ({ ...prev, [flight.id]: true }))}
                  className="bg-slate-50/70 hover:bg-slate-100/90 p-3.5 rounded-2xl border border-slate-200/50 transition-all cursor-pointer flex items-center justify-between shadow-3xs animate-fadeIn"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-200/60 flex items-center justify-center text-slate-450 shrink-0">
                      <Plane className="w-4 h-4 transform rotate-45" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-700 leading-tight flex items-center gap-1.5 flex-wrap">
                        <span>{flight.departureCode}</span>
                        <span className="text-slate-400 font-medium">→</span>
                        <span>{flight.arrivalCode}</span>
                        <span className="text-slate-300 font-normal">|</span>
                        <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md leading-none">{flight.airline} • {flight.flightCode}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        {formatFlightDate(flight.dateStr)} • {flight.departureTime}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!isReadOnly ? (
                      <select
                        value={flight.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          onUpdateFlight({ ...flight, status: e.target.value as any });
                        }}
                        className="text-[9px] font-black uppercase text-slate-700 bg-slate-200/80 hover:bg-slate-300/80 px-2 py-0.5 rounded-md cursor-pointer focus:outline-none"
                      >
                        <option value="Finalizado">Finalizado</option>
                        <option value="Confirmado">Confirmado</option>
                        <option value="Check-in aberto">Check-in aberto</option>
                        <option value="Em voo">Em voo</option>
                        <option value="Atrasado">Atrasado</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    ) : (
                      <span className="text-[9px] font-black uppercase text-slate-550 bg-slate-200/65 px-2 py-0.5 rounded-md">
                        {flight.status}
                      </span>
                    )}
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            }

            return (
              <div key={flight.id} className="bg-slate-50/90 p-4 sm:p-5 rounded-2xl border border-slate-200/60 space-y-3 shadow-2xs animate-fadeIn">
              <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-slate-400">
                <span className="uppercase tracking-wider">Roteiro de Voo</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-indigo-650 font-extrabold bg-indigo-50 border border-indigo-150 px-2.5 py-0.5 rounded-lg text-[10px] sm:text-xs">{flight.airline} • {flight.flightCode}</span>
                  {flight.status === "Finalizado" && (
                    <button
                      type="button"
                      onClick={() => setExpandedFlightIds(prev => ({ ...prev, [flight.id]: false }))}
                      className="p-1 text-slate-400 hover:text-indigo-650 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                      title="Minimizar Voo"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => handleStartEdit(flight)}
                      className="p-1 text-slate-400 hover:text-indigo-650 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
                      title="Editar Voo"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-3 items-center justify-between gap-1 sm:gap-4">
                <div>
                  <p className="text-xl sm:text-2xl font-black text-slate-800 leading-none">{flight.departureCode}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase truncate mt-1">{flight.departureCity}</p>
                  <div className="mt-2 space-y-0.5">
                    <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Saída</p>
                    <p className="text-[10px] sm:text-[11px] font-bold text-slate-600 leading-none">{formatFlightDate(flight.dateStr)}</p>
                    <p className="text-xs sm:text-sm font-black text-slate-900 leading-none mt-0.5">{flight.departureTime}</p>
                  </div>
                </div>

                <div className="flex flex-col items-center grow px-1 text-center">
                  <p className="text-[9px] font-extrabold text-slate-450 shrink-0">{flight.duration}</p>
                  <div className="w-full h-0.5 bg-slate-200 relative my-1.5">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-0.5 border border-slate-200">
                      <Plane className="w-3 h-3 text-indigo-600 transform rotate-45" />
                    </div>
                  </div>
                  {!isReadOnly ? (
                    <select
                      value={flight.status}
                      onChange={(e) => onUpdateFlight({ ...flight, status: e.target.value as any })}
                      className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded font-black uppercase shrink-0 cursor-pointer focus:outline-none transition ${
                        flight.status === "Finalizado" ? "text-slate-600 bg-slate-200/70 border border-slate-300" :
                        flight.status === "Check-in aberto" ? "text-emerald-700 bg-emerald-50 border border-emerald-200" :
                        flight.status === "Em voo" ? "text-blue-700 bg-blue-50 border border-blue-200" :
                        flight.status === "Atrasado" ? "text-amber-700 bg-amber-50 border border-amber-200" :
                        flight.status === "Cancelado" ? "text-rose-700 bg-rose-50 border border-rose-200" :
                        "text-emerald-700 bg-emerald-50 border border-emerald-200"
                      }`}
                    >
                      <option value="Confirmado">Confirmado</option>
                      <option value="Check-in aberto">Check-in aberto</option>
                      <option value="Em voo">Em voo</option>
                      <option value="Atrasado">Atrasado</option>
                      <option value="Finalizado">Finalizado</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                  ) : (
                    <span className="text-[9px] sm:text-[10px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded font-black uppercase shrink-0">
                      {flight.status}
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-xl sm:text-2xl font-black text-slate-800 leading-none">{flight.arrivalCode}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase truncate mt-1">{flight.arrivalCity}</p>
                  <div className="mt-2 space-y-0.5">
                    <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Chegada</p>
                    <p className="text-[10px] sm:text-[11px] font-bold text-slate-600 leading-none">{formatFlightDate(flight.arrivalDateStr || flight.dateStr)}</p>
                    <p className="text-xs sm:text-sm font-black text-rose-600 leading-none mt-0.5">{flight.arrivalTime}</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/60 flex flex-wrap justify-between items-center gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span>Portão: <strong className="text-slate-800 font-extrabold">{flight.gate || "Pendente"}</strong></span>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span>Localizador: <strong className="text-indigo-650 font-black tracking-wider uppercase bg-indigo-50/55 px-2 py-0.5 rounded border border-indigo-100">{flight.locator || "Pendente"}</strong></span>
                </div>
                {!isReadOnly && (
                  <div className="flex items-center gap-2 ms-auto sm:ms-0">
                    {flightToDeleteId === flight.id ? (
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm animate-fadeIn">
                        <span className="text-[10px] text-rose-600 font-extrabold uppercase px-1.5 py-0.5 leading-none">Excluir?</span>
                        <button
                          type="button"
                          onClick={() => {
                            onRemoveFlight(flight.id);
                            setFlightToDeleteId(null);
                          }}
                          className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] uppercase font-black transition-all cursor-pointer shadow-xs"
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setFlightToDeleteId(null)}
                          className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-[10px] uppercase font-black transition-all cursor-pointer border border-slate-200"
                        >
                          Não
                        </button>
                      </div>
                    ) : (() => {
                      const authorized = canDeleteEntity(userRole, currentUser?.email, flight.createdByEmail);
                      return (
                        <button
                          type="button"
                          disabled={!authorized}
                          onClick={() => authorized && setFlightToDeleteId(flight.id)}
                          className={`p-1 px-2 rounded-lg transition-colors flex items-center gap-1 font-bold text-[10px] uppercase ms-auto sm:ms-0 ${
                            authorized 
                              ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" 
                              : "text-slate-200 bg-slate-50 opacity-40 cursor-not-allowed"
                          }`}
                          title={authorized ? "Remover Trecho" : "Sem permissão de exclusão (apenas Criador ou Administrador)"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remover Trecho
                        </button>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* CARTÃO DE EMBARQUE ROW */}
              <div className="mt-2.5 pt-2.5 border-t border-slate-150 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block">Cartão:</span>
                  {flight.ticketFileName ? (
                    <span 
                      onClick={() => setViewingBoardingPass({ flight })}
                      className="text-[11px] font-semibold text-indigo-700 truncate max-w-[170px] sm:max-w-[240px] bg-indigo-50/50 hover:bg-indigo-100/60 px-2.5 py-1 rounded-lg border border-indigo-100 cursor-pointer flex items-center gap-1 transition-colors"
                      title={flight.ticketFileName}
                    >
                      📎 {flight.ticketFileName}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Nenhum cartão de embarque anexado</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {flight.ticketFileName ? (
                    <button
                      type="button"
                      onClick={() => setViewingBoardingPass({ flight })}
                      className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg transition-all flex items-center gap-1 cursor-pointer text-[10px] uppercase tracking-wider shadow-xs shadow-indigo-100"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      Cartão do Voo
                    </button>
                  ) : (
                    !isReadOnly && (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(flight)}
                        className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-extrabold rounded-lg border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer text-[10px] uppercase tracking-wider"
                      >
                        <Plus className="w-3 h-3" />
                        Anexar Cartão
                      </button>
                    )
                  )}
                </div>
              </div>

              {flight.passengersList && flight.passengersList.length > 0 && (
                <div className="mt-2.5 p-3 bg-slate-100/60 border border-slate-200/50 rounded-xl space-y-2 animate-fadeIn w-full">
                  <p className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-450" /> Passageiros do Voo ({flight.passengersList.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {flight.passengersList.map((passenger, pIdx) => (
                      <div key={passenger.id || pIdx} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg pr-1.5 pl-2.5 py-1 shadow-2xs">
                        <span className="font-bold text-slate-700 text-[11px]">{passenger.name}</span>
                        {passenger.seat && (
                          <span className="text-[9px] uppercase font-black tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-1 py-0.5 rounded-md leading-none shrink-0">
                            {passenger.seat}
                          </span>
                        )}
                        {!passenger.ticketFileData ? (
                          <button
                            type="button"
                            onClick={() => setViewingBoardingPass({ flight, passenger })}
                            className="ml-1.5 p-1 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-400 rounded-md transition-all cursor-pointer border border-slate-150 hover:border-indigo-100"
                            title="Anexar Cartão de Embarque"
                          >
                            <Paperclip className="w-3 h-3" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setViewingBoardingPass({ flight, passenger })}
                            className="ml-1.5 p-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md transition-colors cursor-pointer border border-indigo-100"
                            title="Ver Cartão de Embarque"
                          >
                            <Ticket className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* HEALTH & STATUS MONITORING ROW */}
              <div id={`flight-monitor-panel-${flight.id}`} className="mt-3 pt-3 border-t border-slate-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-indigo-50/25 p-3 rounded-xl border border-indigo-100/30">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-indigo-500 animate-pulse shrink-0" />
                    <span className="text-slate-700 font-bold text-xs uppercase tracking-wider">Monitoramento Inteligente</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Serviço inteligente integrado ao Gemini para checar alterações críticas de status.
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 shrink-0 self-end sm:self-center">
                  
                  <button
                    type="button"
                    id={`btn-monitor-flight-${flight.id}`}
                    disabled={monitoringId === flight.id}
                    onClick={() => handleMonitorFlight(flight)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-[10px] uppercase tracking-wider shadow-xs shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {monitoringId === flight.id ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <Activity className="w-3 h-3 shrink-0" />
                        Monitorar Voo
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* TRAVEL CITIES ROADMAP SECTION */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Cidades & Hospedagens</h3>
            <span className="text-xs text-indigo-600 font-extrabold">{destinations.length} Paradas</span>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {[...destinations].sort((a, b) => {
              const getVal = (d: Destination) => {
                if (d.startDate) return d.startDate;
                if (d.checkInDate) return d.checkInDate.split('T')[0];
                const dStr = d.dates || "";
                const matchDate = dStr.match(/(\d+)\s*[/]\s*(\d+)/);
                if (matchDate) return `2026-${matchDate[2].padStart(2, '0')}-${matchDate[1].padStart(2, '0')}`;
                
                const matchMonth = dStr.match(/(\d+)\s*[a-zçáõ]+/i);
                if (matchMonth) {
                  const m = matchMonth[0].toLowerCase();
                  const map: any = { jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6, jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12 };
                  let monthIdx = 7;
                  for (let key in map) if (m.includes(key)) monthIdx = map[key];
                  return `2026-${String(monthIdx).padStart(2, '0')}-${matchMonth[1].padStart(2, '0')}`;
                }
                return dStr;
              };
              return getVal(a).localeCompare(getVal(b));
            }).map((dest, idx) => (
              <div 
                key={dest.id} 
                className="group relative bg-slate-50/70 p-4 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-black flex items-center justify-center text-xs">
                      {idx + 1}
                    </div>
                    <p className="font-extrabold text-slate-800 text-sm">{dest.city}, {dest.state}</p>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-indigo-400" /> {dest.dates}
                  </p>
                  <p className="text-xs text-slate-600">
                    Estadia: <strong>{dest.hotelName}</strong>
                  </p>
                  {(dest.checkInTime || dest.checkOutTime) && (
                    <div className="flex gap-2 text-[10px] mt-1 pr-2 flex-wrap font-bold text-slate-500">
                      {dest.checkInTime && (
                        <span className="bg-emerald-50/80 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                          In: {dest.checkInTime}
                        </span>
                      )}
                      {dest.checkOutTime && (
                        <span className="bg-rose-50/80 text-rose-800 px-1.5 py-0.5 rounded border border-rose-100 flex items-center gap-1">
                          Out: {dest.checkOutTime}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setSelectedDestinationId(dest.id);
                      setActiveTab("itinerary");
                    }}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                    title="Ver Roteiro"
                  >
                    Roteiro
                  </button>
                  {!isReadOnly && onEditDestination && (
                    <button
                      onClick={() => handleStartEditDestination(dest)}
                      className="flex items-center justify-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-750 font-bold rounded-xl text-[11px] transition-all cursor-pointer border border-indigo-100"
                      title="Editar esta Parada"
                    >
                      <Pencil className="w-3 h-3 text-indigo-600" />
                      Editar
                    </button>
                  )}
                  {(dest.hotelLink || dest.hotelAddress || dest.hotelName) && (
                    <button
                      onClick={() => {
                        const queryParts = [
                          dest.hotelName,
                          dest.hotelAddress,
                          `${dest.city}, ${dest.country}`
                        ].filter(Boolean).join(", ");
                        setMapModalTarget({
                          title: dest.hotelName || "Hotel do Roteiro",
                          query: queryParts,
                          latitude: dest.hotelCoords?.lat,
                          longitude: dest.hotelCoords?.lng
                        });
                      }}
                      className="flex items-center justify-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                      title="Google Maps"
                    >
                      <Map className="w-3 h-3 text-rose-500" />
                      Google Maps
                    </button>
                  )}
                  <button
                    onClick={() => handleGetDirections(dest)}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-750 rounded-xl text-[11px] font-bold transition-all cursor-pointer border border-indigo-100"
                    title="Como chegar ao hotel"
                  >
                    <Navigation className="w-3 h-3 text-indigo-600" />
                    Como Chegar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COMPREHENSIVE DIRECTIONS CALCULATOR (LOCALIZACAO ATUAL ATÉ O HOTEL) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Milestone className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Rotas ao Vivo GPS</h3>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded font-bold uppercase border border-slate-200">
              Auto Route
            </span>
          </div>

          {selectedHotelForRoute ? (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                <p className="text-[10px] font-extrabold text-indigo-805 uppercase tracking-wider">Destino Selecionado</p>
                <p className="text-xs font-black text-slate-800 mt-0.5">{selectedHotelForRoute.hotelName}</p>
                <p className="text-xs text-slate-500 leading-tight mt-1 inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0 text-rose-500" /> {selectedHotelForRoute.hotelAddress}
                </p>
              </div>

              {!calculatedRoute ? (
                <div className="p-6 border border-dashed border-slate-200 rounded-2xl text-center space-y-3 bg-slate-50">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Você pode utilizar a localização do seu dispositivo para simular um trajeto ao vivo de carro ou metrô até esta estadia nos EUA.
                  </p>
                  
                  {locError && (
                    <p className="text-[11px] font-semibold text-rose-600 bg-rose-50 p-2 rounded-xl border border-rose-100">{locError}</p>
                  )}

                  <div className="flex flex-col sm:flex-row justify-center gap-2 pt-1">
                    <button
                      onClick={startLocatingUser}
                      disabled={locLoading}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 disabled:bg-slate-300"
                    >
                      <Navigation className={`w-3.5 h-3.5 ${locLoading && "animate-spin"}`} />
                      {locLoading ? "Detectando Coordenadas..." : "Minha Localização Atual"}
                    </button>
                    <button
                      onClick={simulateMockRoute}
                      className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition-all border border-slate-200"
                    >
                      Simular Rota Rápida
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Stats of route */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Distância Estimada</span>
                      <strong className="text-sm text-slate-800">{calculatedRoute.distance}</strong>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Tempo Estimado</span>
                      <strong className="text-sm text-slate-800 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" /> {calculatedRoute.duration}
                      </strong>
                    </div>
                  </div>

                  {/* Steps Roadmap */}
                  <div className="bg-slate-800 text-slate-100 p-4 rounded-2xl border border-slate-700 space-y-3 shadow-sm max-h-[220px] overflow-y-auto">
                    <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-700 pb-1.5">
                      <Car className="w-3.5 h-3.5 text-amber-400" /> Passo-a-passo do Navegador
                    </p>
                    <div className="space-y-2.5">
                      {calculatedRoute.steps.map((step, sIdx) => (
                        <div key={sIdx} className="flex gap-2.5 items-start text-xs text-slate-100">
                          <span className="w-4 h-4 rounded-full bg-slate-750 text-slate-300 font-black border border-slate-650 flex items-center justify-center shrink-0 mt-0.5">
                            {sIdx + 1}
                          </span>
                          <span className="leading-relaxed">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setCalculatedRoute(null)}
                    className="w-full py-2 border border-dashed border-slate-300 hover:border-slate-400 text-slate-500 hover:text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition-all"
                  >
                    Resetar e Recalcular Trajeto
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <MapPin className="w-10 h-10 text-slate-300 animate-bounce mb-3" />
              <p className="text-xs font-extrabold text-slate-700">Selecione uma parada no menu de Cidades</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                Clique no botão <strong>"Como Chegar"</strong> de qualquer cidade da esquerda para calcular rotas e ver o guia de direções ao vivo com GPS.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* EDIT FLIGHT MODAL */}
      <AnimatePresence>
        {editingFlight && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
                    <Plane className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">Editar Informações de Voo</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ajuste os horários, aeroportos e status</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingFlight(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-black p-1 hover:bg-slate-100 rounded-lg px-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4 text-xs font-medium text-slate-700">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Companhia Aérea</label>
                    <input
                      type="text"
                      value={editAirline}
                      onChange={(e) => setEditAirline(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-medium text-slate-850"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Código de Voo (LA 702)</label>
                    <input
                      type="text"
                      value={editFlightCode}
                      onChange={(e) => setEditFlightCode(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-medium text-slate-850"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Data de Saída</label>
                    <input
                      type="date"
                      value={editDateStr}
                      onChange={(e) => setEditDateStr(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-medium text-slate-850"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Data de Chegada</label>
                    <input
                      type="date"
                      value={editArrivalDateStr}
                      onChange={(e) => setEditArrivalDateStr(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-medium text-slate-850"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Duração (e.g. 11h 46min)</label>
                    <input
                      type="text"
                      value={editDuration}
                      onChange={(e) => setEditDuration(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-medium text-slate-850"
                      required
                    />
                  </div>
                </div>

                {/* ORIGEM */}
                <div className="p-3 bg-indigo-50/30 rounded-xl border border-indigo-100/40 space-y-2">
                  <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-1">Ponto de Partida (Origem)</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[9px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Cidade de Origem</label>
                      <input
                        type="text"
                        value={editDepartureCity}
                        onChange={(e) => setEditDepartureCity(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-850"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">IATA</label>
                      <input
                        type="text"
                        maxLength={3}
                        value={editDepartureCode}
                        onChange={(e) => setEditDepartureCode(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-850 uppercase font-black"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Horário de Saída</label>
                    <input
                      type="text"
                      value={editDepartureTime}
                      onChange={(e) => setEditDepartureTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-850"
                      required
                    />
                  </div>
                </div>

                {/* DESTINO */}
                <div className="p-3 bg-rose-50/20 rounded-xl border border-rose-100/30 space-y-2">
                  <p className="text-[10px] font-black text-rose-900 uppercase tracking-widest mb-1">Ponto de Chegada (Destino)</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[9px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Cidade de Chegada</label>
                      <input
                        type="text"
                        value={editArrivalCity}
                        onChange={(e) => setEditArrivalCity(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-850"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">IATA</label>
                      <input
                        type="text"
                        maxLength={3}
                        value={editArrivalCode}
                        onChange={(e) => setEditArrivalCode(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-850 uppercase font-black"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Horário de Chegada (e.g. 15:41 (+1))</label>
                    <input
                      type="text"
                      value={editArrivalTime}
                      onChange={(e) => setEditArrivalTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-850"
                      required
                    />
                  </div>
                </div>

                {/* STATUS, GATE & LOCATOR */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Portão (Gate)</label>
                    <input
                      type="text"
                      placeholder="e.g. B24"
                      value={editGate}
                      onChange={(e) => setEditGate(e.target.value)}
                      className="w-full px-2.5 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-medium text-slate-850"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Localizador</label>
                    <input
                      type="text"
                      placeholder="e.g. MZOXND"
                      value={editLocator}
                      onChange={(e) => setEditLocator(e.target.value)}
                      className="w-full px-2.5 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-black uppercase text-indigo-650"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Status do Voo</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full px-2.5 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-semibold text-slate-850"
                    >
                      <option value="Confirmado">Confirmado</option>
                      <option value="Atrasado">Atrasado</option>
                      <option value="Em voo">Em voo</option>
                      <option value="Cancelado">Cancelado</option>
                      <option value="Finalizado">Finalizado</option>
                    </select>
                  </div>
                </div>

                {/* BOARDING PASS ATTACHMENT */}
                <div className="p-3 bg-indigo-50/30 border border-indigo-100 rounded-2xl space-y-2">
                  <label className="text-[10px] font-extrabold text-indigo-950 block uppercase tracking-wider">
                    🎫 Cartão de Embarque (PDF ou Imagem)
                  </label>
                  {editTicketFileName ? (
                    <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-indigo-150 shadow-xs animate-fadeIn">
                      <span className="text-xs font-semibold text-indigo-700 truncate max-w-[240px] flex items-center gap-1.5">
                        📎 {editTicketFileName}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditTicketFileName("");
                          setEditTicketFileData("");
                        }}
                        className="text-[10px] uppercase font-bold text-rose-650 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded transition-colors"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <div className="relative group border border-dashed border-indigo-250 hover:border-indigo-400 bg-white hover:bg-indigo-50/25 transition-all rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              setEditTicketFileName(file.name);
                              setEditTicketFileData(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Paperclip className="w-4 h-4 text-indigo-500 mb-1 shrink-0" />
                      <p className="text-[11px] font-semibold text-slate-700">Anexar Cartão de Embarque</p>
                      <p className="text-[9px] text-slate-450">Toque ou arraste seu PDF/imagem aqui</p>
                    </div>
                  )}
                </div>



                {/* DYNAMIC PASSENGER RELATIONS MANAGER */}
                <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> Passageiros Separados ({editPassengersList.length})
                    </p>
                    <button
                      type="button"
                      onClick={() => setEditPassengersList(prev => [...prev, { id: `fp-${Date.now()}-${Math.random().toString(36).substring(4)}`, name: "", seat: "" }])}
                      className="text-[10px] font-bold text-indigo-650 hover:text-indigo-750 bg-indigo-50 hover:bg-indigo-100 rounded-lg px-2 py-1 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Vincular Passageiro
                    </button>
                  </div>

                  {editPassengersList.length > 0 ? (
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {editPassengersList.map((passenger, index) => (
                        <div key={passenger.id} className="flex gap-2 items-center animate-fadeIn">
                          <input
                            type="text"
                            placeholder="Nome do Passageiro"
                            value={passenger.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditPassengersList(prev => prev.map((p, idx) => idx === index ? { ...p, name: val } : p));
                            }}
                            className="grow px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 text-xs text-slate-850"
                            required
                          />
                          <input
                            type="text"
                            placeholder="Assento"
                            value={passenger.seat || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditPassengersList(prev => prev.map((p, idx) => idx === index ? { ...p, seat: val } : p));
                            }}
                            className="w-16 sm:w-20 px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 text-xs text-slate-850 text-center uppercase font-bold"
                          />
                          <label className={`p-1.5 rounded-lg transition-colors cursor-pointer border ${passenger.ticketFileData ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-slate-50 hover:bg-slate-100 text-slate-400 border-slate-200'}`} title="Anexar Cartão de Embarque">
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    setEditPassengersList(prev => prev.map((p, idx) => idx === index ? { ...p, ticketFileName: file.name, ticketFileData: reader.result as string } : p));
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            <Paperclip className="w-3.5 h-3.5" />
                          </label>
                          <button
                            type="button"
                            onClick={() => setEditPassengersList(prev => prev.filter((_, idx) => idx !== index))}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 border border-transparent rounded-lg transition-colors cursor-pointer"
                            title="Remover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">Nenhum passageiro avulso vinculado a este trecho.</p>
                  )}
                </div>

                <div className="flex justify-end gap-2.5 pt-3.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingFlight(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-100 cursor-pointer"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIEW BOARDING PASS MODAL */}
      <AnimatePresence>
        {viewingBoardingPass && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-2xl w-full space-y-4 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">
                      Cartão de Embarque {viewingBoardingPass.passenger ? `- ${viewingBoardingPass.passenger.name}` : ''}
                    </h3>
                    <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                      {viewingBoardingPass.flight.airline} {viewingBoardingPass.flight.flightCode} | {viewingBoardingPass.flight.departureCode} ➔ {viewingBoardingPass.flight.arrivalCode}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setViewingBoardingPass(null); setZoomScale(1); }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-150 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition-colors cursor-pointer border border-slate-200"
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Passenger and General Flight Tabs */}
              {viewingBoardingPass.flight.passengersList && viewingBoardingPass.flight.passengersList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-2.5 overflow-x-auto shrink-0 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => { setViewingBoardingPass({ flight: viewingBoardingPass.flight }); setZoomScale(1); }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer border flex items-center gap-1.5 shrink-0 ${
                      !viewingBoardingPass.passenger
                        ? 'bg-indigo-600 text-white border-indigo-650 shadow-sm shadow-indigo-100/40'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    Voo Geral
                    {viewingBoardingPass.flight.ticketFileData && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </button>

                  {viewingBoardingPass.flight.passengersList.map((p) => {
                    const isSelected = viewingBoardingPass.passenger?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setViewingBoardingPass({ flight: viewingBoardingPass.flight, passenger: p }); setZoomScale(1); }}
                        className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer border flex items-center gap-1.5 shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-650 shadow-sm shadow-indigo-100/40'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        <User className="w-3.5 h-3.5" />
                        {p.name || "Passageiro"}
                        {p.ticketFileData ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-450" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex-1 overflow-auto min-h-[250px] max-h-[50vh] flex flex-col items-center justify-center bg-slate-50 border border-slate-200/60 rounded-2xl p-4 relative group">
                {(viewingBoardingPass.passenger?.ticketFileData || viewingBoardingPass.flight.ticketFileData) ? (
                  (viewingBoardingPass.passenger?.ticketFileData || viewingBoardingPass.flight.ticketFileData) === "(large_preview_hidden_in_local_storage)" ? (
                    <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 animate-fadeIn">
                      <Ticket className="w-12 h-12 text-indigo-500 animate-pulse mb-1" />
                      <p className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Visualização Otimizada</p>
                      <p className="text-slate-500 text-xs max-w-sm leading-relaxed">
                        Para manter o excelente desempenho do app e respeitar os limites de armazenamento local, este cartão está salvo no servidor e disponível em tempo real.
                      </p>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-250 tracking-wider">
                        ANEXO: {(viewingBoardingPass.passenger?.ticketFileName || viewingBoardingPass.flight.ticketFileName) || "arquivo_passagem"}
                      </span>
                    </div>
                  ) : (viewingBoardingPass.passenger?.ticketFileData || viewingBoardingPass.flight.ticketFileData)?.startsWith("data:application/pdf") ? (
                    <div className="w-full h-full flex flex-col items-center justify-center space-y-4 animate-fadeIn">
                      <iframe 
                        src={viewingBoardingPass.passenger?.ticketFileData || viewingBoardingPass.flight.ticketFileData} 
                        className="w-full h-[400px] rounded-xl border border-slate-200 shadow-sm"
                        title={(viewingBoardingPass.passenger?.ticketFileName || viewingBoardingPass.flight.ticketFileName) || "PDF"} 
                      />
                      <p className="text-slate-400 text-xs italic">Se o PDF não carregar automaticamente na pré-visualização, faça o download utilizando o botão abaixo.</p>
                    </div>
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center overflow-auto p-1.5">
                      <div className="transition-all duration-200 ease-out flex items-center justify-center">
                        <img
                          src={viewingBoardingPass.passenger?.ticketFileData || viewingBoardingPass.flight.ticketFileData}
                          referrerPolicy="no-referrer"
                          alt="Cartão de Embarque"
                          className="rounded-xl shadow-xs animate-fadeIn transition-all duration-200 object-contain"
                          style={{
                            maxHeight: `${380 * zoomScale}px`,
                            maxWidth: zoomScale > 1 ? "none" : "100%",
                          }}
                        />
                      </div>

                      {/* Floating Zoom Panel */}
                      <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-xs p-1.5 rounded-xl shadow-lg border border-slate-700/50 z-10 text-white">
                        <button
                          type="button"
                          disabled={zoomScale <= 0.5}
                          onClick={() => setZoomScale(prev => Math.max(0.5, prev - 0.25))}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 transition-colors border border-slate-700 cursor-pointer"
                          title="Diminuir Zoom"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        
                        <span className="text-[10px] font-black min-w-[34px] text-center font-mono select-none">
                          {Math.round(zoomScale * 100)}%
                        </span>

                        <button
                          type="button"
                          disabled={zoomScale >= 3.0}
                          onClick={() => setZoomScale(prev => Math.min(3.0, prev + 0.25))}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 transition-colors border border-slate-700 cursor-pointer"
                          title="Aumentar Zoom"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>

                        {zoomScale !== 1 && (
                          <button
                            type="button"
                            onClick={() => setZoomScale(1)}
                            className="px-2 h-7 text-[9px] font-black uppercase tracking-wider text-indigo-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 cursor-pointer"
                            title="Resetar Zoom"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-6 animate-fadeIn">
                    <UploadCloud className="w-12 h-12 text-slate-350 stroke-1 mb-2 animate-bounce" />
                    <p className="text-slate-700 font-extrabold text-xs uppercase tracking-wider">
                      {viewingBoardingPass.passenger 
                        ? `Sem cartão para ${viewingBoardingPass.passenger.name}`
                        : "Arquivo ausente ou inválido"
                      }
                    </p>
                    <p className="text-slate-450 text-[11px] mt-1 max-w-xs">
                      {viewingBoardingPass.passenger
                        ? "Utilize o botão de upload abaixo para anexar e vincular o cartão de embarque deste passageiro diretamente."
                        : "Insira novamente o anexo editando o trecho do voo."
                      }
                    </p>
                  </div>
                )}
              </div>

              {!isReadOnly && (
                <div className="w-full p-3 bg-indigo-50/50 border border-indigo-100/80 rounded-2xl flex items-center justify-between gap-3 shrink-0 animate-fadeIn">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100/65 flex items-center justify-center text-indigo-600 shrink-0">
                      <UploadCloud className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-extrabold text-indigo-950 uppercase tracking-wide">Substituir / Enviar Cartão</p>
                      <p className="text-[9px] text-slate-450 font-medium">Envie um novo PDF ou imagem de cartão de embarque</p>
                    </div>
                  </div>
                  <label className="relative cursor-pointer px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider transition-colors shadow-sm shadow-indigo-100 cursor-pointer">
                    <span>Selecionar</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            let updatedFlight = { ...viewingBoardingPass.flight };
                            if (viewingBoardingPass.passenger) {
                              updatedFlight.passengersList = updatedFlight.passengersList?.map(p => 
                                p.id === viewingBoardingPass.passenger!.id 
                                  ? { ...p, ticketFileName: file.name, ticketFileData: reader.result as string }
                                  : p
                              );
                              setViewingBoardingPass({ 
                                flight: updatedFlight, 
                                passenger: { ...viewingBoardingPass.passenger, ticketFileName: file.name, ticketFileData: reader.result as string } 
                              });
                            } else {
                              updatedFlight = {
                                ...updatedFlight,
                                ticketFileName: file.name,
                                ticketFileData: reader.result as string
                              };
                              setViewingBoardingPass({ flight: updatedFlight });
                            }
                            onUpdateFlight(updatedFlight);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              )}

              <div className="flex justify-between items-center pt-3.5 border-t border-slate-100 shrink-0">
                {(viewingBoardingPass.passenger?.ticketFileData || viewingBoardingPass.flight.ticketFileData) && (viewingBoardingPass.passenger?.ticketFileData || viewingBoardingPass.flight.ticketFileData) !== "(large_preview_hidden_in_local_storage)" ? (
                  <a
                    href={viewingBoardingPass.passenger?.ticketFileData || viewingBoardingPass.flight.ticketFileData}
                    download={(viewingBoardingPass.passenger?.ticketFileName || viewingBoardingPass.flight.ticketFileName) || "cartao_de_embarque"}
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border border-indigo-200"
                  >
                    📥 Baixar Arquivo Anexo
                  </a>
                ) : (
                  <div />
                )}
                <button
                  type="button"
                  onClick={() => { setViewingBoardingPass(null); setZoomScale(1); }}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-extrabold text-xs transition-colors cursor-pointer shadow-md shadow-slate-100"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EDIT DESTINATION CITY & ACCOMMODATION MODAL */}
      <AnimatePresence>
        {editingDestination && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">Editar Parada / Hospedagem</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ajuste os detalhes desta parada de viagem</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingDestination(null)}
                  className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveDestinationEdit} className="space-y-4 text-xs">
                {/* Cidade & Estado */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cidade</label>
                    <input
                      type="text"
                      required
                      value={editCityName}
                      onChange={(e) => setEditCityName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-bold text-slate-800"
                      placeholder="Ex: Washington"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</label>
                    <input
                      type="text"
                      required
                      value={editCityStateName}
                      onChange={(e) => setEditCityStateName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-bold text-slate-800"
                      placeholder="Ex: District of Columbia"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">País</label>
                    <input
                      type="text"
                      required
                      value={editCountryName}
                      onChange={(e) => setEditCountryName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-bold text-slate-800"
                      placeholder="Ex: EUA"
                    />
                  </div>
                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Período / Datas</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest block mb-0.5">Início</span>
                        <input
                          type="date"
                          required
                          value={editStartDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditStartDate(val);
                            if (editEndDate) {
                              setEditDatesStr(formatDatesRange(val, editEndDate));
                            }
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-bold text-slate-800 cursor-pointer"
                        />
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest block mb-0.5">Fim</span>
                        <input
                          type="date"
                          required
                          value={editEndDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditEndDate(val);
                            if (editStartDate) {
                              setEditDatesStr(formatDatesRange(editStartDate, val));
                            }
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-bold text-slate-800 cursor-pointer"
                        />
                      </div>
                    </div>
                    {editDatesStr && (
                      <p className="text-[9px] text-indigo-600 font-bold mt-1 uppercase tracking-wider">
                        Formatado: <span className="font-mono bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-sm">{editDatesStr}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2 text-indigo-650">Detalhes da Hospedagem</h4>
                  
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do Hotel ou Pousada</label>
                      <input
                        type="text"
                        required
                        value={editHotelName}
                        onChange={(e) => setEditHotelName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-bold text-slate-800"
                        placeholder="Ex: Ivy City Hotel"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço Completo</label>
                      <input
                        type="text"
                        value={editHotelAddress}
                        onChange={(e) => setEditHotelAddress(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-bold text-slate-800"
                        placeholder="Ex: 1615 New York Ave NE, Washington, DC"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Link de Localização (Google Maps)</label>
                      <input
                        type="text"
                        value={editHotelLink}
                        onChange={(e) => setEditHotelLink(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-bold text-slate-800"
                        placeholder="Ex: https://maps.app.goo.gl/..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Horário de Check-In</label>
                        <input
                          type="text"
                          value={editCheckInTime}
                          onChange={(e) => setEditCheckInTime(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-bold text-slate-800"
                          placeholder="Ex: 15:00"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Horário de Check-Out</label>
                        <input
                          type="text"
                          value={editCheckOutTime}
                          onChange={(e) => setEditCheckOutTime(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-bold text-slate-800"
                          placeholder="Ex: 11:00"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingDestination(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-750 rounded-xl font-bold transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl font-bold transition-all cursor-pointer shadow-md shadow-indigo-100"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD FLIGHT MODAL */}
      <AnimatePresence>
        {showAddFlightModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500">
                    <Plane className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">Adicionar Novo Trecho de Voo</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Insira as informações do novo voo do grupo</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddFlightModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-black p-1 hover:bg-slate-100 rounded-lg px-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* REGIAO OCR SCANNER IA */}
              {!ocrMultipleImported && (
                <div 
                  className={`p-4 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center relative group min-h-[110px] sm:min-h-[120px] ${
                    isDragging 
                      ? "border-indigo-500 bg-indigo-50/40" 
                      : "border-slate-200 bg-slate-50 hover:border-indigo-400 hover:bg-slate-100/30"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                {ocrLoading ? (
                  <div className="w-full space-y-4 py-4 px-2 flex flex-col items-center justify-center animate-fadeIn">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-150 flex items-center justify-center text-indigo-600 shadow-sm">
                        <Plane className="w-4 h-4 animate-bounce" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Escaner Inteligente Ativo</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gemini extraindo informações</p>
                      </div>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="w-full max-w-sm space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">
                        <span className="truncate max-w-[220px] text-indigo-650 font-bold">{ocrStatusText}</span>
                        <span className="bg-indigo-50 font-black text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">{ocrProgress}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 p-0.5">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300 ease-out shadow-xs shadow-indigo-200" 
                          style={{ width: `${ocrProgress}%` }}
                        />
                      </div>
                    </div>

                    <p className="text-[9px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                      Este processo costuma levar de 3 a 8 segundos. Por favor, mantenha o navegador aberto.
                    </p>
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="flight-ocr-file"
                    />
                    <label
                      htmlFor="flight-ocr-file"
                      className="cursor-pointer w-full flex flex-col items-center justify-center py-1.5"
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-150 flex items-center justify-center text-indigo-500 mb-2 group-hover:scale-105 transition-transform">
                        <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">Scanner de IA: Preencher com Print/PDF</p>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-[280px] mx-auto leading-relaxed">
                        Arraste um print ou PDF do bilhete de voo, ou clique para escanear com IA instantaneamente!
                      </p>
                    </label>
                  </>
                )}
              </div>
              )}

              {/* Alertas de Resultado OCR */}
              {ocrError && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 flex items-start gap-2 text-[11px] font-semibold">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{ocrError}</span>
                </div>
              )}

              {ocrSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 flex items-start gap-2 text-[11px] font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-extrabold text-emerald-800 text-sm mb-1">{ocrSuccess}</p>
                    {ocrMultipleImported ? (
                      <div className="mt-2 space-y-3">
                        <p className="text-[11px] text-emerald-700 leading-relaxed font-medium">Todos os trechos encontrados neste cartão de embarque foram estruturados e organizados diretamente no seu roteiro de voos.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddFlightModal(false);
                            setOcrMultipleImported(false);
                            setOcrSuccess("");
                          }}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer text-xs uppercase tracking-wider"
                        >
                          Ir para Meus Voos
                        </button>
                      </div>
                    ) : (
                      <p className="text-[10px] text-emerald-600 mt-0.5">Os campos foram preenchidos abaixo. Revise as informações antes de salvar.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Multi-voo Selector Panel */}
              {detectedFlights.length > 1 && (
                <div className="p-3 bg-indigo-50/20 border border-indigo-100/60 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-wider">
                      Trechos Detectados ({detectedFlights.length})
                    </p>
                    <button
                      type="button"
                      onClick={handleImportAllDetected}
                      className="text-[10px] bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      Importar Todos de Uma Vez!
                    </button>
                  </div>
                  
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                    {detectedFlights.map((flight, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => prefillFormWithFlight(flight)}
                        className="w-full text-left p-2.5 bg-white border border-slate-105 hover:border-indigo-400 hover:bg-indigo-50/10 rounded-xl flex items-center justify-between text-[11px] transition-all cursor-pointer"
                      >
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-slate-800">
                            {flight.airline} {flight.flightCode}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium font-semibold">
                            {flight.departureCode} → {flight.arrivalCode} ({flight.duration || "N/D"})
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-700 text-[10px]">
                            {flight.departureTime} - {flight.arrivalTime}
                          </p>
                          <p className="text-[9px] text-indigo-600 font-extrabold">
                            {flight.dateStr}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!ocrMultipleImported && (
                <form onSubmit={handleAddSubmit} className="space-y-4 text-xs font-medium text-slate-700">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Companhia Aérea</label>
                    <input
                      type="text"
                      placeholder="e.g. American Airlines"
                      value={addAirline}
                      onChange={(e) => setAddAirline(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-medium text-slate-850"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Código de Voo</label>
                    <input
                      type="text"
                      placeholder="e.g. AA 123"
                      value={addFlightCode}
                      onChange={(e) => setAddFlightCode(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-medium text-slate-850"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Data de Saída</label>
                    <input
                      type="date"
                      value={addDateStr}
                      onChange={(e) => setAddDateStr(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-medium text-slate-850"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Data de Chegada</label>
                    <input
                      type="date"
                      value={addArrivalDateStr}
                      onChange={(e) => setAddArrivalDateStr(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-medium text-slate-850"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Duração (e.g. 10h 15min)</label>
                    <input
                      type="text"
                      placeholder="e.g. 09h30min"
                      value={addDuration}
                      onChange={(e) => setAddDuration(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-medium text-slate-850"
                      required
                    />
                  </div>
                </div>

                {/* ORIGEM */}
                <div className="p-3 bg-indigo-50/35 rounded-xl border border-indigo-100/40 space-y-2">
                  <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-1">Ponto de Partida (Origem)</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[9px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Cidade de Origem</label>
                      <input
                        type="text"
                        placeholder="e.g. São Paulo"
                        value={addDepartureCity}
                        onChange={(e) => setAddDepartureCity(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-850"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">IATA</label>
                      <input
                        type="text"
                        maxLength={3}
                        placeholder="GRU"
                        value={addDepartureCode}
                        onChange={(e) => setAddDepartureCode(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-850 uppercase font-black"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Horário de Saída</label>
                    <input
                      type="text"
                      placeholder="e.g. 21:30"
                      value={addDepartureTime}
                      onChange={(e) => setAddDepartureTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-850"
                      required
                    />
                  </div>
                </div>

                {/* DESTINO */}
                <div className="p-3 bg-rose-50/25 rounded-xl border border-rose-100/35 space-y-2">
                  <p className="text-[10px] font-black text-rose-900 uppercase tracking-widest mb-1">Ponto de Chegada (Destino)</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[9px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Cidade de Chegada</label>
                      <input
                        type="text"
                        placeholder="e.g. Washington DC"
                        value={addArrivalCity}
                        onChange={(e) => setAddArrivalCity(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-850"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">IATA</label>
                      <input
                        type="text"
                        maxLength={3}
                        placeholder="IAD"
                        value={addArrivalCode}
                        onChange={(e) => setAddArrivalCode(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-850 uppercase font-black"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Horário de Chegada</label>
                    <input
                      type="text"
                      placeholder="e.g. 06:15 (+1)"
                      value={addArrivalTime}
                      onChange={(e) => setAddArrivalTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-850"
                      required
                    />
                  </div>
                </div>

                {/* STATUS, GATE & LOCATOR */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Portão (Gate)</label>
                    <input
                      type="text"
                      placeholder="e.g. B24"
                      value={addGate}
                      onChange={(e) => setAddGate(e.target.value)}
                      className="w-full px-2.5 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-medium text-slate-850"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Localizador</label>
                    <input
                      type="text"
                      placeholder="e.g. MZOXND"
                      value={addLocator}
                      onChange={(e) => setAddLocator(e.target.value)}
                      className="w-full px-2.5 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-black uppercase text-indigo-650"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Status do Voo</label>
                    <select
                      value={addStatus}
                      onChange={(e) => setAddStatus(e.target.value as any)}
                      className="w-full px-2.5 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-semibold text-slate-850"
                    >
                      <option value="Confirmado">Confirmado</option>
                      <option value="Atrasado">Atrasado</option>
                      <option value="Em voo">Em voo</option>
                      <option value="Cancelado">Cancelado</option>
                      <option value="Finalizado">Finalizado</option>
                    </select>
                  </div>
                </div>

                {/* BOARDING PASS ATTACHMENT */}
                <div className="p-3 bg-indigo-50/30 border border-indigo-100 rounded-2xl space-y-2">
                  <label className="text-[10px] font-extrabold text-indigo-950 block uppercase tracking-wider">
                    🎫 Cartão de Embarque (PDF ou Imagem)
                  </label>
                  {addTicketFileName ? (
                    <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-indigo-150 shadow-xs animate-fadeIn">
                      <span className="text-xs font-medium text-slate-700 truncate max-w-[240px] flex items-center gap-1.5">
                        📎 {addTicketFileName}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAddTicketFileName("");
                          setAddTicketFileData("");
                        }}
                        className="text-[10px] uppercase font-bold text-rose-650 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded transition-colors"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <div className="relative group border border-dashed border-indigo-250 hover:border-indigo-400 bg-white hover:bg-indigo-50/25 transition-all rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              setAddTicketFileName(file.name);
                              setAddTicketFileData(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Paperclip className="w-4 h-4 text-indigo-500 mb-1 shrink-0" />
                      <p className="text-[11px] font-semibold text-slate-700">Anexar Cartão de Embarque</p>
                      <p className="text-[9px] text-slate-450">Toque ou arraste seu PDF/imagem aqui</p>
                    </div>
                  )}
                </div>



                {/* DYNAMIC PASSENGER RELATIONS MANAGER */}
                <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> Passageiros Separados ({addPassengersList.length})
                    </p>
                    <button
                      type="button"
                      onClick={() => setAddPassengersList(prev => [...prev, { id: `fp-${Date.now()}-${Math.random().toString(36).substring(4)}`, name: "", seat: "" }])}
                      className="text-[10px] font-bold text-indigo-650 hover:text-indigo-750 bg-indigo-50 hover:bg-indigo-100 rounded-lg px-2 py-1 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Vincular Passageiro
                    </button>
                  </div>

                  {addPassengersList.length > 0 ? (
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {addPassengersList.map((passenger, index) => (
                        <div key={passenger.id} className="flex gap-2 items-center animate-fadeIn">
                          <input
                            type="text"
                            placeholder="Nome do Passageiro"
                            value={passenger.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAddPassengersList(prev => prev.map((p, idx) => idx === index ? { ...p, name: val } : p));
                            }}
                            className="grow px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 text-xs text-slate-850"
                            required
                          />
                          <input
                            type="text"
                            placeholder="Assento"
                            value={passenger.seat || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAddPassengersList(prev => prev.map((p, idx) => idx === index ? { ...p, seat: val } : p));
                            }}
                            className="w-16 sm:w-20 px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 text-xs text-slate-850 text-center uppercase font-bold"
                          />
                          <label className={`p-1.5 rounded-lg transition-colors cursor-pointer border ${passenger.ticketFileData ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-slate-50 hover:bg-slate-100 text-slate-400 border-slate-200'}`} title="Anexar Cartão de Embarque">
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    setAddPassengersList(prev => prev.map((p, idx) => idx === index ? { ...p, ticketFileName: file.name, ticketFileData: reader.result as string } : p));
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            <Paperclip className="w-3.5 h-3.5" />
                          </label>
                          <button
                            type="button"
                            onClick={() => setAddPassengersList(prev => prev.filter((_, idx) => idx !== index))}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 border border-transparent rounded-lg transition-colors cursor-pointer"
                            title="Remover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">Nenhum passageiro avulso vinculado a este trecho.</p>
                  )}
                </div>

                <div className="flex justify-end gap-2.5 pt-3.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddFlightModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-100 cursor-pointer"
                  >
                    Adicionar Trecho
                  </button>
                </div>
              </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <MapsSelectorModal
        isOpen={mapModalTarget !== null}
        onClose={() => setMapModalTarget(null)}
        title={mapModalTarget?.title || ""}
        query={mapModalTarget?.query || ""}
        latitude={mapModalTarget?.latitude}
        longitude={mapModalTarget?.longitude}
      />

    </div>
  );
}
