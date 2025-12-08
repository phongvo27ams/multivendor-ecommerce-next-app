import prisma from "../lib/prisma";

// Returns storeId if the user has an approved store, otherwise false
const authSeller = async (userId) => {
  try {
    if (!userId) return false;

    const store = await prisma.store.findUnique({
      where: { userId },
    });

    if (store && store.status === "approved") {
      return store.id;
    }

    return false;
  } catch (error) {
    console.error("Error in authSeller middleware:", error);
    return false;
  }
};

export default authSeller;