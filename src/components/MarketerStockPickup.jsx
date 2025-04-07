// src/components/MarketerStockPickup.jsx
import React from "react";
import { useForm } from "react-hook-form";
import api from "../api"; // Your custom axios instance
import { useNavigate } from "react-router-dom";

function MarketerStockPickup() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const token = localStorage.getItem("token");
      // Send a POST request to the createStockUpdate endpoint.
      const response = await api.post("/api/stockupdate", data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert("Stock update recorded successfully!");
      reset();
    } catch (error) {
      console.error("Error recording stock update:", error);
      alert("Error recording stock update");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Record Stock Pickup</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block font-semibold">Dealer Unique ID:</label>
          <input
            className="border rounded px-3 py-2 w-full"
            {...register("dealerUniqueId", { required: "Dealer Unique ID is required" })}
            placeholder="Enter dealer unique ID"
          />
          {errors.dealerUniqueId && <p className="text-red-500 text-sm">{errors.dealerUniqueId.message}</p>}
        </div>
        <div>
          <label className="block font-semibold">Device ID:</label>
          <input
            className="border rounded px-3 py-2 w-full"
            {...register("device_id", { required: "Device ID is required" })}
            placeholder="Enter device ID"
          />
          {errors.device_id && <p className="text-red-500 text-sm">{errors.device_id.message}</p>}
        </div>
        <div>
          <label className="block font-semibold">Device Category:</label>
          <input
            className="border rounded px-3 py-2 w-full"
            {...register("device_category", { required: "Device category is required" })}
            placeholder="Enter device category (e.g. Phone, Tablet)"
          />
          {errors.device_category && <p className="text-red-500 text-sm">{errors.device_category.message}</p>}
        </div>
        <div>
          <label className="block font-semibold">Quantity:</label>
          <input
            type="number"
            className="border rounded px-3 py-2 w-full"
            {...register("quantity", {
              required: "Quantity is required",
              min: { value: 1, message: "Quantity must be at least 1" },
            })}
            placeholder="Enter quantity"
          />
          {errors.quantity && <p className="text-red-500 text-sm">{errors.quantity.message}</p>}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}

export default MarketerStockPickup;
