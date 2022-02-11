import dotenv from 'dotenv' // 讀取環境設定檔
// 網頁伺服器
import express from 'express'
import mongoose from 'mongoose'
// 允許前端可傳送跨域請求
import cors from 'cors'
// 引入使用者的router
import usersRouter from './routes/users.js'
// 轉換line格式
import Qs from 'qs'
import axios from 'axios'
import jwt from 'jsonwebtoken'

dotenv.config()

mongoose.connect(process.env.DB_URL, () => {
  console.log('MongoDB Connected')
})

const app = express()

// 設定前端來的跨域請求
app.use(cors({
  origin (origin, callback) {
    // undefined-->這邊表postman
    // 如果是下面三個就允許
    if (origin === undefined || origin.includes('github') || origin.includes('localhost')) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed'), false)
    }
  }
}))

// cors 的錯誤
// 四個參數表處理錯誤的 middleware
// 三個是一般的 middleware
app.use((_, req, res, next) => {
  res.status(403).send({ success: false, message: '請求被拒絕' })
})

// json 的錯誤
app.use(express.json())
app.use((_, req, res, next) => {
  res.status(400).send({ success: false, message: '資料格式錯誤' })
})

app.use('/users', usersRouter)

app.all('*', (req, res) => {
  res.status(404).send({ success: false, message: '找不到嗚嗚' })
})

app.listen(process.env.PORT || 3000, () => {
  console.log('Server Started')
})
