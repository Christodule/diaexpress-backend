import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAdminAuthGuard } from '../auth/useAdminAuthGuard';
import {
  fetchCmaCgmCredentialsMeta,
  listExternalPricing,
  syncExternalPricing,
  updateCmaCgmCredentials,
} from '../api/externalPricing';

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const AdminExternalPricing = () => {
  const { requireAdminToken, isAdminReady } = useAdminAuthGuard();
  const [externalPrices, setExternalPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [filters, setFilters] = useState({
    origin: '',
    destination: '',
    validFrom: '',
    validTo: '',
  });

  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const [syncResult, setSyncResult] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState('');

  const [credentials, setCredentials] = useState({ apiKey: '', accountNumber: '' });
  const [credentialsMeta, setCredentialsMeta] = useState(null);
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [credentialsError, setCredentialsError] = useState('');
  const [credentialsSuccess, setCredentialsSuccess] = useState('');

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((previous) => ({ ...previous, [name]: value }));
  };

  const handleSort = (columnKey) => {
    setSortConfig((previous) => {
      if (previous.key === columnKey) {
        return { key: columnKey, direction: previous.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key: columnKey, direction: 'asc' };
    });
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (event) => {
    setPageSize(Number(event.target.value));
    setCurrentPage(1);
  };

  const fetchCredentialsMeta = useCallback(async () => {
    if (!isAdminReady) return;
    setCredentialsError('');
    try {
      const token = await requireAdminToken();
      const meta = await fetchCmaCgmCredentialsMeta(token);
      setCredentialsMeta(meta);
    } catch (error) {
      setCredentialsError(error.message || 'Impossible de récupérer les informations des credentials.');
    }
  }, [isAdminReady, requireAdminToken]);

  const fetchPricing = useCallback(async () => {
    if (!isAdminReady) return;
    setLoading(true);
    setFetchError('');
    try {
      const token = await requireAdminToken();
      const result = await listExternalPricing({ token });
      setExternalPrices(result.data || []);
      if (result.meta?.lastSync) {
        setSyncResult(result.meta.lastSync);
      }
    } catch (error) {
      setFetchError(error.message || 'Erreur lors du chargement des tarifs externes.');
    } finally {
      setLoading(false);
    }
  }, [isAdminReady, requireAdminToken]);

  useEffect(() => {
    fetchPricing();
    fetchCredentialsMeta();
  }, [fetchPricing, fetchCredentialsMeta]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, externalPrices.length]);

  const filteredPrices = useMemo(() => {
    return externalPrices.filter((item) => {
      const originMatch = filters.origin
        ? item.origin?.toLowerCase().includes(filters.origin.toLowerCase())
        : true;
      const destinationMatch = filters.destination
        ? item.destination?.toLowerCase().includes(filters.destination.toLowerCase())
        : true;
      const fromMatch = filters.validFrom
        ? new Date(item.validFrom) >= new Date(filters.validFrom)
        : true;
      const toMatch = filters.validTo ? new Date(item.validTo) <= new Date(filters.validTo) : true;
      return originMatch && destinationMatch && fromMatch && toMatch;
    });
  }, [externalPrices, filters]);

  const sortedPrices = useMemo(() => {
    if (!sortConfig.key) {
      return filteredPrices;
    }
    const sorted = [...filteredPrices];
    sorted.sort((a, b) => {
      const valueA = a[sortConfig.key];
      const valueB = b[sortConfig.key];
      if (valueA === null || valueA === undefined) return 1;
      if (valueB === null || valueB === undefined) return -1;
      if (valueA === valueB) return 0;

      if (!Number.isNaN(Number(valueA)) && !Number.isNaN(Number(valueB))) {
        return sortConfig.direction === 'asc'
          ? Number(valueA) - Number(valueB)
          : Number(valueB) - Number(valueA);
      }

      return sortConfig.direction === 'asc'
        ? String(valueA).localeCompare(String(valueB))
        : String(valueB).localeCompare(String(valueA));
    });
    return sorted;
  }, [filteredPrices, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedPrices.length / pageSize));
  const currentPageData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedPrices.slice(start, start + pageSize);
  }, [sortedPrices, currentPage, pageSize]);

  const handleSync = async () => {
    setSyncError('');
    setSyncLoading(true);
    try {
      const token = await getToken();
      const response = await syncExternalPricing({ token });
      const resultDetails = {
        timestamp: response.timestamp || new Date().toISOString(),
        importedCount:
          response.importedCount ?? response.count ?? response.itemsImported ?? response.totalImported ?? 0,
        errors: response.errors || response.failedItems || null,
        message: response.message,
      };
      setSyncResult(resultDetails);
      await fetchPricing();
    } catch (error) {
      setSyncError(error.message || 'Erreur lors de la synchronisation des tarifs CMA CGM.');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleCredentialsChange = (event) => {
    const { name, value } = event.target;
    setCredentials((previous) => ({ ...previous, [name]: value }));
  };

  const handleCredentialsSubmit = async (event) => {
    event.preventDefault();
    setCredentialsError('');
    setCredentialsSuccess('');
    if (!credentials.apiKey || !credentials.accountNumber) {
      setCredentialsError('Merci de renseigner la clé API et le compte CMA CGM.');
      return;
    }
    setCredentialsLoading(true);
    try {
      const token = await getToken();
      await updateCmaCgmCredentials(credentials, token);
      setCredentialsSuccess('Credentials CMA CGM enregistrés avec succès.');
      setCredentials({ apiKey: '', accountNumber: '' });
      await fetchCredentialsMeta();
    } catch (error) {
      setCredentialsError(error.message || 'Impossible d\'enregistrer les credentials CMA CGM.');
    } finally {
      setCredentialsLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!sortedPrices.length) {
      return;
    }
    const headers = ['Origine', 'Destination', 'Type de conteneur', 'Prix', 'Devise', 'Valide du', 'Valide jusqu\'au'];
    const rows = sortedPrices.map((item) => [
      item.origin || '',
      item.destination || '',
      item.containerType || '',
      item.price ?? '',
      item.currency || '',
      item.validFrom ? new Date(item.validFrom).toISOString().split('T')[0] : '',
      item.validTo ? new Date(item.validTo).toISOString().split('T')[0] : '',
    ]);

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `tarifs-cma-cgm-${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-external-pricing">
      <div className="admin-external-pricing__header">
        <h2>🌐 Tarifs CMA CGM</h2>
        <div className="admin-external-pricing__actions">
          <button className="primary" onClick={handleSync} disabled={syncLoading}>
            {syncLoading ? 'Synchronisation…' : '🔄 Synchroniser maintenant'}
          </button>
          <button className="secondary" onClick={handleExportCsv} disabled={!sortedPrices.length}>
            ⬇️ Export CSV
          </button>
        </div>
      </div>

      {loading && <p>Chargement des tarifs...</p>}
      {fetchError && <p className="error">{fetchError}</p>}

      <div className="admin-external-pricing__layout">
        <div className="admin-external-pricing__main">
          <div className="filters">
            <input
              name="origin"
              placeholder="Filtrer par origine"
              value={filters.origin}
              onChange={handleFilterChange}
            />
            <input
              name="destination"
              placeholder="Filtrer par destination"
              value={filters.destination}
              onChange={handleFilterChange}
            />
            <label className="filters__date">
              <span>Valide du</span>
              <input type="date" name="validFrom" value={filters.validFrom} onChange={handleFilterChange} />
            </label>
            <label className="filters__date">
              <span>Valide jusqu'au</span>
              <input type="date" name="validTo" value={filters.validTo} onChange={handleFilterChange} />
            </label>
          </div>

          {!loading && !sortedPrices.length && !fetchError && (
            <p className="empty-state">Aucun tarif externe trouvé avec les filtres actuels.</p>
          )}

          {sortedPrices.length > 0 && (
            <div className="pricing-table__container">
              <table className="pricing-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('origin')}>
                      Origine {sortConfig.key === 'origin' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => handleSort('destination')}>
                      Destination {sortConfig.key === 'destination' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => handleSort('containerType')}>
                      Conteneur {sortConfig.key === 'containerType' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => handleSort('price')}>
                      Prix {sortConfig.key === 'price' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => handleSort('currency')}>
                      Devise {sortConfig.key === 'currency' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => handleSort('validFrom')}>
                      Valide de {sortConfig.key === 'validFrom' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => handleSort('validTo')}>
                      Valide jusqu'à {sortConfig.key === 'validTo' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentPageData.map((item) => (
                    <tr key={item._id || `${item.origin}-${item.destination}-${item.validFrom}`}>
                      <td>{item.origin}</td>
                      <td>{item.destination}</td>
                      <td>{item.containerType}</td>
                      <td>{item.price}</td>
                      <td>{item.currency}</td>
                      <td>{item.validFrom ? new Date(item.validFrom).toLocaleDateString() : '-'}</td>
                      <td>{item.validTo ? new Date(item.validTo).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pagination">
                <div className="pagination__info">
                  Page {currentPage} sur {totalPages}
                </div>
                <div className="pagination__controls">
                  <button onClick={() => handlePageChange(1)} disabled={currentPage === 1}>
                    ⏮️
                  </button>
                  <button onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                    ◀️
                  </button>
                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    ▶️
                  </button>
                  <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages}>
                    ⏭️
                  </button>
                </div>
                <div className="pagination__page-size">
                  <label>
                    Par page
                    <select value={pageSize} onChange={handlePageSizeChange}>
                      {PAGE_SIZE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="admin-external-pricing__sidebar">
          <section className="sidebar-card">
            <h3>Dernière synchronisation</h3>
            {syncError && <p className="error">{syncError}</p>}
            {syncResult ? (
              <ul className="sync-details">
                <li>
                  <strong>Horodatage :</strong> {new Date(syncResult.timestamp).toLocaleString()}
                </li>
                <li>
                  <strong>Tarifs importés :</strong> {syncResult.importedCount}
                </li>
                {syncResult.message && (
                  <li>
                    <strong>Message :</strong> {syncResult.message}
                  </li>
                )}
                {syncResult.errors && Array.isArray(syncResult.errors) && syncResult.errors.length > 0 && (
                  <li>
                    <strong>Erreurs :</strong>
                    <ul>
                      {syncResult.errors.map((errorItem, index) => (
                        <li key={index}>{errorItem}</li>
                      ))}
                    </ul>
                  </li>
                )}
                {syncResult.errors && !Array.isArray(syncResult.errors) && (
                  <li>
                    <strong>Erreurs :</strong> {syncResult.errors}
                  </li>
                )}
              </ul>
            ) : (
              <p>Aucune synchronisation enregistrée pour le moment.</p>
            )}
          </section>

          <section className="sidebar-card">
            <h3>Credentials CMA CGM</h3>
            {credentialsError && <p className="error">{credentialsError}</p>}
            {credentialsSuccess && <p className="success">{credentialsSuccess}</p>}
            {credentialsMeta?.updatedAt && (
              <p className="meta">Dernière mise à jour : {new Date(credentialsMeta.updatedAt).toLocaleString()}</p>
            )}
            {credentialsMeta?.account && <p className="meta">Compte : {credentialsMeta.account}</p>}
            <form className="credentials-form" onSubmit={handleCredentialsSubmit}>
              <label>
                Clé API
                <input
                  type="password"
                  name="apiKey"
                  placeholder="Votre clé API CMA CGM"
                  value={credentials.apiKey}
                  onChange={handleCredentialsChange}
                  autoComplete="off"
                />
              </label>
              <label>
                Compte CMA CGM
                <input
                  type="text"
                  name="accountNumber"
                  placeholder="Compte / identifiant"
                  value={credentials.accountNumber}
                  onChange={handleCredentialsChange}
                  autoComplete="off"
                />
              </label>
              <button type="submit" className="primary" disabled={credentialsLoading}>
                {credentialsLoading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </form>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default AdminExternalPricing;
