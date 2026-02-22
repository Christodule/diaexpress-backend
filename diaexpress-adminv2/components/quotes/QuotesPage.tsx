'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { QuoteFilters } from './QuoteFilters';
import { QuoteFormDrawer } from './QuoteFormDrawer';
import { QuoteActionDrawer, type QuoteAction, type QuoteActionPayload } from './QuoteActionDrawer';
import { QuotesTable } from './QuotesTable';
import { useToast } from '@/components/ui/toast';
import { useQuotes } from '@/hooks/useQuotes';
import { buildQueryString } from '@/lib/api/client';
import { confirmQuote, convertQuoteToShipment, rejectQuote, updateQuote } from '@/lib/api/quotes';
import { formatCurrency } from '@/src/lib/format';
import type { Quote } from '@/src/types/logistics';

export function QuotesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [page, setPage] = useState(() => Number(searchParams.get('page')) || 1);
  const [search, setSearch] = useState(() => searchParams.get('search') ?? '');
  const [status, setStatus] = useState(() => searchParams.get('status') ?? '');
  const [dateFrom, setDateFrom] = useState(() => searchParams.get('from') ?? '');
  const [dateTo, setDateTo] = useState(() => searchParams.get('to') ?? '');
  const [showCreate, setShowCreate] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [activeAction, setActiveAction] = useState<QuoteAction | null>(null);
  const [activeQuote, setActiveQuote] = useState<Quote | null>(null);
  const { notify } = useToast();

  useEffect(() => {
    setPage(Number(searchParams.get('page')) || 1);
    setSearch(searchParams.get('search') ?? '');
    setStatus(searchParams.get('status') ?? '');
    setDateFrom(searchParams.get('from') ?? '');
    setDateTo(searchParams.get('to') ?? '');
    if (searchParams.get('create') === '1') {
      setShowCreate(true);
    }
  }, [searchParams]);

  const { items, total, totalPages, loading, error, refresh } = useQuotes({
    page,
    pageSize: 25,
    search,
    status,
    from: dateFrom,
    to: dateTo
  });

  const syncQueryParams = (nextValues: Partial<Record<'page' | 'search' | 'status' | 'dateFrom' | 'dateTo', unknown>>) => {
    const merged = {
      page,
      search,
      status,
      dateFrom,
      dateTo,
      ...nextValues
    };

    const query = buildQueryString({
      page: merged.page && Number(merged.page) > 1 ? merged.page : undefined,
      search: merged.search || undefined,
      status: merged.status || undefined,
      from: merged.dateFrom || undefined,
      to: merged.dateTo || undefined
    });

    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const openAction = (action: QuoteAction, quote: Quote) => {
    setActiveAction(action);
    setActiveQuote(quote);
    setActionError(null);
  };

  const resetFeedback = () => {
    setMessage(null);
    setActionError(null);
  };

  const closeAction = () => {
    setActiveAction(null);
    setActiveQuote(null);
  };

  const canConvert = (quote: Quote) =>
    quote.status === 'confirmed' && (!quote.shipmentId || quote.shipmentId === '') && quote.paymentStatus === 'confirmed';

  const handleActionSubmit = async (payload: QuoteActionPayload) => {
    if (!activeAction || !activeQuote) return;

    try {
      setSubmittingAction(true);
      setActionError(null);

      if (activeAction === 'confirm') {
        const updated = await confirmQuote(activeQuote._id, { finalPrice: payload.finalPrice });
        const price = formatCurrency(updated.finalPrice ?? updated.estimatedPrice, updated.currency);
        setMessage(`Devis validé (${price}).`);
        notify({ title: 'Devis validé', message: price, type: 'success' });
      }

      if (activeAction === 'edit') {
        await updateQuote(activeQuote._id, {
          finalPrice: payload.finalPrice,
          notes: payload.notes,
        });
        setMessage('Devis mis à jour.');
        notify({ title: 'Devis mis à jour', type: 'success' });
      }

      if (activeAction === 'reject') {
        await rejectQuote(activeQuote._id, payload.reason);
        setMessage('Devis rejeté.');
        notify({ title: 'Devis rejeté', type: 'info' });
      }

      if (activeAction === 'convert') {
        if (!canConvert(activeQuote)) {
          throw new Error('Le devis doit être confirmé et payé avant conversion.');
        }
        const result = await convertQuoteToShipment(activeQuote._id);
        const trackingCode = result?.shipment?.trackingCode;
        setMessage(trackingCode ? `Shipment créé (${trackingCode}).` : 'Shipment créé depuis le devis.');
        notify({
          title: 'Shipment créé',
          message: trackingCode ? `Tracking ${trackingCode}` : undefined,
          type: 'success',
        });
      }

      refresh();
      closeAction();
    } catch (err) {
      const message = (err as Error).message || 'Action impossible sur ce devis.';
      setActionError(message);
      notify({ title: 'Action échouée', message, type: 'error' });
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleQuoteCreated = () => {
    setShowCreate(false);
    if (searchParams.get('create')) {
      router.replace(pathname, { scroll: false });
    }
    refresh();
    notify({ title: 'Devis créé', type: 'success' });
  };

  const handleCloseCreate = () => {
    setShowCreate(false);
    if (searchParams.get('create')) {
      router.replace(pathname, { scroll: false });
    }
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    syncQueryParams({ page: nextPage });
    resetFeedback();
  };

  const handleStatusChange = (value: string) => {
    resetFeedback();
    setStatus(value);
    setPage(1);
    syncQueryParams({ status: value, page: 1 });
  };

  const handleSearchChange = (value: string) => {
    resetFeedback();
    setSearch(value);
    setPage(1);
    syncQueryParams({ search: value, page: 1 });
  };

  const handleDateFromChange = (value: string) => {
    resetFeedback();
    setDateFrom(value);
    setPage(1);
    syncQueryParams({ dateFrom: value, page: 1 });
  };

  const handleDateToChange = (value: string) => {
    resetFeedback();
    setDateTo(value);
    setPage(1);
    syncQueryParams({ dateTo: value, page: 1 });
  };

  return (
    <div className="page-stack">
      <PageHeader
        title="Devis"
        description="Vue d'ensemble des devis clients et devis internes."
        breadcrumbs={[{ label: 'Ops', href: '/admin' }, { label: 'Devis' }]}
        actions={
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            Créer un devis
          </Button>
        }
      />

      <QuoteFilters
        status={status}
        search={search}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onStatusChange={handleStatusChange}
        onSearchChange={handleSearchChange}
        onDateFromChange={handleDateFromChange}
        onDateToChange={handleDateToChange}
        onQuickViewChange={handleStatusChange}
        onRefresh={() => {
          resetFeedback();
          refresh();
        }}
        loading={loading}
      />

      <QuotesTable
        items={items}
        loading={loading}
        error={error}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={handlePageChange}
        onConfirm={(quote) => openAction('confirm', quote)}
        onReject={(quote) => openAction('reject', quote)}
        onEdit={(quote) => openAction('edit', quote)}
        onConvert={(quote) => openAction('convert', quote)}
        onRequestNewQuote={() => setShowCreate(true)}
        message={message}
        actionError={actionError}
      />

      <QuoteFormDrawer open={showCreate} onClose={handleCloseCreate} onCreated={handleQuoteCreated} />
      <QuoteActionDrawer
        open={Boolean(activeAction && activeQuote)}
        action={activeAction}
        quote={activeQuote}
        submitting={submittingAction}
        onClose={closeAction}
        onSubmit={handleActionSubmit}
      />
    </div>
  );
}
