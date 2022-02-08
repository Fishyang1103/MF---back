// MongoDB 操作套件
import mongoose from 'mongoose'
// 加密套件
import md5 from 'md5'
// 驗證套件
// import validator from 'validator'

const userSchema = new mongoose.Schema({
  account: {
    type: String,
    default: ''
    // minlength: [4, '帳號必須 4 個字以上'],
    // maxlength: [15, '帳號最多 15 個字'],
    // 不可重複
    // unique: true,
    // required: [true, '帳號不能為空']
  },
  password: {
    type: String,
    default: ''
    // required: [true, '密碼不能為空']
  },
  role: {
    // 0 一般會員
    // 1 管理員
    type: Number,
    // 預設是一般會員
    default: 0
  },
  tokens: {
    type: [String]
  },
  cart: {
    type: [
      {
        product: {
          type: mongoose.ObjectId,
          ref: 'products',
          required: [true, '缺少商品 ID']
        },
        quantity: {
          type: Number,
          required: [true, '缺少商品數量']
        }
      }
    ]
  }
  // 不要存改了幾次
}, { versionKey: false })

// md5 加密使用者送出的密碼
userSchema.pre('save', function (next) {
  const user = this
  if (user.isModified('password')) {
    if (user.password.length >= 4 && user.password.length <= 15) {
      user.password = md5(user.password)
    } else {
      const error = new mongoose.Error.ValidationError(null)
      error.addError('password', new mongoose.Error.ValidatorError({ message: '密碼長度錯誤' }))
      next(error)
      return
    }
  }
  next()
})

userSchema.pre('findOneAndUpdate', function (next) {
  const user = this._update
  if (user.password) {
    if (user.password.length >= 4 && user.password.length <= 15) {
      user.password = md5(user.password)
    } else {
      const error = new mongoose.Error.ValidationError(null)
      error.addError('password', new mongoose.Error.ValidatorError({ message: '密碼長度錯誤' }))
      next(error)
      return
    }
  }
  next()
})

export default mongoose.model('users', userSchema)
