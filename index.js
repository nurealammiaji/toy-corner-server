require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;
const username = process.env.DB_USER;
const password = process.env.DB_PASS;

app.get("/", (req, res) => {
  res.send("Toy Corner Server");
})

app.listen(port, () => {
  console.log(`Toy Corner Server is running on port: ${port}`);
})

// MongoDB Driver
const uri = `mongodb+srv://${username}:${password}@cluster0.31s3qjy.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect();

    const productsCollection = client.db("toyCorner").collection("products");
    const ordersCollection = client.db("toyCorner").collection("orders");
    const wishlistCollection = client.db("toyCorner").collection("wishlist");

    app.get("/products", async (req, res) => {
      const limit = parseInt(req.query.limit);
      console.log(limit);
      const cursor = productsCollection.find().limit(limit);
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get("/products/:id", async(req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = {_id: new ObjectId(id)};
      const result = await productsCollection.findOne(query);
      res.send(result);
    })

    app.get("/products/categories/:category", async(req, res) => {
      const category = req.params.category;
      const query = {category: category};
      const cursor = productsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })

    app.post("/orders", (req, res) => {
      const info = req.body;
      const order = {
        productName: info.productName,
        productPrice: info.productPrice,
        productColor: info.productColor,
        productImage: info.productImage,
        productManufacturer: info.productManufacturer,
        productMaterial: info.productMaterial,
        customerDetails: {
          name: info.customerDetails.name,
          email: info.customerDetails.email,
          phone: info.customerDetails.phone
        }
      };
      const result = ordersCollection.insertOne(order);
      res.send(result);
      console.log(result);
    })

    app.get("/orders", (req, res) => {
      const cursor = ordersCollection.find();
      const result = cursor.toArray(cursor);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
