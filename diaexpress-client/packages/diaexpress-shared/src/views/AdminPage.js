import React from 'react';
import AdminPricing from './AdminPricing';
import AdminPackageType from './AdminPackageType';
import AdminQuotes from './AdminQuotes';
import AdminSchedules from './AdminSchedules';

const AdminPage = () => {
  return (
    <div>
      <h1>Dashboard Admin</h1>

      <section>
        <AdminQuotes />
      </section>
      

      <section>
        <AdminPricing />
      </section>
  <section>
        <AdminSchedules />
      </section>

      <section>
        <AdminPackageType />
      </section>
    </div>
  );
};

export default AdminPage;
