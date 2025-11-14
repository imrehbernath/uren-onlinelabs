


import { GoogleGenAI, Type } from "@google/genai";
import type { Project, Invoice } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you'd handle this more gracefully.
  // For this environment, we assume API_KEY is set.
  console.warn("API_KEY environment variable not set. Gemini features will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const refineInvoiceText = async (
  project: Project,
  invoice: Invoice,
  userRequest: string
): Promise<{ newSubject: string }> => {
  if (!API_KEY) {
    throw new Error("API Key niet geconfigureerd.");
  }

  const entryDetails = invoice.lineItems
    .map(item => `- ${item.description} (${item.quantity} uur/stuks)`)
    .join('\n');

  const prompt = `
    Je bent een AI-assistent voor een administratieprogramma. Jouw taak is om de onderwerpregel van een factuur aan te passen op basis van de instructies van de gebruiker. Behoud een professionele en vriendelijke toon.

    CONTEXT:
    - Projectnaam: ${project.name}
    - Huidig onderwerp: ${invoice.subject}
    - Factuurregels:
    ${entryDetails}

    GEBRUIKERSINSTRUCTIE:
    "${userRequest}"

    Jouw taak:
    Pas het onderwerp aan op basis van de gebruikersinstructie. Geef de output als een geldig JSON-object. Wijzig alleen het onderwerp.
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              newSubject: {
                type: Type.STRING,
                description: 'De nieuwe, aangepaste onderwerpregel van de factuur.'
              }
            },
            required: ['newSubject']
          }
        }
    });
    
    const result = JSON.parse(response.text);
    return result;

  } catch (error) {
    console.error("Error refining invoice text:", error);
    throw new Error("Er is een fout opgetreden bij het verfijnen van de factuurtekst.");
  }
};