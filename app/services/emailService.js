const nodemailer = require('nodemailer');

// Créer un transporteur Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD
  }
});

/**
 * Envoyer un email avec le CSV des réponses
 * @param {string} csvContent - Contenu du CSV
 * @param {string} nom - Nom de l'utilisateur
 * @param {string} prenom - Prénom de l'utilisateur
 * @returns {Promise}
 */
const sendQuestionnaireEmail = async (csvContent, nom, prenom) => {
  try {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.RECIPIENT_EMAIL,
      subject: `Réponses du questionnaire médical - ${nom} ${prenom}`,
      html: `
        <h2>Nouvelles réponses du questionnaire médical</h2>
        <p><strong>Nom:</strong> ${nom}</p>
        <p><strong>Prénom:</strong> ${prenom}</p>
        <p>Les réponses sont disponibles ci-dessous au format CSV:</p>
        <pre style="background-color: #f4f4f4; padding: 10px; border-radius: 5px;">
${csvContent}
        </pre>
      `,
      attachments: [
        {
          filename: `questionnaire-${nom}-${prenom}-${new Date().toISOString().split('T')[0]}.csv`,
          content: csvContent,
          contentType: 'text/csv'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email envoyé:', info.response);
    return { success: true, message: 'Email envoyé avec succès' };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return { success: false, message: error.message };
  }
};

module.exports = {
  sendQuestionnaireEmail
};
