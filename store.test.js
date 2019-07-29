const MongoMemoryServer = require('mongodb-memory-server-core').MongoMemoryServer
const MongoClient = require('mongodb').MongoClient
const store = require('./store')

beforeAll(async () => {
  mongoServer = new MongoMemoryServer({
    instance: {port: 37017, dbName: 'db'},
    binary: {version: '4.2.0-rc4'}
  })
  const mongoUri = await mongoServer.getConnectionString()
  con = await MongoClient.connect(mongoUri, { useNewUrlParser: true })
  db = con.db(await mongoServer.getDbName())
})

afterAll(async () => {
  if (con) con.close()
  if (mongoServer) await mongoServer.stop()
})

describe('Single mongoServer', () => {
  it('should start mongo server', async () => {
    expect(db).toBeDefined()
    const col = db.collection('test')
    const result = await col.insertMany([{ a: 1 }, { b: 1 }])
    expect(await col.countDocuments({})).toBe(2)
  })

  it('should get URI of specified DB name', async () => {
    expect(await mongoServer.getUri('dumb')).toBe('mongodb://127.0.0.1:37017/dumb')
  })
})
