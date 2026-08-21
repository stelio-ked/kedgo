import React, { useState } from "react";
import { X, Plus, Trash2, Tag } from "lucide-react";
import { CostCategory } from "../types";

interface CostCategoriesModalProps {
  categories: CostCategory[];
  onUpdate: (categories: CostCategory[]) => void;
  onClose: () => void;
}

export default function CostCategoriesModal({ categories, onUpdate, onClose }: CostCategoriesModalProps) {
  const [localCategories, setLocalCategories] = useState<CostCategory[]>(categories);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#6366F1");

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    const newCat = {
      id: `cat-${Date.now()}`,
      label: newLabel.trim(),
      color: newColor
    };
    setLocalCategories([...localCategories, newCat]);
    setNewLabel("");
  };

  const handleRemove = (id: string) => {
    if (localCategories.length <= 1) {
      alert("Você precisa ter pelo menos uma categoria.");
      return;
    }
    setLocalCategories(localCategories.filter(c => c.id !== id));
  };

  const handleSave = () => {
    onUpdate(localCategories);
    onClose();
  };

  const sortedLocalCategories = [...localCategories].sort((a, b) => {
    if (a.id === "other" || a.label.toLowerCase() === "outros") return 1;
    if (b.id === "other" || b.label.toLowerCase() === "outros") return -1;
    return a.label.localeCompare(b.label);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-600" />
            <h3 className="font-extrabold text-slate-800">Gerenciar Categorias</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto">
          <div className="space-y-3 mb-6">
            {sortedLocalCategories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="font-semibold text-sm text-slate-700">{cat.label}</span>
                </div>
                <button
                  onClick={() => handleRemove(cat.id)}
                  className="text-red-400 hover:text-red-600 p-1 rounded-md transition-colors"
                  title="Remover"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nova Categoria</h4>
            <div className="flex gap-2">
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="w-10 h-10 p-1 rounded-lg border border-slate-200 cursor-pointer shrink-0"
              />
              <input
                type="text"
                placeholder="Ex:: Alimentação"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={handleAdd}
                className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shrink-0"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 font-bold text-sm text-slate-500 hover:bg-slate-200 rounded-xl transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} className="px-5 py-2 font-bold text-sm text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors shadow-sm">
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
