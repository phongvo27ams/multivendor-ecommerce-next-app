import { getAuth } from "@clerk/nextjs/server";
import prisma from "../../../lib/prisma";
import { NextResponse } from "next/server";

// Submit a rating for a product in an order
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const { orderId, productId, rating, review } = await request.json();
    const order = await prisma.order.findUnique({
      where: { id: orderId, userId }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const isAlreadyRated = await prisma.rating.findFirst({
      where: { productId, orderId }
    });

    if (isAlreadyRated) {
      return NextResponse.json({ error: "Product already rated for this order" }, { status: 400 });
    }

    const response = await prisma.rating.create({
      data: {
        userId,
        productId,
        orderId,
        rating,
        review
      }
    });

    return NextResponse.json({ message: "Rating submitted successfully", rating: response }, { status: 200 });
  } catch (error) {
    console.error("Error submitting rating:", error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    const ratings = await prisma.rating.findMany({
      where: { userId },
    });

    return NextResponse.json({ ratings }, { status: 200 });
  } catch (error) {
    console.error("Error fetching ratings:", error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}