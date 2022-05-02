var fs = require('fs');
var express = require('express');
var app = express();
var Url = require('url');

app.use(express.static('src'));
app.use(express.static('sample'));
app.use(express.static('node_modules'));

app.get('/', function(req, res) {
    var query = Url.parse(req.url).query;
    if (query && query.indexOf('reveal') > -1) {
        res.status(200).send(fs.readFileSync('sample/reveal.html', 'utf8'));
    } else if (query && query.indexOf('walker') > -1) {
        res.status(200).send(fs.readFileSync('sample/walker.html', 'utf8'));
    } else {
        res.status(200).send(fs.readFileSync('sample/demo.html', 'utf8'));
    }
});
app.listen(3000);

