'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiClient, getApiBaseUrl } from '@/lib/api/client';
import { useAdminAuthToken } from '@/hooks/useAdminAuthToken';

type HealthState = {
  status: 'idle' | 'loading' | 'ok' | 'error';
  endpoint?: string;
  durationMs?: number;
  error?: string;
  summary?: string;
};

type IdentitySnapshot = {
  role?: string;
  userId?: string;
  identityType?: string;
};

const HEALTH_ENDPOINTS = ['/api/health', '/api/v1/public/services'] as const;

function formatDuration(durationMs?: number) {
  if (!durationMs && durationMs !== 0) return '—';
  return `${durationMs} ms`;
}

export function ApiHealthPanel() {
  const { token, loading: tokenLoading, error: tokenError, refresh: refreshToken } = useAdminAuthToken();
  const [health, setHealth] = useState<HealthState>({ status: 'idle' });
  const [identity, setIdentity] = useState<IdentitySnapshot | null>(null);

  const runChecks = useCallback(async () => {
    setHealth({ status: 'loading' });
    let lastError: string | undefined;

    for (const endpoint of HEALTH_ENDPOINTS) {
      const start = Date.now();
      try {
        const response = await apiClient<unknown>(endpoint);
        const durationMs = Date.now() - start;

        const summary =
          typeof response === 'string'
            ? response
            : response && typeof response === 'object' && 'services' in (response as Record<string, unknown>)
              ? `services: ${((response as { services?: unknown[] }).services || []).length}`
              : 'ok';

        setHealth({ status: 'ok', endpoint, durationMs, summary });
        lastError = undefined;
        break;
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Erreur inconnue';
        if (endpoint === HEALTH_ENDPOINTS[HEALTH_ENDPOINTS.length - 1]) {
          setHealth({ status: 'error', endpoint, error: lastError });
        }
      }
    }

    try {
      const profile = await apiClient<{ user?: { _id?: string; role?: string }; identity?: { type?: string } }>(
        'api/users/me'
      );
      setIdentity({
        role: profile.user?.role,
        userId: profile.user?._id,
        identityType: profile.identity?.type
      });
    } catch (error) {
      setIdentity(null);
      if (!lastError) {
        setHealth((prev) => ({
          ...prev,
          status: prev.status === 'ok' ? 'error' : prev.status,
          error: error instanceof Error ? error.message : 'Erreur de profil'
        }));
      }
    }
  }, []);

  useEffect(() => {
    void runChecks();
  }, [runChecks]);

  return (
    <div className="page-stack">
      <div className="panel">
        <div className="panel__header">
          <div className="panel__title">API Health</div>
          <div className="panel__actions">
            <Button size="sm" variant="ghost" onClick={() => void refreshToken()}>
              Rafraîchir token
            </Button>
            <Button size="sm" onClick={() => void runChecks()}>
              Relancer les checks
            </Button>
          </div>
        </div>
        <div className="panel__content">
          <div className="status-grid">
            <div className="stat-card">
              <p>Logistics API</p>
              <strong>{getApiBaseUrl('logistics')}</strong>
            </div>
            <div className="stat-card">
              <p>DiaPay Admin API</p>
              <strong>{getApiBaseUrl('diapay')}</strong>
            </div>
            <div className="stat-card">
              <p>Auth token</p>
              <strong>{tokenLoading ? '...' : token ? 'Présent' : 'Absent'}</strong>
            </div>
            <div className="stat-card">
              <p>Rôle</p>
              <strong>{identity?.role ?? '—'}</strong>
            </div>
            <div className="stat-card">
              <p>Identité</p>
              <strong>{identity?.identityType ?? '—'}</strong>
            </div>
            <div className="stat-card">
              <p>User ID</p>
              <strong>{identity?.userId ?? '—'}</strong>
            </div>
          </div>

          {tokenError ? <div className="alert alert--error">{tokenError}</div> : null}

          <div className="status-grid">
            <div className="stat-card">
              <p>Endpoint pingé</p>
              <strong>{health.endpoint ?? '—'}</strong>
            </div>
            <div className="stat-card">
              <p>Durée</p>
              <strong>{formatDuration(health.durationMs)}</strong>
            </div>
            <div className="stat-card">
              <p>Résumé</p>
              <strong>{health.summary ?? '—'}</strong>
            </div>
            <div className="stat-card">
              <p>Statut</p>
              <strong>{health.status}</strong>
            </div>
          </div>

          {health.error ? <div className="alert alert--error">{health.error}</div> : null}
        </div>
      </div>
    </div>
  );
}
