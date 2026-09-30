import React, { useEffect, useMemo, useRef, useState } from 'react';
import { avaliar, formatarNumero, numeroInterno } from './calculo';
import { IconeUtil } from './IconesUtil';

interface Props {
  modo: 'normal' | 'cientifica';
}

interface ItemHistorico {
  expr: string;
  resultado: string; // formatado (pt-BR)
  interno: string; // com ponto, para reaproveitar na conta
}

const OPS_BINARIOS = '+×÷^';
const FUNCAO_FINAL = /(asin\(|acos\(|atan\(|sin\(|cos\(|tan\(|ln\(|log\(|abs\(|√\(|Ans)$/;

const paraExibicao = (expr: string) => expr.replace(/\./g, ',');

function Tecla({
  rotulo,
  aoClicar,
  tipo = 'num',
  aria,
  ativa = false,
  className = '',
}: {
  rotulo: React.ReactNode;
  aoClicar: () => void;
  tipo?: 'num' | 'func' | 'op' | 'igual' | 'acao';
  aria?: string;
  ativa?: boolean;
  className?: string;
}) {
  const estilos: Record<string, string> = {
    num: 'bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 text-lg',
    func: 'bg-slate-100 text-slate-700 hover:bg-slate-200 text-[13px]',
    op: 'bg-blue-100 text-blue-900 hover:bg-blue-200 text-xl',
    igual: 'bg-emerald-600 text-white hover:bg-emerald-700 text-xl',
    acao: 'bg-rose-50 text-rose-700 hover:bg-rose-100 text-base',
  };
  return (
    <button
      type="button"
      onClick={aoClicar}
      aria-label={aria}
      aria-pressed={ativa || undefined}
      className={`h-12 rounded-xl font-semibold cursor-pointer select-none active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        ativa ? 'bg-blue-900 text-white hover:bg-blue-800 text-[13px]' : estilos[tipo]
      } ${className}`}
    >
      {rotulo}
    </button>
  );
}

export default function Calculadora({ modo }: Props) {
  const cientifica = modo === 'cientifica';
  const [expr, setExpr] = useState('');
  const [recemCalculado, setRecemCalculado] = useState(false);
  const [ans, setAns] = useState<number | undefined>(undefined);
  const [graus, setGraus] = useState(true);
  const [inversa, setInversa] = useState(false);
  const [historico, setHistorico] = useState<ItemHistorico[]>([]);
  const [verHistorico, setVerHistorico] = useState(false);
  const [erro, setErro] = useState('');
  const [copiado, setCopiado] = useState(false);
  const raiz = useRef<HTMLDivElement | null>(null);
  const timerErro = useRef<any>(null);

  useEffect(() => {
    // Em computador, já deixa o teclado do PC pronto para digitar
    if (window.matchMedia?.('(pointer: fine)').matches) raiz.current?.focus();
  }, []);

  const mostrarErro = (msg: string) => {
    setErro(msg);
    clearTimeout(timerErro.current);
    timerErro.current = setTimeout(() => setErro(''), 1800);
  };

  // Prévia do resultado enquanto digita
  const previa = useMemo(() => {
    if (!expr || recemCalculado) return '';
    if (/^-?[0-9.]+$/.test(expr)) return '';
    try {
      return formatarNumero(avaliar(expr, { graus, ans }));
    } catch {
      return '';
    }
  }, [expr, graus, ans, recemCalculado]);

  const resultadoNaTela = erro || previa || (expr ? paraExibicao(expr) : '0');
  const tamanho = resultadoNaTela.length > 16 ? 'text-2xl' : resultadoNaTela.length > 10 ? 'text-3xl' : 'text-4xl';

  // ── entrada ──
  const digitar = (d: string) => {
    let atual = recemCalculado ? '' : expr;
    setRecemCalculado(false);
    if (d === '.') {
      const ultimoNumero = atual.match(/[0-9.]*$/)?.[0] ?? '';
      if (ultimoNumero.includes('.')) return;
      if (ultimoNumero === '') atual += '0';
    }
    // evita "0" + "5" = "05"
    if (/(^|[^0-9.])0$/.test(atual) && /[0-9]/.test(d)) atual = atual.slice(0, -1);
    setExpr(atual + d);
  };

  const operador = (op: string) => {
    let atual = expr;
    setRecemCalculado(false);
    if (atual === '') {
      if (op === '-') setExpr('-');
      return;
    }
    const ultimo = atual[atual.length - 1];
    if (ultimo === '(') {
      if (op === '-') setExpr(atual + '-');
      return;
    }
    if (OPS_BINARIOS.includes(ultimo)) {
      if (op === '-') setExpr(atual + '-');
      else setExpr(atual.slice(0, -1) + op);
      return;
    }
    if (ultimo === '-') {
      if (op === '-') return;
      atual = atual.slice(0, -1);
      if (atual === '') return;
      setExpr(atual + op);
      return;
    }
    setExpr(atual + op);
  };

  // Funções, constantes e parênteses (se acabou de calcular, começa uma conta nova)
  const inserir = (texto: string, comecaNovo = true) => {
    const atual = recemCalculado && comecaNovo ? '' : expr;
    setRecemCalculado(false);
    setExpr(atual + texto);
  };

  // Sufixos que continuam a conta (x², x!, %, ...)
  const sufixo = (texto: string) => {
    if (expr === '') return;
    setRecemCalculado(false);
    setExpr(expr + texto);
  };

  const alternarSinal = () => {
    if (expr === '') return setExpr('-');
    setRecemCalculado(false);
    const jaNegativo = expr.match(/\(-([0-9.]+)\)$/);
    if (jaNegativo) return setExpr(expr.replace(/\(-([0-9.]+)\)$/, '$1'));
    const numero = expr.match(/[0-9.]+$/);
    if (numero) return setExpr(expr.slice(0, expr.length - numero[0].length) + '(-' + numero[0] + ')');
    return setExpr(expr + '-');
  };

  const apagar = () => {
    setRecemCalculado(false);
    if (FUNCAO_FINAL.test(expr)) return setExpr(expr.replace(FUNCAO_FINAL, ''));
    setExpr(expr.slice(0, -1));
  };

  const limpar = () => {
    setExpr('');
    setRecemCalculado(false);
    setErro('');
  };

  const igual = () => {
    if (!expr) return;
    try {
      const r = avaliar(expr, { graus, ans });
      const interno = numeroInterno(r);
      setHistorico((h) => [{ expr: paraExibicao(expr), resultado: formatarNumero(r), interno }, ...h].slice(0, 30));
      setAns(r);
      setExpr(interno);
      setRecemCalculado(true);
    } catch (e: any) {
      mostrarErro(e?.message === 'Divisão por zero' ? 'Divisão por zero' : 'Expressão inválida');
    }
  };

  const copiar = async () => {
    let texto = previa;
    if (!texto && expr) {
      const n = Number(expr.replace('×10^', 'e'));
      if (Number.isFinite(n)) texto = formatarNumero(n);
    }
    if (!texto) return;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1200);
    } catch {}
  };

  // Teclado do computador
  const aoTeclar = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    let tratado = true;
    if (/^[0-9]$/.test(k)) digitar(k);
    else if (k === '.' || k === ',') digitar('.');
    else if (k === '+') operador('+');
    else if (k === '-') operador('-');
    else if (k === '*' || k === 'x' || k === 'X') operador('×');
    else if (k === '/') operador('÷');
    else if (k === '^' && cientifica) operador('^');
    else if (k === '(' && cientifica) inserir('(', false);
    else if (k === ')' && cientifica) inserir(')', false);
    else if (k === '%') sufixo('%');
    else if (k === '!' && cientifica) sufixo('!');
    else if (k === 'Enter' || k === '=') igual();
    else if (k === 'Backspace') apagar();
    else if (k === 'Escape' || k === 'Delete') limpar();
    else tratado = false;
    if (tratado) e.preventDefault();
  };

  return (
    <div
      ref={raiz}
      tabIndex={0}
      onKeyDown={aoTeclar}
      className="max-w-md mx-auto space-y-3 outline-none"
      aria-label={cientifica ? 'Calculadora científica' : 'Calculadora'}
    >
      {/* Visor */}
      <div className="rounded-2xl bg-blue-950 text-white p-4 shadow-inner">
        <div className="flex items-center justify-between text-[11px] text-blue-300 mb-1">
          <span>{cientifica ? (graus ? 'GRAUS' : 'RADIANOS') : ''}</span>
          <span className="flex items-center gap-1">
            <button
              type="button"
              onClick={copiar}
              className="p-1 rounded hover:bg-white/10 cursor-pointer"
              aria-label="Copiar resultado"
              title="Copiar resultado"
            >
              <IconeUtil nome="copiar" className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setVerHistorico((v) => !v)}
              className={`p-1 rounded cursor-pointer ${verHistorico ? 'bg-white/20' : 'hover:bg-white/10'}`}
              aria-label="Histórico"
              title="Histórico"
            >
              <IconeUtil nome="historico" className="w-4 h-4" />
            </button>
          </span>
        </div>
        <div className="text-right text-sm text-blue-200 min-h-[22px] overflow-x-auto whitespace-nowrap" aria-live="off">
          {previa || recemCalculado ? paraExibicao(historico[0]?.expr && recemCalculado ? historico[0].expr : expr) : ''}
        </div>
        <div
          className={`text-right font-light tabular-nums overflow-x-auto whitespace-nowrap ${tamanho} ${erro ? 'text-rose-300' : ''}`}
          role="status"
        >
          {resultadoNaTela}
        </div>
        {copiado && <p className="text-right text-[10px] text-emerald-300 mt-1">Copiado</p>}
      </div>

      {/* Histórico */}
      {verHistorico && (
        <div className="rounded-2xl bg-white border border-slate-200 p-3 text-xs">
          <div className="flex items-center justify-between mb-2">
            <strong className="text-slate-700">Histórico</strong>
            {historico.length > 0 && (
              <button type="button" onClick={() => setHistorico([])} className="text-rose-700 font-semibold cursor-pointer">
                Limpar
              </button>
            )}
          </div>
          {historico.length === 0 ? (
            <p className="text-slate-400">Nenhum cálculo ainda.</p>
          ) : (
            <ul className="space-y-1 max-h-40 overflow-y-auto">
              {historico.map((h, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => {
                      setExpr(h.interno);
                      setRecemCalculado(true);
                      setVerHistorico(false);
                    }}
                    className="w-full flex justify-between gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-left"
                  >
                    <span className="text-slate-500 truncate">{h.expr}</span>
                    <span className="font-bold text-slate-800 shrink-0">= {h.resultado}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Teclas científicas */}
      {cientifica && (
        <div className="grid grid-cols-5 gap-2">
          <Tecla rotulo="2nd" aoClicar={() => setInversa((v) => !v)} tipo="func" ativa={inversa} aria="Funções inversas" />
          <Tecla rotulo={graus ? 'Deg' : 'Rad'} aoClicar={() => setGraus((v) => !v)} tipo="func" aria="Alternar graus e radianos" />
          <Tecla rotulo="(" aoClicar={() => inserir('(', false)} tipo="func" />
          <Tecla rotulo=")" aoClicar={() => inserir(')', false)} tipo="func" />
          <Tecla rotulo="x!" aoClicar={() => sufixo('!')} tipo="func" aria="Fatorial" />

          <Tecla rotulo={inversa ? 'sin⁻¹' : 'sin'} aoClicar={() => inserir(inversa ? 'asin(' : 'sin(')} tipo="func" />
          <Tecla rotulo={inversa ? 'cos⁻¹' : 'cos'} aoClicar={() => inserir(inversa ? 'acos(' : 'cos(')} tipo="func" />
          <Tecla rotulo={inversa ? 'tan⁻¹' : 'tan'} aoClicar={() => inserir(inversa ? 'atan(' : 'tan(')} tipo="func" />
          <Tecla rotulo={inversa ? 'eˣ' : 'ln'} aoClicar={() => inserir(inversa ? 'e^(' : 'ln(')} tipo="func" />
          <Tecla rotulo={inversa ? '10ˣ' : 'log'} aoClicar={() => inserir(inversa ? '10^(' : 'log(')} tipo="func" />

          <Tecla rotulo="√" aoClicar={() => inserir('√(')} tipo="func" aria="Raiz quadrada" />
          <Tecla rotulo="x²" aoClicar={() => sufixo('^2')} tipo="func" aria="Ao quadrado" />
          <Tecla rotulo="xʸ" aoClicar={() => operador('^')} tipo="func" aria="Potência" />
          <Tecla rotulo="x⁻¹" aoClicar={() => sufixo('^(-1)')} tipo="func" aria="Inverso" />
          <Tecla rotulo="|x|" aoClicar={() => inserir('abs(')} tipo="func" aria="Valor absoluto" />

          <Tecla rotulo="π" aoClicar={() => inserir('π')} tipo="func" />
          <Tecla rotulo="e" aoClicar={() => inserir('e')} tipo="func" />
          <Tecla rotulo="Ans" aoClicar={() => inserir('Ans')} tipo="func" aria="Último resultado" />
          <Tecla rotulo="x³" aoClicar={() => sufixo('^3')} tipo="func" aria="Ao cubo" />
          <Tecla rotulo="×10ⁿ" aoClicar={() => sufixo('×10^')} tipo="func" aria="Notação científica" />
        </div>
      )}

      {/* Teclado principal */}
      <div className="grid grid-cols-4 gap-2">
        <Tecla rotulo="AC" aoClicar={limpar} tipo="acao" aria="Limpar tudo" />
        <Tecla rotulo="⌫" aoClicar={apagar} tipo="acao" aria="Apagar" />
        <Tecla rotulo="%" aoClicar={() => sufixo('%')} tipo="op" aria="Porcentagem" />
        <Tecla rotulo="÷" aoClicar={() => operador('÷')} tipo="op" aria="Dividir" />

        <Tecla rotulo="7" aoClicar={() => digitar('7')} />
        <Tecla rotulo="8" aoClicar={() => digitar('8')} />
        <Tecla rotulo="9" aoClicar={() => digitar('9')} />
        <Tecla rotulo="×" aoClicar={() => operador('×')} tipo="op" aria="Multiplicar" />

        <Tecla rotulo="4" aoClicar={() => digitar('4')} />
        <Tecla rotulo="5" aoClicar={() => digitar('5')} />
        <Tecla rotulo="6" aoClicar={() => digitar('6')} />
        <Tecla rotulo="−" aoClicar={() => operador('-')} tipo="op" aria="Subtrair" />

        <Tecla rotulo="1" aoClicar={() => digitar('1')} />
        <Tecla rotulo="2" aoClicar={() => digitar('2')} />
        <Tecla rotulo="3" aoClicar={() => digitar('3')} />
        <Tecla rotulo="+" aoClicar={() => operador('+')} tipo="op" aria="Somar" />

        <Tecla rotulo="±" aoClicar={alternarSinal} aria="Trocar sinal" />
        <Tecla rotulo="0" aoClicar={() => digitar('0')} />
        <Tecla rotulo="," aoClicar={() => digitar('.')} aria="Vírgula" />
        <Tecla rotulo="=" aoClicar={igual} tipo="igual" aria="Calcular" />
      </div>

      {window.matchMedia?.('(pointer: fine)').matches && (
        <p className="text-[10px] text-slate-400 text-center">
          Dica: no computador você também pode digitar no teclado. Enter calcula e Esc limpa.
        </p>
      )}
    </div>
  );
}
