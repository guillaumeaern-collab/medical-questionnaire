// Importer le service d'email
const { sendQuestionnaireEmail } = require('../services/emailService');

// Base de données des questions
const questions = [
  {
    id: 1,
    label: 'Question 1 : Quel est votre couleur préférée ?',
    type: 'text'
  },
  {
    id: 2,
    label: 'Question 2 : Quel jour de la semaine préférez vous ?',
    type: 'multiple',
    options: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
  }
];

// Questions conditionnelles basées sur la réponse à la question 2
const getConditionalQuestion = (dayResponse) => {
  if (['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'].includes(dayResponse)) {
    return {
      id: 3,
      label: 'Question 3 : Quel est votre emploi ?',
      type: 'text',
      condition: 'weekday'
    };
  } else {
    return {
      id: 3,
      label: 'Question 3 : Quel est votre restaurant préféré ?',
      type: 'text',
      condition: 'weekend'
    };
  }
};

exports.getHome = (req, res) => {
  res.render('home', { 
    title: 'Accueil',
    message: 'Bienvenue sur notre site d\'enregistrement médical !'
  });
};

exports.getEnregistrement = (req, res) => {
  res.render('enregistrement', { 
    title: 'Enregistrement médical',
    message: 'Veuillez remplir le formulaire d\'enregistrement ci-dessous.'
  });
};

exports.postEnregistrement = (req, res) => {
  const {nom, prenom, age} = req.body;

  // Afficher la première question après l'enregistrement
  res.render('questionnaire', {
    title: 'Questionnaire',
    message: `Merci ${nom} ${prenom} pour votre confiance. Veuillez répondre aux questions ci-dessous.`,
    currentQuestion: questions[0],
    nom: nom,
    prenom: prenom,
    age: age,
    responses: {} // Initialiser les réponses
  });
};

exports.postQuestionResponse = (req, res) => {
  const {questionId, response, nom, prenom, age, responsesJSON} = req.body;
  
  // Récupérer les réponses précédentes
  let responses = responsesJSON ? JSON.parse(responsesJSON) : {};
  
  // Convertir questionId en nombre
  const qId = parseInt(questionId);
  
  // Stocker la réponse actuelle
  responses[`q${qId}`] = response;
  
  // Récupérer la question actuelle
  const currentQuestionIndex = qId - 1;
  
  // Déterminer la question suivante
  const nextQuestionIndex = currentQuestionIndex + 1;
  
  if (qId === 2) {
    // Après la question 2 (jour de la semaine), afficher la question conditionnelle 3
    const conditionalQuestion = getConditionalQuestion(response);
    res.render('questionnaire', {
      title: 'Questionnaire',
      message: `Merci ${nom} ${prenom}. Continuons...
Votre réponse à la question ${qId} : "${response}"`,
      currentQuestion: conditionalQuestion,
      nom: nom,
      prenom: prenom,
      age: age,
      responses: responses
    });
  } else if (qId === 3) {
    // Après la question conditionnelle 3, c'est terminé
    res.render('questionnaire', {
      title: 'Questionnaire Complété',
      message: `Merci ${nom} ${prenom} pour vos réponses. Le questionnaire est maintenant terminé !`,
      nom: nom,
      prenom: prenom,
      age: age,
      responses: responses,
      showSummary: true
    });
  } else if (nextQuestionIndex < questions.length) {
    // Il y a une question suivante
    res.render('questionnaire', {
      title: 'Questionnaire',
      message: `Merci ${nom} ${prenom}. Continuons...
Votre réponse à la question ${qId} : "${response}"`,
      currentQuestion: questions[nextQuestionIndex],
      nom: nom,
      prenom: prenom,
      age: age,
      responses: responses
    });
  } else {
    // C'était la dernière question
    res.render('questionnaire', {
      title: 'Questionnaire Complété',
      message: `Merci ${nom} ${prenom} pour vos réponses. Le questionnaire est maintenant terminé !`,
      nom: nom,
      prenom: prenom,
      age: age,
      responses: responses,
      showSummary: true
    });
  }
};

// Fonction pour générer le CSV
const sanitizeCSVField = (value) => {
  return String(value || '').replace(/;/g, ',');
};

const generateCSV = (nom, prenom, age, validationDay, validationTime, responses, dayResponse) => {
  const safeNom = sanitizeCSVField(nom);
  const safePrenom = sanitizeCSVField(prenom);
  const safeAge = sanitizeCSVField(age);
  const safeDay = sanitizeCSVField(validationDay);
  const safeTime = sanitizeCSVField(validationTime);
  const reponse1 = sanitizeCSVField(responses.q1);
  const reponse2 = sanitizeCSVField(responses.q2);
  const reponse3 = sanitizeCSVField(responses.q3);
  
  // Déterminer si c'est un jour de semaine ou weekend
  const isWeekday = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'].includes(dayResponse);
  const reponse31 = isWeekday ? reponse3 : '';
  const reponse32 = !isWeekday ? reponse3 : '';
  
  // Générer la ligne CSV
  const csvHeader = 'Nom;Prenom;Age;Jour;Heure;Reponse1;Reponse2;Reponse3.1;Reponse3.2\n';
  const csvData = `${safeNom};${safePrenom};${safeAge};${safeDay};${safeTime};${reponse1};${reponse2};${reponse31};${reponse32}\n`;
  
  return csvHeader + csvData;
};

exports.submitQuestionnaire = async (req, res) => {
  const {nom, prenom, age, responses} = req.body;
  
  try {
    // Parser les réponses
    const responsesObj = typeof responses === 'string' ? JSON.parse(responses) : responses;
    
    // Horodatage de validation
    const now = new Date();
    const validationDay = now.toLocaleDateString('fr-FR');
    const validationTime = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Générer le CSV
    const csvContent = generateCSV(nom, prenom, age, validationDay, validationTime, responsesObj, responsesObj.q2);
    
    // Envoyer l'email
    const emailResult = await sendQuestionnaireEmail(csvContent, nom, prenom);
    
    if (emailResult.success) {
      res.render('questionnaire', {
        title: 'Questionnaire Envoyé',
        message: `✅ Merci ! Vos réponses ont été enregistrées et un email a été envoyé à ${process.env.RECIPIENT_EMAIL}.`,
        nom: nom,
        prenom: prenom,
        age: age,
        showConfirmation: true
      });
    } else {
      res.render('questionnaire', {
        title: 'Erreur',
        message: `⚠️ Vos réponses ont été enregistrées, mais l'envoi par email a échoué: ${emailResult.message}`,
        showConfirmation: true
      });
    }
  } catch (error) {
    res.render('questionnaire', {
      title: 'Erreur',
      message: `❌ Une erreur s'est produite: ${error.message}`,
      showConfirmation: true
    });
  }
};