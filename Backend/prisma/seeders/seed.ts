import { PrismaClient } from '../../src/generated/prisma';

const prisma = new PrismaClient();

async function run() {
  
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0;`;
  await prisma.$executeRaw`TRUNCATE TABLE \`Atleta\`;`;
  await prisma.$executeRaw`TRUNCATE TABLE \`Categoria\`;`;
  await prisma.$executeRaw`TRUNCATE TABLE \`Associacao\`;`;
  await prisma.$executeRaw`TRUNCATE TABLE \`Equipe\`;`;
  await prisma.$executeRaw`TRUNCATE TABLE \`EquipeAtleta\`;`;
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1;`;

  console.log('Tabelas limpas e IDs resetados com sucesso.');

  await prisma.atleta.deleteMany({});
  await prisma.categoria.deleteMany({});
  await prisma.associacao.deleteMany({});

  const assoc1 = await prisma.associacao.create({
    data: {
      nome: 'Associação Dragão',
      cnpj: '12.345.678/0001-90',
      endereco: 'Rua A, 123',
      telefone: '(11) 99999-0001',
      email: 'contato@dragao.com',
      senha: 'senha123',
      sigla: 'AD',
    },
  });

  const assoc2 = await prisma.associacao.create({
    data: {
      nome: 'Associação Tigre',
      cnpj: '98.765.432/0001-10',
      endereco: 'Av. B, 456',
      telefone: '(21) 98888-0002',
      email: 'contato@tigre.com',
      senha: 'senha123',
      sigla: 'AT',
    },
  });

  await prisma.categoria.createMany({
    data: [
      {
        nome: 'Kata Juvenil',
        faixaIdadeMin: 12,
        faixaIdadeMax: 17,
        genero: 'Outro',
        descricao: 'Kata para juvenis',
        pesoMin: null,
        pesoMax: null,
        graduacaoMin: '10° Kyu',
        graduacaoMax: '7° Kyu',
        modalidade: 'KATA'
      },
      {
        nome: 'Kumite Adulto - Leve',
        faixaIdadeMin: 18,
        faixaIdadeMax: 35,
        genero: 'Masculino',
        descricao: 'Kumite até 67kg',
        pesoMin: '60.00',
        pesoMax: '67.00',
        graduacaoMin: '3° Kyu',
        graduacaoMax: '1° Kyu',
        modalidade: 'KUMITE'
      },
    ],
  });

  await prisma.atleta.createMany({
    data: [
      {
        nome: 'Thierry',
        dataNascimento: new Date('2005-05-10'),
        genero: 'Masculino',
        graduacao: '3°Kyu',
        peso: '64.50',
        idAssociacao: assoc1.idAssociacao,
        status: true,
        telefone: '(11) 91234-5678',
        email: 'thierry@teste.com'
      },
      {
        nome: 'Ana',
        dataNascimento: new Date('2004-09-22'),
        genero: 'Feminino',
        graduacao: '1°Kyu',
        peso: '57.30',
        idAssociacao: assoc2.idAssociacao,
        status: false,
        telefone: '(21) 99876-5432',
        email: 'ana@teste.com'
      },
      {
        nome: 'Alice',
        dataNascimento: new Date('1998-11-22'),
        genero: 'Feminino',
        graduacao: '5°Kyu',
        peso: '60.30',
        idAssociacao: assoc2.idAssociacao,
        status: true,
        telefone: '(21) 98765-4321',
        email: 'alice@teste.com'
      }
    ],
  });
}

run()
  .catch((e) => {
    (globalThis as any).console?.error?.(e);
    (globalThis as any).process?.exit?.(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
