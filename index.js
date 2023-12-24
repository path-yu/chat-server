const express = require("express");
const app = express();
const product = require("./api/product");
const PORT = process.env.PORT || 3001;
require("./websocket");
app.use("/api/product", product);

app.use(express.json({ extended: false }));

app.listen(PORT, () => console.log(`Server is running in port ${PORT}`));
//mongodb+srv://react:<password>@cluster0.h72djcl.mongodb.net/
