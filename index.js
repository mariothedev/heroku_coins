const app = require("express")();
require("dotenv").config();

app
  .get("/", (_, res) => {
    res.send("yew api");
  })
  .listen(process.env.PORT || 3000);
