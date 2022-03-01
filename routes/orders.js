import express from 'express'
import content from '../middleware/content.js'
import auth from '../middleware/auth.js'
import admin from '../middleware/admin.js'
import upload from '../middleware/upload.js'
import {
  checkout,
  getMyOrders,
  getAllOrders,
  changeOrder
} from '../controllers/order.js'


const router = express.Router()

// (路徑, function)
// 結帳
router.post('/', auth, content('multipart/form-data'), upload, checkout)
// 使用者自己的訂單
router.get('/me', auth, getMyOrders)
// 管理者看全部的訂單
router.get('/all', auth, admin, getAllOrders)
// 更改訂單狀態
router.patch('/:id', auth, admin, changeOrder)

export default router
