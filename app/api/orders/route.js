import crypto from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const requiredFields = [
  "customerName",
  "email",
  "orderId",
  "destinationCountry",
  "esimPackage"
];

export async function POST(request) {
  let order;

  try {
    order = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  const validationError = validateOrder(order);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const hmacSecret = process.env.N8N_HMAC_SECRET;

  if (!webhookUrl || !hmacSecret) {
    if (!webhookUrl) {
      console.error("Missing N8N_WEBHOOK_URL");
    }

    if (!hmacSecret) {
      console.error("Missing N8N_HMAC_SECRET");
    }

    return NextResponse.json(
      { error: "Order automation is not configured" },
      { status: 500 }
    );
  }

  const payload = {
    customerName: order.customerName.trim(),
    destinationCountry: order.destinationCountry.trim(),
    email: order.email.trim(),
    esimPackage: order.esimPackage.trim(),
    orderId: order.orderId.trim()
  };
  const signedPayload = canonicalJson(payload);
  const signature = crypto
    .createHmac("sha256", hmacSecret)
    .update(signedPayload)
    .digest("hex");

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Esim-Signature": `sha256=${signature}`,
        "X-Esim-Signed-Payload": signedPayload
      },
      body: signedPayload
    });

    const responseText = await response.text();
    const responseBody = parseJsonResponse(responseText);

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            responseBody?.error ||
            responseBody?.message ||
            "n8n rejected the order request"
        },
        { status: response.status >= 400 && response.status < 600 ? response.status : 502 }
      );
    }

    return NextResponse.json(responseBody ?? { message: responseText });
  } catch {
    return NextResponse.json(
      { error: "n8n webhook is unavailable. Please try again later." },
      { status: 502 }
    );
  }
}

function validateOrder(order) {
  if (!order || typeof order !== "object" || Array.isArray(order)) {
    return "Order payload is required";
  }

  for (const field of requiredFields) {
    if (typeof order[field] !== "string" || !order[field].trim()) {
      return `${field} is required`;
    }
  }

  return "";
}

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function parseJsonResponse(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
