import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Share2, BookOpen, Calendar, Heart } from 'lucide-react';

export function DevotionalViewer() {
  const [devotional, setDevotional] = useState(null);
  const [loading, setLoading] = useState(true);

  // Data atual no formato YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadTodayDevotional();
  }, []);

  async function loadTodayDevotional() {
    setLoading(true);
    const { data } = await supabase
      .from('devotionals')
      .select('*')
      .eq('publish_date', today)
      .maybeSingle();

    if (data) {
      setDevotional(data);
      // Incrementar contador de visualizações
      supabase.rpc('increment_devotional_views', { doc_id: data.id });
    }
    setLoading(false);
  }

  const handleShare = () => {
    if (navigator.share && devotional) {
      navigator.share({
        title: devotional.title,
        text: `*Devocional Diário - Vida e Paz CHURCH*\n\n"${devotional.title}"\n${devotional.verse_reference}\n\nLeia mais no app!`,
        url: window.location.href,
      });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 font-sans">
      
      {/* Cabeçalho da Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative">
        <div className="flex justify-between items-center mb-4">
          <span className="flex items-center gap-1.5 text-xs font-bold bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-indigo-200">
            <BookOpen className="w-3.5 h-3.5" /> Devocional Diário
          </span>
          <span className="text-xs font-medium text-slate-300 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date().toLocaleDateString('pt-BR')}
          </span>
        </div>

        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">
          PALAVRA DO DIA
        </p>

        {loading ? (
          <div className="h-12 bg-white/10 animate-pulse rounded-lg mt-2" />
        ) : devotional ? (
          <>
            <h1 className="text-xl font-black leading-snug text-white mb-2">
              "{devotional.title}"
            </h1>
            <p className="text-xs font-bold text-indigo-300">
              {devotional.verse_reference}
            </p>
          </>
        ) : (
          <h1 className="text-base font-medium text-slate-300 italic">
            Nenhum devocional agendado para hoje.
          </h1>
        )}
      </div>

      {/* Conteúdo do Devocional */}
      <div className="p-6 space-y-4">
        {devotional?.passage_text && (
          <blockquote className="border-l-4 border-indigo-500 pl-4 py-1 text-xs italic text-slate-600 bg-slate-50 rounded-r-lg">
            {devotional.passage_text}
          </blockquote>
        )}

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Reflexão:
          </h3>
          {loading ? (
            <div className="space-y-2">
              <div className="h-4 bg-slate-100 rounded w-full animate-pulse" />
              <div className="h-4 bg-slate-100 rounded w-5/6 animate-pulse" />
              <div className="h-4 bg-slate-100 rounded w-4/6 animate-pulse" />
            </div>
          ) : devotional ? (
            <div 
              className="text-slate-700 text-sm leading-relaxed prose prose-indigo"
              dangerouslySetInnerHTML={{ __html: devotional.content_html }}
            />
          ) : (
            <p className="text-sm text-slate-400 italic">
              Aguarde a publicação pastoral para o dia de hoje.
            </p>
          )}
        </div>

        {/* Rodapé e Ação de Compartilhamento */}
        {devotional && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">
              Por {devotional.author_name}
            </span>
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-4 py-2 rounded-xl transition-all border border-emerald-200/60"
            >
              <Share2 className="w-3.5 h-3.5" /> Compartilhar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}