import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Label } from '../ui/Label';
import { Input } from '../ui/Input';
import { RadioGroup, RadioGroupItem } from '../ui/RadioGroup';
import { Alert } from '../ui/Alert';
import { AddressPicker } from './AddressPicker';
import { Skeleton } from '../ui/Skeleton';

export function StepContacts({
  pickupOption,
  onPickupChange,
  addressesByType,
  selectedAddresses,
  onAddressSelect,
  onCreateAddress,
  onEditAddress,
  loadingAddresses,
  addressesError,
  isSignedIn,
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  useEffect(() => {
    register('pickupOption');
    register('senderAddressId');
    register('recipientAddressId');
    register('billingAddressId');
  }, [register]);

  const getFieldError = (fieldError) => (fieldError?.message ? String(fieldError.message) : undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Coordonnées & adresses</CardTitle>
        <CardDescription>
          Précisez les informations marchandise et les contacts pour finaliser votre demande.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="productType">Marchandise *</Label>
              <Input
                id="productType"
                placeholder="ex: Smartphones"
                {...register('productType')}
                aria-invalid={Boolean(errors.productType)}
              />
              <p className="text-xs text-slate-500">Soyez précis pour obtenir le tarif le plus adapté.</p>
              {errors.productType && (
                <p className="text-xs text-red-600">{String(errors.productType.message)}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="photoUrl">Photo (URL)</Label>
              <Input id="photoUrl" placeholder="https://" {...register('photoUrl')} />
              <p className="text-xs text-slate-500">Optionnel : ajoutez une photo pour accélérer la validation.</p>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Mode de collecte *</Label>
            <RadioGroup className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <RadioGroupItem
                name="pickupOption"
                value="pickup"
                checked={pickupOption === 'pickup'}
                onChange={() => onPickupChange('pickup')}
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">Ramassage sur site</p>
                  <p className="text-xs text-slate-500">Un coursier récupère la marchandise à votre adresse.</p>
                </div>
              </RadioGroupItem>
              <RadioGroupItem
                name="pickupOption"
                value="dropoff"
                checked={pickupOption === 'dropoff'}
                onChange={() => onPickupChange('dropoff')}
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">Dépôt en agence</p>
                  <p className="text-xs text-slate-500">Vous déposez le colis dans une agence DiaExpress.</p>
                </div>
              </RadioGroupItem>
            </RadioGroup>
          </div>

          {pickupOption === 'pickup' && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="productLocation">Lieu de récupération *</Label>
              <Input
                id="productLocation"
                placeholder="Entrepôt de Yopougon"
                {...register('productLocation')}
                aria-invalid={Boolean(errors.productLocation)}
              />
              <p className="text-xs text-slate-500">Indiquez précisément l’emplacement de collecte.</p>
              {errors.productLocation && (
                <p className="text-xs text-red-600">{String(errors.productLocation.message)}</p>
              )}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">Contacts</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="contactPhone">Téléphone expéditeur *</Label>
              <Input
                id="contactPhone"
                placeholder="ex: +22660123456"
                {...register('contactPhone')}
                aria-invalid={Boolean(errors.contactPhone)}
              />
              {errors.contactPhone && (
                <p className="text-xs text-red-600">{String(errors.contactPhone.message)}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="recipientContactName">Contact destinataire *</Label>
              <Input
                id="recipientContactName"
                placeholder="Nom & prénom"
                {...register('recipientContactName')}
                aria-invalid={Boolean(errors.recipientContactName)}
              />
              {errors.recipientContactName && (
                <p className="text-xs text-red-600">{String(errors.recipientContactName.message)}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="recipientContactPhone">Téléphone destinataire *</Label>
              <Input
                id="recipientContactPhone"
                placeholder="ex: +2250700000000"
                {...register('recipientContactPhone')}
                aria-invalid={Boolean(errors.recipientContactPhone)}
              />
              {errors.recipientContactPhone && (
                <p className="text-xs text-red-600">{String(errors.recipientContactPhone.message)}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="recipientContactEmail">Email destinataire</Label>
              <Input
                id="recipientContactEmail"
                type="email"
                placeholder="ex: contact@client.com"
                {...register('recipientContactEmail')}
              />
              {errors.recipientContactEmail && (
                <p className="text-xs text-red-600">{String(errors.recipientContactEmail.message)}</p>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">Adresses</h3>
          {loadingAddresses ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {pickupOption === 'pickup' && (
                <AddressPicker
                  type="sender"
                  label="Adresse de récupération"
                  addresses={addressesByType.sender}
                  selectedId={selectedAddresses.senderAddressId}
                  onSelect={(value) => onAddressSelect('senderAddressId', value)}
                  onCreate={onCreateAddress}
                  onEdit={onEditAddress}
                  helperText="Sélectionnez l'adresse où notre coursier viendra récupérer le colis."
                error={getFieldError(errors.senderAddressId)}
                  hideCreate={!isSignedIn}
                  allowEdit={isSignedIn}
                />
              )}
              <AddressPicker
                type="recipient"
                label="Adresse destinataire"
                addresses={addressesByType.recipient}
                selectedId={selectedAddresses.recipientAddressId}
                onSelect={(value) => onAddressSelect('recipientAddressId', value)}
                onCreate={onCreateAddress}
                onEdit={onEditAddress}
                helperText="Point de livraison final de l'expédition."
                error={getFieldError(errors.recipientAddressId)}
                hideCreate={!isSignedIn}
                allowEdit={isSignedIn}
              />
              <AddressPicker
                type="billing"
                label="Adresse de facturation"
                addresses={addressesByType.billing}
                selectedId={selectedAddresses.billingAddressId}
                onSelect={(value) => onAddressSelect('billingAddressId', value)}
                onCreate={onCreateAddress}
                onEdit={onEditAddress}
                helperText="Optionnel : adresse sur laquelle facturer la prestation."
                error={getFieldError(errors.billingAddressId)}
                hideCreate={!isSignedIn}
                allowEdit={isSignedIn}
              />
            </div>
          )}
          {addressesError && <Alert variant="error">{addressesError}</Alert>}
          {!isSignedIn && (
            <Alert variant="warning">
              Connectez-vous pour enregistrer la demande de devis et accéder à vos adresses sauvegardées.
            </Alert>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
