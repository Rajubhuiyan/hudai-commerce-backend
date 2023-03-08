const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4200;
const uri ="mongodb+srv://hudaicommerce:DUjNi4GLNHE3Mg1p@hudai-commerce.atat27x.mongodb.net/?retryWrites=true&w=majority"

app.use(cors());
app.use(bodyParser.json());

const connectToMongoDB = async () => {
    const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    return client.db('hudaiCommerce');
};

app.get('/products', async (req, res) => {
    try {
        const db = await connectToMongoDB();
        const products = await db.collection('products').find().toArray();
        console.log(products)
        res.send(products);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});


app.post('/products', async (req, res) => {
    try {
        const db = await connectToMongoDB();
        const products = req.body;

        // Check if all data objects have a name property
        const hasNameProperty = products.every(product => product.hasOwnProperty('name'));
        if (!hasNameProperty) {
            res.status(400).send({ message: "Name is required for all products" });
            return;
        }



        // Check if all data objects have an image property that is an array
        const hasImageArray = products.every(product => Array.isArray(product.images) && product.images.length > 0);
        if (!hasImageArray) {
            res.status(400).send({ message: "Image must be a non-empty array for all products" });
            return;
        }


        // for (let i = 0; i < products.length; i++) {
        //     const product = products[i];

        //     // Check if category ID is provided
        //     if (!product.hasOwnProperty('category')) {
        //         res.status(400).send({ message: "Category is required for all products" });
        //         return;
        //     }

        //     // Find category object by ID
        //     const category = await db.collection('productCategory').findOne({ _id: ObjectId(product.category) });

        //     // Add category object to product
        //     if (category) {
        //         product.category = category;
        //     } else {
        //         res.status(400).send({ message: "Invalid category ID" });
        //         return;
        //     }
        // }

        const result = await db.collection('products').insertMany(products);

        const insertedIds = Object.values(result.insertedIds);
        const insertedProducts = await db.collection('products').find({ _id: { $in: insertedIds } }).toArray();
        console.log(insertedProducts);
        res.send(insertedProducts);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to add products" });
    }
});

app.get('/', (req, res) => {
    res.send('Hello World!')
});

app.listen(port, () => console.log(`Server started on port ${port}`));
