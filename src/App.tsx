import React, { useState, useEffect, useRef } from "react";
import { 
  Compass, 
  MapPin, 
  DollarSign, 
  FileText, 
  Calendar as CalendarIcon, 
  Users,
  Bell,
  Wifi,
  WifiOff,
  Sparkles,
  Info,
  MessageCircle,
  Settings,
  ShieldCheck,
  Key
} from "lucide-react";
import { 
  Traveler, 
  CostItem, 
  Destination, 
  FlightInfo, 
  GeneralTip, 
  NotificationAlert, 
  TravelDocument,
  Activity,
  ItineraryDay,
  CostCategory
} from "./types";
import { 
  INITIAL_TRAVELERS, 
  INITIAL_FLIGHTS, 
  INITIAL_COSTS, 
  INITIAL_COST_CATEGORIES,
  INITIAL_TIPS, 
  INITIAL_DESTINATIONS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_DOCUMENTS 
} from "./data/defaultData";
import { getCanonicalDateKey, parseRangeToDates } from "./utils";
import { motion, AnimatePresence } from "motion/react";
import { useActivityNotifications } from "./hooks/useActivityNotifications";

import Header from "./components/Header";
import OverviewTab from "./components/OverviewTab";
import ItineraryTab from "./components/ItineraryTab";
import CostsTab from "./components/CostsTab";
import DocumentsTab from "./components/DocumentsTab";
import CalendarTab from "./components/CalendarTab";
import SettingsTab from "./components/SettingsTab";
import ChatTab from "./components/ChatTab";
import LoginScreen from "./components/LoginScreen";
import AdminDashboard from "./components/AdminDashboard";
import FirstAccessOnboarding from "./components/FirstAccessOnboarding";
import PWAInstallBanner from "./components/PWAInstallBanner";
import ReferralModal from "./components/ReferralModal";
import CheckoutModal from "./components/CheckoutModal";
import KedIAGuideModal from "./components/KedIAGuideModal";
import { usePlanAccess } from "./hooks/usePlanAccess";
import { getAiHeaders } from "./utils/geminiClient";
import TrialBanner from "./components/TrialBanner";
import TrialExpiredModal from "./components/TrialExpiredModal";

const getCleanSlatePayload = (user?: any) => {
  const destId = `dest-${Math.random().toString(36).substring(7)}`;
  const dayId = `day-${Math.random().toString(36).substring(7)}`;
  const userName = user?.name || (user?.email ? user.email.split("@")[0] : "Organizador");
  const userEmail = user?.email || "";
  return {
    destinations: [
      {
        id: destId,
        city: "Nova Parada",
        state: "Estado",
        country: "País",
        dates: "01 jul. - 05 jul.",
        startDate: "2026-07-01",
        endDate: "2026-07-05",
        decorTheme: "amber",
        hotelName: "Hotel a Definir",
        hotelAddress: "Endereço do Hotel",
        checkInTime: "15:00",
        checkOutTime: "11:00",
        days: [
          {
            id: dayId,
            dayNumber: 1,
            dateStr: "Quarta, 01 de Julho",
            title: "Chegada",
            activities: []
          }
        ]
      }
    ],
    costs: [],
    costCategories: INITIAL_COST_CATEGORIES,
    travelers: [
      { 
        id: `t-${Math.random().toString(36).substring(7)}`, 
        name: userName, 
        role: "Organizador", 
        email: userEmail,
        createdByEmail: userEmail
      }
    ],
    documents: [],
    flights: [],
    generalTips: [],
    notifications: [],
    transactionLogs: []
  };
};

function safeSetLocalStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`[safeSetLocalStorage] Failed to save key "${key}" to localStorage due to quota or other error. Trying to sanitize...`, error);
    try {
      const parsed = JSON.parse(value);
      
      const sanitize = (obj: any): any => {
        if (obj === null || typeof obj !== 'object') {
          return obj;
        }
        if (Array.isArray(obj)) {
          return obj.map(sanitize);
        }
        
        const copy: any = {};
        for (const k in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, k)) {
            const val = obj[k];
            if (
              (k === 'ticketFileData' || k === 'fileData' || k.toLowerCase().endsWith('data')) && 
              typeof val === 'string' && 
              val.length > 500
            ) {
              copy[k] = "(large_preview_hidden_in_local_storage)";
            } else {
              copy[k] = sanitize(val);
            }
          }
        }
        return copy;
      };

      const sanitizedObj = sanitize(parsed);
      const sanitizedValue = JSON.stringify(sanitizedObj);
      
      try {
        localStorage.setItem(key, sanitizedValue);
        console.log(`[safeSetLocalStorage] Successfully saved sanitized version of "${key}"!`);
      } catch (err2) {
        console.error(`[safeSetLocalStorage] Critical: Failed to save even sanitized "${key}" to localStorage:`, err2);
      }
    } catch (parseError) {
      console.error(`[safeSetLocalStorage] Failed to parse value for key "${key}" or sanitize it:`, parseError);
    }
  }
}

export default function App() {
  // Auth state
  const [token, setToken] = useState<string | null>(localStorage.getItem("auth_token"));
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isTravelerMode, setIsTravelerMode] = useState<boolean>(() => {
    return localStorage.getItem("auth_is_traveler") === "true";
  });
  const [travelerEmail, setTravelerEmail] = useState<string | null>(() => {
    return localStorage.getItem("auth_traveler_email");
  });
  const [isFetchingCloud, setIsFetchingCloud] = useState<boolean>(false);
  const [hasLoadedCloud, setHasLoadedCloud] = useState<boolean>(() => {
    const isOfflineMode = localStorage.getItem("meu_agente_offline_mode") === "true";
    return !localStorage.getItem("auth_token") || isOfflineMode;
  });
  
  const lastValidatedEmailRef = useRef<string | null>(null);
  
  const [showTravelerPasswordPrompt, setShowTravelerPasswordPrompt] = useState(false);
  const [travelerNewPassword, setTravelerNewPassword] = useState("");
  const [travelerPasswordMsg, setTravelerPasswordMsg] = useState("");
  const [travelerPasswordError, setTravelerPasswordError] = useState(false);

  // KedGo! Modal States
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showKedIAGuideModal, setShowKedIAGuideModal] = useState(false);
  const [userPlan, setUserPlan] = useState<'starter' | 'pass' | 'pro_lifetime'>('starter');
  const [showTrialExpiredModal, setShowTrialExpiredModal] = useState(false);
  const [blockedFeatureName, setBlockedFeatureName] = useState("esta funcionalidade");

  // Capture referral code from URL parameter (?ref=..., ?cupom=..., ?promo=...) or pathname (/ref/...)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      let refCode = urlParams.get("ref") || urlParams.get("refCode") || urlParams.get("cupom") || urlParams.get("coupon") || urlParams.get("promo");
      if (!refCode) {
        const pathParts = window.location.pathname.split("/");
        if (pathParts.length >= 3 && pathParts[1].toLowerCase() === "ref") {
          refCode = pathParts[2];
        }
      }
      if (refCode && refCode.trim()) {
        localStorage.setItem("kedgo_referral_code", refCode.trim().toUpperCase());
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  // Handle Stripe Checkout return (?checkout=success&session_id=...)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const checkoutStatus = urlParams.get("checkout");
      const sessionId = urlParams.get("session_id");

      if (checkoutStatus === "success" && sessionId && token) {
        fetch(`/api/stripe/verify-session/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
          if (data.paid) {
            const grantedPlan = data.planType || "pro_lifetime";
            setUserPlan(grantedPlan);
            alert(`🎉 Pagamento confirmado pela Stripe com sucesso! Seu plano foi atualizado para ${grantedPlan === 'pro_lifetime' ? 'KedGo! Pro Vitalício' : 'Passe KedGo!'}.`);
          }
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch(err => {
          console.error("Error verifying Stripe payment session:", err);
        });
      } else if (checkoutStatus === "cancel") {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch {
      // Ignore
    }
  }, [token]);

  // Validate token on mount
  useEffect(() => {
    if (token) {
      if (token === "traveler-session") {
        if (travelerEmail) {
          setCurrentUser({ email: travelerEmail, name: travelerEmail.split("@")[0], isTraveler: true });
        }
        return;
      }
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setCurrentUser(data.user);
          if (data.user.isLifetimePro || data.user.planType === 'pro_lifetime') {
            setUserPlan('pro_lifetime');
          } else if (data.user.planType === 'pass') {
            setUserPlan('pass');
          } else {
            setUserPlan('starter');
          }
        } else {
          setToken(null);
          localStorage.removeItem("auth_token");
        }
      })
      .catch(() => {
        setToken(null);
        localStorage.removeItem("auth_token");
      });
    }
  }, [token, travelerEmail]);

  // Check traveler password prompt checking clean and separate
  useEffect(() => {
    const emailToCheck = travelerEmail || (isTravelerMode && currentUser?.email);
    if (emailToCheck) {
      const normalizedEmail = emailToCheck.trim().toLowerCase();
      if (lastValidatedEmailRef.current === normalizedEmail) {
        return; // Prevent duplicate checks for the same email
      }
      lastValidatedEmailRef.current = normalizedEmail;
      fetch("/api/traveler/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToCheck })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Popup de redefinir senha não é mais forçado para o viajante.
          // if (!data.hasPassword || data.isFirstAccess) {
          //   setShowTravelerPasswordPrompt(true);
          // }
        }
      })
      .catch(err => {
        console.warn("Traveling user credentials check deferred (offline or server initializing):", err);
        // Clear on error so it can retry if needed
        if (lastValidatedEmailRef.current === normalizedEmail) {
          lastValidatedEmailRef.current = null;
        }
      });
    }
  }, [travelerEmail, isTravelerMode, currentUser]);

  const handleLogin = (newToken: string, user: any) => {
    localStorage.setItem("auth_token", newToken);
    localStorage.removeItem("auth_is_traveler");
    localStorage.removeItem("auth_traveler_email");
    lastValidatedEmailRef.current = null;
    setToken(newToken);
    setCurrentUser(user);
    setIsTravelerMode(false);
    setTravelerEmail(null);
  };

  const handleTravelerLogin = (email: string, linkedItineraries: any[], hasPassword?: boolean, isFirstAccess?: boolean) => {
    localStorage.setItem("auth_token", "traveler-session");
    localStorage.setItem("auth_is_traveler", "true");
    localStorage.setItem("auth_traveler_email", email);
    const normalizedEmail = email.trim().toLowerCase();
    lastValidatedEmailRef.current = normalizedEmail;
    setToken("traveler-session");
    setIsTravelerMode(true);
    setTravelerEmail(email);
    setCurrentUser({ email, name: email.split("@")[0], isTraveler: true });
    
    // First time access check
    const promptKey = `traveler_pw_prompt_${email}`;
    if (hasPassword === false || isFirstAccess === true || !localStorage.getItem(promptKey)) {
      // setShowTravelerPasswordPrompt(true); // Removido para não forçar popup
      localStorage.setItem(promptKey, "true");
    }
    
    if (linkedItineraries && linkedItineraries.length > 0) {
      setItineraries(linkedItineraries);
      setActiveItineraryId(linkedItineraries[0].id);
      localStorage.setItem("meu_agente_active_itinerary_id", String(linkedItineraries[0].id));
      
      const nextData = linkedItineraries[0].data;
      if (nextData) {
        setDestinations(nextData.destinations || []);
        setCosts(nextData.costs || []);
        if (nextData.costCategories && nextData.costCategories.length > 0) {
          setCostCategories(nextData.costCategories);
        } else {
          setCostCategories(INITIAL_COST_CATEGORIES);
        }
        setDocuments(nextData.documents || []);
        setFlights(nextData.flights || []);
        setGeneralTips(nextData.generalTips || []);
        setTravelers(nextData.travelers || []);
        setNotifications(nextData.notifications || []);
        setTransactionLogs(nextData.transactionLogs || []);

        // Pick first destination id safely
        if (nextData.destinations && nextData.destinations.length > 0) {
          setSelectedDestinationId(nextData.destinations[0].id);
        }
      }
    } else {
      setItineraries([]);
      setActiveItineraryId(null);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    setIsTravelerMode(false);
    setTravelerEmail(null);
    lastValidatedEmailRef.current = null;
    setItineraries([]);
    setActiveItineraryId(null);
    setDestinations([]);
    setCosts([]);
    setTravelers([]);
    setDocuments([]);
    setFlights([]);
    setGeneralTips([]);
    setNotifications([]);
    setSelectedDestinationId("");

    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_is_traveler");
    localStorage.removeItem("auth_traveler_email");
    localStorage.removeItem("meu_agente_active_itinerary_id");
    localStorage.removeItem("meu_agente_itineraries_list");
  };

  // Primary Navigation State
  const [activeTab, setActiveTab] = useState("overview"); // overview | itinerary | costs | documents | calendar
  
  // Connection state (Offline Mode)
  const [isOffline, setIsOffline] = useState(() => {
    const saved = localStorage.getItem("meu_agente_offline_mode");
    if (saved !== null) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return typeof navigator !== "undefined" && !navigator.onLine;
  });

  // Auto-detect browser network online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log("[KEDGO] Conexão com a internet detectada.");
      const manualOffline = localStorage.getItem("meu_agente_offline_mode") === "true";
      if (!manualOffline) {
        setIsOffline(false);
      }
    };

    const handleOffline = () => {
      console.log("[KEDGO] Conexão perdida. Ativando Modo Offline automaticamente.");
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check on mount: if browser is currently offline, set isOffline
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOffline(true);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const isOfflineMode = localStorage.getItem("meu_agente_offline_mode") === "true" || isOffline;
    if (token && !isOfflineMode) {
      setHasLoadedCloud(false);
    } else {
      setHasLoadedCloud(true);
    }
  }, [token, isOffline]);

  // --- ITINERARIES / VIAGENS MANAGEMENT ---
  const [itineraries, setItineraries] = useState<{ id: string | number; title: string; data?: any; ecoMode?: boolean }[]>(() => {
    const saved = localStorage.getItem("meu_agente_itineraries_list");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const planAccess = usePlanAccess(currentUser, userPlan, itineraries.length);

  const [activeItineraryId, setActiveItineraryId] = useState<string | number | null>(() => {
    const saved = localStorage.getItem("meu_agente_active_itinerary_id");
    return saved ? saved : null;
  });

  const [favoriteItineraryId, setFavoriteItineraryId] = useState<string | number | null>(() => {
    const saved = localStorage.getItem("meu_agente_favorite_itinerary_id");
    return saved ? saved : null;
  });

  const lastLoadedItineraryIdRef = useRef<string | number | null>(activeItineraryId);

  // Database states with LocalStorage persistence of trip parameters
  const [travelers, setTravelers] = useState<Traveler[]>(() => {
    const activeDataSaved = localStorage.getItem(`meu_agente_itinerary_data_${activeItineraryId}`);
    if (activeDataSaved) {
      try {
        const payload = JSON.parse(activeDataSaved);
        if (payload.travelers) return payload.travelers;
      } catch (e) {}
    }
    if (activeItineraryId === "default") {
      const saved = localStorage.getItem("meu_agente_travelers");
      return saved ? JSON.parse(saved) : INITIAL_TRAVELERS;
    }
    return getCleanSlatePayload().travelers;
  });

  // Ensure logged-in user is automatically registered as the primary traveler (Organizador) with Name & Email
  useEffect(() => {
    if (!currentUser?.email) return;
    const userEmail = currentUser.email.trim().toLowerCase();
    const userName = currentUser.name || userEmail.split("@")[0] || "Organizador";

    if (travelers.length === 0) {
      setTravelers([
        {
          id: `t-${Math.random().toString(36).substring(7)}`,
          name: userName,
          email: currentUser.email,
          role: "Organizador",
          checkedActivities: "[]",
          packingItems: "[]",
          createdByEmail: currentUser.email
        }
      ]);
    } else {
      // If travelers exists but none match the currentUser email or if the first traveler is default "Você" with empty email, populate it
      const hasCurrentUser = travelers.some(t => t.email?.trim().toLowerCase() === userEmail);
      if (!hasCurrentUser) {
        // Check if there's a placeholder traveler ("Você" or empty email)
        const hasPlaceholder = travelers.some(t => !t.email || t.email.trim() === "" || t.name === "Você");
        if (hasPlaceholder) {
          setTravelers(prev => prev.map(t => {
            if (!t.email || t.email.trim() === "" || t.name === "Você") {
              return {
                ...t,
                name: t.name === "Você" ? userName : t.name,
                email: currentUser.email,
                role: t.role || "Organizador",
                createdByEmail: currentUser.email
              };
            }
            return t;
          }));
        } else {
          // Append user as Organizador
          setTravelers(prev => [
            {
              id: `t-${Math.random().toString(36).substring(7)}`,
              name: userName,
              email: currentUser.email,
              role: "Organizador",
              checkedActivities: "[]",
              packingItems: "[]",
              createdByEmail: currentUser.email
            },
            ...prev
          ]);
        }
      }
    }
  }, [currentUser, travelers]);

  const [destinations, setDestinations] = useState<Destination[]>(() => {
    const activeDataSaved = localStorage.getItem(`meu_agente_itinerary_data_${activeItineraryId}`);
    if (activeDataSaved) {
      try {
        const payload = JSON.parse(activeDataSaved);
        if (payload.destinations) return payload.destinations;
      } catch (e) {}
    }
    if (activeItineraryId === "default") {
      const saved = localStorage.getItem("meu_agente_destinations");
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as Destination[];
          const wash = parsed.find((d) => d.id === "d1");
          if (wash) {
            const hasArlington = wash.days.some((day) =>
              day.activities.some((act) => act.location.toLowerCase().includes("arlington") || act.id.includes("new"))
            );
            if (!hasArlington) {
              const initialWash = INITIAL_DESTINATIONS.find((d) => d.id === "d1");
              if (initialWash) {
                return parsed.map((dest) => (dest.id === "d1" ? initialWash : dest));
              }
            }
          }
          return parsed;
        } catch (e) {
          console.error("Erro ao analisar destinos salvos", e);
        }
      }
      return INITIAL_DESTINATIONS;
    }
    return getCleanSlatePayload().destinations;
  });

  const [costs, setCosts] = useState<CostItem[]>(() => {
    const activeDataSaved = localStorage.getItem(`meu_agente_itinerary_data_${activeItineraryId}`);
    if (activeDataSaved) {
      try {
        const payload = JSON.parse(activeDataSaved);
        if (payload.costs) return payload.costs;
      } catch (e) {}
    }
    if (activeItineraryId === "default") {
      const saved = localStorage.getItem("meu_agente_costs");
      return saved ? JSON.parse(saved) : INITIAL_COSTS;
    }
    return getCleanSlatePayload().costs;
  });

  const [costCategories, setCostCategories] = useState<CostCategory[]>(() => {
    const activeDataSaved = localStorage.getItem(`meu_agente_itinerary_data_${activeItineraryId}`);
    if (activeDataSaved) {
      try {
        const payload = JSON.parse(activeDataSaved);
        if (payload.costCategories) return payload.costCategories;
      } catch (e) {}
    }
    if (activeItineraryId === "default") {
      const saved = localStorage.getItem("meu_agente_cost_categories");
      return saved ? JSON.parse(saved) : INITIAL_COST_CATEGORIES;
    }
    return getCleanSlatePayload().costCategories;
  });

  const [documents, setDocuments] = useState<TravelDocument[]>(() => {
    const activeDataSaved = localStorage.getItem(`meu_agente_itinerary_data_${activeItineraryId}`);
    if (activeDataSaved) {
      try {
        const payload = JSON.parse(activeDataSaved);
        if (payload.documents) return payload.documents;
      } catch (e) {}
    }
    if (activeItineraryId === "default") {
      const saved = localStorage.getItem("meu_agente_documents");
      return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
    }
    return getCleanSlatePayload().documents;
  });

  const [notifications, setNotifications] = useState<NotificationAlert[]>(() => {
    const activeDataSaved = localStorage.getItem(`meu_agente_itinerary_data_${activeItineraryId}`);
    if (activeDataSaved) {
      try {
        const payload = JSON.parse(activeDataSaved);
        if (payload.notifications) return payload.notifications;
      } catch (e) {}
    }
    if (activeItineraryId === "default") {
      const saved = localStorage.getItem("meu_agente_notifications");
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    }
    return getCleanSlatePayload().notifications;
  });

  // Activity Notifications
  const { permission: notificationPermission, requestPermission: onRequestNotificationPermission } = useActivityNotifications(destinations);

  const [flights, setFlights] = useState<FlightInfo[]>(() => {
    const activeDataSaved = localStorage.getItem(`meu_agente_itinerary_data_${activeItineraryId}`);
    if (activeDataSaved) {
      try {
        const payload = JSON.parse(activeDataSaved);
        if (payload.flights) return payload.flights;
      } catch (e) {}
    }
    if (activeItineraryId === "default") {
      const saved = localStorage.getItem("meu_agente_flights");
      return saved ? JSON.parse(saved) : INITIAL_FLIGHTS;
    }
    return getCleanSlatePayload().flights;
  });

  const [generalTips, setGeneralTips] = useState<GeneralTip[]>(() => {
    const activeDataSaved = localStorage.getItem(`meu_agente_itinerary_data_${activeItineraryId}`);
    if (activeDataSaved) {
      try {
        const payload = JSON.parse(activeDataSaved);
        if (payload.generalTips) return payload.generalTips;
      } catch (e) {}
    }
    if (activeItineraryId === "default") {
      const saved = localStorage.getItem("meu_agente_general_tips");
      return saved ? JSON.parse(saved) : INITIAL_TIPS;
    }
    return getCleanSlatePayload().generalTips;
  });

  const [transactionLogs, setTransactionLogs] = useState<any[]>(() => {
    const activeDataSaved = localStorage.getItem(`meu_agente_itinerary_data_${activeItineraryId}`);
    if (activeDataSaved) {
      try {
        const payload = JSON.parse(activeDataSaved);
        if (payload.transactionLogs) return payload.transactionLogs;
      } catch (e) {}
    }
    return [];
  });

  // Secondary sub-navigation state
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>(() => {
    const activeDataSaved = localStorage.getItem(`meu_agente_itinerary_data_${activeItineraryId}`);
    if (activeDataSaved) {
      try {
        const payload = JSON.parse(activeDataSaved);
        if (payload.destinations && payload.destinations.length > 0) {
          return payload.destinations[0].id;
        }
      } catch (e) {}
    }
    if (activeItineraryId === "default") {
      return INITIAL_DESTINATIONS[0].id;
    }
    return getCleanSlatePayload().destinations[0].id;
  });

  // Global background chat message listener for push alerts
  const [chatToasts, setChatToasts] = useState<any[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);
  const lastCheckedChatTimestampRef = useRef<string | null>(null);
  const notifiedMessageIdsRef = useRef<Set<string>>(new Set());
  const hasNotifiedPrivateMsgRef = useRef<boolean>(false);

  // Reset chat tracking correctly when itinerary changes
  useEffect(() => {
    lastCheckedChatTimestampRef.current = null;
    notifiedMessageIdsRef.current.clear();
    hasNotifiedPrivateMsgRef.current = false;
  }, [activeItineraryId]);

  useEffect(() => {
    if (!activeItineraryId || isOffline) return;
    if (typeof activeItineraryId === "string" && activeItineraryId.startsWith("local-")) return;

    const checkNewMessages = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) return;

        let chatUserName = currentUser?.name || currentUser?.email || "Você";
        if (currentUser?.email) {
          const matched = travelers.find(t => t.email?.toLowerCase().trim() === currentUser.email.toLowerCase().trim());
          if (matched && matched.name) chatUserName = matched.name;
        }

        const sinceParam = lastCheckedChatTimestampRef.current ? `?since=${encodeURIComponent(lastCheckedChatTimestampRef.current)}` : '';
        const url = `/api/messages/${encodeURIComponent(activeItineraryId)}${sinceParam}`;

        const res = await fetch(url, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
          const text = await res.text();
          let data: any = [];
          try {
            data = JSON.parse(text);
          } catch (jsonErr) {
            console.warn("Background chat poll received non-JSON response:", text.substring(0, 50));
            return;
          }
          if (data && typeof data === "object" && !Array.isArray(data)) {
            data = data.messages || [];
          }

          if (Array.isArray(data) && data.length > 0) {
            const isInitial = !lastCheckedChatTimestampRef.current;
            lastCheckedChatTimestampRef.current = data[data.length - 1].timestamp;

            // Se for o carregamento inicial, marcar todas as mensagens existentes como já notificadas
            // para que nunca disparem pop-ups indesejados ao recarregar a página ou mudar de aba.
            if (isInitial) {
              data.forEach((msg: any) => {
                if (msg.id) {
                  notifiedMessageIdsRef.current.add(msg.id);
                }
              });
            }

            // Handle unreadCount calculation
            if (activeTab === "chat") {
              localStorage.setItem(`last_read_chat_timestamp_${activeItineraryId}`, data[data.length - 1].timestamp);
              setUnreadChatCount(0);
            } else {
              const lastRead = localStorage.getItem(`last_read_chat_timestamp_${activeItineraryId}`);
              const filteredUnread = data.filter((msg: any) => {
                const senderLower = (msg.senderName || "").trim().toLowerCase();
                const currentLower = (chatUserName || "").trim().toLowerCase();
                const isSentByMe = senderLower === currentLower || msg.senderName === currentUser?.name;
                if (isSentByMe) return false;

                const recipientLower = (msg.recipientName || "").trim().toLowerCase();
                const isGroup = !msg.recipientName || msg.recipientName === "Todos";
                const isPrivateForMe = recipientLower === currentLower || (currentUser?.email && recipientLower === (currentUser?.email || "").trim().toLowerCase());
                if (!isGroup && !isPrivateForMe) return false;

                if (!lastRead) return true;
                return new Date(msg.timestamp).getTime() > new Date(lastRead).getTime();
              });

              if (lastRead) {
                if (isInitial) {
                  setUnreadChatCount(filteredUnread.length);
                } else {
                  setUnreadChatCount(prev => prev + filteredUnread.length);
                }
              } else {
                localStorage.setItem(`last_read_chat_timestamp_${activeItineraryId}`, data[data.length - 1].timestamp);
                setUnreadChatCount(0);
              }
            }

            if (!isInitial) {
              // We have actual new messages arriving in real-time in background!
              data.forEach((msg: any) => {
                const senderLower = (msg.senderName || "").trim().toLowerCase();
                const currentLower = (chatUserName || "").trim().toLowerCase();
                const userEmailLower = (currentUser?.email || "").trim().toLowerCase();

                // Only notify if sent by someone else
                if (senderLower !== currentLower && msg.senderName !== currentUser?.name) {
                  // Prevent session duplication
                  if (notifiedMessageIdsRef.current.has(msg.id)) return;
                  
                  const recipientLower = (msg.recipientName || "").trim().toLowerCase();
                  const isGroup = !msg.recipientName || msg.recipientName === "Todos";
                  const isPrivateForMe = recipientLower === currentLower || (currentUser?.email && recipientLower === userEmailLower);

                  if (isGroup || isPrivateForMe) {
                    // Limit private messages to only 1 popup/toast until tab opens
                    if (!isGroup) {
                      if (hasNotifiedPrivateMsgRef.current) return;
                      hasNotifiedPrivateMsgRef.current = true;
                    }
                    
                    notifiedMessageIdsRef.current.add(msg.id);

                    // 1. Dispatch standard slide-up OS push notification if supported
                    const isHidden = document.hidden;
                    if (activeTab !== "chat" || isHidden) {
                      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                        try {
                          new Notification(
                            isGroup ? `Mensagem no Grupo de ${msg.senderName}` : `Mensagem Privada de ${msg.senderName}`,
                            { body: msg.content || "Enviou uma mídia no grupo.", tag: msg.id }
                          );
                        } catch (e) {
                          console.warn("Could not dispatch standard browser Notification:", e);
                        }
                      }
                      
                      // 2. Schedule in-app Toast banner if the user is NOT actively looking at "chat" tab!
                      if (!isHidden) {
                        const newToast = {
                          id: msg.id || `toast-${Date.now()}-${Math.random()}`,
                          senderName: msg.senderName,
                          content: msg.content || "Anexo/Mídia",
                          isPrivate: !isGroup
                        };
                        setChatToasts(prev => [...prev.filter(t => t.id !== newToast.id), newToast]);
                        setTimeout(() => {
                          setChatToasts(prev => prev.filter(t => t.id !== newToast.id));
                        }, 4500);
                      }
                    }
                  }
                }
              });
            }
          }
        }
      } catch (err: any) {
        const isNetworkError = err?.message && (
          err.message.includes("Failed to fetch") || 
          err.message.includes("network error") || 
          err.message.includes("NetworkError") || 
          err.message.includes("abort")
        );
        if (isNetworkError) {
          console.warn("Background chat poll temporarily unavailable (transient network/server restart):", err.message);
        } else {
          console.error("Background error reading group messages:", err);
        }
      }
    };

    // Run check immediately on mount, then poll every 4s
    checkNewMessages();
    const chatPollInterval = setInterval(checkNewMessages, 4000);
    return () => clearInterval(chatPollInterval);
  }, [activeItineraryId, activeTab, isOffline, currentUser, travelers]);

  // Clear unread chat messages when switching to chat tab
  useEffect(() => {
    if (activeTab === "chat" && activeItineraryId) {
      setUnreadChatCount(0);
      hasNotifiedPrivateMsgRef.current = false;
      if (lastCheckedChatTimestampRef.current) {
        localStorage.setItem(`last_read_chat_timestamp_${activeItineraryId}`, lastCheckedChatTimestampRef.current);
      }
    }
  }, [activeTab, activeItineraryId]);

  // Helper to construct current complete state package
  const getCurrentStatePayload = () => {
    return {
      destinations,
      costs,
      costCategories: costCategories && costCategories.length > 0 ? costCategories : INITIAL_COST_CATEGORIES,
      travelers,
      documents,
      flights,
      generalTips,
      notifications,
      transactionLogs
    };
  };

  // Synchronize pending offline changes to server
  const syncPendingOfflineChanges = async () => {
    const hasPending = localStorage.getItem("kedgo_has_pending_offline_sync") === "true";
    const pendingItId = localStorage.getItem("kedgo_pending_sync_itinerary_id") || activeItineraryId;
    if (hasPending && pendingItId && token && !isOffline) {
      try {
        const payload = getCurrentStatePayload();
        const titleVal = itineraries.find(it => String(it.id) === String(pendingItId))?.title || "Minha Viagem";
        const res = await fetch(`/api/itineraries/${encodeURIComponent(pendingItId)}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            title: titleVal,
            data: payload
          })
        });
        if (res.ok) {
          localStorage.removeItem("kedgo_has_pending_offline_sync");
          localStorage.removeItem("kedgo_pending_sync_itinerary_id");
          console.log("[KEDGO] Alterações offline sincronizadas com sucesso com o servidor!");
          return true;
        }
      } catch (e) {
        console.warn("[KEDGO] Falha ao sincronizar alterações offline:", e);
      }
    }
    return false;
  };

  // Sync with server on token/login or online status
  useEffect(() => {
    if (isOffline || !token) return;

    const fetchCloudData = async () => {
      // If there are pending local changes from offline session, sync them to cloud first
      const hasPendingSync = localStorage.getItem("kedgo_has_pending_offline_sync") === "true";
      if (hasPendingSync) {
        const didSync = await syncPendingOfflineChanges();
        if (didSync) {
          setIsFetchingCloud(false);
          setHasLoadedCloud(true);
          return;
        }
      }

      setIsFetchingCloud(true);
      try {
        let endpoint = '/api/itineraries';
        let customHeaders: any = { "Authorization": `Bearer ${token}` };
        let customMethod = "GET";
        let customBody: any = null;

        if (isTravelerMode || token === "traveler-session") {
          endpoint = '/api/traveler/validate';
          customHeaders = { "Content-Type": "application/json" };
          customMethod = "POST";
          customBody = JSON.stringify({ email: travelerEmail });
        }

        const fetchOptions: any = {
          method: customMethod,
          headers: customHeaders
        };
        if (customMethod !== "GET") {
          fetchOptions.body = customBody;
        }

        const response = await fetch(endpoint, fetchOptions);
        
        if (!response.ok) return;
        const respData = await response.json();
        
        const dataArray = Array.isArray(respData) ? respData : (respData.itineraries || []);
        const userFavoriteItineraryId = respData.favoriteItineraryId;

        if (Array.isArray(dataArray)) {
          if (dataArray.length > 0) {
            const formatted = dataArray.map((it: any) => ({
              id: it.id,
              ownerId: it.ownerId,
              title: it.title,
              data: it.data
            }));
            setItineraries(formatted);

            // Find which one to make active
            let matched = undefined;
            if (userFavoriteItineraryId) {
              setFavoriteItineraryId(userFavoriteItineraryId);
              localStorage.setItem("meu_agente_favorite_itinerary_id", String(userFavoriteItineraryId));
              matched = formatted.find(it => String(it.id) === String(userFavoriteItineraryId));
            }

            if (!matched) {
              const savedActiveIdStr = localStorage.getItem("meu_agente_active_itinerary_id");
              const savedActiveId = savedActiveIdStr ? (isNaN(Number(savedActiveIdStr)) ? savedActiveIdStr : Number(savedActiveIdStr)) : null;
              matched = formatted.find(it => String(it.id) === String(savedActiveId));
            }
            
            if (!matched) {
              matched = formatted[0];
            }

            setActiveItineraryId(matched.id);
            localStorage.setItem("meu_agente_active_itinerary_id", String(matched.id));

            // Automatically toggle isTravelerMode based on session type
            const isOwner = currentUser && matched.ownerId === currentUser.id;
            const updatedIsTravelerMode = token === "traveler-session";
            
            if (isTravelerMode !== updatedIsTravelerMode) {
              setIsTravelerMode(updatedIsTravelerMode);
              localStorage.setItem("auth_is_traveler", updatedIsTravelerMode ? "true" : "false");
            }
            if (updatedIsTravelerMode && currentUser?.email && !travelerEmail) {
              setTravelerEmail(currentUser.email);
              localStorage.setItem("auth_traveler_email", currentUser.email);
            }

            const cloudItinerary = matched.data || {};
            if (cloudItinerary.destinations) setDestinations(cloudItinerary.destinations);
            if (cloudItinerary.costs) setCosts(cloudItinerary.costs);
            if (cloudItinerary.costCategories) setCostCategories(cloudItinerary.costCategories);
            if (cloudItinerary.documents) setDocuments(cloudItinerary.documents);
            if (cloudItinerary.flights) setFlights(cloudItinerary.flights);
            if (cloudItinerary.generalTips) setGeneralTips(cloudItinerary.generalTips);
            if (cloudItinerary.travelers) setTravelers(cloudItinerary.travelers);
            if (cloudItinerary.notifications) setNotifications(cloudItinerary.notifications);
            if (cloudItinerary.transactionLogs) setTransactionLogs(cloudItinerary.transactionLogs);

            if (cloudItinerary.destinations && cloudItinerary.destinations.length > 0) {
              setSelectedDestinationId(cloudItinerary.destinations[0].id);
            }
          } else {
            // Newly logged-in user without any cloud itineraries.
            setItineraries([]);
            setActiveItineraryId(null);
            
            setDestinations([]);
            setCosts([]);
            setDocuments([]);
            setFlights([]);
            setGeneralTips([]);
            setTravelers([]);
            setNotifications([]);
            setTransactionLogs([]);
            setSelectedDestinationId("");
            localStorage.setItem("meu_agente_itineraries_list", "[]");
            localStorage.removeItem("meu_agente_active_itinerary_id");
          }
        }
        setHasLoadedCloud(true);
      } catch (err) {
        console.error("Erro ao puxar dados da nuvem:", err);
      } finally {
        setIsFetchingCloud(false);
        setHasLoadedCloud(true);
      }
    };
    
    if (!isOffline && token) {
      if ((isTravelerMode || token === "traveler-session") && !travelerEmail) {
        // Can't fetch for traveler without email loaded yet
        return;
      }
      fetchCloudData();
    }
  }, [token, travelerEmail, isTravelerMode, isOffline]);

  // Sort destinations chronologically whenever they are updated
  useEffect(() => {
    if (!destinations || destinations.length <= 1) return;

    const getDestinationStartDate = (d: Destination) => {
      if (d.startDate) return d.startDate;
      if (d.checkInDate) return d.checkInDate.split('T')[0];
      
      const dStr = d.dates || "";
      const matchDate = dStr.match(/(\d+)\s*[/]\s*(\d+)/);
      if (matchDate) {
        return `2026-${matchDate[2].padStart(2, '0')}-${matchDate[1].padStart(2, '0')}`;
      }
      
      const matchMonth = dStr.match(/(\d+)\s*[a-zçáõ]+/i);
      if (matchMonth) {
        const m = matchMonth[0].toLowerCase();
        const map: any = { jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6, jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12 };
        let monthIdx = 7;
        for (let key in map) if (m.includes(key)) monthIdx = map[key];
        return `2026-${String(monthIdx).padStart(2, '0')}-${matchMonth[1].padStart(2, '0')}`;
      }
      
      const parsed = parseRangeToDates(dStr);
      if (parsed.startDate === "2026-07-01" && !dStr.includes("jul")) {
        return dStr;
      }
      return parsed.startDate;
    };

    let needsSorting = false;
    for (let i = 0; i < destinations.length - 1; i++) {
      if (getDestinationStartDate(destinations[i]).localeCompare(getDestinationStartDate(destinations[i+1])) > 0) {
        needsSorting = true;
        break;
      }
    }

    if (needsSorting) {
      setDestinations((prev) => {
        return [...prev].sort((a, b) => {
          const dateA = getDestinationStartDate(a);
          const dateB = getDestinationStartDate(b);
          return dateA.localeCompare(dateB);
        });
      });
    }
  }, [destinations]);

  // Sync to localStore
  useEffect(() => {
    safeSetLocalStorage("meu_agente_offline_mode", JSON.stringify(isOffline));
  }, [isOffline]);

  useEffect(() => {
    safeSetLocalStorage("meu_agente_travelers", JSON.stringify(travelers));
  }, [travelers]);

  useEffect(() => {
    safeSetLocalStorage("meu_agente_destinations", JSON.stringify(destinations));
  }, [destinations]);

  useEffect(() => {
    safeSetLocalStorage("meu_agente_costs", JSON.stringify(costs));
  }, [costs]);

  useEffect(() => {
    safeSetLocalStorage("meu_agente_cost_categories", JSON.stringify(costCategories));
  }, [costCategories]);

  useEffect(() => {
    safeSetLocalStorage("meu_agente_documents", JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    safeSetLocalStorage("meu_agente_notifications", JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    safeSetLocalStorage("meu_agente_flights", JSON.stringify(flights));
  }, [flights]);

  useEffect(() => {
    safeSetLocalStorage("meu_agente_general_tips", JSON.stringify(generalTips));
  }, [generalTips]);

  // ── Derived arrays: only active (non-deleted) items for the normal UI ──
  const activeTravelers = travelers.filter(t => !t.isDeleted);
  const activeCosts = costs.filter(c => !c.isDeleted);
  const activeDestinations = destinations.filter(d => !d.isDeleted);
  const activeDocuments = documents.filter(d => !d.isDeleted);
  // flights already had soft-delete; keep same pattern
  const activeFlights = flights.filter(f => !f.isDeleted);

  const logTransaction = (action: "Adicionado" | "Alterado" | "Excluído", itemType: string, itemId: string, itemDesc: string) => {
    const date = new Date();
    const formattedDate = date.toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });

    const userEmail = currentUser?.email || "Visitante";
    const userName = currentUser?.name || "Visitante";
    const userDisplay = currentUser ? `${userName} (${userEmail})` : "Visitante";

    const newLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      user: userDisplay,
      userEmail,
      action,
      itemType,
      itemId,
      itemDesc,
      timestamp: formattedDate
    };

    setTransactionLogs((prev) => [newLog, ...prev]);
  };

  // Traveler Operations
  const handleAddTraveler = (name: string, email?: string, role?: string) => {
    const newId = `t-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const selectedRole = role || "Viajante";
    logTransaction("Adicionado", "Membro", newId, `${name} (${email || "Sem e-mail"}) [Cargo: ${selectedRole}]`);
    setTravelers((prev) => {
      const updated = [...prev, { id: newId, name, email, role: selectedRole, createdByEmail: currentUser?.email || "" }];
      const payload = {
        destinations,
        costs,
        travelers: updated,
        documents,
        flights,
        generalTips,
        notifications,
        transactionLogs: [
          {
            id: `log-${Date.now()}`,
            user: currentUser ? `${currentUser.name || currentUser.email} (${currentUser.email})` : "Visitante",
            userEmail: currentUser?.email || "Visitante",
            action: "Adicionado",
            itemType: "Membro",
            itemId: newId,
            itemDesc: `${name} (${email || "Sem e-mail"})`,
            timestamp: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
          },
          ...transactionLogs
        ]
      };
      saveCurrentItineraryToStore(activeItineraryId, payload);
      return updated;
    });
  };

  const handleRemoveTraveler = (id: string) => {
    const traveler = travelers.find((t) => t.id === id);
    const travelerName = traveler ? `${traveler.name} (${traveler.email || "Sem e-mail"})` : id;
    logTransaction("Excluído", "Membro", id, travelerName);
    setTravelers((prev) => {
      const updated = prev.map((t) => t.id === id ? { ...t, isDeleted: true } : t);
      const payload = {
        destinations,
        costs,
        travelers: updated,
        documents,
        flights,
        generalTips,
        notifications,
        transactionLogs: [
          {
            id: `log-${Date.now()}`,
            user: currentUser ? `${currentUser.name || currentUser.email} (${currentUser.email})` : "Visitante",
            userEmail: currentUser?.email || "Visitante",
            action: "Excluído",
            itemType: "Membro",
            itemId: id,
            itemDesc: travelerName,
            timestamp: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
          },
          ...transactionLogs
        ]
      };
      saveCurrentItineraryToStore(activeItineraryId, payload);
      return updated;
    });
  };

  const handleRestoreTraveler = (id: string) => {
    const traveler = travelers.find((t) => t.id === id);
    const travelerName = traveler ? `${traveler.name} (${traveler.email || "Sem e-mail"})` : id;
    logTransaction("Alterado", "Membro", id, `Restaurado: ${travelerName}`);
    setTravelers((prev) => {
      const updated = prev.map((t) => t.id === id ? { ...t, isDeleted: false } : t);
      const payload = {
        destinations,
        costs,
        travelers: updated,
        documents,
        flights,
        generalTips,
        notifications,
        transactionLogs
      };
      saveCurrentItineraryToStore(activeItineraryId, payload);
      return updated;
    });
  };


  const handleEditTraveler = (id: string, name: string, email?: string, role?: string) => {
    const desc = `${name} (${email || "Sem e-mail"}) [Cargo: ${role || "Viajante"}]`;
    logTransaction("Alterado", "Membro", id, desc);
    setTravelers((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, name, email, role: role || t.role || "Viajante" } : t));
      const payload = {
        destinations,
        costs,
        travelers: updated,
        documents,
        flights,
        generalTips,
        notifications,
        transactionLogs: [
          {
            id: `log-${Date.now()}`,
            user: currentUser ? `${currentUser.name || currentUser.email} (${currentUser.email})` : "Visitante",
            userEmail: currentUser?.email || "Visitante",
            action: "Alterado",
            itemType: "Membro",
            itemId: id,
            itemDesc: desc,
            timestamp: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
          },
          ...transactionLogs
        ]
      };
      saveCurrentItineraryToStore(activeItineraryId, payload);
      return updated;
    });
  };

  const handleUpdateTravelerChecklists = (travelerId: string, checkedActivities: string, packingItems: string) => {
    setTravelers((prev) => {
      let found = false;
      const cleanTargetId = String(travelerId).replace(/^t-/, "");

      let updated = prev.map((t) => {
        const cleanTId = String(t.id).replace(/^t-/, "");
        if (cleanTId === cleanTargetId || String(t.id) === String(travelerId)) {
          found = true;
          return { ...t, checkedActivities, packingItems };
        }
        return t;
      });

      if (!found) {
        if (prev.length === 0) {
          updated = [{
            id: travelerId || "t-organizer",
            name: currentUser?.name || "Você",
            role: "Organizador",
            email: currentUser?.email || "",
            checkedActivities,
            packingItems
          }];
        } else {
          const currentEmailNorm = currentUser?.email?.toLowerCase().trim();
          let emailIdx = currentEmailNorm ? prev.findIndex(t => t.email?.toLowerCase().trim() === currentEmailNorm) : -1;
          if (emailIdx === -1) emailIdx = 0;
          updated = prev.map((t, idx) => (idx === emailIdx ? { ...t, checkedActivities, packingItems } : t));
        }
      }

      const payload = {
        destinations,
        costs,
        costCategories,
        travelers: updated,
        documents,
        flights,
        generalTips,
        notifications,
        transactionLogs
      };
      if (activeItineraryId) {
        saveCurrentItineraryToStore(activeItineraryId, payload);
      }
      return updated;
    });
  };

  const handleUpdateFlight = (updatedFlight: FlightInfo) => {
    logTransaction("Alterado", "Voo", updatedFlight.id, `${updatedFlight.airline} (${updatedFlight.flightCode})`);
    setFlights((prev) => {
      const updated = prev.map((f) => (f.id === updatedFlight.id ? updatedFlight : f));
      const payload = {
        destinations,
        costs,
        costCategories,
        travelers,
        documents,
        flights: updated,
        generalTips,
        notifications,
        transactionLogs
      };
      saveCurrentItineraryToStore(activeItineraryId, payload);
      return updated;
    });
  };

  const handleAddDestination = (dest: Omit<Destination, "id" | "days">) => {
    const newId = `d-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    logTransaction("Adicionado", "Destino", newId, `${dest.city}, ${dest.state} (${dest.country})`);
    const newDest: Destination = { ...dest, id: newId, days: [], createdByEmail: currentUser?.email || "" };
    setDestinations((prev) => [...prev, newDest]);
    setSelectedDestinationId(newId);
  };

  const handleAddDay = (destId: string) => {
    const targetDest = destinations.find(d => d.id === destId);
    const destName = targetDest ? `${targetDest.city}, ${targetDest.state}` : destId;
    setDestinations((prev) =>
      prev.map((d) => {
        if (d.id !== destId) return d;
        const nextDayNum = d.days.length > 0 ? Math.max(...d.days.map(day => day.dayNumber)) + 1 : 1;
        const newDayId = `day-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        logTransaction("Adicionado", "Diária/Dia", newDayId, `Dia ${nextDayNum} em ${destName}`);
        const newDay = {
          id: newDayId,
          dayNumber: nextDayNum,
          dateStr: `Dia ${nextDayNum} (${d.dates.split(' - ')[0] || ''})`,
          title: "Novo Dia",
          activities: []
        };
        return { ...d, days: [...d.days, newDay] };
      })
    );
  };

  const handleEditDestination = (id: string, updatedDest: Omit<Destination, "id" | "days">) => {
    logTransaction("Alterado", "Destino", id, `${updatedDest.city}, ${updatedDest.state} (${updatedDest.country})`);
    setDestinations((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updatedDest } : d))
    );
  };

  const handleRemoveDestination = (id: string) => {
    const target = destinations.find(d => d.id === id);
    const desc = target ? `${target.city}, ${target.state} (${target.country})` : id;
    logTransaction("Excluído", "Destino", id, desc);
    setDestinations((prev) => {
      const updated = prev.map((d) => d.id === id ? { ...d, isDeleted: true } : d);
      const active = updated.filter(d => !d.isDeleted);
      if (selectedDestinationId === id && active.length > 0) {
        setSelectedDestinationId(active[0].id);
      } else if (active.length === 0) {
        setSelectedDestinationId("");
      }
      return updated;
    });
  };

  const handleRestoreDestination = (id: string) => {
    const target = destinations.find(d => d.id === id);
    const desc = target ? `${target.city}, ${target.state} (${target.country})` : id;
    logTransaction("Alterado", "Destino", id, `Restaurado: ${desc}`);
    setDestinations((prev) => {
      const updated = prev.map((d) => d.id === id ? { ...d, isDeleted: false } : d);
      return updated;
    });
  };


  const handleRateDestination = (destinationId: string, rating: number) => {
    const userKey = currentUser?.email?.toLowerCase().trim() || currentUser?.name || "anonymous";
    setDestinations((prev) => {
      const updated = prev.map((d) => {
        if (d.id === destinationId) {
          const currentRatings = d.ratings || {};
          const newRatings = { ...currentRatings, [userKey]: rating };
          return { ...d, ratings: newRatings };
        }
        return d;
      });

      const payload = {
        destinations: updated,
        costs,
        costCategories,
        travelers,
        documents,
        flights,
        generalTips,
        notifications,
        transactionLogs
      };
      if (activeItineraryId) {
        saveCurrentItineraryToStore(activeItineraryId, payload);
      }
      return updated;
    });
  };

  const handleAddFlight = (item: Omit<FlightInfo, "id">) => {
    const newId = `f-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    logTransaction("Adicionado", "Voo", newId, `${item.airline} ${item.flightCode}: ${item.departureCity} -> ${item.arrivalCity}`);
    setFlights((prev) => {
      const updated = [...prev, { ...item, id: newId, createdByEmail: currentUser?.email || "" }];
      const payload = {
        destinations,
        costs,
        costCategories,
        travelers,
        documents,
        flights: updated,
        generalTips,
        notifications,
        transactionLogs
      };
      saveCurrentItineraryToStore(activeItineraryId, payload);
      return updated;
    });
  };

  const handleRemoveFlight = (id: string) => {
    const target = flights.find(f => f.id === id);
    const desc = target ? `${target.airline} (${target.flightCode})` : id;
    logTransaction("Excluído", "Voo", id, desc);
    // Soft delete: mark as isDeleted instead of filtering out
    setFlights((prev) => {
      const updated = prev.map((f) => f.id === id ? { ...f, isDeleted: true } : f);
      const payload = {
        destinations,
        costs,
        costCategories,
        travelers,
        documents,
        flights: updated,
        generalTips,
        notifications,
        transactionLogs
      };
      saveCurrentItineraryToStore(activeItineraryId, payload);
      return updated;
    });
  };

  const handleRestoreFlight = (id: string) => {
    const target = flights.find(f => f.id === id);
    const desc = target ? `${target.airline} (${target.flightCode})` : id;
    logTransaction("Alterado", "Voo", id, `Restaurado: ${desc}`);
    setFlights((prev) => {
      const updated = prev.map((f) => f.id === id ? { ...f, isDeleted: false } : f);
      const payload = {
        destinations,
        costs,
        costCategories,
        travelers,
        documents,
        flights: updated,
        generalTips,
        notifications,
        transactionLogs
      };
      saveCurrentItineraryToStore(activeItineraryId, payload);
      return updated;
    });
  };


  // Itinerary Modifications (Add/Remove daily activities)
  const handleAddActivity = (destId: string, dayId: string, item: Omit<any, "id"> & { targetDayId?: string }) => {
    const newId = `act-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    logTransaction("Adicionado", "Atividade", newId, `${item.location} (${item.time || "Programação Livre"})`);
    const actualDayId = item.targetDayId || dayId;
    const itemWithCreator = { ...item, createdByEmail: currentUser?.email || "" };
    setDestinations((prev) => 
      prev.map((dest) => {
        if (dest.id !== destId) return dest;
        return {
          ...dest,
          days: dest.days.map((day) => {
            if (day.id !== actualDayId) return day;
            return {
              ...day,
              activities: [...day.activities, { id: newId, ...itemWithCreator }]
            };
          })
        };
      })
    );

    // Dynamic cost calculator auto-hook if they specify a cost
    const parsedCost = parseFloat(item.cost.replace(/[^0-9.]/g, ""));
    if (!isNaN(parsedCost) && parsedCost > 0) {
      const newCostItem: CostItem = {
        id: `c-act-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        category: "activity",
        description: `Ingresso: ${item.location} (${destinations.find(d => d.id === destId)?.city || ""})`,
        totalCostBRL: parsedCost * 5.2, // Convert USD to BRL mock multiplier
        status: "Falta pagar"
      };
      setCosts((prev) => [...prev, newCostItem]);
    }
  };

  const handleRemoveActivity = (destId: string, dayId: string, activityId: string) => {
    let actDesc = activityId;
    const dest = destinations.find(d => d.id === destId);
    if (dest) {
      const day = dest.days.find(dy => dy.id === dayId);
      if (day) {
        const actVal = day.activities.find(a => a.id === activityId);
        if (actVal) {
          actDesc = `${actVal.location} (${actVal.time || "Sem horário"})`;
        }
      }
    }
    logTransaction("Excluído", "Atividade", activityId, actDesc);
    setDestinations((prev) => 
      prev.map((dest) => {
        if (dest.id !== destId) return dest;
        return {
          ...dest,
          days: dest.days.map((day) => {
            if (day.id !== dayId) return day;
            return {
              ...day,
              activities: day.activities.filter((act) => act.id !== activityId)
            };
          })
        };
      })
    );
  };

  const handleEditActivity = (
    destId: string, 
    dayId: string, 
    activityId: string, 
    updatedItem: Omit<Activity, "id"> & { targetDayId?: string }
  ) => {
    logTransaction("Alterado", "Atividade", activityId, `${updatedItem.location} (${updatedItem.time || "Sem horário"})`);
    setDestinations((prev) => 
      prev.map((dest) => {
        if (dest.id !== destId) return dest;

        const targetDayId = updatedItem.targetDayId || dayId;

        // If day didn't change, perform standard update
        if (targetDayId === dayId) {
          return {
            ...dest,
            days: dest.days.map((day) => {
              if (day.id !== dayId) return day;
              return {
                ...day,
                activities: day.activities.map((act) => 
                  act.id === activityId ? { id: activityId, ...updatedItem } : act
                )
              };
            })
          };
        }

        // Day changed! We need to pull the activity from original day, and add/insert it into targetDay
        let activityObject: Activity | null = null;
        
        // Step 1: Remove from original day and find the activity
        const withRemoved = dest.days.map((day) => {
          if (day.id === dayId) {
            const found = day.activities.find((act) => act.id === activityId);
            if (found) {
              activityObject = { ...found, ...updatedItem };
            }
            return {
              ...day,
              activities: day.activities.filter((act) => act.id !== activityId)
            };
          }
          return day;
        });

        // Step 2: Push into targetDay
        if (!activityObject) {
          // Fallback if not found in original day for some reason
          activityObject = { id: activityId, ...updatedItem };
        }

        return {
          ...dest,
          days: withRemoved.map((day) => {
            if (day.id === targetDayId) {
              return {
                ...day,
                activities: [...day.activities, activityObject!]
              };
            }
            return day;
          })
        };
      })
    );
  };

  const handleSyncWashington = () => {
    setDestinations((prev) =>
      prev.map((dest) => {
        if (dest.id === "d1") {
          const initialWash = INITIAL_DESTINATIONS.find((d) => d.id === "d1");
          return initialWash ? JSON.parse(JSON.stringify(initialWash)) : dest;
        }
        return dest;
      })
    );
    // Add an alert notifying the user
    const newAlert: NotificationAlert = {
      id: `alert-sync-${Date.now()}`,
      title: "Planilha Sincronizada",
      description: "As atividades originais da planilha de Washington foram restauradas no Diário de Bordo!",
      time: "Agora mesmo",
      read: false,
      type: "important"
    };
    setNotifications((prev) => [newAlert, ...prev]);
  };

  const handleSyncAllDefaultDestinations = () => {
    const allDefs = JSON.parse(JSON.stringify(INITIAL_DESTINATIONS));
    setDestinations(allDefs);
    if (allDefs.length > 0) {
      setSelectedDestinationId(allDefs[0].id);
    }
    // Add an alert notifying the user
    const newAlert: NotificationAlert = {
      id: `alert-sync-all-${Date.now()}`,
      title: "Cidades Padrão Restauradas",
      description: "Todas as cidades padrão (Washington, New York, Philadelphia, Atlantic City e Chantilly) foram restauradas com sucesso no seu Diário de Bordo!",
      time: "Agora mesmo",
      read: false,
      type: "important"
    };
    setNotifications((prev) => [newAlert, ...prev]);
  };

  const handleOptimizeDayRoute = async (destId: string, dayId: string) => {
    const dest = destinations.find((d) => d.id === destId);
    if (!dest) throw new Error("Cidade destino não encontrada.");
    const day = dest.days.find((d) => d.id === dayId);
    if (!day) throw new Error("Dia do roteiro não encontrado.");

    const res = await fetch("/api/gemini/optimize-route", {
      method: "POST",
      headers: getAiHeaders({
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token || "traveler-session"}`
      }),
      body: JSON.stringify({
        city: dest.city,
        activities: day.activities
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Falha na resposta do servidor.");
    }

    const json = await res.json();
    if (json && json.success && Array.isArray(json.activities)) {
      setDestinations((prev) =>
        prev.map((d) => {
          if (d.id !== destId) return d;
          return {
            ...d,
            days: d.days.map((dy) => {
              if (dy.id !== dayId) return dy;
              return {
                ...dy,
                activities: json.activities
              };
            })
          };
        })
      );

      const newAlert: NotificationAlert = {
        id: `alert-optimize-${Date.now()}`,
        title: "Rota Otimizada",
        description: `A rota para o dia "${day.title}" (${dest.city}) foi reordenada geograficamente com sucesso!`,
        time: "Agora mesmo",
        read: false,
        type: "important"
      };
      setNotifications((prev) => [newAlert, ...prev]);
    } else {
      throw new Error("Resposta inválida recebida do otimizador.");
    }
  };

  const handleImportDestinationDays = (
    destId: string,
    parsedDays: ItineraryDay[],
    importMode: "replace" | "merge"
  ) => {
    setDestinations((prev) =>
      prev.map((dest) => {
        if (dest.id !== destId) return dest;

        let newDays = [...dest.days];

        if (importMode === "replace") {
          newDays = parsedDays.map((pDay, idx) => ({
            ...pDay,
            id: `day-${destId}-${idx + 1}-${Date.now()}`,
            activities: pDay.activities.map((act, aIdx) => ({
              ...act,
              id: `act-${destId}-${idx + 1}-${aIdx}-${Date.now()}`
            }))
          }));
        } else {
          // Merge mode (adds to existing, or inserts new)
          parsedDays.forEach((parsedDay) => {
            const parsedKey = getCanonicalDateKey(parsedDay.dateStr);
            const existingDayIdx = newDays.findIndex(
              (d) => getCanonicalDateKey(d.dateStr) === parsedKey
            );

            if (existingDayIdx !== -1) {
              const existingDay = newDays[existingDayIdx];
              // Avoid duplicate activities by matching time & location
              const existingKeys = new Set(
                existingDay.activities.map((a) => `${a.time}-${a.location}`)
              );
              const newActivities = parsedDay.activities
                .filter((a) => !existingKeys.has(`${a.time}-${a.location}`))
                .map((act, aIdx) => ({
                  ...act,
                  id: `act-${destId}-${existingDay.dayNumber}-${aIdx}-${Date.now()}`
                }));

              newDays[existingDayIdx] = {
                ...existingDay,
                activities: [...existingDay.activities, ...newActivities]
              };
            } else {
              // Create new day in destinations, adjusting dayNumber relative to current list size
              const dayNum = newDays.length + 1;
              newDays.push({
                ...parsedDay,
                id: `day-${destId}-${dayNum}-${Date.now()}`,
                dayNumber: dayNum,
                activities: parsedDay.activities.map((act, aIdx) => ({
                  ...act,
                  id: `act-${destId}-${dayNum}-${aIdx}-${Date.now()}`
                }))
              });
            }
          });

          // Re-sort days by dayNumber
          newDays.sort((a, b) => a.dayNumber - b.dayNumber);
        }

        return {
          ...dest,
          days: newDays
        };
      })
    );

    // Add notification alert
    const targetCity = destinations.find((d) => d.id === destId)?.city || "sua viagem";
    const totalActivitiesCount = parsedDays.reduce((acc, d) => acc + d.activities.length, 0);
    const newAlert: NotificationAlert = {
      id: `alert-import-${Date.now()}`,
      title: "Planilha Importada (Carga Inicial)",
      description: `Sucesso! Foram importados ${parsedDays.length} dias e ${totalActivitiesCount} atividades para o roteiro de ${targetCity} nesta sessão.`,
      time: "Agora mesmo",
      read: false,
      type: "gate"
    };
    setNotifications((prev) => [newAlert, ...prev]);
  };


  // Cost Operations
  const handleAddCost = (item: Omit<CostItem, "id">) => {
    const newId = `c-${Date.now()}`;
    logTransaction("Adicionado", "Despesa", newId, `${item.description} (R$ ${item.totalCostBRL.toFixed(2)}) [${item.status}]`);
    setCosts((prev) => [...prev, { id: newId, ...item }]);
  };

  const handleRemoveCost = (id: string) => {
    const target = costs.find(c => c.id === id);
    const desc = target ? `${target.description} (R$ ${target.totalCostBRL.toFixed(2)})` : id;
    logTransaction("Excluído", "Despesa", id, desc);
    setCosts((prev) => prev.map((c) => c.id === id ? { ...c, isDeleted: true } : c));
  };

  const handleRestoreCost = (id: string) => {
    const target = costs.find(c => c.id === id);
    const desc = target ? `${target.description} (R$ ${target.totalCostBRL.toFixed(2)})` : id;
    logTransaction("Alterado", "Despesa", id, `Restaurado: ${desc}`);
    setCosts((prev) => prev.map((c) => c.id === id ? { ...c, isDeleted: false } : c));
  };


  const handleUpdateCostStatus = (id: string, status: CostItem["status"]) => {
    const target = costs.find(c => c.id === id);
    const desc = target ? `${target.description} para o estado "${status}"` : `${id} -> ${status}`;
    logTransaction("Alterado", "Despesa", id, desc);
    setCosts((prev) => 
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
  };

  const handleEditCost = (id: string, updatedItem: Omit<CostItem, "id">) => {
    logTransaction("Alterado", "Despesa", id, `${updatedItem.description} (R$ ${updatedItem.totalCostBRL.toFixed(2)}) [${updatedItem.status}]`);
    // 1. Update the costs state
    setCosts((prev) => 
      prev.map((c) => (c.id === id ? { ...c, ...updatedItem } : c))
    );

    // 2. If it is a hotel, synchronize to destinations!
    if (updatedItem.category === "hotel") {
      setDestinations((prevDests) => {
        return prevDests.map((dest) => {
          // Robust matching: by destinationId OR description containing city
          const isMatch = updatedItem.destinationId === dest.id || 
                          (updatedItem.description && updatedItem.description.toLowerCase().includes(dest.city.toLowerCase()));
          
          if (isMatch) {
            let cleanName = updatedItem.description;
            if (cleanName.includes("(")) {
              cleanName = cleanName.split("(")[0].trim();
            }
            if (cleanName.includes("-")) {
              cleanName = cleanName.split("-")[0].trim();
            }

            return {
              ...dest,
              hotelName: cleanName || dest.hotelName,
              hotelLink: updatedItem.link || dest.hotelLink,
              dates: updatedItem.dateRange || dest.dates
            };
          }
          return dest;
        });
      });
    }
  };

  const handleUpdateHotelAndCost = (
    destId: string, 
    hotelData: { 
      hotelName: string; 
      hotelAddress: string; 
      hotelLink: string; 
      dates: string; 
      checkInTime?: string;
      checkOutTime?: string;
      totalCostBRL: number; 
      status: "Pago" | "Pgto no local" | "Falta pagar";
    }
  ) => {
    // 1. Update Destinations list
    setDestinations((prev) => 
      prev.map((dest) => {
        if (dest.id === destId) {
          return {
            ...dest,
            hotelName: hotelData.hotelName,
            hotelAddress: hotelData.hotelAddress,
            hotelLink: hotelData.hotelLink,
            dates: hotelData.dates,
            checkInTime: hotelData.checkInTime,
            checkOutTime: hotelData.checkOutTime
          };
        }
        return dest;
      })
    );

    // 2. Find and update or create matching CostItem in costs list
    setCosts((prevCosts) => {
      const activeDest = destinations.find(d => d.id === destId);
      const cityName = activeDest ? activeDest.city : "";
      
      const existingIdx = prevCosts.findIndex(
        (c) => c.category === "hotel" && (c.destinationId === destId || (cityName && c.description.toLowerCase().includes(cityName.toLowerCase())))
      );

      const description = `${hotelData.hotelName}${cityName ? ` (${cityName})` : ""}`;

      if (existingIdx !== -1) {
        return prevCosts.map((c, idx) => {
          if (idx === existingIdx) {
            return {
              ...c,
              description: description,
              link: hotelData.hotelLink || undefined,
              totalCostBRL: hotelData.totalCostBRL,
              status: hotelData.status,
              dateRange: hotelData.dates || undefined,
              destinationId: destId
            };
          }
          return c;
        });
      } else {
        const newCost: CostItem = {
          id: `c-${Date.now()}`,
          category: "hotel",
          description: description,
          notes: cityName ? `Atividades ${cityName}` : "Hotel extra",
          link: hotelData.hotelLink || undefined,
          totalCostBRL: hotelData.totalCostBRL,
          status: hotelData.status,
          dateRange: hotelData.dates || undefined,
          destinationId: destId
        };
        return [...prevCosts, newCost];
      }
    });

    // 3. Add system notification
    const activeDest = destinations.find(d => d.id === destId);
    const cityName = activeDest ? activeDest.city : "";
    const newAlert: NotificationAlert = {
      id: `system-${Date.now()}`,
      title: "Hospedagem & Despesas Sincronizadas! 🔄",
      description: `As informações do ${hotelData.hotelName} em ${cityName} foram totalmente sincronizadas com a planilha de despesas com sucesso.`,
      time: "Agora",
      read: false,
      type: "system"
    };
    setNotifications((prev) => [newAlert, ...prev]);
  };

  // Wallet Documents Vault Operations
  const handleAddDocument = (item: any) => {
    const newId = `doc-${Date.now()}`;
    logTransaction("Adicionado", "Documento", newId, `${item.title} (${item.type}) para ${item.passengerName}`);
    const todayStr = new Date().toLocaleDateString("pt-BR");
    setDocuments((prev) => [
      {
        id: newId,
        uploadedAt: todayStr,
        createdByEmail: currentUser?.email || "",
        ...item
      },
      ...prev
    ]);
  };

  const handleRemoveDocument = (id: string) => {
    const target = documents.find(d => d.id === id);
    const desc = target ? `${target.title} (${target.type}) para ${target.passengerName}` : id;
    logTransaction("Excluído", "Documento", id, desc);
    setDocuments((prev) => prev.map((d) => d.id === id ? { ...d, isDeleted: true } : d));
  };

  const handleRestoreDocument = (id: string) => {
    const target = documents.find(d => d.id === id);
    const desc = target ? `${target.title} (${target.type}) para ${target.passengerName}` : id;
    logTransaction("Alterado", "Documento", id, `Restaurado: ${desc}`);
    setDocuments((prev) => prev.map((d) => d.id === id ? { ...d, isDeleted: false } : d));
  };


  // General Tips Operations
  const handleAddTip = (tip: Omit<GeneralTip, "id">) => {
    const newId = `tip-${Date.now()}`;
    logTransaction("Adicionado", "Dica", newId, `${tip.title} [Categoria: ${tip.category}]`);
    setGeneralTips((prev) => [...prev, { id: newId, ...tip }]);
  };

  const handleEditTip = (id: string, updatedTip: Omit<GeneralTip, "id">) => {
    logTransaction("Alterado", "Dica", id, `${updatedTip.title} [Categoria: ${updatedTip.category}]`);
    setGeneralTips((prev) => 
      prev.map((t) => (t.id === id ? { ...t, ...updatedTip } : t))
    );
  };

  const handleRemoveTip = (id: string) => {
    const target = generalTips.find(t => t.id === id);
    const desc = target ? `${target.title} [Categoria: ${target.category}]` : id;
    logTransaction("Excluído", "Dica", id, desc);
    setGeneralTips((prev) => prev.filter((t) => t.id !== id));
  };

  // 24h Check-in Notification Simulation
  useEffect(() => {
    try {
      const triggeredCheckins = JSON.parse(localStorage.getItem("meu_agente_checkin_notif") || "{}");
      let newAlerts: NotificationAlert[] = [];
      const now = new Date();
      
      destinations.forEach(dest => {
        if (dest.checkInTime && !triggeredCheckins[dest.id]) {
          let checkInDateTime: Date | null = null;
          if (dest.checkInDate) {
            checkInDateTime = new Date(dest.checkInDate);
          } else if (dest.startDate) {
            const timeStr = dest.checkInTime || "12:00";
            checkInDateTime = new Date(`${dest.startDate}T${timeStr}`);
          }

          if (checkInDateTime && !isNaN(checkInDateTime.getTime())) {
            const diffMs = checkInDateTime.getTime() - now.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);

            // Só dispara se o check-in for nas próximas 24 horas
            if (diffHours > 0 && diffHours <= 24) {
              newAlerts.push({
                id: `checkin-${dest.id}-${Date.now()}`,
                title: `Check-in em 24h: ${dest.hotelName} 🛎️`,
                description: `Lembrete automático: Seu check-in em ${dest.city} começa amanhã às ${dest.checkInTime}. Tenha seus documentos em mãos!`,
                time: "Agora mesmo",
                read: false,
                type: "system"
              });
              triggeredCheckins[dest.id] = true;
            }
          }
        }
      });

      if (newAlerts.length > 0) {
        setNotifications(prev => [...newAlerts, ...prev]);
        localStorage.setItem("meu_agente_checkin_notif", JSON.stringify(triggeredCheckins));
      }
    } catch(e) {
      console.error(e);
    }
  }, [destinations]);

  // Alert simulation triggers (Notificações automáticas)
  const handleSimulateAlert = () => {
    const alertIdeas = [
      {
        title: "Alteração Urgente de Portão",
        description: "Atenção: O portão de embarque do voo UA 861 para SP mudou para C14.",
        type: "gate" as const
      },
      {
        title: "Atraso Meteorológico",
        description: "Nuvens densas em New York (JFK) podem atrasar conexões aéreas em 25min.",
        type: "gate" as const
      },
      {
        title: "Lembrete: Visita ao Museu",
        description: "Sugerimos separar os ingressos do Empire State na aba Documentos para as 13:00.",
        type: "schedule" as const
      },
      {
        title: "Previsão de Tempo de Rota",
        description: "Tráfego intenso de carro na I-95 sentido Philadelphia. Rota estimada em +15min.",
        type: "schedule" as const
      }
    ];

    const randomIdea = alertIdeas[Math.floor(Math.random() * alertIdeas.length)];
    const newAlert: NotificationAlert = {
      id: `alert-${Date.now()}`,
      title: randomIdea.title,
      description: randomIdea.description,
      time: "Agora mesmo",
      read: false,
      type: randomIdea.type
    };

    setNotifications((prev) => [newAlert, ...prev]);
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev) => 
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };


  // Sync / Save current state to local storage and optionally cloud
  async function saveCurrentItineraryToStore(itId: string | number, statesPayload: any) {
    // 1. Save in local cache
    safeSetLocalStorage(`meu_agente_itinerary_data_${itId}`, JSON.stringify(statesPayload));
    
    // 2. If online and logged in (numerical ID or string database ID)
    const isServerId = itId !== null && itId !== undefined && !String(itId).startsWith("local-");
    const isReallyOffline = isOffline || (typeof navigator !== "undefined" && !navigator.onLine);

    if (isReallyOffline || !token || !isServerId) {
      safeSetLocalStorage("kedgo_has_pending_offline_sync", "true");
      safeSetLocalStorage("kedgo_pending_sync_itinerary_id", String(itId));
      return;
    }

    try {
      const titleVal = itineraries.find(it => String(it.id) === String(itId))?.title || "Minha Viagem";
      const res = await fetch(`/api/itineraries/${encodeURIComponent(itId)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: titleVal,
          data: statesPayload
        })
      });

      if (res.ok) {
        localStorage.removeItem("kedgo_has_pending_offline_sync");
        localStorage.removeItem("kedgo_pending_sync_itinerary_id");
      } else {
        safeSetLocalStorage("kedgo_has_pending_offline_sync", "true");
        safeSetLocalStorage("kedgo_pending_sync_itinerary_id", String(itId));
      }
    } catch (err) {
      console.warn("Offline fallback: Salvo no armazenamento local. Sincronização pendente:", err);
      safeSetLocalStorage("kedgo_has_pending_offline_sync", "true");
      safeSetLocalStorage("kedgo_pending_sync_itinerary_id", String(itId));
    }
  }

  const handleSetFavoriteItinerary = async (id: string | number | null) => {
    setFavoriteItineraryId(id);
    if (id) localStorage.setItem("meu_agente_favorite_itinerary_id", String(id));
    else localStorage.removeItem("meu_agente_favorite_itinerary_id");

    if (token) {
      try {
        await fetch("/api/users/favorite", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ itineraryId: id })
        });
      } catch(e) {
        console.error("Failed to update favorite", e);
      }
    }
  };

  const handleSelectItinerary = async (nextId: string | number) => {
    if (nextId === activeItineraryId) return;

    // 1. Save current active itinerary first so we don't lose changes (if exists)
    if (activeItineraryId) {
      const currentPayload = getCurrentStatePayload();
      await saveCurrentItineraryToStore(activeItineraryId, currentPayload);

      // Update active list with latest data in cache
      setItineraries(prev => prev.map(it => it.id === activeItineraryId ? { ...it, data: currentPayload } : it));
    }

    // 2. Load next itinerary data
    const nextIt = itineraries.find(it => it.id === nextId);

    // Automatically toggle isTravelerMode based on session type
    const isOwner = currentUser && nextIt?.ownerId === currentUser.id;
    const updatedIsTravelerMode = token === "traveler-session";
    
    if (isTravelerMode !== updatedIsTravelerMode) {
      setIsTravelerMode(updatedIsTravelerMode);
      localStorage.setItem("auth_is_traveler", updatedIsTravelerMode ? "true" : "false");
    }
    if (updatedIsTravelerMode && currentUser?.email && !travelerEmail) {
      setTravelerEmail(currentUser.email);
      localStorage.setItem("auth_traveler_email", currentUser.email);
    }

    let nextData = nextIt?.data;

    if (!nextData) {
      const savedLocal = localStorage.getItem(`meu_agente_itinerary_data_${nextId}`);
      if (savedLocal) {
        try {
          nextData = JSON.parse(savedLocal);
        } catch (e) {
          console.error(e);
        }
      }
    }

    if (nextData) {
      if (nextData.destinations) setDestinations(nextData.destinations);
      if (nextData.costs) setCosts(nextData.costs);
      if (nextData.costCategories) setCostCategories(nextData.costCategories);
      if (nextData.travelers) setTravelers(nextData.travelers);
      if (nextData.documents) setDocuments(nextData.documents);
      if (nextData.flights) setFlights(nextData.flights);
      if (nextData.generalTips) setGeneralTips(nextData.generalTips);
      if (nextData.notifications) setNotifications(nextData.notifications);
      setTransactionLogs(nextData.transactionLogs || []);
    } else {
      // Clean slate/default seed data
      const cleanPayload = getCleanSlatePayload();
      setDestinations(cleanPayload.destinations);
      setCosts(cleanPayload.costs);
      setCostCategories(cleanPayload.costCategories);
      setTravelers(cleanPayload.travelers);
      setDocuments(cleanPayload.documents);
      setFlights(cleanPayload.flights);
      setGeneralTips(cleanPayload.generalTips);
      setNotifications([]);
      setTransactionLogs([]);
    }

    setActiveItineraryId(nextId);
    lastLoadedItineraryIdRef.current = nextId;
    localStorage.setItem("meu_agente_active_itinerary_id", String(nextId));

    if (nextData?.destinations && nextData.destinations.length > 0) {
      setSelectedDestinationId(nextData.destinations[0].id);
    } else {
      const clean = getCleanSlatePayload();
      setSelectedDestinationId(clean.destinations[0].id);
    }

    const alert: NotificationAlert = {
      id: `sys-${Date.now()}`,
      title: "Viagem Carregada",
      description: `Você alternou para a viagem "${nextIt?.title || 'Personalizada'}".`,
      time: "Agora mesmo",
      type: "system",
      read: false
    };
    setNotifications(prev => [alert, ...prev]);
  };

  const handleCreateItinerary = async (title: string) => {
    if (!planAccess.canCreateItinerary) {
      setShowCheckoutModal(true);
      return;
    }

    // 1. Save current itinerary first if one is active
    if (activeItineraryId) {
      const currentPayload = getCurrentStatePayload();
      await saveCurrentItineraryToStore(activeItineraryId, currentPayload);
    }

    // 2. Prepare clean default states for the new itinerary
    const newId = `local-${Date.now()}`;
    const cleanPayload = getCleanSlatePayload();

    let finalId: string | number = newId;

    // 3. Save to database if connected
    if (!isOffline && token) {
      try {
        const response = await fetch(`/api/itineraries`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            title,
            data: cleanPayload
          })
        });
        const result = await response.json();
        if (response.ok && result.success && result.itinerary) {
          finalId = result.itinerary.id;
        } else if (!response.ok && result.error) {
          window.alert(result.error);
          setShowCheckoutModal(true);
          return;
        }
      } catch (err) {
        console.error("Erro ao criar itinerário no banco de dados:", err);
      }
    }

    // Add to list and select it
    const newItObj = { id: finalId, title, data: cleanPayload };
    setItineraries(prev => [...prev, newItObj]);
    
    // Save to local storage cache for offline robust mode too
    safeSetLocalStorage(`meu_agente_itinerary_data_${finalId}`, JSON.stringify(cleanPayload));
    
    setActiveItineraryId(finalId);
    localStorage.setItem("meu_agente_active_itinerary_id", String(finalId));

    // Populate active states
    setDestinations(cleanPayload.destinations);
    setCosts(cleanPayload.costs);
    setCostCategories(cleanPayload.costCategories);
    setTravelers(cleanPayload.travelers);
    setDocuments(cleanPayload.documents);
    setFlights(cleanPayload.flights);
    setGeneralTips(cleanPayload.generalTips);
    setNotifications([]);
    setSelectedDestinationId(cleanPayload.destinations[0].id);

    const alertItem: NotificationAlert = {
      id: `sys-${Date.now()}`,
      title: "Nova Viagem Criada",
      description: `A viagem "${title}" foi criada com sucesso e está pronta para edição!`,
      time: "Agora mesmo",
      type: "system",
      read: false
    };
    setNotifications(prev => [alertItem, ...prev]);
  };

  const handleImportGeneratedItinerary = async (title: string, payload: any) => {
    if (!planAccess.canCreateItinerary) {
      setShowCheckoutModal(true);
      return;
    }

    // 1. Save current itinerary first
    const currentPayload = getCurrentStatePayload();
    await saveCurrentItineraryToStore(activeItineraryId, currentPayload);

    // 2. Prepare database entry if connected
    let finalId: string | number = `local-${Date.now()}`;
    if (!isOffline && token) {
      try {
        const response = await fetch(`/api/itineraries`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            title,
            data: payload
          })
        });
        const result = await response.json();
        if (response.ok && result.success && result.itinerary) {
          finalId = result.itinerary.id;
        } else if (!response.ok && result.error) {
          window.alert(result.error);
          setShowCheckoutModal(true);
          return;
        }
      } catch (err) {
        console.error("Erro ao salvar roteiro gerado com IA no banco de dados:", err);
      }
    }

    const newItObj = { id: finalId, title, data: payload };
    setItineraries(prev => [...prev, newItObj]);

    // Save to local storage cache
    safeSetLocalStorage(`meu_agente_itinerary_data_${finalId}`, JSON.stringify(payload));

    setActiveItineraryId(finalId);
    localStorage.setItem("meu_agente_active_itinerary_id", String(finalId));

    // Populate active states
    setDestinations(payload.destinations || []);
    setCosts(payload.costs || []);
    setCostCategories(payload.costCategories || INITIAL_COST_CATEGORIES);
    setTravelers(payload.travelers || [{ id: "t-organizer", name: "Você", role: "Organizador", email: "" }]);
    setDocuments(payload.documents || []);
    setFlights(payload.flights || []);
    setGeneralTips(payload.generalTips || []);
    setNotifications([]);

    if (payload.destinations && payload.destinations.length > 0) {
      setSelectedDestinationId(payload.destinations[0].id);
    }

    const alert: NotificationAlert = {
      id: `sys-${Date.now()}`,
      title: "Roteiro com IA Criado",
      description: `A viagem "${title}" foi criada via Inteligência Artificial com sucesso!`,
      time: "Agora mesmo",
      type: "system",
      read: false
    };
    setNotifications(prev => [alert, ...prev]);
  };

  const handleRenameItinerary = async (id: string | number, newTitle: string) => {
    setItineraries(prev => prev.map(it => String(it.id) === String(id) ? { ...it, title: newTitle } : it));

    const isServerId = id !== null && id !== undefined && !String(id).startsWith("local-");
    if (!isOffline && token && isServerId) {
      try {
        await fetch(`/api/itineraries/${encodeURIComponent(id)}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            title: newTitle
          })
        });
      } catch (err) {
        console.error("Erro ao renomear viagem no banco de dados:", err);
      }
    }
  };

  const handleDeleteItinerary = async (id: string | number) => {
    if (itineraries.length <= 1) return;

    const filtered = itineraries.filter(it => String(it.id) !== String(id));
    setItineraries(filtered);

    // If we deleted the active one, switch to another
    if (String(id) === String(activeItineraryId)) {
      const remaining = filtered[0];
      setActiveItineraryId(remaining.id);
      lastLoadedItineraryIdRef.current = remaining.id;
      localStorage.setItem("meu_agente_active_itinerary_id", String(remaining.id));
      
      let nextData = remaining.data;
      if (!nextData) {
        const savedLocal = localStorage.getItem(`meu_agente_itinerary_data_${remaining.id}`);
        if (savedLocal) {
          try {
            nextData = JSON.parse(savedLocal);
          } catch (e) {
            console.error(e);
          }
        }
      }

      if (nextData) {
        if (nextData.destinations) setDestinations(nextData.destinations);
        if (nextData.costs) setCosts(nextData.costs);
        if (nextData.costCategories) setCostCategories(nextData.costCategories);
        if (nextData.travelers) setTravelers(nextData.travelers);
        if (nextData.documents) setDocuments(nextData.documents);
        if (nextData.flights) setFlights(nextData.flights);
        if (nextData.generalTips) setGeneralTips(nextData.generalTips);
        if (nextData.notifications) setNotifications(nextData.notifications);
        if (nextData.destinations && nextData.destinations.length > 0) {
          setSelectedDestinationId(nextData.destinations[0].id);
        }
      }
    }

    localStorage.removeItem(`meu_agente_itinerary_data_${id}`);

    const isServerId = id !== null && id !== undefined && !String(id).startsWith("local-");
    if (!isOffline && token && isServerId) {
      try {
        await fetch(`/api/itineraries/${encodeURIComponent(id)}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
      } catch (err) {
        console.error("Erro ao deletar viagem do banco de dados:", err);
      }
    }
  };

  const handleMigrateData = async (silent = true) => {
    // Adapter to maintain manual cloud backup button function
    if (!token || !activeItineraryId) return;
    try {
      const payload = getCurrentStatePayload();
      await saveCurrentItineraryToStore(activeItineraryId, payload);
      
      if (!silent) {
        const successAlert: NotificationAlert = {
          id: `sys-${Date.now()}`,
          title: "Backup PostgreSQL Completo",
          description: "Os dados da sua viagem atual foram guardados com segurança no banco de dados.",
          time: "Agora mesmo",
          type: "system",
          read: false
        };
        setNotifications(prev => [successAlert, ...prev]);
      }
    } catch (e: any) {
      if (!silent) {
        const errorAlert: NotificationAlert = {
          id: `sys-err-${Date.now()}`,
          title: "Erro ao Sincronizar",
          description: `Falha na migração: ${e.message}`,
          time: "Agora mesmo",
          type: "important",
          read: false
        };
        setNotifications(prev => [errorAlert, ...prev]);
      }
    }
  };

  // Auto-sync active itinerary to cloud on changes
  useEffect(() => {
    if (isOffline || !token || !activeItineraryId || isTravelerMode || token === "traveler-session" || !hasLoadedCloud || isFetchingCloud) return;
    if (typeof activeItineraryId === "string" && activeItineraryId.startsWith("local-")) {
      return;
    }

    // Safety guard: Do not auto-sync empty state to cloud if destinations/travelers are uninitialized
    if (destinations.length === 0 && flights.length === 0 && costs.length === 0 && travelers.length <= 1) {
      console.warn("Autosave pulado: estado local vazio ou não inicializado para evitar sobrescrever a viagem.");
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const payload = getCurrentStatePayload();
        await fetch(`/api/itineraries/${encodeURIComponent(activeItineraryId)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: itineraries.find(it => it.id === activeItineraryId)?.title,
            data: payload
          })
        });
      } catch (e: any) {
        const isNetworkError = e?.message && (
          e.message.includes("Failed to fetch") || 
          e.message.includes("network error") || 
          e.message.includes("NetworkError") || 
          e.message.includes("abort")
        );
        if (isNetworkError) {
          console.warn("Autosave temporarily unavailable (transient network/server restart):", e.message);
        } else {
          console.error("Autosave target error:", e);
        }
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [travelers, destinations, costs, costCategories, documents, flights, generalTips, transactionLogs, activeItineraryId]);

  // Keep list of itineraries and current state package persistently cached
  useEffect(() => {
    safeSetLocalStorage("meu_agente_itineraries_list", JSON.stringify(itineraries));
  }, [itineraries]);

  useEffect(() => {
    if (!activeItineraryId) return;
    if (activeItineraryId !== lastLoadedItineraryIdRef.current) {
      // Avoid saving stale intermediate state during transition to a different trip
      return;
    }
    const payload = getCurrentStatePayload();
    safeSetLocalStorage(`meu_agente_itinerary_data_${activeItineraryId}`, JSON.stringify(payload));
  }, [travelers, destinations, costs, costCategories, documents, flights, generalTips, notifications, transactionLogs, activeItineraryId]);

  useEffect(() => {
    safeSetLocalStorage("meu_agente_destinations", JSON.stringify(destinations));
  }, [destinations]);

  useEffect(() => {
    safeSetLocalStorage("meu_agente_costs", JSON.stringify(costs));
  }, [costs]);

  useEffect(() => {
    safeSetLocalStorage("meu_agente_cost_categories", JSON.stringify(costCategories));
  }, [costCategories]);

  useEffect(() => {
    safeSetLocalStorage("meu_agente_travelers", JSON.stringify(travelers));
  }, [travelers]);

  useEffect(() => {
    safeSetLocalStorage("meu_agente_documents", JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    safeSetLocalStorage("meu_agente_flights", JSON.stringify(flights));
  }, [flights]);

  useEffect(() => {
    safeSetLocalStorage("meu_agente_general_tips", JSON.stringify(generalTips));
  }, [generalTips]);

  if (!token) {
    return (
      <>
        <PWAInstallBanner />
        <LoginScreen onLogin={handleLogin} onTravelerLogin={handleTravelerLogin} />
      </>
    );
  }

  const userEmailNormalized = currentUser?.email?.toLowerCase().trim() || "";
  const currentUserTraveler = userEmailNormalized 
    ? travelers.find(t => t.email?.toLowerCase().trim() === userEmailNormalized)
    : undefined;
  const userRole = currentUserTraveler?.role || "Viajante";
  const activeItinerary = itineraries.find(it => String(it.id) === String(activeItineraryId));
  const isOwner = !!(activeItinerary && currentUser && activeItinerary.ownerId === currentUser.id);
  const isUserAdminRole = ["administrador", "organizador", "criador", "proprietário", "admin"].includes(userRole.toLowerCase().trim());
  const isAdmin = !isTravelerMode && !!currentUser && (
    isOwner ||
    isUserAdminRole ||
    !activeItinerary?.ownerId
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-900">
      <PWAInstallBanner />
      
      {/* HEADER HUD BAR */}
      <Header 
        isOffline={isOffline}
        setIsOffline={setIsOffline}
        notificationPermission={notificationPermission}
        onRequestNotificationPermission={onRequestNotificationPermission}
        travelers={activeTravelers}
        onAddTraveler={handleAddTraveler}
        onRemoveTraveler={handleRemoveTraveler}
        onEditTraveler={handleEditTraveler}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onClearNotifications={handleClearNotifications}
        onSimulateNotification={handleSimulateAlert}
        onMigrateData={handleMigrateData}
        onLogout={handleLogout}
        itineraries={itineraries}
        activeItineraryId={activeItineraryId}
        onSelectItinerary={handleSelectItinerary}
        onCreateItinerary={handleCreateItinerary}
        onRenameItinerary={handleRenameItinerary}
        onDeleteItinerary={handleDeleteItinerary}
        favoriteItineraryId={favoriteItineraryId}
        onSetFavoriteItinerary={handleSetFavoriteItinerary}
        isTravelerMode={isTravelerMode}
        currentUser={currentUser}
        unreadChatCount={unreadChatCount}
        onOpenChatTab={() => setActiveTab("chat")}
        onOpenReferralModal={() => setShowReferralModal(true)}
        onOpenCheckoutModal={() => setShowCheckoutModal(true)}
        canCreateItinerary={planAccess.canCreateItinerary}
      />

      {currentUser && planAccess.isTrial && (
        <TrialBanner
          trialDaysRemaining={planAccess.trialDaysRemaining}
          trialExpired={planAccess.trialExpired}
          onOpenCheckout={() => setShowCheckoutModal(true)}
        />
      )}

      {/* TRIP STICKY ALERT CONTAINER FOR OFFLINE MODE */}
      {isOffline && (
        <div className="bg-amber-500 text-amber-950 px-3 sm:px-4 py-2 text-center text-xs font-bold border-b border-amber-600 flex flex-wrap items-center justify-between gap-2 shrink-0 shadow-sm">
          <div className="flex items-center gap-1.5 mx-auto">
            <WifiOff className="w-4 h-4 shrink-0 text-amber-950 animate-pulse" />
            <span>
              Navegador operando offline. Passagens, bilhetes e cofres de documentos disponíveis localmente.
              {localStorage.getItem("kedgo_has_pending_offline_sync") === "true" && (
                <span className="ml-1 text-[10px] sm:text-[11px] font-semibold text-amber-950 bg-amber-400/80 px-1.5 py-0.5 rounded-md border border-amber-600/30">
                  (Alterações salvas e prontas para sincronizar)
                </span>
              )}
            </span>
          </div>
          {typeof navigator !== "undefined" && navigator.onLine && (
            <button
              onClick={() => {
                localStorage.removeItem("meu_agente_offline_mode");
                setIsOffline(false);
              }}
              className="px-2.5 py-1 bg-amber-900 hover:bg-amber-950 text-white rounded-lg text-[10px] font-black transition cursor-pointer shrink-0 shadow-xs mx-auto sm:mx-0"
            >
              Reconectar & Sincronizar
            </button>
          )}
        </div>
      )}

      {/* MAIN LAYOUT WRAPPER (Optimized spacing for mobile layout and sticky bottom bar protection) */}
      <main className="grow max-w-7xl w-full mx-auto p-3 sm:p-5 md:p-8 space-y-4 md:space-y-6 pb-24 md:pb-8">
        
        {/* Mobile-Only Friendly Active Trip and Welcome Indicator */}
        <div className="sm:hidden bg-linear-to-r from-indigo-50/90 to-indigo-100/50 backdrop-blur-md rounded-2xl border border-indigo-150/65 p-3.5 flex items-center justify-between shadow-xs">
          <div className="flex flex-col text-left">
            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Viagem Selecionada</span>
            <span className="text-sm font-extrabold text-indigo-950 leading-tight mt-0.5">
              {itineraries.find(it => String(it.id) === String(activeItineraryId))?.title || "Minha Viagem"}
            </span>
          </div>
          {currentUser && (
            <div className="text-right">
              <span className="text-[9px] text-indigo-500 font-bold block leading-none">Olá, viajante!</span>
              <span className="text-xs font-extrabold text-indigo-600 block mt-1">
                {currentUser.name || currentUser.email?.split("@")[0] || "Viajante"}
              </span>
            </div>
          )}
        </div>
        
        {/* Navigation Tabs (Modern Bento segment selector) - Desktop Only (Hidden on Mobile) */}
        <div className="w-full hidden md:flex justify-center">
          <div className="w-full overflow-x-auto scrollbar-none py-1">
            <div className="bg-white p-1.5 rounded-2xl border border-slate-200 w-max mx-auto shadow-xs gap-1 flex items-center shrink-0">
              {[
                { id: "overview", label: "Informações", icon: Compass },
                { id: "itinerary", label: "Diário de Roteiros", icon: MapPin },
                { id: "costs", label: "Planilha de Custos", icon: DollarSign },
                { id: "documents", label: "Cofre de Documentos", icon: FileText },
                { id: "calendar", label: "Agenda Unificada", icon: CalendarIcon },
                { id: "chat", label: "Chat do Grupo", icon: MessageCircle },
                { id: "settings", label: "Configurações", icon: Settings },
                ...(isAdmin ? [{ id: "admin", label: "Painel Admin", icon: ShieldCheck }] : [])
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (!planAccess.canAccessTab(tab.id)) {
                        setBlockedFeatureName(`aba ${tab.label}`);
                        setShowTrialExpiredModal(true);
                        return;
                      }
                      setActiveTab(tab.id);
                    }}
                    className={`py-2 px-4 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                      active 
                        ? "bg-indigo-600 text-white shadow-xs" 
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    <div className="relative">
                      <Icon className={`w-4 h-4 shrink-0 ${active ? "text-white" : "text-slate-400"}`} />
                      {tab.id === "chat" && unreadChatCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[7px] font-bold px-1 min-w-[13px] h-3 rounded-full flex items-center justify-center border border-white scale-90">
                          {unreadChatCount}
                        </span>
                      )}
                    </div>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Native App-like Bottom Navigation Bar for Mobile Only */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 pt-2 pb-5 flex items-center z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] rounded-t-2xl overflow-hidden">
          <div className="w-full overflow-x-auto scrollbar-none flex justify-center">
            <div className="flex items-center justify-center gap-1.5 px-2 min-w-max">
              {[

              { id: "overview", label: "Infos", icon: Compass },
              { id: "itinerary", label: "Diário", icon: MapPin },
              { id: "costs", label: "Finanças", icon: DollarSign },
              { id: "documents", label: "Cofre", icon: FileText },
              { id: "calendar", label: "Agenda", icon: CalendarIcon },
              { id: "chat", label: "Chat", icon: MessageCircle },
              { id: "settings", label: "Config", icon: Settings },
              ...(isAdmin ? [{ id: "admin", label: "Admin", icon: ShieldCheck }] : [])
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (!planAccess.canAccessTab(tab.id)) {
                      setBlockedFeatureName(`aba ${tab.label}`);
                      setShowTrialExpiredModal(true);
                      return;
                    }
                    setActiveTab(tab.id);
                  }}
                  className="flex flex-col items-center gap-1 py-0.5 px-2 text-center cursor-pointer transition-all relative shrink-0"
                >
                  <div className={`p-1.5 rounded-xl transition-all relative ${
                    active 
                      ? "bg-indigo-50 text-indigo-600 scale-105" 
                      : "text-slate-400 hover:text-slate-600"
                  }`}>
                    <Icon className="w-5 h-5 shrink-0" />
                    {tab.id === "chat" && unreadChatCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-extrabold text-[8px] px-1 min-w-[14px] h-3.5 rounded-full flex items-center justify-center border border-white">
                        {unreadChatCount}
                      </span>
                    )}
                  </div>
                  <span className={`text-[9px] tracking-tight transition-all font-extrabold ${
                    active ? "text-indigo-600" : "text-slate-400"
                  }`}>
                    {tab.label}
                  </span>
                  {active && (
                    <motion.div 
                      layoutId="activeTabIndicator" 
                      className="absolute -bottom-2.5 w-6 h-1 bg-indigo-600 rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
            </div>
          </div>
        </div>

        {/* ACTIVE PORTAL TAB */}
        <div className="min-h-[500px]">
          {isFetchingCloud ? (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-xl mx-auto my-12 bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xl text-center space-y-4"
            >
              <div className="w-16 h-16 bg-slate-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner relative">
                <Compass className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-sm font-extrabold text-slate-800 tracking-tight uppercase">Sincronizando Viagens...</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Acessando as credenciais e roteiros do viajante no servidor seguro de banco de dados.
                </p>
              </div>
            </motion.div>
          ) : itineraries.length === 0 || !activeItineraryId ? (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-xl mx-auto my-12 bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xl text-center space-y-6"
            >
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Compass className="w-8 h-8 animate-spin-slow text-indigo-600" />
              </div>
              
              {isTravelerMode ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="inline-block px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-wider">Acesso Restrito</span>
                    <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Nenhuma Viagem Vinculada</h2>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
                      O e-mail <strong className="text-slate-800 font-bold">{travelerEmail}</strong> não está previamente vinculado a nenhum grupo de viagem. Peça ao organizador para cadastrar seu e-mail no painel de viajantes!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all shadow-xs"
                  >
                    Voltar para o Login
                  </button>
                </div>
              ) : (
                <FirstAccessOnboarding
                  token={token}
                  isOffline={isOffline}
                  currentUser={currentUser}
                  onImportGeneratedItinerary={(title, data) => {
                    if (planAccess.trialExpired) {
                      setBlockedFeatureName("gerar novos roteiros com IA");
                      setShowTrialExpiredModal(true);
                      return;
                    }
                    handleImportGeneratedItinerary(title, data);
                  }}
                  onCreateManualItinerary={(title) => {
                    if (planAccess.trialExpired) {
                      setBlockedFeatureName("criar novos roteiros");
                      setShowTrialExpiredModal(true);
                      return;
                    }
                    handleCreateItinerary(title);
                  }}
                />
              )}
            </motion.div>
          ) : (
            <>
              {activeTab === "overview" && (
                <OverviewTab 
                  title={itineraries.find(i => String(i.id) === String(activeItineraryId))?.title || "Sua Viagem"}
                  destinations={activeDestinations}
                  flights={activeFlights}
                  travelers={activeTravelers}
                  costs={activeCosts}
                  setActiveTab={setActiveTab}
                  setSelectedDestinationId={setSelectedDestinationId}
                  onUpdateFlight={handleUpdateFlight}
                  onAddFlight={handleAddFlight}
                  onRemoveFlight={handleRemoveFlight}
                  token={token}
                  isOffline={isOffline}
                  onImportGeneratedItinerary={handleImportGeneratedItinerary}
                  isReadOnly={isTravelerMode}
                  currentUser={currentUser}
                  onEditDestination={handleEditDestination}
                  onRemoveDestination={handleRemoveDestination}
                  onRateDestination={handleRateDestination}
                  onAddNotification={(alertObj) => {
                    const newAlert = {
                      id: `alert-${Date.now()}`,
                      time: "Agora mesmo",
                      read: false,
                      ...alertObj
                    };
                    setNotifications((prev) => [newAlert, ...prev]);
                  }}
                />
              )}

              {activeTab === "itinerary" && (
                <ItineraryTab 
                  destinations={activeDestinations}
                  costs={activeCosts}
                  onAddActivity={handleAddActivity}
                  onRemoveActivity={handleRemoveActivity}
                  onEditActivity={handleEditActivity}
                  currentTips={generalTips}
                  selectedDestinationId={selectedDestinationId}
                  setSelectedDestinationId={setSelectedDestinationId}
                  onSyncWashington={handleSyncWashington}
                  onSyncAllDefaultDestinations={handleSyncAllDefaultDestinations}
                  onImportDestinationDays={handleImportDestinationDays}
                  onUpdateHotelAndCost={handleUpdateHotelAndCost}
                  onAddTip={handleAddTip}
                  onEditTip={handleEditTip}
                  onRemoveTip={handleRemoveTip}
                  onAddDestination={handleAddDestination}
                  onEditDestination={handleEditDestination}
                  onRemoveDestination={handleRemoveDestination}
                  onAddDay={handleAddDay}
                  isReadOnly={isTravelerMode}
                  travelers={activeTravelers}
                  onUpdateTravelerChecklists={handleUpdateTravelerChecklists}
                  currentUser={currentUser}
                  onOptimizeDayRoute={handleOptimizeDayRoute}
                  itineraryId={activeItineraryId}
                />
              )}

              {activeTab === "costs" && (
                <CostsTab 
                  costs={activeCosts}
                  costCategories={costCategories}
                  setCostCategories={setCostCategories}
                  travelers={activeTravelers}
                  onAddCost={handleAddCost}
                  onRemoveCost={handleRemoveCost}
                  onUpdateCostStatus={handleUpdateCostStatus}
                  onEditCost={handleEditCost}
                  isReadOnly={isTravelerMode}
                  currentUser={currentUser}
                />
              )}

              {activeTab === "documents" && (
                <DocumentsTab 
                  documents={activeDocuments}
                  onAddDocument={handleAddDocument}
                  onRemoveDocument={handleRemoveDocument}
                  isOffline={isOffline}
                  destinations={activeDestinations}
                  costs={activeCosts}
                  travelers={activeTravelers}
                  isReadOnly={isTravelerMode}
                  currentUser={currentUser}
                />
              )}

              {activeTab === "calendar" && (
                <CalendarTab 
                  destinations={destinations}
                  setActiveTab={setActiveTab}
                  setSelectedDestinationId={setSelectedDestinationId}
                />
              )}

              {activeTab === "chat" && activeItineraryId && (() => {
                let chatUserName = currentUser?.name || currentUser?.email || "Você";
                if (currentUser?.email) {
                  const matched = activeTravelers.find(t => t.email?.toLowerCase().trim() === currentUser.email.toLowerCase().trim());
                  if (matched && matched.name) chatUserName = matched.name;
                }
                
                return (
                  <ChatTab 
                    itineraryId={activeItineraryId}
                    currentUser={{ name: chatUserName, id: currentUser?.id || 1, email: currentUser?.email }}
                    travelers={activeTravelers}
                  />
                );
              })()}
            </>
          )}

          {activeTab === "settings" && activeItineraryId && (
            <SettingsTab
              itineraryId={activeItineraryId}
              isTravelerMode={isTravelerMode}
              currentUser={currentUser}
              isAdmin={isAdmin}
              travelers={activeTravelers}
              destinations={activeDestinations}
              costs={activeCosts}
              ecoMode={itineraries.find(it => it.id === activeItineraryId)?.ecoMode || false}
              onToggleEcoMode={async () => {
                const currentEco = itineraries.find(it => it.id === activeItineraryId)?.ecoMode || false;
                try {
                  const headers: any = { "Content-Type": "application/json" };
                  if (token) headers["Authorization"] = `Bearer ${token}`;
                  const res = await fetch(`/api/itineraries/${activeItineraryId}`, {
                    method: "PUT",
                    headers,
                    body: JSON.stringify({ ecoMode: !currentEco })
                  });
                  if (res.ok) {
                    setItineraries(prev => prev.map(it => it.id === activeItineraryId ? { ...it, ecoMode: !currentEco } : it));
                    alert(`Modo Econômico ${!currentEco ? 'Ativado' : 'Desativado'}!`);
                  }
                } catch (e) {
                  alert("Erro ao alterar modo econômico");
                }
              }}
            />
          )}

          {activeTab === "admin" && isAdmin && activeItineraryId && (
            <AdminDashboard
              travelers={travelers}
              onRemoveTraveler={handleRemoveTraveler}
              onRestoreTraveler={handleRestoreTraveler}
              onAddTraveler={handleAddTraveler}
              onEditTraveler={handleEditTraveler}
              costs={costs}
              onRemoveCost={handleRemoveCost}
              onRestoreCost={handleRestoreCost}
              destinations={destinations}
              onRemoveDestination={handleRemoveDestination}
              onRestoreDestination={handleRestoreDestination}
              flights={flights}
              onRemoveFlight={handleRemoveFlight}
              onRestoreFlight={handleRestoreFlight}
              onAddFlight={handleAddFlight}
              onUpdateFlight={handleUpdateFlight}
              documents={documents}
              onRemoveDocument={handleRemoveDocument}
              onRestoreDocument={handleRestoreDocument}
              currentUser={currentUser}
              transactionLogs={transactionLogs}
              itineraryId={activeItineraryId}
              token={token}
            />

          )}

        </div>

      </main>

      {/* COMPACT FOOTER FOOTPRINT */}
      <footer className="bg-slate-900 border-t border-slate-950 p-6 md:px-8 text-center text-xs text-slate-400 pb-20 md:pb-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 KedGo!. Seu Roteiro Personalizado para {activeTravelers.length} {activeTravelers.length === 1 ? 'Viajante' : 'Viajantes'}.</p>
          <div className="flex gap-4">
            <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Sincronizado</span>
            <span className="inline-flex items-center gap-1 text-indigo-400 font-bold">Local Host: 3000 Active</span>
          </div>
        </div>
      </footer>

      {showTravelerPasswordPrompt && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl text-center space-y-5 animate-slideUp">
            <div className="mx-auto w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
              <Key className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-800">Primeiro Acesso!</h2>
            <p className="text-sm font-semibold text-slate-500">
              Percebemos que este é o seu primeiro acesso. Recomendamos cadastrar ou redefinir sua senha para garantir melhor segurança.
            </p>
            
            {travelerPasswordMsg && (
              <div className={`p-2 rounded-lg text-xs font-bold ${travelerPasswordError ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                {travelerPasswordMsg}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nova Senha</label>
                <input 
                  type="password"
                  value={travelerNewPassword}
                  onChange={(e) => setTravelerNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-400 text-sm font-medium"
                />
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <button 
                  onClick={async () => {
                     setTravelerPasswordMsg("");
                     setTravelerPasswordError(false);
                     if (travelerNewPassword.length < 6) {
                       setTravelerPasswordError(true);
                       setTravelerPasswordMsg("A senha deve ter pelo menos 6 caracteres.");
                       return;
                     }
                     try {
                        const email = currentUser?.email;
                        const res = await fetch("/api/auth/register", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ email: email, password: travelerNewPassword, name: currentUser?.name || "Viajante" })
                        });
                        const data = await res.json();
                        if (!res.ok) {
                          if (data.error && data.error.includes("já cadastrado")) {
                            setTravelerPasswordMsg("Sua conta já possui senha. Caso tenha esquecido, use o recuperar senha na tela inicial.");
                            setTravelerPasswordError(true);
                          } else {
                            throw new Error(data.error || "Erro ao definir senha.");
                          }
                        } else {
                          setTravelerPasswordError(false);
                          setTravelerPasswordMsg("Senha redefinida com sucesso!");
                          // Switch to true native user
                          setTimeout(() => {
                            setShowTravelerPasswordPrompt(false);
                            handleLogin(data.token, data.user);
                          }, 1500);
                        }
                     } catch(err: any) {
                        setTravelerPasswordError(true);
                        setTravelerPasswordMsg(err.message);
                     }
                  }}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 cursor-pointer"
                >
                  Cadastrar Senha Agora
                </button>
                <button 
                  onClick={() => {
                    if (currentUser?.email || travelerEmail) {
                      sessionStorage.setItem(`traveler_dismissed_prompt_${currentUser?.email || travelerEmail}`, "true");
                    }
                    setShowTravelerPasswordPrompt(false);
                  }}
                  className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Lembrar Mais Tarde
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Floating In-App Chat Toast Push Banners Overlay */}
      <div className="fixed top-4 right-4 z-[9999] max-w-sm w-full pointer-events-none flex flex-col gap-2">
        <AnimatePresence>
          {chatToasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              onClick={() => {
                setActiveTab("chat");
                setChatToasts(prev => prev.filter(t => t.id !== toast.id));
              }}
              className="pointer-events-auto bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 shadow-2xl flex items-start gap-3 cursor-pointer hover:bg-slate-800 transition-colors"
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                toast.isPrivate ? "bg-rose-500 text-white" : "bg-indigo-55 bg-indigo-500 text-white"
              }`}>
                {toast.senderName ? toast.senderName[0].toUpperCase() : "U"}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-xs text-slate-200 truncate">{toast.senderName}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider shrink-0 ${
                    toast.isPrivate ? "bg-rose-500/20 text-rose-300" : "bg-indigo-500/20 text-indigo-300"
                  }`}>
                    {toast.isPrivate ? "Privada" : "Grupo"}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] leading-snug mt-1 truncate">{toast.content}</p>
                <span className="text-[8px] text-slate-500 block mt-1">Toque para responder no Chat</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* KedGo! Interactive Modals */}
      <ReferralModal
        isOpen={showReferralModal}
        onClose={() => setShowReferralModal(false)}
        currentUser={currentUser}
        token={token}
        isLifetimePro={userPlan === 'pro_lifetime'}
      />

      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        token={token}
        activeItineraryId={activeItineraryId}
        onSuccess={(newPlan) => {
          setUserPlan(newPlan);
          alert(`Parabéns! Seu plano foi atualizado para ${newPlan === 'pro_lifetime' ? 'KedGo! Pro Vitalício' : 'Passe KedGo!'}.`);
        }}
        initialPlan="pro_lifetime"
      />

      <KedIAGuideModal
        isOpen={showKedIAGuideModal}
        onClose={() => setShowKedIAGuideModal(false)}
        onGenerateItinerary={(payload) => {
          handleImportGeneratedItinerary(`Viagem para ${payload.destination} (${payload.days} dias)`, payload);
        }}
      />

      <TrialExpiredModal
        isOpen={showTrialExpiredModal}
        onClose={() => setShowTrialExpiredModal(false)}
        onOpenCheckout={() => setShowCheckoutModal(true)}
        featureName={blockedFeatureName}
      />

    </div>
  );
}
