const MongoMemoryServer = require('mongodb-memory-server-core').MongoMemoryServer
const MongoClient = require('mongodb').MongoClient
const store = require('./store')

beforeAll(async () => {
  mongoServer = new MongoMemoryServer({binary: {version: '4.2.0-rc4'}})
  const mongoUri = await mongoServer.getConnectionString()
  con = await MongoClient.connect(mongoUri, {useNewUrlParser: true})
  const db = con.db(await mongoServer.getDbName())
  model = store.GameModel(db.collection('games'))
})

afterAll(async () => {
  if (con) con.close()
  if (mongoServer) await mongoServer.stop()
})

describe('Mongo store', () => {
  it('should initialize model', () => {
    expect(model).toBeDefined()
  })
})
