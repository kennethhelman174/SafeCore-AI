
export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIChatOptions {
  model?: string;
  stream?: boolean;
}

class AIService {
  private baseUrl = "/api/ai";
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private get headers() {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.token) {
      h["Authorization"] = `Bearer ${this.token}`;
    }
    return h;
  }

  async getModels() {
    const res = await fetch(`${this.baseUrl}/models`, {
      headers: this.headers
    });
    return res.json();
  }

  async chat(messages: AIMessage[], options: AIChatOptions = {}) {
    const res = await fetch(`${this.baseUrl}/chat`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        messages,
        model: options.model || "llama3.1:8b",
        stream: options.stream || false
      })
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.details || "AI Error");
    }
    
    return res.json();
  }

  async chatStream(messages: AIMessage[], options: AIChatOptions = {}, onChunk: (text: string) => void) {
    const res = await fetch(`${this.baseUrl}/chat`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        messages,
        model: options.model || "llama3.1:8b",
        stream: true
      })
    });

    if (!res.ok) throw new Error("Stream error");

    const reader = res.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      try {
        // Ollama returns NDJSON
        const lines = chunk.split('\n').filter(Boolean);
        for (const line of lines) {
          const json = JSON.parse(line);
          if (json.message?.content) {
            onChunk(json.message.content);
          }
        }
      } catch (e) {
        console.warn("Error parsing chunk", e);
      }
    }
  }

  async getPrompts() {
    const res = await fetch(`${this.baseUrl}/prompts`, {
      headers: this.headers
    });
    return res.json();
  }

  async savePrompt(prompt: any) {
    const res = await fetch(`${this.baseUrl}/prompts`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(prompt)
    });
    return res.json();
  }

  // Pre-defined system prompts for common safety tasks
  async generateSOP(title: string, department: string) {
    const prompt = `Draft a professional Standard Operating Procedure (SOP) for "${title}" in the ${department} department. Include Purpose, Scope, Responsibilities, and a step-by-step Procedure. Maintain a strict safety focus. Important: Do not include introductory text, just the SOP content.`;
    return this.chat([{ role: "user", content: prompt }]);
  }

  async analyzeJSA(task: string) {
    const prompt = `Perform a Job Safety Analysis (JSA) for the task: "${task}". 
    Return a list of steps. For each step, use exactly this format:
    Task | Hazard | Control
    Include a 'Stop Work' trigger as the last line. Do not include any other conversational text.`;
    return this.chat([{ role: "user", content: prompt }]);
  }

  async suggestControls(task: string) {
    const prompt = `Suggest 3 critical controls for the following warehouse task: "${task}". 
    Format as a list where each item starts with "Control: ". Focus on high-level controls from the hierarchy of controls.`;
    return this.chat([{ role: "user", content: prompt }]);
  }

  async identifyHazards(task: string) {
    const prompt = `Identify 5 specific safety hazards associated with "${task}" in a distribution center. 
    Format as a simple list. Focus on SIF (Serious Injury/Fatality) potential hazards.`;
    return this.chat([{ role: "user", content: prompt }]);
  }

  async identifySIF(details: string) {
    const prompt = `Analyze the following operation for Serious Injury or Fatality (SIF) potential: "${details}". 
    Identify:
    - High-energy sources
    - Potential SIF categorization
    - Critical control recommendations
    - Residual risk rating`;
    return this.chat([{ role: "user", content: prompt }]);
  }

  async improveWording(text: string) {
    const prompt = `Rewrite the following safety instruction to be clearer, more professional, and action-oriented for a warehouse operator: "${text}"`;
    return this.chat([{ role: "user", content: prompt }]);
  }

  async generateQuiz(text: string) {
    const prompt = `Based on the following safety document content, generate 3 multiple-choice questions to verify operator understanding. Include the correct answer for each: "${text}"`;
    return this.chat([{ role: "user", content: prompt }]);
  }
}

export const aiService = new AIService();
