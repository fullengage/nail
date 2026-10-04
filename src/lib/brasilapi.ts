// Consulta de CNPJ na BrasilAPI (dados públicos da Receita Federal).
// A BrasilAPI pede uso "com natureza de pessoa real": consultas pontuais, nada de varredura em massa.
// Por isso o lote (importação) é limitado e espaçado — ver BULK_LIMIT / BULK_DELAY_MS.
import type { RetailPoint } from '../types/database';

export const BULK_LIMIT = 50;
export const BULK_DELAY_MS = 1500;

export const onlyDigits = (v: string) => (v || '').replace(/\D/g, '');

export function formatCnpj(v: string): string {
  const d = onlyDigits(v).padStart(14, '0').slice(-14);
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** Valida os dígitos verificadores do CNPJ (evita consultar número inválido). */
export function isValidCnpj(v: string): boolean {
  const d = onlyDigits(v);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const calc = (len: number) => {
    const w = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = w.reduce((acc, wi, i) => acc + Number(d[i]) * wi, 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
}

/** CNAE → tipo de PDV usado no painel. */
export function typeFromCnae(cnae: number | string | undefined): RetailPoint['type'] {
  const c = String(cnae || '');
  if (c.startsWith('47717')) return 'pharmacy'; // farmácias e drogarias
  if (c.startsWith('960250') || c.startsWith('960259')) return 'salon'; // cabeleireiros, estética
  if (c.startsWith('4646') || c.startsWith('4644') || c.startsWith('4649')) return 'distributor'; // atacado
  return 'cosmetics'; // 4772-5/00 cosméticos, perfumaria e higiene (e demais varejos)
}

const titleCase = (s: string) =>
  (s || '').toLowerCase().replace(/(^|\s|-|\/)(\p{L})/gu, (_m, sep, ch) => sep + ch.toUpperCase()).replace(/\b(De|Da|Do|Das|Dos|E)\b/g, (w) => w.toLowerCase());

function formatPhone(raw?: string | null): string {
  const d = onlyDigits(raw || '');
  if (d.length < 10) return '';
  return d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
}

export interface CnpjResult {
  point: Omit<RetailPoint, 'id' | 'created_at'>;
  situacao: string;
  cnae: string;
}

/** Busca um CNPJ e devolve o PDV já no formato do painel. Lança erro com mensagem amigável. */
export async function lookupCnpj(cnpj: string): Promise<CnpjResult> {
  const d = onlyDigits(cnpj);
  if (!isValidCnpj(d)) throw new Error('CNPJ inválido. Confira os 14 dígitos.');
  const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${d}`);
  if (res.status === 404) throw new Error('CNPJ não encontrado na Receita Federal.');
  if (res.status === 429) throw new Error('Muitas consultas seguidas. Aguarde um minuto e tente de novo.');
  if (!res.ok) throw new Error(`BrasilAPI indisponível (erro ${res.status}). Tente de novo em instantes.`);
  const j = await res.json();
  const fantasia = (j.nome_fantasia || '').trim();
  const razao = (j.razao_social || '').trim();
  const address = [
    [j.descricao_tipo_de_logradouro, j.logradouro].filter(Boolean).join(' '),
    j.numero && j.numero !== 'S/N' && !String(j.logradouro || '').includes(String(j.numero)) ? j.numero : '',
    j.complemento,
    j.bairro,
    j.cep ? `CEP ${String(j.cep).replace(/^(\d{5})(\d{3})$/, '$1-$2')}` : '',
  ]
    .map((x) => (x || '').toString().trim())
    .filter(Boolean)
    .join(', ');
  const situacao = (j.descricao_situacao_cadastral || '').toString();
  return {
    situacao,
    cnae: `${j.cnae_fiscal || ''} ${j.cnae_fiscal_descricao || ''}`.trim(),
    point: {
      name: titleCase(fantasia || razao),
      trade_name: titleCase(razao),
      network: titleCase(fantasia || razao),
      cnpj: formatCnpj(d),
      type: typeFromCnae(j.cnae_fiscal),
      city: titleCase(j.municipio || ''),
      state: (j.uf || '').toUpperCase(),
      address: titleCase(address).replace(/\bCep\b/, 'CEP'),
      phone: formatPhone(j.ddd_telefone_1),
      email: (j.email || '').toLowerCase(),
      manager_name: '',
      status: situacao.toUpperCase() === 'ATIVA' ? 'active' : 'inactive',
    },
  };
}

// auto-checagem rápida (roda só em dev)
if (import.meta.env?.DEV) {
  console.assert(isValidCnpj('61.585.865/0001-51') && !isValidCnpj('11.111.111/1111-11'), 'isValidCnpj');
  console.assert(typeFromCnae(4771701) === 'pharmacy' && typeFromCnae(4772500) === 'cosmetics' && typeFromCnae(9602502) === 'salon', 'typeFromCnae');
}
