import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useConversationStore } from '@/store/conversationStore';
import { 
  Brain, 
  Search, 
  BookOpen, 
  TrendingUp, 
  Zap, 
  Target, 
  FileText, 
  Lightbulb,
  Database,
  BarChart3,
  Globe,
  Users,
  Building,
  Microscope,
  Briefcase,
  GraduationCap,
  Rocket,
  Shield,
  Heart,
  Leaf,
  Code,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ResearchCategory {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
  useCase: string;
  templates: ResearchTemplate[];
}

interface ResearchTemplate {
  id: string;
  title: string;
  description: string;
  query: string;
  tags: string[];
  effort: 'low' | 'medium' | 'high';
  estimatedTime: string;
}

interface ResearchHubProps {
  onResearchStart: (query: string, category: string, effort: string) => void;
  onShowHistory: () => void;
}

export const ResearchHub: React.FC<ResearchHubProps> = ({ 
  onResearchStart, 
  onShowHistory 
}) => {
  const { user } = useAuthStore();
  const { conversations } = useConversationStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ResearchTemplate | null>(null);

  const researchCategories: ResearchCategory[] = [
    {
      id: 'market-research',
      title: 'Market Research',
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-500',
      description: 'Competitive analysis, market trends, and business intelligence',
      useCase: 'Business Strategy & Analysis',
      templates: [
        {
          id: 'competitor-analysis',
          title: 'Competitor Analysis',
          description: 'Analyze competitors in your industry',
          query: 'Analyze the top 5 competitors in [INDUSTRY] industry, their market share, strengths, weaknesses, and recent developments',
          tags: ['competitors', 'market-share', 'swot'],
          effort: 'high',
          estimatedTime: '10-15 min'
        },
        {
          id: 'market-trends',
          title: 'Market Trends',
          description: 'Discover emerging trends and opportunities',
          query: 'What are the latest trends and emerging opportunities in [INDUSTRY] for 2024-2025?',
          tags: ['trends', 'opportunities', 'forecast'],
          effort: 'medium',
          estimatedTime: '8-12 min'
        },
        {
          id: 'customer-insights',
          title: 'Customer Insights',
          description: 'Understanding target audience and customer behavior',
          query: 'Analyze customer behavior patterns, preferences, and pain points in [INDUSTRY]',
          tags: ['customers', 'behavior', 'insights'],
          effort: 'medium',
          estimatedTime: '6-10 min'
        }
      ]
    },
    {
      id: 'academic-research',
      title: 'Academic Research',
      icon: GraduationCap,
      color: 'from-blue-500 to-indigo-500',
      description: 'Literature reviews, citation analysis, and scholarly research',
      useCase: 'Academic & Scientific Research',
      templates: [
        {
          id: 'literature-review',
          title: 'Literature Review',
          description: 'Comprehensive review of academic literature',
          query: 'Conduct a literature review on [TOPIC] including recent studies, key findings, and research gaps',
          tags: ['literature', 'studies', 'research-gaps'],
          effort: 'high',
          estimatedTime: '15-20 min'
        },
        {
          id: 'research-methodology',
          title: 'Research Methodology',
          description: 'Find appropriate research methods and approaches',
          query: 'What are the best research methodologies for studying [TOPIC]? Include qualitative and quantitative approaches',
          tags: ['methodology', 'qualitative', 'quantitative'],
          effort: 'medium',
          estimatedTime: '8-12 min'
        },
        {
          id: 'paper-summary',
          title: 'Paper Summarization',
          description: 'Summarize and analyze research papers',
          query: 'Find and summarize the top 5 most cited papers about [TOPIC] in the last 2 years',
          tags: ['papers', 'citations', 'summary'],
          effort: 'high',
          estimatedTime: '12-18 min'
        }
      ]
    },
    {
      id: 'technology-research',
      title: 'Technology Research',
      icon: Code,
      color: 'from-purple-500 to-pink-500',
      description: 'Tech trends, tools comparison, and innovation analysis',
      useCase: 'Technology & Innovation',
      templates: [
        {
          id: 'tech-stack-comparison',
          title: 'Tech Stack Comparison',
          description: 'Compare different technology stacks and tools',
          query: 'Compare [TECH_STACK_1] vs [TECH_STACK_2] for [USE_CASE] - pros, cons, performance, community, and future outlook',
          tags: ['technology', 'comparison', 'tools'],
          effort: 'medium',
          estimatedTime: '10-15 min'
        },
        {
          id: 'emerging-tech',
          title: 'Emerging Technologies',
          description: 'Explore cutting-edge technologies and their applications',
          query: 'What are the most promising emerging technologies in [FIELD] and their potential applications?',
          tags: ['emerging', 'innovation', 'applications'],
          effort: 'high',
          estimatedTime: '12-18 min'
        },
        {
          id: 'ai-impact',
          title: 'AI Impact Analysis',
          description: 'Analyze AI impact on specific industries',
          query: 'How is AI transforming [INDUSTRY]? Include current applications, challenges, and future predictions',
          tags: ['ai', 'transformation', 'industry'],
          effort: 'high',
          estimatedTime: '15-20 min'
        }
      ]
    },
    {
      id: 'investment-research',
      title: 'Investment Research',
      icon: Briefcase,
      color: 'from-yellow-500 to-orange-500',
      description: 'Financial analysis, investment opportunities, and risk assessment',
      useCase: 'Finance & Investment',
      templates: [
        {
          id: 'stock-analysis',
          title: 'Stock Analysis',
          description: 'Comprehensive analysis of stocks and companies',
          query: 'Analyze [COMPANY] stock - financial performance, growth prospects, risks, and analyst recommendations',
          tags: ['stocks', 'financial', 'analysis'],
          effort: 'high',
          estimatedTime: '12-18 min'
        },
        {
          id: 'sector-analysis',
          title: 'Sector Analysis',
          description: 'Industry sector performance and outlook',
          query: 'Analyze the [SECTOR] sector - current trends, key players, growth drivers, and investment opportunities',
          tags: ['sector', 'investment', 'opportunities'],
          effort: 'medium',
          estimatedTime: '10-15 min'
        },
        {
          id: 'crypto-research',
          title: 'Cryptocurrency Research',
          description: 'Crypto market analysis and trends',
          query: 'Research [CRYPTOCURRENCY] - technology, use cases, market performance, and future outlook',
          tags: ['crypto', 'blockchain', 'market'],
          effort: 'medium',
          estimatedTime: '8-12 min'
        }
      ]
    },
    {
      id: 'healthcare-research',
      title: 'Healthcare Research',
      icon: Heart,
      color: 'from-red-500 to-pink-500',
      description: 'Medical research, drug discovery, and health trends',
      useCase: 'Healthcare & Medical',
      templates: [
        {
          id: 'drug-research',
          title: 'Drug Research',
          description: 'Research pharmaceutical drugs and treatments',
          query: 'Research [DRUG/TREATMENT] - mechanism of action, efficacy, side effects, and recent clinical trials',
          tags: ['drugs', 'clinical-trials', 'efficacy'],
          effort: 'high',
          estimatedTime: '15-20 min'
        },
        {
          id: 'disease-research',
          title: 'Disease Research',
          description: 'Comprehensive disease information and treatments',
          query: 'Research [DISEASE] - causes, symptoms, current treatments, and latest research developments',
          tags: ['disease', 'treatments', 'research'],
          effort: 'high',
          estimatedTime: '12-18 min'
        },
        {
          id: 'health-trends',
          title: 'Health Trends',
          description: 'Current health trends and public health insights',
          query: 'What are the current health trends and public health concerns in [REGION/TOPIC]?',
          tags: ['health', 'trends', 'public-health'],
          effort: 'medium',
          estimatedTime: '8-12 min'
        }
      ]
    },
    {
      id: 'environmental-research',
      title: 'Environmental Research',
      icon: Leaf,
      color: 'from-green-500 to-blue-500',
      description: 'Climate change, sustainability, and environmental impact studies',
      useCase: 'Environment & Sustainability',
      templates: [
        {
          id: 'climate-impact',
          title: 'Climate Impact Analysis',
          description: 'Climate change effects and mitigation strategies',
          query: 'Analyze the climate impact of [ACTIVITY/INDUSTRY] and potential mitigation strategies',
          tags: ['climate', 'impact', 'mitigation'],
          effort: 'high',
          estimatedTime: '15-20 min'
        },
        {
          id: 'sustainability-research',
          title: 'Sustainability Research',
          description: 'Sustainable practices and green technologies',
          query: 'Research sustainable practices and green technologies in [INDUSTRY/SECTOR]',
          tags: ['sustainability', 'green-tech', 'practices'],
          effort: 'medium',
          estimatedTime: '10-15 min'
        },
        {
          id: 'environmental-policy',
          title: 'Environmental Policy',
          description: 'Environmental regulations and policy analysis',
          query: 'Analyze environmental policies and regulations related to [TOPIC] in [REGION]',
          tags: ['policy', 'regulations', 'environment'],
          effort: 'medium',
          estimatedTime: '8-12 min'
        }
      ]
    }
  ];

  const handleTemplateSelect = (template: ResearchTemplate) => {
    setSelectedTemplate(template);
    const customizedQuery = template.query.includes('[') 
      ? template.query.replace(/\[.*?\]/g, '______')
      : template.query;
    onResearchStart(customizedQuery, selectedCategory || 'general', template.effort);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  const selectedCategoryData = researchCategories.find(cat => cat.id === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              repeatType: "reverse" 
            }}
            className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center"
          >
            <Brain className="w-8 h-8 text-white" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              Research Hub
            </h1>
            <p className="text-xl text-neutral-400">
              AI-Powered Research Assistant for Professional Insights
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-center space-x-6 text-sm text-neutral-500">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>{conversations.length} research sessions</span>
          </div>
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>Real-time data</span>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4" />
            <span>AI-enhanced insights</span>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex justify-center space-x-4 mb-8"
      >
        <Button
          onClick={onShowHistory}
          className="bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-600"
        >
          <Search className="w-4 h-4 mr-2" />
          Search History
        </Button>
        <Button
          onClick={() => onResearchStart('', 'general', 'medium')}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          <Zap className="w-4 h-4 mr-2" />
          Quick Research
        </Button>
      </motion.div>

      {/* Research Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <Target className="w-6 h-6 mr-2 text-blue-400" />
          Research Categories
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {researchCategories.map((category, index) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleCategorySelect(category.id)}
                className={`
                  relative p-6 rounded-2xl cursor-pointer transition-all duration-300
                  ${isSelected 
                    ? `bg-gradient-to-br ${category.color} shadow-2xl shadow-current/25 transform scale-105` 
                    : 'bg-neutral-800/50 hover:bg-neutral-700/50 border border-neutral-700 hover:border-neutral-600'
                  }
                `}
                whileHover={{ scale: isSelected ? 1.05 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start space-x-4">
                  <div className={`
                    w-14 h-14 rounded-xl flex items-center justify-center
                    ${isSelected 
                      ? 'bg-white/20 backdrop-blur-sm' 
                      : `bg-gradient-to-br ${category.color} opacity-80`
                    }
                  `}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold text-lg mb-1 ${isSelected ? 'text-white' : 'text-neutral-200'}`}>
                      {category.title}
                    </h3>
                    <p className={`text-sm mb-2 ${isSelected ? 'text-white/80' : 'text-neutral-400'}`}>
                      {category.description}
                    </p>
                    <Badge variant="outline" className={`text-xs ${isSelected ? 'text-white/70 border-white/30' : 'text-neutral-500 border-neutral-600'}`}>
                      {category.useCase}
                    </Badge>
                  </div>
                </div>
                
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 pt-4 border-t border-white/20"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/80">
                        {category.templates.length} research templates
                      </span>
                      <div className="flex items-center space-x-1">
                        <Sparkles className="w-4 h-4 text-white/60" />
                        <span className="text-sm text-white/80">AI-Enhanced</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Research Templates */}
      {selectedCategoryData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <FileText className="w-6 h-6 mr-2 text-purple-400" />
            {selectedCategoryData.title} Templates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedCategoryData.templates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700 hover:border-neutral-600 transition-all duration-300 hover:shadow-lg"
              >
                <div className="mb-4">
                  <h3 className="font-bold text-lg text-white mb-2">{template.title}</h3>
                  <p className="text-sm text-neutral-400 mb-3">{template.description}</p>
                  <div className="flex items-center justify-between mb-3">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        template.effort === 'high' ? 'text-red-400 border-red-500/30' :
                        template.effort === 'medium' ? 'text-yellow-400 border-yellow-500/30' :
                        'text-green-400 border-green-500/30'
                      }`}
                    >
                      {template.effort} effort
                    </Badge>
                    <span className="text-xs text-neutral-500">~{template.estimatedTime}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {template.tags.map((tag, tagIndex) => (
                      <Badge key={tagIndex} variant="outline" className="text-xs text-neutral-500 border-neutral-600">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={() => handleTemplateSelect(template)}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  Start Research
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};