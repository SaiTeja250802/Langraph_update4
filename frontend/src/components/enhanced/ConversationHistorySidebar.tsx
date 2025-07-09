import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MessageSquare, 
  Calendar, 
  Tag, 
  Archive, 
  Filter,
  Clock,
  Star,
  MoreHorizontal,
  X,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Zap,
  Brain,
  History
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useConversationStore } from '@/store/conversationStore';

interface Conversation {
  id: string;
  title: string;
  category: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message_preview: string | null;
}

interface ConversationHistorySidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onConversationSelect: (conversationId: string) => void;
  currentConversationId?: string;
}

export const ConversationHistorySidebar: React.FC<ConversationHistorySidebarProps> = ({
  isOpen,
  onToggle,
  onConversationSelect,
  currentConversationId,
}) => {
  const { 
    conversations, 
    fetchConversations, 
    searchConversations, 
    searchQuery, 
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    isLoading
  } = useConversationStore();

  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'recent' | 'starred'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen, fetchConversations]);

  const handleSearch = async (query: string) => {
    setLocalSearchQuery(query);
    setSearchQuery(query);
    if (query.trim()) {
      await searchConversations(query, selectedCategory);
    } else {
      await fetchConversations();
    }
  };

  const categoryColors = {
    trending: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    sports: 'bg-green-500/20 text-green-400 border-green-500/30',
    technology: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'market-research': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'academic-research': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    'technology-research': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'investment-research': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'healthcare-research': 'bg-red-500/20 text-red-400 border-red-500/30',
    'environmental-research': 'bg-green-500/20 text-green-400 border-green-500/30',
    general: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const categoryIcons = {
    trending: TrendingUp,
    sports: Zap,
    technology: Brain,
    'market-research': TrendingUp,
    'academic-research': Brain,
    'technology-research': Brain,
    'investment-research': TrendingUp,
    'healthcare-research': Brain,
    'environmental-research': Brain,
    general: MessageSquare,
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const filteredConversations = conversations.filter(conversation => {
    switch (selectedFilter) {
      case 'recent':
        return new Date(conversation.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      case 'starred':
        // This would be based on user favorites - for now, return all
        return true;
      default:
        return true;
    }
  });

  const groupedConversations = filteredConversations.reduce((acc, conversation) => {
    const date = new Date(conversation.updated_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let group = 'Older';
    if (date.toDateString() === today.toDateString()) {
      group = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      group = 'Yesterday';
    } else if (date > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
      group = 'This Week';
    }
    
    if (!acc[group]) acc[group] = [];
    acc[group].push(conversation);
    return acc;
  }, {} as Record<string, Conversation[]>);

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={{ x: -400 }}
        animate={{ x: isOpen ? 0 : -400 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 h-full w-96 bg-neutral-900/95 backdrop-blur-xl border-r border-neutral-700 z-50 flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <History className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Research History</h2>
                <p className="text-sm text-neutral-400">{conversations.length} conversations</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
            <Input
              placeholder="Search conversations..."
              value={localSearchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-neutral-800/50 border-neutral-600 text-white placeholder-neutral-400 focus:border-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            <Button
              variant={selectedFilter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedFilter('all')}
              className="text-xs"
            >
              All
            </Button>
            <Button
              variant={selectedFilter === 'recent' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedFilter('recent')}
              className="text-xs"
            >
              Recent
            </Button>
            <Button
              variant={selectedFilter === 'starred' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedFilter('starred')}
              className="text-xs"
            >
              <Star className="w-3 h-3 mr-1" />
              Starred
            </Button>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : Object.keys(groupedConversations).length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 px-4"
            >
              <Archive className="w-12 h-12 mx-auto mb-4 text-neutral-500" />
              <p className="text-neutral-400 mb-2">No conversations found</p>
              <p className="text-sm text-neutral-500">Start your first research session!</p>
            </motion.div>
          ) : (
            <div className="p-4 space-y-6">
              {Object.entries(groupedConversations).map(([group, groupConversations]) => (
                <div key={group}>
                  <h3 className="text-sm font-semibold text-neutral-400 mb-3 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    {group}
                  </h3>
                  <div className="space-y-2">
                    {groupConversations.map((conversation, index) => {
                      const isActive = currentConversationId === conversation.id;
                      const CategoryIcon = categoryIcons[conversation.category as keyof typeof categoryIcons] || MessageSquare;
                      
                      return (
                        <motion.div
                          key={conversation.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => onConversationSelect(conversation.id)}
                          className={`
                            p-3 rounded-lg cursor-pointer transition-all duration-200 group
                            ${isActive 
                              ? 'bg-blue-500/20 border-blue-500/50 border' 
                              : 'bg-neutral-800/30 hover:bg-neutral-700/50 border border-neutral-700/50 hover:border-neutral-600'
                            }
                          `}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`
                              w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                              ${isActive ? 'bg-blue-500/30' : 'bg-neutral-700/50'}
                            `}>
                              <CategoryIcon className="w-4 h-4 text-neutral-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className={`font-medium text-sm truncate ${isActive ? 'text-blue-300' : 'text-neutral-200 group-hover:text-white'}`}>
                                  {conversation.title}
                                </h4>
                                <span className="text-xs text-neutral-500 flex-shrink-0 ml-2">
                                  {formatDate(conversation.updated_at)}
                                </span>
                              </div>
                              
                              {conversation.last_message_preview && (
                                <p className="text-xs text-neutral-400 mb-2 line-clamp-2">
                                  {conversation.last_message_preview}
                                </p>
                              )}
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  {conversation.category && (
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs px-2 py-0.5 ${categoryColors[conversation.category as keyof typeof categoryColors] || categoryColors.general}`}
                                    >
                                      {conversation.category}
                                    </Badge>
                                  )}
                                  {conversation.tags.slice(0, 1).map((tag, tagIndex) => (
                                    <Badge key={tagIndex} variant="outline" className="text-xs px-2 py-0.5 text-neutral-500 border-neutral-600">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                                <div className="flex items-center space-x-1 text-xs text-neutral-500">
                                  <MessageSquare className="w-3 h-3" />
                                  <span>{conversation.message_count}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-700">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Research History</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchConversations()}
              className="text-xs"
            >
              Refresh
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Toggle Button */}
      <motion.button
        onClick={onToggle}
        className={`
          fixed left-4 top-4 z-30 w-12 h-12 rounded-xl flex items-center justify-center
          transition-all duration-300 shadow-lg
          ${isOpen 
            ? 'bg-neutral-800 text-white border border-neutral-600' 
            : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
          }
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? (
          <ChevronLeft className="w-5 h-5" />
        ) : (
          <ChevronRight className="w-5 h-5" />
        )}
      </motion.button>
    </>
  );
};