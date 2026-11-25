// Home's helper. TizenBrew runs this in its background service, where the TV's
// app-launching feature is available. Home's screen asks it to open apps.
// Written in old-style JavaScript because 2018 Samsung TVs run an old Node.js.
var http = require('http');
var url = require('url');

var PORT = 8099;

function launchFirst(ids, i, done) {
  if (i >= ids.length) return done(false, 'not-found');
  try {
    tizen.application.launch(ids[i], function () {
      done(true, ids[i]);
    }, function () {
      launchFirst(ids, i + 1, done);
    });
  } catch (e) {
    launchFirst(ids, i + 1, done);
  }
}

var server = http.createServer(function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  var u = url.parse(req.url, true);

  if (u.pathname === '/ping') {
    res.end(JSON.stringify({ ok: true, tizen: typeof tizen !== 'undefined' }));
    return;
  }

  if (u.pathname === '/launch') {
    var ids = String(u.query.ids || '').split(',').filter(function (s) { return s.length > 0; });
    if (typeof tizen === 'undefined' || !tizen.application) {
      res.end(JSON.stringify({ ok: false, info: 'no-tizen' }));
      return;
    }
    launchFirst(ids, 0, function (ok, info) {
      res.end(JSON.stringify({ ok: ok, info: info }));
    });
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ ok: false }));
});

server.on('error', function () { /* port already in use: an earlier copy is running */ });
server.listen(PORT, '127.0.0.1');
