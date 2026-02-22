const express = require('express');
const PackageType = require('../../models/PackageType');
const Pricing = require('../../models/Pricing');
const { fetchPublicRates, formatFxQuotes } = require('../../services/publicFxService');

const router = express.Router();

const TRANSPORT_LABELS = {
  air: 'Aérien',
  sea: 'Maritime',
  road: 'Routier',
  rail: 'Ferroviaire',
  drone: 'Drone',
  camion: 'Camion',
  train: 'Ferroviaire',
};

const CONDITION_LABELS = {
  fuel_surcharge: 'Surcharge carburant',
  peak_season: 'Saison haute',
  customs_tax: 'Taxes douanières',
  insurance: 'Assurance',
  other: 'Condition spécifique',
};

function normalizeId(value) {
  if (!value) {
    return null;
  }
  try {
    return value.toString();
  } catch (error) {
    return String(value);
  }
}

function resolveCurrency(pricing) {
  const currency = pricing?.meta?.currency;
  if (typeof currency === 'string' && currency.trim().length === 3) {
    return currency.trim().toUpperCase();
  }
  return 'EUR';
}

function formatMoney(value, currency) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  const resolvedCurrency = typeof currency === 'string' && currency.length === 3 ? currency : 'EUR';

  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: resolvedCurrency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch (error) {
    return `${value.toFixed(2)} ${resolvedCurrency}`;
  }
}

function formatTransportLabel(type) {
  if (!type) {
    return 'Transport';
  }
  return TRANSPORT_LABELS[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

function formatCondition(condition, currency) {
  if (!condition || typeof condition !== 'object') {
    return null;
  }
  const label = CONDITION_LABELS[condition.type] || 'Condition';
  const value = typeof condition.value === 'number' ? condition.value : null;
  if (value === null) {
    return `${label}`;
  }
  if (condition.unit === 'percent') {
    return `${label} : ${value}%`;
  }
  const money = formatMoney(value, currency);
  return money ? `${label} : ${money}` : `${label} : ${value}`;
}

function formatRangeHighlight(range) {
  if (!range || typeof range !== 'object') {
    return null;
  }
  const parts = [];
  if (typeof range.minWeight === 'number' || typeof range.maxWeight === 'number') {
    const from = typeof range.minWeight === 'number' ? `${range.minWeight}` : '0';
    const to = typeof range.maxWeight === 'number' ? `${range.maxWeight}` : '∞';
    parts.push(`Poids : ${from} - ${to} kg`);
  }
  if (typeof range.minVolume === 'number' || typeof range.maxVolume === 'number') {
    const from = typeof range.minVolume === 'number' ? `${range.minVolume}` : '0';
    const to = typeof range.maxVolume === 'number' ? `${range.maxVolume}` : '∞';
    parts.push(`Volume : ${from} - ${to} m³`);
  }
  if (parts.length === 0) {
    return null;
  }
  return `Plage tarifaire (${parts.join(', ')})`;
}

function buildPackageTypeServices(packageTypes, packageUsageById) {
  return packageTypes.map((pkg) => {
    const pkgId = normalizeId(pkg._id);
    const usage = packageUsageById.get(pkgId) || [];
    const highlights = [];

    if (Array.isArray(pkg.allowedTransportTypes) && pkg.allowedTransportTypes.length > 0) {
      const labels = pkg.allowedTransportTypes.map((type) => formatTransportLabel(type));
      highlights.push(`Modes pris en charge : ${labels.join(', ')}`);
    }

    if (usage.length > 0) {
      const corridors = Array.from(
        new Set(
          usage.map((item) => `${item.pricing.origin} → ${item.pricing.destination}`),
        ),
      ).slice(0, 3);
      if (corridors.length > 0) {
        highlights.push(`Corridors disponibles : ${corridors.join(', ')}`);
      }

      const basePrices = usage
        .map((item) => (typeof item.package.basePrice === 'number' ? item.package.basePrice : null))
        .filter((value) => typeof value === 'number');

      if (basePrices.length > 0) {
        const minPrice = Math.min(...basePrices);
        const currency = usage[0]?.currency ?? 'EUR';
        const formatted = formatMoney(minPrice, currency);
        if (formatted) {
          highlights.push(`Tarif indicatif dès ${formatted}`);
        }
      }
    }

    return {
      id: `package:${pkgId}`,
      name: pkg.name,
      category: 'Catalogue colis',
      description: pkg.description ?? null,
      highlights: highlights.length > 0 ? highlights : null,
      deliveryTimeframe: null,
    };
  });
}

function buildTransportServices(pricings, packageTypeById) {
  const services = [];

  pricings.forEach((pricing) => {
    const currency = resolveCurrency(pricing);
    const deliveryTimeframe = pricing?.meta?.deliveryTimeframe ?? null;
    const transportPrices = Array.isArray(pricing.transportPrices) ? pricing.transportPrices : [];

    transportPrices.forEach((transport) => {
      const transportType = transport.transportType;
      const label = formatTransportLabel(transportType);
      const serviceId = `pricing:${normalizeId(pricing._id)}:${transportType || 'transport'}`;
      const highlights = new Set();

      highlights.add(`Origine : ${pricing.origin}`);
      highlights.add(`Destination : ${pricing.destination}`);

      if (transport.unitType) {
        highlights.add(`Unité de facturation : ${transport.unitType.toUpperCase()}`);
      }

      if (typeof transport.pricePerUnit === 'number' && Number.isFinite(transport.pricePerUnit)) {
        const money = formatMoney(transport.pricePerUnit, currency);
        if (money) {
          highlights.add(`Tarif indicatif : ${money} / ${transport.unitType?.toUpperCase() || 'unité'}`);
        }
      }

      if (Array.isArray(transport.packagePricing)) {
        transport.packagePricing.forEach((pack) => {
          const packageId = normalizeId(pack.packageTypeId);
          const pkg = packageTypeById.get(packageId);
          const packLabel = pkg?.name || pack.name;
          const money = formatMoney(pack.basePrice, currency);
          if (packLabel && money) {
            highlights.add(`Forfait ${packLabel} : ${money}`);
          }
        });
      }

      if (Array.isArray(transport.containerPricing)) {
        transport.containerPricing.forEach((container) => {
          if (!container || typeof container !== 'object') {
            return;
          }
          const money = formatMoney(container.basePrice, currency);
          if (container.containerType && money) {
            highlights.add(`Container ${container.containerType} : ${money}`);
          }
        });
      }

      if (Array.isArray(transport.conditions)) {
        transport.conditions.forEach((condition) => {
          const text = formatCondition(condition, currency);
          if (text) {
            highlights.add(text);
          }
        });
      }

      if (Array.isArray(transport.dimensionRanges) && transport.dimensionRanges.length > 0) {
        const dimensionHighlights = transport.dimensionRanges
          .map((range) => formatRangeHighlight(range))
          .filter(Boolean)
          .slice(0, 2);
        dimensionHighlights.forEach((item) => highlights.add(item));
      }

      const description = `Solution ${label.toLowerCase()} entre ${pricing.origin} et ${pricing.destination}.`;
      const highlightsArray = Array.from(highlights);

      services.push({
        id: serviceId,
        name: `${label} ${pricing.origin} → ${pricing.destination}`,
        category: `Transport ${label}`,
        description,
        highlights: highlightsArray.length > 0 ? highlightsArray : null,
        deliveryTimeframe: deliveryTimeframe || null,
      });
    });
  });

  return services;
}

function buildPublicServices(packageTypes, pricings) {
  const packageTypeById = new Map();
  const packageUsageById = new Map();

  packageTypes.forEach((pkg) => {
    const id = normalizeId(pkg._id);
    if (id) {
      packageTypeById.set(id, pkg);
    }
  });

  pricings.forEach((pricing) => {
    const currency = resolveCurrency(pricing);
    const transportPrices = Array.isArray(pricing.transportPrices) ? pricing.transportPrices : [];

    transportPrices.forEach((transport) => {
      if (!Array.isArray(transport.packagePricing)) {
        return;
      }
      transport.packagePricing.forEach((pack) => {
        const packageId = normalizeId(pack.packageTypeId);
        if (!packageId) {
          return;
        }
        if (!packageUsageById.has(packageId)) {
          packageUsageById.set(packageId, []);
        }
        packageUsageById.get(packageId).push({
          pricing,
          transport,
          package: pack,
          currency,
        });
      });
    });
  });

  const packageServices = buildPackageTypeServices(packageTypes, packageUsageById);
  const transportServices = buildTransportServices(pricings, packageTypeById);
  const services = packageServices.concat(transportServices);

  return services.sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
}

router.get('/services', async (req, res, next) => {
  try {
    const [packageTypes, pricings] = await Promise.all([
      PackageType.find().lean().exec(),
      Pricing.find().lean().exec(),
    ]);

    const services = buildPublicServices(packageTypes, pricings);
    res.json({ services });
  } catch (error) {
    next(error);
  }
});

router.get('/rates', async (req, res, next) => {
  try {
    const quotes = await fetchPublicRates();
    const rates = formatFxQuotes(quotes);
    res.json({ rates });
  } catch (error) {
    next(error);
  }
});

module.exports = Object.assign(router, {
  buildPublicServices,
});
