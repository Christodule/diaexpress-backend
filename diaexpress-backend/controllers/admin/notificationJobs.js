const {
  listNotificationJobs,
  findNotificationJobById,
} = require('../../services/diapayAdminClient');

exports.list = async (req, res) => {
  try {
    const { page, limit, status, jobName, paymentId } = req.query;
    const result = await listNotificationJobs({ page, limit, status, jobName, paymentId });
    res.json(result);
  } catch (error) {
    console.error('Erreur listNotificationJobs', error);
    const status = error.status || 500;
    if (status >= 400 && status < 500) {
      return res
        .status(status)
        .json({ message: error.message || 'Erreur lors de la récupération des jobs de notification' });
    }
    res.status(500).json({ message: 'Erreur lors de la récupération des jobs de notification' });
  }
};

exports.detail = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await findNotificationJobById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job introuvable' });
    }
    res.json({ job });
  } catch (error) {
    console.error('Erreur getNotificationJob', error);
    if (error.status === 404) {
      return res.status(404).json({ message: 'Job introuvable' });
    }
    res.status(500).json({ message: 'Erreur lors de la récupération du job' });
  }
};
