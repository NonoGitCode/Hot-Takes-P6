const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const saucesRoutes = require('./routes/sauces');
const userRoutes = require('./routes/user');
const security = require('./security/security');
const helmet = require('helmet');


//Connexion à à la base de donnée mongoDB
mongoose.connect(security.username,
{ useNewUrlParser: true,
  useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch((error) => console.log('Connexion à MongoDB échouée ! '+ error));
;

const app = express();
app.use(express.json());
//Modification du middleware crossOriginRessourcePolicy de helmet pour autoriser l'affichage des images depuis tout site
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

//Informations CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});


//Routes que va suivre l'API à chaque appel
app.use('/api/auth', userRoutes);
app.use('/api/sauces', saucesRoutes);
app.use('/images', express.static(path.join(__dirname, 'images')));

module.exports = app;