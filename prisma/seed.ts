import { PrismaClient } from '@prisma/client'
import { organizations } from './seedData'


const prisma = new PrismaClient()

async function main() {
    for (const org of organizations) {
        await prisma.organization.create({
            data: org,
        })
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })