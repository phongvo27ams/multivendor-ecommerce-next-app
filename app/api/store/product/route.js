import prisma from "../../../lib/prisma";
import imagekit from "../../../configs/imageKit";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import authSeller from "../../../middlewares/authSeller";

// Add a new product to the store
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);

    if (!storeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get data from the form
    const formData = await request.formData();
    const name = formData.get("name");
    const description = formData.get("description");
    const mrp = Number(formData.get("mrp"));
    const price = Number(formData.get("price"));
    const category = formData.get("category");
    const images = formData.getAll("images");

    if (!name || !description || !mrp || !price || !category || images.length === 0) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Upload images to ImageKit
    const imageUrl = await Promise.all(images.map(async (image) => {
      const buffer = Buffer.from(await image.arrayBuffer());

      const respose = await imagekit.upload({
        file: buffer,
        fileName: image.name,
        folder: "products"
      });

      const url = imagekit.url({
        path: respose.filePath,
        transformations: [
          { quality: "auto" },
          { format: "webp" },
          { width: "1024" }
        ]
      });

      return url;
    }))

    await prisma.product.create({
      data: {
        storeId,
        name,
        description,
        mrp,
        price,
        category,
        images: imageUrl,
      }
    });

    return NextResponse.json({ message: "Product added successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error adding product:", error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}

// Get all products of the store
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);

    if (!storeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      where: { storeId },
    });

    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}