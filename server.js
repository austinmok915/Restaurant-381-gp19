const url  = require('url');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const ObjectId = require('mongodb').ObjectID;
const mongoDBurl = 'mongodb+srv://aaron:aaronso@aarondb-ep2mi.mongodb.net/test?retryWrites=true&w=majority';
const dbName = 's381assignment';
const session = require('cookie-session');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const formidable = require('formidable');
const qs = require ('querystring');
var timestamp = null;
const fs = require('fs');

const SECRETKEY1 = 'I want to pass COMPS381F';
const SECRETKEY2 = 'Keep this to yourself';

app.set('view engine', 'ejs');

let sessionUser = null;

app.use(session({
  	name: 'session',
	keys: [SECRETKEY1,SECRETKEY2]
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const setCurrentTimestamp = (req, res, next) => {
	timestamp = new Date().toISOString();
	console.log(`Incoming request ${req.method}, ${req.url} received at ${timestamp}`);
	next();
}

app.get('/', setCurrentTimestamp, (req, res) => {
	console.log(req.session);
	if (!req.session.authenticated) {
		res.redirect('/login');
	}
	else {
		res.redirect('/list');
	}
});


app.get('/login', (req,res) => {
	res.status(200).render('login');
});

app.post('/login', setCurrentTimestamp, (req, res) => {
	const client = new MongoClient(mongoDBurl);
	client.connect(
		(err) => {
			assert.equal(null, err);
			console.log("Connected successfully to server");
			const db = client.db(dbName);
			const findUser = (db, callback) => { 
				let cursor = db.collection('user').find();
				cursor.forEach((account) => { 
					if (account.name == req.body.name && account.password == req.body.password) {
						req.session.authenticated = true;
						req.session.username = account.name;
						res.redirect('/list');
					}
					else{
						res.status(200).render('fail');
						console.log('Invalid!');
					}
				}); 
				callback(); 
			}
			client.connect((err) => { 
				assert.equal(null,err); 
				console.log("Connected successfully to server");
				const db = client.db(dbName);
				findUser(db,() => { 
					client.close();
				});
			});
		}
	);
});



app.get('/list',(req, res) => {
	const client = new MongoClient(mongoDBurl);
	client.connect(
		(err) => {
			assert.equal(null, err);
			console.log("Connected successfully to server");
			const db = client.db(dbName);
			const findRestaurant = (db, callback) => { 
				let cursor2 = db.collection('restaurants').find()
				cursor2.toArray((err,rn) =>{
					res.writeHead(200, {"Content-Type": "text/html"});
					res.write('<html><head><title>Restaurant</title></head>');
					res.write('<li>${rn.name}</li>');
					res.end('</body></html>');
				});
				callback();
			}
			client.connect((err) => { 
				assert.equal(null,err); 
				console.log("Connected successfully to server");
				const db = client.db(dbName);
				findRestaurant(db,() => { 
					client.close();
				});
			});
		}
	);
});


app.post('/list',(req, res) => {
});


app.get('/logout', (req,res) => {
	req.session = null;
	res.redirect('/');
});


app.post('/register', (req,res) => {
	
	const client = new MongoClient(mongoDBurl);
	client.connect(
		(err) => {
			assert.equal(null, err);
			console.log("Connected successfully to server");
			const db = client.db(dbName);
			const regUser = (db, callback) => {
				console.log(typeof req.body.repassword);
				if (req.body.repassword == req.body.password){
					obj = {};
					obj['name']=req.body.name;
					obj['password']=req.body.password;
					db.collection('user').insertOne(obj,(err,result) => { 
						res.redirect('/login');					
					});
					}else {
						res.status(200).render('fail reg');
						console.log('Invalid!');}

				callback(); 
			}
			client.connect((err) => { 
				assert.equal(null,err); 
				console.log("Connected successfully to server");
				const db = client.db(dbName);
				regUser(db,() => { 
					client.close();
				});
			});

		}
	);
});

app.get('/register', (req,res) => {
	res.status(200).render('register');
});


//photo
app.post('/create', function(req, res, next){
    const form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
        console.log('2');
        // console.log(JSON.stringify(files));
            const filename = files.filetoupload.path;
           
            let mimetype = "images/jpeg";
           
            if (files.filetoupload.type) {
                mimetype = files.filetoupload.type;
            }
           fs.readFile(files.filetoupload.path, (err,data) => {    
                    let MongoClient = new MongoClient(mongourl);
                    MongoClient.connect(url, function (err, db) {
                    const db2 = db.db(dbname);
                    
                    new_r['mimetype'] = mimetype;
                    new_r['image'] = new Buffer.from(data).toString('base64');

                    var _coord = { latitude: fields.latitude , longitude: fields.longitude};
                    var doc = { restaurant_id: fields.r_id ,
                                name: fields.name , 
                               borough: fields.borough,
                               cuisine: fields.cuisine,
                               photo: new_r['image'],
                               mimetype: new_r['mimetype'],
                               address: { street: fields.street,
                                   building: fields.building,
                                   zipcode: fields.zipcode,
                                   street: fields.street,
                                   coord: _coord,
                               },
                               grades: { user: req.body.user, score: req.body.score },
                               owner: req.session.username,
                    }; 
                    console.log(doc);
                    db2.collection("restaurants").insertOne(doc, function(err, res) {
                        if (err) throw err;
                            console.log("Document inserted");      
                                db.close();
                             }); 
                               })
        });

            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write('Create Restaurant was successful');
            res.write('<form action="/index">');
            res.write('<input type="submit" value="Go Back"/>');
            res.write('</form>');
            res.end();

    });
});

app.post('/score', (req,res) => {
	
	const client = new MongoClient(mongoDBurl);
	client.connect(
		(err) => {
			assert.equal(null, err);
			console.log("Connected successfully to server");
			const db = client.db(dbName);
			const score = (db, callback) => { 
				let cursor = db.collection('restaurants').find({"name":req.session.restname});
				cursor.forEach((rest) => { 
					
					if (rest.grades.user == req.session.username) {
						res.status(200).render('Exist user score');
						console.log('Invalid! Exist user score');
					}
					else{
						n = rest.name;
						s = rest.grades.score;
						db.collection('restaurants').update({n:req.session.restname},{s:req.body.score},(err,result) => { 
							res.redirect('/login');					
						});				

					}
				}); 
				callback(); 
			}
			client.connect((err) => { 
				assert.equal(null,err); 
				console.log("Connected successfully to server");
				const db = client.db(dbName);
				score(db,() => { 
					client.close();
				});
			});

		}
	);
});






app.listen(process.env.PORT || 8099);
