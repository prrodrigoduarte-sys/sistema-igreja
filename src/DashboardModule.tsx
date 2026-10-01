import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';

// Dashboard do sistema.
// Faz UMA consulta leve (sem fotos) de todos os membros e visitantes da igreja e calcula tudo no navegador:
// os números, os gráficos, os aniversariantes e as listas abrem na hora, sem nova consulta.

interface Props {
  loggedUser: any;
  selecionarAba: (aba: string) => void;
}

interface Pessoa {
  id: number;
  nome: string;
  tipo_cadastro?: string | null;
  data_nascimento?: string | null;
  estado_civil?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  celular_principal?: string | null;
  email?: string | null;
  created_at?: string | null;
  cadastro_concluido?: boolean | null;
}

// Só as colunas usadas aqui (a foto fica de fora: era ela que deixava tudo lento)
const COLUNAS = 'id, nome, tipo_cadastro, data_nascimento, estado_civil, bairro, cidade, celular_principal, email, created_at, cadastro_concluido';
const POR_PAGINA = 1000;
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const ehVisitante = (p: Pessoa) => (p.tipo_cadastro || '').toLowerCase() === 'visitante';
const nomeBonito = (nome?: string | null) =>
  (nome || '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((p, i) => (i > 0 && ['de', 'da', 'do', 'das', 'dos', 'e'].includes(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(' ');
const dataCurta = (iso?: string | null) => (iso ? iso.slice(0, 10).split('-').reverse().slice(0, 2).join('/') : '');

const idade = (nasc?: string | null) => {
  if (!nasc || nasc.length < 10) return null;
  const [a, m, d] = nasc.slice(0, 10).split('-').map(Number);
  if (!a) return null;
  const hoje = new Date();
  let anos = hoje.getFullYear() - a;
  if (hoje.getMonth() + 1 < m || (hoje.getMonth() + 1 === m && hoje.getDate() < d)) anos--;
  return anos >= 0 && anos < 120 ? anos : null;
};

const linkWhats = (celular?: string | null, texto = '') => {
  const dig = (celular || '').replace(/\D/g, '');
  if (dig.length < 10) return '';
  return `https://wa.me/${dig.startsWith('55') ? dig : `55${dig}`}?text=${encodeURIComponent(texto)}`;
};

// ── Gráficos simples (uma cor só por gráfico; o título diz o que é) ──
const COR_BARRA = '#1e40af';

function BarrasHorizontais({ itens, total }: { itens: { rotulo: string; valor: number }[]; total: number }) {
  const maximo = Math.max(1, ...itens.map((i) => i.valor));
  return (
    <ul className="space-y-2.5">
      {itens.map((i) => (
        <li key={i.rotulo} className="grid grid-cols-[9.5rem_1fr_auto] items-center gap-3 text-xs">
          <span className="truncate text-slate-600" title={i.rotulo}>
            {i.rotulo}
          </span>
          <span className="h-3 rounded-r bg-slate-100">
            <span
              className="block h-3 rounded-r"
              style={{ width: `${(i.valor / maximo) * 100}%`, background: COR_BARRA, minWidth: i.valor ? 4 : 0 }}
              title={`${i.rotulo}: ${i.valor}`}
            />
          </span>
          <span className="w-16 text-right tabular-nums text-slate-800 font-semibold">
            {i.valor}
            <span className="ml-1 font-normal text-slate-400">{total ? Math.round((i.valor / total) * 100) : 0}%</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function ColunasMensais({ meses }: { meses: { rotulo: string; membros: number; visitantes: number }[] }) {
  const totais = meses.map((m) => m.membros + m.visitantes);
  const maximo = Math.max(1, ...totais);
  const passo = maximo <= 5 ? 1 : Math.ceil(maximo / 4);
  const topo = Math.ceil(maximo / passo) * passo;
  const linhas = Array.from({ length: Math.floor(topo / passo) + 1 }, (_, i) => i * passo);
  const iMax = totais.indexOf(Math.max(...totais));

  return (
    <div className="relative h-44 pl-7">
      {/* grade e eixo */}
      {linhas.map((v) => (
        <div key={v} className="absolute left-7 right-0 border-t border-slate-100" style={{ bottom: `${(v / topo) * 100}%` }}>
          <span className="absolute -left-7 -translate-y-1/2 w-6 text-right text-[10px] text-slate-400 tabular-nums">{v}</span>
        </div>
      ))}
      <div className="absolute inset-0 left-7 flex items-end gap-[2px]">
        {meses.map((m, i) => {
          const total = totais[i];
          const ultimo = i === meses.length - 1;
          return (
            <div key={m.rotulo} tabIndex={0} className="group relative flex h-full flex-1 flex-col items-center justify-end outline-none">
              {/* rótulo só no último mês e no maior; o resto aparece ao passar o mouse */}
              {total > 0 && (ultimo || i === iMax) && (
                <span className="mb-1 text-[10px] font-bold text-slate-700 tabular-nums group-hover:invisible">{total}</span>
              )}
              <span
                className="block w-full max-w-[24px] rounded-t"
                style={{ height: `${(total / topo) * 100}%`, background: COR_BARRA, minHeight: total ? 3 : 0 }}
              />
              <span className="absolute -bottom-5 text-[10px] text-slate-500">{m.rotulo}</span>
              <span className="pointer-events-none absolute bottom-full mb-1 hidden whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[10px] text-white shadow-lg group-hover:block group-focus:block z-10">
                <strong>{m.rotulo}</strong>: {total} novo(s) · {m.membros} membro(s), {m.visitantes} visitante(s)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardHome({ loggedUser }: Props) {
  const codigoIgreja = loggedUser?.codigo_igreja || loggedUser?.igrejas?.codigo_igreja || 'IGR-001';

  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [nomeIgreja, setNomeIgreja] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [modoAniversariantes, setModoAniversariantes] = useState<'dia' | 'mes'>('dia');

  // Lista (modal)
  const [lista, setLista] = useState<{ titulo: string; filtro: (p: Pessoa) => boolean } | null>(null);
  const [buscaModal, setBuscaModal] = useState('');
  const [itemEditando, setItemEditando] = useState<Pessoa | null>(null);
  const [itemDetalhes, setItemDetalhes] = useState<any | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const todas: Pessoa[] = [];
      for (let inicio = 0; ; inicio += POR_PAGINA) {
        const { data, error } = await supabase
          .from('members')
          .select(COLUNAS)
          .eq('codigo_igreja', codigoIgreja)
          .order('nome', { ascending: true })
          .range(inicio, inicio + POR_PAGINA - 1);
        if (error) throw error;
        todas.push(...((data as Pessoa[]) || []));
        if (!data || data.length < POR_PAGINA) break;
      }
      setPessoas(todas);
    } catch (e: any) {
      setErro('Não foi possível carregar os membros: ' + (e?.message || e));
    } finally {
      setCarregando(false);
    }
  }, [codigoIgreja]);

  useEffect(() => {
    carregar();
    supabase
      .from('igrejas')
      .select('nome_fantasia, razao_social')
      .eq('codigo_igreja', codigoIgreja)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setNomeIgreja(data?.nome_fantasia || data?.razao_social || ''));
  }, [carregar, codigoIgreja]);

  // ── Números calculados a partir da lista ──
  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1;
  const diaAtual = hoje.getDate();
  const chaveMes = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

  const r = useMemo(() => {
    const membros = pessoas.filter((p) => !ehVisitante(p));
    const visitantes = pessoas.filter(ehVisitante);

    // Novos cadastros: últimos 12 meses
    const meses: { chave: string; rotulo: string; membros: number; visitantes: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      meses.push({ chave: chaveMes(d), rotulo: MESES[d.getMonth()], membros: 0, visitantes: 0 });
    }
    pessoas.forEach((p) => {
      const m = meses.find((x) => x.chave === (p.created_at || '').slice(0, 7));
      if (m) ehVisitante(p) ? m.visitantes++ : m.membros++;
    });
    const novosMes = meses[11].membros + meses[11].visitantes;
    const novosMesAnterior = meses[10].membros + meses[10].visitantes;

    // Faixa etária (só membros)
    const faixas = [
      { rotulo: 'Crianças (0-12)', min: 0, max: 12 },
      { rotulo: 'Adolescentes (13-17)', min: 13, max: 17 },
      { rotulo: 'Jovens (18-29)', min: 18, max: 29 },
      { rotulo: 'Adultos (30-59)', min: 30, max: 59 },
      { rotulo: 'Idosos (60+)', min: 60, max: 200 },
    ].map((f) => ({ rotulo: f.rotulo, valor: membros.filter((p) => { const a = idade(p.data_nascimento); return a !== null && a >= f.min && a <= f.max; }).length }));
    const semIdade = membros.filter((p) => idade(p.data_nascimento) === null).length;

    // Estado civil e bairros (só membros)
    const contar = (lista: Pessoa[], campo: (p: Pessoa) => string) => {
      const mapa: Record<string, number> = {};
      lista.forEach((p) => {
        const k = campo(p);
        if (k) mapa[k] = (mapa[k] || 0) + 1;
      });
      return Object.entries(mapa)
        .map(([rotulo, valor]) => ({ rotulo, valor }))
        .sort((a, b) => b.valor - a.valor);
    };
    const estadoCivil = contar(membros, (p) => p.estado_civil || 'Não informado');
    const bairrosTodos = contar(membros, (p) => nomeBonito(p.bairro));
    const bairros = bairrosTodos.slice(0, 6);
    const outrosBairros = bairrosTodos.slice(6).reduce((acc, b) => acc + b.valor, 0);

    // Aniversariantes
    const mesDia = (p: Pessoa) => (p.data_nascimento || '').slice(5, 10);
    const hojeMD = `${String(mesAtual).padStart(2, '0')}-${String(diaAtual).padStart(2, '0')}`;
    const aniversHoje = pessoas.filter((p) => mesDia(p) === hojeMD);
    const aniversMes = pessoas
      .filter((p) => mesDia(p).startsWith(String(mesAtual).padStart(2, '0')))
      .sort((a, b) => mesDia(a).localeCompare(mesDia(b)));

    // Cadastros para completar (só membros)
    const pendencias = [
      { rotulo: 'Sem celular', filtro: (p: Pessoa) => !ehVisitante(p) && !(p.celular_principal || '').trim() },
      { rotulo: 'Sem data de nascimento', filtro: (p: Pessoa) => !ehVisitante(p) && !p.data_nascimento },
      { rotulo: 'Sem e-mail (não usa o chat)', filtro: (p: Pessoa) => !ehVisitante(p) && !(p.email || '').trim() },
      { rotulo: 'Cadastro não confirmado no app', filtro: (p: Pessoa) => !ehVisitante(p) && !p.cadastro_concluido },
    ].map((x) => ({ ...x, valor: pessoas.filter(x.filtro).length }));

    return { membros, visitantes, meses, novosMes, novosMesAnterior, faixas, semIdade, estadoCivil, bairros, outrosBairros, totalComBairro: bairrosTodos.reduce((acc, b) => acc + b.valor, 0), aniversHoje, aniversMes, pendencias };
  }, [pessoas]); // eslint-disable-line react-hooks/exhaustive-deps

  const aniversariantes = modoAniversariantes === 'dia' ? r.aniversHoje : r.aniversMes;

  // ── Lista / edição ──
  const abrirLista = (titulo: string, filtro: (p: Pessoa) => boolean) => {
    setBuscaModal('');
    setLista({ titulo, filtro });
  };
  const termo = buscaModal.trim().toLowerCase();
  const filtradosModal = lista
    ? pessoas.filter((p) => lista.filtro(p) && (!termo || (p.nome || '').toLowerCase().includes(termo) || (p.celular_principal || '').includes(termo)))
    : [];

  const abrirDetalhes = async (p: Pessoa) => {
    setItemDetalhes({ ...p, carregando: true });
    const { data } = await supabase
      .from('members')
      .select('id, nome, tipo_cadastro, celular_principal, email, cpf, rg, rua, numero, bairro, cidade, estado, data_nascimento, estado_civil')
      .eq('id', p.id)
      .maybeSingle();
    setItemDetalhes(data || p);
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemEditando) return;
    // Só os campos deste formulário (não reenvia a foto nem o resto do cadastro)
    const payload = {
      tipo_cadastro: itemEditando.tipo_cadastro || 'Membro',
      nome: (itemEditando.nome || '').trim(),
      celular_principal: (itemEditando.celular_principal || '').trim() || null,
      email: (itemEditando.email || '').trim() || null,
      data_nascimento: itemEditando.data_nascimento || null,
      estado_civil: itemEditando.estado_civil || null,
      bairro: (itemEditando.bairro || '').trim() || null,
      cidade: (itemEditando.cidade || '').trim() || null,
    };
    const { error } = await supabase.from('members').update(payload).eq('id', itemEditando.id);
    if (error) return alert('Erro ao atualizar: ' + error.message);
    setPessoas((prev) => prev.map((p) => (p.id === itemEditando.id ? { ...p, ...payload } : p)));
    setItemEditando(null);
  };

  const handleExcluirRegistro = async (id: number, nome: string) => {
    if (!window.confirm(`Deseja realmente excluir "${nome}"?`)) return;
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (error) return alert('Erro ao excluir: ' + error.message);
    setPessoas((prev) => prev.filter((p) => p.id !== id));
  };

  const primeiroNome = nomeBonito(loggedUser?.nome_usuario || '').split(' ')[0];
  const h = hoje.getHours();
  const saudacao = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const variacao = r.novosMes - r.novosMesAnterior;
  const nomeMesAtual = hoje.toLocaleDateString('pt-BR', { month: 'long' });

  const cartao = 'bg-white rounded-2xl border border-slate-200 p-5';

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* CABEÇALHO */}
      <div className="rounded-3xl bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 p-6 sm:p-7 text-white shadow-md">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-300">
          {saudacao}
          {primeiroNome ? `, ${primeiroNome}` : ''}
        </p>
        <h2 className="mt-1 text-3xl sm:text-4xl font-black leading-tight tracking-tight bg-gradient-to-br from-white to-amber-200 bg-clip-text text-transparent">
          {nomeIgreja || 'Painel da Igreja'}
        </h2>
        <p className="mt-2 text-xs text-blue-200 first-letter:uppercase">
          {hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {codigoIgreja}
        </p>
      </div>

      {erro && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between gap-3">
          <span>{erro}</span>
          <button type="button" onClick={carregar} className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer">
            Tentar de novo
          </button>
        </div>
      )}

      {/* NÚMEROS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            rotulo: 'Membros',
            valor: r.membros.length,
            detalhe: 'Ver lista e editar',
            icone: '👥',
            acao: () => abrirLista('Membros', (p) => !ehVisitante(p)),
          },
          {
            rotulo: 'Visitantes',
            valor: r.visitantes.length,
            detalhe: 'Ver lista e acompanhar',
            icone: '🤝',
            acao: () => abrirLista('Visitantes', ehVisitante),
          },
          {
            rotulo: `Novos em ${nomeMesAtual}`,
            valor: r.novosMes,
            detalhe:
              variacao === 0 ? 'Igual ao mês passado' : `${variacao > 0 ? '▲' : '▼'} ${Math.abs(variacao)} em relação ao mês passado`,
            icone: '🌱',
            acao: () => abrirLista(`Novos cadastros em ${nomeMesAtual}`, (p) => (p.created_at || '').slice(0, 7) === chaveMes(hoje)),
          },
          {
            rotulo: `Aniversariantes de ${nomeMesAtual}`,
            valor: r.aniversMes.length,
            detalhe: r.aniversHoje.length ? `🎂 ${r.aniversHoje.length} hoje` : 'Nenhum hoje',
            icone: '🎂',
            acao: () => {
              setModoAniversariantes('mes');
              document.getElementById('dash-aniversariantes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            },
          },
        ].map((c) => (
          <button
            key={c.rotulo}
            type="button"
            onClick={c.acao}
            className="text-left bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 hover:border-blue-300 hover:shadow-md transition cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 first-letter:uppercase">{c.rotulo}</span>
              <span className="text-xl" aria-hidden="true">
                {c.icone}
              </span>
            </div>
            <p className="mt-1 text-3xl sm:text-4xl font-black text-slate-900 tabular-nums">{carregando ? '…' : c.valor}</p>
            <p className="mt-1 text-[11px] text-slate-500">{c.detalhe}</p>
          </button>
        ))}
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={cartao}>
          <h3 className="font-black text-slate-800">Novos cadastros por mês</h3>
          <p className="text-xs text-slate-500 mb-4">Membros e visitantes cadastrados nos últimos 12 meses</p>
          {carregando ? <p className="text-xs text-slate-400">Carregando...</p> : <div className="pb-6"><ColunasMensais meses={r.meses} /></div>}
        </div>

        <div className={cartao}>
          <h3 className="font-black text-slate-800">Faixa etária dos membros</h3>
          <p className="text-xs text-slate-500 mb-4">
            {r.semIdade ? `${r.semIdade} membro(s) sem data de nascimento não entram aqui` : 'Pela data de nascimento'}
          </p>
          {carregando ? (
            <p className="text-xs text-slate-400">Carregando...</p>
          ) : (
            <BarrasHorizontais itens={r.faixas} total={r.faixas.reduce((acc, f) => acc + f.valor, 0)} />
          )}
        </div>

        <div className={cartao}>
          <h3 className="font-black text-slate-800">Estado civil</h3>
          <p className="text-xs text-slate-500 mb-4">Membros</p>
          {carregando ? <p className="text-xs text-slate-400">Carregando...</p> : <BarrasHorizontais itens={r.estadoCivil} total={r.membros.length} />}
        </div>

        <div className={cartao}>
          <h3 className="font-black text-slate-800">Onde moram</h3>
          <p className="text-xs text-slate-500 mb-4">Bairros com mais membros</p>
          {carregando ? (
            <p className="text-xs text-slate-400">Carregando...</p>
          ) : r.bairros.length === 0 ? (
            <p className="text-xs text-slate-400">Nenhum bairro informado nos cadastros.</p>
          ) : (
            <>
              <BarrasHorizontais itens={r.bairros} total={r.totalComBairro} />
              {r.outrosBairros > 0 && <p className="mt-3 text-[11px] text-slate-500">+ {r.outrosBairros} membro(s) em outros bairros</p>}
            </>
          )}
        </div>
      </div>

      {/* CADASTROS PARA COMPLETAR */}
      <div className={cartao}>
        <h3 className="font-black text-slate-800">⚠️ Cadastros para completar</h3>
        <p className="text-xs text-slate-500 mb-3">Clique para ver quem é e corrigir</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {r.pendencias.map((p) => (
            <button
              key={p.rotulo}
              type="button"
              onClick={() => abrirLista(p.rotulo, p.filtro)}
              disabled={!p.valor}
              className={`text-left rounded-xl border p-3 transition ${
                p.valor ? 'border-amber-200 bg-amber-50 hover:bg-amber-100 cursor-pointer' : 'border-emerald-200 bg-emerald-50 cursor-default'
              }`}
            >
              <span className="block text-2xl font-black tabular-nums text-slate-900">{carregando ? '…' : p.valor}</span>
              <span className="block text-[11px] font-semibold text-slate-700">
                {p.valor ? '⚠️ ' : '✅ '}
                {p.rotulo}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ANIVERSARIANTES */}
      <div id="dash-aniversariantes" className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-2xl p-5 sm:p-6 text-white shadow-md space-y-4 scroll-mt-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-blue-700/60 pb-4">
          <div>
            <h3 className="text-lg font-black">🎂 Aniversariantes {modoAniversariantes === 'dia' ? 'de hoje' : `de ${nomeMesAtual}`}</h3>
            <p className="text-xs text-blue-200">Toque em “Parabenizar” para mandar uma mensagem pelo WhatsApp.</p>
          </div>
          <div className="flex rounded-xl bg-blue-950/50 p-1">
            {(['dia', 'mes'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setModoAniversariantes(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${modoAniversariantes === m ? 'bg-white text-blue-900' : 'text-blue-100'}`}
              >
                {m === 'dia' ? `Hoje (${r.aniversHoje.length})` : `No mês (${r.aniversMes.length})`}
              </button>
            ))}
          </div>
        </div>

        {carregando ? (
          <p className="text-xs text-blue-200 py-4 text-center">Buscando aniversariantes...</p>
        ) : aniversariantes.length === 0 ? (
          <p className="bg-blue-950/40 p-4 rounded-xl text-center text-sm text-blue-200">
            Nenhum aniversariante {modoAniversariantes === 'dia' ? 'hoje' : 'neste mês'}.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {aniversariantes.map((p) => {
              const a = idade(p.data_nascimento);
              const ehHoje = (p.data_nascimento || '').slice(5, 10) === `${String(mesAtual).padStart(2, '0')}-${String(diaAtual).padStart(2, '0')}`;
              const whats = linkWhats(
                p.celular_principal,
                `Feliz aniversário, ${nomeBonito(p.nome).split(' ')[0]}! 🎉 Que Deus abençoe sua vida com muita paz, saúde e alegria. Com carinho, ${nomeIgreja || 'sua igreja'}.`
              );
              return (
                <div key={p.id} className={`rounded-xl p-3 flex items-center justify-between gap-2 border ${ehHoje ? 'bg-amber-400/15 border-amber-300/50' : 'bg-white/10 border-white/10'}`}>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{nomeBonito(p.nome)}</p>
                    <p className="text-xs text-blue-200">
                      {dataCurta(p.data_nascimento)}
                      {a !== null && ehHoje ? ` · faz ${a} anos` : ''}
                      {ehVisitante(p) ? ' · visitante' : ''}
                    </p>
                  </div>
                  {whats ? (
                    <a href={whats} target="_blank" rel="noreferrer" className="shrink-0 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-2.5 py-1.5 text-[11px] font-bold text-white">
                      Parabenizar
                    </a>
                  ) : (
                    <span className="shrink-0 text-[10px] text-blue-300">sem celular</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: LISTA */}
      {lista && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl p-5 sm:p-7 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-3 shrink-0">
              <div>
                <h3 className="text-xl font-black text-blue-900">
                  {lista.titulo} ({filtradosModal.length})
                </h3>
                <p className="text-xs text-slate-500">Igreja {codigoIgreja}</p>
              </div>
              <button type="button" onClick={() => setLista(null)} className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl cursor-pointer">
                ✕ Fechar
              </button>
            </div>

            <input
              type="text"
              placeholder="🔎 Pesquisar por nome ou celular..."
              value={buscaModal}
              onChange={(e) => setBuscaModal(e.target.value)}
              className="w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none shrink-0"
              autoFocus
            />

            <div className="overflow-auto flex-1">
              {filtradosModal.length === 0 ? (
                <p className="p-8 text-center bg-slate-50 rounded-xl border border-dashed text-slate-500 text-xs">Nenhum registro encontrado.</p>
              ) : (
                <table className="w-full text-left border-collapse min-w-[560px]">
                  <thead>
                    <tr className="border-b bg-slate-50 text-slate-700 text-xs uppercase font-bold sticky top-0">
                      <th className="p-3">Nome</th>
                      <th className="p-3">Tipo</th>
                      <th className="p-3">Telefone</th>
                      <th className="p-3">Bairro / Cidade</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs">
                    {filtradosModal.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-800">{nomeBonito(p.nome) || 'Sem nome'}</td>
                        <td className="p-3">
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">{p.tipo_cadastro || 'Membro'}</span>
                        </td>
                        <td className="p-3 text-slate-600">{p.celular_principal || '-'}</td>
                        <td className="p-3 text-slate-500">{[p.bairro, p.cidade].filter(Boolean).join(' - ') || '-'}</td>
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          <button type="button" onClick={() => abrirDetalhes(p)} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer">
                            👁️ Ver
                          </button>
                          <button type="button" onClick={() => setItemEditando({ ...p })} className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold rounded-lg cursor-pointer">
                            ✏️ Editar
                          </button>
                          <button type="button" onClick={() => handleExcluirRegistro(p.id, p.nome)} className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg cursor-pointer" aria-label={`Excluir ${p.nome}`}>
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR */}
      {itemEditando && (
        <div className="fixed inset-0 bg-slate-900/90 z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="text-xl font-black text-blue-900">Editar Cadastro</h3>
                <p className="text-xs text-slate-500">{nomeBonito(itemEditando.nome)}</p>
              </div>
              <button type="button" onClick={() => setItemEditando(null)} className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl cursor-pointer">
                ✕ Cancelar
              </button>
            </div>

            <form onSubmit={handleSalvarEdicao} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block font-bold text-slate-700">
                  TIPO DE CADASTRO
                  <select
                    value={itemEditando.tipo_cadastro || 'Membro'}
                    onChange={(e) => setItemEditando({ ...itemEditando, tipo_cadastro: e.target.value })}
                    className="mt-1 w-full border rounded-xl p-2.5 bg-white font-medium"
                  >
                    <option value="Membro">Membro</option>
                    <option value="Congregado">Congregado</option>
                    <option value="Visitante">Visitante</option>
                    <option value="Lider">Líder</option>
                  </select>
                </label>
                <label className="block font-bold text-slate-700">
                  NOME COMPLETO *
                  <input value={itemEditando.nome || ''} onChange={(e) => setItemEditando({ ...itemEditando, nome: e.target.value })} className="mt-1 w-full border rounded-xl p-2.5 font-bold text-slate-800" required />
                </label>
                <label className="block font-bold text-slate-700">
                  CELULAR / WHATSAPP
                  <input value={itemEditando.celular_principal || ''} onChange={(e) => setItemEditando({ ...itemEditando, celular_principal: e.target.value })} className="mt-1 w-full border rounded-xl p-2.5 font-normal" />
                </label>
                <label className="block font-bold text-slate-700">
                  E-MAIL
                  <input type="email" value={itemEditando.email || ''} onChange={(e) => setItemEditando({ ...itemEditando, email: e.target.value })} className="mt-1 w-full border rounded-xl p-2.5 font-normal" />
                </label>
                <label className="block font-bold text-slate-700">
                  DATA DE NASCIMENTO
                  <input type="date" value={itemEditando.data_nascimento || ''} onChange={(e) => setItemEditando({ ...itemEditando, data_nascimento: e.target.value })} className="mt-1 w-full border rounded-xl p-2.5 bg-white font-normal" />
                </label>
                <label className="block font-bold text-slate-700">
                  ESTADO CIVIL
                  <select value={itemEditando.estado_civil || 'Solteiro(a)'} onChange={(e) => setItemEditando({ ...itemEditando, estado_civil: e.target.value })} className="mt-1 w-full border rounded-xl p-2.5 bg-white font-normal">
                    <option value="Solteiro(a)">Solteiro(a)</option>
                    <option value="Casado(a)">Casado(a)</option>
                    <option value="Divorciado(a)">Divorciado(a)</option>
                    <option value="Viúvo(a)">Viúvo(a)</option>
                  </select>
                </label>
                <label className="block font-bold text-slate-700">
                  BAIRRO
                  <input value={itemEditando.bairro || ''} onChange={(e) => setItemEditando({ ...itemEditando, bairro: e.target.value })} className="mt-1 w-full border rounded-xl p-2.5 font-normal" />
                </label>
                <label className="block font-bold text-slate-700">
                  CIDADE
                  <input value={itemEditando.cidade || ''} onChange={(e) => setItemEditando({ ...itemEditando, cidade: e.target.value })} className="mt-1 w-full border rounded-xl p-2.5 font-normal" />
                </label>
              </div>

              <div className="border-t pt-4 flex gap-2 justify-end">
                <button type="button" onClick={() => setItemEditando(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow cursor-pointer">
                  💾 Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETALHES */}
      {itemDetalhes && (
        <div className="fixed inset-0 bg-slate-900/90 z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-8 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-blue-900">Ficha do Cadastro</h3>
              <button type="button" onClick={() => setItemDetalhes(null)} className="px-3 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 font-bold text-xs rounded-xl cursor-pointer">
                ✕ Fechar
              </button>
            </div>
            {itemDetalhes.carregando ? (
              <p className="text-xs text-slate-400">Carregando...</p>
            ) : (
              <div className="space-y-2 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl"><strong className="block text-slate-400">NOME</strong>{nomeBonito(itemDetalhes.nome)}</div>
                <div className="bg-slate-50 p-3 rounded-xl"><strong className="block text-slate-400">TIPO</strong>{itemDetalhes.tipo_cadastro || 'Membro'}</div>
                <div className="bg-slate-50 p-3 rounded-xl"><strong className="block text-slate-400">TELEFONE</strong>{itemDetalhes.celular_principal || '-'}</div>
                <div className="bg-slate-50 p-3 rounded-xl"><strong className="block text-slate-400">E-MAIL</strong>{itemDetalhes.email || '-'}</div>
                <div className="bg-slate-50 p-3 rounded-xl"><strong className="block text-slate-400">NASCIMENTO</strong>{itemDetalhes.data_nascimento ? itemDetalhes.data_nascimento.split('-').reverse().join('/') : '-'}</div>
                <div className="bg-slate-50 p-3 rounded-xl"><strong className="block text-slate-400">CPF / RG</strong>{itemDetalhes.cpf || '-'} / {itemDetalhes.rg || '-'}</div>
                <div className="bg-slate-50 p-3 rounded-xl"><strong className="block text-slate-400">ENDEREÇO</strong>{[itemDetalhes.rua, itemDetalhes.numero, itemDetalhes.bairro, itemDetalhes.cidade, itemDetalhes.estado].filter(Boolean).join(', ') || '-'}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
