const express = require("express");
const app = express();
const product = require("./api/product");
const PORT = process.env.PORT || 3001;

const mongoose = require("mongoose");
const schema = new mongoose.Schema({ name: String, size: String });

function run() {
  mongoose
    .connect(
      "mongodb+srv://react:FZyg0RnKMINyjL9d@cluster0.h72djcl.mongodb.net"
    )
    .then((res) => {
      console.log(
        "Pinged your deployment. You successfully connected to MongoDB!"
      );
      app.use("/api/product", product);
      app.get("/test", async () => {
        const Tank = mongoose.model("Tank", schema);

        const small = new Tank({ size: "small" });
        await small.save();
        // or
        await Tank.create({ size: "small", name: "八九式" });
        // or, for inserting large batches of documents
        await Tank.insertMany([{ size: "small" }]);
        res.json({
          status: 200,
          message: "Get data has successfully",
        });
      });
      app.get("/all", async () => {
        const Tank = mongoose.model("Tank", schema);
        let list = await Tank.find().lean();
        res.json({
          status: 200,
          message: "Get data has successfully",
          data: list,
        });
      });
    })
    .catch((err) => {
      console.log(err, "err");
    })
    .finally(() => {
      console.log("end");
    });
}
run();
app.use(express.json({ extended: false }));

app.listen(PORT, () => console.log(`Server is running in port ${PORT}`));
//mongodb+srv://react:<password>@cluster0.h72djcl.mongodb.net/
