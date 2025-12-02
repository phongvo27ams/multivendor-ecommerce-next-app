import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

import authSeller from "@/middlewares/authSeller";

// Auth seller
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isSeller = await authSeller(userId);

    if (!isSeller) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    const storeInfo = await prisma.store.findUnique({ where: { userId } });

    return NextResponse.json({ isSeller, storeInfo });
  } catch (error) {
    console.error("Error checking seller status:", error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}