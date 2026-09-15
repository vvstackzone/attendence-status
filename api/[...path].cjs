const { handleRequest } = require('../src/server.cjs');

module.exports = (req, res) => {
  req.url = req.url.replace(/^\/api(?=\/|$)/, '') || '/';
  handleRequest(req, res);
};