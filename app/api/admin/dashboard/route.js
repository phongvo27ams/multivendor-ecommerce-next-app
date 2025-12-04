import { getAuth } from "@clerk/nextjs/server";
import authAdmin from "../../../../middlewares/authAdmin";
import prisma from "../../../../lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);

    if (!isAdmin) {
      return NextResponse.json(
        { message: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Get total counts
    const orders = await prisma.order.count();
    const stores = await prisma.store.count();
    const products = await prisma.product.count();

    const allOrders = await prisma.order.findMany({
      select: {
        createdAt: true,
        total: true
      },
    });

    let totalRevenue = 0;

    allOrders.forEach((order) => {
      totalRevenue += order.total;
    });

    const revenue = totalRevenue.toFixed(2);

    const dashboardData = {
      orders,
      stores,
      products,
      revenue,
      allOrders,
    };

    return NextResponse.json(dashboardData, { status: 200 });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: error.code || error.message},
      { status: 400 }
    );
  }
}