console.log('source dev db attributes')
module.exports = {
  db: {
    connector: 'mongodb',
    hostname: process.env.DATABASE_SERVICE_NAME || 'localhost',
    port: process.env.DB_PORT || 27017,
    user: process.env.MONGODB_USER,
    password: process.env.MONGODB_PASSWORD,
    database: process.env.MONGODB_DATABASE || 'notify-bc'
  }
}