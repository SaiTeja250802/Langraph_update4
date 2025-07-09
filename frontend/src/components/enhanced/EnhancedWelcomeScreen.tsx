import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { InputForm } from '../InputForm';
import { CategoryButtons } from './CategoryButtons';
import { ChatHistoryPanel } from './ChatHistoryPanel';
import { UserProfile } from './UserProfile';
import { useAuthStore } from '@/store/authStore';
import { useConversationStore } from '@/store/conversationStore';
import { 
  TrendingUp, 
  Trophy, 
  Cpu, 
  History, 
  Search,
  Sparkles,
  Brain,
  Zap
} from 'lucide-react';

interface EnhancedWelcomeScreenProps {
  handleSubmit: (
    submittedInputValue: string,
    effort: string,
    model: string,
    category?: string
  ) => void;
  onCancel: () => void;
  isLoading: boolean;
  onShowResearchHub: () => void;
  onShowHistory: () => void;
}

export const EnhancedWelcomeScreen: React.FC<EnhancedWelcomeScreenProps> = ({
  handleSubmit,
  onCancel,
  isLoading,
}) => {
  const { user } = useAuthStore();
  const { conversations, fetchConversations } = useConversationStore();
  const [showHistory, setShowHistory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [suggestedQueries, setSuggestedQueries] = useState<string[]>([]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const categories = [
    {
      id: 'trending',
      title: 'Trending',
      icon: TrendingUp,
      color: 'from-pink-500 to-rose-500',
      description: 'Latest viral topics and breaking news',
      queries: [
        'What are the top trending topics today?',
        'Latest viral news and social media trends',
        'Breaking news and current events',
        'Popular culture and entertainment trends',
        'Trending hashtags and social movements'
      ]
    },
    {
      id: 'sports',
      title: 'Sports',
      icon: Trophy,
      color: 'from-green-500 to-emerald-500',
      description: 'Sports news, scores, and updates',
      queries: [
        'Latest sports news and scores today',
        'NFL/NBA/MLB/NHL highlights and updates',
        'Soccer/Football matches and results',
        'Olympic updates and sports events',
        'Sports transfers and trade news'
      ]
    },
    {
      id: 'technology',
      title: 'Technology',
      icon: Cpu,
      color: 'from-blue-500 to-cyan-500',
      description: 'Tech innovations and industry news',
      queries: [
        'Latest tech news and innovations',
        'AI and machine learning breakthroughs',
        'New gadgets and product launches',
        'Tech industry mergers and acquisitions',
        'Software updates and cybersecurity news'
      ]
    },
    {
      id: 'history',
      title: 'Chat History',
      icon: History,
      color: 'from-purple-500 to-indigo-500',
      description: 'Your previous conversations',
      queries: []
    }
  ];

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === 'history') {
      setShowHistory(!showHistory);
      setSelectedCategory(null);
      setSuggestedQueries([]);
    } else {
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        setSelectedCategory(categoryId);
        setSuggestedQueries(category.queries);
        setShowHistory(false);
      }
    }
  };

  const handleSuggestedQuery = (query: string) => {
    handleSubmit(query, 'medium', 'gemini-2.5-flash-preview-04-17', selectedCategory || undefined);
  };

  const handleConversationSelect = (conversationId: string) => {
    // This would typically navigate to the conversation
    console.log('Selected conversation:', conversationId);
    setShowHistory(false);
  };

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-4 flex-1 w-full max-w-6xl mx-auto">
      {/* User Profile */}
      <UserProfile />

      {/* Welcome Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              repeatType: "reverse" 
            }}
            className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center"
          >
            <Brain className="w-8 h-8 text-white" />
          </motion.div>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-neutral-100">
              {greeting}, {user?.full_name?.split(' ')[0]}
            </h1>
            <p className="text-xl md:text-2xl text-neutral-400 mt-2">
              What would you like to research today?
            </p>
          </div>
        </div>
      </motion.div>

      {/* Category Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-8"
      >
        <CategoryButtons
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryClick={handleCategoryClick}
        />
      </motion.div>

      {/* Suggested Queries */}
      {suggestedQueries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8 w-full max-w-4xl"
        >
          <div className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700">
            <h3 className="text-lg font-semibold text-neutral-200 mb-4 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-blue-400" />
              Suggested {selectedCategory} queries
            </h3>
            <div className="grid gap-2">
              {suggestedQueries.map((query, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleSuggestedQuery(query)}
                  className="text-left p-3 rounded-lg bg-neutral-700/50 hover:bg-neutral-700 border border-neutral-600 hover:border-blue-500/50 transition-all duration-200 text-neutral-300 hover:text-white group"
                >
                  <div className="flex items-center">
                    <Search className="w-4 h-4 mr-3 text-neutral-400 group-hover:text-blue-400 transition-colors" />
                    <span className="text-sm">{query}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Chat History Panel */}
      {showHistory && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8 w-full max-w-4xl"
        >
          <ChatHistoryPanel
            conversations={conversations}
            onConversationSelect={handleConversationSelect}
          />
        </motion.div>
      )}

      {/* Input Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="w-full max-w-3xl"
      >
        <InputForm
          onSubmit={(input, effort, model) => handleSubmit(input, effort, model, selectedCategory || undefined)}
          isLoading={isLoading}
          onCancel={onCancel}
          hasHistory={false}
        />
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mt-8 flex items-center space-x-6 text-xs text-neutral-500"
      >
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4" />
          <span>Powered by Google Gemini</span>
        </div>
        <div className="flex items-center space-x-2">
          <Brain className="w-4 h-4" />
          <span>LangChain LangGraph</span>
        </div>
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4" />
          <span>Real-time Research</span>
        </div>
      </motion.div>
    </div>
  );
};