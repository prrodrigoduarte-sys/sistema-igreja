// Feriados e datas comemorativas do Brasil, calculados para qualquer ano (sem depender de internet).

export type TipoData = 'nacional' | 'facultativo' | 'religioso' | 'comemorativo';

export interface DataEspecial {
  nome: string;
  tipo: TipoData;
}

const PRIORIDADE: Record<TipoData, number> = { nacional: 4, facultativo: 3, religioso: 2, comemorativo: 1 };

const dois = (n: number) => String(n).padStart(2, '0');

export const chaveData = (d: Date): string => `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;

export const dataDeChave = (chave: string): Date => {
  const [a, m, d] = chave.split('-').map(Number);
  return new Date(a, m - 1, d);
};

// Domingo de Páscoa (algoritmo gregoriano de Meeus/Jones/Butcher)
export function pascoa(ano: number): Date {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31); // 3 = março, 4 = abril
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}

const somarDias = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

// n-ésimo dia da semana do mês (diaSemana: 0 = domingo). Ex.: 2º domingo de maio
function enesimo(ano: number, mes0: number, diaSemana: number, n: number): Date {
  const primeiro = new Date(ano, mes0, 1);
  const deslocamento = (diaSemana - primeiro.getDay() + 7) % 7;
  return new Date(ano, mes0, 1 + deslocamento + (n - 1) * 7);
}

export function datasDoAno(ano: number): Record<string, DataEspecial> {
  const mapa: Record<string, DataEspecial> = {};

  const adicionar = (d: Date, nome: string, tipo: TipoData) => {
    const k = chaveData(d);
    const atual = mapa[k];
    if (!atual) {
      mapa[k] = { nome, tipo };
    } else {
      mapa[k] = {
        nome: `${atual.nome} · ${nome}`,
        tipo: PRIORIDADE[tipo] > PRIORIDADE[atual.tipo] ? tipo : atual.tipo,
      };
    }
  };

  const p = pascoa(ano);

  // Nacionais fixos
  adicionar(new Date(ano, 0, 1), 'Confraternização Universal', 'nacional');
  adicionar(new Date(ano, 3, 21), 'Tiradentes', 'nacional');
  adicionar(new Date(ano, 4, 1), 'Dia do Trabalho', 'nacional');
  adicionar(new Date(ano, 8, 7), 'Independência do Brasil', 'nacional');
  adicionar(new Date(ano, 9, 12), 'Nossa Senhora Aparecida', 'nacional');
  adicionar(new Date(ano, 10, 2), 'Finados', 'nacional');
  adicionar(new Date(ano, 10, 15), 'Proclamação da República', 'nacional');
  adicionar(new Date(ano, 10, 20), 'Consciência Negra', ano >= 2024 ? 'nacional' : 'comemorativo');
  adicionar(new Date(ano, 11, 25), 'Natal', 'nacional');

  // Móveis (dependem da Páscoa)
  adicionar(somarDias(p, -48), 'Carnaval (segunda)', 'facultativo');
  adicionar(somarDias(p, -47), 'Carnaval (terça)', 'facultativo');
  adicionar(somarDias(p, -46), 'Quarta-feira de Cinzas', 'religioso');
  adicionar(somarDias(p, -7), 'Domingo de Ramos', 'religioso');
  adicionar(somarDias(p, -2), 'Sexta-feira Santa', 'nacional');
  adicionar(p, 'Páscoa', 'religioso');
  adicionar(somarDias(p, 39), 'Ascensão do Senhor', 'religioso');
  adicionar(somarDias(p, 49), 'Pentecostes', 'religioso');
  adicionar(somarDias(p, 60), 'Corpus Christi', 'facultativo');

  // Comemorativas
  adicionar(new Date(ano, 9, 12), 'Dia das Crianças', 'comemorativo');
  adicionar(enesimo(ano, 4, 0, 2), 'Dia das Mães', 'comemorativo');
  adicionar(enesimo(ano, 7, 0, 2), 'Dia dos Pais', 'comemorativo');
  adicionar(enesimo(ano, 11, 0, 2), 'Dia da Bíblia', 'religioso');

  return mapa;
}

// Número da semana (padrão ISO 8601, semana começa na segunda)
export function semanaISO(d: Date): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const diaSemana = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - diaSemana);
  const inicioAno = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - inicioAno.getTime()) / 86400000 + 1) / 7);
}

export function diaDoAno(d: Date): number {
  const inicio = new Date(d.getFullYear(), 0, 0);
  return Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - inicio.getTime()) / 86400000);
}

export const diasNoAno = (ano: number) => ((ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0 ? 366 : 365);
