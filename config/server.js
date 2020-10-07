var express = require('express');
var consign = require('consign');
var bodyParser = require('body-parser');
var cors = require('cors');

var app = express();

app.use(cors());
app.use(bodyParser.urlencoded( {extended: true} ));
app.use(bodyParser.json());

consign()
    .include('routes')
    .then('models')
    .then('controllers')
    .into(app)

module.exports = app;

