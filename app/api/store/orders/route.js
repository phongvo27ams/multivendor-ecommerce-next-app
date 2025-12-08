import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import authSeller from "../../../../middlewares/authSeller";
import prisma from "../../../../lib/prisma";

// Update the status of an order for the authenticated seller's store
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);

    if (!storeId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    const { orderId, status } = await request.json();

    await prisma.order.update({
      where: { id: orderId, storeId },
      data: { status },
    });

    return NextResponse.json({ message: "Order status updated successfully" }, { status: 200 });
  } catch (error) {
    console.log("Error updating order status:", error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);

    if (!storeId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { storeId },
      include: {
        user: true,
        address: true,
        orderItems: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.log("Error fetching store orders:", error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}