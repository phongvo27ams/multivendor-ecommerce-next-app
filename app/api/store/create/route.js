import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/dist/types/server";
import imagekit from "@/configs/imageKit";

// Create a new store route
export async function POST(request) {
  try {
    const { userId } = getAuth(request);

    // Parse form data
    const formData = await request.formData();
    const name = formData.get("name");
    const username = formData.get("username");
    const description = formData.get("description");
    const email = formData.get("email");
    const contact = formData.get("contact");
    const address = formData.get("address");
    const image = formData.get("image");

    if (!name || !username || !description || !email || !contact || !address) {
      return NextResponse.json({ error: "Missing store info" }, { status: 400 });
    }

    // Check if store with the same username already exists
    const store = await prisma.store.findFirst({
      where: { userId: userId },
    });
    // If store exists, return its status
    if (store) {
      return NextResponse.json({ status: store.status });
    }

    // Check if username is already taken
    const isUsernameTaken = await prisma.store.findFirst({
      where: { username: username.toLowerCase() },
    });
    // If username is taken, return error
    if (isUsernameTaken) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    const response = await imagekit.upload({
      file: buffer,
      fileName: image.name,
      folder: "logos"
    });

    const optimizedImage = imagekit.url({
      path: response.filePath,
      transformation: [
        {
          width: "512",
          quality: "auto",
          format: "webp"
        }
      ]
    });

    const newStore = await prisma.store.create({
      data: {
        userId,
        name,
        description,
        username: username.toLowerCase(),
        email,
        contact,
        address,
        logo: optimizedImage,
      },
    });

    // Connect the new store to the user
    await prisma.user.update({
      where: { id: userId },
      data: { store: { connect: { id: newStore.id } } },
    });

    return NextResponse.json({ message: "Store created successfully, waiting for approval" }, { status: 201 });
  } catch (error) {
    console.error("Error creating store:", error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}

// Get store status route
export async function GET(request) {
  try {
    const { userId } = getAuth(request);

    // Check if store with the same username already exists
    const store = await prisma.store.findFirst({
      where: { userId: userId },
    });
    // If store exists, return its status
    if (store) {
      return NextResponse.json({ status: store.status });
    }

    return NextResponse.json({ status: "Not registered" });
  } catch (error) {
    console.error("Error fetching store:", error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}