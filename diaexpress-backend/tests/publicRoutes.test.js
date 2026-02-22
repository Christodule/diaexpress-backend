const test = require('node:test');
const assert = require('node:assert/strict');

const publicRouter = require('../routes/v1/public');
const { formatFxQuotes } = require('../services/publicFxService');

const { buildPublicServices } = publicRouter;

test('buildPublicServices agrège les PackageType et Pricing en catalogue public', () => {
  const packageTypes = [
    {
      _id: 'pkg1',
      name: 'Colis Express',
      description: 'Livraison urgente avec suivi temps réel.',
      allowedTransportTypes: ['air', 'road'],
    },
  ];

  const pricings = [
    {
      _id: 'pricing1',
      origin: 'Dakar',
      destination: 'Paris',
      meta: { currency: 'eur', deliveryTimeframe: '5-7 jours' },
      transportPrices: [
        {
          transportType: 'air',
          unitType: 'kg',
          pricePerUnit: 12.5,
          packagePricing: [
            { packageTypeId: 'pkg1', name: 'Express 5kg', basePrice: 60 },
          ],
          containerPricing: [],
          conditions: [
            { type: 'fuel_surcharge', value: 12, unit: 'percent' },
          ],
          dimensionRanges: [
            { minWeight: 0, maxWeight: 30, price: 250 },
          ],
        },
      ],
    },
  ];

  const services = buildPublicServices(packageTypes, pricings);
  assert.equal(services.length, 2);

  const packageService = services.find((service) => service.id === 'package:pkg1');
  assert.ok(packageService, 'le service package doit exister');
  assert.equal(packageService.category, 'Catalogue colis');
  assert.ok(
    packageService.highlights?.some((text) => text.includes('Modes pris en charge')), 
    'les modes de transport doivent être listés',
  );

  const transportService = services.find((service) => service.id === 'pricing:pricing1:air');
  assert.ok(transportService, 'le service transport doit exister');
  assert.equal(transportService.deliveryTimeframe, '5-7 jours');
  assert.ok(
    transportService.highlights?.some((text) => text.includes('Tarif indicatif')), 
    'le tarif unitaire doit être présent dans les highlights',
  );
});

test('formatFxQuotes formate la réponse publique des taux de change', () => {
  const now = new Date();
  const rates = formatFxQuotes([
    {
      baseCurrency: 'usd',
      quoteCurrency: 'eur',
      rate: 0.91,
      fetchedAt: now,
    },
  ]);

  assert.deepEqual(rates, [
    {
      baseCurrency: 'USD',
      quoteCurrency: 'EUR',
      midMarketRate: 0.91,
      updatedAt: now.toISOString(),
    },
  ]);
});
