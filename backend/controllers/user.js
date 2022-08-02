const bcrypt = require('bcrypt');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const security = require('../security/security');

//Fonction pour créer un nouveau User et hasher le password 10 fois avec bcrypt
exports.signup = (req, res, next) => {
    bcrypt.hash(req.body.password, 10)
      .then(hash => {
        const user = new User({
          email: req.body.email,
          password: hash
        });
        user.save()
          .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
          .catch(error => res.status(400).json({ error }));
      })
      .catch(error => res.status(500).json({ error }));
  };

exports.login = (req, res, next) => {
    User.findOne({ email: req.body.email })
        .then(user => {
            if (!user) { /* Utilisateur n'existe pas dans la Bdd */
                return res.status(401).json({ message: 'Paire login/mot de passe incorrecte'});
            }/* User existe dans la bdd */
            bcrypt.compare(req.body.password, user.password)
                .then(valid => {
                    if (!valid) { /* mdp incorrect */
                        return res.status(401).json({ message: 'Paire login/mot de passe incorrecte' });
                    }/* mdp valide */
                    res.status(200).json({
                        userId: user._id,
                        token: jwt.sign(
                            { userId: user._id},
                            security.secretToken,
                            { expiresIn: '24h' }
                        )
                    });
                })
                .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
 };