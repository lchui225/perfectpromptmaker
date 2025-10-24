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
  } catch (error: any) {
    console.error("Error refining prompt:", error);
    
    let userFriendlyError = "I'm sorry, I encountered an unexpected error. Please try again later.";

    const errorMessage = error.toString().toLowerCase();

    if (errorMessage.includes("api key not valid")) {
        userFriendlyError = "The API key you provided is not valid. Please double-check that the key in your Netlify settings is correct and has no extra spaces or characters, then trigger a new deploy.";
    } else if (errorMessage.includes("billing")) {
        userFriendlyError = "It looks like billing is not enabled for the Google Cloud project associated with your API key. The Gemini API requires billing to be set up, even for free tier usage. Please go to your Google AI Studio or Google Cloud Console, enable billing for the project, and then try again.";
    } else if (errorMessage.includes("quota")) {
        userFriendlyError = "It seems you have exceeded the free tier quota for the API. Please check your usage in the Google Cloud Console."
    }

    return {
      explanation: userFriendlyError,
      revisedPrompt: currentPrompt,
    };
  }
};