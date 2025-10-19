import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';

const JWT_SECRET: Secret = (process.env.JWT_SECRET as Secret);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

function signToken(payload: object) {
  return jwt.sign(payload as any, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as SignOptions);
}

export const registrar = async (req: Request, res: Response) => {
  try {
    const { nome, cnpj, telefone, email, senha, sigla, endereco } = req.body as any;

    if (!nome || !cnpj || !telefone || !email || !senha) {
      return res.status(400).json({ message: 'Campos obrigatórios faltando' });
    }

    const existente = await prisma.associacao.findFirst({ where: { OR: [{ email }, { cnpj }] } });
    if (existente) return res.status(409).json({ message: 'Associação já cadastrada (email ou CNPJ)' });

    const hash = await bcrypt.hash(senha, 10);
    const addr = endereco as { rua?: string; numero?: string; complemento?: string; bairro?: string; cidade?: string; estado?: string; cep?: string } | undefined;
    const enderecoStr = addr?.rua && addr?.numero && addr?.bairro && addr?.cidade && addr?.estado
      ? `${addr.rua}, ${addr.numero} - ${addr.bairro} - ${addr.cidade}/${addr.estado}`
      : '';

    const associacao = await prisma.associacao.create({
      data: { nome, cnpj, endereco: enderecoStr, telefone, email, senha: hash, sigla: sigla ?? null }
    });

    let enderecoCriado = null as any;
    if (addr?.rua && addr?.numero && addr?.bairro && addr?.cidade && addr?.estado && addr?.cep) {
      enderecoCriado = await prisma.endereco.create({
        data: {
          rua: addr.rua,
          numero: addr.numero,
          complemento: addr.complemento ?? null,
          bairro: addr.bairro,
          cidade: addr.cidade,
          estado: addr.estado,
          cep: addr.cep,
          idAssociacao: associacao.idAssociacao,
        }
      });
    }

    const token = signToken({ sub: associacao.idAssociacao, role: 'associacao' });
    return res.status(201).json({ token, associacao: { idAssociacao: associacao.idAssociacao, nome: associacao.nome, email: associacao.email, sigla: associacao.sigla }, endereco: enderecoCriado });
  } catch (err) {
    return res.status(400).json({ message: 'Erro ao registrar', error: String(err) });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body as { email: string; senha: string };
    if (!email || !senha) return res.status(400).json({ message: 'Informe email e senha' });

    const associacao = await prisma.associacao.findFirst({ where: { email } });
    if (!associacao) return res.status(401).json({ message: 'Credenciais inválidas' });

    const ok = await bcrypt.compare(senha, associacao.senha);
    if (!ok) return res.status(401).json({ message: 'Credenciais inválidas' });

    const token = signToken({ sub: associacao.idAssociacao, role: 'associacao' });
    return res.status(200).json({ token, associacao: { idAssociacao: associacao.idAssociacao, nome: associacao.nome, email: associacao.email, sigla: associacao.sigla } });
  } catch (err) {
    return res.status(400).json({ message: 'Erro no login', error: String(err) });
  }
};
