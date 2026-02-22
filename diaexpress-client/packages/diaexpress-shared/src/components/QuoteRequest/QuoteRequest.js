import React, { useMemo, useState } from "react";
import StepLocationSelector from "./StepLocationSelector";
import StepPackageDetails from "./StepPackageDetails";
import StepContactInfo from "./StepContactInfo";
import StepSummary from "./StepSummary";
import { buildApiUrl } from "../../api/api";

const initialFormData = {
  origin: "",
  destination: "",
  transportType: "air",
  length: "",
  width: "",
  height: "",
  weight: "",
  volume: "",
  name: "",
  email: "",
  phone: "",
  pickupAddress: "",
};

export default function QuoteRequest() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const apiEstimateUrl = useMemo(
    () => buildApiUrl("/api/quotes/estimate"),
    []
  );

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(apiEstimateUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          data?.message || data?.error || `Erreur API: ${response.status}`;
        throw new Error(message);
      }

      setQuote(data);
      setStep(4);
    } catch (err) {
      console.error("Erreur fetch :", err);
      setError(
        err?.message || "Impossible de récupérer le devis. Vérifie la connexion."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setFormData(initialFormData);
    setQuote(null);
    setError("");
    setStep(1);
  };

  return (
    <div className="quote-request">
      {error && <div className="alert alert-error">❌ {error}</div>}

      {step === 1 && (
        <StepLocationSelector
          formData={formData}
          setFormData={setFormData}
          onNext={nextStep}
        />
      )}

      {step === 2 && (
        <StepPackageDetails
          formData={formData}
          setFormData={setFormData}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}

      {step === 3 && (
        <StepContactInfo
          formData={formData}
          setFormData={setFormData}
          onBack={prevStep}
          onSubmit={handleSubmit}
          isSubmitting={loading}
        />
      )}

      {step === 4 && (
        <StepSummary
          formData={formData}
          quote={quote}
          onRestart={handleRestart}
          onBack={prevStep}
        />
      )}
    </div>
  );
}
