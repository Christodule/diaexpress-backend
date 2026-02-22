export type QuoteStatus = 'pending' | 'confirmed' | 'rejected' | 'dispatched';
export type QuotePaymentStatus = 'pending' | 'confirmed' | 'failed';
export type ShipmentStatus =
  | 'pending'
  | 'booked'
  | 'dispatched'
  | 'scheduled'
  | 'in_transit'
  | 'arrived'
  | 'delivered'
  | 'cancelled';

export interface Quote {
  _id: string;
  origin: string;
  destination: string;
  transportType: 'air' | 'sea' | string;
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  volume?: number;
  status: QuoteStatus;
  provider?: string;
  estimatedPrice?: number;
  finalPrice?: number;
  currency?: string;
  contactPhone?: string;
  recipientContactName?: string;
  recipientContactEmail?: string;
  recipientContactPhone?: string;
  userEmail?: string;
  requestedBy?: string;
  requestedByLabel?: string;
  notes?: string;
  paymentStatus?: QuotePaymentStatus;
  productLocation?: string;
  createdAt?: string;
  updatedAt?: string;
  shipmentId?: string;
  trackingNumber?: string;
  packageTypeId?: { _id: string; name?: string } | string;
}

export interface Shipment {
  _id: string;
  quoteId: string;
  trackingCode: string;
  status: ShipmentStatus;
  origin?: string;
  destination?: string;
  provider?: string;
  carrier?: string;
  currentLocation?: string;
  estimatedDelivery?: string;
  trackingUpdates?: Array<{ location?: string; status?: ShipmentStatus; note?: string; timestamp?: string }>;
  meta?: {
    quote?: { origin?: string; destination?: string; estimatedPrice?: number };
    [key: string]: unknown;
  };
  embarkmentId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PricingRule {
  _id: string;
  route?: string;
  origin?: string;
  destination?: string;
  transportType: string;
  transportLineId?: string;
  transportPrices?: Array<{
    transportType: string;
    unitType: string;
    allowedUnits?: string[];
    pricePerUnit?: number;
    dimensionRanges?: Array<{ min?: number; max?: number; price: number; priority?: number }>;
    packagePricing?: Array<{ packageTypeId: string; basePrice: number; name?: string }>;
  }>;
  provider?: string;
  dimensionRanges?: string | { min: number; max: number; price: number }[];
  basePrice?: number;
  pricePerUnit?: number;
  unitType?: string;
  packagePricing?: { packageTypeId: string; basePrice: number }[];
  currency: string;
  priority?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PackageType {
  _id: string;
  label: string;
  description?: string;
  maxWeight?: number;
  maxVolume?: number;
}

export interface LogisticsUser {
  _id: string;
  email: string;
  name?: string;
  role?: string;
  status?: string;
  createdAt?: string;
}

export interface LogisticsAddress {
  _id: string;
  label: string;
  street?: string;
  city?: string;
  country?: string;
  type?: string;
  userId?: string;
  createdAt?: string;
}

export interface Country {
  _id: string;
  code: string;
  name: string;
  isActive?: boolean;
}

export type MarketPointType = 'agency' | 'hub' | 'relay' | string;

export interface MarketPoint {
  _id: string;
  name: string;
  label?: string;
  city?: string;
  countryCode?: string;
  countryName?: string;
  countryId?: Country | string | null;
  type: MarketPointType;
  addressText?: string;
  geo?: { lat?: number; lng?: number };
  isActive?: boolean;
}

export interface AdminAddress {
  _id: string;
  label: string;
  marketPointId?: MarketPoint | string | null;
  contactName?: string;
  contactPhone?: string;
  addressText?: string;
  line1?: string;
  line2?: string;
  city?: string;
  country?: string;
  countryCode?: string;
  geo?: { lat?: number; lng?: number };
  isActive?: boolean;
  createdAt?: string;
}

export type TransportMode = 'air' | 'sea' | 'road';

export interface TransportLine {
  _id: string;
  origin?: string;
  destination?: string;
  country?: string;
  location?: string;
  transportType?: TransportMode;
  transportTypes: TransportMode[];
  lineCode?: string;
  isActive: boolean;
  notes?: string;
  departureDates?: string[];
  estimatedTransitDays?: number;
  createdAt?: string;
  updatedAt?: string;
  originMarketPointId?: MarketPoint | string | null;
  destinationMarketPointId?: MarketPoint | string | null;
}

export type ExpeditionStatus = 'pending' | 'scheduled' | 'in_transit' | 'delivered' | 'cancelled';

export interface Expedition {
  _id: string;
  quoteId?: string;
  shipmentId?: string;
  shipments?: string[];
  transportLineId: TransportLine | string;
  plannedDepartureDate?: string;
  plannedArrivalDate?: string;
  status: ExpeditionStatus;
  voyageCode?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Embarkment {
  _id: string;
  transportLineId: TransportLine | string;
  transportType?: TransportMode;
  startDate?: string;
  endDate?: string;
  cutoffDate?: string;
  status?: string;
  label?: string;
  isActive?: boolean;
  createdAt?: string;
}
