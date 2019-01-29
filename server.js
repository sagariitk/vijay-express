var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var sessions = require('express-session');
var mysql = require('mysql');
var cors = require('cors');
const jwt = require('jsonwebtoken');


var connection = mysql.createConnection({
    host: 'vijay-app-db.ckv6z1bs6r16.us-east-2.rds.amazonaws.com',
    user: 'root',
    password: '12345678',
    database: 'sampleDB'
});

connection.connect(function(error){
    if(!!error) {
        console.log('error');
    }
    else {
        console.log('connection succesful');
    }
});

var app = express();
app.use(cors());

app.use(bodyParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use('/public', express.static(__dirname + '/public'));

app.get('/', function(req,res){
    res.sendFile('index.html', {root: path.join(__dirname, './views')});
});


//dummy api request for verifying jwt token
app.get('/api', verifyToken, (req, res) => {  
    // console.log('request recieved');
    jwt.verify(req.token, 'secretkey', (err, authData) => {
        if(err) {
            res.sendStatus(403);
        } else {
            console.log(authData.user.username);
            res.json({
                message: 'Post created...',
                authData
            });
        }
    });
});


// function for verifying jwt token from client side
function verifyToken(req, res, next) {
    // Get auth header value
    const bearerHeader = req.headers['authorization'];
    // Check if bearer is undefined
    if(typeof bearerHeader !== 'undefined') {
        // Split at the space
        const bearer = bearerHeader.split(' ');
        // Get token from array
        const bearerToken = bearer[1];
        // Set the token
        req.token = bearerToken;
        // Next middleware
        next();
    } else {
        // Forbidden
        res.sendStatus(403);
    }
}

//registering a new user with post request
app.post('/register', verifyToken, (req, res) => {  
    jwt.verify(req.token, 'secretkey', (err, authData) => {
        if(err) {
            res.sendStatus(403);
        } 
        else if(authData.user.username == 'admin') {
            if(!req.body.firstname){
                console.log('First Name must be provided');
                res.send('First Name must be provided');
            }else if(!req.body.username){
                console.log('Username must be provided');
                res.send('Username must be provided');
            }else if(!req.body.password){
                console.log('password must be provided');
                res.send('password must be provided');         
            }
            else if(req.body.password.length<6){
                console.log('password length must be greater than 6 letters');
                res.send('password length must be greater than 6 letters');   
            }
            else{
                connection.query('insert into users(firstname, lastname, username, password, mobileno) VALUES (\'' + req.body.firstname + '\', \'' + req.body.lastname + '\', \'' + req.body.username + '\', \'' + req.body.password+ '\', \'' + req.body.mobileno +'\')' , function(error,rows, fields) {
                    try{
                        console.log('User added');
                        res.json({msg: "User Added Succesfully"});
                    }
                    catch(err) {
                        console.log('User can not be added');
                        res.json({msg: 'User can not be added'});
                    }
                });
            }
        }
        else {
            console.log("not admin");
            res.json({msg: "not admin"});
        }
    });
});

//generating jwt token for login with get request
app.post('/login', function(req,res){
    try{
        connection.query('select * from users where username=\'' + req.body.username +'\'' , function(err,rows, fields) {
            try{
                console.log('Db Connection is Valid');
                user = {
                    username : rows[0].username,
                    password : rows[0].password
                }
                if(req.body.username == rows[0].username && req.body.password == rows[0].password){
                    generateToken(user);
                }
                else{
                    res.json({msg: 'password is not correct'});
                } 
            }
            catch(err) {
                console.log('username is not registered');
                res.json({msg: 'username is not registered'});
            }
        });
    }
    catch(err){
        console.log('Error in Db Connection');
        res.json({msg: 'Error in Db Connection'});
    }
    
    function generateToken(user) {
        jwt.sign({user}, 'secretkey', { expiresIn: '600s' }, (err, token) => {
            res.json({
            token
            });
        });
    }; 
});


//getting profile of user
app.get('/profile/:username', verifyToken, (req, res) => {
    jwt.verify(req.token, 'secretkey', (err, authData) => {
        if(err) {
            res.sendStatus(403);
        } else {
            connection.query('select * from users where username=\'' + req.params.username + '\'' , function(error,rows, fields) {
                try{
                    if(rows[0]){
                        console.log('User found');
                        res.json(rows[0]);
                    }
                    else {
                        console.log('User not found');
                        res.json({msg: "User not found"});
                    }
                }
                catch(err) {
                    console.log(err);
                    res.json(error);
                }
            });
        }
    });
});

//get all the users
app.get('/getusers', verifyToken, (req, res) => {  
    jwt.verify(req.token, 'secretkey', (err, authData) => {
        if(err) {
            res.sendStatus(403);
        } 
        else if(authData.user.username == 'admin'){
            connection.query('select * from users', function(error,rows, fields) {
                try{
                    console.log('query successfull');
                    len = rows.length;
                    var dict = []; // create an empty array
                    for(i=0; i < len; i++){
                        username = rows[i].username;
                        password = rows[i].password;
                        dict.push({
                            username: username, //first is username string second is username variable
                            password: password  // same for password
                        });
                    }
                    console.log(dict);
                    res.json(dict);
                }
                catch(err) {
                    console.log('Error in query');
                    res.json(error);
                }
            });
        }
        else {
            res.json({
                msg: 'Please log in with admin account'
            })
        }
    });
});

// get a specific user with get request
app.get('/getusers/:username', verifyToken, (req, res) => {  
    jwt.verify(req.token, 'secretkey', (err, authData) => {
        if(err) {
            res.sendStatus(403);
        } 
        else if(authData.user.username == 'admin'){
            connection.query('select * from users where username=\'' + req.params.username + '\'' , function(error,rows, fields) {
                try{
                    if(rows[0]){
                        console.log('User found');
                        res.send(rows[0]);
                    }
                    else {
                        console.log('User not found');
                        res.json({msg: "User not found"});
                    }
                }
                catch(err) {
                    console.log('Error');
                    res.json(error);
                }
            });
        }
        else {
            res.json({
                msg: 'Please log in with admin account'
            })
        }
    });
});

//contact us query with post request
app.post('/contact', function(req,res){
    connection.query('insert into queries VALUES (\'' + req.body.name + '\', \'' + req.body.email +'\', \'' + req.body.query +'\')' , function(error,rows, fields) {
        try {
            console.log('Query Submitted');
            res.json({msg: "query submitted"});
        }
        catch(err){
            console.log('query can not be submitted');
            res.json({msg: "query can not be submitted"});
        }
    });
});

//add pets with post request
app.post('/pets', verifyToken, (req, res) => {  
    console.log('request recieved');
    jwt.verify(req.token, 'secretkey', (err, authData) => {
        if(err) {
            res.sendStatus(403);
        } 
        else {
            if(!req.body.pet_breed || !req.body.owner_name){
                console.log('pet breed or owner name can not be blank');
                res.send('pet breed or owner name can not be blank');
            }
            else {
                connection.query('insert into pets(pet_breed, owner_name, owner_contact_no, pet_details) VALUES (\'' + req.body.pet_breed + '\', \'' + req.body.owner_name +'\', \'' + req.body.owner_contact_no + '\', \'' + req.body.pet_description +'\')' , function(error,rows, fields) {
                    try {
                        console.log('Query Submitted');
                        res.send("Pet details added succesfully");
                    }
                    catch(err) {
                        console.log('query can not be submitted');
                        res.redirect('/contact');
                    }
                });
            }
        }
    });
});

//get pets with get request
app.get('/pets', (req, res) => {  
    connection.query('select * from pets' , function(error,rows, fields) {
        if(rows){
            try{
                console.log('Query Submitted');
                res.send(rows);
            }
            catch(err) {
                console.log('query can not be submitted');
                res.json({msg: "query can not be submitted"});
            }
        }
        else{
            console.log('error in query');
            res.send(error);
        }
        
    });
});


//get pets for a single owner_name with get request
app.get('/pets/:owner_name', function(req,res){
    owner_name = req.params.owner_name;
    connection.query('select * from pets where owner_name=\'' + owner_name + '\'' , function(error,rows, fields) {
        if(rows){
            try {
                console.log('Query Submitted');
                res.send(rows);
            }
            catch(err) {
                console.log('query can not be submitted');
                res.send("no pet found");
            }
        }
        else{
            console.log('error in query');
            res.send(error);
        }
    });
});


//delete pets for a owner
app.delete('/pets', function(req,res){
    owner_name = req.body.owner_name;
    connection.query('delete from pets where owner_name=\'' + owner_name + '\'' , function(error,rows, fields) {
        try {
            console.log('Query Submitted');
            res.send(rows);
        }
        catch(err) {
            console.log('query can not be submitted');
            res.send("no pet found");
        }
    });
});

app.use(function(req, res, next) {
    res.status(404).sendFile('404.html', {root: path.join(__dirname, './views')});
});

app .listen(1337, function(){
    console.log('app server running at port 1337');
})

// var express = require('express')
// var app = express();
// var router = express.Router();

// app.use('/css', express.static(__dirname + '/assets'));
// app.use('/firstRouter', router);

// router.get('/subroute', function(req,res){
//     res.end('router working');
// })

// // can be accessed with localhost:1337/firstRouter/subroute

// //will be normally working
// app.get('/', function(req,res){
//     res.end('I am on');
// })

// app .listen(1337, function(){
//     console.log('app server running at port 1337');
// })

// var express = require('express');
// var path = require('path');
// var cookieParser = require('cookie-parser');

// var app = express();

// // app.use(bodyParser());
// app.unsubscribe(cookieParser());
// app.use('/css', express.static(__dirname + '/assets'));

// app.get('/', function(req,res){
//     res.cookie('firstCookie', "something")
//     res.end('sadfgd');
//     // res.sendFile('index.html', {root: path.join(__dirname, './static')});
// })
// app.get('/clearCookie', function(req,res){
//     res.clearCookie('firstCookie')
//     res.end('sadfgd');
//     // res.sendFile('index.html', {root: path.join(__dirname, './static')});
// })

// app .listen(1337, function(){
//     console.log('app server running at port 1337');
// })



// var express = require('express');
// var path = require('path');
// var fs = require('fs');
// var bodyParser = require('body-parser');
// var app = express();

// app.use(bodyParser());
// app.use('/css', express.static(__dirname + '/assets'));

// app.get('/', function(req,res){
//     res.sendFile('index.html', {root: path.join(__dirname, './static')});
// })

// app.post('/', function(req,res){
//     if(req.body.firstname == 'sagar'){
//         res.end(JSON.stringify(req.body));
//     }
//     else{
//         res.end('error');
//     }

// })

// app .listen(1337, function(){
//     console.log('app server running at port 1337');
// })


// app.get('/hello', function(req, res){
//     res.send('hello function');
// })


// app.get('/', function(req, res){
//     res.sendFile('index.html', {root: path.join(__dirname, './static')});
// })

// app.get('/', function(req,res){
//     var response = "hey " + req.query.something;
//     // res.end(JSON.stringify(req.query));
//     res.end(response);
// })


// app.get(/^(.+)$/, function(req,res){
//     console.log(req.params);
//     try{
//         if(fs.statSync(path.join(__dirname, './static/', req.params[0] + '.html')).isFile()){
//             res.sendFile(req.params[0] + '.html', {root: path.join(__dirname, './static')});
//         }
//     }
//     catch(err){
//         console.log(err);
//         res.sendFile('404.html', {root: path.join(__dirname, './static')});
//     }
    
// });

// var express = require('express');
// var path = require('path');
// var bodyParser = require('body-parser');
// var sessions = require('express-session');
// var mysql = require('mysql');

// var connection = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '12345678',
//     database: 'sampleDB'
// });

// connection.connect(function(error){
//     if(!!error) {
//         console.log('error');
//     }
//     else {
//         console.log('connection succesful');
//     }
// });

// var app = express();
// var session;
// var username;
// var password;

// app.use(sessions({
//     secret: '23456789@#$%^&*',
//     resave: false,
//     saveUninitialized:false
// }));
// app.use(bodyParser());
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({extended:true}));
// app.use('/css', express.static(__dirname + '/assets'));


// app.get('/sql', function(req,res){
//     connection.query('select * from users', function(error,rows, fields) {
//         if(!!error){
//             console.log('Error in query');
//         }
//         else{
//             console.log('query successfull');
//             username = rows[0].username;
//             password = rows[0].password;
//         }
//     });
//     res.send(username);
// });

// app.get('/login', function(req,res){
//     res.sendFile('index.html', {root: path.join(__dirname, './static')});
// });

// app.get('/admin', function(req,res){
//     session = req.session;
//     if(session.uniqueID){
//         res.sendFile('admin.html', {root: path.join(__dirname, './static')});
//     }
//     else{
//         res.redirect('/login');
//     }
// });

// app.get('/logout', function(req,res){
//     req.session.destroy();
//     res.redirect('/login');
// });

// app.post('/login', function(req,res){
//     session = req.session;
//     connection.query('select * from users where username=\'' + req.body.username +'\'' , function(error,rows, fields) {
//         if(!!error){
//             console.log('User does not exist');
//         }
//         else{
//             console.log('User is valid');
//             username = rows[0].username;
//             password = rows[0].password;
//         }
//     });

//     if(req.body.username == username && req.body.password == password){
//         session.uniqueID = req.body.username;
//     }
//     res.redirect('/redirects');
// });

// app.get('/redirects', function(req,res){
//     session = req.session;
//     if(session.uniqueID){
//         console.log(session.uniqueID);
//         res.redirect('/admin');
//     }
//     else{
//         res.redirect('/login');
//     }
// });

// app.use(function(req, res, next) {
//     res.sendFile('404.html', {root: path.join(__dirname, './static')});
// });

// app .listen(1337, function(){
//     console.log('app server running at port 1337');
// })

// var express = require('express')
// var app = express();
// var router = express.Router();

// app.use('/css', express.static(__dirname + '/assets'));
// app.use('/firstRouter', router);

// router.get('/subroute', function(req,res){
//     res.end('router working');
// })

// // can be accessed with localhost:1337/firstRouter/subroute

// //will be normally working
// app.get('/', function(req,res){
//     res.end('I am on');
// })

// app .listen(1337, function(){
//     console.log('app server running at port 1337');
// })

// var express = require('express');
// var path = require('path');
// var cookieParser = require('cookie-parser');

// var app = express();

// // app.use(bodyParser());
// app.unsubscribe(cookieParser());
// app.use('/css', express.static(__dirname + '/assets'));

// app.get('/', function(req,res){
//     res.cookie('firstCookie', "something")
//     res.end('sadfgd');
//     // res.sendFile('index.html', {root: path.join(__dirname, './static')});
// })
// app.get('/clearCookie', function(req,res){
//     res.clearCookie('firstCookie')
//     res.end('sadfgd');
//     // res.sendFile('index.html', {root: path.join(__dirname, './static')});
// })

// app .listen(1337, function(){
//     console.log('app server running at port 1337');
// })



// var express = require('express');
// var path = require('path');
// var fs = require('fs');
// var bodyParser = require('body-parser');
// var app = express();

// app.use(bodyParser());
// app.use('/css', express.static(__dirname + '/assets'));

// app.get('/', function(req,res){
//     res.sendFile('index.html', {root: path.join(__dirname, './static')});
// })

// app.post('/', function(req,res){
//     if(req.body.firstname == 'sagar'){
//         res.end(JSON.stringify(req.body));
//     }
//     else{
//         res.end('error');
//     }

// })

// app .listen(1337, function(){
//     console.log('app server running at port 1337');
// })


// app.get('/hello', function(req, res){
//     res.send('hello function');
// })


// app.get('/', function(req, res){
//     res.sendFile('index.html', {root: path.join(__dirname, './static')});
// })

// app.get('/', function(req,res){
//     var response = "hey " + req.query.something;
//     // res.end(JSON.stringify(req.query));
//     res.end(response);
// })


// app.get(/^(.+)$/, function(req,res){
//     console.log(req.params);
//     try{
//         if(fs.statSync(path.join(__dirname, './static/', req.params[0] + '.html')).isFile()){
//             res.sendFile(req.params[0] + '.html', {root: path.join(__dirname, './static')});
//         }
//     }
//     catch(err){
//         console.log(err);
//         res.sendFile('404.html', {root: path.join(__dirname, './static')});
//     }
    
// });


// var express = require('express');
// var path = require('path');
// var bodyParser = require('body-parser');
// var sessions = require('express-session');
// var mysql = require('mysql');
// var cors = require('cors');


// var connection = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '12345678',
//     database: 'sampleDB'
// });

// connection.connect(function(error){
//     if(!!error) {
//         console.log('error');
//     }
//     else {
//         console.log('connection succesful');
//     }
// });

// var app = express();
// var session;
// var Username;
// var Password;
// app.use(cors());

// app.use(sessions({
//     secret: '23456789@#$%^&*',
//     resave: false,
//     saveUninitialized:false
// }));
// app.use(bodyParser());
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({extended:true}));
// app.use('/public', express.static(__dirname + '/public'));

// app.get('/', function(req,res){
//     res.sendFile('index.html', {root: path.join(__dirname, './views')});
// });

// app.get('/login', function(req,res){
//     res.sendFile('login.html', {root: path.join(__dirname, './views')});
// });

// app.get('/about', function(req,res){
//     res.sendFile('about.html', {root: path.join(__dirname, './views')});
// });

// app.get('/contact', function(req,res){
//     res.sendFile('contact.html', {root: path.join(__dirname, './views')});
// });

// app.get('/unauthorized', function(req,res){
//     res.sendFile('unauthorized.html', {root: path.join(__dirname, './views')});
// });

// app.get('/adminportal', function(req,res){
//     session = req.session;
//     if(session.uniqueID == 'admin'){
//         res.sendFile('adminportal.html', {root: path.join(__dirname, './views')});
//     }
//     else{
//         res.redirect('/logout');
//     }
// });

// app.get('/userportal', function(req,res){
//     session = req.session;
//     if(session.uniqueID){
//         res.sendFile('userportal.html', {root: path.join(__dirname, './views')});
//     }
//     else{
//         res.redirect('/logout');
//     }
// });

// app.get('/logout', function(req,res){
//     req.session.destroy();
//     res.redirect('/unauthorized');
// });

// app.post('/login', function(req,res){
//     session = req.session;
//     connection.query('select * from users where username=\'' + req.body.username +'\'' , function(error,rows, fields) {
//         try{
//                 console.log('User is valid');
//                 Username = rows[0].username;
//                 Password = rows[0].password;
//         }
//         catch(err){
//             console.log('user not in db');
//         }
//     });

//     if(req.body.username == Username && req.body.password == Password){
//         session.uniqueID = req.body.username;
//     }   
//     res.redirect('/redirects');
// });

// app.get('/getusers', function(req,res){
//     session = req.session;
//     if(session.uniqueID == 'admin'){
//         connection.query('select * from users', function(error,rows, fields) {
//             if(!!error){
//                 console.log('Error in query');
//                 res.redirect('/adminportal');
//             }
//             else{
//                 console.log('query successfull');
//                 len = rows.length;
//                 var dict = []; // create an empty array
//                 for(i=0; i < len; i++){
//                     username = rows[i].username;
//                     password = rows[i].password;
//                     dict.push({
//                         UserName: username, //first is username string second is username variable
//                         PassWord: password  // same for password
//                     });
//                 }
//                 res.send(dict);
//             }
//         });
//     }
//     else if(session.uniqueID){
//         connection.query('select * from users', function(error,rows, fields) {
//             if(!!error){
//                 console.log('Error in query');
//                 res.redirect('/userportal');
//             }
//             else{
//                 console.log('query successfull');
//                 len = rows.length;
//                 var dict = []; // create an empty array
//                 for(i=0; i < len; i++){
//                     username = rows[i].username;
//                     password = rows[i].password;
//                     dict.push({
//                         UserName: username, //first is username string second is username variable
//                         // PassWord: password  // same for password
//                     });
//                 }
//                 res.send(dict);
//             }
//         });
//     }
//     else {
//         res.redirect('/logout');
//     }
// });

// app.post('/getuser', function(req,res){
//     session = req.session;
//     if(session.uniqueID == 'admin'){
//         connection.query('select * from users where username=\'' + req.body.username + '\'' , function(error,rows, fields) {
//             if(!!error){
//                 console.log('Error');
//                 res.redirect('/adminportal');
//             }
//             else if(rows[0]){
//                 console.log('User found');
//                 res.send(rows[0]);
//             }
//             else {
//                 console.log('User not found');
//                 res.redirect('/adminportal');
//             }
//         });
//     }
//     else{
//         res.redirect('/logout');
//     }
// });

// app.post('/userAdd', function(req,res){
//     session = req.session;
//     if(session.uniqueID){
//         if(session.uniqueID == 'admin'){
//             connection.query('insert into users VALUES (\'' + req.body.username + '\', \'' + req.body.password +'\')' , function(error,rows, fields) {
//                 if(!!error){
//                     console.log('User can not be added');
//                     res.redirect('/adminportal');
//                 }
//                 else{
//                     console.log('User addedd');
//                     res.redirect('/adminportal');
//                 }
//             });
//         }
//         else{
//             res.redirect('/userportal');
//         }
//     }
//     else{
//         res.redirect('/logout');
//     }
// });

// app.post('/contact', function(req,res){
//     connection.query('insert into queries VALUES (\'' + req.body.name + '\', \'' + req.body.email +'\', \'' + req.body.query +'\')' , function(error,rows, fields) {
//         if(!!error){
//             console.log('query can not be submitted');
//             res.redirect('/contact');
//         }
//         else{
//             console.log('Query Submitted');
//             console.log(req.body.name);
//             res.redirect('/');
//         }
//     });
// });

// app.post('/pets', function(req,res){
//     if(!req.body.pet_breed || !req.body.owner_name){
//         console.log('pet breed or owner name can not be blank');
//         res.send('pet breed or owner name can not be blank');
//     }
//     else {
//         connection.query('insert into pets VALUES (\'' + req.body.pet_breed + '\', \'' + req.body.owner_name +'\', \'' + req.body.owner_contact_no + '\', \'' + req.body.pet_description +'\')' , function(error,rows, fields) {
//             if(!!error){
//                 console.log('query can not be submitted');
//                 res.redirect('/contact');
//             }
//             else{
//                 console.log('Query Submitted');
//                 res.send("Pet details added succesfully");
//             }
//         });
//     }
// });

// app.get('/pets', function(req,res){
//     connection.query('select * from pets' , function(error,rows, fields) {
//         if(!!error){
//             console.log('query can not be submitted');
//             res.send("no pet found");
//         }
//         else{
//             console.log('Query Submitted');
//             res.send(rows);
//         }
//     });
// });

// app.get('/pets/:owner_name', function(req,res){
//     owner_name = req.params.owner_name;
//     connection.query('select * from pets where owner_name=\'' + owner_name + '\'' , function(error,rows, fields) {
//         if(!!error){
//             console.log('query can not be submitted');
//             res.send("no pet found");
//         }
//         else{
//             console.log('Query Submitted');
//             res.send(rows);
//         }
//     });
// });

// app.delete('/pets', function(req,res){
//     owner_name = req.body.owner_name;
//     connection.query('delete from pets where owner_name=\'' + owner_name + '\'' , function(error,rows, fields) {
//         if(!!error){
//             console.log('query can not be submitted');
//             res.send("no pet found");
//         }
//         else{
//             console.log('Query Submitted');
//             res.send(rows);
//         }
//     });
// });


// app.get('/redirects', function(req,res){
//     session = req.session;
//     if(session.uniqueID){
//         if(session.uniqueID == 'admin'){
//             res.redirect('/adminportal');
//         }
//         else if(session.uniqueID){
//             res.redirect('/userportal');
//         }
//     }
//     else{
//         res.redirect('/logout');
//     }
// });

// app.use(function(req, res, next) {
//     res.status(404).sendFile('404.html', {root: path.join(__dirname, './views')});
// });

// app .listen(1337, function(){
//     console.log('app server running at port 1337');
// })

// // var express = require('express')
// // var app = express();
// // var router = express.Router();

// // app.use('/css', express.static(__dirname + '/assets'));
// // app.use('/firstRouter', router);

// // router.get('/subroute', function(req,res){
// //     res.end('router working');
// // })

// // // can be accessed with localhost:1337/firstRouter/subroute

// // //will be normally working
// // app.get('/', function(req,res){
// //     res.end('I am on');
// // })

// // app .listen(1337, function(){
// //     console.log('app server running at port 1337');
// // })

// // var express = require('express');
// // var path = require('path');
// // var cookieParser = require('cookie-parser');

// // var app = express();

// // // app.use(bodyParser());
// // app.unsubscribe(cookieParser());
// // app.use('/css', express.static(__dirname + '/assets'));

// // app.get('/', function(req,res){
// //     res.cookie('firstCookie', "something")
// //     res.end('sadfgd');
// //     // res.sendFile('index.html', {root: path.join(__dirname, './static')});
// // })
// // app.get('/clearCookie', function(req,res){
// //     res.clearCookie('firstCookie')
// //     res.end('sadfgd');
// //     // res.sendFile('index.html', {root: path.join(__dirname, './static')});
// // })

// // app .listen(1337, function(){
// //     console.log('app server running at port 1337');
// // })



// // var express = require('express');
// // var path = require('path');
// // var fs = require('fs');
// // var bodyParser = require('body-parser');
// // var app = express();

// // app.use(bodyParser());
// // app.use('/css', express.static(__dirname + '/assets'));

// // app.get('/', function(req,res){
// //     res.sendFile('index.html', {root: path.join(__dirname, './static')});
// // })

// // app.post('/', function(req,res){
// //     if(req.body.firstname == 'sagar'){
// //         res.end(JSON.stringify(req.body));
// //     }
// //     else{
// //         res.end('error');
// //     }

// // })

// // app .listen(1337, function(){
// //     console.log('app server running at port 1337');
// // })


// // app.get('/hello', function(req, res){
// //     res.send('hello function');
// // })


// // app.get('/', function(req, res){
// //     res.sendFile('index.html', {root: path.join(__dirname, './static')});
// // })

// // app.get('/', function(req,res){
// //     var response = "hey " + req.query.something;
// //     // res.end(JSON.stringify(req.query));
// //     res.end(response);
// // })


// // app.get(/^(.+)$/, function(req,res){
// //     console.log(req.params);
// //     try{
// //         if(fs.statSync(path.join(__dirname, './static/', req.params[0] + '.html')).isFile()){
// //             res.sendFile(req.params[0] + '.html', {root: path.join(__dirname, './static')});
// //         }
// //     }
// //     catch(err){
// //         console.log(err);
// //         res.sendFile('404.html', {root: path.join(__dirname, './static')});
// //     }
    
// // });

// // var express = require('express');
// // var path = require('path');
// // var bodyParser = require('body-parser');
// // var sessions = require('express-session');
// // var mysql = require('mysql');

// // var connection = mysql.createConnection({
// //     host: 'localhost',
// //     user: 'root',
// //     password: '12345678',
// //     database: 'sampleDB'
// // });

// // connection.connect(function(error){
// //     if(!!error) {
// //         console.log('error');
// //     }
// //     else {
// //         console.log('connection succesful');
// //     }
// // });

// // var app = express();
// // var session;
// // var username;
// // var password;

// // app.use(sessions({
// //     secret: '23456789@#$%^&*',
// //     resave: false,
// //     saveUninitialized:false
// // }));
// // app.use(bodyParser());
// // app.use(bodyParser.json());
// // app.use(bodyParser.urlencoded({extended:true}));
// // app.use('/css', express.static(__dirname + '/assets'));


// // app.get('/sql', function(req,res){
// //     connection.query('select * from users', function(error,rows, fields) {
// //         if(!!error){
// //             console.log('Error in query');
// //         }
// //         else{
// //             console.log('query successfull');
// //             username = rows[0].username;
// //             password = rows[0].password;
// //         }
// //     });
// //     res.send(username);
// // });

// // app.get('/login', function(req,res){
// //     res.sendFile('index.html', {root: path.join(__dirname, './static')});
// // });

// // app.get('/admin', function(req,res){
// //     session = req.session;
// //     if(session.uniqueID){
// //         res.sendFile('admin.html', {root: path.join(__dirname, './static')});
// //     }
// //     else{
// //         res.redirect('/login');
// //     }
// // });

// // app.get('/logout', function(req,res){
// //     req.session.destroy();
// //     res.redirect('/login');
// // });

// // app.post('/login', function(req,res){
// //     session = req.session;
// //     connection.query('select * from users where username=\'' + req.body.username +'\'' , function(error,rows, fields) {
// //         if(!!error){
// //             console.log('User does not exist');
// //         }
// //         else{
// //             console.log('User is valid');
// //             username = rows[0].username;
// //             password = rows[0].password;
// //         }
// //     });

// //     if(req.body.username == username && req.body.password == password){
// //         session.uniqueID = req.body.username;
// //     }
// //     res.redirect('/redirects');
// // });

// // app.get('/redirects', function(req,res){
// //     session = req.session;
// //     if(session.uniqueID){
// //         console.log(session.uniqueID);
// //         res.redirect('/admin');
// //     }
// //     else{
// //         res.redirect('/login');
// //     }
// // });

// // app.use(function(req, res, next) {
// //     res.sendFile('404.html', {root: path.join(__dirname, './static')});
// // });

// // app .listen(1337, function(){
// //     console.log('app server running at port 1337');
// // })

// // var express = require('express')
// // var app = express();
// // var router = express.Router();

// // app.use('/css', express.static(__dirname + '/assets'));
// // app.use('/firstRouter', router);

// // router.get('/subroute', function(req,res){
// //     res.end('router working');
// // })

// // // can be accessed with localhost:1337/firstRouter/subroute

// // //will be normally working
// // app.get('/', function(req,res){
// //     res.end('I am on');
// // })

// // app .listen(1337, function(){
// //     console.log('app server running at port 1337');
// // })

// // var express = require('express');
// // var path = require('path');
// // var cookieParser = require('cookie-parser');

// // var app = express();

// // // app.use(bodyParser());
// // app.unsubscribe(cookieParser());
// // app.use('/css', express.static(__dirname + '/assets'));

// // app.get('/', function(req,res){
// //     res.cookie('firstCookie', "something")
// //     res.end('sadfgd');
// //     // res.sendFile('index.html', {root: path.join(__dirname, './static')});
// // })
// // app.get('/clearCookie', function(req,res){
// //     res.clearCookie('firstCookie')
// //     res.end('sadfgd');
// //     // res.sendFile('index.html', {root: path.join(__dirname, './static')});
// // })

// // app .listen(1337, function(){
// //     console.log('app server running at port 1337');
// // })



// // var express = require('express');
// // var path = require('path');
// // var fs = require('fs');
// // var bodyParser = require('body-parser');
// // var app = express();

// // app.use(bodyParser());
// // app.use('/css', express.static(__dirname + '/assets'));

// // app.get('/', function(req,res){
// //     res.sendFile('index.html', {root: path.join(__dirname, './static')});
// // })

// // app.post('/', function(req,res){
// //     if(req.body.firstname == 'sagar'){
// //         res.end(JSON.stringify(req.body));
// //     }
// //     else{
// //         res.end('error');
// //     }

// // })

// // app .listen(1337, function(){
// //     console.log('app server running at port 1337');
// // })


// // app.get('/hello', function(req, res){
// //     res.send('hello function');
// // })


// // app.get('/', function(req, res){
// //     res.sendFile('index.html', {root: path.join(__dirname, './static')});
// // })

// // app.get('/', function(req,res){
// //     var response = "hey " + req.query.something;
// //     // res.end(JSON.stringify(req.query));
// //     res.end(response);
// // })


// // app.get(/^(.+)$/, function(req,res){
// //     console.log(req.params);
// //     try{
// //         if(fs.statSync(path.join(__dirname, './static/', req.params[0] + '.html')).isFile()){
// //             res.sendFile(req.params[0] + '.html', {root: path.join(__dirname, './static')});
// //         }
// //     }
// //     catch(err){
// //         console.log(err);
// //         res.sendFile('404.html', {root: path.join(__dirname, './static')});
// //     }
    
// // });