import orders from '../models/orders.js'
import users from '../models/users.js'
// import bot from '../lineBot/bot.js'

// 結帳
export const checkout = async (req, res) => {
  try {
    if (req.user.cart.length === 0) {
      res.status(400).send({ success: false, message: '購物車是空的' })
      return
    }
    const hasNotSell = await users.aggregate([
      {
        $match: {
          _id: req.user._id
        }
      },
      {
        $project: {
          'cart.product': 1
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'cart.product',
          foreignField: '_id',
          as: 'cart.product'
        }
      },
      {
        $match: {
          'cart.product.sell': false
        }
      }
    ])

    if (hasNotSell.length > 0) {
      res.status(400).send({ success: false, message: '包含下架商品' })
      return
    }
    const result = await orders.create({ user: req.user._id, userInfo:req.body ,products: req.user.cart })
    if (req.file) {
      result.userInfo.image = req.file.path
      await result.save()
    }
    // 清空購物車
    req.user.cart = []
    await req.user.save()
    res.status(200).send({ success: true, message: '', result})
  } catch (error) {
    if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      res.status(400).send({ success: false, message: error.errors[key].message })
    } else {
      res.status(500).send({ success: false, message: '伺服器錯誤' })
    }
  }
}

// 使用者自己的訂單
export const getMyOrders = async (req, res) => {
  try {
    const result = await orders.find({ user: req.user._id }).populate('products.product')
    res.status(200).send({ success: true, message: '', result })
  } catch (error) {
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}

// 管理者看全部的訂單
export const getAllOrders = async (req, res) => {
  try {
    // populate('user', 'account') --> ('models 的 ref 的路徑','欄位')
    const result = await orders.find().populate('user', 'account').populate('products.product')
    res.status(200).send({ success: true, message: '', result })
  } catch (error) {
    res.status(500).send({ success: false, message: '伺服器錯誤123' })
    console.log(error)
  }
}
// 更改訂單狀態
export const changeOrder = async (req, res) => {
  const data = {
    orderState: req.body.orderState
  }
  try {
    const result = await orders.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true })
    res.status(200).send({ success: true, message: '', result })
    // const user = await users.findById(result.user)
    // bot.push(user.line, `訂單 ${result._id} 已出貨`)
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