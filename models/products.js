import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '商品名不能為空']
  },
  price: {
    type: Number,
    min: [1, '價格不得低於1'],
    required: [true, '價格不得為空']
  },
  description: {
    type: String
  },
  image: {
    type: String
  },
  // 商品是否上架
  sell: {
    type: Boolean,
    default: false
  },
  // 商品分類
  category: {
    type: String,
    enum: {
      values: ['經典鮮花', '蘭花盆景', '鮮花盆花', '綠意盎然'],
      message: '商品分類不存在'
    }
  }
}, { versionKey: false })

export default mongoose.model('products', productSchema)
