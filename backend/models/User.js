const mongoose = require('mongoose');
const MongooseErrors = require('mongoose-errors')
const uniqueValidator = require('mongoose-unique-validator');


//Modèle des informations requise pour créer un compte d'utilisateur
const userSchema = mongoose.Schema({
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true}
});

//Plugin pour autoriser un seul compte pas email
userSchema.plugin(uniqueValidator);
userSchema.plugin(MongooseErrors);


module.exports = mongoose.model('User', userSchema);