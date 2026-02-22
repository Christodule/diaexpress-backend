
// src/components/ShipmentList.js
import React, { useEffect, useState } from 'react';

const ShipmentList = () => {
  const [shipments, setShipments] = useState([]);

  useEffect(() => {
    fetch('/api/shipments/me')
      .then(res => res.json())
      .then(data => setShipments(data));
  }, []);

  return (
    <ul>
      {shipments.map((s) => (
        <li key={s._id}>{s.status} - Destination: {s.destination}</li>
      ))}
    </ul>
  );
};

export default ShipmentList;