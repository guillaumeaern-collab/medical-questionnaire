// app/controllers/public.controller.js
exports.getHome = (req, res) => {
  res.render('home', { 
    title: 'Accueil',
    message: 'Bienvenue sur notre site d\'enregistrement médical (public Routes)!'
  });
};