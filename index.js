const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt_decode = require('jwt-decode');
const uuid = require('uuid');

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4200;
const uri = "mongodb+srv://hudaicommerce:DUjNi4GLNHE3Mg1p@hudai-commerce.atat27x.mongodb.net/?retryWrites=true&w=majority"

app.use(cors());
app.use(bodyParser.json());

const connectToMongoDB = async () => {
    const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    return client.db('hudaiCommerce');
};










// deconde token
function decodeToken(token) {
    try {
        // Verify the token and decode the payload
        const decoded = jwt_decode(token);

        // Return the decoded payload
        return decoded;
    } catch (error) {
        console.error(error);
        return null; // Return null if the token is invalid or the verification fails
    }
}




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

        res.send(insertedProducts);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to add products" });
    }
});






//  product category 
// get data
app.get('/productsCategory', async (req, res) => {

    // /productsCategory?name=computers&pageSize=20&pageNumber=2 api link will be this


    try {
        const token = req.headers.authorization;

        if (!token?.startsWith("Bearer ey")) {
            res.status(401).json({ message: 'Unauthorized Login', statusCode: 401 });
            return
        }
        if (token?.startsWith("Bearer ey")) {
            const decodeData = decodeToken(token)
            const catgoryAccess = ["ROLE_OWNER", "ROLE_ADMIN",]
            if (decodeData && catgoryAccess.includes(decodeData.role)) {
                const db = await connectToMongoDB();
                const pageSize = parseInt(req.query.pageSize) || 10; // default page size is 10
                const pageNumber = parseInt(req.query.pageNumber) || 1; // default page number is 1

                const startIndex = (pageNumber - 1) * pageSize;
                const endIndex = pageNumber * pageSize;
                const name = req.query.name;

                const query = name ? { 'name': { '$regex': name, '$options': 'i' } } : {};


                console.log(name)
                const productsCategory = await db.collection('productsCategory').find(query).skip(startIndex).limit(pageSize).toArray();
                const totalElements = await db.collection('productsCategory').countDocuments(query); // count total number of products
                const totalPages = Math.ceil(totalElements / pageSize); // calculate total number of pages

                res.status(200).json({
                    value: productsCategory,
                    totalElements: totalElements,
                    totalPages: totalPages
                });
                return;
            }
            res.status(401).json({ message: 'Unauthorized Login', statusCode: 401 });
            return
        }
    } catch (err) {
        res.status(400).json({ message: 'Bad request', statusCode: 400 });
    }

});


// post data
app.post('/productsCategory', async (req, res) => {



    try {
        const token = req.headers.authorization;

        if (!token?.startsWith("Bearer ey")) {
            res.status(401).json({ message: 'Unauthorized Login', statusCode: 401 });
            return
        }
        if (token?.startsWith("Bearer ey")) {
            const decodeData = decodeToken(token)
            const catgoryAccess = ["ROLE_OWNER", "ROLE_ADMIN",]
            if (decodeData && catgoryAccess.includes(decodeData.role)) {
                const db = await connectToMongoDB();
                const bodyData = req.body;


                if (!Array.isArray(bodyData)) {
                    res.status(422).json({ message: 'Data must be in array format.', statusCode: 422 });
                    return
                }

                const error = []

                for (let i = 0; i < bodyData.length; i++) {
                    const category = bodyData[i];
                    let isError = false
                    if (!category.name) {
                        error.push({ message: 'Name is required', statusCode: 422 })
                        isError = true
                    }
                    if (!category.slug) {
                        error.push({ message: 'Slug is required', statusCode: 422 })
                        isError = true
                    }
                    if (!category.image) {
                        error.push({ message: 'Image is required', statusCode: 422 })
                        isError = true
                    }

                    if (isError) {
                        break
                    }

                }
                if (error.length > 0) {
                    res.status(422).json(error);
                    return
                }

                const result = await db.collection('productsCategory').insertMany(bodyData);
                const insertedIds = Object.values(result.insertedIds);
                const insertedCategory = await db.collection('productsCategory').find({ _id: { $in: insertedIds } }).toArray();

                res.status(200).json({
                    value: insertedCategory,
                    statusCode: 200,
                    message: "products category inserted"
                });


            }
            res.status(401).json({ message: 'Unauthorized Login', statusCode: 401 });
            return
        }
    } catch (err) {
        res.status(400).json({ message: 'Bad request', statusCode: 400 });
    }

});




// post data
app.delete('/productsCategory/:deleteId', async (req, res) => {

    try {
        const token = req.headers.authorization;

        if (!token?.startsWith("Bearer ey")) {
            res.status(401).json({ message: 'Unauthorized Login', statusCode: 401 });
            return
        }
        if (token?.startsWith("Bearer ey")) {
            const decodeData = decodeToken(token)
            const catgoryAccess = ["ROLE_OWNER", "ROLE_ADMIN",]
            if (decodeData && catgoryAccess.includes(decodeData.role)) {
                const db = await connectToMongoDB();
                const { deleteId } = req.params;

                if (!deleteId) {
                    res.status(422).json({ "message": "Delete id is required", statusCode: 422 });
                    return
                }
                const findData = await db.collection("productsCategory").findOne({ "_id": new ObjectId(`${deleteId}`) })

                if (!findData) {
                    res.status(404).json({ message: 'Product category Not found', statusCode: 404 });
                    return
                }

                const deletedData = await db.collection("productsCategory").deleteOne({ "_id": new ObjectId(`${deleteId}`) }) 

                if (deletedData.deletedCount) {
                    res.status(200).json({
                        value: findData,
                        statusCode: 200,
                        message: "Products category deleted"
                    });
                }
                res.status(400).json({ message: 'Internal server error', statusCode: 500 });
                return




            }
            res.status(401).json({ message: 'Unauthorized Login', statusCode: 401 });
            return
        }
    } catch (err) {
        console.log(err)
        res.status(400).json({ message: 'Bad request', statusCode: 400 });
    }

});




app.get('/', (req, res) => {
    res.send('Hello World!')
});

app.listen(port, () => console.log(`Server started on port ${port}`));
