var express = require('express');
var session = require('cookie-session'); // Charge le middleware de sessions
var bodyParser = require('body-parser'); // Charge le middleware de gestion des paramètres
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var Cloudant = require('cloudant');


var app = express();

// Définition de l'hôte et du port
var host        = process.env.VCAP_APP_HOST || process.env.HOST || 'localhost';
var port        = process.env.VCAP_APP_PORT || process.env.PORT || 8080;


var cloudant = Cloudant({account:'4f231165-2664-4634-9018-4c8de17afed7-bluemix', password:'6846a4cd22e7999ca786921e7ac66cc86a34fe12ea8dd7d10b7ace0cf418f097'}, function(err, cloudant) {
    if (err) {
        return console.log('Failed to initialize Cloudant: ' + err.message);
    }

    var db = cloudant.db.use('todolist2');

    /* On utilise les sessions */
    app.use(session({secret: 'todotopsecret'}))

    /* On affiche la todolist et le formulaire */
    .get('/todo', function(req, res) { 
        db.list({include_docs: true}, function(err, body) {
            if (!err) {
                res.render('todo.ejs', {todolist: body.rows});
            }
        });
    })

    /* On ajoute un élément à la todolist */
    .post('/todo/ajouter/', urlencodedParser, function(req, res) {
        if (req.body.newtodo != '') {
            var newdata = {'todo': req.body.newtodo};
            db.insert(newdata, function(err, result) {
                res.redirect('/todo');
            });
        }
    })

    /* Supprime un élément de la todolist */
    .get('/todo/supprimer/:id', function(req, res) {
        if (req.params.id != '') {
            db.get(req.params.id, { revs_info: true }, function(err, body) {
                if (!err) {
                    db.destroy(req.params.id, body._rev, function(err, body) {
                        res.redirect('/todo');
                    });
                }
            });
        }
    })

    /* On redirige vers la todolist si la page demandée n'est pas trouvée */
    .use(function(req, res, next){
        res.redirect('/todo');
    })

    .listen(port, host);
});