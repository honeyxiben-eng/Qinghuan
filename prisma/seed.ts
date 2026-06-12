import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const WELL_LINES = [
  { name: '湖心线', shortName: 'HX', region: 'N', prefix: 'N01', numbers: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28] },
  { name: '湖心一线', shortName: 'HX1', region: 'N', prefix: 'N02', numbers: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24] },
  { name: '湖心二线', shortName: 'HX2', region: 'N', prefix: 'N03', numbers: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20] },
  { name: '新北线', shortName: 'XB', region: 'C', prefix: 'C05', numbers: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,21,22,23,24,25,26,27,29] },
  { name: '新北试验线', shortName: 'XBSY', region: 'C', prefix: 'C06', numbers: [1,2,3,4,5] },
  { name: '新北一线', shortName: 'XB1', region: 'C', prefix: 'C04', numbers: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30] },
  { name: '钠七延长线', shortName: 'N7YC', region: 'C', prefix: 'C02', numbers: [1,2,3,4,5,6] },
  { name: '十八线', shortName: '18', region: 'C', prefix: 'C03', numbers: [1,2,3,4,5,6,7,8,9,10] },
  { name: '二十线', shortName: '20', region: 'C', prefix: 'C01', numbers: [1,2,3,4,5,6,7,8,9,10] },
  { name: '钠一线', shortName: 'N1', region: 'E', prefix: 'E01', numbers: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15] },
  { name: '钠七南坝', shortName: 'N7NB', region: 'E', prefix: 'E02', numbers: [51,52,54,56] },
  { name: '南线', shortName: 'N', region: 'S', prefix: 'S01', numbers: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37] },
  { name: '老北线', shortName: 'LB', region: 'S', prefix: 'S02', numbers: [73,74,75,76,77,78,79,80,81,82,83,84,1,2] },
  { name: '新北延长线', shortName: 'XBYC', region: 'S', prefix: 'S03', numbers: [1,2,3,4,5,6,7,8,9,10] },
  { name: '钠七西线', shortName: 'N7X', region: 'S', prefix: 'S04', numbers: [64,65,66,67,68,69,70,71,85,86,87,88,89] },
  { name: '钠一延长线', shortName: 'N1YC', region: 'S', prefix: 'S05', numbers: [1,2,3,4,5,6,7,8,9,10] },
  { name: '十一线', shortName: '11', region: 'W', prefix: 'W01', numbers: [1,2,3,4,5,6,7,8,9,10,11,12,13,14] },
  { name: '十二线', shortName: '12', region: 'W', prefix: 'W02', numbers: [1,2,3,4,5,6,7,8,9,10,11,12] },
  { name: '十三线', shortName: '13', region: 'W', prefix: 'W03', numbers: [1,2,3,4,5,6,7,8,9,10] },
  { name: '十四线', shortName: '14', region: 'W', prefix: 'W04', numbers: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15] },
  { name: '西线', shortName: 'X', region: 'W', prefix: 'W05', numbers: [1,2,3,4,5,6,7,8,9,10,11,12,13,14] },
  { name: '西一线', shortName: 'X1', region: 'W', prefix: 'W06', numbers: [1,2,3,4,5,6,7] },
]

const REGION_SEQ: Record<string, number> = { N: 0, C: 1, W: 2, E: 3, S: 4 }

async function main() {
  console.log('Seeding database...')

  // Create well lines
  for (let i = 0; i < WELL_LINES.length; i++) {
    const line = WELL_LINES[i]
    await prisma.wellLineInfo.upsert({
      where: { shortName: line.shortName },
      update: { name: line.name, region: line.region, regionSeq: REGION_SEQ[line.region] || 99 },
      create: { name: line.name, shortName: line.shortName, region: line.region, regionSeq: REGION_SEQ[line.region] || 99 },
    })
    console.log('  Line: ' + line.name + ' (' + line.numbers.length + ' wells)')
  }

  // Create wells
  let totalWells = 0
  for (const line of WELL_LINES) {
    const lineRecord = await prisma.wellLineInfo.findUnique({ where: { shortName: line.shortName } })
    if (!lineRecord) { console.log('  SKIP: ' + line.name + ' not found'); continue }
    for (const num of line.numbers) {
      const wellId = line.prefix + String(num).padStart(3, '0')
      await prisma.wellInfo.upsert({
        where: { wellId },
        update: { lineId: lineRecord.id },
        create: { wellId, lineId: lineRecord.id },
      })
      totalWells++
    }
  }

  console.log('Seed complete! ' + totalWells + ' wells, ' + WELL_LINES.length + ' lines')
}

main().catch(console.error).finally(() => prisma.$disconnect())
