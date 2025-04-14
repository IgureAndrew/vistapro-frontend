import React, { useState, useEffect } from "react";
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

  // State for holding the fetched stock updates.
  const [stockUpdates, setStockUpdates] = useState([]);
  // State for holding the list of dealers.
  const [dealers, setDealers] = useState([]);

  // Fetch the current marketer's stock updates using the new endpoint.
  const fetchStockUpdates = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/api/marketer/stock-update/marketer", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data && response.data.data) {
        setStockUpdates(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching stock updates:", error);
      // Optional: Display an error message to the user.
    }
  };

  // Fetch the list of dealers for the dropdown.
  const fetchDealers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/api/marketer/dealer", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Assuming the API returns an object like: { dealers: [ { unique_id, business_name, ... }, ... ] }
      if (response.data && response.data.dealers) {
        setDealers(response.data.dealers);
      }
    } catch (error) {
      console.error("Error fetching dealers:", error);
      // Optionally, display an error message if necessary.
    }
  };

  // Fetch stock updates and dealers when the component mounts.
  useEffect(() => {
    fetchStockUpdates();
    fetchDealers();
  }, []);

  // Handle form submission: create a new stock update.
  const onSubmit = async (data) => {
    try {
      const token = localStorage.getItem("token");
      // Send a POST request to the createStockUpdate endpoint.
      const response = await api.post("/api/marketer/stock-update", data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert("Stock update recorded successfully!");
      reset();
      // Re-fetch the stock updates after a successful creation.
      fetchStockUpdates();
    } catch (error) {
      console.error("Error recording stock update:", error);
      alert("Error recording stock update");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Record Stock Pickup</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Dealer Dropdown */}
        <div>
          <label className="block font-semibold">Dealer:</label>
          <select
            className="border rounded px-3 py-2 w-full"
            {...register("dealerUniqueId", { required: "Dealer is required" })}
          >
            <option value="">Select Dealer</option>
            {dealers.map((dealer) => (
              <option key={dealer.unique_id} value={dealer.unique_id}>
                {dealer.business_name} ({dealer.unique_id})
              </option>
            ))}
          </select>
          {errors.dealerUniqueId && (
            <p className="text-red-500 text-sm">{errors.dealerUniqueId.message}</p>
          )}
        </div>

        {/* Device Name */}
        <div>
          <label className="block font-semibold">Device Name:</label>
          <input
            className="border rounded px-3 py-2 w-full"
            {...register("device_name", { required: "Device Name is required" })}
            placeholder="Enter device name"
          />
          {errors.device_name && (
            <p className="text-red-500 text-sm">{errors.device_name.message}</p>
          )}
        </div>

        {/* Device Model */}
        <div>
          <label className="block font-semibold">Device Model:</label>
          <input
            className="border rounded px-3 py-2 w-full"
            {...register("device_model", { required: "Device Model is required" })}
            placeholder="Enter device model"
          />
          {errors.device_model && (
            <p className="text-red-500 text-sm">{errors.device_model.message}</p>
          )}
        </div>

        {/* Device Category */}
        <div>
          <label className="block font-semibold">Device Category:</label>
          <input
            className="border rounded px-3 py-2 w-full"
            {...register("device_category", { required: "Device category is required" })}
            placeholder="Enter device category (e.g. Phone, Tablet)"
          />
          {errors.device_category && (
            <p className="text-red-500 text-sm">{errors.device_category.message}</p>
          )}
        </div>

        {/* Quantity */}
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
          {errors.quantity && (
            <p className="text-red-500 text-sm">{errors.quantity.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </form>

      {/* Stock Updates List */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">My Stock Updates</h2>
        {stockUpdates.length > 0 ? (
          stockUpdates.map((stock) => (
            <div key={stock.id} className="border p-4 mb-4 rounded">
              <h3 className="font-bold">
                {stock.device_name} - {stock.device_model}
              </h3>
              <p>
                Picked up on:{" "}
                {new Date(stock.pickup_date).toLocaleString()}
              </p>
              <p>
                Deadline:{" "}
                {new Date(stock.deadline).toLocaleString()}
              </p>
              <p>
                Time remaining:{" "}
                {stock.countdown ? stock.countdown : "Expired"}
              </p>
            </div>
          ))
        ) : (
          <p>No stock updates yet.</p>
        )}
      </div>
    </div>
  );
}

export default MarketerStockPickup;
