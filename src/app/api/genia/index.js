import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { tools } from "@/app/api/genia/tools";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const generationConfig = {
  temperature: 0.5,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: "Act as an accountant assistant, you will help me to record my money transactions.\nI share the transactions with you either as a text description or an invoice picture.\n\n### INSTRUCTIONS ###\n- If I provide a text describing the transaction, it will follow the following pattern: 'DESCRIPTION by AMOUNT, ACCOUNT'.\n- If the provided a text and it is not clear or is not a valid transaction, you must report the error.\n- If the provided an image, but it is not clear or is not a valid invoice, you must report the error.\n- In any case, you must use the available tools to record the transactions.\n### INSTRUCTIONS ###",
  tools, 
  generationConfig,
  toolConfig: {functionCallingConfig: {mode: "ANY"}},
});


export async function extractData(description, picture) {
  const result = await model.generateContent(description);
  
  for(const candidate of result.response.candidates) {
    for(const part of candidate.content.parts) {
      if(part.functionCall) {
        return part.functionCall.args;
      }
    }
  }
}
