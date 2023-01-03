/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} phoneNumber
 * @property {string} address
 * @property {string} avatarUrl
 * @property {Date} dateOfBirth
 * @property {string} citizenNumber
 * @property {string[]} sosNumbers
 * @property {Date} lastSignInAt
 * @property {string[]} fcmTokens
 * @property {Date} createdAt
 */

/**
 * @typedef {Object} UserNotification
 * @property {string} id
 * @property {string} title
 * @property {string} content
 * @property {number} type
 * @property {string} userId
 * @property {string} deviceId
 * @property {boolean} isRead
 * @property {Date} createdAt
 */

/**
 * @typedef {Object} DeviceConfig
 * @property {boolean} antiTheft
 */

/**
 * @typedef {Object} DeviceProperties
 * @property {Date} lastMakeCallTime
 * @property {Date} lastSendSmsTime
 * @property {string} lastPushNotificationTime
 */

/**
 * @typedef {Object} DeviceLocation
 * @property {number} latitude
 * @property {number} longitude
 * @property {Date} createdAt
 */

/**
 * @typedef {Object} Device
 * @property {string} id
 * @property {string} name
 * @property {string} verificationCode
 * @property {string} userId
 * @property {Vehicle} vehicle
 * @property {DeviceConfig} config
 * @property {DeviceStatus} status
 * @property {DeviceProperties} properties
 * @property {DeviceLocation[]} locations
 * @property {Date} createdAt
 */

/**
 * @typedef {Object} Vehicle
 * @property {string} name
 * @property {string} brand
 * @property {string} model
 * @property {string} color
 * @property {string} licensePlate
 * @property {string} photoUrl
 * @property {string} deviceId
 * @property {Date} createdAt
 */

/**
 * @typedef {Enumerator} DeviceStatus
 * @property {number} NONE - 0
 * @property {number} FALL - 1
 * @property {number} CRASH - 2
 * @property {number} LOST1 - 3
 * @property {number} LOST2 - 4
 * @property {number} SOS - 5
 */

/**
 * @typedef {Object} ReceivedLocationData
 * @property {string} deviceId
 * @property {number[]} location
 * @property {DeviceStatus} status
 * @property {boolean} antiTheft
 */
