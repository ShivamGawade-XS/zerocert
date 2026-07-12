import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const orgId = await validateSession(req);
  if (!orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    // If no API key, tell client to fallback to local canvas color extractor
    return NextResponse.json({
      success: false,
      fallback: true,
      message: 'Gemini API key not configured. Using client-side extractor.',
    });
  }

  try {
    const { imageBase64 } = await req.json(); // Expects data URL or raw base64 string
    if (!imageBase64) {
      return NextResponse.json({ error: 'Missing image data' }, { status: 400 });
    }

    // Strip header prefix if present (e.g. "data:image/png;base64,")
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;

    const prompt = `Analyze this image (e.g., event banner, logo, or card theme) and extract a cohesive, professional certificate design theme.
Return ONLY a valid JSON object matching this TypeScript interface (no markdown code fences, no extra text, just the raw JSON):
{
  "bgColor": "Hex color string for certificate background",
  "textColor": "Hex color string for primary text",
  "accentColor": "Hex color string for highlights/borders",
  "styleName": "Creative name for this style",
  "fontFamily": "display | serif | mono | cursive"
}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API returned status ${response.status}: ${errText}`);
    }

    const resData = await response.json();
    const resultText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      throw new Error('Gemini API returned an empty response');
    }

    const theme = JSON.parse(resultText.trim());

    return NextResponse.json({
      success: true,
      theme,
    });
  } catch (error: any) {
    console.error('Gemini Theme Extractor error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to extract theme via AI',
    }, { status: 500 });
  }
}
