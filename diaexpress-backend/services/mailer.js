const nodemailer = require('nodemailer');

// ✅ Assure-toi que ces variables existent dans ton fichier .env
const transporter = nodemailer.createTransport({
  service: 'gmail', // ou autre: 'sendinblue', 'mailgun', etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Envoie un email à l'utilisateur
 * @param {Object} param0
 * @param {string} param0.to - Adresse email destinataire
 * @param {string} param0.subject - Sujet de l’email
 * @param {string} param0.html - Contenu HTML
 */
exports.sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"LogiChain" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log("📨 Email envoyé: %s", info.messageId);
  } catch (err) {
    console.error("❌ Erreur lors de l'envoi d'email:", err);
  }
};
