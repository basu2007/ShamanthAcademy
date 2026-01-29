import { GoogleGenAI } from "@google/genai";

/**
 * Shamanth Academy AI Service
 * Powered by Gemini 3 Pro
 */

export async function generateCourseRoadmap(courseTitle: string, description: string): Promise<string> {
  if (!process.env.API_KEY) {
    throw new Error("AI Assistant offline: API Key not configured in environment.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are the Lead Technical Advisor at Shamanth Academy. 
      Create a concise, high-impact 5-step learning roadmap for a student interested in: "${courseTitle}".
      Context: ${description}
      
      Format your response as a numbered list with bold titles. Keep it encouraging and professional.`,
      config: {
        temperature: 0.7,
        topP: 0.95,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "I'm having trouble generating your roadmap right now. Please try again in a moment.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The Shamanth AI is currently resting. Please check back later.";
  }
}