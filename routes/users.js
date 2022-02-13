import express from 'express'
import content from '../middleware/content.js'
import auth from '../middleware/auth.js'
import {
  signUp,
  login,
  logout,
  signInLine,
  signInLineData,
  getUsers,
  getUserInfo,
  extend
} from '../controllers/users.js'

const router = express.Router()

// (路徑, function)
// 註冊
router.post('/', signUp)
router.get('/line', signInLine)
router.post('/login', content('application/json'), login)
router.delete('/logout', auth, logout)
router.get('/signInLineData', signInLineData)
router.get('/all', auth, getUsers)
router.get('/me', auth, getUserInfo)
router.post('/extend', auth, extend)

export default router
