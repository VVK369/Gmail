import React, { useState, useRef, useEffect } from 'react';
import { SubscriptionCategory } from '../types/subscription';
import { CATEGORIES_META, ALL_CATEGORIES } from '../utils/categorizer';
import {
  Newspaper,
  ShoppingBag,
  Cpu,
  TrendingUp,
  Users,
  Plane,
  Film,
  Tag,
  ChevronDown,
} from 'lucide-react';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Newspaper,
  ShoppingBag,
  Cpu,
  TrendingUp,
  Users,
  Plane,
  Film,
  Tag,
};

interface CategoryBadgeProps {
  category: SubscriptionCategory;
  onSelectCategory?: (category: SubscriptionCategory) => void;
  isEditable?: boolean;
  size?: 'sm' | 'md';
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  onSelectCategory,
  isEditable = false,
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const meta = CATEGORIES_META[category] || CATEGORIES_META.other;
  const IconComponent = ICON_MAP[meta.iconName] || Tag;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const sizeClasses =
    size === 'sm' ? 'text-xs px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5 font-medium';

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        disabled={!isEditable}
        onClick={(e) => {
          e.stopPropagation();
          if (isEditable) setIsOpen(!isOpen);
        }}
        aria-label={`Category: ${meta.label}${isEditable ? ' (Click to change)' : ''}`}
        aria-expanded={isOpen}
        className={`inline-flex items-center rounded-md border transition-all ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder} ${sizeClasses} ${
          isEditable ? 'cursor-pointer hover:shadow-xs active:scale-95' : 'cursor-default'
        }`}
      >
        <IconComponent className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>{meta.label}</span>
        {isEditable && <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />}
      </button>

      {isOpen && isEditable && (
        <div className="absolute left-0 mt-1.5 w-52 rounded-xl bg-white shadow-xl border border-slate-200 py-1.5 z-50 text-left animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Assign Category
          </div>
          {ALL_CATEGORIES.map((catKey) => {
            const catMeta = CATEGORIES_META[catKey];
            const CatIcon = ICON_MAP[catMeta.iconName] || Tag;
            const isSelected = catKey === category;

            return (
              <button
                key={catKey}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCategory?.(catKey);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors ${
                  isSelected ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: catMeta.color }}
                />
                <CatIcon className="w-3.5 h-3.5 text-slate-500" />
                <span className="flex-1">{catMeta.label}</span>
                {isSelected && <span className="text-indigo-600 font-bold">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
