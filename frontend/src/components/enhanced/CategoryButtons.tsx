import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface Category {
  id: string;
  title: string;
  icon: LucideIcon;
  color: string;
  description: string;
  queries: string[];
}

interface CategoryButtonsProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategoryClick: (categoryId: string) => void;
}

export const CategoryButtons: React.FC<CategoryButtonsProps> = ({
  categories,
  selectedCategory,
  onCategoryClick,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {categories.map((category, index) => {
        const Icon = category.icon;
        const isSelected = selectedCategory === category.id;
        const isHistory = category.id === 'history';

        return (
          <motion.button
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onCategoryClick(category.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              relative p-6 rounded-2xl transition-all duration-300 group
              ${isSelected 
                ? 'bg-gradient-to-br ' + category.color + ' shadow-lg shadow-current/25' 
                : 'bg-neutral-800/50 hover:bg-neutral-700/50 border border-neutral-700 hover:border-neutral-600'
              }
              ${isHistory ? 'col-span-2 md:col-span-1' : ''}
            `}
          >
            <div className="flex flex-col items-center space-y-3">
              <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
                ${isSelected 
                  ? 'bg-white/20 backdrop-blur-sm' 
                  : 'bg-gradient-to-br ' + category.color + ' opacity-80 group-hover:opacity-100'
                }
              `}>
                <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-white'}`} />
              </div>
              
              <div className="text-center">
                <h3 className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-neutral-200'}`}>
                  {category.title}
                </h3>
                <p className={`text-xs mt-1 ${isSelected ? 'text-white/80' : 'text-neutral-400'}`}>
                  {category.description}
                </p>
              </div>
            </div>

            {/* Glow effect for selected category */}
            {isSelected && (
              <motion.div
                className="absolute inset-0 rounded-2xl opacity-30 blur-xl bg-gradient-to-br"
                style={{
                  background: `linear-gradient(135deg, ${category.color.split(' ')[1]}, ${category.color.split(' ')[3]})`
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
};