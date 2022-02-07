import express from 'express'
import content from '../middleware/content.js'
import auth from '../middleware/auth.js'
import {
  signUp,
  login,
  signForLine,
  logout,
  extend,
  getUserInfo
} from '../controllers/users.js'

const router = express.Router()

// (路徑, function)
// 註冊
router.post('/', content('application/json'), signUp)
router.post('/login', content('application/json'), login)
router.get('/line',signForLine)
router.post('/extend', auth, extend)
router.delete('/logout', auth, logout)
router.get('/me', auth, getUserInfo)


export default router
