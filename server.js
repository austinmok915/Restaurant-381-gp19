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

app.post('/login',  (req, res) => {
	
	const client = new MongoClient(mongoDBurl);
	client.connect((err) => {
			assert.equal(null, err);
			console.log("Connected successfully to server");
			const db = client.db(dbName);
			
			const findUser = (db, callback) => {
				let cursor = db.collection('user').find();				
				cursor.forEach((account) => { 
					console.log(req.body.name);
					if (account.name === req.body.name && account.password === req.body.password) { 
					req.session.authenticated = true;
					req.session.username = account.name;
						console.log(req.body.name);
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
				let cursor2 = db.collection('restaurants').find();
				cursor2.toArray((err,rn) =>{
					res.status(200);
					res.render("restaurantList", {c: rn});
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
	
	if (req.session.username===null){
		res.writeHead(200, {"Content-Type": "text/html"});
		res.write('<html><body>');
		res.write('<a href="/login">Please login</a>');
		res.end('</body></html>');
	}
	const client = new MongoClient(mongoDBurl);
	client.connect(
		(err) => {
			assert.equal(null, err);
			console.log("Connected successfully to server");
			const db = client.db(dbName);
			const findRestaurant = (db, callback) => { 
				let cursor2 = db.collection('restaurants').find()
				cursor2.toArray((err,rn) =>{
					res.status(200);
					res.render("restaurantList", {c: rn,n:req.body.name});
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

app.get('/logout', (req,res) => {
	req.session=null;
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
							res.status(200).render('register_success');				
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



app.post('/create', function(req, res, next){
    const form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
        console.log('2');
        
            const filename = files.filetoupload.path;

            let mimetype = "images/jpeg";

            if (files.filetoupload.type) {
                mimetype = files.filetoupload.type;
            }
           fs.readFile(files.filetoupload.path, (err,data) => {    
                    const client = new MongoClient(mongoDBurl);
                    client.connect(url, function (err, db) {
                    const db2 = db.db(dbName);
			new_r={};
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
	     res.write('<html><body>');
            res.write('<a href="/list">Create Restaurant was successful</a>');
            res.write('</body></html>');
            
            
            res.end();

    });
});

app.get('/create', (req,res) => {
	res.status(200).render('create');
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
						
						
						
						db.collection('restaurants').update({_id:ObjectId(_id)},{"grades.score":req.body.score},(err,result) => { 
							res.redirect('/list');					
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

app.get('/score', (req,res) => {
	res.status(200).render('score');
});




app.listen(process.env.PORT || 8099);
