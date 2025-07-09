import { useStream } from "@langchain/langgraph-sdk/react";
import type { Message } from "@langchain/langgraph-sdk";
import { useState, useEffect, useRef, useCallback } from "react";
import { ProcessedEvent } from "@/components/ActivityTimeline";
import { EnhancedWelcomeScreen } from "@/components/enhanced/EnhancedWelcomeScreen";
import { ResearchHub } from "@/components/enhanced/ResearchHub";
import { ConversationHistorySidebar } from "@/components/enhanced/ConversationHistorySidebar";
import { ChatMessagesView } from "@/components/ChatMessagesView";
import { AuthPage } from "@/components/auth/AuthPage";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useConversationStore } from "@/store/conversationStore";

export default function App() {
  const { isAuthenticated } = useAuthStore();
  const { createConversation, addMessageToConversation, getConversation } = useConversationStore();
  const [processedEventsTimeline, setProcessedEventsTimeline] = useState<
    ProcessedEvent[]
  >([]);
  const [historicalActivities, setHistoricalActivities] = useState<
    Record<string, ProcessedEvent[]>
  >({});
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showResearchHub, setShowResearchHub] = useState(false);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const hasFinalizeEventOccurredRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const thread = useStream<{
    messages: Message[];
    initial_search_query_count: number;
    max_research_loops: number;
    reasoning_model: string;
  }>({
    apiUrl: import.meta.env.VITE_BACKEND_URL || "http://localhost:8001",
    assistantId: "agent",
    messagesKey: "messages",
    onUpdateEvent: (event: any) => {
      let processedEvent: ProcessedEvent | null = null;
      if (event.generate_query) {
        processedEvent = {
          title: "Generating Search Queries",
          data: event.generate_query?.search_query?.join(", ") || "",
        };
      } else if (event.web_research) {
        const sources = event.web_research.sources_gathered || [];
        const numSources = sources.length;
        const uniqueLabels = [
          ...new Set(sources.map((s: any) => s.label).filter(Boolean)),
        ];
        const exampleLabels = uniqueLabels.slice(0, 3).join(", ");
        processedEvent = {
          title: "Web Research",
          data: `Gathered ${numSources} sources. Related to: ${
            exampleLabels || "N/A"
          }.`,
        };
      } else if (event.reflection) {
        processedEvent = {
          title: "Reflection",
          data: "Analysing Web Research Results",
        };
      } else if (event.finalize_answer) {
        processedEvent = {
          title: "Finalizing Answer",
          data: "Composing and presenting the final answer.",
        };
        hasFinalizeEventOccurredRef.current = true;
      }
      if (processedEvent) {
        setProcessedEventsTimeline((prevEvents) => [
          ...prevEvents,
          processedEvent!,
        ]);
      }
    },
    onError: (error: any) => {
      setError(error.message);
    },
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [thread.messages]);

  useEffect(() => {
    if (
      hasFinalizeEventOccurredRef.current &&
      !thread.isLoading &&
      thread.messages.length > 0
    ) {
      const lastMessage = thread.messages[thread.messages.length - 1];
      if (lastMessage && lastMessage.type === "ai" && lastMessage.id) {
        setHistoricalActivities((prev) => ({
          ...prev,
          [lastMessage.id!]: [...processedEventsTimeline],
        }));

        // Save AI message to conversation
        if (currentConversationId) {
          addMessageToConversation(currentConversationId, {
            role: "ai",
            content: typeof lastMessage.content === "string" ? lastMessage.content : JSON.stringify(lastMessage.content),
            metadata: { sources: processedEventsTimeline }
          });
        }
      }
      hasFinalizeEventOccurredRef.current = false;
    }
  }, [thread.messages, thread.isLoading, processedEventsTimeline, currentConversationId, addMessageToConversation]);

  const handleSubmit = useCallback(
    async (submittedInputValue: string, effort: string, model: string, category?: string) => {
      if (!submittedInputValue.trim()) return;

      // Create a new conversation if this is the first message
      if (thread.messages.length === 0) {
        try {
          const conversationId = await createConversation({
            title: submittedInputValue.slice(0, 100), // Use first 100 chars as title
            category: category || 'general',
            tags: []
          });
          setCurrentConversationId(conversationId);

          // Save human message to conversation
          await addMessageToConversation(conversationId, {
            role: "human",
            content: submittedInputValue,
            metadata: { effort, model, category }
          });
        } catch (error) {
          console.error('Error creating conversation:', error);
        }
      } else if (currentConversationId) {
        // Add human message to existing conversation
        try {
          await addMessageToConversation(currentConversationId, {
            role: "human",
            content: submittedInputValue,
            metadata: { effort, model, category }
          });
        } catch (error) {
          console.error('Error adding message to conversation:', error);
        }
      }

      setProcessedEventsTimeline([]);
      hasFinalizeEventOccurredRef.current = false;

      // Convert effort to initial_search_query_count and max_research_loops
      let initial_search_query_count = 0;
      let max_research_loops = 0;
      switch (effort) {
        case "low":
          initial_search_query_count = 1;
          max_research_loops = 1;
          break;
        case "medium":
          initial_search_query_count = 3;
          max_research_loops = 3;
          break;
        case "high":
          initial_search_query_count = 5;
          max_research_loops = 10;
          break;
      }

      const newMessages: Message[] = [
        ...(thread.messages || []),
        {
          type: "human",
          content: submittedInputValue,
          id: Date.now().toString(),
        },
      ];

      thread.submit({
        messages: newMessages,
        initial_search_query_count: initial_search_query_count,
        max_research_loops: max_research_loops,
        reasoning_model: model,
      });
    },
    [thread, createConversation, addMessageToConversation, currentConversationId]
  );

  const handleConversationSelect = useCallback(async (conversationId: string) => {
    try {
      await getConversation(conversationId);
      setCurrentConversationId(conversationId);
      setShowHistorySidebar(false);
      setShowResearchHub(false);
      // Here you would typically load the conversation messages into the chat view
      // For now, we'll just log it
      console.log('Loading conversation:', conversationId);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  }, [getConversation]);

  const handleResearchStart = useCallback((query: string, category: string, effort: string) => {
    setShowResearchHub(false);
    handleSubmit(query, effort, 'gemini-2.5-flash-preview-04-17', category);
  }, []);

  const handleShowResearchHub = useCallback(() => {
    setShowResearchHub(true);
    setShowHistorySidebar(false);
  }, []);

  const handleShowHistory = useCallback(() => {
    setShowHistorySidebar(true);
    setShowResearchHub(false);
  }, []);

  const handleCancel = useCallback(() => {
    thread.stop();
  }, [thread]);

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="flex h-screen bg-neutral-800 text-neutral-100 font-sans antialiased">
      {/* Conversation History Sidebar */}
      <ConversationHistorySidebar
        isOpen={showHistorySidebar}
        onToggle={() => setShowHistorySidebar(!showHistorySidebar)}
        onConversationSelect={handleConversationSelect}
        currentConversationId={currentConversationId || undefined}
      />

      <main className="h-full w-full max-w-6xl mx-auto relative">
        {showResearchHub ? (
          <ResearchHub
            onResearchStart={handleResearchStart}
            onShowHistory={handleShowHistory}
          />
        ) : thread.messages.length === 0 ? (
          <EnhancedWelcomeScreen
            handleSubmit={handleSubmit}
            isLoading={thread.isLoading}
            onCancel={handleCancel}
            onShowResearchHub={handleShowResearchHub}
            onShowHistory={handleShowHistory}
          />
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="flex flex-col items-center justify-center gap-4">
              <h1 className="text-2xl text-red-400 font-bold">Error</h1>
              <p className="text-red-400">{JSON.stringify(error)}</p>
              <Button
                variant="destructive"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <ChatMessagesView
            messages={thread.messages}
            isLoading={thread.isLoading}
            scrollAreaRef={scrollAreaRef}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            liveActivityEvents={processedEventsTimeline}
            historicalActivities={historicalActivities}
            onShowResearchHub={handleShowResearchHub}
            onShowHistory={handleShowHistory}
          />
        )}
      </main>
    </div>
  );
}
