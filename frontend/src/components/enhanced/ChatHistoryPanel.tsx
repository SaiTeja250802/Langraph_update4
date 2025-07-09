import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MessageSquare, Calendar, Tag, Archive } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

interface ChatHistoryPanelProps {
  conversations: Conversation[];
  onConversationSelect: (conversationId: string) => void;
}

export const ChatHistoryPanel: React.FC<ChatHistoryPanelProps> = ({
  conversations,
  onConversationSelect,
}) => {
  const { searchConversations, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory } = useConversationStore();
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  const handleSearch = async (query: string) => {
    setLocalSearchQuery(query);
    setSearchQuery(query);
    if (query.trim()) {
      await searchConversations(query, selectedCategory);
    }
  };

  const categoryColors = {
    trending: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    sports: 'bg-green-500/20 text-green-400 border-green-500/30',
    technology: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    general: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700 max-h-96 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-200 flex items-center">
          <MessageSquare className="w-5 h-5 mr-2 text-purple-400" />
          Chat History
        </h3>
        <Badge variant="outline" className="text-neutral-400 border-neutral-600">
          {conversations.length} conversations
        </Badge>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
        <Input
          placeholder="Search conversations..."
          value={localSearchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 bg-neutral-700/50 border-neutral-600 text-white placeholder-neutral-400"
        />
      </div>

      {/* Conversations List */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {conversations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-neutral-400"
          >
            <Archive className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No conversations found</p>
            <p className="text-sm mt-1">Start your first research session!</p>
          </motion.div>
        ) : (
          conversations.map((conversation, index) => (
            <motion.div
              key={conversation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onConversationSelect(conversation.id)}
              className="p-4 rounded-lg bg-neutral-700/30 hover:bg-neutral-700/50 border border-neutral-600/50 hover:border-neutral-500 cursor-pointer transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-neutral-200 group-hover:text-white transition-colors line-clamp-1">
                  {conversation.title}
                </h4>
                <div className="flex items-center space-x-2 text-xs text-neutral-400">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(conversation.updated_at)}</span>
                </div>
              </div>

              {conversation.last_message_preview && (
                <p className="text-sm text-neutral-400 mb-3 line-clamp-2">
                  {conversation.last_message_preview}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {conversation.category && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-2 py-1 ${categoryColors[conversation.category as keyof typeof categoryColors] || categoryColors.general}`}
                    >
                      {conversation.category}
                    </Badge>
                  )}
                  {conversation.tags.slice(0, 2).map((tag, tagIndex) => (
                    <Badge key={tagIndex} variant="outline" className="text-xs px-2 py-1 text-neutral-400 border-neutral-600">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center space-x-1 text-xs text-neutral-500">
                  <MessageSquare className="w-3 h-3" />
                  <span>{conversation.message_count}</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};