var express    = require('express');
var app        = express();
var r          = require('rethinkdb');

app.use(express.static(__dirname));

var connection = null;
r.connect({host: 'localhost', port: 28015}, function (err, conn) {
  if (err) throw err;
  connection = conn;

  r.tableList().run(connection, function (err, result) {
    if ( result.indexOf('posts') < 0 ) {
      r.tableCreate('posts').run(connection);
    }
  });
});

app.get('/posts', function (req, res) {
  r.table('posts').run(connection, function(err, cursor) {
    if (err) throw err;
    cursor.toArray(function(err, result) {
      if (err) throw err;
      res.writeHead(200, {
        'Content-Type'  : 'text/event-stream',
        'Cache-Control' : 'no-cache',
        'Connection'    : 'keep-alive'
      });
      res.write('event: ' + 'init' + '\n');
      res.write('data: ' + JSON.stringify(result) + '\n\n');
    });
  });

  r.table('posts').changes().run(connection, function(err, cursor) {
    if (err) throw err;
    cursor.each(function(err, row) {
      if (err) throw err;
      res.write('data: ' + JSON.stringify(row) + '\n\n');
    });
  });
});

app.post('/posts', function (req, res) {
  r.table('posts').insert(req.body).run(connection);
});

app.listen(3000);
