const Sauce = require('../models/Sauce');
const fs = require('fs');


//Fonction create sauce qui va récuperer les informations dans le body de la requête selon le schema, elle va y ajouter l'URL de l'image généré ainsi que l'initialisation des likes et dislike
exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    delete sauceObject._userId;
    const sauce = new Sauce({
        ...sauceObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        likes: 0,
        dislikes: 0
    });
    sauce.save()
        .then(() => { res.status(201).json({message: 'Sauce enregistrée !'})})
        .catch(error => { res.status(400).json( { error })})
};


//Fonction modidfy sauce qui récupère les informations transmises dans le body et qui met à jour ce qui a été modifié (après avoir vérifié si l'utilisateur est bien le créateur de l'objet sauce en premier lieu)
exports.modifySauce = (req, res, next) => { 
    const sauceObject = req.file ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };
    delete sauceObject._userId;
    Sauce.findOne({_id: req.params.id})
        .then((sauce)=> {
            if(sauce.userId != req.auth.userId){
                return res.status(403).json({ message: 'unauthorized request'});
            }else{
                Sauce.updateOne({ _id: req.params.id}, {...sauceObject, _id: req.params.id})
                    .then(() => res.status(200).json({ message: 'Sauce modififée !'}))
                    .catch((error)=> res.status(400).json({ error }));
            }
        })
        .catch((error)=> res.status(500).json({ error }));

};

//fonction deleteSauce qui permet de suprimmer une sauce de la base de donnée si la requête vient bien de l'utilisateur qui a créé cette sauce
exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id})
        .then(sauce => {
            if (sauce.userId != req.auth.userId) {
                res.status(403).json({message: 'Not authorized'});
            } else {
                const filename = sauce.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Sauce.deleteOne({_id: req.params.id})
                        .then(() => { res.status(200).json({message: 'Sauce supprimée !'})})
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch( error => res.status(500).json({ error }));
};

//Fonction getOneSauce qui va afficher à l'utilisateur une sauce particulière qu'il a demandé dans sa requête GET
exports.getOneSauce = (req, res, next) => { 
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(404).json({ error }));
}

//Fonction getAllSauce qui va afficher toutes les sauces disponibles dans la base de donnée
exports.getAllSauces =  (req, res, next) => {
    Sauce.find()
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(400).json({ error }));
}


//Fonction likeSauce qui permet de voir si l'utilisateur a déjà liké ou disliké et autorize, en fonction, l'ajout et la suppression de like/dislike
exports.likeSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            if (req.body.like === 1){
                if(sauce.usersLiked.includes(req.body.userId)){
                    return res.status(409).json({ message: 'Vous avez déjà liké'})
                }
                if(sauce.usersDisliked.includes(req.body.userId)){
                    return res.status(409).json({message: 'Vous devez enlever votre dislike avant de pouvoir liker'})
                }
                if(!sauce.usersLiked.includes(req.body.userId) && !sauce.usersDisliked.includes(req.body.userId) )
                    Sauce.updateOne({ _id: req.params.id }, {$inc: {likes:1}, $push: {usersLiked: req.body.userId}})
                        .then(() => res.status(200).json({ message: 'Like ajouté'}))
                        .catch(error => res.status(400).json({ error }));
                }

            if (req.body.like === -1){
                if(sauce.usersDisliked.includes(req.body.userId)){
                    return res.status(409).json({message: 'Vous avez déjà dislike'})
                }
                if(sauce.usersLiked.includes(req.body.userId)){
                    return res.status(409).json({message: 'Vous devez enlever votre like avant de pouvoir disliker'})
                }
                if(!sauce.usersLiked.includes(req.body.userId) && !sauce.usersDisliked.includes(req.body.userId)){
                    Sauce.updateOne({ _id: req.params.id }, {$inc: {dislikes:1}, $push: {usersDisliked: req.body.userId}})
                        .then(() => res.status(200).json({ message: 'Dislike ajouté'}))
                        .catch(error => res.status(400).json({ error }));
                }
            }

            if (req.body.like === 0){
                if(sauce.usersLiked.includes(req.body.userId)){
                    Sauce.updateOne({ _id: req.params.id }, {$inc: {likes:-1}, $pull: {usersLiked: req.body.userId}})
                        .then(() => res.status(200).json({ message: 'like retiré'}))
                        .catch(error => res.status(400).json({ error }));
                }
                if(sauce.usersDisliked.includes(req.body.userId)){
                    Sauce.updateOne({ _id: req.params.id }, {$inc: {dislikes:-1}, $pull: {usersDisliked: req.body.userId}})
                        .then(() => res.status(200).json({ message: 'dislike retiré'}))
                        .catch(error => res.status(400).json({ error }));
                }
                if(!sauce.usersLiked.includes(req.body.userId) && !sauce.usersDisliked.includes(req.body.userId)){
                    return res.status(409).json({message: 'Il faut avoir liké ou disliké pour revenir à 0'})
                }
            }
        })
        .catch(error => res.status(404).json({ error }));
}