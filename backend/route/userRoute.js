const router = require('express').Router;

const { createUser, getAllUsers, loginUser } = require('../controller/userController')

router.post('/user', createUser)
router.post('/login', loginUser)
router.get('/user', getAllUsers)


module.exports = router




