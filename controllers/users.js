import users from '../models/users.js'
import products from '../models/products.js'
import jwt from 'jsonwebtoken'
import axios from 'axios'
import Qs from 'qs'
// 展開 [object Object] 套件
import { inspect } from 'util' 
import md5 from 'md5'

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
    console.log(123)
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

// logout = 登出
export const logout = async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => token.jwt !== req.token)
    req.user.save({ validateBeforeSave: false })
    res.status(200).send({
      success: true,
      message: ''
    })
  } catch (error) {
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}



// line 登入
export const signInLine = async (req, res) => {
  console.log(1)
  try {
    console.log(2)
    //  Qs 將回傳的 JSON 轉 form-urlencoded 格式， line 才可以接收資料
    const options = Qs.stringify({
      grant_type: 'authorization_code',
      code: req.query.code,
      redirect_uri: process.env.CALLBACK_URL,
      client_id: process.env.CHANNEL_ID,
      client_secret: process.env.CHANNEL_SECRET
    })
    console.log(3)
    // 跟 line 請求 使用者資料
    const { data } = await axios.post('https://api.line.me/oauth2/v2.1/token', options, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

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
    console.log('signInLine result :' + inspect({ result }))
    console.log(2)
  } catch (error) {
    console.log(error)
    res.status(500).send({
      success: false,
      message: '伺服器錯誤'
    })
  }
  console.log('signInLine Line登入')
}
// Line登入換資料
export const signInLineData = async (req, res) => {
  try {
    const token = req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : ''
    if (token.length > 0) {
      const decoded = jwt.verify(token, process.env.SECRET)
      const _id = decoded._id
      req.user = await users.findOne({ _id })
      console.log(req.user.name)

      res.status(200).send({
        success: true,
        message: '登入成功',
        token: token,
        name: req.user.name,
        account: req.user.name,
        avatar: req.user.avatar,
        role: req.user.role,
        cart: req.user.cart
      })
    } else {
      throw new Error()
    }
  } catch (error) {
    console.log(error)
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

// 舊換新 token
export const extend = async (req, res) => {
  try {
    // 先去找傳進來的 token 是符合使用者資料庫裡的第幾個
    const idx = req.user.tokens.findIndex(token => req.token)
    // 簽發驗證序號 有效期為7天
    const token = jwt.sign(
      // jwt 內容資料
      { _id: req.user._id.toString() },
      // 加密用的key
      process.env.SECRET,
      // jwt 設定有效期
      { expiresIn: '7 days' }
    )
    console.log(token)
    // 將新 token 替換原本的
    req.user.tokens[idx] = token
    // 標記陣列文字已修改過，不然不會更新
    req.user.markModified('tokens')
    // 儲存之前不驗證就存入
    req.user.save({ validateBeforeSave: false })
    // 把序號存入使用者資料
    req.user.tokens.push({ jwt: token })
    res.status(200).send({
      success: true,
      message: '登入成功',
      result: token
    })
  } catch (error) {
    res.status(500).send({
      success: false,
      message: '伺服器錯誤'
    })
  }
  console.log('extend 更新 token')
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

// 新增購物車
export const addCart = async (req, res) => {
  try {
    // 先去購物車找有沒有這個商品
    // product格式是objectid，toString轉成一般文字才可以用三個等於
    const idx = req.user.cart.findIndex(item => item.product.toString() === req.body.product)
    if (idx > -1) {
      // 如果已經有這個商品，就增加數量
      req.user.cart[idx].quantity += req.body.quantity
    } else {
      // 去資料庫找商品
      const result = await products.findById(req.body.product)
      // 如果找不到或沒上架
      if (!result || !result.sell) {
        res.status(404).send({ success: false, message: '商品不存在' })
        return
      }
      // 有找到就push
      req.user.cart.push(req.body)
    }
    await req.user.save()
    res.status(200).send({ success: true, message: '', result: req.user.cart.length })
  } catch (error) {
    if (error.name === 'CastError') {
      res.status(404).send({ success: false, message: '找不到' })
    } else if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      res.status(400).send({ success: false, message: error.errors[key].message })
    } else {
      res.status(500).send({ success: false, message: '伺服器錯誤' })
    }
  }
}

// 取得購物車
export const getCart = async (req, res) => {
  try {
    // .populate -> 會自動把 ref 的東西放進來
    const { cart } = await users.findById(req.user._id, 'cart').populate('cart.product')
    res.status(200).send({ success: true, message: '', result: cart })
  } catch (error) {
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}

// 編輯購物車
export const updateCart = async (req, res) => {
  try {
    // 如果數量是 0 就從購物車刪除
    if (req.body.quantity === 0) {
      // mongoDB 修改的語法
      // await users.findByIdAndUpdate(req.user._id,
      //   {
      //     $pull: {
      //       cart: { product: req.body.product }
      //     }
      //   }
      // )
      const idx = req.user.cart.findIndex(item => item.product.toString() === req.body.product)
      if (idx > -1) {
        req.user.cart.splice(idx, 1)
      }
      await req.user.save()
      res.status(200).send({ success: true, message: '' })
    } else {
      // await users.findOneAndUpdate(
      //   { _id: req.user._id, 'cart.product': req.body.product },
      //   {
      //     $set: {
      //       'cart.$.quantity': req.body.quantity
      //     }
      //   }
      // )
      const idx = req.user.cart.findIndex(item => item.product.toString() === req.body.product)
      if (idx > -1) {
        req.user.cart[idx].quantity = req.body.quantity
      }
      await req.user.save()
      res.status(200).send({ success: true, message: '' })
    }
  } catch (error) {
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}