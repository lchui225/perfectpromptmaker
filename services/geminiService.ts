import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
  try {
    const latestUserMessage = history[history.length - 1]?.text || initialPrompt;
    const systemInstruction = getSystemInstruction(initialPrompt, currentPrompt, history);
    
    const response = await ai.models.generateContent({
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
      explanation: "I'm sorry, I encountered an error. This might be due to a temporary issue with the API. Please try again in a moment. If the problem persists, consider simplifying your last message.",
      revisedPrompt: currentPrompt, // Return the last good prompt
    };
  }
};
