
const db = require('../db');

exports.postArticle = async (req, res) => {
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
}

exports.getAllArticle = async (req, res) => {
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
}

exports.updateArticle = async (req, res) => {
    const { createdon, title, article } = req.body;

    try {
        const response = await db.query(`Update articles SET createdon=$1, title=$2, article=$3 WHERE articleid=$4 RETURNING *`, [createdon, title, article, req.params.id]);
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
}

exports.deleteArticle = async (req, res) => {
    try {
        await db.query('DELETE FROM articles WHERE articleid=$1', [req.params.id]);
        res.status(200).json({
            status: 'success'
        })
    } catch (error) {
        res.status(404).json({
            status: 'Error',
            error: error.message
        })
    }
}