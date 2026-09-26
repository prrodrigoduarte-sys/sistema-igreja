import React, { useState } from 'react';
import UsuariosModule from './UsuariosModule';
import CadastroIgrejaModule from './CadastroIgrejaModule';
import ControleRegistroModule from './ControleRegistroModule';
import { supabase } from './supabase';

interface ConfiguracoesModuleProps {
  loggedUser: any;
}

export default function ConfiguracoesModule({ loggedUser }: ConfiguracoesModuleProps) {
  // Sub-abas internas do módulo de Configurações
  const [subAbaAtiva, setSubAbaAtiva] = useState<'usuarios' | 'igreja' | 'registro' | 'backup'>('usuarios');

  const [loadingBackup, setLoadingBackup] = useState(false);
  const [loadingRestore, setLoadingRestore] = useState(false);
  const [arquivoRestore, setArquivoRestore] = useState<File | null>(null);
  const [senhaAdm, setSenhaAdm] = useState('');

  const codigoIgreja = loggedUser?.codigo_igreja || loggedUser?.igrejas?.codigo_igreja || 'IGR-001';
  const emailUsuarioLogado = loggedUser?.usuario || loggedUser?.email || 'admin@sistema.com';

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
      console.error('Erro ao registrar log:', err);
    }
  };

  // Rotina de Backup Completo de Todas as Tabelas
  const realizarBackup = async () => {
    setLoadingBackup(true);
    try {
      const resMembers = await supabase.from('members').select('*').eq('codigo_igreja', codigoIgreja);
      const resUsuarios = await supabase.from('usuarios').select('*').eq('codigo_igreja', codigoIgreja);
      const resPermissoes = await supabase.from('permissoes_usuario').select('*');
      const resMinisterios = await supabase.from('ministerios').select('*').eq('codigo_igreja', codigoIgreja);
      const resFornecedores = await supabase.from('fornecedores').select('*').eq('codigo_igreja', codigoIgreja);
      const resCelulas = await supabase.from('celulas').select('*').eq('codigo_igreja', codigoIgreja);
      const resAgenda = await supabase.from('agenda').select('*').eq('codigo_igreja', codigoIgreja);
      const resProjetos = await supabase.from('projetos').select('*').eq('codigo_igreja', codigoIgreja);
      const resChat = await supabase.from('chat_mensagens').select('*').eq('codigo_igreja', codigoIgreja);
      const resLancamentos = await supabase.from('lancamentos_financeiros').select('*').eq('codigo_igreja', codigoIgreja);
      const resPlanoContas = await supabase.from('plano_contas_contabil').select('*').eq('codigo_igreja', codigoIgreja);
      const resContasFin = await supabase.from('contas_financeiras').select('*').eq('codigo_igreja', codigoIgreja);
      const resLogs = await supabase.from('logs_sistema').select('*').eq('codigo_igreja', codigoIgreja);

      const dadosBackup = {
        versao: '2.0',
        codigo_igreja: codigoIgreja,
        data_geracao: new Date().toISOString(),
        tabelas: {
          members: resMembers.data || [],
          usuarios: resUsuarios.data || [],
          permissoes_usuario: resPermissoes.data || [],
          ministerios: resMinisterios.data || [],
          fornecedores: resFornecedores.data || [],
          celulas: resCelulas.data || [],
          agenda: resAgenda.data || [],
          projetos: resProjetos.data || [],
          chat_mensagens: resChat.data || [],
          lancamentos_financeiros: resLancamentos.data || [],
          plano_contas_contabil: resPlanoContas.data || [],
          contas_financeiras: resContasFin.data || [],
          logs_sistema: resLogs.data || [],
        },
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dadosBackup, null, 2));
      const dataAtual = new Date().toISOString().split('T')[0];
      const nomeArquivo = `backup_completo_igreja_${codigoIgreja}_${dataAtual}.json`;

      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", nomeArquivo);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      await registrarLog('BACKUP_SISTEMA', `Backup completo executado com sucesso para a data ${dataAtual}`);
      alert(`✅ Backup completo gerado com sucesso! Ficheiro: ${nomeArquivo}`);
    } catch (err: any) {
      alert('Erro ao gerar backup: ' + err.message);
    } finally {
      setLoadingBackup(false);
    }
  };

  // Rotina de Restore Completo
  const realizarRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arquivoRestore) {
      alert('Selecione um ficheiro de backup válido (.json).');
      return;
    }

    if (!window.confirm('⚠️ ATENÇÃO: Restaurar um backup completo irá atualizar e mesclar os dados de todas as tabelas atuais da igreja. Deseja continuar?')) {
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
        setLoadingRestore(false);
        return;
      }

      const fileReader = new FileReader();
      fileReader.readAsText(arquivoRestore, "UTF-8");
      
      fileReader.onload = async (event) => {
        try {
          const conteudoJson = JSON.parse(event.target?.result as string);

          if (!conteudoJson.tabelas || conteudoJson.codigo_igreja !== codigoIgreja) {
            alert('Ficheiro de backup inválido ou incompatível com a igreja atual!');
            setLoadingRestore(false);
            return;
          }

          const {
            members,
            usuarios,
            permissoes_usuario,
            ministerios,
            fornecedores,
            celulas,
            agenda,
            projetos,
            chat_mensagens,
            plano_contas_contabil,
            contas_financeiras,
            lancamentos_financeiros,
            logs_sistema
          } = conteudoJson.tabelas;

          const tabelasParaRestaurar = [
            { nome: 'members', dados: members },
            { nome: 'usuarios', dados: usuarios },
            { nome: 'permissoes_usuario', dados: permissoes_usuario },
            { nome: 'ministerios', dados: ministerios },
            { nome: 'fornecedores', dados: fornecedores },
            { nome: 'celulas', dados: celulas },
            { nome: 'agenda', dados: agenda },
            { nome: 'projetos', dados: projetos },
            { nome: 'chat_mensagens', dados: chat_mensagens },
            { nome: 'plano_contas_contabil', dados: plano_contas_contabil },
            { nome: 'contas_financeiras', dados: contas_financeiras },
            { nome: 'lancamentos_financeiros', dados: lancamentos_financeiros },
            { nome: 'logs_sistema', dados: logs_sistema }
          ];

          for (const t of tabelasParaRestaurar) {
            if (t.dados && Array.isArray(t.dados) && t.dados.length > 0) {
              for (const item of t.dados) {
                await supabase.from(t.nome).upsert(item);
              }
            }
          }

          await registrarLog('RESTORE_SISTEMA', `Restauração completa de dados executada com sucesso a partir do ficheiro: ${arquivoRestore.name}`);
          alert('✅ Sistema restaurado com sucesso a partir do backup completo!');
          setArquivoRestore(null);
          setSenhaAdm('');
        } catch (parseErr: any) {
          alert('Erro ao processar o ficheiro JSON: ' + parseErr.message);
        } finally {
          setLoadingRestore(false);
        }
      };

    } catch (err: any) {
      alert('Erro na restauração: ' + err.message);
      setLoadingRestore(false);
    }
  };

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
          <button
            type="button"
            onClick={() => setSubAbaAtiva('usuarios')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              subAbaAtiva === 'usuarios' ? 'bg-blue-900 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            👥 Controle de Usuários
          </button>
          <button
            type="button"
            onClick={() => setSubAbaAtiva('igreja')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              subAbaAtiva === 'igreja' ? 'bg-blue-900 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            🏛️ Cadastro da Igreja
          </button>
          <button
            type="button"
            onClick={() => setSubAbaAtiva('registro')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              subAbaAtiva === 'registro' ? 'bg-blue-900 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            🔒 Controle de Registro
          </button>
          <button
            type="button"
            onClick={() => setSubAbaAtiva('backup')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              subAbaAtiva === 'backup' ? 'bg-blue-900 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            📦 Backup e Restauração
          </button>
        </div>
      </div>

      {/* Renderização da sub-aba ativa */}
      <div className="pt-2">
        {subAbaAtiva === 'usuarios' && <UsuariosModule loggedUser={loggedUser} />}
        {subAbaAtiva === 'igreja' && <CadastroIgrejaModule loggedUser={loggedUser} />}
        {subAbaAtiva === 'registro' && <ControleRegistroModule loggedUser={loggedUser} />}

        {subAbaAtiva === 'backup' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bloco de Backup */}
            <div className="bg-slate-50 border p-6 rounded-3xl space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-2xl">📦</span>
                <h3 className="font-bold text-slate-800 text-base">Backup Completo do Sistema</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Gera um ficheiro contendo todas as tabelas do sistema (membros, financeiro, células, ministérios, chat, projetos, agenda e configurações) pronto para ser guardado.
                </p>
              </div>
              <button
                type="button"
                onClick={realizarBackup}
                disabled={loadingBackup}
                className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow cursor-pointer transition text-xs flex items-center justify-center gap-2"
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
                  Selecione um ficheiro de backup completo com extensão <code>.json</code> para restaurar todas as tabelas com segurança.
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
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow cursor-pointer transition text-xs flex items-center justify-center gap-2"
                >
                  {loadingRestore ? 'A restaurar...' : '🔄 Restaurar Sistema Completo'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}