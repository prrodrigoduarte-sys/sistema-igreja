// Motor de cálculo da calculadora (sem eval): lê a expressão, respeita a ordem das operações
// e aceita multiplicação implícita (2π, 3(4+1), 2sin(30)).

export interface OpcoesCalculo {
    graus: boolean; // true = ângulos em graus, false = radianos
    ans?: number; // resultado anterior (tecla Ans)
  }
  
  type Token =
    | { t: 'num'; v: number }
    | { t: 'op'; v: string } // + - × ÷ ^ ! % ( )
    | { t: 'id'; v: string }; // sin, cos, tan, asin, acos, atan, ln, log, abs, √, π, e, Ans
  
  const FUNCOES = new Set(['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'ln', 'log', 'abs', '√']);
  const CONSTANTES = new Set(['π', 'e', 'Ans']);
  
  function tokenizar(expr: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    while (i < expr.length) {
      const c = expr[i];
      if (c === ' ') {
        i++;
      } else if (/[0-9.]/.test(c)) {
        let j = i;
        while (j < expr.length && /[0-9.]/.test(expr[j])) j++;
        const texto = expr.slice(i, j);
        if ((texto.match(/\./g) || []).length > 1 || texto === '.') throw new Error('Número inválido');
        tokens.push({ t: 'num', v: parseFloat(texto) });
        i = j;
      } else if (/[a-zA-Z]/.test(c)) {
        let j = i;
        while (j < expr.length && /[a-zA-Z]/.test(expr[j])) j++;
        const nome = expr.slice(i, j);
        if (!FUNCOES.has(nome) && !CONSTANTES.has(nome)) throw new Error(`Desconhecido: ${nome}`);
        tokens.push({ t: 'id', v: nome });
        i = j;
      } else if (c === 'π' || c === '√') {
        tokens.push({ t: 'id', v: c });
        i++;
      } else if ('+-×÷^!%()'.includes(c)) {
        tokens.push({ t: 'op', v: c });
        i++;
      } else if (c === '*') {
        tokens.push({ t: 'op', v: '×' });
        i++;
      } else if (c === '/') {
        tokens.push({ t: 'op', v: '÷' });
        i++;
      } else {
        throw new Error(`Caractere inválido: ${c}`);
      }
    }
    return tokens;
  }
  
  function fatorial(n: number): number {
    if (!Number.isInteger(n) || n < 0 || n > 170) throw new Error('Fatorial inválido');
    let r = 1;
    for (let k = 2; k <= n; k++) r *= k;
    return r;
  }
  
  export function avaliar(expr: string, opcoes: OpcoesCalculo): number {
    const tokens = tokenizar(expr);
    let pos = 0;
    const { graus } = opcoes;
  
    const espia = () => tokens[pos];
    const ehOp = (v: string) => {
      const t = tokens[pos];
      return !!t && t.t === 'op' && t.v === v;
    };
  
    const paraRad = (x: number) => (graus ? (x * Math.PI) / 180 : x);
    const deRad = (x: number) => (graus ? (x * 180) / Math.PI : x);
  
    const aplicarFuncao = (nome: string, x: number): number => {
      switch (nome) {
        case 'sin':
          return Math.sin(paraRad(x));
        case 'cos':
          return Math.cos(paraRad(x));
        case 'tan': {
          // tan(90°) não existe: o cosseno é (quase) zero
          if (Math.abs(Math.cos(paraRad(x))) < 1e-12) throw new Error('Indefinido');
          return Math.tan(paraRad(x));
        }
        case 'asin':
          if (x < -1 || x > 1) throw new Error('Fora do domínio');
          return deRad(Math.asin(x));
        case 'acos':
          if (x < -1 || x > 1) throw new Error('Fora do domínio');
          return deRad(Math.acos(x));
        case 'atan':
          return deRad(Math.atan(x));
        case 'ln':
          if (x <= 0) throw new Error('Fora do domínio');
          return Math.log(x);
        case 'log':
          if (x <= 0) throw new Error('Fora do domínio');
          return Math.log10(x);
        case 'abs':
          return Math.abs(x);
        case '√':
          if (x < 0) throw new Error('Raiz de negativo');
          return Math.sqrt(x);
        default:
          throw new Error('Função desconhecida');
      }
    };
  
    // Começa um fator? (usado para multiplicação implícita)
    const iniciaFator = () => {
      const t = espia();
      if (!t) return false;
      if (t.t === 'num' || t.t === 'id') return true;
      return t.t === 'op' && t.v === '(';
    };
  
    function expressao(): number {
      let esq = termo();
      while (ehOp('+') || ehOp('-')) {
        const op = (tokens[pos++] as { v: string }).v;
        const inicio = pos;
        const dir = termo();
        // "200 + 10%" = 200 + 10% de 200
        const t0 = tokens[inicio];
        const t1 = tokens[inicio + 1];
        const t2 = tokens[inicio + 2];
        const soPorcento =
          pos - inicio === 2 && t0?.t === 'num' && t1?.t === 'op' && t1.v === '%' && (t2 === undefined || t2.t === 'op');
        const valor = soPorcento ? (esq * (t0 as { v: number }).v) / 100 : dir;
        esq = op === '+' ? esq + valor : esq - valor;
      }
      return esq;
    }
  
    function termo(): number {
      let esq = unario();
      for (;;) {
        if (ehOp('×')) {
          pos++;
          esq *= unario();
        } else if (ehOp('÷')) {
          pos++;
          const d = unario();
          if (d === 0) throw new Error('Divisão por zero');
          esq /= d;
        } else if (iniciaFator()) {
          esq *= unario(); // multiplicação implícita
        } else {
          return esq;
        }
      }
    }
  
    function unario(): number {
      if (ehOp('-')) {
        pos++;
        return -unario();
      }
      if (ehOp('+')) {
        pos++;
        return unario();
      }
      return potencia();
    }
  
    function potencia(): number {
      const base = pos_fixo();
      if (ehOp('^')) {
        pos++;
        const exp = unario(); // associa à direita e aceita 2^-3
        const r = Math.pow(base, exp);
        if (Number.isNaN(r)) throw new Error('Resultado inválido');
        return r;
      }
      return base;
    }
  
    function pos_fixo(): number {
      let v = primario();
      while (ehOp('!') || ehOp('%')) {
        const op = (tokens[pos++] as { v: string }).v;
        v = op === '!' ? fatorial(v) : v / 100;
      }
      return v;
    }
  
    function primario(): number {
      const t = tokens[pos];
      if (!t) throw new Error('Expressão incompleta');
      if (t.t === 'num') {
        pos++;
        return t.v;
      }
      if (t.t === 'op' && t.v === '(') {
        pos++;
        const v = expressao();
        if (ehOp(')')) pos++; // parêntese não fechado no fim é aceito
        else if (pos < tokens.length) throw new Error('Parêntese inválido');
        return v;
      }
      if (t.t === 'id') {
        pos++;
        if (t.v === 'π') return Math.PI;
        if (t.v === 'e') return Math.E;
        if (t.v === 'Ans') return opcoes.ans ?? 0;
        // função: exige parêntese, exceto √ que aceita "√9"
        if (ehOp('(')) {
          pos++;
          const arg = expressao();
          if (ehOp(')')) pos++;
          else if (pos < tokens.length) throw new Error('Parêntese inválido');
          return aplicarFuncao(t.v, arg);
        }
        if (t.v === '√') return aplicarFuncao('√', pos_fixo());
        throw new Error('Função sem argumento');
      }
      throw new Error('Expressão inválida');
    }
  
    if (tokens.length === 0) throw new Error('Vazio');
    const resultado = expressao();
    if (pos < tokens.length) throw new Error('Expressão inválida');
    if (!Number.isFinite(resultado)) throw new Error('Resultado inválido');
    return resultado;
  }
  
  // Arredonda ruídos de ponto flutuante (0,1+0,2 → 0,3) e formata em pt-BR
  export function formatarNumero(n: number): string {
    if (Math.abs(n) < 1e-12) return '0';
    const limpo = Number(n.toPrecision(12));
    const abs = Math.abs(limpo);
    let texto: string;
    if (abs !== 0 && (abs >= 1e15 || abs < 1e-9)) {
      texto = limpo.toExponential(6).replace(/\.?0+e/, 'e').replace('e+', '×10^').replace('e-', '×10^-');
    } else {
      texto = String(limpo);
    }
    return texto.replace('.', ',');
  }
  
  // Resultado como texto "interno" (com ponto) para continuar a conta
  export function numeroInterno(n: number): string {
    if (Math.abs(n) < 1e-12) return '0';
    const limpo = Number(n.toPrecision(12));
    const abs = Math.abs(limpo);
    if (abs >= 1e15 || abs < 1e-9) {
      // notação científica que o próprio motor entende: 1,5×10^21
      const [m, e] = limpo.toExponential(11).split('e');
      return `${Number(m)}×10^${Number(e)}`;
    }
    return String(limpo);
  }
  