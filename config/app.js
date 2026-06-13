const express = require('express');
const path = require('path');

const homeRoutes = require('../app/routes/homeRoutes');
const publicRoutes = require('../app/routes/public.routes');

const app = express();

// Lecture des formulaire html
app.use(express.urlencoded({ extended: true }));

// Lecture du JSON
app.use(express.json());

// Moteur de vue
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// Fichiers statiques
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.use('/', homeRoutes);
app.use('/', publicRoutes);

// 404 simple (doit être toujours à la fin, après toutes les autres routes et middlewares)
app.use((req, res) => {
  res.status(404).render('error', { 
    title: 'Page introuvable',
    message: 'La page demandée est introuvable.'
  });
});

module.exports = app;