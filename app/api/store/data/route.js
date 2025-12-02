import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Get store info and store products
export async function GET(request) {
  try {
    // Extract username from query parameters
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username").toLowerCase();

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    // Fetch store info from external API
    const store = await prisma.store.findUnique({
      where: { username, isActive: true },
      include: { Product: { include: { rating: true } } },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 400 });
    }

    return NextResponse.json({ store });
  } catch (error) {
    console.error("Error fetching store data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}