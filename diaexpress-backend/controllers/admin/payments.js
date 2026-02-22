const dayjs = require('dayjs');
const {
  listPayments,
  findPaymentById,
  getPaymentEvents,
  getPaymentSummary,
} = require('../../services/diapayAdminClient');

function normalizeDate(value, endOfDay = false) {
  if (!value) return undefined;
  const date = dayjs(value);
  if (!date.isValid()) return undefined;
  return endOfDay ? date.endOf('day').toISOString() : date.startOf('day').toISOString();
}

exports.list = async (req, res) => {
  try {
    const { page, limit, status, search } = req.query;
    const from = normalizeDate(req.query.from);
    const to = normalizeDate(req.query.to, true);

    const result = await listPayments({
      page,
      limit,
      status,
      search,
      from,
      to,
    });

    res.json(result);
  } catch (error) {
    console.error('Erreur listPayments', error);
    const status = error.status || 500;
    if (status >= 400 && status < 500) {
      return res.status(status).json({ message: error.message || 'Erreur lors de la récupération des paiements' });
    }
    res.status(500).json({ message: 'Erreur lors de la récupération des paiements' });
  }
};

exports.detail = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await findPaymentById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Paiement introuvable' });
    }
    const events = await getPaymentEvents(paymentId);
    res.json({ payment, events });
  } catch (error) {
    console.error('Erreur getPayment', error);
    if (error.status === 404) {
      return res.status(404).json({ message: 'Paiement introuvable' });
    }
    res.status(500).json({ message: 'Erreur lors de la récupération du paiement' });
  }
};

exports.summary = async (req, res) => {
  try {
    const { status } = req.query;
    const from = normalizeDate(req.query.from);
    const to = normalizeDate(req.query.to, true);
    const search = req.query.search;

    const summary = await getPaymentSummary({ status, from, to, search });
    res.json(summary);
  } catch (error) {
    console.error('Erreur summaryPayments', error);
    const status = error.status || 500;
    if (status >= 400 && status < 500) {
      return res.status(status).json({ message: error.message || 'Erreur lors du reporting des paiements' });
    }
    res.status(500).json({ message: 'Erreur lors du reporting des paiements' });
  }
};

exports.events = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const events = await getPaymentEvents(paymentId);
    res.json({ events });
  } catch (error) {
    console.error('Erreur eventsPayments', error);
    const status = error.status || 500;
    if (status >= 400 && status < 500) {
      return res.status(status).json({ message: error.message || 'Erreur lors de la récupération des évènements' });
    }
    res.status(500).json({ message: 'Erreur lors de la récupération des évènements' });
  }
};
