const Pricing = require("../models/Pricing");

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

function computeVolume(dimensions, fallbackVolume) {
  if (fallbackVolume != null && Number.isFinite(Number(fallbackVolume))) {
    return Number(fallbackVolume);
  }

  if (!dimensions) return null;
  const { length, width, height } = dimensions;
  if ([length, width, height].every((v) => Number.isFinite(Number(v)))) {
    return (Number(length) * Number(width) * Number(height)) / 1_000_000;
  }
  return null;
}

function matchDimensionRange(ranges = [], context = {}) {
  const sorted = [...ranges].sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));
  return (
    sorted.find((range) => {
      const checks = [
        range.minLength == null || (context.length != null && context.length >= range.minLength),
        range.maxLength == null || (context.length != null && context.length <= range.maxLength),
        range.minWidth == null || (context.width != null && context.width >= range.minWidth),
        range.maxWidth == null || (context.width != null && context.width <= range.maxWidth),
        range.minHeight == null || (context.height != null && context.height >= range.minHeight),
        range.maxHeight == null || (context.height != null && context.height <= range.maxHeight),
        range.minWeight == null || (context.weight != null && context.weight >= range.minWeight),
        range.maxWeight == null || (context.weight != null && context.weight <= range.maxWeight),
        range.minVolume == null || (context.volume != null && context.volume >= range.minVolume),
        range.maxVolume == null || (context.volume != null && context.volume <= range.maxVolume),
      ];

      return checks.every(Boolean);
    }) || null
  );
}

function computeUnitPrice(transportPricing, { weight, volume }) {
  if (transportPricing.pricePerUnit == null) return null;
  const unit = transportPricing.unitType || transportPricing.allowedUnits?.[0];
  if (unit === 'kg' && weight != null) {
    return { total: weight * transportPricing.pricePerUnit, unitApplied: 'kg' };
  }
  if (unit === 'm3' && volume != null) {
    return { total: volume * transportPricing.pricePerUnit, unitApplied: 'm3' };
  }
  return null;
}

async function getInternalQuote({
  origin,
  destination,
  transportType,
  weight,
  dimensions,
  volume,
  packageTypeId,
  transportLineId,
}) {
  const query = {};
  if (transportLineId) {
    query.transportLineId = transportLineId;
  } else {
    query.origin = origin;
    query.destination = destination;
  }

  if (transportType) {
    query['transportPrices.transportType'] = transportType;
  }

  const pricings = await Pricing.find(query).lean();
  if (!pricings.length) return null;

  const context = {
    weight: toNumber(weight),
    volume: computeVolume(dimensions, volume),
    length: dimensions?.length != null ? toNumber(dimensions.length) : null,
    width: dimensions?.width != null ? toNumber(dimensions.width) : null,
    height: dimensions?.height != null ? toNumber(dimensions.height) : null,
  };

  let best = null;

  pricings.forEach((pricing) => {
    const tp = pricing.transportPrices?.find((entry) =>
      transportType ? entry.transportType === transportType : !!entry
    );
    if (!tp) return;

    const warnings = [];
    const match = {
      pricingId: pricing._id,
      transportLineId: pricing.transportLineId,
      packageTypeId: packageTypeId || null,
      matchedDimensionRangeId: null,
      unitApplied: null,
    };

    let price = null;
    let basePrice = null;

    if (packageTypeId && Array.isArray(tp.packagePricing)) {
      const pkg = tp.packagePricing.find(
        (p) => p.packageTypeId && String(p.packageTypeId) === String(packageTypeId)
      );
      if (pkg) {
        basePrice = pkg.basePrice;
      } else {
        warnings.push('packageType_non_trouve');
      }
    }

    const matchedRange = matchDimensionRange(tp.dimensionRanges, context);
    if (matchedRange) {
      price = matchedRange.price;
      match.matchedDimensionRangeId = matchedRange._id || null;
      match.unitApplied = 'dimensionRange';
    }

    if (price == null && basePrice != null) {
      price = basePrice;
      match.unitApplied = 'package';
    }

    if (price == null) {
      const unitResult = computeUnitPrice(tp, context);
      if (unitResult) {
        price = unitResult.total;
        basePrice = tp.pricePerUnit;
        match.unitApplied = unitResult.unitApplied;
      } else if (tp.pricePerUnit != null) {
        warnings.push('valeur_unite_manquante');
      }
    }

    if (price == null) {
      warnings.push('aucune_regle_match');
      return;
    }

    const candidate = {
      provider: 'internal',
      estimatedPrice: price,
      currency: pricing.currency || 'USD',
      appliedRule: match,
      breakdown: {
        basePrice: basePrice ?? price,
        computedWeight: context.weight,
        computedVolume: context.volume,
        unitPrice: tp.pricePerUnit ?? null,
      },
      warnings,
    };

    if (!best || candidate.estimatedPrice < best.estimatedPrice) {
      best = candidate;
    }
  });

  return best;
}

module.exports = { getInternalQuote };
