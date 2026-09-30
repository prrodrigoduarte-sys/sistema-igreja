import React, { useState } from 'react';
import { IconeUtil } from './IconesUtil';
import Calculadora from './Calculadora';
import Tempo from './Tempo';
import Calendario from './Calendario';
import TabelaPeriodica from './TabelaPeriodica';
import EditorTexto from './EditorTexto';
import JurisIG from './JurisIG';
import Balcao from './Balcao';

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
}

type Ferramenta = 'calculadora' | 'cientifica' | 'tempo' | 'calendario' | 'tabela' | 'editor' | 'jurisig' | 'balcao';

const FERRAMENTAS: { id: Ferramenta; icone: string; titulo: string; descricao: string; destaque?: boolean }[] = [
  { id: 'balcao', icone: 'balcao', titulo: 'Oportunite', descricao: 'Balcão IGR: encontre o que precisa', destaque: true },
  { id: 'jurisig', icone: 'juris', titulo: 'JurisIG', descricao: 'Leis e decisões sobre igrejas', destaque: true },
  { id: 'calculadora', icone: 'calculadora', titulo: 'Calculadora', descricao: 'Normal' },
  { id: 'cientifica', icone: 'cientifica', titulo: 'Científica', descricao: 'Funções e ângulos' },
  { id: 'tempo', icone: 'tempo', titulo: 'Tempo', descricao: 'Previsão do clima' },
  { id: 'calendario', icone: 'calendario', titulo: 'Calendário', descricao: 'Ano inteiro e feriados' },
  { id: 'tabela', icone: 'tabela', titulo: 'Tabela periódica', descricao: '118 elementos' },
  { id: 'editor', icone: 'editor', titulo: 'Editor de texto', descricao: 'Documentos completos' },
];

export default function UtilitariosModule({ compromissos = [], codigoIgreja, emailUsuario, nomeUsuario, isAdmin }: Props) {
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {FERRAMENTAS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setAtual(f.id)}
                className={`text-left rounded-2xl border p-3 cursor-pointer active:scale-[0.97] transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  f.destaque ? 'bg-gradient-to-br from-blue-900 to-indigo-800 border-blue-900 text-white' : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <span
                  className={`w-11 h-11 rounded-xl flex items-center justify-center mb-2 ${
                    f.destaque ? 'bg-white/15 text-white' : 'bg-blue-50 text-blue-900'
                  }`}
                >
                  <IconeUtil nome={f.icone} className="w-6 h-6" />
                </span>
                <span className="block font-black text-[13px] leading-tight">{f.titulo}</span>
                <span className={`block text-[11px] mt-0.5 leading-tight ${f.destaque ? 'text-blue-100' : 'text-slate-500'}`}>{f.descricao}</span>
              </button>
            ))}
          </div>
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
