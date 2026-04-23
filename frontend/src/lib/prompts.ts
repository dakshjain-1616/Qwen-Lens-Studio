/**
 * Prompt template library for Qwen Lens Studio
 * Stores named prompt templates per tool in localStorage
 */

const PROMPTS_KEY = 'qls.prompts.v1';

export interface PromptTemplate {
  id: string;
  name: string;
  systemPrompt?: string;
  userPrompt?: string;
  params?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface PromptStore {
  [toolId: string]: PromptTemplate[];
}

// Default templates seeded on first load
const DEFAULT_TEMPLATES: Record<string, PromptTemplate[]> = {
  reasoning: [
    {
      id: 'default-1',
      name: 'Detailed Analysis',
      systemPrompt: 'You are a visual reasoning expert. Analyze images with extreme detail, describing every visible element, spatial relationships, colors, textures, and patterns. Use <thinking> tags to show your step-by-step reasoning process.',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'default-2',
      name: 'Concise Summary',
      systemPrompt: 'You are a visual assistant. Provide brief, focused answers about images. Be direct and to the point.',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'default-3',
      name: 'Creative Interpretation',
      systemPrompt: 'You are a creative visual analyst. Look at images and provide imaginative interpretations, metaphors, and creative insights. Use <thinking> tags to show your creative reasoning process.',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ],
  multilingual: [
    {
      id: 'default-1',
      name: 'Formal Translation',
      systemPrompt: 'You are a professional translator. Provide formal, accurate translations preserving the tone and register of the original text. Use <thinking> tags to explain translation choices.',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'default-2',
      name: 'Casual Translation',
      systemPrompt: 'You are a translator specializing in conversational language. Translate to sound natural and colloquial in the target language.',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'default-3',
      name: 'Cultural Context',
      systemPrompt: 'You are a cultural linguist. Translate while explaining cultural nuances, idioms, and context that may not directly translate. Use <thinking> tags to elaborate on cultural considerations.',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ],
  document_iq: [
    {
      id: 'default-1',
      name: 'Executive Summary',
      systemPrompt: 'You are a document analyst specializing in executive summaries. Extract key points, decisions, and action items. Be concise and business-focused.',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'default-2',
      name: 'Detailed Extraction',
      systemPrompt: 'You are a document intelligence expert. Thoroughly analyze documents to extract all entities, dates, amounts, relationships, and structured data. Use <thinking> tags to show your analysis process.',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'default-3',
      name: 'Legal Analysis',
      systemPrompt: 'You are a legal document analyst. Identify clauses, obligations, risks, and legal implications in documents.',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ],
  code_lens: [
    {
      id: 'default-1',
      name: 'Code Review',
      systemPrompt: 'You are a senior software engineer conducting code reviews. Analyze for bugs, security issues, performance problems, and adherence to best practices. Provide constructive feedback.',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'default-2',
      name: 'Teacher Mode',
      systemPrompt: 'You are a programming instructor. Explain code thoroughly as if teaching a student. Break down complex concepts and provide learning resources. Use <thinking> tags to show your teaching process.',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'default-3',
      name: 'Optimization Focus',
      systemPrompt: 'You are a performance engineer. Focus exclusively on optimization opportunities, algorithmic improvements, and efficiency gains. Provide benchmarked alternatives where possible.',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ],
  dual_compare: [
    {
      id: 'default-1',
      name: 'Balanced Analysis',
      systemPrompt: 'You are an objective analyst comparing two AI responses. Provide a balanced assessment highlighting strengths and weaknesses of each without bias.',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'default-2',
      name: 'Fact-Check Mode',
      systemPrompt: 'You are a fact-checker. Rigorously verify claims in both responses, identify factual errors, and assess overall accuracy.',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'default-3',
      name: 'Quality Score',
      systemPrompt: 'You are a quality assessor. Score each response on accuracy, completeness, clarity, and helpfulness. Provide detailed scoring rationale.',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ]
};

function generateId(): string {
  return `tpl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getPrompts(): PromptStore {
  try {
    const stored = localStorage.getItem(PROMPTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load prompts:', e);
  }
  
  // Seed default templates on first load
  const seeded: PromptStore = {};
  for (const [tool, templates] of Object.entries(DEFAULT_TEMPLATES)) {
    seeded[tool] = templates.map(t => ({ ...t }));
  }
  savePrompts(seeded);
  return seeded;
}

export function savePrompts(prompts: PromptStore): void {
  try {
    localStorage.setItem(PROMPTS_KEY, JSON.stringify(prompts));
  } catch (e) {
    console.error('Failed to save prompts:', e);
  }
}

export function listPrompts(tool: string): PromptTemplate[] {
  const prompts = getPrompts();
  return prompts[tool] || [];
}

export function getPrompt(tool: string, id: string): PromptTemplate | undefined {
  const prompts = listPrompts(tool);
  return prompts.find(p => p.id === id);
}

export function savePrompt(tool: string, template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): PromptTemplate {
  const prompts = getPrompts();
  
  if (!prompts[tool]) {
    prompts[tool] = [];
  }
  
  const now = Date.now();
  const newTemplate: PromptTemplate = {
    ...template,
    id: template.id || generateId(),
    createdAt: template.id ? (getPrompt(tool, template.id)?.createdAt || now) : now,
    updatedAt: now
  };
  
  const existingIndex = prompts[tool].findIndex(p => p.id === newTemplate.id);
  if (existingIndex >= 0) {
    prompts[tool][existingIndex] = newTemplate;
  } else {
    prompts[tool].push(newTemplate);
  }
  
  savePrompts(prompts);
  return newTemplate;
}

export function deletePrompt(tool: string, id: string): void {
  const prompts = getPrompts();
  if (prompts[tool]) {
    prompts[tool] = prompts[tool].filter(p => p.id !== id);
    savePrompts(prompts);
  }
}

export function duplicatePrompt(tool: string, id: string, newName?: string): PromptTemplate | null {
  const original = getPrompt(tool, id);
  if (!original) return null;
  
  const duplicate = savePrompt(tool, {
    name: newName || `${original.name} (Copy)`,
    systemPrompt: original.systemPrompt,
    userPrompt: original.userPrompt,
    params: original.params ? { ...original.params } : undefined
  });
  
  return duplicate;
}
