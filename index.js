import express from 'express';
import mongodb, { ObjectId } from 'mongodb';
import { collectionName, connection } from './dbConfig.js';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import cookieParser from "cookie-parser"; // used to parse the cookies that got from the frontend side

const url = "";

const app = express();

app.use(cors({
    origin: "http://localhost:5173", // Add them for resolving CORS error that comes after installing the cookieParser library TO ALLOW COOKIE PARSER FOR A PARTICULAR DOMAIN OR PORT
    credentials: true               // ''-------''
}));

app.use(cookieParser());

app.use(express.json());

app.post('/add-task', verifyJWTToken, async (req, res) => {

    console.log("add-task route");


    const db = await connection();

    console.log("add-task db");


    const collection = db.collection(collectionName);

    console.log("add-task collection");


    const result = await collection.insertOne(req.body);

    console.log("add-task route result", result);

    if (result) {
        res.send({
            message: "New Task Added",
            success: true,
            result: result
        });
    }

    else {
        res.send({
            message: "Something went wrong",
            success: false
        });
    }
});

app.get("/tasks", verifyJWTToken, async (req, res) => {

    const db = await connection();

    console.log("cookies are ", req.cookies.token);

    const collection = db.collection(collectionName);

    const result = await collection.find().toArray();

    if (result) {
        res.send({
            message: "List fetched successfully",
            success: true,
            result: result
        });
    }
    else {
        res.send({
            message: "Error",
            success: false,
            result: result
        });
    }
});


app.delete("/delete-task/:id", verifyJWTToken, async (req, res) => {

    const id = req.params.id;

    const db = await connection();

    const collection = await db.collection(collectionName);

    console.log("deletion id", id)

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result) {
        res.send({
            message: "Task deleted successfully",
            success: true,
            result: result
        });
    }
    else {
        res.send({
            message: "Error/Something went wrong",
            success: false,
            result: result
        });
    }
});

app.delete("/delete-multiple", verifyJWTToken, async (req, res) => {
    const db = await connection();

    console.log("delete multiple", req.body);

    const ids = req.body;

    const selectedIds = ids.map((item) => new ObjectId(item));

    const collection = db.collection(collectionName);

    const result = await collection.deleteMany({ _id: { $in: selectedIds } });

    if (result) {

        res.send({
            message: "Tasks deleted successfully",
            success: true,
            result
        });
    }
    else {
        res.send({
            message: "Something went wrong, please try after sometime",
            success: false,
            result
        });
    }
})

app.get("/get-task/:id", verifyJWTToken, async (req, res) => {

    const id = req.params.id;

    const db = await connection();

    const collection = db.collection(collectionName);

    console.log("get task id", id)

    const result = await collection.findOne({ _id: new ObjectId(id) });

    if (result) {
        res.send({
            message: "Task fetched successfully",
            success: true,
            result: result
        });
    }
    else {
        res.send({
            message: "Error/Something went wrong",
            success: false,
            result: result
        });
    }
});

app.put("/update-task/:id", verifyJWTToken, async (req, res) => {

    const id = req.params.id;

    const db = await connection();

    const collection = db.collection(collectionName);

    const filter = { _id: new ObjectId(req.params.id) };

    const { _id, ...updateData } = req.body;

    console.log("get task id", id);

    const result = await collection.updateOne(filter, { $set: updateData });

    console.log("updateData is >>>>>", updateData);

    console.log("get task id", id);


    if (result) {
        res.send({
            message: "Task updated successfully",
            success: true,
            result: result
        });
    }
    else {
        res.send({
            message: "Error/Something went wrong",
            success: false,
            result: result
        });
    }
});

app.post("/signup", async (req, res) => {
    const db = await connection();

    const userData = req.body;

    const collection = db.collection("users");

    const result = collection.insertOne(req.body);


    if (result) {
        jwt.sign(userData, 'google', { expiresIn: '5d' }, (error, token) => {
            res.send({
                message: "Signup Successfully Done",
                success: true,
                token
            })
        });
    }
    else {
        res.send({
            message: "Something went wrong",
            success: false
        })
    }
});

app.post('/login', async (req, res) => {

    const userData = req.body;

    console.log("login api req body", req.body);

    const db = await connection();

    const collection = db.collection('users');

    if (userData.email && userData.password) {

        const result = await collection.findOne({ email: userData.email, password: userData.password });

        if (result) {
            jwt.sign(userData, 'google', { expiresIn: '5d' }, (error, token) => {

                if (token) {
                    res.send({
                        message: "login successfully done",
                        success: true,
                        token
                    });
                }
            })
        }
        else {
            res.send({
                message: "user not found",
                success: false
            });
        }
    }
    else {
        res.send({
            message: "something went wrong",
            success: false
        });
    }
});

function verifyJWTToken(req, res, next) {

    const token = req.cookies.token;

    jwt.verify(token, 'google', (error, decodedToken) => {
        if (error) {
            return res.send({
                message: "invalid token",
                success: false
            });
        }

        console.log("decodedToken", decodedToken);
        next();
    })
}

const PORT = process.env.PORT || 3200;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


