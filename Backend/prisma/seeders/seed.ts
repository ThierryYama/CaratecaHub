import { PrismaClient } from '../../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function run() {
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0;`;
  await prisma.$executeRaw`TRUNCATE TABLE \`InscricaoAtleta\`;`;
  await prisma.$executeRaw`TRUNCATE TABLE \`InscricaoEquipe\`;`;
  await prisma.$executeRaw`TRUNCATE TABLE \`CampeonatoModalidade\`;`;
  await prisma.$executeRaw`TRUNCATE TABLE \`Campeonato\`;`;
  await prisma.$executeRaw`TRUNCATE TABLE \`Endereco\`;`;
  await prisma.$executeRaw`TRUNCATE TABLE \`EquipeAtleta\`;`;
  await prisma.$executeRaw`TRUNCATE TABLE \`Equipe\`;`;
  await prisma.$executeRaw`TRUNCATE TABLE \`Atleta\`;`;
  await prisma.$executeRaw`TRUNCATE TABLE \`Categoria\`;`;
  await prisma.$executeRaw`TRUNCATE TABLE \`Associacao\`;`;
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1;`;

  console.log('Tabelas limpas e IDs resetados com sucesso.');

  // Associações
  const assoc1 = await prisma.associacao.create({
    data: {
      nome: 'Associação Dragão',
      cnpj: '12.345.678/0001-90',
      endereco: 'Rua A, 123',
      telefone: '(11) 99999-0001',
      email: 'contato@dragao.com',
      senha: await bcrypt.hash('senha123', 10),
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
      senha: await bcrypt.hash('senha123', 10),
      sigla: 'AT',
    },
  });

  // Endereços (um para o campeonato)
  const enderecoCamp = await prisma.endereco.create({
    data: {
      rua: 'Rua do Ginásio',
      numero: '1000',
      complemento: 'Quadra Central',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01000-000',
    },
  });

  // Categorias (incluindo modalidades de equipe e Misto)
  const kataJuvenil = await prisma.categoria.create({
    data: {
      nome: 'Kata Juvenil',
      faixaIdadeMin: 12,
      faixaIdadeMax: 17,
      genero: 'Outro',
      descricao: 'Kata para juvenis',
      pesoMin: null,
      pesoMax: null,
      graduacaoMin: '10° Kyu',
      graduacaoMax: '7° Kyu',
      modalidade: 'KATA',
    },
  });

  const kumiteAdultoLeve = await prisma.categoria.create({
    data: {
      nome: 'Kumite Adulto - Leve',
      faixaIdadeMin: 18,
      faixaIdadeMax: 35,
      genero: 'Masculino',
      descricao: 'Kumite até 67kg',
      pesoMin: '60.00',
      pesoMax: '67.00',
      graduacaoMin: '3° Kyu',
      graduacaoMax: '1° Kyu',
      modalidade: 'KUMITE',
    },
  });

  const kataEquipeMisto = await prisma.categoria.create({
    data: {
      nome: 'Kata Equipe - Misto',
      faixaIdadeMin: 12,
      faixaIdadeMax: 99,
      genero: 'Misto',
      descricao: 'Kata por equipes mistas',
      modalidade: 'KATA_EQUIPE',
    },
  });

  const kumiteEquipeMasc = await prisma.categoria.create({
    data: {
      nome: 'Kumite Equipe - Masculino',
      faixaIdadeMin: 16,
      faixaIdadeMax: 99,
      genero: 'Masculino',
      descricao: 'Kumite por equipes masculinas',
      modalidade: 'KUMITE_EQUIPE',
    },
  });

  // Atletas
  const atletas = await prisma.$transaction([
    prisma.atleta.create({
      data: {
        nome: 'Thierry',
        dataNascimento: new Date('2005-05-10'),
        genero: 'Masculino',
        graduacao: '3° Kyu',
        peso: '64.50',
        idAssociacao: assoc1.idAssociacao,
        status: true,
        telefone: '(11) 91234-5678',
        email: 'thierry@teste.com',
      },
    }),
    prisma.atleta.create({
      data: {
        nome: 'Ana',
        dataNascimento: new Date('2004-09-22'),
        genero: 'Feminino',
        graduacao: '1° Kyu',
        peso: '57.30',
        idAssociacao: assoc2.idAssociacao,
        status: true,
        telefone: '(21) 99876-5432',
        email: 'ana@teste.com',
      },
    }),
    prisma.atleta.create({
      data: {
        nome: 'Alice',
        dataNascimento: new Date('1998-11-22'),
        genero: 'Feminino',
        graduacao: '5° Kyu',
        peso: '60.30',
        idAssociacao: assoc2.idAssociacao,
        status: true,
        telefone: '(21) 98765-4321',
        email: 'alice@teste.com',
      },
    }),
  ]);

  const thierry = atletas[0];
  const ana = atletas[1];
  const alice = atletas[2];

  // Equipes (inclui genero)
  const equipeDragoesMisto = await prisma.equipe.create({
    data: {
      nome: 'Dragões Misto',
      descricao: 'Equipe mista da Associação Dragão',
      idAssociacao: assoc1.idAssociacao,
      genero: 'Misto',
    },
  });

  const equipeTigresMasc = await prisma.equipe.create({
    data: {
      nome: 'Tigres Masculino',
      descricao: 'Equipe masculina da Associação Tigre',
      idAssociacao: assoc2.idAssociacao,
      genero: 'Masculino',
    },
  });

  const equipePanterasFem = await prisma.equipe.create({
    data: {
      nome: 'Panteras Feminino',
      descricao: 'Equipe feminina da Associação Tigre',
      idAssociacao: assoc2.idAssociacao,
      genero: 'Feminino',
    },
  });

  // Membros das equipes
  await prisma.equipeAtleta.createMany({
    data: [
      { idEquipe: equipeDragoesMisto.idEquipe, idAtleta: thierry.idAtleta },
      { idEquipe: equipeDragoesMisto.idEquipe, idAtleta: ana.idAtleta },
      { idEquipe: equipeTigresMasc.idEquipe, idAtleta: thierry.idAtleta },
      { idEquipe: equipePanterasFem.idEquipe, idAtleta: alice.idAtleta },
    ],
    skipDuplicates: true,
  });

  // Campeonato
  const campeonato = await prisma.campeonato.create({
    data: {
      idAssociacao: assoc1.idAssociacao,
      idEndereco: enderecoCamp.idEndereco,
      nome: 'Open Carateca 2025',
      dataInicio: new Date('2025-11-01'),
      dataFim: new Date('2025-11-02'),
      descricao: 'Campeonato aberto de Karatê',
      status: 'PENDENTE',
    },
  });

  // Vínculo de categorias ao campeonato
  const [cmKata, cmKumite, cmKataEquipe, cmKumiteEquipe] = await prisma.$transaction([
    prisma.campeonatoModalidade.create({
      data: { idCampeonato: campeonato.idCampeonato, idCategoria: kataJuvenil.idCategoria },
    }),
    prisma.campeonatoModalidade.create({
      data: { idCampeonato: campeonato.idCampeonato, idCategoria: kumiteAdultoLeve.idCategoria },
    }),
    prisma.campeonatoModalidade.create({
      data: { idCampeonato: campeonato.idCampeonato, idCategoria: kataEquipeMisto.idCategoria },
    }),
    prisma.campeonatoModalidade.create({
      data: { idCampeonato: campeonato.idCampeonato, idCategoria: kumiteEquipeMasc.idCategoria },
    }),
  ]);

  // Inscrições de atletas
  await prisma.inscricaoAtleta.createMany({
    data: [
      { idAtleta: thierry.idAtleta, idCampeonatoModalidade: cmKumite.idCampeonatoModalidade, status: 'INSCRITO' },
      { idAtleta: ana.idAtleta, idCampeonatoModalidade: cmKata.idCampeonatoModalidade, status: 'AGUARDANDO' },
      { idAtleta: alice.idAtleta, idCampeonatoModalidade: cmKata.idCampeonatoModalidade, status: 'INSCRITO' },
    ],
  });

  // Inscrições de equipes
  await prisma.inscricaoEquipe.createMany({
    data: [
      { idEquipe: equipeDragoesMisto.idEquipe, idCampeonatoModalidade: cmKataEquipe.idCampeonatoModalidade, status: 'AGUARDANDO' },
      { idEquipe: equipeTigresMasc.idEquipe, idCampeonatoModalidade: cmKumiteEquipe.idCampeonatoModalidade, status: 'AGUARDANDO' },
    ],
  });

  console.log('Seed concluído com sucesso.');
}

run()
  .catch((e) => {
    (globalThis as any).console?.error?.(e);
    (globalThis as any).process?.exit?.(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
