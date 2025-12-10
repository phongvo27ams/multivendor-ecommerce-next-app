import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import authSeller from "../../../../middlewares/authSeller";
import { openai } from "../../../../configs/openai";

async function main(base64Image, mimeType) {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const messages = [
    {
      "role": "system",
      "content": `
        You are a product listing assistant for an e-commerce store. Your job is to analyze an image of a product and generate structured data.

        Response ONLY with raw JSON (no code block, no markdown, no explanation). The JSON must strictly follow this schema:

        {
          "name": string,        // Short product name
          "description": string, // Marketing-friendly description of the product
        }
      `
    },
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Analyze this image and return name + description.",
        },
        {
          "type": "image_url",
          "image_url": {
            "url": `data:${mimeType};base64,${base64Image}`,
          },
        },
      ],
    },
  ];

  const modelName = process.env.OPENAI_MODEL || "gpt-4o-mini";
  let response;
  let attempts = 0;
  const maxAttempts = 3;
  const delays = [1000, 3000, 7000];

  while (true) {
    try {
      response = await openai.chat.completions.create({
        model: modelName,
        messages,
      });
      break;
    } catch (err) {
      const status = err?.status ?? err?.response?.status;
      if (status === 429 && attempts < maxAttempts - 1) {
        await sleep(delays[attempts]);
        attempts += 1;
        continue;
      }
      throw err;
    }
  }

  const raw = response.choices[0].message.content;
  const cleaned = raw.replace(/```json|```/g, "").trim();
  let parsed;

  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    throw new Error("Failed to parse JSON response from OpenAI");
  }

  return parsed;
}

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);

    if (!storeId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { base64Image, mimeType } = await request.json();
    if (!base64Image || !mimeType) {
      return NextResponse.json({ error: "Missing image or mimeType" }, { status: 400 });
    }
    const result = await main(base64Image, mimeType);

    return NextResponse.json({ ...result }, { status: 200 });
  } catch (error) {
    console.log("[AI_PRODUCT_ERROR]", error);
    const status = error?.status ?? error?.response?.status;
    if (status === 429) {
      return NextResponse.json({ error: "AI rate limit or quota exceeded" }, { status: 429 });
    }
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}