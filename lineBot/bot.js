
import linebot from 'linebot'
import dotenv from 'dotenv'

dotenv.config()
const bot = linebot({
  channelId: process.env.CHANNEL_ID_BOT,
  channelSecret: process.env.CHANNEL_SECRET_BOT,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN_BOT
})

bot.on('message', async event => {
  if (event.type === 'text') {
    try {
      if (event.message.type === '有客製化需求') {
        event.reply('請加入客製化需求的小幫手').then(
          setTimeout(function () {
            bot.push(event.source.userId, '感謝您的耐心等候，現在已有空位，歡迎您的蒞臨')
          }, 60000)
        )
      }
    } catch (error) {
      console.log()
    }
  }
})

bot.on('message', async (event) => {
  if (event.message.type === 'text') {
    if (event.message.text === '咖啡廳') {
      location(event)
    } else if (event.message.text === '使用說明') {
      event.reply('Hello🖖 \n歡迎使用此機器人服務\r\r以下為您提供兩種功能：\n◎傳送位置：尋找附近的咖啡廳打發時間，提供距離最近的五家咖啡廳（五公里內）🤗 \r\r◎下方三個問號：\n提供\n➤ 雙北\n➤ 臺中\n➤ 臺南\n這三地區的“隨機咖啡廳”\n很多時候沒有目標的前往\n反而有意想不到的驚喜唷🌟')
    } else { (city(event)) }
  } else if (event.message.type === 'location') {
    place(event)
  }
})

export default bot