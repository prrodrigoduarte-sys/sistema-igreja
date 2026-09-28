import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { supabase } from '../lib/supabase';
import { 
  Bold, Italic, List, ListOrdered, Quote, Calendar, 
  CheckCircle, AlertCircle, Trash2, Edit3, Plus, Sparkles 
} from 'lucide-react';

export function AdminDevotionalManager() {
  const [devotionals, setDevotionals] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [publishDate, setPublishDate] = useState(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [verseRef, setVerseRef] = useState('');
  const [passageText, setPassageText] = useState('');
  const [author, setAuthor] = useState('Equipe Pastoral');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Configuração do Editor Tiptap
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Escreva aqui a reflexão bíblica...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose focus:outline-none min-h-[180px] p-4 text-slate-700',
      },
    },
  });

  useEffect(() => {
    fetchDevotionals();
  }, []);

  async function fetchDevotionals() {
    setLoading(true);
    const { data, error } = await supabase
      .from('devotionals')
      .select('*')
      .order('publish_date', { ascending: false });
    
    if (!error && data) setDevotionals(data);
    setLoading(false);
  }

  function handleEdit(item) {
    setSelectedId(item.id);
    setPublishDate(item.publish_date);
    setTitle(item.title);
    setVerseRef(item.verse_reference);
    setPassageText(item.passage_text || '');
    setAuthor(item.author_name || 'Equipe Pastoral');
    editor?.commands.setContent(item.content_html);
  }

  function handleReset() {
    setSelectedId(null);
    setPublishDate(new Date().toISOString().split('T')[0]);
    setTitle('');
    setVerseRef('');
    setPassageText('');
    setAuthor('Equipe Pastoral');
    editor?.commands.setContent('<p>Escreva aqui a reflexão bíblica...</p>');
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!editor) return;

    setLoading(true);
    const htmlContent = editor.getHTML();

    const payload = {
      publish_date: publishDate,
      title,
      verse_reference: verseRef,
      passage_text: passageText,
      content_html: htmlContent,
      author_name: author,
      updated_at: new Date(),
    };

    let error;
    if (selectedId) {
      const res = await supabase.from('devotionals').update(payload).eq('id', selectedId);
      error = res.error;
    } else {
      const res = await supabase.from('devotionals').insert([payload]);
      error = res.error;
    }

    if (error) {
      setFeedback({ type: 'error', message: 'Erro ao salvar: ' + error.message });
    } else {
      setFeedback({ type: 'success', message: 'Devocional salvo e agendado com sucesso!' });
      handleReset();
      fetchDevotionals();
    }
    setLoading(false);
  }

  async function handleDelete(id) {
    if (window.confirm('Tem certeza de que deseja remover este devocional?')) {
      await supabase.from('devotionals').delete().eq('id', id);
      fetchDevotionals();
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Formulário Principal de Edição */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                {selectedId ? 'Editar Devocional' : 'Novo Devocional'}
              </h1>
              <p className="text-xs text-slate-500">Gestão de Conteúdo Pastoral</p>
            </div>
            {selectedId && (
              <button onClick={handleReset} className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
                <Plus className="w-4 h-4" /> Criar Novo
              </button>
            )}
          </div>

          {feedback && (
            <div className={`p-4 rounded-xl text-sm mb-6 flex items-center gap-2 ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
              {feedback.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              {feedback.message}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Data de Publicação</label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={publishDate} 
                    onChange={(e) => setPublishDate(e.target.value)} 
                    required 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Autor / Pregador</label>
                <input 
                  type="text" 
                  value={author} 
                  onChange={(e) => setAuthor(e.target.value)} 
                  placeholder="Ex: Pr. Rodrigo Duarte" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Título do Devocional</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Ex: A Grande Comissão e o Nosso Chamado" 
                required 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Referência</label>
                <input 
                  type="text" 
                  value={verseRef} 
                  onChange={(e) => setVerseRef(e.target.value)} 
                  placeholder="Ex: Mt 28:18-19" 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Texto Bíblico Chave (Opcional)</label>
                <input 
                  type="text" 
                  value={passageText} 
                  onChange={(e) => setPassageText(e.target.value)} 
                  placeholder='Ex: "É-me dado todo o poder nos céus e na terra..."' 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Barra de Ferramentas do Editor */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Reflexão Teológica / Exposição</label>
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                <div className="bg-slate-100 p-2 border-b border-slate-200 flex gap-1 flex-wrap">
                  <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()} className="p-1.5 hover:bg-slate-200 rounded text-slate-700"><Bold className="w-4 h-4" /></button>
                  <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()} className="p-1.5 hover:bg-slate-200 rounded text-slate-700"><Italic className="w-4 h-4" /></button>
                  <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()} className="p-1.5 hover:bg-slate-200 rounded text-slate-700"><List className="w-4 h-4" /></button>
                  <button type="button" onClick={() => editor?.chain().focus().toggleOrderedList().run()} className="p-1.5 hover:bg-slate-200 rounded text-slate-700"><ListOrdered className="w-4 h-4" /></button>
                  <button type="button" onClick={() => editor?.chain().focus().toggleBlockquote().run()} className="p-1.5 hover:bg-slate-200 rounded text-slate-700"><Quote className="w-4 h-4" /></button>
                </div>
                <EditorContent editor={editor} />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-indigo-200 active:scale-[0.99]"
            >
              {loading ? 'Processando...' : selectedId ? 'Atualizar Devocional' : 'Publicar / Agendar Devocional'}
            </button>
          </form>
        </div>

        {/* Lista e Calendário de Devocionais Agendados */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" /> Devocionais Programados
          </h2>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {devotionals.map((item) => (
              <div key={item.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-indigo-200 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[11px] font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {item.publish_date}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(item)} className="p-1 hover:bg-slate-200 rounded text-slate-600"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-1 hover:bg-slate-200 rounded text-rose-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <h3 className="font-bold text-slate-800 text-sm leading-snug">{item.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{item.verse_reference}</p>
              </div>
            ))}
            {devotionals.length === 0 && <p className="text-xs text-slate-400 italic">Nenhum devocional programado.</p>}
          </div>
        </div>

      </div>
    </div>
  );
}