import jwt from 'jsonwebtoken'
import users from '../models/users.js'

export default async (req, res, next) => {
  try {
    // 短路求值+可選串連，如果是undefined就會是下一個
    const token = req.headers.authorization?.replace('Bearer ', '') || ''
    if (token.length > 0) {
      const decoded = jwt.decode(token)
      // 去資料庫找有沒有這個使用者
      req.user = await users.findOne({ _id: decoded._id, tokens: token })
      req.token = token
      if (req.user) {
        jwt.verify(token, process.env.SECRET)
        next()
      } else {
        throw new Error()
      }
    } else {
      throw new Error()
    }
  } catch (error) {
    console.log(error)
    if (error.name === 'TokenExpiredError' && req.baseUrl === '/users' && req.path === '/extend') {
      next()
    } else {
      console.log(error)
      res.status(401).send({ success: false, message: '驗證錯誤' })
    }
  }
}
