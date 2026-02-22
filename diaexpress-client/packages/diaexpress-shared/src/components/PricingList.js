import React, { useEffect, useState } from 'react';
import { buildApiUrl } from '../api/api';

const PricingList = () => {
  const [pricings, setPricings] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(buildApiUrl('/api/pricing'));
      const data = await res.json();
      setPricings(data);
    };
    fetchData();
  }, []);

  return (
    <div>
      <h2>Liste des tarifs</h2>
      <ul>
        {pricings.map((p, i) => (
          <li key={i}>
            {p.region} - {p.mode} : {p.minWeight}kg à {p.maxWeight}kg → {p.price} €
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PricingList;
