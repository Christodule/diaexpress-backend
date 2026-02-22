import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { Skeleton } from '../ui/Skeleton';

export function StepItinerary({ origins = [], destinations = [], loading }) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Itinéraire</CardTitle>
        <CardDescription>
          Choisissez le point de départ et la destination pour afficher les options disponibles.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="origin">Origine *</Label>
              <Select
                id="origin"
                placeholder="Sélectionnez une origine"
                {...register('origin')}
                aria-invalid={Boolean(errors.origin)}
              >
                <option value="">Ex. Ouagadougou, BF</option>
                {origins.map((origin) => (
                  <option key={origin.origin} value={origin.origin}>
                    {origin.origin}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-slate-500">Ville + pays si international.</p>
              {errors.origin && (
                <p className="text-xs text-red-600">{errors.origin.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="destination">Destination *</Label>
              <Select
                id="destination"
                placeholder="Sélectionnez une destination"
                {...register('destination')}
                aria-invalid={Boolean(errors.destination)}
                disabled={!destinations.length}
              >
                <option value="">Ex. Abidjan, CI</option>
                {destinations.map((destination) => (
                  <option key={destination.destination} value={destination.destination}>
                    {destination.destination}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-slate-500">Ville + pays si international.</p>
              {!destinations.length && (
                <p className="text-xs text-slate-500">
                  Sélectionnez une origine pour afficher les destinations compatibles.
                </p>
              )}
              {errors.destination && (
                <p className="text-xs text-red-600">{errors.destination.message}</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
