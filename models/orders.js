import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.ObjectId,
    ref: 'users'
  },
  userInfo: {
    name: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: '',
      validator: {
        validator (phone) {
          if (phone.length === 0) return true
          return validator.isMobilePhone(phone, 'zh-TW')
        }
      }
    },
    address: {
      type: String,
      default: ''
    },
    courier: {
      type: String,
      enum: {
        values: ['宅配', '自取']
      }
    },
    payment: {
      type: String,
      enum: {
        values: ['貨到付款', 'ATM轉帳']
      }
    },
    remark: {
      type: String,
      default: ''
    },
  },
  products: {
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
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { versionKey: false })

export default mongoose.model('orders', orderSchema)
