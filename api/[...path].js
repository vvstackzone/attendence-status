import { handleRequest } from '../src/server.cjs';

export default function apiHandler(req, res) {
  req.url = req.url.replace(/^\/api(?=\/|$)/, '') || '/';
  handleRequest(req, res);
}