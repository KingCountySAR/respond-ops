import { readFile } from 'fs/promises'
import { Db, ObjectId, OptionalId } from 'mongodb'
import { resolve } from 'path'

function hydrateId(_id: string|undefined|{ '$oid': string}|ObjectId) {
  if (typeof _id === 'string') {
    if (_id.length === 24) return new ObjectId(_id)
    return new ObjectId()
  } else if (!_id) {
    return new ObjectId()
  } else if (_id instanceof ObjectId) {
    return _id
  }
  return new ObjectId(_id.$oid)
}

function resetObjectIds<T>(list: Array<OptionalId<T>>) {
  return list.map(f => ({ ...f, _id: hydrateId(f._id)}))
}

export async function loadTestData(db: Db, dataPath: string) {
  const fullPath = resolve(__dirname, '../../test-data', dataPath)
  const raw = await readFile(fullPath, 'utf-8')
  const data = JSON.parse(raw)
  await db.collection('organizations').insertMany(resetObjectIds(data.organizations))
  await db.collection('activities').insertMany(resetObjectIds(data.activities))
}

export async function loadStandardData(db: Db) {
  return loadTestData(db, 'standard-test-set.json')
}