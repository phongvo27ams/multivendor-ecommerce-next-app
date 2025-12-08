import { getAuth } from "@clerk/nextjs/server";
import authAdmin from "../../../../middlewares/authAdmin";
import prisma from "../../../../lib/prisma";
import { NextResponse } from "next/server";

// Approve or reject store
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);

    if (!isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    const { storeId, status } = await request.json();

    if (status === "approved") {
      await prisma.store.update({
        where: { id: storeId },
        data: { status: "approved", isActive: true },
      });
    } else if (status === "rejected") {
      await prisma.store.update({
        where: { id: storeId },
        data: { status: "rejected", isActive: false },
      });
    }
    return NextResponse.json({ message: `Store ${status} successfully` }, { status: 200 });
  }
  catch (error) {
    console.error("Error approving/rejecting store:", error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}

// Get stores pending or rejected
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);

    if (!isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    const stores = await prisma.store.findMany({
      where: { status: { in: ["pending", "rejected"] } },
      include: { user: true },
    });

    return NextResponse.json({ stores }, { status: 200 });
  } catch (error) {
    console.error("Error fetching stores for approval:", error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}