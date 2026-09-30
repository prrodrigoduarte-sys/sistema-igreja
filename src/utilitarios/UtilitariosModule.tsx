import React, { useState } from 'react';
import { IconeUtil } from './IconesUtil';
import Calculadora from './Calculadora';
import Tempo from './Tempo';
import Calendario from './Calendario';
import TabelaPeriodica from './TabelaPeriodica';
import EditorTexto from './EditorTexto';
import JurisIG from './JurisIG';
import Balcao from './Balcao';
import Biblia from './Biblia';

interface Compromisso {
  data: string;
  descricao: string;
  hora?: string;
}

interface Props {
  compromissos?: Compromisso[];
  codigoIgreja: string;
  emailUsuario: string;
  nomeUsuario: string;
  isAdmin: boolean;
  podePublicarDevocional?: boolean;
}

type Ferramenta = 'biblia' | 'calculadora' | 'cientifica' | 'tempo' | 'calendario' | 'tabela' | 'editor' | 'jurisig' | 'balcao';

// cor: degradê do ícone (ou do cartão inteiro, nos destaques); sombra: brilho colorido embaixo do ícone
const FERRAMENTAS: { id: Ferramenta; icone: string; titulo: string; descricao: string; cor: string; sombra: string; destaque?: boolean }[] = [
  { id: 'biblia', icone: 'biblia', titulo: 'Bíblia Sagrada', descricao: 'Com subtítulos e devocional pessoal', cor: 'from-amber-400 via-orange-500 to-rose-500', sombra: 'shadow-orange-500/40', destaque: true },
  { id: 'balcao', icone: 'balcao', titulo: 'Oportunite', descricao: 'Balcão IGR: encontre o que precisa', cor: 'from-fuchsia-500 via-purple-600 to-indigo-600', sombra: 'shadow-purple-500/40', destaque: true },
  { id: 'jurisig', icone: 'juris', titulo: 'JurisIG', descricao: 'Leis e decisões sobre igrejas', cor: 'from-sky-500 via-blue-600 to-indigo-700', sombra: 'shadow-blue-500/40', destaque: true },
  { id: 'calculadora', icone: 'calculadora', titulo: 'Calculadora', descricao: 'Normal', cor: 'from-emerald-400 to-teal-600', sombra: 'shadow-emerald-500/40' },
  { id: 'cientifica', icone: 'cientifica', titulo: 'Científica', descricao: 'Funções e ângulos', cor: 'from-violet-500 to-purple-700', sombra: 'shadow-violet-500/40' },
  { id: 'tempo', icone: 'tempo', titulo: 'Tempo', descricao: 'Previsão do clima', cor: 'from-sky-400 to-cyan-600', sombra: 'shadow-sky-500/40' },
  { id: 'calendario', icone: 'calendario', titulo: 'Calendário', descricao: 'Ano inteiro e feriados', cor: 'from-rose-400 to-pink-600', sombra: 'shadow-rose-500/40' },
  { id: 'tabela', icone: 'tabela', titulo: 'Tabela periódica', descricao: '118 elementos', cor: 'from-lime-400 to-green-600', sombra: 'shadow-lime-500/40' },
  { id: 'editor', icone: 'editor', titulo: 'Editor de texto', descricao: 'Documentos completos', cor: 'from-orange-400 to-red-500', sombra: 'shadow-orange-500/40' },
];

export default function UtilitariosModule({ compromissos = [], codigoIgreja, emailUsuario, nomeUsuario, isAdmin, podePublicarDevocional = false }: Props) {
  const [atual, setAtual] = useState<Ferramenta | null>(null);
  const ferramenta = FERRAMENTAS.find((f) => f.id === atual) || null;

  // O editor ocupa a altura toda e rola por dentro; as demais rolam a tela
  const ehEditor = atual === 'editor';

  return (
    <div className="flex flex-col h-full min-h-0">
      {ferramenta && (
        <div className="bg-white border-b border-slate-200 px-2 py-1.5 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setAtual(null)}
            className="h-9 px-2.5 rounded-full hover:bg-slate-100 flex items-center gap-1.5 text-xs font-bold text-blue-900 cursor-pointer active:scale-95 transition"
            aria-label="Voltar para Utilitários"
          >
            <IconeUtil nome="voltar" className="w-4 h-4" />
            Utilitários
          </button>
          <h3 className="font-black text-sm text-slate-800 truncate">{ferramenta.titulo}</h3>
        </div>
      )}

      <div className={`flex-1 min-h-0 ${ehEditor ? 'p-2 flex flex-col' : 'overflow-y-auto p-3.5'}`}>
        {!ferramenta && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {FERRAMENTAS.map((f) =>
              f.destaque ? (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setAtual(f.id)}
                  className={`relative overflow-hidden text-left rounded-3xl p-3.5 text-white bg-gradient-to-br ${f.cor} shadow-lg ${f.sombra} cursor-pointer active:scale-[0.97] transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60 ${
                    f.id === 'biblia' ? 'col-span-2 sm:col-span-3 flex items-center gap-3.5' : ''
                  }`}
                >
                  {/* brilhos decorativos */}
                  <span className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/15" aria-hidden="true" />
                  <span className="absolute right-8 -bottom-8 w-16 h-16 rounded-full bg-white/10" aria-hidden="true" />
                  <span
                    className={`relative shrink-0 rounded-2xl bg-white/20 ring-1 ring-white/40 backdrop-blur flex items-center justify-center ${
                      f.id === 'biblia' ? 'w-14 h-14' : 'w-12 h-12 mb-2.5'
                    }`}
                  >
                    <IconeUtil nome={f.icone} className={f.id === 'biblia' ? 'w-8 h-8' : 'w-7 h-7'} espessura={1.9} />
                  </span>
                  <span className="relative block">
                    <span className={`block font-black leading-tight ${f.id === 'biblia' ? 'text-lg' : 'text-[14px]'}`}>{f.titulo}</span>
                    <span className="block text-[11px] mt-0.5 leading-tight text-white/85">{f.descricao}</span>
                  </span>
                </button>
              ) : (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setAtual(f.id)}
                  className="group text-left rounded-3xl bg-white border border-slate-200/80 p-3.5 cursor-pointer active:scale-[0.97] transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <span
                    className={`relative overflow-hidden w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 text-white bg-gradient-to-br ${f.cor} shadow-lg ${f.sombra} group-hover:scale-110 group-hover:rotate-3 transition`}
                  >
                    <span className="absolute inset-x-0 top-0 h-1/2 bg-white/20" aria-hidden="true" />
                    <IconeUtil nome={f.icone} className="relative w-7 h-7" espessura={1.9} />
                  </span>
                  <span className="block font-black text-[13px] leading-tight text-slate-800">{f.titulo}</span>
                  <span className="block text-[11px] mt-0.5 leading-tight text-slate-500">{f.descricao}</span>
                </button>
              ),
            )}
          </div>
        )}

        {atual === 'biblia' && (
          <Biblia emailUsuario={emailUsuario} nomeUsuario={nomeUsuario} codigoIgreja={codigoIgreja} podePublicarDevocional={podePublicarDevocional} />
        )}
        {atual === 'calculadora' && <Calculadora modo="normal" />}
        {atual === 'cientifica' && <Calculadora modo="cientifica" />}
        {atual === 'tempo' && <Tempo />}
        {atual === 'calendario' && <Calendario compromissos={compromissos} />}
        {atual === 'tabela' && <TabelaPeriodica />}
        {atual === 'editor' && <EditorTexto />}
        {atual === 'jurisig' && <JurisIG />}
        {atual === 'balcao' && <Balcao codigoIgreja={codigoIgreja} emailUsuario={emailUsuario} nomeUsuario={nomeUsuario} isAdmin={isAdmin} />}
      </div>
    </div>
  );
}
