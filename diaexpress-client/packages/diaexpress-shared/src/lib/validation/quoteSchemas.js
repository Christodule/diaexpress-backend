import { z } from 'zod';

const phoneRegex = /^\+?[0-9 .-]{7,16}$/;

const numericString = z
  .string()
  .optional()
  .transform((value) => (value ?? '').trim())
  .refine(
    (value) => value === '' || !Number.isNaN(Number(value.replace(',', '.'))),
    {
      message: 'Valeur numérique invalide.',
    }
  );

const optionalString = z
  .string()
  .optional()
  .transform((value) => (value ?? '').trim());

export const itinerarySchema = z.object({
  origin: z.string().trim().min(1, "Sélectionnez une origine."),
  destination: z.string().trim().min(1, 'Choisissez une destination.'),
});

const cargoSchemaBase = z.object({
  transportType: z.string().trim().min(1, 'Sélectionnez un mode de transport.'),
  packageTypeId: optionalString,
  weight: numericString,
  volume: numericString,
  length: numericString,
  width: numericString,
  height: numericString,
});

export const cargoSchema = cargoSchemaBase.superRefine((values, ctx) => {
    const transport = values.transportType.toLowerCase();
    const hasPackageType = Boolean(values.packageTypeId);

    const toNumber = (value) => {
      if (value === undefined || value === null || value === '') return undefined;
      const parsed = Number(String(value).replace(',', '.'));
      return Number.isNaN(parsed) ? undefined : parsed;
    };

    const weightValue = toNumber(values.weight);
    const volumeValue = toNumber(values.volume);
    const lengthValue = toNumber(values.length);
    const widthValue = toNumber(values.width);
    const heightValue = toNumber(values.height);

    const ensurePositive = (numericValue, field) => {
      if (numericValue !== undefined && numericValue <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La valeur doit être supérieure à 0.',
          path: [field],
        });
      }
    };

    ensurePositive(weightValue, 'weight');
    ensurePositive(volumeValue, 'volume');
    ensurePositive(lengthValue, 'length');
    ensurePositive(widthValue, 'width');
    ensurePositive(heightValue, 'height');

    if (hasPackageType) {
      return;
    }

    if (transport === 'air' && !weightValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Le poids est requis pour le transport aérien.',
        path: ['weight'],
      });
    }

    if (transport === 'sea') {
      const hasVolume = Boolean(volumeValue);
      const hasDimensions = Boolean(lengthValue && widthValue && heightValue);

      if (!hasVolume && !hasDimensions) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Renseignez le volume ou les dimensions du colis.',
          path: ['volume'],
        });
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Ajoutez les dimensions si vous ne connaissez pas le volume.',
          path: ['length'],
        });
      }
    }

    if (transport === 'road' && !weightValue && !volumeValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Indiquez le poids ou le volume pour le transport routier.',
        path: ['weight'],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Indiquez le poids ou le volume pour le transport routier.',
        path: ['volume'],
      });
    }
  }
);

const contactsSchemaBase = z.object({
  productType: z.string().trim().min(1, 'Précisez la marchandise expédiée.'),
  productLocation: optionalString,
  contactPhone: z
    .string()
    .trim()
    .min(1, 'Renseignez un numéro de téléphone expéditeur.')
    .regex(phoneRegex, 'Téléphone invalide (ex: +33612345678).'),
  photoUrl: optionalString,
  pickupOption: z.enum(['pickup', 'dropoff']).default('pickup'),
  recipientContactName: z
    .string()
    .trim()
    .min(1, 'Renseignez le contact destinataire.'),
  recipientContactPhone: z
    .string()
    .trim()
    .min(1, 'Renseignez le téléphone du destinataire.')
    .regex(phoneRegex, 'Téléphone destinataire invalide.'),
  recipientContactEmail: z
    .union([z.string().trim().email('Email invalide.'), z.literal(''), z.undefined()])
    .optional(),
  senderAddressId: optionalString,
  recipientAddressId: optionalString,
  billingAddressId: optionalString,
});

export const contactsSchema = contactsSchemaBase.superRefine((values, ctx) => {
    if (values.pickupOption === 'pickup') {
      if (!values.productLocation) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Indiquez le lieu de récupération du colis.',
          path: ['productLocation'],
        });
      }
      if (!values.senderAddressId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Sélectionnez l'adresse de récupération.",
          path: ['senderAddressId'],
        });
      }
    }

    if (!values.recipientAddressId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Sélectionnez l'adresse destinataire.",
        path: ['recipientAddressId'],
      });
    }
  }
);

export const quoteWizardSchema = itinerarySchema.merge(cargoSchema).merge(contactsSchema);

export const parseNumericField = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isNaN(parsed) ? undefined : parsed;
};
