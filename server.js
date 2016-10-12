var fs = require('fs');
var express = require('express');
var app = express();

app.use(express.static('src'));
app.use(express.static('sample'));
app.use(express.static('node_modules'));
app.use('/spec', express.static('spec'));

app.get('/', function(req, res) {
    res.status(200).send(fs.readFileSync('sample/demo.html', 'utf8'));
});
app.listen(3000);

