export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  quoteId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: string;
  customerEmail?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentSummary {
  totalVolume: number;
  currency: string;
  byStatus: Record<PaymentStatus | string, number>;
}

export interface NotificationJob {
  id: string;
  type: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  attempts?: number;
}

export interface ApiKey {
  id: string;
  label: string;
  createdAt?: string;
  lastUsedAt?: string;
  status: 'active' | 'revoked';
}

export interface DiaPayAdminUser {
  id: string;
  email: string;
  role: string;
  createdAt?: string;
}
