var querystring = require('querystring');
var https = require('https');
var http = require('http');

var express = require('express');
var fs = require('fs');
var app =  express.createServer();

var auth = "";
var data = [];

login();
queryAll();
setInterval(login, 14400000);

// Initialize main server
app.use(express.bodyParser());

app.use(express.static(__dirname + '/public'));

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');


app.get('/', function(req, res){
  res.render('index');
});

app.get('/list', function(req, res){
  res.send(JSON.stringify(data));
});

app.post('/update', function(req, res){
  update(req.body.lat, req.body.lng, req.body.id);
});

app.post('/new', function(req, res){
  insert(req.body.fruit, req.body.lat, req.body.lng, req.body.desc, req.body.id, function(rowid){
    data.push({fruit: req.body.fruit, rowid: rowid, description: req.body.desc, id: req.body.id, addr: req.body.lat + ' ' + req.body.lng, location: {lat: req.body.lat, lng: req.body.lng}});
  });
  
  res.send('ok');
});


app.listen(80);


function queryAll () {
 
  var options = {
    host: 'www.google.com',
    port: 80,
    path: '/fusiontables/api/query?sql='+encodeURI('SELECT Fruit, Description, Id, Location, ROWID FROM 1172218'),
    method: 'GET'
  };

  var req = http.request(options, function(res) {
    var body = "";
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      body += chunk;
    });
    res.on('end', function(){
      var lines = body.split("\n");
      lines.shift();
      lines.pop();
      data = [];
      for(var i = 0; i < lines.length; i++) {
        var datum = lines[i].split(',', 5);
        geocode(datum, function(datum, loc){
          data.push({fruit: datum[0], location: loc, addr: datum[3], description: datum[1], id: datum[2], rowid: datum[4]});
        });
      }
    });
  });

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });

  req.end();
  
}

function insert (fruit, lat, lng, description, id, cb) {
  fruit.replace("'", "\'");
  description.replace("'", "\'");
  id.replace("'", "\'");
  
  var sql = "INSERT INTO 1172218 (Fruit, Location, Description, Id) VALUES ('"+fruit+"', '"+lat+" "+lng+"', '"+description+"', '"+id+"')";
  var options = {
    host: 'www.google.com',
    port: 443,
    path: '/fusiontables/api/query?sql='+encodeURI(sql),
    method: 'POST',
    headers: {
      'Authorization': 'GoogleLogin auth='+auth
    }
  };
  
  var req = https.request(options, function(res) {
    var body = "";
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      var lines = chunk.split("\n");
      lines.pop();   
      cb(lines.pop());
    });
  });

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });
  req.end();
  
}

function findRow(id) {
  for(var i in data) {
    if(data[i].id == id) {
      return data[i];
    }
  }
  return -1;
}

function update (lat, lng, id) {
  var row = findRow(id);
  row.location.lat = lat;
  row.location.lng = lng;
  var sql = "UPDATE 1172218 SET Location = '"+lat+" "+lng+"' WHERE ROWID = '"+row.rowid+"'";
  var options = {
    host: 'www.google.com',
    port: 443,
    path: '/fusiontables/api/query?sql='+encodeURI(sql),
    method: 'POST',
    headers: {
      'Authorization': 'GoogleLogin auth='+auth
    }
  };
  
  var req = https.request(options, function(res) {
    var body = "";
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      body += chunk;
    });
    res.on('end', function(){
      console.log(body);
    });
  });

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });
  req.end();
  
}

function geocode (datum, cb){
    var options = {
    host: 'maps.googleapis.com',
    port: 80,
    path: '/maps/api/geocode/json?sensor=false&address='+encodeURI(datum[3]),
    method: 'GET'
  };

  var req = http.request(options, function(res) {
    var body = "";
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      body += chunk;
    });
    res.on('end', function(){
      var data = JSON.parse(body);
      if(data.results[0]) {
        cb(datum, data.results[0].geometry.location);
      }
    });
  });

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });

  req.end();
}

function login () {

  var options = {
    host: 'google.com',
    port: 443,
    path: '/accounts/ClientLogin',
    method: 'POST',
    headers: {
      'Content-type': 'application/x-www-form-urlencoded'
    }
  };

  var req = https.request(options, function(res) {
    var body = "";
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      body += chunk;
    });
    res.on('end', function(){
      var lines = body.split("\n");
      lines.pop();   
      auth = lines.pop().split("=").pop();
    });
  });

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });

  req.write('accountType=GOOGLE&Email=nosleepinsoda@gmail.com&Passwd=abc123m20&service=fusiontables&source=orshard');
  req.end();

}
