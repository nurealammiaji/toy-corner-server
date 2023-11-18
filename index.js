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
      const cursor = productsCollection.find().limit(limit);
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    })

    app.post("/products", async (req, res) => {
      const toy = req.body;
      const result = await productsCollection.insertOne(toy);
      res.send(result);
    })

    app.get("/products/categories/:category", async (req, res) => {
      const category = req.params.category;
      const query = { material: category };
      const cursor = productsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get("/products/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { sellerEmail: email };
      const cursor = productsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })

    app.delete("/products/seller/:id", async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    })

    app.post("/orders", async (req, res) => {
      const order = req.body;
      const newOrder = {
        productName: order.productName,
        productPrice: order.productPrice,
        productColor: order.productColor,
        productImage: order.productImage,
        productManufacturer: order.productManufacturer,
        productMaterial: order.productMaterial,
        customerDetails: {
          name: order.customerDetails.name,
          email: order.customerDetails.email,
          phone: order.customerDetails.phone
        }
      };
      const result = await ordersCollection.insertOne(newOrder);
      res.send(result);
    })

    app.get("/orders", async (req, res) => {
      const cursor = ordersCollection.find();
      const result = await cursor.toArray(cursor);
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
