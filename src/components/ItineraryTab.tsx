import React, { useState } from "react";
import { 
  MapPin, 
  Map, 
  Clock, 
  DollarSign, 
  Compass, 
  Sparkles, 
  ExternalLink,
  Plus, 
  Activity as ActivityIcon,
  Trash2,
  Calendar,
  AlertCircle,
  HelpCircle,
  Pencil,
  FileText,
  Upload,
  Download,
  RotateCcw,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Check,
  Circle,
  Info,
  X,
  Plane,
  Hotel,
  Utensils,
  Briefcase
} from "lucide-react";
import { Destination, ItineraryDay, Activity, GeneralTip, CostItem, Traveler, NearbyPlace } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { sortActivitiesByTime, parseGridRowsToItinerary, formatDatesRange, parseRangeToDates, canDeleteEntity, inferActivityType } from "../utils";
import * as XLSX from "xlsx";
import WeatherWidget from "./WeatherWidget";
import { ItineraryMap } from "./ItineraryMap";
import { NearbyPlacesWidget } from "./NearbyPlacesWidget";
import MapsSelectorModal from "./MapsSelectorModal";

interface PackingItem {
  id: string;
  name: string;
  packed: boolean;
  destinationId: string;
}

export function getActivityInfo(act: Activity) {
  let detectedType = act.type;
  if (!detectedType || detectedType === "other") {
    detectedType = inferActivityType(act.location, act.notes);
  }

  switch (detectedType) {
    case "flight":
      return {
        label: "Voo / Transporte",
        color: "bg-sky-50 text-sky-700 border-sky-150 hover:bg-sky-100",
        iconBg: "bg-sky-600 text-white",
        bulletColor: "border-sky-500 bg-sky-50 text-sky-600",
        iconColor: "text-sky-600",
        icon: Plane
      };
    case "hotel":
      return {
        label: "Hotel / Hospedagem",
        color: "bg-indigo-50 text-indigo-700 border-indigo-150 hover:bg-indigo-100",
        iconBg: "bg-indigo-600 text-white",
        bulletColor: "border-indigo-500 bg-indigo-50 text-indigo-600",
        iconColor: "text-indigo-600",
        icon: Hotel
      };
    case "tour":
      return {
        label: "Passeio / Atração",
        color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/80",
        iconBg: "bg-amber-500 text-white",
        bulletColor: "border-amber-500 bg-amber-50 text-amber-600",
        iconColor: "text-amber-600",
        icon: Compass
      };
    case "dinner":
      return {
        label: "Restaurante / Refeição",
        color: "bg-emerald-50 text-emerald-700 border-emerald-150 hover:bg-emerald-100",
        iconBg: "bg-emerald-600 text-white",
        bulletColor: "border-emerald-500 bg-emerald-50 text-emerald-600",
        iconColor: "text-emerald-600",
        icon: Utensils
      };
    case "other":
    default:
      return {
        label: "Outros",
        color: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100",
        iconBg: "bg-slate-600 text-white",
        bulletColor: "border-slate-500 bg-slate-50 text-slate-500",
        iconColor: "text-slate-500",
        icon: ActivityIcon
      };
  }
}

interface ItineraryTabProps {
  destinations: Destination[];
  costs: CostItem[];
  onAddActivity: (destId: string, dayId: string, activity: Omit<Activity, "id"> & { targetDayId?: string }) => void;
  onRemoveActivity: (destId: string, dayId: string, activityId: string) => void;
  onEditActivity: (destId: string, dayId: string, activityId: string, activity: Omit<Activity, "id"> & { targetDayId?: string }) => void;
  currentTips: GeneralTip[];
  selectedDestinationId: string;
  setSelectedDestinationId: (id: string) => void;
  onSyncWashington?: () => void;
  onImportDestinationDays?: (destId: string, parsedDays: ItineraryDay[], importMode: "replace" | "merge") => void;
  onUpdateHotelAndCost?: (destId: string, hotelData: { hotelName: string; hotelAddress: string; hotelLink: string; dates: string; checkInTime?: string; checkOutTime?: string; totalCostBRL: number; status: "Pago" | "Pgto no local" | "Falta pagar" }) => void;
  onAddTip?: (tip: Omit<GeneralTip, "id">) => void;
  onEditTip?: (id: string, tip: Omit<GeneralTip, "id">) => void;
  onRemoveTip?: (id: string) => void;
  onAddDestination?: (dest: Omit<Destination, "id" | "days">) => void;
  onEditDestination?: (id: string, updatedDest: Omit<Destination, "id" | "days">) => void;
  onRemoveDestination?: (id: string) => void;
  onAddDay?: (destId: string) => void;
  isReadOnly?: boolean;
  travelers?: Traveler[];
  onUpdateTravelerChecklists?: (travelerId: string, checkedActivities: string, packingItems: string) => void;
  currentUser?: any;
  onOptimizeDayRoute?: (destId: string, dayId: string) => Promise<void>;
  onSyncAllDefaultDestinations?: () => void;
  itineraryId?: string | number | null;
}

export default function ItineraryTab({
  destinations,
  costs,
  onAddActivity,
  onRemoveActivity,
  onEditActivity,
  currentTips,
  selectedDestinationId,
  setSelectedDestinationId,
  onSyncWashington,
  onSyncAllDefaultDestinations,
  onImportDestinationDays,
  onUpdateHotelAndCost,
  onAddTip,
  onEditTip,
  onRemoveTip,
  onAddDestination,
  onEditDestination,
  onRemoveDestination,
  onAddDay,
  isReadOnly = false,
  travelers = [],
  onUpdateTravelerChecklists,
  currentUser,
  onOptimizeDayRoute,
  itineraryId
}: ItineraryTabProps) {
  // Navigation internal state
  const activeDestination = destinations.find((d) => d.id === selectedDestinationId) || destinations[0];
  const [activeDayIdx, setActiveDayIdx] = useState<number>(0);
  const [timelineMode, setTimelineMode] = useState<"selected" | "all">("selected");
  const [visitedFilter, setVisitedFilter] = useState<"all" | "not_visited" | "visited">("all");
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);

  const userEmailNormalized = currentUser?.email?.toLowerCase().trim() || "";
  const currentUserTraveler = userEmailNormalized 
    ? travelers.find(t => t.email?.toLowerCase().trim() === userEmailNormalized)
    : undefined;
  const userRole = currentUserTraveler?.role || "Viajante";

  // Traveler checklist state
  const [selectedTravelerId, setSelectedTravelerId] = useState<string>("");
  const [newPackingItemName, setNewPackingItemName] = useState<string>( "");

  const activeTravelersList = travelers && travelers.length > 0 ? travelers : [{ id: "t-organizer", name: "Você", role: "Organizador", email: "" }] as Traveler[];

  // Select default traveler
  React.useEffect(() => {
    if (!selectedTravelerId && activeTravelersList.length > 0) {
      if (currentUser?.isTraveler) {
        const found = activeTravelersList.find(t => t.email?.toLowerCase().trim() === currentUser.email?.toLowerCase().trim());
        setSelectedTravelerId(found?.id || activeTravelersList[0].id);
      } else {
        setSelectedTravelerId(activeTravelersList[0].id);
      }
    }
  }, [activeTravelersList, currentUser, selectedTravelerId]);

  // Find active traveler
  const activeTraveler = activeTravelersList.find(t => t.id === selectedTravelerId) || activeTravelersList[0];

  // Checked activities
  const isActivityCheckedByActiveTraveler = (actId: string) => {
    if (!activeTraveler?.checkedActivities) return false;
    const cleanActId = String(actId).replace(/^act-/, "");
    const checkedList = activeTraveler.checkedActivities
      .split(",")
      .map(id => id.trim().replace(/^act-/, ""))
      .filter(Boolean);
    return checkedList.includes(cleanActId);
  };

  const isDestinationVisited = (dest: Destination) => {
    const allActivities = dest.days.flatMap((day) => day.activities);
    if (allActivities.length === 0) return false;
    return allActivities.every((act) => isActivityCheckedByActiveTraveler(act.id));
  };

  const getDestinationStats = (dest: Destination) => {
    const allActivities = dest ? dest.days.flatMap((day) => day.activities) : [];
    const total = allActivities.length;
    const visited = allActivities.filter((act) => isActivityCheckedByActiveTraveler(act.id)).length;
    const notVisited = total - visited;
    const percentage = total > 0 ? Math.round((visited / total) * 100) : 0;
    return { total, visited, notVisited, percentage };
  };

  const getDayStats = (day: ItineraryDay) => {
    const total = day.activities ? day.activities.length : 0;
    const visited = day.activities ? day.activities.filter((act) => isActivityCheckedByActiveTraveler(act.id)).length : 0;
    const percentage = total > 0 ? Math.round((visited / total) * 100) : 0;
    return { total, visited, percentage };
  };

  const handleToggleActivityVisited = (travelerId: string, activityId: string) => {
    if (!onUpdateTravelerChecklists) return;
    const cleanTargetTravelerId = String(travelerId).replace(/^t-/, "");
    const traveler = activeTravelersList.find(
      t => String(t.id) === String(travelerId) || String(t.id).replace(/^t-/, "") === cleanTargetTravelerId
    ) || activeTraveler;

    if (!traveler) return;

    const cleanActId = String(activityId).replace(/^act-/, "");
    let checkedSplits = traveler.checkedActivities
      ? traveler.checkedActivities.split(",").map(id => id.trim().replace(/^act-/, "")).filter(Boolean)
      : [];

    if (checkedSplits.includes(cleanActId)) {
      checkedSplits = checkedSplits.filter(id => id !== cleanActId);
    } else {
      checkedSplits.push(cleanActId);
    }

    onUpdateTravelerChecklists(traveler.id, checkedSplits.join(","), traveler.packingItems || "");
  };

  // Packing list
  const getPackingItemsForActiveTraveler = (): PackingItem[] => {
    if (!activeTraveler) return [];
    if (!activeTraveler.packingItems) {
      if (!activeDestination) return [];
      return [
        { id: "def-1", name: "Passaporte / RG / Documentos", packed: false, destinationId: activeDestination.id },
        { id: "def-2", name: "Celular & Carregador", packed: false, destinationId: activeDestination.id },
        { id: "def-3", name: "Adaptador de Tomada", packed: false, destinationId: activeDestination.id },
        { id: "def-4", name: "Escova de dente & Higiene", packed: false, destinationId: activeDestination.id },
        { id: "def-5", name: "Roupas extras adequadas", packed: false, destinationId: activeDestination.id },
        { id: "def-6", name: "Remédios e Primeiros Socorros", packed: false, destinationId: activeDestination.id }
      ];
    }
    try {
      const parsed: PackingItem[] = JSON.parse(activeTraveler.packingItems);
      if (activeDestination) {
        const destItems = parsed.filter(item => item.destinationId === activeDestination.id);
        if (destItems.length === 0 && parsed.filter(item => item.destinationId === activeDestination.id || !item.destinationId).length === 0) {
          return [
            { id: "def-1", name: "Passaporte / RG / Documentos", packed: false, destinationId: activeDestination.id },
            { id: "def-2", name: "Celular & Carregador", packed: false, destinationId: activeDestination.id },
            { id: "def-3", name: "Adaptador de Tomada", packed: false, destinationId: activeDestination.id },
            { id: "def-4", name: "Escova de dente & Higiene", packed: false, destinationId: activeDestination.id },
            { id: "def-5", name: "Roupas extras adequadas", packed: false, destinationId: activeDestination.id },
            { id: "def-6", name: "Remédios e Primeiros Socorros", packed: false, destinationId: activeDestination.id }
          ];
        }
        return parsed.filter(item => item.destinationId === activeDestination.id);
      }
      return parsed;
    } catch (e) {
      return [];
    }
  };

  const handleAddPackingItem = (travelerId: string, itemName: string) => {
    if (!activeDestination || !onUpdateTravelerChecklists || !itemName.trim()) return;
    const t = activeTravelersList.find(tr => tr.id === travelerId);
    if (!t) return;
    
    let items: PackingItem[] = [];
    if (t.packingItems) {
      try {
        items = JSON.parse(t.packingItems);
      } catch (e) {
        items = [
          { id: "def-1", name: "Passaporte / RG / Documentos", packed: false, destinationId: activeDestination.id },
          { id: "def-2", name: "Celular & Carregador", packed: false, destinationId: activeDestination.id },
          { id: "def-3", name: "Adaptador de Tomada", packed: false, destinationId: activeDestination.id },
          { id: "def-4", name: "Escova de dente & Higiene", packed: false, destinationId: activeDestination.id },
          { id: "def-5", name: "Roupas extras adequadas", packed: false, destinationId: activeDestination.id },
          { id: "def-6", name: "Remédios e Primeiros Socorros", packed: false, destinationId: activeDestination.id }
        ];
      }
    } else {
      items = [
        { id: "def-1", name: "Passaporte / RG / Documentos", packed: false, destinationId: activeDestination.id },
        { id: "def-2", name: "Celular & Carregador", packed: false, destinationId: activeDestination.id },
        { id: "def-3", name: "Adaptador de Tomada", packed: false, destinationId: activeDestination.id },
        { id: "def-4", name: "Escova de dente & Higiene", packed: false, destinationId: activeDestination.id },
        { id: "def-5", name: "Roupas extras adequadas", packed: false, destinationId: activeDestination.id },
        { id: "def-6", name: "Remédios e Primeiros Socorros", packed: false, destinationId: activeDestination.id }
      ];
    }
    
    const newItem: PackingItem = {
      id: 'pkg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      name: itemName.trim(),
      packed: false,
      destinationId: activeDestination.id
    };
    
    items.push(newItem);
    onUpdateTravelerChecklists(travelerId, t.checkedActivities || "", JSON.stringify(items));
    setNewPackingItemName("");
  };

  const handleTogglePackingItem = (travelerId: string, itemId: string) => {
    if (!onUpdateTravelerChecklists || !activeDestination) return;
    const t = activeTravelersList.find(tr => tr.id === travelerId);
    if (!t) return;
    
    let items: PackingItem[] = [];
    if (t.packingItems) {
      try {
        items = JSON.parse(t.packingItems);
      } catch (e) {}
    } else {
      items = [
        { id: "def-1", name: "Passaporte / RG / Documentos", packed: false, destinationId: activeDestination.id },
        { id: "def-2", name: "Celular & Carregador", packed: false, destinationId: activeDestination.id },
        { id: "def-3", name: "Adaptador de Tomada", packed: false, destinationId: activeDestination.id },
        { id: "def-4", name: "Escova de dente & Higiene", packed: false, destinationId: activeDestination.id },
        { id: "def-5", name: "Roupas extras adequadas", packed: false, destinationId: activeDestination.id },
        { id: "def-6", name: "Remédios e Primeiros Socorros", packed: false, destinationId: activeDestination.id }
      ];
    }
    
    const index = items.findIndex(item => item.id === itemId);
    if (index === -1 && itemId.startsWith("def-")) {
      const defaults = [
        { id: "def-1", name: "Passaporte / RG / Documentos", packed: false, destinationId: activeDestination.id },
        { id: "def-2", name: "Celular & Carregador", packed: false, destinationId: activeDestination.id },
        { id: "def-3", name: "Adaptador de Tomada", packed: false, destinationId: activeDestination.id },
        { id: "def-4", name: "Escova de dente & Higiene", packed: false, destinationId: activeDestination.id },
        { id: "def-5", name: "Roupas extras adequadas", packed: false, destinationId: activeDestination.id },
        { id: "def-6", name: "Remédios e Primeiros Socorros", packed: false, destinationId: activeDestination.id }
      ];
      const match = defaults.find(d => d.id === itemId);
      if (match) {
        items.push({ ...match, packed: true });
      }
    } else if (index !== -1) {
      items[index].packed = !items[index].packed;
    }
    onUpdateTravelerChecklists(travelerId, t.checkedActivities || "", JSON.stringify(items));
  };

  const handleRemovePackingItem = (travelerId: string, itemId: string) => {
    if (!onUpdateTravelerChecklists || !activeDestination) return;
    const t = activeTravelersList.find(tr => tr.id === travelerId);
    if (!t) return;
    
    let items: PackingItem[] = [];
    if (t.packingItems) {
      try {
        items = JSON.parse(t.packingItems);
      } catch (e) {}
    } else {
      items = [
        { id: "def-1", name: "Passaporte / RG / Documentos", packed: false, destinationId: activeDestination.id },
        { id: "def-2", name: "Celular & Carregador", packed: false, destinationId: activeDestination.id },
        { id: "def-3", name: "Adaptador de Tomada", packed: false, destinationId: activeDestination.id },
        { id: "def-4", name: "Escova de dente & Higiene", packed: false, destinationId: activeDestination.id },
        { id: "def-5", name: "Roupas extras adequadas", packed: false, destinationId: activeDestination.id },
        { id: "def-6", name: "Remédios e Primeiros Socorros", packed: false, destinationId: activeDestination.id }
      ];
    }
    
    const index = items.findIndex(item => item.id === itemId);
    if (index === -1 && itemId.startsWith("def-")) {
      const defaults = [
        { id: "def-1", name: "Passaporte / RG / Documentos", packed: false, destinationId: activeDestination.id },
        { id: "def-2", name: "Celular & Carregador", packed: false, destinationId: activeDestination.id },
        { id: "def-3", name: "Adaptador de Tomada", packed: false, destinationId: activeDestination.id },
        { id: "def-4", name: "Escova de dente & Higiene", packed: false, destinationId: activeDestination.id },
        { id: "def-5", name: "Roupas extras adequadas", packed: false, destinationId: activeDestination.id },
        { id: "def-6", name: "Remédios e Primeiros Socorros", packed: false, destinationId: activeDestination.id }
      ];
      const remainder = defaults.filter(d => d.id !== itemId).map(d => ({ ...d, packed: false }));
      items = [...items, ...remainder];
    } else {
      items = items.filter(item => item.id !== itemId);
    }
    onUpdateTravelerChecklists(travelerId, t.checkedActivities || "", JSON.stringify(items));
  };
  
  // Custom activity entry form states
  const [showAddActivityForm, setShowAddActivityForm] = useState(false);
  const [newActTime, setNewActTime] = useState("");
  const [newActType, setNewActType] = useState("other");
  const [newActLocation, setNewActLocation] = useState("");
  const [newActDuration, setNewActDuration] = useState("");
  const [newActCost, setNewActCost] = useState("");
  const [newActMapsQuery, setNewActMapsQuery] = useState("");
  const [newActWebsite, setNewActWebsite] = useState("");
  const [newActParking, setNewActParking] = useState("");
  const [newActNotes, setNewActNotes] = useState("");
  const [newActTicketFileName, setNewActTicketFileName] = useState("");
  const [newActTicketFileData, setNewActTicketFileData] = useState("");
  const [newActDate, setNewActDate] = useState("");
  const [newActTargetDayId, setNewActTargetDayId] = useState("");
  const [newActLatitude, setNewActLatitude] = useState("");
  const [newActLongitude, setNewActLongitude] = useState("");

  const [mapModalTarget, setMapModalTarget] = useState<{
    title: string;
    query: string;
    latitude?: number;
    longitude?: number;
  } | null>(null);

  // Spreadsheet import tool states (Option B - Initial Load)
  const [showImportTool, setShowImportTool] = useState(false);
  const [importText, setImportText] = useState("");
  const [parsedPreview, setParsedPreview] = useState<ItineraryDay[] | null>(null);
  const [importMode, setImportMode] = useState<"replace" | "merge">("replace");
  const [importError, setImportError] = useState<string | null>(null);
  const [importTab, setImportTab] = useState<"paste" | "upload">("paste");

  // Hotel Sync and Edit states
  const [isSyncingHotel, setIsSyncingHotel] = useState(false);
  const [syncHotelName, setSyncHotelName] = useState("");
  const [syncHotelAddress, setSyncHotelAddress] = useState("");
  const [syncHotelLink, setSyncHotelLink] = useState("");
  const [syncHotelDates, setSyncHotelDates] = useState("");
  const [syncHotelCheckIn, setSyncHotelCheckIn] = useState("");
  const [syncHotelCheckOut, setSyncHotelCheckOut] = useState("");
  const [syncHotelCostBRL, setSyncHotelCostBRL] = useState("");
  const [syncHotelStatus, setSyncHotelStatus] = useState<CostItem["status"]>("Pago");

  // Dicas management states
  const [editingTip, setEditingTip] = useState<GeneralTip | null>(null);
  const [isAddingTip, setIsAddingTip] = useState(false);
  const [tipCategory, setTipCategory] = useState("Geral");
  const [tipTitle, setTipTitle] = useState("");
  const [tipContent, setTipContent] = useState("");

  // Destination management states
  const [isOptimizingRoute, setIsOptimizingRoute] = useState(false);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);
  const [optimizeSuccess, setOptimizeSuccess] = useState<string | null>(null);
  const [showCityForm, setShowCityForm] = useState(false);
  const [isEditingCity, setIsEditingCity] = useState(false);
  const [showDeleteCityConfirm, setShowDeleteCityConfirm] = useState(false);
  const [deletingTipId, setDeletingTipId] = useState<string | null>(null);
  const [cityForm, setCityForm] = useState({
    city: "",
    state: "",
    country: "Estados Unidos",
    dates: "",
    startDate: "",
    endDate: "",
    hotelName: "",
    hotelLink: "",
    hotelAddress: "",
    checkInTime: "",
    checkOutTime: ""
  });

  const startAddCity = () => {
    setCityForm({
      city: "",
      state: "",
      country: "Estados Unidos",
      dates: "",
      startDate: "",
      endDate: "",
      hotelName: "",
      hotelLink: "",
      hotelAddress: "",
      checkInTime: "",
      checkOutTime: ""
    });
    setIsEditingCity(false);
    setShowDeleteCityConfirm(false);
    setShowCityForm(true);
  };

  const handleTriggerRouteOptimization = async () => {
    if (!activeDestination || !activeDay || !onOptimizeDayRoute) return;
    if (activeDay.activities.length < 2) {
      setOptimizeError("Você precisa de pelo menos 2 atividades no dia para otimizar uma rota.");
      setTimeout(() => setOptimizeError(null), 5000);
      return;
    }

    setIsOptimizingRoute(true);
    setOptimizeError(null);
    setOptimizeSuccess(null);

    try {
      await onOptimizeDayRoute(activeDestination.id, activeDay.id);
      setOptimizeSuccess("Rota otimizada com sucesso via Inteligência Artificial Gemini!");
      setTimeout(() => setOptimizeSuccess(null), 5000);
    } catch (err: any) {
      console.error(err);
      setOptimizeError(err.message || "Ocorreu um erro ao reordenar e otimizar as atividades.");
      setTimeout(() => setOptimizeError(null), 6000);
    } finally {
      setIsOptimizingRoute(false);
    }
  };

  const startEditCity = () => {
    if (!activeDestination) return;
    
    // Backpopulate HTML5 date inputs from previous strings if empty
    let sDate = activeDestination.startDate || "";
    let eDate = activeDestination.endDate || "";
    if (!sDate || !eDate) {
      const parsed = parseRangeToDates(activeDestination.dates || "");
      sDate = parsed.startDate;
      eDate = parsed.endDate;
    }

    setCityForm({
      city: activeDestination.city || "",
      state: activeDestination.state || "",
      country: activeDestination.country || "",
      dates: activeDestination.dates || "",
      startDate: sDate,
      endDate: eDate,
      hotelName: activeDestination.hotelName || "",
      hotelLink: activeDestination.hotelLink || "",
      hotelAddress: activeDestination.hotelAddress || "",
      checkInTime: activeDestination.checkInTime || "",
      checkOutTime: activeDestination.checkOutTime || ""
    });
    setIsEditingCity(true);
    setShowDeleteCityConfirm(false);
    setShowCityForm(true);
  };

  const submitCityForm = (e: React.FormEvent) => {
    e.preventDefault();
    const calculatedDates = formatDatesRange(cityForm.startDate, cityForm.endDate) || cityForm.dates;
    const finalForm = {
      ...cityForm,
      dates: calculatedDates
    };

    if (isEditingCity && activeDestination && onEditDestination) {
      onEditDestination(activeDestination.id, finalForm);
    } else if (!isEditingCity && onAddDestination) {
      onAddDestination(finalForm);
    }
    setShowCityForm(false);
  };

  const handleDeleteCity = () => {
    if (activeDestination && onRemoveDestination) {
      onRemoveDestination(activeDestination.id);
      setShowDeleteCityConfirm(false);
      setShowCityForm(false);
    }
  };

  const startAddTip = () => {
    setTipCategory(activeDestination ? activeDestination.city : "Geral");
    setTipTitle("");
    setTipContent("");
    setIsAddingTip(true);
  };

  const submitAddTip = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAddTip) {
      onAddTip({
        category: tipCategory.trim() || "Geral",
        title: tipTitle.trim() || "Nova Dica",
        content: tipContent.trim()
      });
    }
    setIsAddingTip(false);
  };

  const startEditTip = (tip: GeneralTip) => {
    setEditingTip(tip);
    setTipCategory(tip.category);
    setTipTitle(tip.title);
    setTipContent(tip.content);
  };

  const submitEditTip = (e: React.FormEvent) => {
    e.preventDefault();
    if (onEditTip && editingTip) {
      onEditTip(editingTip.id, {
        category: tipCategory.trim() || "Geral",
        title: tipTitle.trim() || "Dica Editada",
        content: tipContent.trim()
      });
    }
    setEditingTip(null);
  };

  const startHotelSync = () => {
    if (!activeDestination) return;

    const connectedCost = costs.find(
      (c) => c.category === "hotel" && (c.destinationId === activeDestination.id || c.description.toLowerCase().includes(activeDestination.city.toLowerCase()))
    );

    setSyncHotelName(activeDestination.hotelName || "");
    setSyncHotelAddress(activeDestination.hotelAddress || "");
    setSyncHotelLink(activeDestination.hotelLink || "");
    setSyncHotelDates(activeDestination.dates || "");
    setSyncHotelCheckIn(activeDestination.checkInTime || "");
    setSyncHotelCheckOut(activeDestination.checkOutTime || "");
    setSyncHotelCostBRL(connectedCost ? connectedCost.totalCostBRL.toString() : "0");
    setSyncHotelStatus(connectedCost ? connectedCost.status : "Pago");
    setIsSyncingHotel(true);
  };

  const handleHotelSyncSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateHotelAndCost && activeDestination) {
      onUpdateHotelAndCost(activeDestination.id, {
        hotelName: syncHotelName.trim(),
        hotelAddress: syncHotelAddress.trim(),
        hotelLink: syncHotelLink.trim(),
        dates: syncHotelDates.trim(),
        checkInTime: syncHotelCheckIn.trim(),
        checkOutTime: syncHotelCheckOut.trim(),
        totalCostBRL: parseFloat(syncHotelCostBRL) || 0,
        status: syncHotelStatus
      });
    }
    setIsSyncingHotel(false);
  };

  const handleTextPasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setImportText(val);
    if (!val.trim()) {
      setParsedPreview(null);
      setImportError(null);
      return;
    }
    try {
      const rows = val.split(/\r?\n/).map(line => line.split("\t"));
      const parsed = parseGridRowsToItinerary(rows);
      if (parsed.days.length === 0 || parsed.days.every(d => d.activities.length === 0)) {
        setImportError("Nenhuma atividade válida identificada. Certifique-se de copiar as linhas da tabela (contendo valores de data/hora/local).");
        setParsedPreview(null);
      } else {
        setParsedPreview(parsed.days);
        setImportError(null);
      }
    } catch (err) {
      setImportError("Erro ao processar o texto colado. Verifique o formato.");
      setParsedPreview(null);
    }
  };

  const handleExcelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = evt.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
          
          const parsed = parseGridRowsToItinerary(rows);
          if (parsed.days.length === 0 || parsed.days.every(d => d.activities.length === 0)) {
            setImportError("Não encontramos atividades válidas na planilha de Excel recebida. Verifique o arquivo e colunas.");
            setParsedPreview(null);
          } else {
            setParsedPreview(parsed.days);
            setImportError(null);
          }
        } catch (err) {
          console.error(err);
          setImportError("Erro no processamento do arquivo de Excel.");
          setParsedPreview(null);
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleExecuteImport = () => {
    if (!parsedPreview || !onImportDestinationDays || !activeDestination) return;
    onImportDestinationDays(activeDestination.id, parsedPreview, importMode);
    
    setImportText("");
    setParsedPreview(null);
    setImportError(null);
    setShowImportTool(false);
    setActiveDayIdx(0);
  };

  const activeDay = activeDestination?.days[activeDayIdx] || null;

  React.useEffect(() => {
    if (activeDay) {
      setNewActDate(activeDay.dateStr);
      setNewActTargetDayId(activeDay.id);
    }
  }, [activeDay, showAddActivityForm]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          if (isEdit) {
            setEditActTicketFileName(file.name);
            setEditActTicketFileData(uploadEvent.target.result as string);
          } else {
            setNewActTicketFileName(file.name);
            setNewActTicketFileData(uploadEvent.target.result as string);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadTicket = (act: Activity) => {
    if (act.ticketFileData) {
      const link = document.createElement("a");
      link.href = act.ticketFileData;
      link.download = act.ticketFileName || "ingresso";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(`[Offline Vault] Não foi possível baixar. O ingresso anexado não possui dados salvos.`);
    }
  };

  const handleSubmitActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActLocation.trim() || !activeDestination || !activeDay) return;
    
    onAddActivity(activeDestination.id, activeDay.id, {
      time: newActTime.trim() || "Qualquer hora",
      location: newActLocation.trim(),
      duration: newActDuration.trim() || "—",
      cost: newActCost.trim() || "Gratuito",
      mapsQuery: newActMapsQuery.trim() || undefined,
      websiteLink: newActWebsite.trim() || undefined,
      parking: newActParking.trim() || undefined,
      notes: newActNotes.trim() || undefined,
      ticketFileName: newActTicketFileName || undefined,
      ticketFileData: newActTicketFileData || undefined,
      date: newActDate.trim() || undefined,
      targetDayId: newActTargetDayId || undefined,
      latitude: newActLatitude.trim() ? parseFloat(newActLatitude) : undefined,
      longitude: newActLongitude.trim() ? parseFloat(newActLongitude) : undefined,
      type: (newActType && newActType !== "other") ? newActType : inferActivityType(newActLocation.trim(), newActNotes.trim())
    });

    // Reset fields
    setNewActTime("");
    setNewActType("other");
    setNewActLocation("");
    setNewActDuration("");
    setNewActCost("");
    setNewActMapsQuery("");
    setNewActWebsite("");
    setNewActParking("");
    setNewActNotes("");
    setNewActTicketFileName("");
    setNewActTicketFileData("");
    setNewActLatitude("");
    setNewActLongitude("");
    setShowAddActivityForm(false);
  };

  // Editing state variables for custom activities
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editActTime, setEditActTime] = useState("");
  const [editActType, setEditActType] = useState("other");
  const [editActLocation, setEditActLocation] = useState("");
  const [editActDuration, setEditActDuration] = useState("");
  const [editActCost, setEditActCost] = useState("");
  const [editActMapsQuery, setEditActMapsQuery] = useState("");
  const [editActWebsite, setEditActWebsite] = useState("");
  const [editActParking, setEditActParking] = useState("");
  const [editActNotes, setEditActNotes] = useState("");
  const [editActTicketFileName, setEditActTicketFileName] = useState("");
  const [editActTicketFileData, setEditActTicketFileData] = useState("");
  const [editActDate, setEditActDate] = useState("");
  const [editActTargetDayId, setEditActTargetDayId] = useState("");
  const [editActLatitude, setEditActLatitude] = useState("");
  const [editActLongitude, setEditActLongitude] = useState("");

  const startEditing = (act: Activity) => {
    setEditingActivity(act);
    setEditActTime(act.time);
    setEditActType(act.type || inferActivityType(act.location, act.notes));
    setEditActLocation(act.location);
    setEditActDuration(act.duration);
    setEditActCost(act.cost);
    setEditActMapsQuery(act.mapsQuery || "");
    setEditActWebsite(act.websiteLink || "");
    setEditActParking(act.parking || "");
    setEditActNotes(act.notes || "");
    setEditActTicketFileName(act.ticketFileName || "");
    setEditActTicketFileData(act.ticketFileData || "");
    setEditActDate(act.date || activeDay?.dateStr || "");
    setEditActTargetDayId(activeDay?.id || "");
    setEditActLatitude(act.latitude !== undefined && act.latitude !== null ? act.latitude.toString() : "");
    setEditActLongitude(act.longitude !== undefined && act.longitude !== null ? act.longitude.toString() : "");
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity || !editActLocation.trim() || !activeDestination || !activeDay) return;

    onEditActivity(activeDestination.id, activeDay.id, editingActivity.id, {
      time: editActTime.trim() || "Qualquer hora",
      location: editActLocation.trim(),
      duration: editActDuration.trim() || "—",
      cost: editActCost.trim() || "Gratuito",
      mapsQuery: editActMapsQuery.trim() || undefined,
      websiteLink: editActWebsite.trim() || undefined,
      parking: editActParking.trim() || undefined,
      notes: editActNotes.trim() || undefined,
      ticketFileName: editActTicketFileName || undefined,
      ticketFileData: editActTicketFileData || undefined,
      date: editActDate.trim() || undefined,
      targetDayId: editActTargetDayId || undefined,
      latitude: editActLatitude.trim() ? parseFloat(editActLatitude) : undefined,
      longitude: editActLongitude.trim() ? parseFloat(editActLongitude) : undefined,
      type: (editActType && editActType !== "other") ? editActType : inferActivityType(editActLocation.trim(), editActNotes.trim())
    });

    setEditingActivity(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Selector for Cities */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex flex-col gap-3">
        <div className="flex overflow-x-auto w-full scrollbar-none gap-2.5 items-center pb-1">
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mr-2 shrink-0">Cidades:</span>
          {destinations.map((dest) => {
            const visited = isDestinationVisited(dest);
            const stats = getDestinationStats(dest);
            return (
              <button
                key={dest.id}
                onClick={() => {
                  setSelectedDestinationId(dest.id);
                  setActiveDayIdx(0);
                  setShowAddActivityForm(false);
                }}
                className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer border whitespace-nowrap shrink-0 flex flex-col gap-1 items-stretch relative overflow-hidden min-w-[110px] ${
                  activeDestination?.id === dest.id
                    ? "bg-slate-900 text-white border-slate-950 shadow-sm"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-205"
                }`}
                title={visited ? `${dest.city} (Totalmente visitada!)` : `${dest.city} (${stats.percentage}% concluído)`}
              >
                {/* Progress bar at the very top edge of the card */}
                {stats.total > 0 && (
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-slate-200/40">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between gap-2 w-full pt-0.5">
                  <span className={visited ? "line-through decoration-slate-400 opacity-70" : ""}>{dest.city}</span>
                  {visited ? (
                    <span className="text-[10px] shrink-0">✅</span>
                  ) : (
                    stats.total > 0 && (
                      <span className={`text-[9px] font-mono font-extrabold shrink-0 ${activeDestination?.id === dest.id ? "text-emerald-400" : "text-emerald-600"}`}>
                        {stats.percentage}%
                      </span>
                    )
                  )}
                </div>
              </button>
            );
          })}
          
          {onAddDestination && !isReadOnly && (
            <button
              onClick={startAddCity}
              className="px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border whitespace-nowrap shrink-0 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
              title="Cadastrar Nova Cidade"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2 items-center w-full overflow-x-auto scrollbar-none pb-1">
          {onEditDestination && activeDestination && !isReadOnly && (
            <button
              onClick={startEditCity}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-150 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-200 shrink-0 whitespace-nowrap"
              title="Editar cidade atual"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              Editar Cidade
            </button>
          )}

          {activeDestination?.city === "Washington" && onSyncWashington && !isReadOnly && (
            <button
              onClick={onSyncWashington}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-150 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-200 shrink-0 whitespace-nowrap"
              title="Restaura os dados originais padrão de Washington"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              Restaurar Padrão
            </button>
          )}

          {onSyncAllDefaultDestinations && !isReadOnly && (
            <button
              id="btn-sync-all-default"
              onClick={onSyncAllDefaultDestinations}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-emerald-600 hover:shadow-md text-xs font-extrabold rounded-xl transition-all cursor-pointer border shrink-0 whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
              Restaurar Cidades Padrão
            </button>
          )}

          {onImportDestinationDays && !isReadOnly && (
            <button
              onClick={() => {
                setShowImportTool(!showImportTool);
                setShowAddActivityForm(false);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer border shrink-0 whitespace-nowrap ${
                showImportTool
                  ? "bg-amber-500 hover:bg-amber-600 border-amber-500 text-white"
                  : "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white border-indigo-600"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200 shrink-0" />
              {showImportTool ? "Fechar Carga de Planilha" : "Carregar Planilha (Opção B)"}
            </button>
          )}
        </div>
      </div>

      {/* KPIs & General Progress Panel */}
      {activeDestination && (() => {
        const stats = getDestinationStats(activeDestination);
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white rounded-2xl p-5 border border-slate-150/70 shadow-3xs">
            {/* KPI: Visitados */}
            <div className="bg-emerald-50/40 border border-emerald-100/60 rounded-xl p-3.5 flex flex-col justify-between">
              <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest">Atrações Visitadas</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-emerald-700">{stats.visited}</span>
                <span className="text-[10px] font-bold text-emerald-500">concluídas</span>
              </div>
            </div>

            {/* KPI: Não Visitados */}
            <div className="bg-slate-50/60 border border-slate-100 rounded-xl p-3.5 flex flex-col justify-between">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Não Visitadas</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-slate-700">{stats.notVisited}</span>
                <span className="text-[10px] font-bold text-slate-400">restantes</span>
              </div>
            </div>

            {/* KPI: Total */}
            <div className="bg-indigo-50/30 border border-indigo-100/40 rounded-xl p-3.5 flex flex-col justify-between">
              <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest">Total de Pontos</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-indigo-700">{stats.total}</span>
                <span className="text-[10px] font-bold text-indigo-400">cadastrados</span>
              </div>
            </div>

            {/* Progresso Geral de Viagem */}
            <div className="bg-slate-50/40 border border-slate-100 rounded-xl p-3.5 flex flex-col justify-center space-y-2 col-span-1 sm:col-span-2 lg:col-span-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Progresso do Destino</span>
                <span className="text-xs font-black text-emerald-600">{stats.percentage}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${stats.percentage}%` }}
                />
              </div>
            </div>
          </div>
        );
      })()}

      {showImportTool && (
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 border-2 border-indigo-250 shadow-md space-y-5"
          id="spreadsheet-import-panel"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-100 rounded-lg text-amber-600">
                  <FileSpreadsheet className="w-5 h-5" />
                </span>
                <h3 className="font-extrabold text-slate-800 text-lg">
                  Carga Inicial de Planilha • Opção B (Preserva Modificações Manuais)
                </h3>
              </div>
              <p className="text-xs text-slate-505 font-medium mt-1 leading-relaxed">
                Utilize este importador inteligente para fazer a transferência de dados da sua planilha (ex: <i>Washington</i>) para o Diário de Bordo.
                Após a carga inicial, todas as edições, exclusões ou novos cadastros que você fizer no app serão <b>100% locais</b> e nunca serão
                substituídos por ações automáticas em background!
              </p>
            </div>
            
            <button
              onClick={() => {
                setShowImportTool(false);
                setParsedPreview(null);
                setImportError(null);
              }}
              className="text-slate-400 hover:text-slate-700 text-xs font-bold px-3 py-1.5 hover:bg-slate-50 rounded-lg transition-all"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Box: Controls to Paste/Upload */}
            <div className="space-y-4">
              {/* Tab selector */}
              <div className="flex border-b border-slate-100 pb-1 gap-2">
                <button
                  type="button"
                  onClick={() => { setImportTab("paste"); setImportError(null); }}
                  className={`py-1.5 px-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
                    importTab === "paste"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-400 hover:text-slate-700"
                  }`}
                >
                  Copiar & Colar Células (Ideal)
                </button>
                <button
                  type="button"
                  onClick={() => { setImportTab("upload"); setImportError(null); }}
                  className={`py-1.5 px-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
                    importTab === "upload"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-400 hover:text-slate-700"
                  }`}
                >
                  Upload do Arquivo (.xlsx / .csv)
                </button>
              </div>

              {/* Paste tab */}
              {importTab === "paste" && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700">Abra o Excel/Sheets, selecione as linhas (incluindo ou não o cabeçalho) e cole abaixo:</label>
                    <span className="text-[10px] font-bold text-slate-400">Ctrl+C e Ctrl+V</span>
                  </div>
                  <textarea
                    rows={7}
                    value={importText}
                    onChange={handleTextPasteChange}
                    placeholder="Cole as colunas aqui. Exemplo:&#10;03/07/2026	08:30	Catedral Nacional de Washington	US$ 12	1h30	📍 Washington National Cathedral	www.cathedral.org	Wisconsin Ave"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Upload tab */}
              {importTab === "upload" && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block text-slate-500">Esquema das Colunas esperado: Data | Hora | Atração | Valor | Tempo/Duração | Local Maps | Site | Estacionamento</label>
                  <div className="border-2 border-dashed border-slate-200 hover:border-indigo-300 transition-all rounded-2xl p-6 text-center space-y-3 bg-slate-50">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-700">Arraste a planilha de Washington ou selecione do computador</p>
                      <p className="text-[10px] text-slate-400">Suporta planilhas Excel .xlsx, .xls ou arquivos formatados por tabulação (.tsv, .csv)</p>
                    </div>
                    <label className="inline-block px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-extrabold rounded-xl transition-all cursor-pointer border border-indigo-150">
                      Escolher Arquivo de Planilha
                      <input
                        type="file"
                        accept=".xlsx,.xls,.tsv,.csv"
                        onChange={handleExcelFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Feedback de erro */}
              {importError && (
                <div className="p-3 bg-rose-50 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2 border border-rose-100 animate-pulse">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Config da carga */}
              <div className="p-4 bg-indigo-25/50 border border-indigo-50 rounded-2xl space-y-3">
                <h4 className="text-xs font-extrabold text-indigo-900 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  Configuração de Escopo da Carga
                </h4>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <label className="flex items-center gap-2 cursor-pointer grow bg-white p-2.5 rounded-xl border border-slate-150 hover:border-indigo-350 transition-all">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === "replace"}
                      onChange={() => setImportMode("replace")}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-705">Substituir Roteiro de {activeDestination?.city}</p>
                      <p className="text-[10px] text-slate-400 leading-tight">Apaga as programações atuais da cidade e cria o itinerário novo do zero</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer grow bg-white p-2.5 rounded-xl border border-slate-150 hover:border-indigo-350 transition-all">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === "merge"}
                      onChange={() => setImportMode("merge")}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-705">Mesclar ao Itinerário Atual</p>
                      <p className="text-[10px] text-slate-400 leading-tight">Mantém as atividades que você já cadastrou e anexa novos dados sem causar duplicatas</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Box: Live Preview of Parsed Days/Activities */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between max-h-[360px] overflow-y-auto">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Resultado do Analisador:</span>
                
                {!parsedPreview ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <FileSpreadsheet className="w-10 h-10 text-slate-200 mx-auto animate-bounce" />
                    <p className="text-xs font-bold text-slate-650">Aguardando colagem ou upload...</p>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto">Insira dados válidos do seu Excel. O sistema irá agrupar por data, ordenar cronologicamente e tratar tabelas e espaços vazios na planilha.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-100 flex items-center justify-between">
                      <span>Pronto! Identificamos {parsedPreview.length} Dias</span>
                      <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-md text-[10px]">
                        {parsedPreview.reduce((acc, d) => acc + d.activities.length, 0)} atividades
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {parsedPreview.map((day) => (
                        <div key={day.id} className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                            <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                              Dia {day.dayNumber} — {day.dateStr}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">{day.activities.length} ações</span>
                          </div>
                          
                          <div className="space-y-1.5 text-xs text-slate-600 font-semibold max-h-[120px] overflow-y-auto">
                            {day.activities.map((act, aIdx) => (
                              <div key={act.id || aIdx} className="flex justify-between hover:bg-slate-25 p-1 rounded-sm gap-1">
                                <span className="text-indigo-600 font-bold w-12 shrink-0">{act.time}</span>
                                <span className="truncate grow pr-2 text-slate-700">{act.location}</span>
                                <span className="text-slate-400 text-[10px] shrink-0 font-medium">{act.cost !== "Gratuito" ? act.cost : "Grátis"}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {parsedPreview && (
                <div className="pt-4 mt-4 border-t border-slate-200 flex justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setParsedPreview(null);
                      setImportText("");
                    }}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-350 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Recomeçar
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs hover:shadow-md"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Aplicar Carga em {activeDestination?.city}
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {showCityForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-3xl p-5 border-2 border-emerald-500/20 shadow-xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">{isEditingCity ? `Modificar ${activeDestination?.city}` : "Cadastrar Nova Cidade/Parada"}</h3>
              <button onClick={() => setShowCityForm(false)} className="p-1 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={submitCityForm} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cidade Destino</label>
                  <input
                    required
                    type="text"
                    value={cityForm.city}
                    onChange={(e) => setCityForm({ ...cityForm, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all font-bold text-slate-705"
                    placeholder="Ex: Boston"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado / Região</label>
                  <input
                    type="text"
                    value={cityForm.state}
                    onChange={(e) => setCityForm({ ...cityForm, state: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all font-bold text-slate-705"
                    placeholder="Ex: Massachusetts"
                  />
                </div>
                <div className="space-y-1.5 grid grid-cols-2 gap-2 md:col-span-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Início do Período</label>
                    <input
                      type="date"
                      required
                      value={cityForm.startDate}
                      onChange={(e) => setCityForm({ ...cityForm, startDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all font-bold text-slate-705"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Fim do Período</label>
                    <input
                      type="date"
                      required
                      value={cityForm.endDate}
                      onChange={(e) => setCityForm({ ...cityForm, endDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all font-bold text-slate-705"
                    />
                  </div>
                </div>
                <div className="space-y-1.5 grid grid-cols-2 gap-2 md:col-span-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Horário Check-In</label>
                    <input
                      type="text"
                      value={cityForm.checkInTime}
                      onChange={(e) => setCityForm({ ...cityForm, checkInTime: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all font-bold text-slate-705"
                      placeholder="Ex: 15:00 ou Livre"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Horário Check-Out</label>
                    <input
                      type="text"
                      value={cityForm.checkOutTime}
                      onChange={(e) => setCityForm({ ...cityForm, checkOutTime: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all font-bold text-slate-705"
                      placeholder="Ex: 11:00"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nome da Hospedagem / Hotel</label>
                  <input
                    type="text"
                    value={cityForm.hotelName}
                    onChange={(e) => setCityForm({ ...cityForm, hotelName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all text-slate-705"
                    placeholder="Ex: Hilton Downtown"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Endereço da Hospedagem</label>
                  <input
                    type="text"
                    value={cityForm.hotelAddress}
                    onChange={(e) => setCityForm({ ...cityForm, hotelAddress: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all text-slate-705"
                    placeholder="Ex: 123 Main St, Boston, MA"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-between gap-3 border-t border-slate-100 items-center">
                {isEditingCity ? (
                  showDeleteCityConfirm ? (
                    <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 p-2 rounded-xl">
                      <span className="text-[11px] font-extrabold text-rose-750">Excluir destino e diários dele?</span>
                      <button
                        type="button"
                        onClick={handleDeleteCity}
                        className="px-2.5 py-1.5 bg-rose-650 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors animate-fade-in"
                      >
                        Sim, Excluir
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteCityConfirm(false)}
                        className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                      >
                        Não
                      </button>
                    </div>
                  ) : (() => {
                    const authorizedToDeleteDest = activeDestination ? canDeleteEntity(userRole, currentUser?.email, activeDestination.createdByEmail) : false;
                    return (
                      <button
                        type="button"
                        disabled={!authorizedToDeleteDest}
                        onClick={() => authorizedToDeleteDest && setShowDeleteCityConfirm(true)}
                        className={`px-4 py-2 font-extrabold text-xs rounded-xl transition-all border ${
                          authorizedToDeleteDest 
                            ? "bg-rose-50 hover:bg-rose-150 text-rose-600 cursor-pointer border-rose-200" 
                            : "bg-slate-50 text-slate-300 cursor-not-allowed border-slate-100 opacity-50"
                        }`}
                        title={authorizedToDeleteDest ? "Excluir Destino" : "Sem permissão de exclusão (apenas Criador ou Administrador)"}
                      >
                        Excluir Destino
                      </button>
                    );
                  })()
                ) : (
                  <div></div>
                )}
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCityForm(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {isEditingCity ? "Salvar Alterações" : "Cadastrar Destino"}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Days list & interactive form */}
        <div className="space-y-4 lg:col-span-1">
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-50 pb-2.5">
              <h3 className="font-extrabold text-slate-800 text-base">Diários de Bordo</h3>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">{activeDestination?.city} • {activeDestination?.dates}</p>
              {(activeDestination?.checkInTime || activeDestination?.checkOutTime) && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {activeDestination?.checkInTime && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg">
                      Check-In: {activeDestination.checkInTime}
                    </span>
                  )}
                  {activeDestination?.checkOutTime && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg">
                      Check-Out: {activeDestination.checkOutTime}
                    </span>
                  )}
                </div>
              )}
            </div>

            {activeDestination?.days.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Calendar className="w-8 h-8 text-slate-200 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Selecione dias customizados</p>
                <p className="text-[10px] text-slate-400">Esta parada ainda não possui roteiros diários configurados pela organização.</p>
              </div>
            ) : (
              <div className="flex flex-row overflow-x-auto gap-2 pb-2 scrollbar-none lg:flex-col lg:space-y-2 lg:overflow-x-visible lg:pb-0 w-full">
                {activeDestination.days.map((day, dIdx) => {
                  const dayStats = getDayStats(day);
                  return (
                    <button
                      key={day.id}
                      onClick={() => {
                        setActiveDayIdx(dIdx);
                        setShowAddActivityForm(false);
                      }}
                      className={`text-left p-2.5 sm:p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex justify-between items-center whitespace-nowrap shrink-0 lg:w-full lg:whitespace-normal lg:p-3.5 relative overflow-hidden ${
                        activeDayIdx === dIdx
                          ? "bg-slate-900 border-slate-950 text-white shadow-md font-bold"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                      }`}
                    >
                      {/* Progress bar at the very top edge of the day card */}
                      {dayStats.total > 0 && (
                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-slate-200/30">
                          <div 
                            className="h-full bg-emerald-500 transition-all duration-300"
                            style={{ width: `${dayStats.percentage}%` }}
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-2 lg:gap-0 lg:flex-row lg:items-start lg:justify-between lg:w-full w-full pt-1">
                        <div>
                          <p className={`font-black uppercase tracking-wider text-[10px] ${activeDayIdx === dIdx ? "text-amber-400" : "text-indigo-600"}`}>
                            Dia {day.dayNumber}
                          </p>
                          <p className={`text-[10px] ${activeDayIdx === dIdx ? "text-white/80" : "text-slate-400"}`}>{day.dateStr.split(" - ")[0] || day.dateStr}</p>
                          <p className={`font-bold mt-0.5 text-xs max-w-[110px] sm:max-w-[140px] lg:max-w-[180px] truncate ${activeDayIdx === dIdx ? "text-white" : "text-slate-700"}`}>{day.title}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            activeDayIdx === dIdx ? "bg-amber-400/20 text-amber-350" : "bg-slate-200/60 text-slate-500"
                          }`}>
                            {day.activities.length} act
                          </span>
                          {dayStats.total > 0 && (
                            <span className={`text-[9px] font-extrabold ${activeDayIdx === dIdx ? "text-emerald-400" : "text-emerald-600"}`}>
                              {dayStats.percentage}%
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {activeDestination && onAddDay && (
              <div className="pt-2 flex justify-center border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => onAddDay(activeDestination.id)}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3 h-3" /> Criar Dia Vazio
                </button>
              </div>
            )}

            {/* General Trip Info / Hotel Quick Card - HIDDEN AS REQUESTED */}
            {false && (() => {
              const connectedCost = costs.find(
                (c) => c.category === "hotel" && (c.destinationId === activeDestination?.id || (activeDestination && c.description.toLowerCase().includes(activeDestination.city.toLowerCase())))
              );
              
              return (
                <div className="bg-amber-50/50 rounded-2xl border border-amber-200/50 p-4 space-y-3.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-800 font-extrabold">
                      <Compass className="w-4 h-4 text-amber-600" />
                      <span>Base Hotelaria</span>
                    </div>
                    {/* Status Badge */}
                    {connectedCost && (
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold tracking-wide uppercase ${
                        connectedCost.status === "Pago" 
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                          : connectedCost.status === "Pgto no local"
                          ? "bg-sky-100 text-sky-800 border border-sky-200"
                          : "bg-rose-100 text-rose-800 border border-rose-200"
                      }`}>
                        {connectedCost.status === "Pgto no local" ? "Local" : connectedCost.status}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Hotel reservado em {activeDestination?.city}:</p>
                    <p className="text-slate-900 font-black text-sm leading-tight">{activeDestination?.hotelName}</p>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-0.5">
                      {activeDestination?.hotelAddress}
                    </p>
                    {activeDestination?.dates && (
                      <div className="flex gap-1 items-center text-[10px] text-indigo-600 font-bold mt-1">
                        <Calendar className="w-3 h-3 text-indigo-500" />
                        <span>Período: {activeDestination.dates}</span>
                      </div>
                    )}
                    {(activeDestination?.checkInTime || activeDestination?.checkOutTime) && (
                      <div className="flex flex-wrap gap-3 mt-1.5 pt-1.5 border-t border-slate-100">
                        {activeDestination?.checkInTime && (
                          <div className="flex gap-1 items-center text-[10px] font-bold text-slate-600">
                            <Clock className="w-3 h-3 text-emerald-500" />
                            <span>Check-in: {activeDestination.checkInTime}</span>
                          </div>
                        )}
                        {activeDestination?.checkOutTime && (
                          <div className="flex gap-1 items-center text-[10px] font-bold text-slate-600">
                            <Clock className="w-3 h-3 text-rose-500" />
                            <span>Check-out: {activeDestination.checkOutTime}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {connectedCost && (
                    <div className="pt-2.5 border-t border-amber-200/40 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="text-slate-400 font-bold block uppercase text-[8px] tracking-wider">Investimento Total (BRL)</span>
                        <span className="font-extrabold text-slate-800 text-xs">
                          {connectedCost.totalCostBRL.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                      </div>
                      <span className="text-[9px] text-amber-800/80 bg-amber-100/40 px-1.5 py-0.5 rounded border border-amber-100 font-semibold block text-right max-w-[125px] truncate">
                        {connectedCost.notes || "Sincronizado com custos"}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    {(activeDestination?.hotelLink || activeDestination?.hotelAddress || activeDestination?.hotelName) && (
                      <button
                        onClick={() => {
                          const queryParts = [
                            activeDestination.hotelName,
                            activeDestination.hotelAddress,
                            `${activeDestination.city}, ${activeDestination.country}`
                          ].filter(Boolean).join(", ");
                          setMapModalTarget({
                            title: activeDestination.hotelName || "Hotel do Roteiro",
                            query: queryParts,
                            latitude: activeDestination.hotelCoords?.lat,
                            longitude: activeDestination.hotelCoords?.lng
                          });
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-amber-100/60 rounded-xl text-[10px] text-amber-700 font-bold border border-amber-200 transition-colors shadow-2xs hover:shadow-xs cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5 text-rose-500" /> Google Maps
                      </button>
                    )}
                    {!isReadOnly && (
                      <button
                        onClick={startHotelSync}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 hover:shadow-md text-white rounded-xl text-[10px] font-extrabold transition-all shadow-2xs cursor-pointer"
                      >
                        <Pencil className="w-3 h-3 text-amber-200" /> Sincronizar & Editar
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* RIGHT TWO COLUMNS: Active hour-to-hour activity roadmap */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-4">
            
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">
                  {activeDay ? activeDay.title : "Resumo Geral"}
                </h3>
                <span className="text-xs text-slate-400 font-semibold">
                  {activeDay ? activeDay.dateStr : "Selecione uma parada na esquerda"}
                </span>
              </div>

              {activeDay && !isReadOnly && (
                <div className="flex gap-2 flex-wrap items-center">
                  <button
                    onClick={handleTriggerRouteOptimization}
                    disabled={isOptimizingRoute}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs hover:shadow-xs"
                    title="Otimizar ordem das atividades com base na proximidade e horários via Gemini"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isOptimizingRoute ? 'animate-spin' : ''}`} />
                    {isOptimizingRoute ? "Otimizando..." : "Otimizar Rota"}
                  </button>

                  <button
                    onClick={() => setShowAddActivityForm(!showAddActivityForm)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer opacity-95 hover:opacity-100"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Nova Atividade
                  </button>
                </div>
              )}
            </div>

            {/* Optimize Route Alert Feedbacks */}
            {optimizeError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-xs text-rose-700 font-medium flex items-start gap-2 animate-pulse">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{optimizeError}</span>
              </div>
            )}
            {optimizeSuccess && (
              <div className="p-3 bg-teal-50 border border-teal-100 rounded-2xl text-xs text-teal-850 font-medium flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>{optimizeSuccess}</span>
              </div>
            )}

            {/* Weather Widget - HIDDEN AS REQUESTED */}
            {false && activeDay && activeDestination && (
              <WeatherWidget destination={activeDestination} activeDay={activeDay} />
            )}

            {/* Interactive Timeline Map - HIDDEN AS REQUESTED */}
            {false && activeDay && activeDestination && (
              <ItineraryMap 
                destination={activeDestination} 
                dayActivities={activeDay.activities} 
                nearbyPlaces={nearbyPlaces}
              />
            )}

            {/* Smart Nearby Places AI Scanner Bento */}

            {/* Interactive Add Activity Form */}
            {showAddActivityForm && activeDay && (
              <motion.form 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                onSubmit={handleSubmitActivity}
                className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3"
              >
                <p className="text-xs font-black text-slate-700 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-indigo-600" /> Adicionar Atividade ao Dia {activeDay.dayNumber}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Agrupar no Dia / Roteiro</label>
                    <select
                      value={newActTargetDayId}
                      onChange={(e) => {
                        setNewActTargetDayId(e.target.value);
                        const targetDay = activeDestination?.days.find(d => d.id === e.target.value);
                        if (targetDay) {
                          setNewActDate(targetDay.dateStr);
                        }
                      }}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-semibold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    >
                      {activeDestination?.days.map((day) => (
                        <option key={day.id} value={day.id}>
                          Dia {day.dayNumber} - {day.dateStr}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Data Exibida (e.g. 01/07 ou 01 de Julho)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Quarta, 01 de Julho" 
                      value={newActDate}
                      onChange={(e) => setNewActDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-705 font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Horário (e.g. 09:00)</label>
                    <input 
                      type="text" 
                      placeholder="09:00" 
                      value={newActTime}
                      onChange={(e) => setNewActTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Tipo / Atividade</label>
                    <select
                      value={newActType}
                      onChange={(e) => setNewActType(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-bold text-slate-705 cursor-pointer"
                    >
                      <option value="other">Outros (Auto-detectar)</option>
                      <option value="flight">Voo / Transporte</option>
                      <option value="hotel">Hotel / Hospedagem</option>
                      <option value="tour">Passeio / Atração</option>
                      <option value="dinner">Restaurante / Alimentação</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Local / Atração</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Central Park" 
                      value={newActLocation}
                      onChange={(e) => setNewActLocation(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Tempo Estimado</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 1h30" 
                      value={newActDuration}
                      onChange={(e) => setNewActDuration(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Valor do Ingresso</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Gratuito / US$ 15" 
                      value={newActCost}
                      onChange={(e) => setNewActCost(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Estacionamento (Parking Info)</label>
                    <input 
                      type="text" 
                      placeholder="Garagem ou Zona Azul" 
                      value={newActParking}
                      onChange={(e) => setNewActParking(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Nome p/ Google Maps</label>
                    <input 
                      type="text" 
                      placeholder="e.g. United States Capitol" 
                      value={newActMapsQuery}
                      onChange={(e) => setNewActMapsQuery(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Link Oficial</label>
                    <input 
                      type="url" 
                      placeholder="https://site.com" 
                      value={newActWebsite}
                      onChange={(e) => setNewActWebsite(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Latitude Real (Opcional - e.g. 40.7621)</label>
                    <input 
                      type="number" 
                      step="any"
                      placeholder="e.g. 40.7621" 
                      value={newActLatitude}
                      onChange={(e) => setNewActLatitude(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Longitude Real (Opcional - e.g. -73.8302)</label>
                    <input 
                      type="number" 
                      step="any"
                      placeholder="e.g. -73.8302" 
                      value={newActLongitude}
                      onChange={(e) => setNewActLongitude(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Instruções Úteis para o Grupo</label>
                    <textarea 
                      placeholder="Alinhamento, regras, códigos de ingressos..." 
                      value={newActNotes}
                      onChange={(e) => setNewActNotes(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white h-[68px] resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Anexar Ingresso (PDF ou Imagem)</label>
                    <div className="border border-dashed border-slate-200 rounded-lg p-3 text-center bg-white hover:border-slate-350 transition-all h-[68px] flex flex-col justify-center relative">
                      <input 
                        type="file" 
                        id="new-activity-ticket-file"
                        onChange={(e) => handleFileChange(e, false)} 
                        className="hidden" 
                      />
                      {newActTicketFileName ? (
                        <div className="flex flex-col items-center justify-center">
                          <p className="font-bold text-slate-800 text-[10px] truncate max-w-[180px]">{newActTicketFileName}</p>
                          <button 
                            type="button" 
                            onClick={() => {
                              setNewActTicketFileName("");
                              setNewActTicketFileData("");
                            }}
                            className="text-[9px] text-rose-500 font-bold hover:underline mt-0.5"
                          >
                            Remover arquivo
                          </button>
                        </div>
                      ) : (
                        <label htmlFor="new-activity-ticket-file" className="cursor-pointer flex flex-col items-center justify-center">
                          <Upload className="w-4 h-4 text-indigo-500 mb-0.5" />
                          <span className="text-[11px] font-bold text-slate-600 hover:text-indigo-650 transition-colors">Escolher arquivo</span>
                          <span className="text-[8px] text-slate-400">Offline no navegador</span>
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddActivityForm(false)}
                    className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                  >
                    Salvar Roteiro
                  </button>
                </div>
              </motion.form>
            )}

            {/* Timeline View Filter Segmented Control */}
            {activeDestination && (
              <div className="space-y-3 mt-2 max-w-md mx-auto sm:ml-0">
                <div className="flex items-center justify-between bg-slate-50 border border-slate-205 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setTimelineMode("selected")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-black rounded-xl transition-all cursor-pointer ${
                      timelineMode === "selected"
                        ? "bg-white text-indigo-700 shadow-sm border border-slate-200"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                    Conforme Selecionado
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimelineMode("all")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-black rounded-xl transition-all cursor-pointer ${
                      timelineMode === "all"
                        ? "bg-white text-indigo-700 shadow-sm border border-slate-200"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-500 animate-pulse" />
                    Roteiro Inteiro ({activeDestination.days.length} Dias)
                  </button>
                </div>

                {/* Single-selection filter for visited / non-visited spots */}
                <div className="flex items-center justify-between bg-slate-100/60 border border-slate-200/85 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setVisitedFilter("all")}
                    className={`flex-1 py-1 px-2.5 text-[11px] font-black rounded-xl transition-all cursor-pointer text-center ${
                      visitedFilter === "all"
                        ? "bg-white text-indigo-700 shadow-3xs border border-slate-200/50"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Todos Pontos
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisitedFilter("not_visited")}
                    className={`flex-1 py-1 px-2.5 text-[11px] font-black rounded-xl transition-all cursor-pointer text-center ${
                      visitedFilter === "not_visited"
                        ? "bg-white text-emerald-700 shadow-3xs border border-slate-200/50"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                    title="Pontos não visitados ainda"
                  >
                    Não Visitados
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisitedFilter("visited")}
                    className={`flex-1 py-1 px-2.5 text-[11px] font-black rounded-xl transition-all cursor-pointer text-center ${
                      visitedFilter === "visited"
                        ? "bg-white text-indigo-950 shadow-3xs border border-slate-200/50"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                    title="Pontos já visitados"
                  >
                    Visitados
                  </button>
                </div>
              </div>
            )}

            {/* List Hour-per-hour Activities */}
            <div className="relative border-l-2 border-indigo-100/70 pl-5 sm:pl-7 space-y-4 py-2 ml-3.5">
              {timelineMode === "selected" ? (
                /* Only Selected Day's activities */
                !activeDay || activeDay.activities.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    Nenhuma atividade cadastrada. Personalize adicionando acima.
                  </div>
                ) : ( (() => {
                  const filtered = sortActivitiesByTime(activeDay.activities).filter((act) => {
                    const isVisited = isActivityCheckedByActiveTraveler(act.id);
                    if (visitedFilter === "visited") return isVisited;
                    if (visitedFilter === "not_visited") return !isVisited;
                    return true;
                  });
                  if (filtered.length === 0) {
                    return (
                      <div className="p-8 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        Nenhuma atividade {visitedFilter === "visited" ? "visitada" : "não visitada"} cadastrada para este dia.
                      </div>
                    );
                  }
                  return filtered.map((act) => {
                    const actInfo = getActivityInfo(act);
                    const TypeIcon = actInfo.icon;
                    const isVisited = isActivityCheckedByActiveTraveler(act.id);
                    return (
                      <motion.div 
                        key={act.id} 
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="relative group/item"
                      >
                        {/* Circle bullet with type icon on timeline */}
                        <span className={`absolute -left-[32px] sm:-left-[40px] top-3.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 z-10 flex items-center justify-center shadow-xs transition-transform group-hover/item:scale-110 bg-white ${actInfo.bulletColor}`}>
                          <TypeIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </span>

                        {/* Modern Activity Card in Block format */}
                        <div 
                          id={`activity-card-${act.id}`} 
                          className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row md:items-start justify-between gap-4 shadow-xs hover:shadow-md ${
                            isVisited
                              ? "bg-slate-50/60 border-slate-200/70 opacity-80"
                              : "bg-white hover:bg-gradient-to-r hover:from-white hover:to-indigo-50/20 border-slate-200/80 hover:border-indigo-200"
                          }`}
                        >
                          
                          <div className="space-y-2.5 grow">
                            {/* Top Badge Row: Time + Category + Cost */}
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Prominent Time Badge */}
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[11px] font-black tracking-tight font-mono shadow-xs">
                                <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                                {act.time}
                              </span>

                              {/* Category Badge */}
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10.5px] font-extrabold tracking-tight border ${actInfo.color}`}>
                                <TypeIcon className="w-3.5 h-3.5 shrink-0" />
                                {actInfo.label}
                              </span>

                              {/* Cost Badge in Highlight */}
                              {act.cost && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-lg text-[10.5px] font-black tracking-tight">
                                  <DollarSign className="w-3 h-3 text-emerald-600 shrink-0 -mr-0.5" />
                                  {act.cost}
                                </span>
                              )}

                              {/* Duration Badge */}
                              {act.duration && (
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                  ⏱ {act.duration}
                                </span>
                              )}
                            </div>

                            {/* Location Title */}
                            <div>
                              {isVisited ? (
                                <h4 className="font-bold text-slate-400 text-sm sm:text-base line-through decoration-slate-400/80 flex items-center gap-2 flex-wrap">
                                  <span>{act.location}</span>
                                  <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200 font-black px-2 py-0.5 rounded-md no-underline inline-flex items-center gap-1 uppercase tracking-wider">
                                    <Check className="w-2.5 h-2.5 stroke-[3.5]" /> Visitado
                                  </span>
                                </h4>
                              ) : (
                                <h4 className="font-black text-slate-900 text-sm sm:text-base tracking-tight leading-snug">
                                  {act.location}
                                </h4>
                              )}
                            </div>

                            {/* Parking Details Mention */}
                            {act.parking && (
                              <div className="text-[11px] text-amber-900 bg-amber-50/80 border border-amber-200/60 rounded-xl p-2 px-3 max-w-prose flex items-start gap-1.5">
                                <span className="font-black text-[10px] uppercase tracking-wider text-amber-700 shrink-0">🅿️ Estacionamento:</span>
                                <span>{act.parking}</span>
                              </div>
                            )}

                            {/* Extra Note Context */}
                            {act.notes && (
                              <p className="text-xs text-slate-600 bg-slate-50 border-l-2 border-indigo-300 p-2 pl-3 rounded-r-xl italic leading-relaxed">
                                {act.notes}
                              </p>
                            )}

                            {/* Attached Ticket */}
                            {act.ticketFileName && (
                              <div className="flex items-center gap-2 bg-indigo-50/70 border border-indigo-100 p-2 px-3 rounded-xl max-w-sm">
                                <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                                <div className="grow min-w-0">
                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Ingresso Anexo</p>
                                  <p className="text-[11px] font-black text-indigo-950 truncate font-mono">{act.ticketFileName}</p>
                                </div>
                                <button
                                  onClick={() => handleDownloadTicket(act)}
                                  className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                                >
                                  <Download className="w-3 h-3" />
                                  Baixar
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Direction and Link column */}
                          <div className="flex flex-wrap items-center md:items-end gap-2 justify-start md:justify-end shrink-0 w-full md:w-auto mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                            {activeTraveler && (
                              <button
                                onClick={() => handleToggleActivityVisited(activeTraveler.id, act.id)}
                                className={`flex items-center whitespace-nowrap gap-1.5 px-3 py-1.5 rounded-xl text-[10.5px] font-black transition-all cursor-pointer shadow-2xs ${
                                  isVisited
                                    ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                                    : "bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200"
                                }`}
                                title={isVisited ? "Desmarcar visita" : "Marcar como visitado"}
                              >
                                {isVisited ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3.5]" />
                                    <span>Visitado ✓</span>
                                  </>
                                ) : (
                                  <>
                                    <Circle className="w-3.5 h-3.5 text-slate-400 stroke-[2.5]" />
                                    <span>Marcar Visitado</span>
                                  </>
                                )}
                              </button>
                            )}
                            {act.mapsQuery && (
                              <button
                                onClick={() => {
                                  setMapModalTarget({
                                    title: act.location || "Ponto Turístico",
                                    query: act.mapsQuery || act.location,
                                    latitude: act.latitude,
                                    longitude: act.longitude
                                  });
                                }}
                                className="flex items-center whitespace-nowrap gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-[10.5px] font-bold transition-all cursor-pointer shadow-2xs"
                                title="Ver Localização no Maps"
                              >
                                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                                <span>Ver Maps</span>
                              </button>
                            )}
                            {act.websiteLink && (
                              <a
                                href={act.websiteLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center whitespace-nowrap gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-xl text-[10.5px] font-bold transition-all shadow-2xs"
                              >
                                <span>Site Oficial</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {activeDay && !isReadOnly && (
                              <div className="flex items-center gap-1.5 mt-auto">
                                <button
                                  onClick={() => startEditing(act)}
                                  className="p-1 px-2.5 whitespace-nowrap text-indigo-650 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl transition-colors flex items-center gap-1 cursor-pointer font-black text-[10px] uppercase border border-indigo-100"
                                  title="Editar atividade"
                                >
                                  <Pencil className="w-3 h-3" />
                                  <span>Editar</span>
                                </button>
                                {(() => {
                                  const authorized = canDeleteEntity(userRole, currentUser?.email, act.createdByEmail);
                                  return (
                                    <button
                                      type="button"
                                      disabled={!authorized}
                                      onClick={() => authorized && onRemoveActivity(activeDestination.id, activeDay.id, act.id)}
                                      className={`p-1.5 rounded-xl transition-colors ${
                                        authorized 
                                          ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" 
                                          : "text-slate-200 bg-slate-50 opacity-40 cursor-not-allowed"
                                      }`}
                                      title={authorized ? "Remover atividade" : "Sem permissão de exclusão (apenas Criador ou Administrador)"}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  );
                                })()}
                              </div>
                            )}
                          </div>

                        </div>
                      </motion.div>
                    );
                  })
                })()
              )
            ) : (
                /* All Days holistic sequential timeline */
                !activeDestination || !activeDestination.days.some(d => d.activities.length > 0) ? (
                  <div className="p-8 text-center text-slate-400">
                    Nenhuma atividade cadastrada em nenhum dia do roteiro. Personalize escolhendo um dia no menu esquerdo e adicione atrações!
                  </div>
                ) : ( (() => {
                  const hasAnyMatching = activeDestination.days.some(day => 
                    day.activities.some(act => {
                      const isVisited = isActivityCheckedByActiveTraveler(act.id);
                      if (visitedFilter === "visited") return isVisited;
                      if (visitedFilter === "not_visited") return !isVisited;
                      return true;
                    })
                  );
                  if (!hasAnyMatching) {
                    return (
                      <div className="p-8 text-center text-slate-400">
                        Nenhuma atividade {visitedFilter === "visited" ? "visitada" : "não visitada"} cadastrada no roteiro inteiro.
                      </div>
                    );
                  }
                  return activeDestination.days.map((day) => {
                    const sortedActs = sortActivitiesByTime(day.activities);
                    if (sortedActs.length === 0) return null;
                    const filteredActs = sortedActs.filter((act) => {
                      const isVisited = isActivityCheckedByActiveTraveler(act.id);
                      if (visitedFilter === "visited") return isVisited;
                      if (visitedFilter === "not_visited") return !isVisited;
                      return true;
                    });
                    if (filteredActs.length === 0) return null;
                    return (
                      <div key={day.id} className="space-y-4">
                        {/* Floating Day Header in Timeline */}
                        <div className="relative -ml-6 sm:-ml-8 pl-6 sm:pl-8 pt-4 pb-2 first:pt-0">
                          <div className="flex items-center gap-2">
                            <span className="bg-indigo-600 text-white text-[10.5px] font-black px-3 py-1 rounded-full shadow-xs uppercase tracking-wider">
                              Dia {day.dayNumber}
                            </span>
                            <span className="text-slate-600 text-xs font-black font-sans">
                              {day.dateStr}
                            </span>
                            <div className="grow border-t border-dashed border-slate-200 ml-2" />
                          </div>
                        </div>

                        {filteredActs.map((act) => {
                          const actInfo = getActivityInfo(act);
                          const TypeIcon = actInfo.icon;
                          const isVisited = isActivityCheckedByActiveTraveler(act.id);
                          return (
                            <motion.div 
                              key={act.id} 
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2 }}
                              className="relative group/item ml-2"
                            >
                              {/* Circle bullet with type icon on timeline */}
                              <span className={`absolute -left-[40px] sm:-left-[48px] top-3.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 z-10 flex items-center justify-center bg-white shadow-xs transition-transform group-hover/item:scale-110 ${actInfo.bulletColor}`}>
                                <TypeIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </span>

                              {/* Modern Activity Card in Block format */}
                              <div 
                                id={`activity-card-all-${act.id}`} 
                                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row md:items-start justify-between gap-4 shadow-xs hover:shadow-md ${
                                  isVisited
                                    ? "bg-slate-50/60 border-slate-200/70 opacity-80"
                                    : "bg-white hover:bg-gradient-to-r hover:from-white hover:to-indigo-50/20 border-slate-200/80 hover:border-indigo-200"
                                }`}
                              >
                                
                                <div className="space-y-2.5 grow">
                                  {/* Top Badge Row: Time + Category + Cost */}
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[11px] font-black tracking-tight font-mono shadow-xs">
                                      <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                                      {act.time}
                                    </span>
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10.5px] font-extrabold tracking-tight border ${actInfo.color}`}>
                                      <TypeIcon className="w-3.5 h-3.5 shrink-0" />
                                      {actInfo.label}
                                    </span>
                                    {act.cost && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-lg text-[10.5px] font-black tracking-tight">
                                        <DollarSign className="w-3 h-3 text-emerald-600 shrink-0 -mr-0.5" />
                                        {act.cost}
                                      </span>
                                    )}
                                    {act.duration && (
                                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                        ⏱ {act.duration}
                                      </span>
                                    )}
                                  </div>

                                  {/* Location Title */}
                                  <div>
                                    {isVisited ? (
                                      <h4 className="font-bold text-slate-400 text-sm sm:text-base line-through decoration-slate-400/80 flex items-center gap-2 flex-wrap">
                                        <span>{act.location}</span>
                                        <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200 font-black px-2 py-0.5 rounded-md no-underline inline-flex items-center gap-1 uppercase tracking-wider">
                                          <Check className="w-2.5 h-2.5 stroke-[3.5]" /> Visitado
                                        </span>
                                      </h4>
                                    ) : (
                                      <h4 className="font-black text-slate-900 text-sm sm:text-base tracking-tight leading-snug">
                                        {act.location}
                                      </h4>
                                    )}
                                  </div>

                                  {/* Parking Details Mention */}
                                  {act.parking && (
                                    <div className="text-[11px] text-amber-900 bg-amber-50/80 border border-amber-200/60 rounded-xl p-2 px-3 max-w-prose flex items-start gap-1.5">
                                      <span className="font-black text-[10px] uppercase tracking-wider text-amber-700 shrink-0">🅿️ Estacionamento:</span>
                                      <span>{act.parking}</span>
                                    </div>
                                  )}

                                  {/* Extra Note Context */}
                                  {act.notes && (
                                    <p className="text-xs text-slate-600 bg-slate-50 border-l-2 border-indigo-300 p-2 pl-3 rounded-r-xl italic leading-relaxed">
                                      {act.notes}
                                    </p>
                                  )}

                                  {/* Attached Ticket */}
                                  {act.ticketFileName && (
                                    <div className="flex items-center gap-2 bg-indigo-50/70 border border-indigo-100 p-2 px-3 rounded-xl max-w-sm">
                                      <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                                      <div className="grow min-w-0">
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Ingresso Anexo</p>
                                        <p className="text-[11px] font-black text-indigo-950 truncate font-mono">{act.ticketFileName}</p>
                                      </div>
                                      <button
                                        onClick={() => handleDownloadTicket(act)}
                                        className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                                      >
                                        <Download className="w-3 h-3" />
                                        Baixar
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Direction and Link column */}
                                <div className="flex flex-wrap items-center md:items-end gap-2 justify-start md:justify-end shrink-0 w-full md:w-auto mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                                  {activeTraveler && (
                                    <button
                                      onClick={() => handleToggleActivityVisited(activeTraveler.id, act.id)}
                                      className={`flex items-center whitespace-nowrap gap-1.5 px-3 py-1.5 rounded-xl text-[10.5px] font-black transition-all cursor-pointer shadow-2xs ${
                                        isVisited
                                          ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                                          : "bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200"
                                      }`}
                                      title={isVisited ? "Desmarcar visita" : "Marcar como visitado"}
                                    >
                                      {isVisited ? (
                                        <>
                                          <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3.5]" />
                                          <span>Visitado ✓</span>
                                        </>
                                      ) : (
                                        <>
                                          <Circle className="w-3.5 h-3.5 text-slate-400 stroke-[2.5]" />
                                          <span>Marcar Visitado</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                  {act.mapsQuery && (
                                    <button
                                      onClick={() => {
                                        setMapModalTarget({
                                          title: act.location || "Ponto Turístico",
                                          query: act.mapsQuery || act.location,
                                          latitude: act.latitude,
                                          longitude: act.longitude
                                        });
                                      }}
                                      className="flex items-center whitespace-nowrap gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-[10.5px] font-bold transition-all cursor-pointer shadow-2xs"
                                      title="Ver Localização no Maps"
                                    >
                                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                                      <span>Ver Maps</span>
                                    </button>
                                  )}
                                  {act.websiteLink && (
                                    <a
                                      href={act.websiteLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center whitespace-nowrap gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-xl text-[10.5px] font-bold transition-all shadow-2xs"
                                    >
                                      <span>Site Oficial</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                  {!isReadOnly && (
                                    <div className="flex items-center gap-1.5 mt-auto">
                                      <button
                                        onClick={() => {
                                          const dIndex = activeDestination?.days.findIndex(d => d.id === day.id);
                                          if (dIndex !== undefined && dIndex >= 0) {
                                            setActiveDayIdx(dIndex);
                                            setTimelineMode("selected");
                                            startEditing(act);
                                          }
                                        }}
                                        className="p-1 px-2.5 whitespace-nowrap text-indigo-650 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl transition-colors flex items-center gap-1 cursor-pointer font-black text-[10px] uppercase border border-indigo-100"
                                        title="Editar atividade"
                                      >
                                        <Pencil className="w-3 h-3" />
                                        <span>Editar</span>
                                      </button>
                                      {(() => {
                                        const authorized = canDeleteEntity(userRole, currentUser?.email, act.createdByEmail);
                                        return (
                                          <button
                                            type="button"
                                            disabled={!authorized}
                                            onClick={() => authorized && onRemoveActivity(activeDestination.id, day.id, act.id)}
                                            className={`p-1.5 rounded-xl transition-colors ${
                                              authorized 
                                                ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" 
                                                : "text-slate-200 bg-slate-50 opacity-40 cursor-not-allowed"
                                            }`}
                                            title={authorized ? "Remover atividade" : "Sem permissão de exclusão (apenas Criador ou Administrador)"}
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        );
                                      })()}
                                    </div>
                                  )}
                                </div>

                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    );
                  })
                })()
              )
            )}
            </div>

          </div>

          {/* MALA ESCANEADA (Packing Checklist) */}
          {activeDestination && (
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="border-b border-indigo-50 pb-2.5 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-1.5">
                    <Briefcase className="w-5 h-5 text-indigo-650" />
                    Mala Escaneada
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Seu controle de bagagem individual para {activeDestination.city}
                  </p>
                </div>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-3 py-1 rounded-full border border-indigo-100 uppercase tracking-wider">
                  Bagagem
                </span>
              </div>

              {/* Travelers Selection for Packing */}
              {activeTravelersList.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Visualizar bagagem de:</span>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-nowrap">
                    {activeTravelersList.map((t) => {
                      const isSelected = t.id === selectedTravelerId;
                      const isCurrentUser = currentUser?.isTraveler && t.email?.toLowerCase().trim() === currentUser.email?.toLowerCase().trim();
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedTravelerId(t.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                            isSelected
                              ? "bg-indigo-600 text-white shadow-xs"
                              : "bg-slate-50 text-slate-600 hover:bg-slate-150 border border-slate-200"
                          } flex items-center gap-1.5`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full bg-white/20 flex items-center justify-center text-[8px] font-bold">
                            {t.name.substring(0, 1).toUpperCase()}
                          </span>
                          <span className="truncate max-w-[90px]">{t.name}</span>
                          {isCurrentUser && (
                            <span className={`text-[8px] px-1 rounded-sm ${isSelected ? 'bg-indigo-700 text-indigo-105' : 'bg-slate-105 text-slate-500'}`}>
                              Você
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Informações sobre o Viajante Selecionado */}
              <div className="bg-slate-50/50 rounded-xl p-3 border border-dashed border-slate-200 flex items-center gap-2 text-xs">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  {activeTraveler?.name ? activeTraveler.name.substring(0, 1).toUpperCase() : "?"}
                </div>
                <div className="grow text-[11px]">
                  <p className="font-extrabold text-slate-700">Mala de: {activeTraveler?.name || "Você"}</p>
                  <p className="text-slate-400 uppercase tracking-wider font-mono text-[8px]">{activeTraveler?.role || "Viajante"}</p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <div className="flex justify-between items-center pr-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>Itens Solicitados</span>
                  <span>Checkout</span>
                </div>

                {getPackingItemsForActiveTraveler().length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    Sua mala está vazia. Adicione itens abaixo para começar a empacotar!
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {getPackingItemsForActiveTraveler().map((item) => {
                      const isPacked = item.packed;
                      return (
                        <div 
                          key={item.id}
                          className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl border border-slate-100/60 transition-colors group/pack"
                        >
                          <div 
                            onClick={() => handleTogglePackingItem(activeTraveler.id, item.id)}
                            className="grow flex items-center gap-2 cursor-pointer select-none border-none bg-transparent outline-none p-0 text-left"
                          >
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all shrink-0 ${
                              isPacked 
                                ? "bg-indigo-600 text-white" 
                                : "border border-slate-300 bg-white"
                            }`}>
                              {isPacked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                            <span className={`text-xs truncate max-w-[280px] ${
                              isPacked ? "line-through text-slate-400 decoration-slate-400/80" : "font-semibold text-slate-700"
                            }`}>
                              {item.name}
                            </span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleRemovePackingItem(activeTraveler.id, item.id)}
                            className="text-slate-300 hover:text-rose-500 p-1 rounded-md hover:bg-rose-50 cursor-pointer md:opacity-0 group-hover/pack:opacity-100 transition-all shrink-0"
                            title="Remover item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add customized packing item form */}
                {activeTraveler && (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddPackingItem(activeTraveler.id, newPackingItemName);
                    }}
                    className="flex gap-1.5 pt-1"
                  >
                    <input
                      type="text"
                      placeholder="Adicionar item na mala (ex: Casaco, Protetor Solar)..."
                      value={newPackingItemName}
                      onChange={(e) => setNewPackingItemName(e.target.value)}
                      className="grow px-3 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white text-xs font-semibold text-slate-705 border border-slate-205 rounded-xl outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/30 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!newPackingItemName.trim()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center shrink-0 shadow-2xs hover:shadow-xs"
                    >
                      + Add
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* DICAS GERAIS TAB - Matches Image 4 exactly */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-indigo-100/50 flex-wrap">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              <h3 className="font-extrabold text-slate-800 text-base">Guia & Dicas Locais</h3>
              <span className="text-[10px] bg-slate-50 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full font-bold">
                Caderneta De Bordo
              </span>
              
              {onAddTip && !isReadOnly && (
                <button
                  onClick={startAddTip}
                  className="ml-auto px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-[10px] font-extrabold shadow-2xs hover:shadow-xs cursor-pointer transition-all flex items-center gap-1"
                >
                  <span>+ Adicionar Dica</span>
                </button>
              )}
            </div>

            <div className="space-y-4">
              {currentTips.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Nenhuma dica disponível.
                </div>
              ) : (
                currentTips.map((tip) => (
                  <details key={tip.id} className="group overflow-hidden border border-slate-200 rounded-2xl bg-slate-50/50">
                    <summary className="flex items-center justify-between p-4 font-bold text-slate-800 text-xs cursor-pointer hover:bg-slate-50">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md shrink-0">
                          {tip.category}
                        </span>
                        <span>{tip.title}</span>
                      </div>
                      <span className="transition-transform group-open:rotate-180">
                        <span className="block text-slate-400">▼</span>
                      </span>
                    </summary>
                    <div className="p-4 border-t border-slate-150 text-xs text-slate-650 leading-relaxed bg-white space-y-3">
                      <div className="whitespace-pre-line">
                        {tip.content}
                      </div>

                      {/* Action buttons inside tip details */}
                      {!isReadOnly && (
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-[10px]">
                          {onEditTip && (
                            <button
                              onClick={() => startEditTip(tip)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg font-bold transition-all cursor-pointer"
                            >
                              <Pencil className="w-3 h-3" /> Editar
                            </button>
                          )}
                          {onRemoveTip && (
                            deletingTipId === tip.id ? (
                              <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">
                                <span className="font-extrabold text-[10px]">Excluir dica?</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onRemoveTip(tip.id);
                                    setDeletingTipId(null);
                                  }}
                                  className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-[10px] cursor-pointer"
                                >
                                  Excluir
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingTipId(null)}
                                  className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-350 text-slate-750 rounded font-bold text-[10px] cursor-pointer"
                                >
                                  Não
                                </button>
                              </div>
                            ) : (() => {
                              const authorized = canDeleteEntity(userRole, currentUser?.email, undefined);
                              return (
                                <button
                                  disabled={!authorized}
                                  onClick={() => authorized && setDeletingTipId(tip.id)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                                    authorized 
                                      ? "text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer" 
                                      : "text-slate-300 bg-slate-50 opacity-40 cursor-not-allowed"
                                  }`}
                                  title={authorized ? "Excluir dica" : "Sem permissão de exclusão (apenas Criador ou Administrador)"}
                                >
                                  <Trash2 className="w-3" /> Excluir
                                </button>
                              );
                            })()
                          )}
                        </div>
                      )}
                    </div>
                  </details>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* EDIT MODAL / DIALOG */}
      <AnimatePresence>
        {editingActivity && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Pencil className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">Editar Atividade</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ajustar os parâmetros desta atração no roteiro</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingActivity(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-black p-1 hover:bg-slate-100 rounded-lg px-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4 text-xs font-medium text-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Agrupar no Dia / Roteiro</label>
                    <select
                      value={editActTargetDayId}
                      onChange={(e) => {
                        setEditActTargetDayId(e.target.value);
                        const targetDay = activeDestination?.days.find(d => d.id === e.target.value);
                        if (targetDay) {
                          setEditActDate(targetDay.dateStr);
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-extrabold text-slate-700 cursor-pointer"
                    >
                      {activeDestination?.days.map((day) => (
                        <option key={day.id} value={day.id}>
                          Dia {day.dayNumber} - {day.dateStr}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Data Exibida (e.g. 01/07 ou 01 de Julho)</label>
                    <input
                      type="text"
                      value={editActDate}
                      onChange={(e) => setEditActDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-medium text-slate-850"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Horário (e.g. 09:00)</label>
                    <input
                      type="text"
                      value={editActTime}
                      onChange={(e) => setEditActTime(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-medium text-slate-850"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Tipo / Atividade</label>
                    <select
                      value={editActType}
                      onChange={(e) => setEditActType(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-bold text-slate-700 cursor-pointer"
                    >
                      <option value="other">Outros (Auto-detectar)</option>
                      <option value="flight">Voo / Transporte</option>
                      <option value="hotel">Hotel / Hospedagem</option>
                      <option value="tour">Passeio / Atração</option>
                      <option value="dinner">Restaurante / Alimentação</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Tempo Estimado / Duração</label>
                    <input
                      type="text"
                      value={editActDuration}
                      onChange={(e) => setEditActDuration(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-medium text-slate-850"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Local / Atração</label>
                  <input
                    type="text"
                    value={editActLocation}
                    onChange={(e) => setEditActLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-medium text-slate-850"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Valor do Ingresso</label>
                    <input
                      type="text"
                      value={editActCost}
                      onChange={(e) => setEditActCost(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-medium text-slate-850"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Estacionamento (Parking Info)</label>
                    <input
                      type="text"
                      value={editActParking}
                      onChange={(e) => setEditActParking(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-medium text-slate-850"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Nome p/ Google Maps</label>
                    <input
                      type="text"
                      value={editActMapsQuery}
                      onChange={(e) => setEditActMapsQuery(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-medium text-slate-850"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Link Oficial</label>
                    <input
                      type="url"
                      value={editActWebsite}
                      onChange={(e) => setEditActWebsite(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-medium text-slate-850"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Latitude Real (Opcional - e.g. 40.7621)</label>
                    <input
                      type="number"
                      step="any"
                      value={editActLatitude}
                      onChange={(e) => setEditActLatitude(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-medium text-slate-850"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Longitude Real (Opcional - e.g. -73.8302)</label>
                    <input
                      type="number"
                      step="any"
                      value={editActLongitude}
                      onChange={(e) => setEditActLongitude(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-medium text-slate-850"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Instruções Úteis para o Grupo</label>
                    <textarea
                      value={editActNotes}
                      onChange={(e) => setEditActNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden h-[68px] resize-none font-medium text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Anexar Ingresso (PDF ou Imagem)</label>
                    <div className="border border-dashed border-slate-200 rounded-xl p-3 text-center bg-white hover:border-slate-350 transition-all h-[68px] flex flex-col justify-center relative">
                      <input 
                        type="file" 
                        id="edit-activity-ticket-file"
                        onChange={(e) => handleFileChange(e, true)} 
                        className="hidden" 
                      />
                      {editActTicketFileName ? (
                        <div className="flex flex-col items-center justify-center">
                          <p className="font-bold text-slate-800 text-[10px] truncate max-w-[180px] font-mono">{editActTicketFileName}</p>
                          <button 
                            type="button" 
                            onClick={() => {
                              setEditActTicketFileName("");
                              setEditActTicketFileData("");
                            }}
                            className="text-[9px] text-rose-500 font-bold hover:underline mt-0.5"
                          >
                            Remover arquivo
                          </button>
                        </div>
                      ) : (
                        <label htmlFor="edit-activity-ticket-file" className="cursor-pointer flex flex-col items-center justify-center">
                          <Upload className="w-4 h-4 text-indigo-500 mb-0.5" />
                          <span className="text-[11px] font-bold text-slate-600 hover:text-indigo-650 transition-colors">Escolher arquivo</span>
                          <span className="text-[8px] text-slate-400">Offline no navegador</span>
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-3.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingActivity(null)}
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

      {/* HOTEL SYNCHRONIZATION MODAL */}
      <AnimatePresence>
        {isSyncingHotel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                    <Compass className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">Base Hotelaria & Custos</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ajuste e Sincronização em Tempo Real</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSyncingHotel(false)}
                  className="text-slate-455 hover:text-slate-655 text-lg font-black p-1 hover:bg-slate-100 rounded-lg px-2"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleHotelSyncSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Nome da Hospedagem / Hotel</label>
                  <input
                    type="text"
                    value={syncHotelName}
                    onChange={(e) => setSyncHotelName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-medium text-slate-805"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Endereço Completo</label>
                  <input
                    type="text"
                    value={syncHotelAddress}
                    onChange={(e) => setSyncHotelAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-medium text-slate-805"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Período / Datas Estadia</label>
                    <input
                      type="text"
                      placeholder="e.g. 01 jul. - 04 jul."
                      value={syncHotelDates}
                      onChange={(e) => setSyncHotelDates(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden font-medium focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Link do Maps</label>
                    <input
                      type="text"
                      value={syncHotelLink}
                      onChange={(e) => setSyncHotelLink(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden font-medium focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Check-in (Horário)</label>
                    <input
                      type="time"
                      value={syncHotelCheckIn}
                      onChange={(e) => setSyncHotelCheckIn(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden font-medium focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Check-out (Horário)</label>
                    <input
                      type="time"
                      value={syncHotelCheckOut}
                      onChange={(e) => setSyncHotelCheckOut(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden font-medium focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Investimento Total (BRL R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={syncHotelCostBRL}
                      onChange={(e) => setSyncHotelCostBRL(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden font-bold text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Status do Pagamento</label>
                    <select
                      value={syncHotelStatus}
                      onChange={(e) => setSyncHotelStatus(e.target.value as CostItem["status"])}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden font-medium focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Pago">Pago</option>
                      <option value="Pgto no local">Pagar no local</option>
                      <option value="Falta pagar">Falta pagar</option>
                    </select>
                  </div>
                </div>

                <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100 text-[10px] text-amber-800/80 leading-relaxed font-semibold">
                  🔄 Salvar as alterações atualizará a base de hotéis e a planilha de custos de forma 100% automatizada.
                </div>

                <div className="flex justify-end gap-2.5 pt-3.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsSyncingHotel(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 hover:shadow-md text-white rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    Salvar & Sincronizar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD NEW TIP MODAL */}
      <AnimatePresence>
        {isAddingTip && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">Nova Dica Caderneta</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Incluir guia, aviso ou hack útil de viagem</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddingTip(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-black p-1 hover:bg-slate-100 rounded-lg px-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={submitAddTip} className="space-y-4 text-xs font-medium text-slate-700">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Cidade / Categoria do Alinhamento</label>
                  <input
                    type="text"
                    value={tipCategory}
                    onChange={(e) => setTipCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden font-bold text-slate-800 focus:ring-1 focus:ring-amber-500"
                    placeholder="e.g. Nova York, Geral, Filadélfia"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Título da Dica</label>
                  <input
                    type="text"
                    value={tipTitle}
                    onChange={(e) => setTipTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden font-extrabold text-slate-800 focus:ring-1 focus:ring-amber-500"
                    placeholder="e.g. 🚇 Funcionamento do Metrô (24h)"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Conteúdo Detalhado</label>
                  <textarea
                    value={tipContent}
                    onChange={(e) => setTipContent(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden font-medium text-slate-700 focus:ring-1 focus:ring-amber-500 resize-none"
                    placeholder="Escreva de forma amigável as informações detalhadas da dica..."
                    required
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-3.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddingTip(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-all shadow-md cursor-pointer"
                  >
                    Salvar Dica
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EDIT TIP MODAL */}
      <AnimatePresence>
        {editingTip && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                    <Pencil className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">Editar Dica Caderneta</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Modificar parâmetros e informações úteis</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingTip(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-black p-1 hover:bg-slate-100 rounded-lg px-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={submitEditTip} className="space-y-4 text-xs font-medium text-slate-700">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Cidade / Categoria do Alinhamento</label>
                  <input
                    type="text"
                    value={tipCategory}
                    onChange={(e) => setTipCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden font-bold text-slate-800 focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Título da Dica</label>
                  <input
                    type="text"
                    value={tipTitle}
                    onChange={(e) => setTipTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden font-extrabold text-slate-800 focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Conteúdo Detalhado</label>
                  <textarea
                    value={tipContent}
                    onChange={(e) => setTipContent(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden font-medium text-slate-700 focus:ring-1 focus:ring-amber-500 resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-3.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingTip(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-all shadow-md cursor-pointer"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
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
