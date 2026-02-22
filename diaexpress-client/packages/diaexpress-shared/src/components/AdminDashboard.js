
// src/components/AdminDashboard.js
import React, { useEffect, useState } from 'react';

const AdminDashboard = () => {
  const [shipments, setShipments] = useState([]);

  useEffect(() => {
    fetch('/api/shipments/all')
      .then(res => res.json())
      .then(data => setShipments(data));
  }, []);

  return (
    <ul>
      {shipments.map((s) => (
        <li key={s._id}>{s.clientName}: {s.status} ({s.destination})</li>
      ))}
    </ul>
  );
};

export default AdminDashboard;