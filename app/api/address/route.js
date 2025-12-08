import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

// Add a new address for the authenticated user
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const { address } = await request.json();

    address.userId = userId;

    const newAddress = await prisma.address.create({
      data: address,
    });

    return NextResponse.json({ message: "Address added successfully", address: newAddress }, { status: 200 });
  } catch (error) {
    console.error("Error adding address:", error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}

// Get all addresses for the authenticated user
export async function GET(request) {
  try {
    const { userId } = getAuth(request);

    const addresses = await prisma.address.findMany({
      where: { userId },
    });

    return NextResponse.json({ addresses }, { status: 200 });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}