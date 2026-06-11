import { mkdirSync, writeFileSync } from 'fs'
import { MongoClient } from 'mongodb'
import { resolve } from 'path'

async function main() {
  const [connectionString, outputDir] = process.argv.slice(2)
  if (!connectionString || !outputDir) {
    console.error('Usage: npm run dump -- <mongodb-uri> <output-dir>')
    process.exit(1)
  }

  const outputPath = resolve(process.cwd(), outputDir)
  mkdirSync(outputPath, { recursive: true })

  const client = new MongoClient(connectionString)
  try {
    await client.connect()
    const db = client.db()
    const collections = await db.listCollections().toArray()

    for (const { name } of collections) {
      if (['socketAuth'].includes(name)) continue
      const docs = await db.collection(name).find({}).toArray()
      const json = JSON.stringify(docs, null, 2)
        .split(String.fromCharCode(0x2028)).join('\\\\u2028')
        .split(String.fromCharCode(0x2029)).join('\\\\u2029')
      writeFileSync(`${outputPath}/${name}.json`, json)
      console.log(`  ${name}: ${docs.length} documents`)
    }
  } finally {
    await client.close()
  }
}

main().catch(err => { console.error(err); process.exit(1) })
