import express from 'express'
import content from '../middleware/content.js'
import auth from '../middleware/auth.js'
import {
  signUp,
  login,
  logout,
  signInLine,
  signInLineData,
  extend,
  getUsers,
  getUserInfo,
  addCart,
  getCart,
  updateCart
} from '../controllers/users.js'

const router = express.Router()

// (路徑, function)
// 註冊
router.post('/', signUp)
router.get('/line', signInLine)
router.post('/login', content('application/json'), login)
router.delete('/logout', auth, logout)
router.get('/signInLineData', signInLineData)
router.post('/extend', auth, extend)
router.get('/all', auth, getUsers)
router.get('/me', auth, getUserInfo)
router.post('/me/cart', auth, addCart)
router.get('/me/cart', auth, getCart)
router.patch('/me/cart', auth, updateCart)


export default router
