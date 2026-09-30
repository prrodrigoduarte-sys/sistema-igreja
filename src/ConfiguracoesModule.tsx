import React, { useState } from 'react';
import UsuariosModule from './UsuariosModule';
import CadastroIgrejaModule from './CadastroIgrejaModule';
import ControleRegistroModule from './ControleRegistroModule';
import NovaIgrejaModule, { IGREJA_MATRIZ } from './NovaIgrejaModule';
import { supabase } from './supabase';

interface ConfiguracoesModuleProps {
  loggedUser: any;
}

// Tabelas que entram no backup/restauração. Todas têm codigo_igreja: cada igreja só exporta e restaura o que é seu.
// A ordem importa na restauração (primeiro o que as outras tabelas usam).
const TABELAS_BACKUP = [
  'igrejas',
  'dados_igreja',
  'usuarios',
  'permissoes_usuario',
  'members',
  'ministerios',
  'fornecedores',
  'redes',
  'setores',
  'celulas',
  'reunioes_celulas',
  'discipulado_dea',
  'agenda',
  'agenda_compromissos',
  'agenda_mobile',
  'projetos',
  'projetos_igreja',
  'despesas_projetos',
  'inscricoes_projetos',
  'plano_contas_contabil',
  'contas_financeiras',
  'contas_correntes',
  'lancamentos_financeiros',
  'partidas_contabeis',
  'produtos',
  'vendas',
  'devotionals',
  'balcao_config',
  'balcao_publicacoes',
  'chat_mensagens',
  'logs_sistema',
];

const POR_PAGINA = 1000; // o Supabase entrega no máximo 1000 linhas por consulta

export default function ConfiguracoesModule({ loggedUser }: ConfiguracoesModuleProps) {
  // Sub-abas internas do módulo de Configurações
  const [subAbaAtiva, setSubAbaAtiva] = useState<'usuarios' | 'igreja' | 'registro' | 'backup' | 'igrejas'>('usuarios');

  const [loadingBackup, setLoadingBackup] = useState(false);
  const [loadingRestore, setLoadingRestore] = useState(false);
  const [progresso, setProgresso] = useState('');
  const [arquivoRestore, setArquivoRestore] = useState<File | null>(null);
  const [senhaAdm, setSenhaAdm] = useState('');

  const codigoIgreja = loggedUser?.codigo_igreja || loggedUser?.igrejas?.codigo_igreja || 'IGR-001';
  const emailUsuarioLogado = loggedUser?.usuario || loggedUser?.email || 'admin@sistema.com';
  const ehAdmin = loggedUser?.perfil === 'admin' || loggedUser?.perfil === 'administrador';
  const veIgrejas = ehAdmin && codigoIgreja === IGREJA_MATRIZ;

  const registrarLog = async (acao: string, detalhes: string) => {
    try {
      await supabase.from('logs_sistema').insert([
        {
          codigo_igreja: codigoIgreja,
          usuario_email: emailUsuarioLogado,
          acao,
          detalhes,
        },
      ]);
    } catch (err) {
      console.error('Erro ao registar log:', err);
    }
  };

  // Lê TODAS as linhas da igreja numa tabela, de 1000 em 1000
  const lerTabelaCompleta = async (tabela: string) => {
    const linhas: any[] = [];
    for (let inicio = 0; ; inicio += POR_PAGINA) {
      const { data, error } = await supabase
        .from(tabela)
        .select('*')
        .eq('codigo_igreja', codigoIgreja)
        .range(inicio, inicio + POR_PAGINA - 1);
      if (error) return { linhas, erro: error.message };
      linhas.push(...(data || []));
      if (!data || data.length < POR_PAGINA) return { linhas, erro: '' };
    }
  };

  // Rotina de Backup Completo (somente os dados desta igreja)
  const realizarBackup = async () => {
    setLoadingBackup(true);
    try {
      const tabelas: Record<string, any[]> = {};
      const ignoradas: string[] = [];
      for (const t of TABELAS_BACKUP) {
        setProgresso(`Copiando ${t}...`);
        const { linhas, erro } = await lerTabelaCompleta(t);
        if (erro) ignoradas.push(`${t} (${erro})`);
        else tabelas[t] = linhas;
      }

      const dadosBackup = {
        versao: '3.0',
        codigo_igreja: codigoIgreja,
        data_geracao: new Date().toISOString(),
        tabelas,
      };

      const blob = new Blob([JSON.stringify(dadosBackup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const dataAtual = new Date().toLocaleDateString('sv-SE'); // AAAA-MM-DD no fuso do aparelho
      const nomeFicheiro = `backup_completo_igreja_${codigoIgreja}_${dataAtual}.json`;

      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.download = nomeFicheiro;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      const totalLinhas = Object.values(tabelas).reduce((acc, l) => acc + l.length, 0);
      await registrarLog('BACKUP_SISTEMA', `Backup completo (${totalLinhas} registros) gerado em ${dataAtual}`);
      alert(
        `✅ Backup gerado: ${nomeFicheiro}\n${totalLinhas} registros de ${Object.keys(tabelas).length} tabelas.` +
          (ignoradas.length ? `\n\nTabelas que não puderam ser lidas:\n${ignoradas.join('\n')}` : '')
      );
    } catch (err: any) {
      alert('Erro ao gerar backup: ' + err.message);
    } finally {
      setLoadingBackup(false);
      setProgresso('');
    }
  };

  // Rotina de Restore Completo (só grava registros que pertencem a esta igreja)
  const realizarRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arquivoRestore) {
      alert('Selecione um ficheiro de backup válido (.json).');
      return;
    }

    if (!window.confirm('⚠️ ATENÇÃO: Restaurar um backup irá atualizar e mesclar os dados desta igreja com os do ficheiro. Deseja continuar?')) {
      return;
    }

    setLoadingRestore(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: emailUsuarioLogado,
        password: senhaAdm,
      });

      if (authError) {
        alert('Palavra-passe de administrador incorreta! Operação cancelada.');
        return;
      }

      const texto = await arquivoRestore.text();
      const conteudoJson = JSON.parse(texto);

      if (!conteudoJson.tabelas || conteudoJson.codigo_igreja !== codigoIgreja) {
        alert('Ficheiro de backup inválido ou de outra igreja! Só é possível restaurar backups desta igreja.');
        return;
      }

      const erros: string[] = [];
      let gravados = 0;
      for (const nome of TABELAS_BACKUP) {
        const dados = conteudoJson.tabelas[nome];
        if (!Array.isArray(dados) || dados.length === 0) continue;
        // Segurança: ignora qualquer linha que não seja desta igreja
        const daIgreja = dados.filter((l: any) => l && l.codigo_igreja === codigoIgreja);
        for (let i = 0; i < daIgreja.length; i += 500) {
          setProgresso(`Restaurando ${nome} (${Math.min(i + 500, daIgreja.length)}/${daIgreja.length})...`);
          const { error } = await supabase.from(nome).upsert(daIgreja.slice(i, i + 500));
          if (error) {
            erros.push(`${nome}: ${error.message}`);
            break;
          }
          gravados += Math.min(500, daIgreja.length - i);
        }
      }

      await registrarLog('RESTORE_SISTEMA', `Restauração de ${gravados} registros a partir do ficheiro: ${arquivoRestore.name}`);
      alert(
        `✅ Restauração concluída: ${gravados} registros.` + (erros.length ? `\n\nAlgumas tabelas deram erro:\n${erros.join('\n')}` : '')
      );
      setArquivoRestore(null);
      setSenhaAdm('');
    } catch (err: any) {
      alert('Erro na restauração: ' + err.message);
    } finally {
      setLoadingRestore(false);
      setProgresso('');
    }
  };

  const botaoAba = (id: typeof subAbaAtiva, rotulo: string) => (
    <button
      type="button"
      onClick={() => setSubAbaAtiva(id)}
      className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
        subAbaAtiva === id ? 'bg-blue-900 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      {rotulo}
    </button>
  );

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 w-full max-w-5xl mx-auto space-y-6">
      {/* Cabeçalho das Configurações */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-black text-blue-900 tracking-tight">⚙️ Painel de Configurações</h2>
        <p className="text-xs text-slate-500 mt-1">
          Gerenciamento completo de usuários, estrutura da igreja, registros e segurança de dados.
        </p>

        {/* Navegação entre as sub-abas de configurações */}
        <div className="flex flex-wrap gap-2 mt-4">
          {botaoAba('usuarios', '👥 Controle de Usuários')}
          {botaoAba('igreja', '🏛️ Cadastro da Igreja')}
          {botaoAba('registro', '🔒 Controle de Registro')}
          {botaoAba('backup', '📦 Backup e Restauração')}
          {veIgrejas && botaoAba('igrejas', '🏢 Igrejas (multiempresa)')}
        </div>
      </div>

      {/* Renderização da sub-aba ativa */}
      <div className="pt-2">
        {subAbaAtiva === 'usuarios' && <UsuariosModule loggedUser={loggedUser} />}
        {subAbaAtiva === 'igreja' && <CadastroIgrejaModule loggedUser={loggedUser} />}
        {subAbaAtiva === 'registro' && <ControleRegistroModule loggedUser={loggedUser} />}
        {subAbaAtiva === 'igrejas' && veIgrejas && <NovaIgrejaModule loggedUser={loggedUser} />}

        {subAbaAtiva === 'backup' && (
          <div className="space-y-4">
            {progresso && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold">⏳ {progresso}</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bloco de Backup */}
              <div className="bg-slate-50 border p-6 rounded-3xl space-y-4 shadow-sm flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-2xl">📦</span>
                  <h3 className="font-bold text-slate-800 text-base">Backup Completo desta Igreja</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Gera um ficheiro com <strong>todos os dados da igreja {codigoIgreja}</strong> (membros, financeiro, células, ministérios, chat,
                    projetos, agenda, devocionais e configurações). Os dados de outras igrejas não entram.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={realizarBackup}
                  disabled={loadingBackup}
                  className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow cursor-pointer transition text-xs flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loadingBackup ? 'A gerar Backup Completo...' : '📥 Fazer Backup Completo Agora'}
                </button>
              </div>

              {/* Bloco de Restore */}
              <div className="bg-slate-50 border p-6 rounded-3xl space-y-4 shadow-sm flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-2xl">♻️</span>
                  <h3 className="font-bold text-slate-800 text-base">Restaurar Sistema (Restore)</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Selecione um ficheiro de backup <strong>desta igreja</strong> com extensão <code>.json</code>. Registros de outras igrejas são ignorados.
                  </p>
                </div>

                <form onSubmit={realizarRestore} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ficheiro de Backup (.json) *</label>
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setArquivoRestore(e.target.files[0]);
                        }
                      }}
                      className="w-full border rounded-xl px-3 py-2 text-xs bg-white font-medium cursor-pointer"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-rose-700 uppercase mb-1">Palavra-passe de Administrador *</label>
                    <input
                      type="password"
                      value={senhaAdm}
                      onChange={(e) => setSenhaAdm(e.target.value)}
                      placeholder="A sua palavra-passe atual para autorizar"
                      className="w-full border border-rose-300 rounded-xl px-3 py-2 text-xs outline-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loadingRestore}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow cursor-pointer transition text-xs flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loadingRestore ? 'A restaurar...' : '🔄 Restaurar Sistema Completo'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
