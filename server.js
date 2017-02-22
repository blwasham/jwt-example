var express = require('express');
var faker = require('faker'); // generates fake data for the app to use
var cors = require('cors');
var bodyParser = require('body-parser'); // gives express ability to parse request body
var jwt = require('jsonwebtoken');
var expressJwt = require('express-jwt');

// below should come from an env variable or some other secure place
var jwtSecret = 'sdlkjeflksdjfl';

// this would be from dynamo users table, rather than hardcoded here
var user = {
  username: 'bwasham',
  password: 'p'
};

var app = express();

app.use(cors()); // enablers cors
app.use(bodyParser.json()); // parse json body

// expressJwt middleware will intercept all requests that come in
// takes auth header with bearer + token and decodes using jwtSecret
// if signature verified then it will add user to request object
// user property will be the decoded json object
// only /login is only unprotected route
app.use(expressJwt({ secret: jwtSecret}).unless({path: [ '/login']}));

// route uses faker to generate random user information
// this is just a sample resource that we use to test out auth protection
app.get('/random-user', (req, res) => {
  var user = faker.helpers.userCard();
  user.avatar = faker.image.avatar();
  res.json(user);
});


app.post('/login', authenticate, (req, res) => {
  // look at specification on what to include here
  var token = jwt.sign({
    username: user.username
  }, jwtSecret);

  // send back token to client
  res.send({
    token: token,
    user: user
  });
});

app.get('/me', function(req, res) {
  res.send(req.user);
});

app.listen(3000, () => {
  console.log('App listening on localhost:3000');
});

// UTIL function

//middleware function to authenticate a user
function authenticate(req, res, next) {
  var body = req.body;

  // 400 bad request
  if (!body.username || !body.password) {
    res.status(400).end('Must provide username or password');
  }

  // 401 Unauthorized
  if(body.username !== user.username || body.password !== user.password) {
    res.status(401).end('Username or password incorrect');
  }
  next();
}
