'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableHeader } from '@/components/ui/table';
import { resourceConfigs, type ResourceName } from './config';
import { usePaginatedResource } from '@/src/hooks/usePaginatedResource';

export function ResourceTable({ resource }: { resource: ResourceName }) {
  const config = resourceConfigs[resource];
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const fetcher = useMemo(() => config.fetcher, [config]);
  const { items, total, page, pageSize, loading, error, setParams } = usePaginatedResource(fetcher, {
    page: 1,
    pageSize: 10
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setParams({ search, status: status || undefined, page: 1 });
  };

  return (
    <div className="resource-table">
      <form className="resource-table__filters" onSubmit={handleSubmit}>
        <Input placeholder="Recherche..." value={search} onChange={(event) => setSearch(event.target.value)} />
        {config.statusOptions ? (
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Tous les statuts</option>
            {config.statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        ) : null}
        <Button type="submit" disabled={loading}>
          Filtrer
        </Button>
        <Button type="button" variant="ghost" onClick={() => setParams({ page: 1 })} disabled={loading}>
          Rafraîchir
        </Button>
      </form>

      {error ? <div className="alert alert--error">{error.message}</div> : null}

      <div className="table-wrapper">
        <Table>
          <TableHeader>
            <tr>
              {config.columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
            </tr>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <tr key={`skeleton-${index}`}>
                  {config.columns.map((column) => (
                    <td key={`skeleton-${column.key}`}>
                      <div className="skeleton" style={{ width: `${60 + index * 5}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={config.columns.length}>
                  <div className="empty-state">Aucune donnée à afficher.</div>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={config.getRowId?.(item) ?? (item.id || item._id)}>
                  {config.columns.map((column) => {
                    const value = column.render
                      ? column.render(item)
                      : (item as Record<string, React.ReactNode | string | number | boolean | null | undefined>)[column.key];

                    const cellContent = (value ?? '—') as React.ReactNode;

                    return <td key={column.key}>{cellContent}</td>;
                  })}
                </tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="pagination">
        <span>
          Page {page} / {totalPages} – {total} éléments
        </span>
        <div className="pagination__actions">
          <Button type="button" variant="ghost" disabled={page <= 1 || loading} onClick={() => setParams({ page: page - 1 })}>
            Précédent
          </Button>
          <Button type="button" variant="ghost" disabled={page >= totalPages || loading} onClick={() => setParams({ page: page + 1 })}>
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
}
