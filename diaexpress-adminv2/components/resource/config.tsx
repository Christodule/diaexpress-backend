import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  paymentStatusConfig,
  quoteStatusConfig,
  resolveStatusClass,
  resolveStatusLabel,
  shipmentStatusConfig,
} from '@/lib/status';
import { formatCurrency, formatDate, toTitle } from '@/src/lib/format';
import type { LogisticsAddress, LogisticsUser, PackageType, PricingRule, Quote, Shipment } from '@/src/types/logistics';
import type { ApiKey, DiaPayAdminUser, NotificationJob, Payment } from '@/src/types/diapay';
import type { PaginatedParams, PaginatedResult } from '@/src/types/pagination';
import { fetchQuotes } from '@/src/services/api/logisticsQuotes';
import { fetchShipments } from '@/src/services/api/logisticsShipments';
import { fetchPricingRules, fetchPackageTypes } from '@/src/services/api/logisticsPricing';
import { fetchUsers } from '@/src/services/api/logisticsUsers';
import { fetchAddresses } from '@/src/services/api/logisticsAddresses';
import { fetchPayments, fetchJobs, fetchApiKeys, fetchAdminUsers } from '@/src/services/api/diapayAdmin';

export type ResourceName =
  | 'quotes'
  | 'shipments'
  | 'pricing'
  | 'packageTypes'
  | 'users'
  | 'addresses'
  | 'payments'
  | 'jobs'
  | 'apiKeys'
  | 'adminUsers';

export type Column<T> = {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
};

export type ResourceConfig<T> = {
  name: ResourceName;
  description: string;
  columns: Column<T>[];
  fetcher: (params: PaginatedParams) => Promise<PaginatedResult<T>>;
  statusOptions?: { value: string; label: string }[];
  getRowId?: (item: T) => string;
};

export const resourceConfigs: Record<ResourceName, ResourceConfig<any>> = {
  quotes: {
    name: 'quotes',
    description: 'Suivez vos devis actifs, conversions en expédition et estimations dynamiques.',
    columns: [
      {
        key: 'reference',
        label: 'Référence',
        render: (quote: Quote) => <Link href={`/admin/quotes/${quote._id}`}>{quote._id}</Link>
      },
      {
        key: 'customer',
        label: 'Client',
        render: (quote: Quote) => quote.userEmail || quote.requestedBy || '—'
      },
      {
        key: 'amount',
        label: 'Montant estimé',
        render: (quote: Quote) => formatCurrency(quote.finalPrice ?? quote.estimatedPrice, quote.currency)
      },
      {
        key: 'status',
        label: 'Statut',
        render: (quote: Quote) => (
          <Badge className={resolveStatusClass(quote.status, quoteStatusConfig)}>
            {resolveStatusLabel(quote.status, quoteStatusConfig)}
          </Badge>
        )
      },
      {
        key: 'provider',
        label: 'Provider',
        render: (quote: Quote) => quote.provider || 'internal'
      },
      {
        key: 'createdAt',
        label: 'Créé le',
        render: (quote: Quote) => formatDate(quote.createdAt)
      }
    ],
    fetcher: fetchQuotes,
    statusOptions: [
      { value: 'pending', label: 'En attente' },
      { value: 'confirmed', label: 'Confirmé' },
      { value: 'rejected', label: 'Rejeté' },
      { value: 'dispatched', label: 'Dispatché' }
    ],
    getRowId: (quote: Quote) => quote._id
  },
  shipments: {
    name: 'shipments',
    description: 'Expéditions et tracking consolidés des transporteurs internes & partenaires.',
    columns: [
      {
        key: 'trackingCode',
        label: 'Tracking',
        render: (shipment: Shipment) => <Link href={`/admin/shipments/${shipment._id}`}>{shipment.trackingCode}</Link>
      },
      { key: 'origin', label: 'Origine', render: (shipment: Shipment) => shipment.origin || '—' },
      { key: 'destination', label: 'Destination', render: (shipment: Shipment) => shipment.destination || '—' },
      {
        key: 'status',
        label: 'Statut',
        render: (shipment: Shipment) => (
          <Badge className={resolveStatusClass(shipment.status, shipmentStatusConfig)}>
            {resolveStatusLabel(shipment.status, shipmentStatusConfig)}
          </Badge>
        )
      },
      {
        key: 'estimatedDelivery',
        label: 'ETA',
        render: (shipment: Shipment) => formatDate(shipment.estimatedDelivery)
      }
    ],
    fetcher: fetchShipments,
    statusOptions: [
      { value: 'pending', label: 'Pending' },
      { value: 'booked', label: 'Booked' },
      { value: 'dispatched', label: 'Dispatched' },
      { value: 'scheduled', label: 'Programmé' },
      { value: 'in_transit', label: 'In transit' },
      { value: 'delivered', label: 'Livré' },
      { value: 'cancelled', label: 'Annulé' }
    ],
    getRowId: (shipment: Shipment) => shipment._id
  },
  pricing: {
    name: 'pricing',
    description: 'Gestion des grilles tarifaires par lane, provider et type de transport.',
    columns: [
      { key: 'route', label: 'Route', render: (rule: PricingRule) => rule.route },
      { key: 'transportType', label: 'Transport', render: (rule: PricingRule) => rule.transportType },
      { key: 'provider', label: 'Provider', render: (rule: PricingRule) => rule.provider || 'internal' },
      { key: 'basePrice', label: 'Base price', render: (rule: PricingRule) => formatCurrency(rule.basePrice, rule.currency) },
      { key: 'priority', label: 'Priorité', render: (rule: PricingRule) => rule.priority ?? 0 }
    ],
    fetcher: async () => {
      const data = await fetchPricingRules();
      return {
        items: data.pricing ?? [],
        total: data.pricing?.length ?? 0,
        page: 1,
        pageSize: data.pricing?.length || 1
      };
    },
    getRowId: (rule: PricingRule) => rule._id ?? rule.route
  },
  packageTypes: {
    name: 'packageTypes',
    description: 'Typologies de colis et capacités disponibles pour la tarification.',
    columns: [
      { key: 'label', label: 'Nom', render: (pkg: PackageType) => pkg.label },
      { key: 'description', label: 'Description', render: (pkg: PackageType) => pkg.description || '—' },
      { key: 'maxWeight', label: 'Poids max', render: (pkg: PackageType) => pkg.maxWeight ?? '—' },
      { key: 'maxVolume', label: 'Volume max', render: (pkg: PackageType) => pkg.maxVolume ?? '—' }
    ],
    fetcher: async (params) => {
      const data = await fetchPackageTypes();
      const items = data.packageTypes ?? [];
      return {
        items,
        total: items.length,
        page: params.page ?? 1,
        pageSize: params.pageSize ?? (items.length || 1)
      };
    },
    getRowId: (pkg: PackageType) => pkg._id
  },
  users: {
    name: 'users',
    description: 'Rôles et états des utilisateurs logistiques DiaExpress.',
    columns: [
      { key: 'email', label: 'Email', render: (user: LogisticsUser) => user.email },
      { key: 'name', label: 'Nom', render: (user: LogisticsUser) => user.name || '—' },
      { key: 'role', label: 'Rôle', render: (user: LogisticsUser) => toTitle(user.role || 'client') },
      { key: 'status', label: 'Statut', render: (user: LogisticsUser) => user.status || 'active' },
      { key: 'createdAt', label: 'Créé le', render: (user: LogisticsUser) => formatDate(user.createdAt) }
    ],
    fetcher: async (params) => fetchUsers(params),
    getRowId: (user: LogisticsUser) => user._id ?? user.email
  },
  addresses: {
    name: 'addresses',
    description: 'Carnet d’adresses synchronisé depuis les comptes clients.',
    columns: [
      { key: 'label', label: 'Label', render: (address: LogisticsAddress) => address.label },
      { key: 'street', label: 'Rue', render: (address: LogisticsAddress) => address.street || '—' },
      { key: 'city', label: 'Ville', render: (address: LogisticsAddress) => address.city || '—' },
      { key: 'country', label: 'Pays', render: (address: LogisticsAddress) => address.country || '—' },
      { key: 'type', label: 'Type', render: (address: LogisticsAddress) => toTitle(address.type || 'standard') }
    ],
    fetcher: async () => {
      const addresses = await fetchAddresses();
      return { items: addresses, total: addresses.length, page: 1, pageSize: addresses.length || 1 };
    },
    getRowId: (address: LogisticsAddress) => address._id ?? address.label
  },
  payments: {
    name: 'payments',
    description: 'Flux diaPay (fiat + crypto) synchronisés avec les devis/expéditions.',
    columns: [
      { key: 'id', label: 'Paiement', render: (payment: Payment) => <Link href={`/admin/payments/${payment.id}`}>{payment.id}</Link> },
      { key: 'method', label: 'Méthode', render: (payment: Payment) => payment.method },
      { key: 'amount', label: 'Montant', render: (payment: Payment) => formatCurrency(payment.amount, payment.currency) },
      {
        key: 'status',
        label: 'Statut',
        render: (payment: Payment) => (
          <Badge className={resolveStatusClass(payment.status, paymentStatusConfig)}>
            {resolveStatusLabel(payment.status, paymentStatusConfig)}
          </Badge>
        ),
      },
      { key: 'createdAt', label: 'Créé le', render: (payment: Payment) => formatDate(payment.createdAt) }
    ],
    fetcher: fetchPayments,
    statusOptions: [
      { value: 'pending', label: 'Pending' },
      { value: 'processing', label: 'Processing' },
      { value: 'succeeded', label: 'Succès' },
      { value: 'failed', label: 'Echec' }
    ],
    getRowId: (payment: Payment) => payment.id
  },
  jobs: {
    name: 'jobs',
    description: 'Jobs de notifications DiaPay (webhooks, e-mails, SMS).',
    columns: [
      { key: 'id', label: 'Job', render: (job: NotificationJob) => job.id },
      { key: 'type', label: 'Type', render: (job: NotificationJob) => job.type },
      { key: 'status', label: 'Statut', render: (job: NotificationJob) => job.status },
      { key: 'attempts', label: 'Tentatives', render: (job: NotificationJob) => job.attempts ?? 0 },
      { key: 'createdAt', label: 'Créé le', render: (job: NotificationJob) => formatDate(job.createdAt) }
    ],
    fetcher: fetchJobs
  },
  apiKeys: {
    name: 'apiKeys',
    description: 'Gestion des accès API et tokens diaPay.',
    columns: [
      { key: 'id', label: 'ID', render: (key: ApiKey) => key.id },
      { key: 'label', label: 'Label', render: (key: ApiKey) => key.label },
      { key: 'status', label: 'Statut', render: (key: ApiKey) => key.status },
      { key: 'createdAt', label: 'Créé le', render: (key: ApiKey) => formatDate(key.createdAt) },
      { key: 'lastUsedAt', label: 'Dernière utilisation', render: (key: ApiKey) => formatDate(key.lastUsedAt) }
    ],
    fetcher: fetchApiKeys
  },
  adminUsers: {
    name: 'adminUsers',
    description: 'Utilisateurs habilités à accéder au cockpit diaPay Admin.',
    columns: [
      { key: 'email', label: 'Email', render: (user: DiaPayAdminUser) => user.email },
      { key: 'role', label: 'Rôle', render: (user: DiaPayAdminUser) => toTitle(user.role) },
      { key: 'createdAt', label: 'Ajouté le', render: (user: DiaPayAdminUser) => formatDate(user.createdAt) }
    ],
    fetcher: fetchAdminUsers
  }
};
