import React, { useState, useEffect } from "react";
import { 
  Wifi, 
  WifiOff, 
  Share2, 
  Bell, 
  Users, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  X,
  Info,
  Pencil,
  ChevronDown,
  Sun,
  Moon,
  Menu,
  LogOut,
  Settings,
  Star,
  Gift,
  Sparkles,
  Key
} from "lucide-react";
import { Traveler, NotificationAlert } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { canDeleteEntity } from "../utils";
import { hasVisitorApiKey } from "../utils/geminiClient";
import KedGoLogo from "./KedGoLogo";
import ApiKeyModal from "./ApiKeyModal";

interface HeaderProps {
  isOffline: boolean;
  setIsOffline: (val: boolean) => void;
  notificationPermission?: string;
  onRequestNotificationPermission?: () => void;
  travelers: Traveler[];
  onAddTraveler: (name: string, email?: string) => void;
  onRemoveTraveler: (id: string) => void;
  onEditTraveler: (id: string, name: string, email?: string, role?: string) => void;
  notifications: NotificationAlert[];
  onMarkNotificationRead: (id: string) => void;
  onClearNotifications: () => void;
  onSimulateNotification: () => void;
  onMigrateData?: () => void;
  onLogout?: () => void;
  // Itinerary/viagens management props
  itineraries: { id: string | number; title: string }[];
  activeItineraryId: string | number | null;
  onSelectItinerary: (id: string | number) => void;
  onCreateItinerary: (title: string) => void;
  onRenameItinerary: (id: string | number, title: string) => void;
  onDeleteItinerary: (id: string | number) => void;
  favoriteItineraryId?: string | number | null;
  onSetFavoriteItinerary?: (id: string | number) => void;
  isTravelerMode?: boolean;
  currentUser?: { name?: string; email?: string } | null;
  unreadChatCount?: number;
  onOpenChatTab?: () => void;
  onOpenReferralModal?: () => void;
  onOpenCheckoutModal?: () => void;
  canCreateItinerary?: boolean;
}

export default function Header({
  isOffline,
  setIsOffline,
  notificationPermission,
  onRequestNotificationPermission,
  travelers,
  onAddTraveler,
  onRemoveTraveler,
  onEditTraveler,
  notifications,
  onMarkNotificationRead,
  onClearNotifications,
  onSimulateNotification,
  onMigrateData,
  onLogout,
  // Itinerary management props
  itineraries = [],
  activeItineraryId,
  onSelectItinerary,
  onCreateItinerary,
  onRenameItinerary,
  onDeleteItinerary,
  favoriteItineraryId,
  onSetFavoriteItinerary,
  isTravelerMode = false,
  currentUser,
  unreadChatCount = 0,
  onOpenChatTab,
  onOpenReferralModal,
  onOpenCheckoutModal,
  canCreateItinerary = true,
}: HeaderProps) {
  const [showTravelersModal, setShowTravelersModal] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('meu_agente_dark_theme');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return document.body.classList.contains('dark-theme');
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('meu_agente_dark_theme', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Itinerary management UI states
  const [showItinerariesDropdown, setShowItinerariesDropdown] = useState(false);
  const [isCreatingNewItinerary, setIsCreatingNewItinerary] = useState(false);
  const [newItineraryTitle, setNewItineraryTitle] = useState("");
  const [editingItineraryId, setEditingItineraryId] = useState<string | number | null>(null);
  const [editingItineraryTitle, setEditingItineraryTitle] = useState("");
  const [deletingItineraryId, setDeletingItineraryId] = useState<string | number | null>(null);

  const userEmailNormalized = currentUser?.email?.toLowerCase().trim() || "";
  const currentUserTraveler = userEmailNormalized 
    ? travelers.find(t => t.email?.toLowerCase().trim() === userEmailNormalized)
    : undefined;
  const userRole = currentUserTraveler?.role || "Viajante";

  // Traveler input state
  const [newTravelerName, setNewTravelerName] = useState("");
  const [newTravelerEmail, setNewTravelerEmail] = useState("");
  const [newTravelerRole, setNewTravelerRole] = useState("Viajante");
  const [editingTravelerId, setEditingTravelerId] = useState<string | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2005);
  };

  const handleStartEditTraveler = (traveler: Traveler) => {
    setEditingTravelerId(traveler.id);
    setNewTravelerName(traveler.name);
    setNewTravelerEmail(traveler.email || "");
    setNewTravelerRole(traveler.role || "Viajante");
  };

  const handleCancelEdit = () => {
    setEditingTravelerId(null);
    setNewTravelerName("");
    setNewTravelerEmail("");
    setNewTravelerRole("Viajante");
  };

  const handleAddTravelerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTravelerName.trim()) return;
    if (editingTravelerId) {
      onEditTraveler(editingTravelerId, newTravelerName.trim(), newTravelerEmail.trim() || undefined, newTravelerRole);
      setEditingTravelerId(null);
    } else {
      onAddTraveler(newTravelerName.trim(), newTravelerEmail.trim() || undefined);
    }
    setNewTravelerName("");
    setNewTravelerEmail("");
    setNewTravelerRole("Viajante");
  };

  const handleRemoveTravelerClick = (id: string) => {
    if (editingTravelerId === id) {
      handleCancelEdit();
    }
    onRemoveTraveler(id);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#1E3A5F] text-white border-b border-[#162B48] shadow-md px-3.5 sm:px-5 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        
        {/* Left: Branding & Itinerary Selector */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 shrink">
          {/* Direct Transparent Medallion Stamp Logo & Typography */}
          <div className="shrink-0 flex items-center gap-2">
            <div className="flex items-center justify-center shrink-0">
              <KedGoLogo variant="mark" size={38} />
            </div>
            <div className="flex items-baseline font-black tracking-tight select-none">
              <span className="text-xl sm:text-2xl font-extrabold text-white">Ked</span>
              <span className="text-[#D95D39] text-xl sm:text-2xl font-black italic ml-0.5">Go!</span>
            </div>
          </div>

          <div className="h-5 w-px bg-white/20 hidden sm:block shrink-0" />
          
          <div className="relative flex flex-col items-start min-w-0">
            <button
              onClick={() => setShowItinerariesDropdown(!showItinerariesDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-all cursor-pointer min-w-0 max-w-[130px] sm:max-w-[200px] md:max-w-[260px]"
              title="Alternar Viagem"
            >
              <span className="text-xs font-bold text-slate-100 truncate block">
                {itineraries.find(it => String(it.id) === String(activeItineraryId))?.title || "Minhas Viagens"}
              </span>
              {String(activeItineraryId) === String(favoriteItineraryId) && (
                <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-300 shrink-0 ml-0.5" />
            </button>

            {/* Dropdown for Voyages/Itineraries */}
            {showItinerariesDropdown && (
              <div 
                className="fixed inset-0 z-30 bg-transparent" 
                onClick={() => setShowItinerariesDropdown(false)}
              />
            )}
            <AnimatePresence>
              {showItinerariesDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 mt-2 w-80 bg-white border border-slate-150 rounded-2xl shadow-xl z-40 overflow-hidden font-sans text-xs"
                  >
                    <div className="p-4 border-b border-slate-50 bg-slate-50/80">
                      <h3 className="font-extrabold text-slate-800">Minhas Viagens</h3>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">Crie, edite ou alterne entre seus destinos</p>
                    </div>

                    {/* New Itinerary Input / Pro Lock */}
                    {!isTravelerMode && (
                      <div className="p-3 border-b border-slate-50 bg-indigo-55/10">
                        {canCreateItinerary ? (
                          <div className="flex gap-1.5 items-center">
                            <input
                              type="text"
                              placeholder="Adicionar viagem..."
                              value={newItineraryTitle}
                              onChange={(e) => setNewItineraryTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && newItineraryTitle.trim()) {
                                  onCreateItinerary(newItineraryTitle.trim());
                                  setNewItineraryTitle("");
                                }
                              }}
                              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 grow font-bold text-slate-700 focus:outline-hidden focus:border-indigo-400 placeholder-slate-400"
                            />
                            <button
                              onClick={() => {
                                if (newItineraryTitle.trim()) {
                                  onCreateItinerary(newItineraryTitle.trim());
                                  setNewItineraryTitle("");
                                }
                              }}
                              className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer"
                              title="Criar Nova Viagem"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setShowItinerariesDropdown(false);
                              if (onOpenCheckoutModal) onOpenCheckoutModal();
                            }}
                            className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Criar mais viagens (Exclusivo Pro)</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Itineraries List */}
                    <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                      {itineraries.length === 0 ? (
                        <div className="p-4 text-center text-slate-400 font-medium font-mono text-[10px]">
                          Nenhuma viagem cadastrada
                        </div>
                      ) : (
                        itineraries.map((it) => {
                          const isSelected = String(it.id) === String(activeItineraryId);
                          const isEditing = editingItineraryId === it.id;
                          
                          return (
                            <div
                              key={it.id}
                              className={`group/item flex items-center justify-between p-2 rounded-xl border transition-all ${
                                isSelected
                                  ? "bg-indigo-50 border-indigo-200 text-indigo-900 shadow-xs"
                                  : "bg-white hover:bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-700"
                              }`}
                            >
                              {isEditing ? (
                                <div className="flex items-center gap-1.5 grow">
                                  <input
                                    type="text"
                                    value={editingItineraryTitle}
                                    onChange={(e) => setEditingItineraryTitle(e.target.value)}
                                    className="bg-white border border-indigo-400 rounded-lg px-2 py-1 grow font-bold text-slate-800 focus:outline-hidden text-xs"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" && editingItineraryTitle.trim()) {
                                        onRenameItinerary(it.id, editingItineraryTitle.trim());
                                        setEditingItineraryId(null);
                                      } else if (e.key === "Escape") {
                                        setEditingItineraryId(null);
                                      }
                                    }}
                                  />
                                  <button
                                    onClick={() => {
                                      if (editingItineraryTitle.trim()) {
                                        onRenameItinerary(it.id, editingItineraryTitle.trim());
                                        setEditingItineraryId(null);
                                      }
                                    }}
                                    className="p-1 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 cursor-pointer flex items-center justify-center"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingItineraryId(null)}
                                    className="p-1 bg-slate-200 text-slate-650 rounded-md hover:bg-slate-300 cursor-pointer flex items-center justify-center"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      onSelectItinerary(it.id);
                                      setShowItinerariesDropdown(false);
                                    }}
                                    className="grow text-left font-extrabold pr-2 focus:outline-hidden cursor-pointer"
                                  >
                                    <div className="flex items-center gap-1.5 font-sans">
                                      {isSelected && (
                                        <span className="w-2 h-2 bg-indigo-600 rounded-full shrink-0" />
                                      )}
                                      <span className="font-extrabold text-[11px] uppercase tracking-wide truncate max-w-[150px]">{it.title}</span>
                                      {String(it.id) === String(favoriteItineraryId) && (
                                        <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                                      )}
                                    </div>
                                  </button>

                                  {!isTravelerMode && (
                                    <div className="flex items-center gap-1 select-none shrink-0">
                                      {deletingItineraryId === it.id ? (
                                        <div className="flex items-center gap-1 text-[9px] bg-rose-50 border border-rose-250 px-1.5 py-0.5 rounded-lg shrink-0">
                                          <span className="font-extrabold text-rose-700">Deletar?</span>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onDeleteItinerary(it.id);
                                              setDeletingItineraryId(null);
                                            }}
                                            className="px-1.5 py-0.5 bg-rose-650 hover:bg-rose-700 text-white font-extrabold rounded-md cursor-pointer text-[9px]"
                                          >
                                            Sim
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setDeletingItineraryId(null);
                                            }}
                                            className="px-1.5 py-0.5 bg-slate-250 hover:bg-slate-300 text-slate-700 font-bold rounded-md cursor-pointer text-[9px]"
                                          >
                                            Não
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1">
                                          {/* Toggle Favorite Star Button */}
                                          {onSetFavoriteItinerary && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                onSetFavoriteItinerary(String(it.id) === String(favoriteItineraryId) ? null as any : it.id);
                                              }}
                                              className={`p-1 rounded-md transition-all cursor-pointer ${
                                                String(it.id) === String(favoriteItineraryId)
                                                  ? "text-amber-500 bg-amber-50 hover:bg-amber-100"
                                                  : "text-slate-300 hover:text-amber-500 hover:bg-amber-50 focus:opacity-100 group-hover/item:opacity-100 sm:opacity-0"
                                              }`}
                                              title={String(it.id) === String(favoriteItineraryId) ? "Remover de Favorita" : "Tornar Viagem Favorita"}
                                            >
                                              <Star className="w-3.5 h-3.5" fill={String(it.id) === String(favoriteItineraryId) ? "currentColor" : "none"} />
                                            </button>
                                          )}

                                          {/* Rename and Delete Actions */}
                                          <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingItineraryId(it.id);
                                                setEditingItineraryTitle(it.title);
                                              }}
                                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                                              title="Renomear"
                                            >
                                              <Pencil className="w-3 h-3" />
                                            </button>
                                            
                                            {itineraries.length > 1 ? (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setDeletingItineraryId(it.id);
                                                }}
                                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                                title="Excluir"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            ) : null}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                    {/* Logout Option Inside Dropdown */}
                    {onLogout && (
                      <div className="p-2 border-t border-slate-100">
                        <button
                          onClick={onLogout}
                          className="w-full flex items-center gap-2 p-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sair da Conta</span>
                        </button>
                      </div>
                    )}
                  </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Clean Pro Controls (Notification Bell & Profile Avatar) */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          
          {/* Notifications Button */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all relative border border-white/10 cursor-pointer"
              title="Notificações e Alertas"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-200" />
              {(unreadCount > 0 || unreadChatCount > 0) && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#D95D39] rounded-full ring-2 ring-[#1E3A5F] animate-pulse" />
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotificationsDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-transparent" 
                  onClick={() => setShowNotificationsDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-80 bg-white text-slate-800 border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden text-sm">
                  <div className="p-4 border-b border-slate-100 flex flex-col gap-3 bg-slate-50/80">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-slate-800">Alertas de Vôo e Roteiro</h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={onSimulateNotification}
                          className="text-[10px] bg-[#1E3A5F]/10 text-[#1E3A5F] font-bold px-2 py-1 rounded-md hover:bg-[#1E3A5F]/20 transition-colors cursor-pointer"
                          title="Testar Notificação"
                        >
                          Simular
                        </button>
                        {notifications.length > 0 && (
                          <button 
                            onClick={onClearNotifications}
                            className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                          >
                            Limpar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {unreadChatCount > 0 && onOpenChatTab && (
                      <div 
                        onClick={() => {
                          setShowNotificationsDropdown(false);
                          onOpenChatTab();
                        }}
                        className="p-4 bg-orange-50/50 hover:bg-orange-50 transition-colors flex gap-3 items-start cursor-pointer"
                      >
                        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-[#D95D39]" />
                        <div className="flex flex-col gap-0.5">
                          <p className="font-bold text-slate-900 text-xs">Mensagens no Chat da Viagem</p>
                          <p className="text-slate-600 text-xs">
                            Você possui <strong className="text-[#D95D39]">{unreadChatCount}</strong> {unreadChatCount === 1 ? 'mensagem nova não lida' : 'mensagens novas não lidas'}.
                          </p>
                          <span className="text-[10px] text-[#D95D39] font-bold mt-1">Toque para abrir o Chat →</span>
                        </div>
                      </div>
                    )}

                    {notifications.length === 0 && unreadChatCount === 0 ? (
                      <div className="p-8 text-center text-slate-400 font-medium text-xs">
                        Nenhum alerta recente.
                      </div>
                    ) : (
                      notifications.map((alert) => (
                        <div 
                          key={alert.id}
                          onClick={() => onMarkNotificationRead(alert.id)}
                          className={`p-4 transition-colors flex gap-3 items-start cursor-pointer ${
                            !alert.read ? "bg-amber-50/30 hover:bg-amber-50/60" : "hover:bg-slate-50"
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            !alert.read ? "bg-[#D95D39]" : "bg-slate-200"
                          }`} />
                          <div className="flex flex-col gap-0.5">
                            <p className={`text-xs ${!alert.read ? "font-bold text-slate-900" : "text-slate-600"}`}>
                              {alert.title}
                            </p>
                            <p className="text-slate-500 text-xs leading-relaxed">
                              {alert.description || alert.message}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1">{alert.time}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Profile Avatar with dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
              className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-[#D95D39] transition-all cursor-pointer"
              title="Perfil e Ajustes"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-[#D95D39] to-[#C86446] text-white font-black flex items-center justify-center text-sm shadow-md border-2 border-white/30 relative">
                {(currentUser?.name || currentUser?.email || "U")[0].toUpperCase()}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#1E3A5F]" />
              </div>
            </button>

            {showSettingsDropdown && (
              <div 
                className="fixed inset-0 z-40 bg-transparent" 
                onClick={() => setShowSettingsDropdown(false)}
              />
            )}
            <AnimatePresence>
              {showSettingsDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-72 bg-white text-slate-800 border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden font-sans text-xs"
                  >
                    {/* User Profile Header in Dropdown */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#D95D39] to-[#C86446] text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-xs">
                        {(currentUser?.name || currentUser?.email || "U")[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {currentUser?.name || currentUser?.email?.split("@")[0] || "Usuário"}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate">
                          {currentUser?.email || "Sem e-mail"}
                        </span>
                      </div>
                    </div>
                    
                    {/* Fast Quick Links */}
                    <div className="p-2 border-b border-slate-100 space-y-1">
                      {onOpenCheckoutModal && (
                        <button
                          onClick={() => {
                            setShowSettingsDropdown(false);
                            onOpenCheckoutModal();
                          }}
                          className="w-full py-2 px-3 bg-gradient-to-r from-[#D95D39] to-[#C86446] text-white rounded-xl font-extrabold flex items-center justify-between text-xs cursor-pointer hover:opacity-95 shadow-2xs"
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            <span>Assinatura KedGo! Pro</span>
                          </div>
                          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">PRO</span>
                        </button>
                      )}

                      {onOpenReferralModal && (
                        <button
                          onClick={() => {
                            setShowSettingsDropdown(false);
                            onOpenReferralModal();
                          }}
                          className="w-full flex items-center gap-2.5 p-2 rounded-xl text-amber-900 bg-amber-50/80 hover:bg-amber-100/80 font-bold transition-colors cursor-pointer"
                        >
                          <Gift className="w-4 h-4 text-amber-600" />
                          <span>Indique & Ganhe (Pro Grátis)</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setShowSettingsDropdown(false);
                          setShowTravelersModal(true);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-500" />
                          <span>Membros & Viajantes</span>
                        </div>
                        <span className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          {travelers.length}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setShowSettingsDropdown(false);
                          setShowShareModal(true);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Share2 className="w-4 h-4 text-slate-500" />
                          <span>Compartilhar Roteiro</span>
                        </div>
                      </button>
                    </div>

                    {/* General Settings */}
                    <div className="p-2 flex flex-col gap-1">
                      {/* Theme Toggle */}
                      <button
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-semibold cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          {isDarkMode ? <Sun className="w-4 h-4 text-slate-500" /> : <Moon className="w-4 h-4 text-slate-500" />}
                          <span>Modo {isDarkMode ? "Claro" : "Escuro"}</span>
                        </div>
                      </button>
                      
                      {/* Offline Mode */}
                      <button
                        onClick={() => setIsOffline(!isOffline)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors font-semibold cursor-pointer ${
                          isOffline 
                            ? "bg-amber-50 text-amber-900" 
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isOffline ? <WifiOff className="w-4 h-4 text-amber-600" /> : <Wifi className="w-4 h-4 text-emerald-500" />}
                          <span>Modo Offline</span>
                        </div>
                        <div className={`w-8 h-4 rounded-full flex items-center px-0.5 transition-colors ${isOffline ? 'bg-amber-500 justify-end' : 'bg-slate-300 justify-start'}`}>
                          <div className="w-3 h-3 bg-white rounded-full shadow-xs" />
                        </div>
                      </button>

                      {/* Gemini API Key */}
                      <button
                        onClick={() => {
                          setShowSettingsDropdown(false);
                          setShowApiKeyModal(true);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-semibold cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4 text-amber-500" />
                          <span>Chave Gemini AI</span>
                        </div>
                        {hasVisitorApiKey() ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Ativa</span>
                        ) : (
                          <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-full">Grátis</span>
                        )}
                      </button>
                    </div>

                    {/* Logout Option */}
                    {onLogout && (
                      <div className="p-2 border-t border-slate-100">
                        <button
                          onClick={onLogout}
                          className="w-full flex items-center gap-2 p-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sair da Conta</span>
                        </button>
                      </div>
                    )}
                  </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* MODAL: Travelers List & Add/Remove */}
      <AnimatePresence>
        {showTravelersModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-extrabold text-slate-800 text-lg">Grupo de Viajantes ({travelers.length})</h3>
                </div>
                <button 
                  onClick={() => setShowTravelersModal(false)}
                  className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[450px] overflow-y-auto">
                {/* Traveler Form */}
                {!isTravelerMode && (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newTravelerName.trim() || !newTravelerEmail.trim()) return;
                      onAddTraveler(newTravelerName.trim(), newTravelerEmail.trim());
                      setNewTravelerName("");
                      setNewTravelerEmail("");
                    }} 
                    className="space-y-3 bg-indigo-50 p-4 rounded-2xl border border-indigo-100/50"
                  >
                    <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                      Adicionar Novo Viajante
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input 
                        type="text" 
                        placeholder="Nome do Viajante" 
                        value={editingTravelerId ? "" : newTravelerName}
                        onChange={(e) => setNewTravelerName(e.target.value)}
                        disabled={!!editingTravelerId}
                        className="text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-400 disabled:opacity-50"
                        required
                      />
                      <input 
                        type="email" 
                        placeholder="E-mail (Obrigatório)" 
                        value={editingTravelerId ? "" : newTravelerEmail}
                        onChange={(e) => setNewTravelerEmail(e.target.value)}
                        disabled={!!editingTravelerId}
                        className="text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-400 disabled:opacity-50"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!!editingTravelerId}
                      className="w-full flex items-center justify-center gap-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Cadastrar no Grupo
                    </button>
                    {editingTravelerId && (
                      <p className="text-[10px] text-indigo-600 font-semibold text-center mt-1">
                        Conclua a edição inline abaixo para liberar o cadastro de novos membros.
                      </p>
                    )}
                  </form>
                )}

                {/* List of Travelers */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Membros Integrados</p>
                  <div className="space-y-1.5">
                    {travelers.map((traveler) => (
                      <div key={traveler.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                        {editingTravelerId === traveler.id ? (
                          <div className="space-y-2.5">
                            <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Editando Viajante</p>
                            <div className="grid grid-cols-1 gap-2">
                              <input 
                                type="text" 
                                placeholder="Nome" 
                                value={newTravelerName}
                                onChange={(e) => setNewTravelerName(e.target.value)}
                                className="text-xs px-3 py-1.5 border border-indigo-300 rounded-lg bg-white focus:outline-hidden focus:border-indigo-500 font-medium text-slate-800"
                                required
                              />
                              <input 
                                type="email" 
                                placeholder="E-mail" 
                                value={newTravelerEmail}
                                onChange={(e) => setNewTravelerEmail(e.target.value)}
                                className="text-xs px-3 py-1.5 border border-indigo-300 rounded-lg bg-white focus:outline-hidden focus:border-indigo-500 text-slate-800"
                              />
                                                  {/* Option with roles select: only visible if the user has editor/organizer permission */}
                              {!isTravelerMode && (
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-indigo-700 uppercase tracking-widest block">Função / Cargo</label>
                                  <select
                                    value={newTravelerRole}
                                    onChange={(e) => setNewTravelerRole(e.target.value)}
                                    className="text-xs px-2.5 py-1.5 w-full border border-indigo-300 rounded-lg bg-white focus:outline-hidden focus:border-indigo-500 font-semibold text-slate-700 cursor-pointer"
                                  >
                                    <option value="Administrador">Administrador</option>
                                    <option value="Organizador">Organizador</option>
                                    <option value="Co-piloto">Co-piloto</option>
                                    <option value="Finanças">Finanças</option>
                                    <option value="Colaborador">Colaborador</option>
                                    <option value="Viajante">Viajante</option>
                                  </select>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-750 font-bold text-xs rounded-lg transition-all cursor-pointer"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (newTravelerName.trim()) {
                                    onEditTraveler(traveler.id, newTravelerName.trim(), newTravelerEmail.trim() || undefined, newTravelerRole);
                                    handleCancelEdit();
                                  }
                                }}
                                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Salvar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-xs shrink-0">
                                {traveler.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-800 truncate">{traveler.name}</p>
                                <p className="text-[10px] text-slate-500 truncate">{traveler.email || "Sem e-mail"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {!isTravelerMode ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditTraveler(traveler)}
                                    className="p-1.5 rounded-lg transition-colors cursor-pointer text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                    title="Editar dados do viajante"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  
                                  {travelers.length > 2 && traveler.role !== "Organizador" && (() => {
                                    const authorized = canDeleteEntity(userRole, currentUser?.email, traveler.createdByEmail);
                                    return (
                                      <button
                                        type="button"
                                        onClick={() => authorized && handleRemoveTravelerClick(traveler.id)}
                                        disabled={!authorized}
                                        className={`p-1.5 rounded-lg transition-colors ${
                                          authorized 
                                            ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" 
                                            : "text-slate-200 bg-slate-50 opacity-40 cursor-not-allowed"
                                        }`}
                                        title={authorized ? "Remover viajante do cálculo de custos" : "Sem permissão de exclusão (apenas Criador ou Administrador)"}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    );
                                  })()}
                                </>
                              ) : null}
                              
                              {traveler.role && (
                                <span className={`text-[9px] border px-2 py-0.5 rounded-full font-bold ml-1 ${
                                  traveler.role === "Administrador"
                                    ? "bg-red-50 text-red-700 border-red-100"
                                    : traveler.role === "Organizador" 
                                    ? "bg-indigo-50 text-indigo-700 border-indigo-100" 
                                    : traveler.role === "Co-piloto"
                                    ? "bg-amber-50 text-amber-700 border-amber-100"
                                    : traveler.role === "Finanças"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                    : traveler.role === "Colaborador"
                                    ? "bg-sky-50 text-sky-700 border-sky-100"
                                    : "bg-slate-100 text-slate-600 border-slate-200"
                                }`}>
                                  {traveler.role === "Administrador"
                                    ? "Admin"
                                    : traveler.role === "Organizador" 
                                    ? "Org" 
                                    : traveler.role === "Co-piloto" 
                                    ? "Co-piloto" 
                                    : traveler.role === "Finanças" 
                                    ? "Finanças" 
                                    : traveler.role === "Colaborador" 
                                    ? "Colab" 
                                    : traveler.role}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: Share Trip Panel */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 p-6 space-y-6"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-extrabold text-slate-800 text-lg">Compartilhar com Viajantes</h3>
                </div>
                <button 
                  onClick={() => setShowShareModal(false)}
                  className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Os outros 7 viajantes do grupo podem acessar este aplicativo e sincronizar os etickets, roteiros de Washington a Nova York e a planilha de custos sincronizada!
                </p>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 divide-y divide-slate-200/50 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">✓</div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Sincronização em Nuvem</p>
                        <p className="text-[10px] text-slate-500">Qualquer alteração offline é sincronizada ao ficar online.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">↻</div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-800">Migrar para Servidor Seguro (PostgreSQL)</p>
                      <p className="text-[10px] text-slate-500">Salva os dados locais na base centralizada para acesso em outros dispositivos.</p>
                    </div>
                    {onMigrateData && (
                      <button 
                         onClick={onMigrateData}
                         className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold shadow-xs whitespace-nowrap"
                      >
                         Sincronizar Cloud
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 block uppercase">Link de Compartilhamento</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={window.location.href} 
                      className="text-xs border border-slate-200 px-3 py-2 bg-slate-50 rounded-xl grow text-slate-500 select-all"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all font-semibold flex items-center gap-1.5"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="text-xs">{copied ? "Copiado!" : "Copiar"}</span>
                    </button>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2.5 items-start">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    <strong>Habilitar Acesso Offline:</strong> Oriente os outros viajantes a abrir este link no celular, clicar em "Compartilhar" e depois em "Adicionar à Tela de Início". O app funcionará perfeitamente off-line nos aeroportos!
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition-all"
                >
                  Entendi
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gemini AI BYOK API Key Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
      />
    </header>
  );
}
