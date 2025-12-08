import prisma from "../../../lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Update user's cart
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const { cart } = await request.json();

    await prisma.user.update({
      where: { id: userId },
      data: { cart:cart },
    });

    return NextResponse.json({ message: "Cart updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating user cart:", error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}

// Get user's cart
export async function GET(request) {
  try {
    const { userId } = getAuth(request);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    return NextResponse.json({ cart: user.cart }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user cart:", error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}