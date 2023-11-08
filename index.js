require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
    res.send("Toy Corner Server");
})

app.listen(port, () => {
    console.log(`Toy Corner Server is running on port: ${port}`);
})