const wslib = require('ws');
const fs = require('fs');
const cb = require('crypto-browserify');
const repl = require('repl');

const options = {
    rejectUnauthorized: false,
    key: fs.readFileSync('C:\\Users\\dkack\\.rchia\\certs\\chiapas\\private_daemon.key'),
    cert: fs.readFileSync('C:\\Users\\dkack\\.rchia\\certs\\chiapas\\private_daemon.crt')
  };
const ws = new wslib.WebSocket('wss://chiapas:55400', options);
repl.start('> ').context.m = "m";

ws.on('open', function open() {
  const msg = formatMessage("register_service", "daemon", { service: "chia_repl" });
  ws.send(msg);
});

ws.on('message', function message(data) {
  console.log(JSON.stringify(JSON.parse(data), null, 2));
});

function formatMessage(command, destination, data = {})
{
  var message = {};
  message.command = command;
  message.origin = "chia_repl";
  message.destination = destination;
  message.ack = false;
  message.request_id = cb.randomBytes(32).toString('hex');
  message.data = data;

  return JSON.stringify(message);
}