import { PrismaClient } from '../../src/generated/prisma';

export function applySoftDelete(base: PrismaClient) {
  const prisma = base.$extends({
    query: {
      atleta: {
        findMany({ args, query }: any) {
          args = args ?? {};
          args.where = { ...(args.where ?? {}), deletedAt: null };
          return query(args);
        },
        findFirst({ args, query }: any) {
          args = args ?? {};
          args.where = { ...(args.where ?? {}), deletedAt: null };
          return query(args);
        },
        findUnique({ args }: any) {
          return base.atleta.findFirst({ where: { ...(args?.where ?? {}), deletedAt: null } });
        },
        delete({ args }: any) {
          return base.atleta.update({ where: args.where, data: { deletedAt: new Date() } });
        },
        deleteMany({ args }: any) {
          return base.atleta.updateMany({ where: args?.where ?? {}, data: { deletedAt: new Date() } });
        },
      },

      associacao: {
        findMany({ args, query }: any) {
          args = args ?? {};
          args.where = { ...(args.where ?? {}), deletedAt: null };
          return query(args);
        },
        findFirst({ args, query }: any) {
          args = args ?? {};
          args.where = { ...(args.where ?? {}), deletedAt: null };
          return query(args);
        },
        findUnique({ args }: any) {
          return base.associacao.findFirst({ where: { ...(args?.where ?? {}), deletedAt: null } });
        },
        delete({ args }: any) {
          return base.associacao.update({ where: args.where, data: { deletedAt: new Date() } });
        },
        deleteMany({ args }: any) {
          return base.associacao.updateMany({ where: args?.where ?? {}, data: { deletedAt: new Date() } });
        },
      },
    },
  });

  return prisma;
}

export default applySoftDelete;
