import express from 'express'
import content from '../middleware/content.js'
import auth from '../middleware/auth.js'
import admin from '../middleware/admin.js'
import {
  checkout,
  getMyOrders,
  getAllOrders
} from '../controllers/order.js'

const router = express.Router()

// (路徑, function)
// 結帳
router.post('/', auth, content('application/json'), checkout)
// 使用者自己的訂單
router.get('/me', auth, getMyOrders)
// 管理者看全部的訂單
router.get('/all', auth, admin, getAllOrders)


export default router
