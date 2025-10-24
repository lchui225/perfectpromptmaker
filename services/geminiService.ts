import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage } from '../types';

// Lazily initialize ai so the app doesn't crash on load if API_KEY is missing.
let ai: GoogleGenAI | null = null;

const getAi = () => {
  if (!process.env.API_KEY) {
    return null;
  }
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

const promptRefinementSchema = {
  type: Type.OBJECT,
  properties: {
    explanation: {
      type: Type.STRING,
      description: "Your analysis of the prompt, clarifying questions for the user, and suggestions for improvement. This will be shown in the chat.",
    },
    revisedPrompt: {
      type: Type.STRING,
      description: "The new, improved version of the prompt based on the conversation.",
    },
  },
  required: ['explanation', 'revisedPrompt'],
};

const getSystemInstruction = (initialPrompt: string, refinedPrompt: string, history: ChatMessage[]) => {
  const historyString = history.map(msg => `${msg.sender}: ${msg.text}`).join('\n');

  return `You are a world-class prompt engineering expert for large language models. Your goal is to help a user refine their initial prompt to get the best possible output from an AI model like Gemini.

**User's Initial Prompt:**
\`\`\`
${initialPrompt}
\`\`\`

**Current Refined Prompt:**
\`\`\`
${refinedPrompt}
\`\`\`

**Conversation History:**
${historyString}

**Your Task:**
1. Analyze the user's prompt and the conversation so far.
2. Ask clarifying questions to understand the user's true intent, desired format, tone, and constraints.
3. Suggest specific improvements to the prompt.
4. Based on the conversation, provide an updated version of the 'refined prompt'.
5. Your explanation should be concise and directly helpful, guiding the user towards a better prompt.

**Output Format:**
You MUST return a JSON object that adheres to the provided schema.
`;
};

export interface RefinementResponse {
  explanation: string;
  revisedPrompt: string;
}

export const refinePrompt = async (
  initialPrompt: string,
  currentPrompt: string,
  history: ChatMessage[]
): Promise<RefinementResponse> => {
  const aiInstance = getAi();
  if (!aiInstance) {
    console.error("API_KEY is not configured.");
    return {
      explanation: "It looks like the API key isn't set up correctly. Please go to your Netlify site settings, find the 'Environment variables' section, and ensure you have a variable with the Key 'API_KEY' and your Gemini API key as the Value. You may need to trigger a new deploy after adding it.",
      revisedPrompt: currentPrompt,
    };
  }

  try {
    const latestUserMessage = history[history.length - 1]?.text || initialPrompt;
    const systemInstruction = getSystemInstruction(initialPrompt, currentPrompt, history);
    
    const response = await aiInstance.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: latestUserMessage,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: promptRefinementSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsedResponse = JSON.parse(jsonText);

    if (
      typeof parsedResponse.explanation === 'string' &&
      typeof parsedResponse.revisedPrompt === 'string'
    ) {
      return parsedResponse;
    } else {
      throw new Error("Invalid JSON structure in API response.");
    }
  } catch (error) {
    console.error("Error refining prompt:", error);
    // Provide a user-friendly error response
    return {
      explanation: "I'm sorry, I encountered an error. This might be due to a temporary issue with the API or an invalid API key. Please double-check your key in the Netlify settings and try again.",
      revisedPrompt: currentPrompt, // Return the last good prompt
    };
  }
};