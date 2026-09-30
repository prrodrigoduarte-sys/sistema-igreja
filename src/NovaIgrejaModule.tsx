import React, { useCallback, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

// Cadastro de novas igrejas (multiempresa).
// Cada igreja é separada pelo codigo_igreja: uma igreja nova já começa vazia, não é preciso apagar nada.
// Só os administradores da igreja principal (IGREJA_MATRIZ) veem e usam esta tela.

export const IGREJA_MATRIZ = 'IGR-001';

interface Props {
  loggedUser: any;
}

interface IgrejaResumo {
  codigo: string;
  nome: string;
  usuarios: number;
}

// Próximo código livre: IGR-001, IGR-002, ... (pega o maior número já usado e soma 1)
const proximoCodigo = (codigos: string[]) => {
  const numeros = codigos.map((c) => Number((/^IGR-(\d+)$/i.exec(c || '') || [])[1] || 0));
  const proximo = Math.max(0, ...numeros) + 1;
  return `IGR-${String(proximo).padStart(3, '0')}`;
};

// Cliente separado para criar a conta do novo administrador SEM trocar o login de quem está usando o sistema
const clienteSemSessao = () => {
  const s: any = supabase;
  return createClient(s.supabaseUrl, s.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'cadastro-nova-igreja' },
  });
};

export default function NovaIgrejaModule({ loggedUser }: Props) {
  const ehAdmin = loggedUser?.perfil === 'admin' || loggedUser?.perfil === 'administrador';
  const codigoAtual = loggedUser?.codigo_igreja || IGREJA_MATRIZ;
  const podeCriar = ehAdmin && codigoAtual === IGREJA_MATRIZ;
  const emailLogado = loggedUser?.email || loggedUser?.usuario || '';

  const [igrejas, setIgrejas] = useState<IgrejaResumo[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; texto: string } | null>(null);

  const [codigo, setCodigo] = useState('');
  const [nomeIgreja, setNomeIgreja] = useState('');
  const [nomeAdmin, setNomeAdmin] = useState('');
  const [emailAdmin, setEmailAdmin] = useState('');
  const [senhaInicial, setSenhaInicial] = useState('');
  const [copiarPlano, setCopiarPlano] = useState(true);
  const [senhaConfirmacao, setSenhaConfirmacao] = useState('');

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [resIgr, resUsu] = await Promise.all([
      supabase.from('igrejas').select('*'),
      supabase.from('usuarios').select('codigo_igreja'),
    ]);
    const contagem: Record<string, number> = {};
    (resUsu.data || []).forEach((u: any) => {
      if (u.codigo_igreja) contagem[u.codigo_igreja] = (contagem[u.codigo_igreja] || 0) + 1;
    });
    const mapa: Record<string, IgrejaResumo> = {};
    (resIgr.data || []).forEach((i: any) => {
      if (!i.codigo_igreja) return;
      mapa[i.codigo_igreja] = {
        codigo: i.codigo_igreja,
        nome: i.nome_fantasia || i.razao_social || i.nome || '(sem nome)',
        usuarios: contagem[i.codigo_igreja] || 0,
      };
    });
    // Igrejas que têm usuários mas ainda não foram cadastradas na tabela igrejas
    Object.keys(contagem).forEach((c) => {
      if (!mapa[c]) mapa[c] = { codigo: c, nome: '(cadastro da igreja não preenchido)', usuarios: contagem[c] };
    });
    const lista = Object.values(mapa).sort((a, b) => a.codigo.localeCompare(b.codigo));
    setIgrejas(lista);
    setCodigo((atual) => atual || proximoCodigo(lista.map((i) => i.codigo)));
    setCarregando(false);
  }, []);

  useEffect(() => {
    if (podeCriar) carregar();
  }, [podeCriar, carregar]);

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    setResultado(null);

    const cod = codigo.trim().toUpperCase();
    const email = emailAdmin.trim().toLowerCase();
    if (!/^[A-Z0-9-]{3,20}$/.test(cod)) return alert('Código inválido. Use letras, números e hífen (ex.: IGR-002).');
    if (igrejas.some((i) => i.codigo === cod)) return alert(`O código ${cod} já está em uso. Escolha outro.`);
    if (senhaInicial.length < 6) return alert('A senha inicial do administrador precisa ter pelo menos 6 caracteres.');

    setSalvando(true);
    try {
      // 1) Confirma que é mesmo o administrador que está pedindo
      const { error: erroSenha } = await supabase.auth.signInWithPassword({ email: emailLogado, password: senhaConfirmacao });
      if (erroSenha) throw new Error('Sua senha de administrador está incorreta.');

      // 2) Registra a igreja
      const { error: erroIgreja } = await supabase
        .from('igrejas')
        .insert([{ codigo_igreja: cod, nome_fantasia: nomeIgreja.trim(), razao_social: nomeIgreja.trim() }]);
      if (erroIgreja) throw new Error('Não foi possível registrar a igreja: ' + erroIgreja.message);

      // 3) Cria o login do administrador da nova igreja (sem desconectar você)
      const { data: dadosAuth, error: erroAuth } = await clienteSemSessao().auth.signUp({ email, password: senhaInicial });
      if (erroAuth) throw new Error('A igreja foi registrada, mas o login do administrador não foi criado: ' + erroAuth.message);

      // 4) Perfil de administrador na nova igreja
      const { error: erroUsuario } = await supabase.from('usuarios').insert([
        {
          auth_user_id: dadosAuth.user?.id || null,
          email,
          nome_usuario: nomeAdmin.trim(),
          codigo_igreja: cod,
          perfil: 'administrador',
          ativo: true,
        },
      ]);
      if (erroUsuario) throw new Error('O login foi criado, mas o perfil de administrador não foi salvo: ' + erroUsuario.message);

      // 5) Opcional: copia o Plano de Contas desta igreja para a nova
      let copiadas = 0;
      if (copiarPlano) {
        const { data: plano } = await supabase.from('plano_contas_contabil').select('*').eq('codigo_igreja', codigoAtual);
        const novas = (plano || []).map(({ id, created_at, updated_at, ...resto }: any) => ({ ...resto, codigo_igreja: cod, conta_pai: null }));
        if (novas.length) {
          const { error: erroPlano } = await supabase.from('plano_contas_contabil').insert(novas);
          if (!erroPlano) copiadas = novas.length;
        }
      }

      await supabase.from('logs_sistema').insert([
        { codigo_igreja: codigoAtual, usuario_email: emailLogado, acao: 'NOVA_IGREJA', detalhes: `Criou a igreja ${cod} (${nomeIgreja.trim()}) com o administrador ${email}` },
      ]);

      const precisaConfirmar = !dadosAuth.session;
      setResultado({
        ok: true,
        texto:
          `Igreja ${cod} criada! O administrador ${email} já pode entrar no sistema com a senha inicial` +
          (precisaConfirmar ? ' (antes, ele precisa confirmar o e-mail que o Supabase enviou)' : '') +
          '.' +
          (copiadas ? ` ${copiadas} contas do Plano de Contas foram copiadas.` : ''),
      });
      setNomeIgreja('');
      setNomeAdmin('');
      setEmailAdmin('');
      setSenhaInicial('');
      setSenhaConfirmacao('');
      setCodigo('');
      carregar();
    } catch (err: any) {
      setResultado({ ok: false, texto: err.message || String(err) });
    } finally {
      setSalvando(false);
    }
  };

  if (!podeCriar) {
    return (
      <div className="bg-slate-50 border rounded-2xl p-6 text-center text-sm text-slate-600">
        🔒 Apenas o administrador da igreja principal ({IGREJA_MATRIZ}) pode cadastrar novas igrejas.
      </div>
    );
  }

  const campo = 'w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600 bg-white';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* FORMULÁRIO */}
      <form onSubmit={criar} className="lg:col-span-3 bg-slate-50 border rounded-3xl p-5 space-y-4">
        <div>
          <h3 className="font-black text-blue-900 text-lg">➕ Nova Igreja</h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            A nova igreja começa <strong>vazia</strong> (sem membros, lançamentos, células etc.) e só enxerga os próprios dados.
            Nada desta igreja é apagado nem compartilhado.
          </p>
        </div>

        {resultado && (
          <div
            className={`p-3 rounded-xl text-sm border ${
              resultado.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {resultado.ok ? '✅ ' : '⚠️ '}
            {resultado.texto}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="block text-xs font-bold text-slate-700">
            Código *
            <input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} className={`${campo} mt-1 font-black text-blue-900`} required />
          </label>
          <label className="block sm:col-span-2 text-xs font-bold text-slate-700">
            Nome da igreja *
            <input value={nomeIgreja} onChange={(e) => setNomeIgreja(e.target.value)} placeholder="Ex.: Igreja Vida e Paz - Sede Norte" className={`${campo} mt-1`} required />
          </label>
        </div>

        <div className="border-t pt-4 space-y-3">
          <p className="text-xs font-black text-slate-800 uppercase">Administrador da nova igreja</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-xs font-bold text-slate-700">
              Nome *
              <input value={nomeAdmin} onChange={(e) => setNomeAdmin(e.target.value)} className={`${campo} mt-1`} required />
            </label>
            <label className="block text-xs font-bold text-slate-700">
              E-mail *
              <input type="email" value={emailAdmin} onChange={(e) => setEmailAdmin(e.target.value)} className={`${campo} mt-1`} required />
            </label>
          </div>
          <label className="block text-xs font-bold text-slate-700">
            Senha inicial (mín. 6 caracteres) *
            <input
              type="text"
              value={senhaInicial}
              onChange={(e) => setSenhaInicial(e.target.value)}
              placeholder="Passe para o administrador; ele pode trocar depois"
              className={`${campo} mt-1`}
              autoComplete="off"
              required
            />
          </label>
        </div>

        <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
          <input type="checkbox" checked={copiarPlano} onChange={(e) => setCopiarPlano(e.target.checked)} className="w-4 h-4 mt-0.5" />
          <span>
            <strong>Copiar o Plano de Contas desta igreja</strong>
            <span className="block text-xs text-slate-500">A nova igreja já começa com as contas contábeis prontas (sem nenhum lançamento).</span>
          </span>
        </label>

        <div className="border-t pt-4">
          <label className="block text-xs font-bold text-rose-700">
            Sua senha de administrador (para confirmar) *
            <input type="password" value={senhaConfirmacao} onChange={(e) => setSenhaConfirmacao(e.target.value)} className={`${campo} mt-1 border-rose-300`} required />
          </label>
        </div>

        <button type="submit" disabled={salvando} className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow cursor-pointer disabled:opacity-60">
          {salvando ? 'Criando igreja...' : '➕ Criar Igreja'}
        </button>
      </form>

      {/* LISTA + EXPLICAÇÃO */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white border rounded-3xl p-5">
          <h3 className="font-black text-blue-900">🏢 Igrejas cadastradas</h3>
          {carregando && igrejas.length === 0 ? (
            <p className="text-xs text-slate-400 mt-3">Carregando...</p>
          ) : (
            <ul className="mt-3 divide-y">
              {igrejas.map((i) => (
                <li key={i.codigo} className="py-2 flex items-center justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block font-black text-sm text-slate-800">
                      {i.codigo}
                      {i.codigo === codigoAtual && <span className="ml-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">esta</span>}
                    </span>
                    <span className="block text-xs text-slate-500 truncate">{i.nome}</span>
                  </span>
                  <span className="text-[11px] text-slate-500 shrink-0">{i.usuarios} usuário(s)</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 text-xs text-amber-900 space-y-2 leading-relaxed">
          <p className="font-black">Como funciona</p>
          <p>• Todas as igrejas usam o mesmo banco. Cada informação é marcada com o código da igreja, e cada uma só vê o que é seu.</p>
          <p>• Por isso <strong>não é preciso zerar nenhuma tabela</strong>: a igreja nova simplesmente ainda não tem dados.</p>
          <p>
            • Os arquivos enviados (comprovantes, fotos) já são guardados numa pasta com o código da igreja. A pasta da igreja nova aparece sozinha no
            primeiro envio.
          </p>
          <p>• O administrador da nova igreja cadastra os próprios usuários em Configurações → Controle de Usuários.</p>
        </div>
      </div>
    </div>
  );
}
