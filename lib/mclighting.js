/* globals fetch */
const url = require('url');
const WebSocket = require('ws');
require('isomorphic-fetch');

function addressToHttp(address) {
  const parsed = url.parse(address);
  parsed.protocol = 'http';
  parsed.port = '80';
  return url.format(parsed);
}

module.exports = (address) => {
  let ws;
  let connecting = false;
  const ensureConnection = () => {
    if (connecting || ws) {
      return;
    }
    connecting = true;
    const connection = new WebSocket(address);
    connection.on('open', () => {
      connecting = false;
      ws = connection;
    });
    connection.on('close', () => {
      connecting = false;
      ws = null;
      setTimeout(ensureConnection, 1000);
    });
    connection.once('error', (err) => {
      console.error(err);
      connecting = false;
      ws = null;
      setTimeout(ensureConnection, 1000);
    });
  };
  ensureConnection();
  return {
    send: payload => new Promise((resolve, reject) => {
      if (!ws) {
        reject(new Error(`Not connected to McLighting ${address}`));
        return;
      }
      ws.once('message', (data) => {
        resolve(data);
      });
      ws.send(payload);
    }),
    status: () => fetch(`${addressToHttp(address)}status`)
      .then(res => res.json),
  };
};
