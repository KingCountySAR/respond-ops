import { Db, MongoClient } from 'mongodb'
import { MongoMemoryServer } from 'mongodb-memory-server'

let mongod: MongoMemoryServer
let mongodb: MongoClient
let testDb: Db

// Start server and connect before all tests
beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  const uri = mongod.getUri()
  mongodb = new MongoClient(uri)
  await mongodb.connect()
  testDb = mongodb.db()
})

afterAll(async () => {
  const db = getTestDb()
  const collections = await db.collections()
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
})

// Disconnect and stop after all tests
afterAll(async () => {
  await mongodb.close()
  await mongod.stop()
})

export const getTestDb = () => testDb