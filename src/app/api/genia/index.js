import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { tools } from "@/app/api/genia/tools";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

/**
 * Uploads the given file to Gemini.
 *
 * See https://ai.google.dev/gemini-api/docs/prompting_with_media
 */
async function uploadToGemini(path, mimeType) {
  const uploadResult = await fileManager.uploadFile(path, {
    mimeType,
    displayName: path,
  });
  const file = uploadResult.file;
  console.log(`Uploaded file ${file.displayName} as: ${file.name}`);
  return file;
}

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: "Act as an accountant assistant, you will help me to record my money transactions.\nI share the transactions with you either as a text description or an invoice picture.\n\n### INSTRUCTIONS ###\n- If I provide a text describing the transaction, it will follow the following pattern: 'DESCRIPTION by AMOUNT, ACCOUNT'.\n- If the provided a text and it is not clear or is not a valid transaction, you must report the error.\n- If the provided an image, but it is not clear or is not a valid invoice, you must report the error.\n- In any case, you must use the available tools to record the transactions.\n### INSTRUCTIONS ###",
  tools, 
  toolConfig: {functionCallingConfig: {mode: "ANY"}},
});

const generationConfig = {
  temperature: 0.5,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

async function run() {
  // TODO Make these files available on the local file system
  // You may need to update the file paths
  const files = [
    await uploadToGemini("Image November 23, 2024 - 11:19AM.jpeg", "image/jpeg"),
    await uploadToGemini("Image November 23, 2024 - 11:25AM.jpeg", "image/png"),
  ];

  const chatSession = model.startChat({
    generationConfig,
    history: [
      {
        role: "user",
        parts: [
          {
            fileData: {
              mimeType: files[0].mimeType,
              fileUri: files[0].uri,
            },
          },
        ],
      },
      {
        role: "model",
        parts: [
          {text: "\n```Function call\n{\n  \"name\": \"createTransaction\",\n  \"args\": {\n    \"description\": \"2 combos mega burger\",\n    \"category\": \"Alimentos\",\n    \"amount\": 23000,\n    \"date\": \"2018-05-02T20:03:18\"\n  }\n}\n```\n"},
        ],
      },
      {
        role: "user",
        parts: [
          {
            fileData: {
              mimeType: files[1].mimeType,
              fileUri: files[1].uri,
            },
          },
        ],
      },
      {
        role: "model",
        parts: [
          {text: "The provided image is an illustration and does not contain information about financial transactions.  I cannot process this request.\n"},
        ],
      },
    ],
  });

  const result = await chatSession.sendMessage("INSERT_INPUT_HERE");
  for(candidate of result.response.candidates) {
    for(part of candidate.content.parts) {
      if(part.functionCall) {
        const items = part.functionCall.args;
        const args = Object
          .keys(items)
          .map((data) => [data, items[data]])
          .map(([key, value]) => `${key}:${value}`)
          .join(', ');
        console.log(`${part.functionCall.name}(${args})`);
      }
    }
  }
}

run();