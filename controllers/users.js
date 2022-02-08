import users from '../models/users.js'
import Qs from 'qs'
import axios from 'axios'
import md5 from 'md5'
import jwt from 'jsonwebtoken'
// 展開 [object Object] 套件
import { inspect } from 'util' 

// signup = 註冊
export const signUp = async (req, res) => {
  try {
    await users.create(req.body)
    res.status(200).send({ success: true, message: '' })
  } catch (error) {
    // 如果錯誤訊息是驗證錯誤
    // 錯誤的訊息的 key 值為欄位名稱，不固定
    // 用 Object.keys 取第一個驗證錯誤
    if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      res.status(400).send({ success: false, message: error.errors[key].message })
      // 如果錯誤訊息是Mongo錯誤 且 錯誤編號是 11000 (重複)
    } else if (error.name === 'MongoServerError' && error.code === 11000) {
      res.status(400).send({ success: false, message: '帳號已存在' })
    } else {
      res.status(500).send({ success: false, message: '伺服器錯誤' })
    }
  }
}

// login = 登入
export const login = async (req, res) => {
  try {
    const user = await users.findOne(
      { account: req.body.account, password: md5(req.body.password) },
      '-password'
    )
    if (user) {
      const token = jwt.sign({ _id: user._id.toString() }, process.env.SECRET, { expiresIn: '7 days' })
      user.tokens.push(token)
      await user.save()
      const result = user.toObject()
      delete result.tokens
      result.token = token
      result.cart = result.cart.length
      res.status(200).send({ success: true, message: '', result })
    } else {
      res.status(404).send({ success: false, message: '帳號或密碼錯誤' })
    }
  } catch (error) {
    console.log(error)
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}

// line 登入
export const signForLine = async (req, res) => {
  try {
    //  Qs 將回傳的 JSON 轉 form-urlencoded 格式， line 才可以接收資料
    const options = Qs.stringify({
      grant_type: 'authorization_code',
      code: req.query.code,
      redirect_uri: process.env.CALLBACK_URL,
      client_id: process.env.CHANNEL_ID,
      client_secret: process.env.CHANNEL_SECRET
    })
    // 跟 line 請求 使用者資料
    const { data } = await axios.post('https://api.line.me/oauth2/v2.1/token', options, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    //   "access_token": "" 有效期間為 30 天的 Access token。
    //   "expires_in": "" 過期之前的秒數。
    //   "token_type": "Bearer"
    //   "refresh_token": "" 取得新的 Access token，所需要的 Token。
    //   "scope": "openid profile" 使用者提供的權限
    //   "id_token": "" 包含用戶資訊的 JWT (Scopes 需有 openid)

     // 解析回傳的 id_Token
    const decoded = jwt.decode(data.id_token)
   // 查詢是否有使用者資料有這個 line UserID (sub) 紀錄的 lineID ，順便寫入資料庫 line 欄位裡以便後續使用
    let result = await users.findOne({ line: decoded.sub })
    if (result === null) {
     // 如果是新使用者，就創建一個新帳號
      result = await users.create({ line: decoded.sub })
    }

    // 重新簽發一個我的 jwt
    const myjwt = jwt.sign(
     // jwt 內容資料
      { _id: result._id.toString() },
     // 加密用的key
      process.env.SECRET,
     // jwt 設定有效期為7天
      { expiresIn: '7 days' }
    )

    result.avatar = decoded.picture
    result.name = decoded.name
    result.account = decoded.name

    // 把序號存入使用者資料
    result.tokens.push(myjwt)
    // 儲存之前不驗證就存入
    result.save({ validateBeforeSave: false })
    // 重新將請求導回前台
    res.redirect(process.env.FRONT_URL + '?jwt=' + myjwt)

    console.log('signForLine result :' + inspect({ result }))
 } catch (error) {
   console.log(error)
   res.status(500).send({
     success: false,
     message: '伺服器錯誤'
   })
 }
}

// Line登入換資料
export const signInLineData = async (req, res) => {
  try {
    // 從 header 驗證取出 jwt，將 Bearer Token 取代成 Token
    const token = req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : ''
    // 如果有 jwt
    if (token.length > 0) {
    // 解碼 jwt
      const decoded = jwt.verify(token, process.env.SECRET)
      console.log(decoded)
      // 取出裡面紀錄的使用者 id
      const _id = decoded._id
      // 查詢是否有使用者資料有 jwt 紀錄的 _id
      req.user = await users.findOne({ _id })
      console.log(req.user.name)

      res.status(200).send({
        success: true,
        message: '登入成功',
        token: token,
        name: req.user.name,
        account: req.user.name,
        avatar: req.user.avatar,
        role: req.user.role
      })
    } else {
    // 沒有 jwt，觸發錯誤，讓程式進 catch
      throw new Error()
    }
  } catch (error) {
    console.log(error)
    // .send() 送資料出去
    res.status(401).send({
      success: false,
      message: error
    })
  }
  console.log('signInLineData Line登入換資料')
}

// getUsers 取得"所有使用者"資料  /  GET http://localhost:xx/users
export const getUsers = async (req, res) => {
  // 驗證權限是否為管理員
  if (req.user.role !== 1) {
    res.status(403).send({
      success: false,
      message: '沒有權限'
    })
    // 驗證沒過就不跑接下來的程式，也可以後面都用 else 包起來
    return
  }
  try {
    // 尋找所有使用者
    const result = await users.find()
    res.status(200).send({
      success: true,
      message: '',
      result
    })
  } catch (error) {
    res.status(500).send({
      success: false,
      message: '伺服器錯誤'
    })
  }
  console.log('getUsers 取得所有使用者資料')
}

// getUserInfo 抓取使用者資料
export const getUserInfo = async (req, res) => {
  try {
    res.status(200).send({
      success: true,
      message: '',
      result: {
        account: req.user.account,
        name: req.user.name,
        role: req.user.role,
        avatar: req.user.avatar,
        cart: req.user.cart
      }
    })
  } catch (error) {
    res.status(500).send({
      success: false,
      message: '伺服器錯誤'
    })
  }
  console.log('getUserInfo 抓取使用者資料')
}

// logout = 登出
export const logout = async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => token !== req.token)
    await req.user.save()
    res.status(200).send({ success: true, message: '' })
  } catch (error) {
    res.status(500).send({ success: false, message: '伺服器錯誤' })
    console.log(error)
  }
}

// 舊換新 token
export const extend = async (req, res) => {
  try {
    const idx = req.user.tokens.findIndex(token => token === req.token)
    const token = jwt.sign({ _id: req.user._id.toString() }, process.env.SECRET, { expiresIn: '7 days' })
    req.user.tokens[idx] = token
    req.user.markModified('tokens')
    await req.user.save()
    res.status(200).send({ success: true, message: '', result: { token } })
  } catch (error) {
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}
