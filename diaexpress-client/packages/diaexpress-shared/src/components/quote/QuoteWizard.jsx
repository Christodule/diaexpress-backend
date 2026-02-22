import React, { useEffect, useMemo, useState } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { useRouter } from 'next/router';
import { useBackendAuth } from '../../auth/useBackendAuth';
import {
  estimateQuote,
  createQuote,
  createShipmentFromQuote,
} from '../../api/logistics';
import { fetchAddresses, createAddress, updateAddress } from '../../api/addresses';
import { Stepper } from '../ui/Stepper';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { StepItinerary } from './StepItinerary';
import { StepCargo, formatTransport } from './StepCargo';
import { StepContacts } from './StepContacts';
import { SummaryCard } from './SummaryCard';
import { AddressDialog } from './AddressDialog';
import { useQuoteMeta } from '../../hooks/useQuoteMeta';
import {
  itinerarySchema,
  cargoSchema,
  contactsSchema,
  parseNumericField,
} from '../../lib/validation/quoteSchemas';

const estimateSensitiveFields = [
  'origin',
  'destination',
  'transportType',
  'packageTypeId',
  'weight',
  'volume',
  'length',
  'width',
  'height',
];

const defaultValues = {
  origin: '',
  destination: '',
  transportType: '',
  packageTypeId: '',
  weight: '',
  length: '',
  width: '',
  height: '',
  volume: '',
  productType: '',
  productLocation: '',
  contactPhone: '',
  photoUrl: '',
  pickupOption: 'pickup',
  recipientContactName: '',
  recipientContactPhone: '',
  recipientContactEmail: '',
  senderAddressId: '',
  recipientAddressId: '',
  billingAddressId: '',
};

function formatEstimateMethod(quote) {
  if (!quote) return '';
  const providerLabel =
    quote.provider === 'internal'
      ? 'Tarif interne'
      : quote.provider
      ? quote.provider.replace(/-/g, ' ').toUpperCase()
      : 'Estimation';
  const ruleLabel = quote.appliedRule ? ` · ${quote.appliedRule}` : '';
  return `${providerLabel}${ruleLabel}`;
}

function formatCurrency(value, currency = 'EUR') {
  if (value === undefined || value === null) return '';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function QuoteWizard({ initialOrigins = [] }) {
  const router = useRouter();
  const { getToken, isSignedIn } = useBackendAuth();
  const form = useForm({ defaultValues });
  const {
    control,
    setValue,
    getValues,
    setError,
    clearErrors,
    handleSubmit,
    watch,
  } = form;

  const [activeStep, setActiveStep] = useState(0);
  const [globalError, setGlobalError] = useState('');
  const [estimateResults, setEstimateResults] = useState([]);
  const [selectedEstimateIndex, setSelectedEstimateIndex] = useState(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [estimateError, setEstimateError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressesError, setAddressesError] = useState('');
  const [addressDialog, setAddressDialog] = useState({
    open: false,
    type: 'sender',
    mode: 'create',
    initialValues: null,
  });
  const [addressDialogError, setAddressDialogError] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);

  const { origins, loading: loadingMeta, error: metaError } = useQuoteMeta(initialOrigins);

  const originValue = useWatch({ control, name: 'origin' });
  const destinationValue = useWatch({ control, name: 'destination' });
  const transportType = useWatch({ control, name: 'transportType' });
  const packageTypeId = useWatch({ control, name: 'packageTypeId' });
  const pickupOption = useWatch({ control, name: 'pickupOption' });
  const senderAddressId = useWatch({ control, name: 'senderAddressId' });
  const recipientAddressId = useWatch({ control, name: 'recipientAddressId' });
  const billingAddressId = useWatch({ control, name: 'billingAddressId' });
  const lengthValue = useWatch({ control, name: 'length' });
  const widthValue = useWatch({ control, name: 'width' });
  const heightValue = useWatch({ control, name: 'height' });
  const weightValue = useWatch({ control, name: 'weight' });
  const volumeValue = useWatch({ control, name: 'volume' });
  const productTypeValue = useWatch({ control, name: 'productType' });
  const contactPhoneValue = useWatch({ control, name: 'contactPhone' });
  const recipientContactNameValue = useWatch({ control, name: 'recipientContactName' });
  const recipientContactPhoneValue = useWatch({ control, name: 'recipientContactPhone' });
  const productLocationValue = useWatch({ control, name: 'productLocation' });
  const recipientContactEmailValue = useWatch({ control, name: 'recipientContactEmail' });

  const destinations = useMemo(() => {
    const origin = origins.find((item) => item.origin === originValue);
    return origin?.destinations || [];
  }, [origins, originValue]);

  const filteredTransportTypes = useMemo(() => {
    const origin = origins.find((item) => item.origin === originValue);
    const destination = origin?.destinations.find((item) => item.destination === destinationValue);
    return destination?.transportTypes || [];
  }, [origins, originValue, destinationValue]);

  const packageTypes = useMemo(() => {
    const origin = origins.find((item) => item.origin === originValue);
    const destination = origin?.destinations.find((item) => item.destination === destinationValue);
    const packages = destination?.packageTypes || [];
    return packages.filter(
      (pkg) => !pkg.allowedTransportTypes || pkg.allowedTransportTypes.includes(transportType)
    );
  }, [origins, originValue, destinationValue, transportType]);

  const selectedPackageType = useMemo(
    () => packageTypes.find((pkg) => pkg._id === packageTypeId),
    [packageTypes, packageTypeId]
  );

  useEffect(() => {
    if (!originValue) {
      setValue('destination', '', { shouldDirty: false });
    }
  }, [originValue, setValue]);

  useEffect(() => {
    setValue('transportType', '', { shouldDirty: false });
    setValue('packageTypeId', '', { shouldDirty: false });
    setValue('weight', '', { shouldDirty: false });
    setValue('volume', '', { shouldDirty: false });
    setValue('length', '', { shouldDirty: false });
    setValue('width', '', { shouldDirty: false });
    setValue('height', '', { shouldDirty: false });
  }, [destinationValue, setValue]);

  useEffect(() => {
    setValue('packageTypeId', '', { shouldDirty: false });
    setValue('weight', '', { shouldDirty: false });
    setValue('volume', '', { shouldDirty: false });
    setValue('length', '', { shouldDirty: false });
    setValue('width', '', { shouldDirty: false });
    setValue('height', '', { shouldDirty: false });
  }, [transportType, setValue]);

  useEffect(() => {
    if (pickupOption !== 'pickup') {
      setValue('productLocation', '', { shouldDirty: false });
      setValue('senderAddressId', '', { shouldDirty: false });
    }
  }, [pickupOption, setValue]);

  useEffect(() => {
    const shouldAutoFill = pickupOption === 'pickup' && senderAddressId;
    if (!shouldAutoFill) return;
    const sender = addresses.find((address) => address._id === senderAddressId);
    if (sender?.phone) {
      setValue('contactPhone', sender.phone, { shouldDirty: false });
    }
  }, [pickupOption, senderAddressId, addresses, setValue]);

  useEffect(() => {
    if (activeStep === 2 && !addresses.length && isSignedIn) {
      loadAddresses();
    }
  }, [activeStep, addresses.length, isSignedIn]);

  useEffect(() => {
    const hasDimensions = transportType === 'sea' && !packageTypeId;
    if (!hasDimensions) return;
    if (!lengthValue || !widthValue || !heightValue) return;
    const computed =
      (Number(lengthValue.replace(',', '.')) *
        Number(widthValue.replace(',', '.')) *
        Number(heightValue.replace(',', '.'))) /
      1_000_000;
    if (Number.isFinite(computed)) {
      const formatted = computed.toFixed(3);
      const currentVolume = getValues('volume');
      if (!currentVolume) {
        setValue('volume', formatted, { shouldDirty: false });
      }
    }
  }, [transportType, packageTypeId, lengthValue, widthValue, heightValue, setValue, getValues]);

  const resetEstimate = () => {
    setEstimateResults([]);
    setSelectedEstimateIndex(null);
    setEstimateError('');
  };

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name && estimateSensitiveFields.includes(name)) {
        resetEstimate();
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const loadAddresses = async () => {
    if (!isSignedIn) {
      setAddresses([]);
      return;
    }
    try {
      setLoadingAddresses(true);
      const token = await getToken();
      const list = await fetchAddresses(token);
      const normalised = Array.isArray(list) ? list : [];
      setAddresses(normalised);
      setAddressesError('');
    } catch (error) {
      setAddressesError(error?.message || 'Impossible de charger les adresses.');
    } finally {
      setLoadingAddresses(false);
    }
  };

  const groupedAddresses = useMemo(() => {
    return addresses.reduce(
      (acc, address) => {
        const type = address.type === 'recipient' || address.type === 'billing' ? address.type : 'sender';
        acc[type] = acc[type] ? [...acc[type], address] : [address];
        return acc;
      },
      { sender: [], recipient: [], billing: [] }
    );
  }, [addresses]);

  const selectedEstimate = useMemo(
    () => (selectedEstimateIndex !== null ? estimateResults[selectedEstimateIndex] : null),
    [estimateResults, selectedEstimateIndex]
  );

  const itineraryValid = useMemo(() => {
    const result = itinerarySchema.safeParse(getValues());
    return result.success;
  }, [originValue, destinationValue, getValues]);

  const cargoValid = useMemo(() => {
    const result = cargoSchema.safeParse(getValues());
    return result.success && Boolean(selectedEstimate);
  }, [transportType, packageTypeId, weightValue, volumeValue, lengthValue, widthValue, heightValue, getValues, selectedEstimate]);

  const contactsValid = useMemo(() => {
    const result = contactsSchema.safeParse(getValues());
    return result.success;
  }, [
    pickupOption,
    senderAddressId,
    recipientAddressId,
    billingAddressId,
    productTypeValue,
    contactPhoneValue,
    recipientContactNameValue,
    recipientContactPhoneValue,
    productLocationValue,
    recipientContactEmailValue,
    getValues,
  ]);

  const steps = [
    {
      label: 'Itinéraire',
      description: 'Origine & destination',
      status: itineraryValid ? 'done' : activeStep === 0 ? 'current' : 'upcoming',
    },
    {
      label: 'Transport',
      description: 'Mode & colis',
      status: cargoValid ? 'done' : activeStep === 1 ? 'current' : itineraryValid ? 'upcoming' : 'upcoming',
    },
    {
      label: 'Coordonnées',
      description: 'Contacts & adresses',
      status: contactsValid ? 'done' : activeStep === 2 ? 'current' : cargoValid ? 'upcoming' : 'upcoming',
    },
  ];

  const applyZodErrors = (schema, fields = []) => {
    const values = getValues();
    if (fields.length) {
      clearErrors(fields);
    }
    const result = schema.safeParse(values);
    if (result.success) {
      setGlobalError('');
      return true;
    }
    result.error.errors.forEach((issue) => {
      const field = issue.path[0];
      if (typeof field === 'string' && field in values) {
        setError(field, { type: 'manual', message: issue.message });
      }
    });
    setGlobalError('Corrigez les champs en surbrillance avant de continuer.');
    return false;
  };

  const handleStepOneNext = () => {
    const isValid = applyZodErrors(itinerarySchema, ['origin', 'destination']);
    if (!isValid) {
      return;
    }
    setActiveStep(1);
  };

  const handleStepTwoNext = () => {
    const isItineraryValid = applyZodErrors(itinerarySchema, ['origin', 'destination']);
    if (!isItineraryValid) {
      setActiveStep(0);
      return;
    }
    const isCargoValid = applyZodErrors(cargoSchema, [
      'transportType',
      'packageTypeId',
      'weight',
      'volume',
      'length',
      'width',
      'height',
    ]);
    if (!isCargoValid) {
      setActiveStep(1);
      return;
    }
    if (!selectedEstimate) {
      setGlobalError('Calculez un devis et sélectionnez une offre avant de continuer.');
      return;
    }
    setGlobalError('');
    setActiveStep(2);
    if (!addresses.length && isSignedIn) {
      loadAddresses();
    }
  };

  const handleEstimate = async () => {
    const isItineraryValid = applyZodErrors(itinerarySchema, ['origin', 'destination']);
    if (!isItineraryValid) {
      setActiveStep(0);
      return;
    }

    const isCargoValid = applyZodErrors(cargoSchema, [
      'transportType',
      'packageTypeId',
      'weight',
      'volume',
      'length',
      'width',
      'height',
    ]);
    if (!isCargoValid) {
      setActiveStep(1);
      return;
    }

    const values = getValues();
    const payload = {
      origin: values.origin,
      destination: values.destination,
      transportType: values.transportType,
    };

    if (values.packageTypeId) {
      payload.packageTypeId = values.packageTypeId;
    } else {
      const weight = parseNumericField(values.weight);
      const volume = parseNumericField(values.volume);
      const length = parseNumericField(values.length);
      const width = parseNumericField(values.width);
      const height = parseNumericField(values.height);
      if (weight !== undefined) payload.weight = weight;
      if (volume !== undefined) payload.volume = volume;
      if (length !== undefined && width !== undefined && height !== undefined) {
        payload.length = length;
        payload.width = width;
        payload.height = height;
      }
    }

    try {
      setLoadingEstimate(true);
      setEstimateError('');
      setGlobalError('');
      const response = await estimateQuote(payload);
      const quotes = Array.isArray(response?.quotes)
        ? response.quotes
            .filter(
              (quote) => quote && quote.estimatedPrice !== undefined && quote.estimatedPrice !== null
            )
            .map((quote) => ({
              ...quote,
              estimatedPrice: Number(quote.estimatedPrice),
            }))
            .sort((a, b) => a.estimatedPrice - b.estimatedPrice)
        : [];
      if (!quotes.length) {
        setEstimateError("Aucun tarif disponible pour cette combinaison.");
        setEstimateResults([]);
        setSelectedEstimateIndex(null);
        return;
      }
      setEstimateResults(quotes);
      setSelectedEstimateIndex(0);
    } catch (error) {
      setEstimateError(error?.message || "Erreur lors du calcul du devis.");
      setEstimateResults([]);
      setSelectedEstimateIndex(null);
    } finally {
      setLoadingEstimate(false);
    }
  };

  const handleSelectEstimate = (index) => {
    setSelectedEstimateIndex(index);
    setGlobalError('');
  };

  const summaryItinerary = {
    origin: originValue || 'À renseigner',
    destination: destinationValue || 'À renseigner',
  };

  const summaryCargo = {
    transportLabel: formatTransport(transportType) || 'À choisir',
    packageType: selectedPackageType?.name || '',
    weight: !selectedPackageType && weightValue ? `${weightValue} kg` : '',
    volume: !selectedPackageType && volumeValue ? `${volumeValue} m³` : '',
    dimensions:
      !selectedPackageType && lengthValue && widthValue && heightValue
        ? `${lengthValue} × ${widthValue} × ${heightValue} cm`
        : '',
  };

  const summaryContacts = {
    pickupOption,
    productType: productTypeValue,
    productLocation: productLocationValue,
    contactPhone: contactPhoneValue,
    recipientContactName: recipientContactNameValue,
    recipientContactPhone: recipientContactPhoneValue,
    recipientContactEmail: recipientContactEmailValue,
  };

  const summaryEstimate = selectedEstimate
    ? {
        price: formatCurrency(selectedEstimate.estimatedPrice, selectedEstimate.currency || 'EUR'),
        method: formatEstimateMethod(selectedEstimate),
      }
    : null;

  const resolveAddressField = (type) => {
    if (type === 'recipient') return 'recipientAddressId';
    if (type === 'billing') return 'billingAddressId';
    return 'senderAddressId';
  };

  const handleAddressDialogOpen = (type, mode) => {
    setAddressDialogError('');
    if (mode === 'edit') {
      const field = resolveAddressField(type);
      const currentId = getValues(field);
      if (!currentId) return;
      const current = addresses.find((address) => address._id === currentId);
      if (!current) return;
      setAddressDialog({ open: true, type, mode, initialValues: current || null });
      return;
    }
    setAddressDialog({ open: true, type, mode, initialValues: null });
  };

  const handleAddressDialogClose = (open) => {
    if (!open) {
      setAddressDialog((prev) => ({ ...prev, open: false }));
      setAddressDialogError('');
    }
  };

  const handleAddressDialogSubmit = async (payload) => {
    try {
      setSavingAddress(true);
      setAddressDialogError('');
      const token = await getToken();
      let saved = null;
      if (addressDialog.mode === 'edit' && addressDialog.initialValues?._id) {
        saved = await updateAddress(token, addressDialog.initialValues._id, payload);
      } else {
        saved = await createAddress(token, payload);
      }
      await loadAddresses();
      const savedId = saved?._id || saved?.id;
      if (savedId) {
        const field = resolveAddressField(payload.type);
        setValue(field, savedId, { shouldDirty: true });
      }
      setAddressDialog((prev) => ({ ...prev, open: false }));
    } catch (error) {
      setAddressDialogError(error?.message || "Impossible d'enregistrer l'adresse.");
    } finally {
      setSavingAddress(false);
    }
  };

  const onSubmit = async (values) => {
    const isItineraryValid = applyZodErrors(itinerarySchema, ['origin', 'destination']);
    if (!isItineraryValid) {
      setActiveStep(0);
      return;
    }
    const isCargoValid = applyZodErrors(cargoSchema, [
      'transportType',
      'packageTypeId',
      'weight',
      'volume',
      'length',
      'width',
      'height',
    ]);
    if (!isCargoValid) {
      setActiveStep(1);
      return;
    }
    const contactsValidResult = applyZodErrors(contactsSchema, [
      'productType',
      'productLocation',
      'contactPhone',
      'recipientContactName',
      'recipientContactPhone',
      'recipientContactEmail',
      'senderAddressId',
      'recipientAddressId',
      'billingAddressId',
    ]);
    if (!contactsValidResult) {
      setActiveStep(2);
      return;
    }
    if (!selectedEstimate) {
      setActiveStep(1);
      setGlobalError('Calculez un devis avant de finaliser votre demande.');
      return;
    }
    if (!isSignedIn) {
      setGlobalError('Connectez-vous pour enregistrer ce devis.');
      return;
    }

    const payload = {
      origin: values.origin,
      destination: values.destination,
      transportType: values.transportType,
      productType: values.productType,
      productLocation:
        values.pickupOption === 'dropoff'
          ? 'Remise en agence DiaExpress'
          : values.productLocation,
      contactPhone: values.contactPhone,
      photoUrl: values.photoUrl,
      packageTypeId: values.packageTypeId || null,
      pickupOption: values.pickupOption,
      recipientContactName: values.recipientContactName,
      recipientContactPhone: values.recipientContactPhone,
    };

    if (values.recipientContactEmail) {
      payload.recipientContactEmail = values.recipientContactEmail;
    }

    if (!values.packageTypeId) {
      const weight = parseNumericField(values.weight);
      const volume = parseNumericField(values.volume);
      const length = parseNumericField(values.length);
      const width = parseNumericField(values.width);
      const height = parseNumericField(values.height);
      if (values.transportType === 'air' && weight !== undefined) {
        payload.weight = weight;
      }
      if (values.transportType === 'sea') {
        if (volume !== undefined) {
          payload.volume = volume;
        } else if (length !== undefined && width !== undefined && height !== undefined) {
          payload.length = length;
          payload.width = width;
          payload.height = height;
          payload.volume = (length * width * height) / 1_000_000;
        }
      }
      if (values.transportType === 'road') {
        if (weight !== undefined) payload.weight = weight;
        if (volume !== undefined) payload.volume = volume;
      }
    }

    if (values.pickupOption === 'pickup' && values.senderAddressId) {
      payload.senderAddressId = values.senderAddressId;
    }
    if (values.recipientAddressId) {
      payload.recipientAddressId = values.recipientAddressId;
    }
    if (values.billingAddressId) {
      payload.billingAddressId = values.billingAddressId;
    }

    const methodLabel = formatEstimateMethod(selectedEstimate);
    payload.estimatedPrice = selectedEstimate.estimatedPrice;
    if (methodLabel) {
      payload.estimationMethod = methodLabel;
    }
    if (selectedEstimate?.matchedPricingId) {
      payload.matchedPricingId = selectedEstimate.matchedPricingId;
    }
    if (selectedEstimate?.currency) {
      payload.currency = selectedEstimate.currency;
    }
    if (selectedEstimate?.provider) {
      payload.provider = selectedEstimate.provider;
    } else if (methodLabel?.toLowerCase().includes('interne')) {
      payload.provider = 'internal';
    }

    try {
      setIsSubmitting(true);
      setGlobalError('');
      const token = await getToken();
      const quoteResponse = await createQuote(payload, token);
      const quoteId = quoteResponse?.quote?._id || quoteResponse?._id;
      if (!quoteId) {
        throw new Error("Réponse devis invalide : identifiant manquant");
      }
      const shipmentResponse = await createShipmentFromQuote(quoteId, token);
      const shipmentId = shipmentResponse?.shipment?._id || shipmentResponse?._id;
      if (!shipmentId) {
        throw new Error("Réponse expédition invalide : identifiant manquant");
      }
      router.push(`/shipment/${shipmentId}/confirm`);
    } catch (error) {
      setGlobalError(error?.message || "Erreur lors de l'envoi du devis.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormProvider {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
        noValidate
      >
        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Demande de devis</h1>
            <p className="text-sm text-slate-500 md:text-base">
              Complétez les informations de votre expédition et comparez les meilleures offres.
            </p>
          </header>

          <Stepper steps={steps} currentIndex={activeStep} />

          {globalError && <Alert variant="error">{globalError}</Alert>}
          {metaError && <Alert variant="error">{metaError}</Alert>}

          {activeStep === 0 && (
            <>
              <StepItinerary origins={origins} destinations={destinations} loading={loadingMeta} />
              <div className="flex justify-end">
                <Button type="button" onClick={handleStepOneNext}>
                  Continuer
                </Button>
              </div>
            </>
          )}

          {activeStep === 1 && (
            <>
              <StepCargo
                transportTypes={filteredTransportTypes}
                packageTypes={packageTypes}
                onEstimate={handleEstimate}
                estimateError={estimateError}
                estimateResults={estimateResults}
                selectedEstimateIndex={selectedEstimateIndex}
                onSelectEstimate={handleSelectEstimate}
                loadingEstimate={loadingEstimate}
              />
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <Button type="button" variant="secondary" onClick={() => setActiveStep(0)}>
                  Retour
                </Button>
                <Button type="button" onClick={handleStepTwoNext}>
                  Continuer
                </Button>
              </div>
            </>
          )}

          {activeStep === 2 && (
            <>
              <StepContacts
                pickupOption={pickupOption}
                onPickupChange={(value) => setValue('pickupOption', value, { shouldDirty: true })}
                addressesByType={groupedAddresses}
                selectedAddresses={{
                  senderAddressId,
                  recipientAddressId,
                  billingAddressId,
                }}
                onAddressSelect={(field, value) => {
                  setValue(field, value, { shouldDirty: true });
                  if (value) {
                    clearErrors(field);
                    return;
                  }
                  if (field === 'senderAddressId' && !value) {
                    clearErrors('senderAddressId');
                  }
                  if (field === 'recipientAddressId' && !value) {
                    clearErrors('recipientAddressId');
                  }
                  if (field === 'billingAddressId' && !value) {
                    clearErrors('billingAddressId');
                  }
                }}
                onCreateAddress={(type) => handleAddressDialogOpen(type, 'create')}
                onEditAddress={(type) => handleAddressDialogOpen(type, 'edit')}
                loadingAddresses={loadingAddresses}
                addressesError={addressesError}
                isSignedIn={isSignedIn}
              />
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <Button type="button" variant="secondary" onClick={() => setActiveStep(1)}>
                  Retour
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Envoi en cours…' : 'Envoyer la demande'}
                </Button>
              </div>
            </>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <SummaryCard
            itinerary={summaryItinerary}
            cargo={summaryCargo}
            contacts={summaryContacts}
            estimate={summaryEstimate}
          />
        </aside>

        <AddressDialog
          open={addressDialog.open}
          onOpenChange={handleAddressDialogClose}
          mode={addressDialog.mode}
          type={addressDialog.type}
          initialValues={addressDialog.initialValues || undefined}
          onSubmit={handleAddressDialogSubmit}
          saving={savingAddress}
          error={addressDialogError}
        />
      </form>
    </FormProvider>
  );
}

export default QuoteWizard;
