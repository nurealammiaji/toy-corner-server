require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { query } = require("express");
const app = express();

// Variables
const port = process.env.PORT || 5000;
const username = process.env.DB_USER;
const password = process.env.DB_PASS;
const secret = process.env.ACCESS_TOKEN_SECRET;

// Middlewares
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  let token;
  if (!authorization) {
    res.status(401).send({ error: true, message: "Unauthorized Access !!" });
  }
  if (authorization) {
    token = authorization.split(" ")[1];
  }
  jwt.verify(token, secret, (error, decoded) => {
    if (error) {
      return res.status(401).send({ error: 1, message: "Unauthorized Access !!" });
    }
    req.decoded = decoded;
    next();
  })
}

// Server Config
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
    const blogCollection = client.db("toyCorner").collection("blog");

    // JWT
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, secret, { expiresIn: '1d' });
      res.send({ token });
    })

    // All Products
    app.get("/products", async (req, res) => {
      const sort = req.query.sort;
      const limit = parseInt(req.query.limit);
      const text = req.query.search;
      const search = {};
      if (text) {
        search = {name: {$regex: text, $options: "i"}};
      }
      let query = {};
      if (sort === "ascending") {
        query = { name: 1 };
      }
      if (sort === "descending") {
        query = { name: -1 };
      }
      if (sort === "default") {
        query = {};
      }
      const cursor = productsCollection.find(search).sort(query).limit(limit);
      const result = await cursor.toArray();
      res.send(result);
    })

    // Single Product
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    })

    // Add Product
    app.post("/products", async (req, res) => {
      const toy = req.body;
      const result = await productsCollection.insertOne(toy);
      res.send(result);
    })

    // Update Product
    app.put("/products/:id", async (req, res) => {
      const id = req.params.id;
      const product = req.body;
      console.log(product);
      const filter = { _id: new ObjectId(id) };
      // const options = {upsert: true};
      const updateProduct = {
        $set: {
          name: product.name,
          manufacturer: product.manufacturer,
          seller: product.seller,
          sellerEmail: product.sellerEmail,
          subCategory: product.subCategory,
          color: product.color,
          ageRange: product.ageRange,
          description: product.description,
          price: product.price,
          availability: product.availability,
          category: product.category,
          ratings: product.ratings,
          quantity: product.quantity,
          image: product.image
        }
      }
      const result = await productsCollection.updateOne(filter, updateProduct);
      res.send(result);
    })

    // Product Category
    app.get("/products/categories/:category", async (req, res) => {
      const subCategory = req.params.category;
      const query = { subCategory: subCategory };
      const cursor = productsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })

    // Seller Product with JWT Verification
    app.get("/products/seller/:email", verifyJWT, async (req, res) => {
      let query = {};
      const user = req.decoded.user;
      const email = req.params.email;
      if (user !== email) {
        return res.status(403).send({ error: 1, message: "Forbidden Access !!" });
      }
      if (user === email) {
        query = { sellerEmail: email };
      }
      const cursor = productsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })

    // Product Delete
    app.delete("/products/seller/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    })

    // Product Search (Multi Field)
    app.get("/products/search/:text", async (req, res) => {
      const text = req.params.text;
      const cursor = productsCollection.find(
        {
          "$or": [
            { name: { $regex: text, $options: "i" } },
            // {category: {$regex: text}},
            // {subCategory: {$regex: text}}
          ]
        }
      );
      const result = await cursor.toArray();
      res.send(result);
    })

    // Add to Wishlist
    app.post("/wishlist", async (req, res) => {
      const order = req.body;
      const newOrder = {
        productName: order.productName,
        productPrice: order.productPrice,
        productColor: order.productColor,
        productImage: order.productImage,
        productManufacturer: order.productManufacturer,
        productMaterial: order.productMaterial,
        customerEmail: order.customerEmail,
        customerDetails: {
          name: order.customerDetails.name,
          phone: order.customerDetails.phone,
          address: order.customerDetails.address
        }
      };
      const result = await wishlistCollection.insertOne(newOrder);
      res.send(result);
    })

    // Wishlist
    app.get("/wishlist/:email", async (req, res) => {
      const email = req.params.email;
      const query = { customerEmail: email };
      const cursor = wishlistCollection.find(query);
      const result = await cursor.toArray(cursor);
      res.send(result);
    })

    // Product Order
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

    // Orders List
    app.get("/orders", async (req, res) => {
      const cursor = ordersCollection.find();
      const result = await cursor.toArray(cursor);
      res.send(result);
    })

    // Blog Posts
    app.get("/blog", async (req, res) => {
      const cursor = blogCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    // Single Blog Post
    app.get("/blog/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const cursor = blogCollection.find(query);
      const result = await cursor.toArray();
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
