"use client";

import { createInvoice } from "@/services/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type InvoiceItem = {
  description: string;
  quantity: number;
  price: number;
};

export default function NewInvoicePage() {
  const router = useRouter();
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, price: 0 },
  ]);

  const handleAddItem = () => {
    setItems((prev) => [...prev, { description: "", quantity: 1, price: 0 }]);
  };

  const handleChange = <K extends keyof InvoiceItem>(
    index: number,
    field: K,
    value: InvoiceItem[K]
  ) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async () => {
    try {
      await createInvoice({ clientName, clientEmail, items });
      toast.success("Invoice created successfully!");
      router.push("/invoices");
    } catch (err: any) {
      toast.error(err.message || "Failed to create invoice");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-12">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6 sm:p-8 md:p-12">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
          Create Invoice
        </h1>

        {/* Client Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
          <div className="flex flex-col">
            <label className="mb-2 text-gray-600 font-medium">Client Name</label>
            <input
              type="text"
              placeholder="Enter client name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-2 text-gray-600 font-medium">Client Email</label>
            <input
              type="email"
              placeholder="Enter client email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Items */}
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Invoice Items</h2>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-200"
            >
              <div className="flex flex-col sm:col-span-2">
                <label className="mb-1 text-gray-600">Description</label>
                <input
                  type="text"
                  placeholder="Item description"
                  value={item.description}
                  onChange={(e) =>
                    handleChange(index, "description", e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-gray-600">Quantity</label>
                <input
                  type="number"
                  min={1}
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) =>
                    handleChange(index, "quantity", Number(e.target.value))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-gray-600">Price</label>
                <input
                  type="number"
                  min={0}
                  placeholder="Price"
                  value={item.price}
                  onChange={(e) =>
                    handleChange(index, "price", Number(e.target.value))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add Item Button */}
        <button
          onClick={handleAddItem}
          className="mt-4 w-full sm:w-auto px-6 py-2 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 transition"
        >
          + Add Item
        </button>

        {/* Submit */}
        <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
          <button
            onClick={handleSubmit}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Create Invoice
          </button>
        </div>
      </div>
    </div>
  );
}