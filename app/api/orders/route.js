import prisma from "../../../lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { PaymentMethod } from "@prisma/client";
import { NextResponse } from "next/server";
import Stripe from "stripe";

// Place a new order for the authenticated user
export async function POST(request) {
  try {
    const { userId, has } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { addressId, items, couponCode, paymentMethod } = await request.json();

    if (!addressId || !items || items.length === 0 || !Array.isArray(items) || !paymentMethod) {
      return NextResponse.json({ error: "Invalid order data" }, { status: 400 });
    }

    let coupon = null;

    if (couponCode) {
      coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
      });

      if (!coupon) {
        return NextResponse.json({ error: "Invalid or expired coupon code" }, { status: 404 });
      }
    }

    // Coupon validation for new users
    if (couponCode && coupon.forNewUser) {
      const userOrders = await prisma.order.findMany({
        where: { userId },
      });

      if (userOrders.length > 0) {
        return NextResponse.json({ error: "Coupon valid only for new users" }, { status: 400 });
      }
    }

    // Coupon validation for members
    const isPlusMember = has({ plan: "plus" });

    if (couponCode && coupon.forMember) {
      if (!isPlusMember) {
        return NextResponse.json({ error: "Coupon valid only for Plus members" }, { status: 400 });
      }
    }

    const orderByStore = new Map();
    let orderIds = [];
    let fullAmount = 0;
    let isShippingFeeAdded = false;

    // 1) Group cart items by storeId
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.id } });
      const storeId = product.storeId;
      if (!orderByStore.has(storeId)) {
        orderByStore.set(storeId, []);
      }
      orderByStore.get(storeId).push({ ...item, price: product.price });
    }

    // 2) Create one order per store exactly once
    for (const [storeId, sellerItems] of orderByStore.entries()) {
      let total = sellerItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);

      if (couponCode && coupon) {
        total -= (coupon.discount / 100) * total;
      }

      if (!isPlusMember && !isShippingFeeAdded) {
        total += 5;
        isShippingFeeAdded = true;
      }

      fullAmount += parseFloat(total.toFixed(2));

      const order = await prisma.order.create({
        data: {
          userId,
          storeId,
          addressId,
          total: parseFloat(total.toFixed(2)),
          paymentMethod,
          isCouponUsed: !!coupon,
          coupon: coupon ? coupon : {},
          orderItems: {
            create: sellerItems.map(it => ({
              productId: it.id,
              quantity: it.quantity,
              price: it.price,
            }))
          }
        },
      });

      orderIds.push(order.id);
    }

    if (paymentMethod === "STRIPE") {
      const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
      const origin = await request.headers.get("origin");

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: {
              name: "Order",
            },
            unit_amount: Math.round(fullAmount * 100),
          },
          quantity: 1,
        }],
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
        mode: "payment",
        success_url: `${origin}/loading?nextUrl=orders`,
        cancel_url: `${origin}/cart`,
        metadata: {
          orderIds: orderIds.join(","),
          userId,
          appId: process.env.NEXT_PUBLIC_APP_ID,
        }
      });
      return NextResponse.json({ session }, { status: 200 });
    }

    // Clear user's cart after placing order
    await prisma.user.update({
      where: { id: userId },
      data: { cart: {} },
    });

    return NextResponse.json({ message: "Order placed successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error placing order:", error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}

// Get orders for the authenticated user
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const orders = await prisma.order.findMany({
      where: {
        userId, OR: [
          { paymentMethod: PaymentMethod.COD },
          { AND: [{ paymentMethod: PaymentMethod.STRIPE }, { isPaid: true }] }
        ]
      },
      include: {
        orderItems: {
          include: { product: true }
        },
        address: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}