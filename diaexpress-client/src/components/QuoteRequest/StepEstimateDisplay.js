// StepEstimateDisplay.js
import React from 'react';

const StepEstimateDisplay = ({ error, estimatedPrice, estimateMethod, handleClickSend, showAdditionalFields }) => (
  <>
    {error && <p className="error">{error}</p>}
    {estimatedPrice && (
      <>
        <p className="success">💰 Estimation : {estimatedPrice.toFixed(2)} € ({estimateMethod})</p>
        {!showAdditionalFields && (
          <button type="button" onClick={handleClickSend}>📨 Envoyer</button>
        )}
      </>
    )}
  </>
);
export default StepEstimateDisplay;
