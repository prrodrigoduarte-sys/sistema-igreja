// src/ProjetosModule.tsx

import React, { useEffect, useState } from 'react';
import { supabase } from './supabase'; // Verifique se o caminho para 'supabase' está correto

// Definição das propriedades (props) que este componente receberá
interface ProjetosModuleProps {
  loggedUser: any; // O objeto do usuário logado é essencial para carregar os projetos
}

// Definição do componente ProjetosModule
export default function ProjetosModule({ loggedUser }: ProjetosModuleProps) {
  // ESTADOS LOCAIS DO MÓDULO DE PROJETOS - ATUALIZADO EM 02/09/2026
  const [projetosList, setProjetosList] = useState<any[]>([]);
  const [loadingProjetos, setLoadingProjetos] = useState(true);
  const [showProjetoModal, setShowProjetoModal] = useState(false); // Usado para o modal de cadastro
  const [formProjNome, setFormProjNome] = useState(''); // Usado no formulário do modal
  const [editingProjeto, setEditingProjeto] = useState<any>(null); // Se houver edição de projeto

  // FUNÇÃO PARA CARREGAR OS PROJETOS
  const carregarProjetos = async () => {
    setLoadingProjetos(true);
    try {
      const codIgreja = loggedUser?.codigo_igreja; // Usamos o código da igreja do loggedUser
      if (!codIgreja) {
        console.warn('Código da igreja não disponível para carregar projetos.');
        setProjetosList([]);
        setLoadingProjetos(false);
        return;
      }

      const { data, error } = await supabase
        .from('projetos_igreja') // Nome da tabela atualizado para 'projetos_igreja'
        .select('*')
        .eq('codigo_igreja', codIgreja)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setProjetosList(data);
      } else if (error) {
        console.error('ERRO AO CARREGAR PROJETOS:', error);
        setProjetosList([]);
      }
    } catch (err) {
      console.error('ERRO INESPERADO AO CARREGAR PROJETOS:', err);
      setProjetosList([]);
    } finally {
      setLoadingProjetos(false);
    }
  };

  // EFEITO PARA CARREGAR PROJETOS QUANDO O COMPONENTE É MONTADO OU loggedUser MUDA
  useEffect(() => {
    if (loggedUser?.codigo_igreja) {
      carregarProjetos();
    }
  }, [loggedUser?.codigo_igreja]); // Dependência para recarregar se o código da igreja mudar

  // O JSX (o que será renderizado na tela) para o módulo de Projetos
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 max-w-5xl mx-auto">

      {/* CABEÇALHO E BOTÃO NOVO PROJETO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-3xl font-black text-blue-900 tracking-tight">🚀 GESTÃO DE PROJETOS</h2>
          <p className="text-xs font-semibold text-slate-500 mt-1">Projetos cadastrados e vinculados à instituição.</p>
        </div>
        <button
          onClick={() => {
            setEditingProjeto(null); // Limpa qualquer projeto em edição
            setFormProjNome(''); // Limpa o nome do formulário
            setShowProjetoModal(true); // Abre o modal de cadastro
          }}
          className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer whitespace-nowrap transition-all"
        >
          + NOVO PROJETO
        </button>
      </div>

      {/* TABELA DE LISTAGEM DE PROJETOS */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-3">📋 LISTA DE PROJETOS ATIVOS</h3>
        {loadingProjetos ? (
          <p className="text-center py-8 text-slate-500 font-medium">Carregando projetos...</p>
        ) : projetosList.length === 0 ? (
          <p className="text-center py-8 text-slate-400 font-medium">Nenhum projeto cadastrado para esta instituição.</p>
        ) : (
          <div className="overflow-x-auto border rounded-xl shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 border-b text-slate-700">
                <tr>
                  <th className="p-3.5 font-bold">NOME DO PROJETO</th>
                  <th className="p-3.5 font-bold">CÓDIGO DA IGREJA</th>
                  <th className="p-3.5 font-bold">DATA DE CRIAÇÃO</th>
                  <th className="p-3.5 font-bold text-right">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {projetosList.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-all">
                    <td className="p-3.5 font-bold text-slate-900">{p.nome_projeto || p.nome}</td>
                    <td className="p-3.5 font-mono text-xs text-slate-600 font-bold">{p.codigo_igreja}</td>
                    <td className="p-3.5 font-mono text-xs text-slate-600">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={async () => {
                          if (!confirm('Deseja realmente excluir este projeto?')) return;
                          try {
                            const { error } = await supabase.from('projetos_igreja').delete().eq('id', p.id);
                            if (!error) {
                              carregarProjetos(); // Recarrega a lista após a exclusão
                              alert('Projeto excluído com sucesso!');
                            } else {
                              alert('Erro ao excluir: ' + error.message);
                            }
                          } catch (err: any) {
                            alert('Erro: ' + err.message);
                          }
                        }}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs"
                      >
                        EXCLUIR
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE CADASTRO DE NOVO PROJETO */}
      {showProjetoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-xl text-blue-900">✨ CADASTRAR NOVO PROJETO</h3>
              <button onClick={() => setShowProjetoModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl cursor-pointer">✕</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!formProjNome.trim()) {
                alert('O nome do projeto é obrigatório.');
                return;
              }
              try {
                const { error } = await supabase.from('projetos_igreja').insert([
                  {
                    codigo_igreja: loggedUser.codigo_igreja,
                    nome_projeto: formProjNome.trim()
                  }
                ]);
                if (!error) {
                  setFormProjNome('');
                  setShowProjetoModal(false);
                  carregarProjetos(); // Recarrega a lista após o cadastro
                  alert('Projeto cadastrado com sucesso!');
                } else {
                  alert('Erro ao salvar projeto: ' + error.message);
                }
              } catch (err: any) {
                alert('Erro: ' + err.message);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">NOME DO PROJETO</label>
                <input
                  type="text"
                  required
                  value={formProjNome}
                  onChange={(e) => setFormProjNome(e.target.value)}
                  placeholder="Ex: Reforma do Templo"
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowProjetoModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-all"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md transition-all"
                >
                  SALVAR PROJETO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}