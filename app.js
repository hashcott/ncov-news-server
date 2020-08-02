// server.js
const jsonServer = require("json-server");
const server = jsonServer.create();
const router = jsonServer.router("database.json");
const middlewares = jsonServer.defaults();
const PORT = process.env.PORT || 3000;
server.use(middlewares);

server.use(jsonServer.bodyParser);
server.use((req, res, next) => {
  if (req.method === "GET") {
    return next();
  }
  return res.jsonp({ msg: "Method not allowed !" });
});
server.use(router);
server.listen(PORT, () => {
  console.log("JSON Server is running");
});
