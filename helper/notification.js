require('dotenv').config();

const FCM = require('fcm-node')

exports.sendNotification = (deviceToken, messageBody) => {
  const serverKey = process.env.FCM_SERVER_KEY
  const fcm = new FCM(serverKey)
  const message = {
    to: deviceToken,
    collapse_key: 'TEST',
    notification: {
      title: 'Test',
      body: messageBody,
      sound: 'ping.aiff',
      delivery_receipt_requested: true
    },
    data: {
      message: messageBody
    }
  }
  fcm.send(message)
}