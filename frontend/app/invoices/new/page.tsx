"use client";

import { createInvoice } from "@/services/api";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type InvoiceItem = {
  description: string;
  quantity: number;
  price: number;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

export default function NewInvoicePage() {
  const router = useRouter();

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, price: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.quantity * item.price, 0),
    [items],
  );

  const handleAddItem = () => {
    setItems((prev) => [...prev, { description: "", quantity: 1, price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      toast.error("At least one invoice item is required");
      return;
    }

    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChange = <K extends keyof InvoiceItem>(
    index: number,
    field: K,
    value: InvoiceItem[K],
  ) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const validateForm = () => {
    if (!clientName.trim()) {
      toast.error("Please enter the client name");
      return false;
    }

    if (!clientEmail.trim()) {
      toast.error("Please enter the client email");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail.trim())) {
      toast.error("Please enter a valid email address");
      return false;
    }

    if (items.length === 0) {
      toast.error("Please add at least one invoice item");
      return false;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (!item.description.trim()) {
        toast.error(`Enter a description for item ${i + 1}`);
        return false;
      }

      if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
        toast.error(`Enter a valid quantity for item ${i + 1}`);
        return false;
      }

      if (!Number.isFinite(item.price) || item.price < 0) {
        toast.error(`Enter a valid price for item ${i + 1}`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (isSubmitting || !validateForm()) return;
    try {
      setIsSubmitting(true);
      await createInvoice({
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        items: items.map((item) => ({
          ...item,
          description: item.description.trim(),
        })),
      });

      toast.success("Invoice created successfully!");
      router.push("/invoices");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create invoice",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => router.push("/invoices")}
              className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-indigo-600"
            >
              <span aria-hidden="true">←</span>
              Back to invoices
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Create invoice
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Create and manage a new invoice for your client.
            </p>
          </div>
          <div className="hidden rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 sm:block">
            <p className="text-xs font-medium text-indigo-500">
              INVOICE SUMMARY
            </p>
            <p className="mt-1 text-lg font-bold text-indigo-700">
              {formatCurrency(subtotal)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-lg">
                  👤
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">
                    Client information
                  </h2>
                  <p className="text-sm text-gray-500">
                    Enter the details of your client.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Client name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Smith"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Client email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="client@example.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </section>
            {/* Invoice Items */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-lg">
                    📋
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      Invoice items
                    </h2>
                    <p className="text-sm text-gray-500">
                      Add products or services to this invoice.
                    </p>
                  </div>
                </div>

                <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                  {items.length} {items.length === 1 ? "item" : "items"}
                </span>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 sm:p-5"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-700">
                        Item {String(index + 1).padStart(2, "0")}
                      </p>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                      <div className="sm:col-span-6">
                        <label className="mb-2 block text-xs font-medium text-gray-600">
                          Description
                        </label>
                        <input
                          type="text"
                          placeholder="Enter item description"
                          value={item.description}
                          onChange={(e) =>
                            handleChange(index, "description", e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="mb-2 block text-xs font-medium text-gray-600">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleChange(
                              index,
                              "quantity",
                              Number(e.target.value),
                            )
                          }
                          className={inputClass}
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="mb-2 block text-xs font-medium text-gray-600">
                          Price (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={item.price}
                          onChange={(e) =>
                            handleChange(index, "price", Number(e.target.value))
                          }
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end border-t border-gray-200 pt-3">
                      <p className="text-sm text-gray-500">
                        Item total:{" "}
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(item.quantity * item.price)}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 px-4 py-3 text-sm font-semibold text-indigo-600 transition hover:border-indigo-500 hover:bg-indigo-50 sm:w-auto"
              >
                <span className="text-lg">+</span>
                Add another item
              </button>
            </section>
          </div>
          {/* Summary Sidebar */}
          <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7 lg:sticky lg:top-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Invoice summary
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Review your invoice before creating it.
            </p>
            <div className="my-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total items</span>
                <span className="font-medium text-gray-900">
                  {items.length}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-500">Total amount</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-indigo-600">
                  {formatCurrency(subtotal)}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creating invoice...
                  </>
                ) : (
                  "Create invoice"
                )}
              </button>
              <button
                type="button"
                onClick={() => router.push("/invoices")}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
            <p className="mt-5 text-center text-xs leading-5 text-gray-400">
              Please review all client and item details before creating this
              invoice.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
