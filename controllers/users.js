import users from '../models/users.js'
// import Qs from 'qs'
// import axios from 'axios'
import md5 from 'md5'
import jwt from 'jsonwebtoken'

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

    console.log(options)
    // 跟 line 請求 使用者資料
    const { data } = await axios.post('https://api.line.me/oauth2/v2.1/token', options, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    const decoded = jwt.decode(data.id_token)
    // res.send(decoded)
    // res.redirect('https://google.com')
  } catch (error) {
    console.log(error.response.body)
  }
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

// 使用者拿 jwt 換資料
export const getUserInfo = (req, res) => {
  try {
    const result = req.user.toObject()
    delete result.tokens
    result.cart = result.cart.length
    res.status(200).send({ success: true, message: '', result })
  } catch (error) {
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}
// export const signForLine = ('/line', async (req, res) => {
//   try {
//     //  Qs 將回傳的 JSON 轉 form-urlencoded 格式， line 才可以接收資料
//     const options = Qs.stringify({
//       grant_type: 'authorization_code',
//       code: req.query.code,
//       redirect_uri: process.env.CALLBACK_URL,
//       client_id: process.env.CHANNEL_ID,
//       client_secret: process.env.CHANNEL_SECRET
//     })

//     console.log(options)
//     // 跟 line 請求 使用者資料
//     const { data } = await axios.post('https://api.line.me/oauth2/v2.1/token', options, {
//       headers: {
//         'Content-Type': 'application/x-www-form-urlencoded'
//       }
//     })
//     const decoded = jwt.decode(data.id_token)
//     // res.send(decoded)
//     res.redirect('https://google.com')
//   } catch (error) {
//     console.log(error.response.body)
//   }
// })
