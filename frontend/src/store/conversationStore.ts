import { create } from 'zustand';
import { makeAuthenticatedRequest } from './authStore';

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

interface ConversationState {
  conversations: Conversation[];
  currentConversation: any | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedCategory: string | null;
  
  // Actions
  fetchConversations: () => Promise<void>;
  searchConversations: (query: string, category?: string) => Promise<void>;
  createConversation: (data: { title: string; category?: string; tags?: string[] }) => Promise<string>;
  getConversation: (id: string) => Promise<void>;
  addMessageToConversation: (conversationId: string, message: { role: string; content: string; metadata?: any }) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  clearError: () => void;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  selectedCategory: null,

  fetchConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await makeAuthenticatedRequest('/api/conversations');
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      const conversations = await response.json();
      set({ conversations, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch conversations',
        isLoading: false 
      });
    }
  },

  searchConversations: async (query: string, category?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await makeAuthenticatedRequest('/api/conversations/search', {
        method: 'POST',
        body: JSON.stringify({ query, category }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to search conversations');
      }
      
      const conversations = await response.json();
      set({ conversations, searchQuery: query, selectedCategory: category || null, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to search conversations',
        isLoading: false 
      });
    }
  },

  createConversation: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await makeAuthenticatedRequest('/api/conversations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }
      
      const conversation = await response.json();
      set(state => ({ 
        conversations: [conversation, ...state.conversations],
        isLoading: false 
      }));
      
      return conversation.id;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create conversation',
        isLoading: false 
      });
      throw error;
    }
  },

  getConversation: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await makeAuthenticatedRequest(`/api/conversations/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch conversation');
      }
      const conversation = await response.json();
      set({ currentConversation: conversation, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch conversation',
        isLoading: false 
      });
    }
  },

  addMessageToConversation: async (conversationId: string, message) => {
    try {
      const response = await makeAuthenticatedRequest(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify(message),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add message to conversation');
      }
      
      // Refresh current conversation if it's the one we're adding to
      const { currentConversation } = get();
      if (currentConversation?.id === conversationId) {
        await get().getConversation(conversationId);
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add message to conversation'
      });
      throw error;
    }
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setSelectedCategory: (category: string | null) => set({ selectedCategory: category }),
  clearError: () => set({ error: null }),
}));

// Category suggestions
export const getCategorySuggestions = async (category: string) => {
  try {
    const response = await makeAuthenticatedRequest(`/api/categories/${category}`);
    if (!response.ok) {
      throw new Error('Failed to fetch category suggestions');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching category suggestions:', error);
    return null;
  }
};