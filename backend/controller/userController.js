const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const config = require('config');

require('dotenv').config()


const db = require('../db');


exports.createUser = async (req, res, next) => {
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
}

exports.getAllUsers = async (req, res, next) => {
    try {
        const response = await db.query('SELECT * FROM users');
        res.status(200).json({
            status: 'success',
            data: {
                users: response.rows
            }
        })
    } catch (error) {
        res.status(400).json({
            status: 'Error',
            error: error.message
        })
    }
}

exports.loginUser = async (req, res) => {

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
}