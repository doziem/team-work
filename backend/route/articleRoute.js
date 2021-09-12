const router = require('express').Router

const { postArticle, updateArticle, getAllArticle, deleteArticle } = require('../controller/articleController')

router.get('/', getAllArticle)
router.post('/', postArticle)
router.put('/:id', updateArticle)
router.delete('/:id', deleteArticle)



module.exports = router