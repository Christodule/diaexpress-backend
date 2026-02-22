const blocklistedAddresses = new Set(
  (process.env.AML_BLOCKLIST || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
);

const HIGH_RISK_JURISDICTIONS = new Set(
  (process.env.AML_HIGH_RISK_JURISDICTIONS || 'IR,CU,MM,SD,SY,UA')
    .split(',')
    .map((entry) => entry.trim().toUpperCase())
    .filter(Boolean)
);

function computeRiskScore({ amountFiat = 0, assetSymbol, travelRuleStatus, sanctionsStatus, jurisdiction }) {
  let score = 20; // base score

  if (amountFiat >= 100000) score += 50;
  else if (amountFiat >= 10000) score += 25;
  else if (amountFiat >= 1000) score += 10;

  if (['BTC', 'XMR', 'DAI'].includes((assetSymbol || '').toUpperCase())) {
    score += 10;
  }

  if (travelRuleStatus === 'rejected') score += 30;
  if (sanctionsStatus === 'blocked') score += 100;
  if (sanctionsStatus === 'review') score += 20;

  if (jurisdiction && HIGH_RISK_JURISDICTIONS.has(jurisdiction.toUpperCase())) {
    score += 35;
  }

  return Math.min(score, 100);
}

async function screenAddress(address) {
  if (!address) {
    return { status: 'clear', lists: [] };
  }

  if (blocklistedAddresses.has(address.toLowerCase())) {
    return {
      status: 'blocked',
      lists: ['internal_blocklist'],
      provider: 'internal',
      checkedAt: new Date(),
    };
  }

  return {
    status: 'clear',
    lists: [],
    provider: 'internal',
    checkedAt: new Date(),
  };
}

async function evaluateTravelRule({ amountFiat, originator, beneficiary }) {
  const threshold = Number(process.env.TRAVEL_RULE_THRESHOLD || 1000);

  if (!amountFiat || amountFiat < threshold) {
    return {
      status: 'not_required',
      checkedAt: new Date(),
    };
  }

  if (!originator?.name || !beneficiary?.name) {
    return {
      status: 'rejected',
      notes: 'Missing travel rule identity information',
      checkedAt: new Date(),
    };
  }

  return {
    status: 'submitted',
    reference: `TR-${Date.now()}`,
    checkedAt: new Date(),
    notes: 'Submitted via internal travel rule bridge',
  };
}

async function runAmlChecks({
  amountFiat,
  assetSymbol,
  originator,
  beneficiary,
  onChainAddress,
  jurisdiction,
}) {
  const [sanctions, travelRule] = await Promise.all([
    screenAddress(onChainAddress),
    evaluateTravelRule({ amountFiat, originator, beneficiary }),
  ]);

  const amlScore = computeRiskScore({
    amountFiat,
    assetSymbol,
    travelRuleStatus: travelRule.status,
    sanctionsStatus: sanctions.status,
    jurisdiction,
  });

  const flags = [];
  if (sanctions.status !== 'clear') flags.push('sanctions');
  if (travelRule.status === 'rejected') flags.push('travel_rule');
  if (amlScore >= 70) flags.push('high_risk_score');

  let status = 'approved';
  if (sanctions.status === 'blocked' || travelRule.status === 'rejected') {
    status = 'rejected';
  } else if (amlScore >= 70) {
    status = 'flagged';
  }

  return {
    status,
    amlScore,
    sanctions,
    travelRule,
    flags,
  };
}

module.exports = {
  runAmlChecks,
  screenAddress,
  evaluateTravelRule,
  computeRiskScore,
};
