// src/components/SomeComponent.jsx
import React, { useEffect, useState } from "react";
import api from "../api"; // our custom axios instance

function SomeComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/some-endpoint")
      .then((response) => {
        setData(response.data);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, []);

  return (
    <div>
      <h1>Data from API:</h1>
      {data ? <pre>{JSON.stringify(data, null, 2)}</pre> : <p>Loading...</p>}
    </div>
  );
}

export default SomeComponent;
