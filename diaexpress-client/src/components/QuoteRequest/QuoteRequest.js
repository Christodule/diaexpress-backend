import React, { useState, useEffect } from "react";
import StepLocationSelector from "./StepLocationSelector";
import StepPackageDetails from "./StepPackageDetails";
import StepContactInfo from "./StepContactInfo";
import StepSummary from "./StepSummary";
import { buildApiUrl } from "../../api/api";

export default function QuoteRequest() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  // ✅ Initialisation complète pour éviter undefined
  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    transportType: "air", // ou "sea"
    length: "",
    width: "",
    height: "",
    weight: "",
    volume: "",
    name: "",
    email: "",
    phone: "",
  });

  const [quote, setQuote] = useState(null);

  // ✅ Simulation du fetch (si API dispo, remplacer par fetch réel)
  useEffect(() => {
    console.log("Form Data actuel :", formData);
  }, [formData]);

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('/api/quotes/estimate'), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data = await response.json();
      setQuote(data);
      setStep(4); // Aller à l'étape résultat
    } catch (err) {
      console.error("Erreur fetch :", err);
      alert("Impossible de récupérer le devis. Vérifie la connexion.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="quote-request">
      {step === 1 && (
        <StepLocationSelector
          formData={formData}
          setFormData={setFormData}
          nextStep={nextStep}
        />
      )}
      {step === 2 && (
        <StepPackageDetails
          formData={formData}
          setFormData={setFormData}
          nextStep={nextStep}
          prevStep={prevStep}
        />
      )}
      {step === 3 && (
        <StepContactInfo
          formData={formData}
          setFormData={setFormData}
          handleSubmit={handleSubmit}
          prevStep={prevStep}
        />
      )}
      {step === 4 && (
        <StepSummary
          formData={formData}
          quote={quote}
          prevStep={prevStep}
        />
      )}
    </div>
  );
}
