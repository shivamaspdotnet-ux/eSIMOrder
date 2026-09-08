"use client";

import { useState } from "react";

const initialOrder = {
  customerName: "",
  email: "",
  orderId: "",
  destinationCountry: "",
  esimPackage: ""
};

const packages = ["USA 10GB", "Japan 5GB", "Europe 20GB", "UAE 3GB"];

export default function Home() {
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function updateField(event) {
    setOrder((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  }

  async function submitOrder(event) {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(order)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Order request failed");
      }

      setResult(data);
    } catch (requestError) {
      setError(requestError.message || "Unable to submit order");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-10">
      <section className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-teal-700">
          Travel eSIM demo
        </p>
        <h1 className="text-3xl font-semibold text-gray-950">
          eSIM Order Automation PoC
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600">
          Submit a mock eSIM order, sign it server-side, send it to an n8n
          webhook, and show the provisioning response returned by the workflow.
        </p>
      </section>

      <form
        onSubmit={submitOrder}
        className="rounded border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-gray-800">
              Customer Name
            </span>
            <input
              className="mt-2 w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              name="customerName"
              onChange={updateField}
              required
              type="text"
              value={order.customerName}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-800">Email</span>
            <input
              className="mt-2 w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              name="email"
              onChange={updateField}
              required
              type="email"
              value={order.email}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-800">Order ID</span>
            <input
              className="mt-2 w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              name="orderId"
              onChange={updateField}
              required
              type="text"
              value={order.orderId}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-800">
              Destination Country
            </span>
            <input
              className="mt-2 w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              name="destinationCountry"
              onChange={updateField}
              required
              type="text"
              value={order.destinationCountry}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-gray-800">
              eSIM Package
            </span>
            <select
              className="mt-2 w-full rounded border border-gray-300 bg-white px-3 py-2 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              name="esimPackage"
              onChange={updateField}
              required
              value={order.esimPackage}
            >
              <option value="">Select a package</option>
              {packages.map((packageName) => (
                <option key={packageName} value={packageName}>
                  {packageName}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          className="mt-6 rounded bg-teal-700 px-4 py-2 font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-gray-400"
          disabled={loading}
          type="submit"
        >
          {loading ? "Submitting..." : "Submit Mock Order"}
        </button>
      </form>

      {result ? (
        <section className="mt-6 rounded border border-green-200 bg-green-50 p-5">
          <h2 className="text-lg font-semibold text-green-900">
            Provisioning Result
          </h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <ResultRow label="Order ID" value={result.orderId} />
            <ResultRow label="Status" value={result.status} />
            <ResultRow label="ICCID" value={result.iccid} />
            <ResultRow label="Package" value={result.package} />
            <ResultRow
              label="Activation Code"
              value={result.activationCode}
              wide
            />
            <ResultRow label="Message" value={result.message} wide />
          </dl>
        </section>
      ) : null}

      {error ? (
        <section className="mt-6 rounded border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          {error}
        </section>
      ) : null}
    </main>
  );
}

function ResultRow({ label, value, wide = false }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="font-medium text-gray-700">{label}</dt>
      <dd className="mt-1 break-words text-gray-950">{value || "-"}</dd>
    </div>
  );
}
