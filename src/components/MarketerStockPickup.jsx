import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import api from "../api"; // Your custom axios instance

function MarketerStockPickup() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const [stockUpdates, setStockUpdates] = useState([]);
  const [dealers, setDealers] = useState([]); // State to store the list of dealers.

  // Fetch the dealer list once the component mounts.
  useEffect(() => {
    fetchDealers();
  }, []);

  // Fetch existing stock updates.
  useEffect(() => {
    fetchStockUpdates();
  }, []);

  // Function to fetch dealers from the backend.
  const fetchDealers = async () => {
    try {
      const token = localStorage.getItem("token");
      // Adjust if your backend uses a different route for dealers
      const response = await api.get("/api/master-admin/dealers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data && response.data.dealers) {
        setDealers(response.data.dealers);
      }
    } catch (error) {
      console.error("Error fetching dealers:", error);
      // Optionally display an error message to the user.
    }
  };

  // Function to fetch existing stock updates for the marketer.
  const fetchStockUpdates = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/api/stock/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data && response.data.data) {
        setStockUpdates(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching stock updates:", error);
    }
  };

  // Handle form submission to create a new stock update.
  const onSubmit = async (data) => {
    try {
      const token = localStorage.getItem("token");
      // POST to your createStockUpdate endpoint
      const response = await api.post("/api/stock/", data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert("Stock update recorded successfully!");
      reset();
      // Re-fetch the stock updates after creation.
      fetchStockUpdates();
    } catch (error) {
      console.error("Error recording stock update:", error);
      alert("Error recording stock update");
    }
  };

  return (
    <div className="w-full p-4">  {/* Make container wide */}
      <h2 className="text-2xl font-bold mb-4">Record Stock Pickup</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
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
            <p className="text-red-500 text-sm">
              {errors.dealerUniqueId.message}
            </p>
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
            {...register("device_model", {
              required: "Device Model is required",
            })}
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
            {...register("device_category", {
              required: "Device category is required",
            })}
            placeholder="Enter device category (e.g. Phone, Tablet)"
          />
          {errors.device_category && (
            <p className="text-red-500 text-sm">
              {errors.device_category.message}
            </p>
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

      {/* Display existing stock updates in a wide table */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">My Stock Updates</h2>

        {/* Make table container horizontally scrollable for wide content */}
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-medium">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Dealer
                </th>
                <th scope="col" className="px-6 py-3">
                  Marketer
                </th>
                <th scope="col" className="px-6 py-3">
                  Device
                </th>
                <th scope="col" className="px-6 py-3">
                  Category
                </th>
                <th scope="col" className="px-6 py-3">
                  Quantity
                </th>
                <th scope="col" className="px-6 py-3">
                  Pickup Date
                </th>
                <th scope="col" className="px-6 py-3">
                  Deadline
                </th>
                <th scope="col" className="px-6 py-3">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stockUpdates.length > 0 ? (
                stockUpdates.map((stock) => {
                  // We'll assume your backend returns:
                  // stock.dealer_business_name
                  // stock.dealer_unique_id
                  // stock.marketer_name
                  // stock.marketer_unique_id
                  // stock.marketer_location
                  // This requires a join in your getStockUpdates code. 
                  const {
                    dealer_business_name = "N/A",
                    dealer_unique_id = "N/A",
                    marketer_name = "N/A",
                    marketer_unique_id = "N/A",
                    marketer_location = "N/A",
                    device_name,
                    device_model,
                    device_category,
                    quantity,
                    pickup_date,
                    deadline,
                    sold,
                    countdown,
                  } = stock;

                  // Determine status text
                  let statusText = "";
                  if (sold) {
                    statusText = "Sold";
                  } else if (countdown && countdown !== "Expired") {
                    statusText = `Time remaining: ${countdown}`;
                  } else {
                    statusText = "Expired";
                  }

                  return (
                    <tr key={stock.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {dealer_business_name} ({dealer_unique_id})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {marketer_name} ({marketer_unique_id})
                        <br />
                        <span className="text-gray-500 text-xs">
                          Location: {marketer_location}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {device_name} - {device_model}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {device_category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(pickup_date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(deadline).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{statusText}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No stock updates yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default MarketerStockPickup;
