import { getAuth } from "@clerk/nextjs/server";
import authAdmin from "../../../../middlewares/authAdmin";
import prisma from "../../../../lib/prisma";
import { NextResponse } from "next/server";

// Get all approval stores
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);

    if (!isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    const stores = await prisma.store.findMany({
      where: { status: "approved" },
      include: { user: true },
    });

    return NextResponse.json({ stores }, { status: 200 });
  } catch (error) {
    console.error("Error fetching stores for approval:", error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}