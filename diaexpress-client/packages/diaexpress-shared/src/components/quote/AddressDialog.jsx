import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Alert } from '../ui/Alert';
import { validateCountry, validatePhone } from '../../utils/addressValidation';

export const ADDRESS_TYPES = ['sender', 'recipient', 'billing'];

const emptyForm = {
  label: '',
  contactName: '',
  company: '',
  email: '',
  phone: '',
  line1: '',
  line2: '',
  postalCode: '',
  city: '',
  country: 'FR',
  notes: '',
};

export function AddressDialog({
  open,
  onOpenChange,
  mode = 'create',
  type = 'sender',
  initialValues,
  onSubmit,
  saving,
  error,
}) {
  const [form, setForm] = useState(() => ({ ...emptyForm }));
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm({ ...emptyForm, ...(initialValues || {}) });
      setFieldErrors({});
    }
  }, [open, initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!form.label.trim()) {
      nextErrors.label = 'Ajoutez un libellé pour retrouver cette adresse.';
    }
    if (!form.line1.trim()) {
      nextErrors.line1 = 'La ligne d’adresse principale est obligatoire.';
    }
    if (!form.city.trim()) {
      nextErrors.city = 'La ville est obligatoire.';
    }
    if (!form.postalCode.trim()) {
      nextErrors.postalCode = 'Le code postal est obligatoire.';
    }
    if (!form.country.trim() || !validateCountry(form.country.trim())) {
      nextErrors.country = 'Utilisez un code pays valide (ex: FR).';
    }
    if (form.phone && !validatePhone(form.phone)) {
      nextErrors.phone = 'Téléphone invalide (ex: +33612345678).';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    onSubmit?.({ ...form, type });
  };

  const title = mode === 'edit' ? 'Modifier une adresse' : 'Nouvelle adresse';
  const description =
    type === 'sender'
      ? 'Renseignez les informations du point de collecte.'
      : "Complétez les coordonnées pour faciliter la livraison.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="label">Libellé</Label>
              <Input
                id="label"
                name="label"
                value={form.label}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.label)}
              />
              {fieldErrors.label && <p className="text-xs text-red-600">{fieldErrors.label}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="company">Entreprise</Label>
              <Input id="company" name="company" value={form.company} onChange={handleChange} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="contactName">Contact</Label>
              <Input id="contactName" name="contactName" value={form.contactName} onChange={handleChange} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                name="phone"
                value={form.phone}
                placeholder="ex: +33612345678"
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.phone)}
              />
              {fieldErrors.phone && <p className="text-xs text-red-600">{fieldErrors.phone}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" name="notes" value={form.notes} onChange={handleChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="line1">Adresse</Label>
              <Input
                id="line1"
                name="line1"
                value={form.line1}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.line1)}
              />
              {fieldErrors.line1 && <p className="text-xs text-red-600">{fieldErrors.line1}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="line2">Complément</Label>
              <Input id="line2" name="line2" value={form.line2} onChange={handleChange} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="postalCode">Code postal</Label>
              <Input
                id="postalCode"
                name="postalCode"
                value={form.postalCode}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.postalCode)}
              />
              {fieldErrors.postalCode && <p className="text-xs text-red-600">{fieldErrors.postalCode}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                name="city"
                value={form.city}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.city)}
              />
              {fieldErrors.city && <p className="text-xs text-red-600">{fieldErrors.city}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="country">Pays (code ISO)</Label>
              <Input
                id="country"
                name="country"
                value={form.country}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.country)}
              />
              {fieldErrors.country && <p className="text-xs text-red-600">{fieldErrors.country}</p>}
            </div>
          </div>

          {error && <Alert variant="error">{error}</Alert>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange?.(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
