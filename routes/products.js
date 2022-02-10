import express from 'express'
import content from '../middleware/content.js'
import auth from '../middleware/auth.js'
import admin from '../middleware/admin.js'

const router = express.Router()

// (路徑, function)
// 註冊
router.post('/', auth, admin, content('application/json'), create)

export default router
