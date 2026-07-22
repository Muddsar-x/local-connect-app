import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const { query } = await req.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const systemPrompt = `You are a search query interpreter for a local business finder app called LocalConnect.

The app lets users search for: Shops, Hospitals, Pharmacies, and Restaurants, which can each be "open" or "closed".

A user has typed or spoken this natural language search query:
"${query}"

Your job is to extract structured filters from this query.

Return ONLY a JSON object in this exact format, with no extra text:
{"category": "shop" | "hospital" | "pharmacy" | "restaurant" | "any", "status": "open" | "closed" | "any"}

Rules:
- If the user mentions a category by any related word (e.g. "medicine", "medical store" → pharmacy; "doctor", "clinic" → hospital; "food", "eat" → restaurant), map it to the closest matching category.
- If the user says things like "open now", "available", "khuli hui" → status = "open"
- If no category is mentioned, use "any"
- If no status preference is mentioned, use "any"`;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { category: 'any', status: 'any' };

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('NLP search error:', error);
    return NextResponse.json({ category: 'any', status: 'any' });
  }
}