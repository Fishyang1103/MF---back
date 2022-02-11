// 讀取傳進來的檔案
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
})

const upload = multer({
  storage: new CloudinaryStorage({ cloudinary }),
  fileFilter (req, file, cb) {
    if (!file.mimetype.includes('image')) {
      cb(new multer.MulterError('LIMIT_FORMAT'), false)
    } else {
      // 允許檔案過去
      cb(null, true)
    }
  },
  // 限制檔案大小
  limits: {
    fileSize: 1024 * 1024
  }
})

export default async (req, res, next) => {
  // 單檔上傳
  upload.single('image')(req, res, async error => {
    if (error instanceof multer.MulterError) {
      let message = '上傳錯誤'
      if (error.code === 'LIMIT_FILE_SIZE') {
        message = '檔案太大'
      } else if (error.code === 'LIMIT_FORMAT') {
        message = '上傳錯誤'
      }
      res.stauts(400).send({ success: false, message })
    } else if (error) {
      res.stauts(500).send({ success: false, message: '伺服器錯誤' })
    } else {
      next()
    }
  })
}
