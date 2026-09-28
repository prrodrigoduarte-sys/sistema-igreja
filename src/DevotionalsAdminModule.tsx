import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

interface DevotionalRecord {
  id: string;
  publish_date: string;
  title: string;
  verse_reference: string;
  passage_text: string | null;
  content_html: string;
  author_name: string;
  is_published: boolean;
  views_count: number;
  created_at?: string;
}

interface Props {
  loggedUser?: any;
}

export default function DevotionalsAdminModule({ loggedUser }: Props) {
  const [devotionals, setDevotionals] = useState<DevotionalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Estados do Formulário
  const [publishDate, setPublishDate] = useState(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [verseReference, setVerseReference] = useState('');
  const [passageText, setPassageText] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [authorName, setAuthorName] = useState('Pastor / Equipe Pastoral');
  const [isPublished, setIsPublished] = useState(true);

  // Carregar todos os devocionais para o painel de controle
  const fetchDevotionals = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('devotionals')
        .select('*')
        .order('publish_date', { ascending: false });

      if (error) throw error;
      if (data) setDevotionals(data);
    } catch (err: any) {
      alert('Erro ao carregar devocionais: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevotionals();
  }, [fetchDevotionals]);

  // Limpar formulário e abrir modal para criação
  const handleAbrirCriar = () => {
    setEditingId(null);
    setPublishDate(new Date().toISOString().split('T')[0]);
    setTitle('');
    setVerseReference('');
    setPassageText('');
    setContentHtml('');
    setAuthorName('Pastor / Equipe Pastoral');
    setIsPublished(true);
    setModalOpen(true);
  };

  // Carregar dados no formulário e abrir modal para edição
  const handleAbrirEditar = (item: DevotionalRecord) => {
    setEditingId(item.id);
    setPublishDate(item.publish_date || new Date().toISOString().split('T')[0]);
    setTitle(item.title || '');
    setVerseReference(item.verse_reference || '');
    setPassageText(item.passage_text || '');
    setContentHtml(item.content_html || '');
    setAuthorName(item.author_name || 'Pastor / Equipe Pastoral');
    setIsPublished(item.is_published ?? true);
    setModalOpen(true);
  };

  // Salvar (Inserir ou Atualizar)
  const handleSalvarDevocional = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !verseReference.trim() || !contentHtml.trim()) {
      alert('Por favor, preencha o Título, Referência e o Conteúdo da Reflexão.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        publish_date: publishDate,
        title: title.trim(),
        verse_reference: verseReference.trim(),
        passage_text: passageText.trim() || null,
        content_html: contentHtml.trim(),
        author_name: authorName.trim() || 'Pastor / Equipe Pastoral',
        is_published: isPublished,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        // Editar existente
        const { error } = await supabase
          .from('devotionals')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
        alert('✏️ Devocional atualizado com sucesso!');
      } else {
        // Criar novo
        const { error } = await supabase
          .from('devotionals')
          .insert([payload]);

        if (error) throw error;
        alert('✅ Novo Devocional publicado com sucesso!');
      }

      setModalOpen(false);
      fetchDevotionals();
    } catch (err: any) {
      alert('Erro ao salvar devocional: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Alternar Publicado/Rascunho diretamente na tabela
  const handleTogglePublicado = async (item: DevotionalRecord) => {
    try {
      const { error } = await supabase
        .from('devotionals')
        .update({ is_published: !item.is_published })
        .eq('id', item.id);

      if (error) throw error;
      fetchDevotionals();
    } catch (err: any) {
      alert('Erro ao alterar status: ' + err.message);
    }
  };

  // Excluir devocional
  const handleExcluir = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este devocional?')) return;

    try {
      const { error } = await supabase
        .from('devotionals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Devocional excluído.');
      fetchDevotionals();
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6">
      {/* Cabeçalho do Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            📖 Gestão de Devocionais Diários
          </h1>
          <p className="text-xs text-slate-500">
            Cadastre, edite e agende as palavras devocionais para os membros no App Mobile.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAbrirCriar}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow cursor-pointer text-xs flex items-center justify-center gap-2 transition"
        >
          ➕ Novo Devocional
        </button>
      </div>

      {/* Lista de Devocionais */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-xs text-slate-500">Carregando devocionais...</p>
        ) : devotionals.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <span className="text-3xl">📖</span>
            <p className="font-bold text-slate-700 text-sm">Nenhum devocional cadastrado.</p>
            <p className="text-xs text-slate-400">Clique no botão acima para adicionar a palavra do dia.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3">Data de Publicação</th>
                  <th className="p-3">Título / Referência</th>
                  <th className="p-3">Autor</th>
                  <th className="p-3 text-center">Visualizações</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {devotionals.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-blue-900">
                      📅 {item.publish_date.split('-').reverse().join('/')}
                    </td>
                    <td className="p-3 space-y-0.5">
                      <p className="font-bold text-slate-800">{item.title}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{item.verse_reference}</p>
                    </td>
                    <td className="p-3 text-slate-600">{item.author_name}</td>
                    <td className="p-3 text-center font-bold text-slate-700">
                      👁️ {item.views_count || 0}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleTogglePublicado(item)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer transition ${
                          item.is_published
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {item.is_published ? '🟢 Publicado' : '🟡 Rascunho'}
                      </button>
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleAbrirEditar(item)}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-lg cursor-pointer transition text-[10px]"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExcluir(item.id)}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg cursor-pointer transition text-[10px]"
                      >
                        🗑️ Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE CRIAÇÃO / EDIÇÃO */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 space-y-4 text-xs shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-blue-900 text-base">
                {editingId ? '✏️ Editar Devocional' : '➕ Novo Devocional'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarDevocional} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data de Publicação *</label>
                  <input
                    type="date"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    className="w-full border rounded-xl p-2 font-semibold text-slate-800 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Autor / Preletor</label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Ex: Pastor João"
                    className="w-full border rounded-xl p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Título do Devocional *</label>
                <input
                  type="text"
                  placeholder="Ex: O Poder da Oração Diária"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border rounded-xl p-2 font-bold text-slate-800 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Referência Bíblica *</label>
                <input
                  type="text"
                  placeholder="Ex: Salmos 23:1-3 ou Mateus 28:18-19"
                  value={verseReference}
                  onChange={(e) => setVerseReference(e.target.value)}
                  className="w-full border rounded-xl p-2 text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Texto / Versículo em Destaque</label>
                <textarea
                  placeholder="Cole o texto bíblico em destaque (opcional)"
                  value={passageText}
                  onChange={(e) => setPassageText(e.target.value)}
                  className="w-full border rounded-xl p-2 text-xs"
                  rows={2}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Conteúdo da Reflexão *</label>
                <textarea
                  placeholder="Escreva aqui a mensagem devocional diária..."
                  value={contentHtml}
                  onChange={(e) => setContentHtml(e.target.value)}
                  className="w-full border rounded-xl p-2.5 text-xs leading-relaxed"
                  rows={6}
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 text-blue-900 rounded cursor-pointer"
                />
                <label htmlFor="is_published" className="font-bold text-slate-700 cursor-pointer">
                  Publicar imediatamente no App Mobile
                </label>
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-1/2 py-2.5 bg-slate-100 font-bold rounded-xl cursor-pointer hover:bg-slate-200 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-1/2 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow cursor-pointer text-xs disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Publicar Devocional'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}