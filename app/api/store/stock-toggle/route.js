import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/dist/types/server";
import { NextResponse } from "next/server";

import authSeller from "@/middlewares/authSeller";

// Toggle stock status for a product
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const storeId =  await authSeller(userId);

    if (!storeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the product belongs to the seller's store
    const product = await prisma.product.findFirst({
      where: { id: productId, storeId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found or does not belong to your store" }, { status: 404 });
    }

    await prisma.product.update({
      where: { id: productId },
      data: { inStock: !product.inStock },
    });

    return NextResponse.json({ message: "Product stock status updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error toggling product stock status:", error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}