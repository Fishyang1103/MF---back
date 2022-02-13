import multer from 'multer'
import 'dotenv/config'
// 引用上傳平台
import { v2 as cloudinary } from 'cloudinary'
// 上傳套件與上傳平台連結
import { CloudinaryStorage } from 'multer-storage-cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
})

const upload = multer({
  storage: new CloudinaryStorage({ cloudinary }),
  // 限制檔案類型
  fileFilter (req, file, cb) {
    if (!file.mimetype.includes('image')) {
      // 觸發自訂的 LIMIT_FILE_FORMAT 錯誤
      cb(new multer.MulterError('LIMIT_FILE_FOTMAT'), false)
    } else {
      cb(null, true)
    }
  },
  limits: {
    // 限制檔案1MB
    fileSize: 1024 * 1024
  }
})

export default async (req, res, next) => {
  upload.single('image')(req, res, async error => {
    // 是否為上傳錯誤
    if (error instanceof multer.MulterError) {
      let message = '上傳錯誤'
      if (error.code === 'LIMIT_FILE_FOTMAT') {
        message = '格式錯誤'
      } else if (error.code === 'LIMIT_FILE_SIZE') {
        message = '檔案太大'
      }
      res.status(400).send({ success: false, message })
    } else if (error) {
      console.log('uploaderror')
      res.status(500).send({ success: false, message: '伺服器錯誤' })
      console.log(error)
    } else {
      next()
    }
  })
}