import { getAuth } from "@clerk/nextjs/server";
import authAdmin from "../../../../middlewares/authAdmin";
import prisma from "../../../../lib/prisma";
import { NextResponse } from "next/server";

// Toggle the approval status of a store
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);

    if (!isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    const { storeId } = await request.json();

    if (!storeId) {
      return NextResponse.json({ error: "Store ID is required" }, { status: 400 });
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    await prisma.store.update({
      where: { id: storeId },
      data: { isActive: !store.isActive },
    });
    return NextResponse.json({ message: "Store active status toggled successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error fetching stores for approval:", error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}