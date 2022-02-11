import express from 'express'
import content from '../middleware/content.js'
import auth from '../middleware/auth.js'
import admin from '../middleware/admin.js'
import upload from '../middleware/upload.js'
import {
  create,
  getProducts,
  getAllProducts,
  getProductById
} from '../controllers/products.js'

const router = express.Router()

// (路徑, function)
// 註冊
// 先驗證有沒有登入->是不是管理員->驗證資料格式->接收傳進來的東西->create
router.post('/', auth, admin, content('multipart/form-data'), upload, create)
// 只有前台出現的商品
router.get('/', getProducts)
// 全部商品包含下架的(只有管理員可看)
router.get('/all', auth, admin, getAllProducts)
// 單個商品
router.get('/:id', getProductById)

export default router
