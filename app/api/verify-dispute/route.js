import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper: fetch image from URL and convert to base64
async function urlToBase64(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}

export async function POST(req) {
  try {
    const { customerPhotoUrl, baselinePhotoUrl, reviewText, businessName } = await req.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const customerImageBase64 = await urlToBase64(customerPhotoUrl);
    const baselineImageBase64 = baselinePhotoUrl ? await urlToBase64(baselinePhotoUrl) : null;

    const systemPrompt = `You are a verification assistant for a local business status app called LocalConnect.

A customer claims a business named "${businessName}" was marked "Open" by the owner, but the customer says it was actually closed. The customer has submitted a photo as evidence, along with a written comment.

Your job is to analyze the customer's photo and compare it (if a baseline photo is provided) to the business owner's reference photo of their shop, and determine:

1. SHOP IDENTITY MATCH: Does the customer's photo show the same shop/business (matching name, signage, or storefront) as the baseline reference photo?
2. CLOSED STATUS: Does the shop genuinely appear closed in the customer's photo (e.g. shutter down, lights off, "closed" sign visible, no activity)?
3. TIME EVIDENCE: Is there a visible clock, watch, or phone screen showing a time/date in the photo? Does it look like a recent, genuine photo rather than an old or reused one?
4. REVIEW TEXT ANALYSIS: Does the customer's written comment ("${reviewText}") sound like a genuine, specific complaint, or does it sound vague, spammy, or suspicious?

Based on all of this, return a verdict:
- "verified" if the photo genuinely shows this shop closed with reasonable supporting evidence
- "rejected" if the photo doesn't match the shop, doesn't show it closed, or looks fake/reused
- "pending" if you are uncertain and it needs human review

Respond ONLY in this exact JSON format, with no extra text:
{"verdict": "verified" | "rejected" | "pending", "reasoning": "one short sentence explaining why"}`;

    const parts = [{ text: systemPrompt }];

    parts.push({
      inlineData: { mimeType: 'image/jpeg', data: customerImageBase64 },
    });

    if (baselineImageBase64) {
      parts.push({ text: "This is the owner's baseline reference photo of the shop:" });
      parts.push({
        inlineData: { mimeType: 'image/jpeg', data: baselineImageBase64 },
      });
    }

    const result = await model.generateContent(parts);
    const responseText = result.response.text();

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { verdict: 'pending', reasoning: 'Could not parse AI response.' };

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('AI verification error:', error);
    return NextResponse.json(
      { verdict: 'pending', reasoning: 'AI verification failed, needs manual review.' },
      { status: 200 }
    );
  }
}