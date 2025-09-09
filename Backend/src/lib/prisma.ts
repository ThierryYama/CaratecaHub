import { PrismaClient } from '../generated/prisma';
import applySoftDelete from '../../prisma/extensions/softDelete';

const base = new PrismaClient();
const prisma = applySoftDelete(base);

export default prisma;

