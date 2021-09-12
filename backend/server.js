const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const config = require('config');

const app = express();

require('dotenv').config()

const db = require('./db');
const cloudinary = require('./utils/cloudinary')
const upload = require('./utils/multer')

const port = process.env.PORT || 5000

app.use(express.json());

// Create a New User/Employee
app.post('/api/v1/create-user', async (req, res, next) => {
    const { firstName, lastName, email, password, gender, jobrole, department, address } = req.body;

    if (!firstName || !lastName || !email || !password || !gender || !jobrole || !department || !address) {
        throw Error({ message: 'please enter all fields' })
    }
    if (password.length < 8) {
        throw Error({ message: 'Password should not be less than 8 character' })

    }

    try {
        const hash = await bcrypt.hash(password, 10);
        const result = await db.query(`SELECT * FROM users WHERE email=$1`, [email])

        if (!result) {
            throw err
        }

        if (result.rows.length > 0) {
            res.send({ message: 'User Already Exist' })
        }

        const results = await db.query('INSERT INTO users(firstName,lastName,email,password,gender,jobrole,department,address) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', [firstName, lastName, email, hash, gender, jobrole, department, address])

        const token = jwt.sign({ userid: results.rows[0] }, config.get('jwtSecret'), { expiresIn: '48h' })
        res.status(201).json({
            status: 'success',
            data: {
                message: 'User Account Succesfully Created',
                token,
                user: results.rows[0]
            }
        })

    } catch (error) {
        res.status(500).json({
            status: 'Error',
            error: error.message
        })
    }
})

app.get('/api/v1/create-user', async (req, res, next) => {
    try {
        const response = await db.query('SELECT * FROM users');
        const user = response.rows[0]
        res.status(200).json({
            status: 'success',
            data: {
                usersId: user.userid,
                fiirstName: user.firstname,
                lastName: user.lastname,
                email: user.email,
                gender: user.gender,
                jobRole: user.jobrole,
                department: user.department,
                address: user.address

            }
        })
    } catch (error) {
        res.status(400).json({
            status: 'Error',
            error: error.message
        })
    }
});

// Login Route
app.post('/api/v1/auth/signin', async (req, res) => {

    const { email, password } = req.body;
    try {
        const userEmail = await db.query('SELECT * FROM users WHERE email=$1', [email]);
        if (!userEmail) {
            return res.status(401).json({
                error: new Error('User not found!')
            });
        }
        if (userEmail.rows.length > 0) {
            const user = userEmail.rows[0];
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                res.status(400).json({
                    msg: 'Invalid Credencials'
                })
            }
            const token = jwt.sign({ userid: user.userid }, config.get('jwtSecret'), { expiresIn: '48' })
            res.status(200).json({
                status: 'success',
                user: {
                    message: 'User Succesfully Login',
                    token,
                    userId: user.userid,
                    firstName: user.firstname,
                    lastName: user.lastname,
                    email: user.email,
                    gender: user.gender,
                    jobrole: user.jobrole,
                    department: user.department,
                    address: user.address
                }
            })
        }
    } catch (error) {
        res.status(500).json({
            status: 'Error',
            error: error.message
        })
    }
})

// Post Article Route
app.post('/api/v1/articles', async (req, res) => {
    const { createdon, title, article } = req.body;

    try {
        const results = await db.query('INSERT INTO articles(createdon,title,article) VALUES($1,$2,$3) RETURNING *', [createdon, title, article])

        res.status(201).json({
            status: 'success',
            data: {
                message: 'Article Successfully Posted',
                articles: results.rows[0]
            }
        })
    } catch (error) {
        res.status(500).json({
            status: 'Error',
            error: error.message
        })
    }
})

// Get All Articles
app.get('/api/v1/articles', async (req, res) => {
    try {
        const response = await db.query('SELECT * FROM articles');

        res.status(200).json({
            status: 'success',
            data: {
                articles: response.rows
            }
        })
    } catch (error) {
        res.status(404).json({
            status: 'Error',
            error: error.message
        })
    }
})

// Update Article
app.put('/api/v1/articles/:id', async (req, res) => {
    const { createdon, title, article } = req.body;

    try {
        const response = await db.query(`UPDATE articles SET createdon=$1, title=$2, article=$3 WHERE article_id=$4 RETURNING *`, [createdon, title, article, req.params.id]);
        const result = response.rows[0]
        res.status(200).json({
            status: "success",
            data: {
                articles: result.rows[0]
            }
        })
    } catch (error) {
        res.status(404).json({
            status: 'Error',
            error: error.message
        })
    }
})

// Delete an Article
app.delete('/api/v1/articles/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM articles WHERE article_id=$1', [req.params.id]);
        res.status(200).json({
            status: 'success'
        })
    } catch (error) {
        res.status(404).json({
            status: 'Error',
            error: error.message
        })
    }
})

// Post A comment in an Article

app.post('/api/v1/articles/:id/comment', async (req, res) => {
    const { createdon, comment } = req.body;
    try {
        const articles = await db.query('SELECT title,article FROM articles');

        const comments = await db.query('INSERT INTO comments(article_id,createdon,comment)VALUES($1,$2,$3) RETURNING *', [req.params.id, createdon, comment]);

        const commentResult = await comments.rows.result

        res.status(201).json({
            status: 'success',
            data: {
                message: 'Comment successfully Posted',
                articleTitle: articles.rows[0].title,
                article: articles.rows[0].article,
                comment: commentResult
            }
        })
    } catch (error) {
        res.status(404).json({
            status: 'Error',
            message: error.message
        })
    }

})

// Gif Route
app.post('/api/v1/gifs', upload.single('image'), async (req, res) => {
    try {
        const { title } = req.body
        const results = await cloudinary.uploader.upload(req.file.path);

        const imageUrl = results.secure_url;
        const cloudinary_id = results.public_id;

        const response = await db.query('INSERT INTO gifs(title, cloudinary_id,imageUrl) VALUES($1,$2,$3) RETURNING *', [title, cloudinary_id, imageUrl]);

        res.status(201).json({
            status: 'success',
            data: {
                message: 'Gif image Successfully Posted',
                Gifs: response.rows

            }
        })

    } catch (error) {
        res.status(500).json({
            Error: 'Error',
            message: error.message
        })
    }
})

app.get('/api/v1/gifs', async (req, res) => {
    try {
        const response = await db.query('SELECT * FROM gifs');

        res.status(200).json({
            status: 'success',
            data: {
                gifs: response.rows
            }
        })
    } catch (error) {
        res.status(500).json({
            Error: 'Error',
            message: error.message
        })
    }
})

app.put('/api/v1/gifs/:id', upload.single('image'), async (req, res) => {

    try {
        const { title, imageUrls } = req.body

        const gifs = await db.query('SELECT * FROM gifs WHERE gif_id=$1', [req.params.id])
        await cloudinary.uploader.destroy(gifs.rows[0].cloudinary_id)

        const results = await cloudinary.uploader.upload(req.file.path);

        const imageUrl = results.secure_url || imageUrls;
        const cloudinary_id = results.public_id;

        const response = await db.query('UPDATE gifs SET title=$1, cloudinary_id=$2, imageUrl=$3 WHERE gif_id=$4 RETURNING *', [title, cloudinary_id, imageUrl, req.params.id])

        res.status(200).json({
            status: 'Gifs Successfully Updated',
            data: {
                Gifs: response.rows
            }
        })
    } catch (error) {
        res.status(500).json({
            Error: 'Error',
            message: error.message
        })
    }
})

app.delete('/api/v1/gifs/:id', async (req, res) => {
    try {
        const gifs = await db.query('SELECT * FROM gifs WHERE gif_id=$1', [req.params.id])

        await cloudinary.uploader.destroy(gifs.rows[0].cloudinary_id)

        await db.query('DELETE FROM gifs WHERE gif_id=$1', [req.params.id])
        res.status(200).json({
            status: 'Gif Successfully Deleted'
        })
    } catch (error) {
        res.status(500).json({
            Error: 'Error',
            message: error.message
        })
    }
})

app.post('/api/v1/gifs/:id/comments', async (req, res) => {
    try {

    } catch (error) {
        res.status(500).json({
            Error: 'Error',
            message: error.message
        })
    }
})

app.post('/api/v1/gifs/:id/comments', async (req, res) => {
    try {

    } catch (error) {
        res.status(500).json({
            Error: 'Error',
            message: error.message
        })
    }
})

app.listen(port, () => {
    console.log(`DB connected at port ${port}`)
})

