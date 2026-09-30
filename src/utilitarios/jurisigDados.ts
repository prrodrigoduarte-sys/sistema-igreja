// Base do JurisIG: referências jurídicas sobre igrejas e organizações religiosas no Brasil.
// Conteúdo curado à mão, com resumo em linguagem simples. NÃO é aconselhamento jurídico, e o app não consulta
// nenhum tribunal em tempo real: leis mudam e decisões novas saem toda semana. Confira sempre a fonte oficial.

export type Grupo = 'constituicao' | 'codigo_civil' | 'leis' | 'tributario' | 'penal' | 'jurisprudencia' | 'historico' | 'guia';
export type Situacao = 'vigente' | 'alterada' | 'revogada' | 'historica' | 'orientacao';

export interface ItemJuris {
  id: string;
  grupo: Grupo;
  titulo: string;
  ref: string; // citação curta
  situacao: Situacao;
  resumo: string;
  pratica?: string[]; // o que isso significa no dia a dia da igreja
  fonte?: { rotulo: string; url: string };
  busca?: string; // termo para os botões de pesquisa
  tags: string[];
}

export const REVISAO_CONTEUDO = 'setembro/2026';

export const GRUPOS: Record<Grupo, { nome: string; curto: string }> = {
  constituicao: { nome: 'Constituição Federal', curto: 'Constituição' },
  codigo_civil: { nome: 'Código Civil e registro', curto: 'Código Civil' },
  leis: { nome: 'Leis esparsas e decretos', curto: 'Leis esparsas' },
  tributario: { nome: 'Tributos e previdência', curto: 'Tributos' },
  penal: { nome: 'Proteção penal e convivência', curto: 'Penal' },
  jurisprudencia: { nome: 'Jurisprudência (STF/STJ)', curto: 'Jurisprudência' },
  historico: { nome: 'Histórico e normas revogadas', curto: 'Histórico' },
  guia: { nome: 'Guias práticos', curto: 'Guias' },
};

export const SITUACOES: Record<Situacao, { nome: string; classe: string }> = {
  vigente: { nome: 'Em vigor', classe: 'bg-emerald-100 text-emerald-800' },
  alterada: { nome: 'Em vigor (alterada)', classe: 'bg-sky-100 text-sky-800' },
  revogada: { nome: 'Revogada', classe: 'bg-rose-100 text-rose-800' },
  historica: { nome: 'Histórica', classe: 'bg-slate-200 text-slate-700' },
  orientacao: { nome: 'Orientação', classe: 'bg-amber-100 text-amber-800' },
};

const P = 'https://www.planalto.gov.br/ccivil_03/';

export const ITENS: ItemJuris[] = [
  // ───────────── CONSTITUIÇÃO ─────────────
  {
    id: 'cf-5-vi',
    grupo: 'constituicao',
    titulo: 'Liberdade de crença e de culto',
    ref: 'CF/1988, art. 5º, VI',
    situacao: 'vigente',
    resumo:
      'É inviolável a liberdade de consciência e de crença, sendo assegurado o livre exercício dos cultos religiosos e garantida, na forma da lei, a proteção aos locais de culto e a suas liturgias.',
    pratica: [
      'Base de todo o direito das igrejas: cultuar, pregar e organizar-se sem pedir permissão ao Estado.',
      'Não isenta a igreja de cumprir regras gerais (segurança, saúde, barulho, posturas municipais).',
    ],
    fonte: { rotulo: 'Constituição no Planalto', url: P + 'constituicao/constituicao.htm' },
    busca: 'liberdade religiosa art. 5º VI Constituição',
    tags: ['liberdade religiosa', 'culto', 'crença', 'templo'],
  },
  {
    id: 'cf-5-vii-viii',
    grupo: 'constituicao',
    titulo: 'Assistência religiosa e escusa de consciência',
    ref: 'CF/1988, art. 5º, VII e VIII',
    situacao: 'vigente',
    resumo:
      'Assegura a prestação de assistência religiosa nas entidades civis e militares de internação coletiva. Ninguém será privado de direitos por motivo de crença, salvo se a invocar para se eximir de obrigação legal a todos imposta e recusar-se a cumprir prestação alternativa.',
    pratica: ['Fundamento para capelania em hospitais, presídios e quartéis.', 'A objeção de consciência costuma exigir uma prestação alternativa.'],
    fonte: { rotulo: 'Constituição no Planalto', url: P + 'constituicao/constituicao.htm' },
    busca: 'escusa de consciência assistência religiosa art. 5º VII VIII',
    tags: ['capelania', 'objeção de consciência', 'assistência religiosa'],
  },
  {
    id: 'cf-5-associacao',
    grupo: 'constituicao',
    titulo: 'Liberdade de associação e proteção contra interferência do Estado',
    ref: 'CF/1988, art. 5º, XVII a XXI',
    situacao: 'vigente',
    resumo:
      'É plena a liberdade de associação para fins lícitos. A criação de associações não depende de autorização, sendo vedada a interferência estatal em seu funcionamento. Só por decisão judicial podem ser suspensas as atividades ou dissolvida a entidade (a dissolução exige trânsito em julgado).',
    pratica: ['Nenhum órgão pode fechar uma igreja por conta própria: só o Judiciário, e a dissolução exige decisão definitiva.'],
    fonte: { rotulo: 'Constituição no Planalto', url: P + 'constituicao/constituicao.htm' },
    busca: 'liberdade de associação art. 5º XVII XVIII XIX XX XXI',
    tags: ['associação', 'dissolução', 'autonomia'],
  },
  {
    id: 'cf-19-i',
    grupo: 'constituicao',
    titulo: 'Estado laico: separação entre Estado e igrejas',
    ref: 'CF/1988, art. 19, I',
    situacao: 'vigente',
    resumo:
      'É vedado à União, aos Estados, ao Distrito Federal e aos Municípios estabelecer cultos religiosos ou igrejas, subvencioná-los, embaraçar-lhes o funcionamento ou manter com eles ou seus representantes relações de dependência ou aliança, ressalvada, na forma da lei, a colaboração de interesse público.',
    pratica: [
      'O poder público não pode favorecer nem prejudicar uma igreja por causa da fé.',
      'A exceção da "colaboração de interesse público" é a porta para parcerias sociais (ver Lei 13.019/2014).',
    ],
    fonte: { rotulo: 'Constituição no Planalto', url: P + 'constituicao/constituicao.htm' },
    busca: 'art. 19 I Constituição laicidade colaboração de interesse público igreja',
    tags: ['laicidade', 'Estado laico', 'subvenção', 'parceria'],
  },
  {
    id: 'cf-150',
    grupo: 'constituicao',
    titulo: 'Imunidade tributária dos templos',
    ref: 'CF/1988, art. 150, VI, "b" e § 4º',
    situacao: 'vigente',
    resumo:
      'É vedado instituir impostos sobre templos de qualquer culto. A imunidade compreende apenas o patrimônio, a renda e os serviços relacionados com as finalidades essenciais das entidades religiosas.',
    pratica: [
      'Vale para IMPOSTOS (IPTU, IR, ISS etc.). Não alcança taxas nem contribuições, como as previdenciárias sobre folha.',
      'Imóvel alugado a terceiros só é protegido se a renda for aplicada nas finalidades essenciais da igreja (ver RE 325.822 e Súmula Vinculante 52).',
      'Manter escrituração e comprovar a aplicação dos recursos é a melhor defesa numa cobrança indevida.',
    ],
    fonte: { rotulo: 'Constituição no Planalto', url: P + 'constituicao/constituicao.htm' },
    busca: 'imunidade tributária templos art. 150 VI b §4º',
    tags: ['imunidade', 'IPTU', 'imposto', 'templo', 'tributário'],
  },
  {
    id: 'cf-210',
    grupo: 'constituicao',
    titulo: 'Ensino religioso nas escolas públicas',
    ref: 'CF/1988, art. 210, § 1º',
    situacao: 'vigente',
    resumo: 'O ensino religioso, de matrícula facultativa, constituirá disciplina dos horários normais das escolas públicas de ensino fundamental.',
    fonte: { rotulo: 'Constituição no Planalto', url: P + 'constituicao/constituicao.htm' },
    busca: 'ensino religioso art. 210 §1º',
    tags: ['escola', 'ensino religioso'],
  },
  {
    id: 'cf-226',
    grupo: 'constituicao',
    titulo: 'Casamento religioso com efeito civil',
    ref: 'CF/1988, art. 226, § 2º',
    situacao: 'vigente',
    resumo: 'O casamento religioso tem efeito civil, nos termos da lei.',
    pratica: ['Regulamentado pelos arts. 1.515 e 1.516 do Código Civil: exige habilitação e registro para produzir efeitos civis.'],
    fonte: { rotulo: 'Constituição no Planalto', url: P + 'constituicao/constituicao.htm' },
    busca: 'casamento religioso efeito civil art. 226 §2º',
    tags: ['casamento', 'registro civil', 'celebração'],
  },

  // ───────────── CÓDIGO CIVIL E REGISTRO ─────────────
  {
    id: 'cc-44',
    grupo: 'codigo_civil',
    titulo: 'Organização religiosa é pessoa jurídica de direito privado',
    ref: 'Código Civil (Lei 10.406/2002), art. 44, IV e § 1º',
    situacao: 'alterada',
    resumo:
      'As organizações religiosas são pessoas jurídicas de direito privado. São livres a criação, a organização, a estruturação interna e o funcionamento das organizações religiosas, sendo vedado ao poder público negar-lhes reconhecimento ou registro dos atos constitutivos e necessários ao seu funcionamento (§ 1º, incluído pela Lei 10.825/2003).',
    pratica: [
      'A igreja tem categoria própria, distinta da associação comum.',
      'Cartório não pode recusar o registro do estatuto só por causa da doutrina ou da estrutura interna, embora possa exigir requisitos formais.',
    ],
    fonte: { rotulo: 'Código Civil compilado', url: P + 'leis/2002/l10406compilada.htm' },
    busca: 'organização religiosa art. 44 IV Código Civil',
    tags: ['pessoa jurídica', 'organização religiosa', 'estatuto', 'registro'],
  },
  {
    id: 'cc-45',
    grupo: 'codigo_civil',
    titulo: 'Quando a igreja passa a existir como pessoa jurídica',
    ref: 'Código Civil, art. 45 e Lei 6.015/1973, art. 114',
    situacao: 'vigente',
    resumo:
      'A existência legal da pessoa jurídica de direito privado começa com a inscrição do ato constitutivo no registro próprio. Para igrejas, o registro é feito no Cartório de Registro Civil das Pessoas Jurídicas.',
    pratica: [
      'Sem registro a igreja é "de fato": não abre conta em nome próprio nem tem CNPJ.',
      'Alterações de estatuto e eleição de diretoria também vão ao cartório para valer contra terceiros.',
    ],
    fonte: { rotulo: 'Lei de Registros Públicos', url: P + 'leis/l6015compilada.htm' },
    busca: 'registro civil pessoas jurídicas igreja estatuto cartório',
    tags: ['registro', 'cartório', 'CNPJ', 'estatuto', 'ata'],
  },
  {
    id: 'cc-53-61',
    grupo: 'codigo_civil',
    titulo: 'Regras de associações aplicadas por analogia às igrejas',
    ref: 'Código Civil, arts. 53 a 61',
    situacao: 'alterada',
    resumo:
      'O estatuto deve trazer denominação, fins, sede, requisitos de admissão, demissão e exclusão de associados, fonte de recursos, modo de constituição e funcionamento dos órgãos, e regras para reforma do estatuto e dissolução. A exclusão de associado só é admitida havendo justa causa prevista no estatuto, com direito de defesa e recurso. Dissolvida a entidade, o patrimônio vai para a entidade de fins não econômicos indicada no estatuto.',
    pratica: [
      'Disciplina de membros e afastamento de líderes devem seguir o procedimento do próprio estatuto (defesa e recurso).',
      'Escreva no estatuto para quem vai o patrimônio se a igreja acabar, para evitar disputa.',
      'Os arts. 44 e seguintes tratam das associações; a jurisprudência costuma aplicá-los às igrejas de forma subsidiária.',
    ],
    fonte: { rotulo: 'Código Civil compilado', url: P + 'leis/2002/l10406compilada.htm' },
    busca: 'exclusão de associado igreja estatuto direito de defesa art. 57 Código Civil',
    tags: ['estatuto', 'exclusão de membro', 'disciplina', 'dissolução', 'assembleia'],
  },
  {
    id: 'cc-50',
    grupo: 'codigo_civil',
    titulo: 'Desconsideração da personalidade jurídica',
    ref: 'Código Civil, art. 50',
    situacao: 'alterada',
    resumo:
      'Em caso de abuso da personalidade jurídica (desvio de finalidade ou confusão patrimonial), o juiz pode estender obrigações da entidade aos bens de administradores ou sócios beneficiados. O artigo foi detalhado pela Lei 13.874/2019.',
    pratica: ['Misturar dinheiro pessoal do pastor com o da igreja é o maior risco: mantenha contas, recibos e prestação de contas separados.'],
    fonte: { rotulo: 'Código Civil compilado', url: P + 'leis/2002/l10406compilada.htm' },
    busca: 'desconsideração da personalidade jurídica igreja confusão patrimonial',
    tags: ['patrimônio', 'responsabilidade', 'pastor', 'contas'],
  },
  {
    id: 'cc-1515',
    grupo: 'codigo_civil',
    titulo: 'Casamento religioso com efeitos civis',
    ref: 'Código Civil, arts. 1.515 e 1.516',
    situacao: 'vigente',
    resumo:
      'O casamento religioso que atender às exigências da lei para a validade do casamento civil equipara-se a este, desde que registrado no registro próprio, produzindo efeitos a partir da celebração. O registro submete-se aos mesmos requisitos do casamento civil.',
    pratica: ['A igreja deve orientar o casal a fazer a habilitação no cartório ANTES da cerimônia, se quiser efeito civil.'],
    fonte: { rotulo: 'Código Civil compilado', url: P + 'leis/2002/l10406compilada.htm' },
    busca: 'casamento religioso com efeitos civis habilitação cartório',
    tags: ['casamento', 'cerimônia', 'cartório'],
  },

  // ───────────── LEIS ESPARSAS ─────────────
  {
    id: 'lei-9982',
    grupo: 'leis',
    titulo: 'Assistência religiosa em hospitais e presídios',
    ref: 'Lei 9.982/2000',
    situacao: 'vigente',
    resumo:
      'Dispõe sobre a prestação de assistência religiosa nas entidades hospitalares públicas e privadas, bem como nos estabelecimentos prisionais civis e militares.',
    pratica: ['Visitas de capelães e voluntários devem respeitar as normas internas da instituição, mas a entrada para assistência religiosa é um direito.'],
    fonte: { rotulo: 'Lei 9.982/2000', url: P + 'leis/l9982.htm' },
    busca: 'Lei 9.982 assistência religiosa hospitais presídios',
    tags: ['capelania', 'hospital', 'presídio'],
  },
  {
    id: 'lep-24',
    grupo: 'leis',
    titulo: 'Assistência religiosa a presos e internados',
    ref: 'Lei 7.210/1984 (LEP), art. 24',
    situacao: 'vigente',
    resumo:
      'A assistência religiosa, com liberdade de culto, será prestada aos presos e aos internados, permitindo-lhes a participação nos serviços organizados no estabelecimento e a posse de livros de instrução religiosa. Nenhum preso ou internado poderá ser obrigado a participar de atividade religiosa.',
    fonte: { rotulo: 'Lei de Execução Penal', url: P + 'leis/l7210.htm' },
    busca: 'Lei de Execução Penal art. 24 assistência religiosa',
    tags: ['presídio', 'capelania', 'preso'],
  },
  {
    id: 'ldb-33',
    grupo: 'leis',
    titulo: 'Ensino religioso na LDB',
    ref: 'Lei 9.394/1996 (LDB), art. 33',
    situacao: 'alterada',
    resumo:
      'O ensino religioso, de matrícula facultativa, é parte integrante da formação básica do cidadão e disciplina dos horários normais das escolas públicas de ensino fundamental, assegurado o respeito à diversidade cultural religiosa do Brasil, vedadas quaisquer formas de proselitismo (redação da Lei 9.475/1997).',
    fonte: { rotulo: 'LDB no Planalto', url: P + 'leis/l9394.htm' },
    busca: 'LDB art. 33 ensino religioso proselitismo',
    tags: ['escola', 'ensino religioso'],
  },
  {
    id: 'lei-9608',
    grupo: 'leis',
    titulo: 'Trabalho voluntário na igreja',
    ref: 'Lei 9.608/1998',
    situacao: 'vigente',
    resumo:
      'Serviço voluntário é a atividade não remunerada prestada por pessoa física a entidade pública ou a instituição privada de fins não lucrativos que tenha objetivos cívicos, culturais, educacionais, científicos, recreativos ou de assistência (inclusive mutualidade). Não gera vínculo empregatício nem obrigação trabalhista ou previdenciária. O serviço deve ser formalizado por termo de adesão.',
    pratica: [
      'Formalize com termo de adesão por escrito para obreiros, professores de EBD, equipe de mídia etc.',
      'O voluntário só pode receber ressarcimento de despesas comprovadas. Pagamento habitual disfarçado descaracteriza o voluntariado.',
    ],
    fonte: { rotulo: 'Lei do Voluntariado', url: P + 'leis/l9608.htm' },
    busca: 'Lei 9.608 serviço voluntário igreja termo de adesão vínculo',
    tags: ['voluntário', 'obreiro', 'trabalhista', 'termo de adesão'],
  },
  {
    id: 'lei-13019',
    grupo: 'leis',
    titulo: 'Parcerias com o poder público (Marco Regulatório das OSCs)',
    ref: 'Lei 13.019/2014, art. 2º, I, "c"',
    situacao: 'alterada',
    resumo:
      'Inclui entre as organizações da sociedade civil as organizações religiosas que se dediquem a atividades ou projetos de interesse público e de cunho social distintos dos destinados a fins exclusivamente religiosos (redação da Lei 13.204/2015).',
    pratica: [
      'A igreja pode firmar termo de fomento ou de colaboração com prefeitura ou governo para projetos sociais, nunca para finalidade puramente religiosa.',
      'Exige prestação de contas e comprovação de experiência prévia e capacidade técnica.',
    ],
    fonte: { rotulo: 'Lei 13.019/2014', url: P + '_ato2011-2014/2014/lei/l13019.htm' },
    busca: 'Lei 13.019 organizações religiosas parceria termo de fomento',
    tags: ['parceria', 'projeto social', 'convênio', 'prestação de contas'],
  },
  {
    id: 'lei-9790',
    grupo: 'leis',
    titulo: 'OSCIP: instituições religiosas ficam de fora',
    ref: 'Lei 9.790/1999, art. 2º',
    situacao: 'vigente',
    resumo:
      'A lei das OSCIPs lista entidades que não podem receber essa qualificação, e entre elas estão as instituições religiosas ou voltadas para a disseminação de credos, cultos, práticas e visões devocionais e confessionais.',
    pratica: ['A igreja em si não vira OSCIP. Quem quer executar projetos sociais costuma criar uma entidade separada (associação) ou usar a Lei 13.019/2014.'],
    fonte: { rotulo: 'Lei 9.790/1999', url: P + 'leis/l9790.htm' },
    busca: 'Lei 9.790 OSCIP instituições religiosas vedação',
    tags: ['OSCIP', 'projeto social', 'entidade separada'],
  },
  {
    id: 'lei-13709',
    grupo: 'leis',
    titulo: 'LGPD: dados de fé e cadastro de membros',
    ref: 'Lei 13.709/2018, arts. 5º, II e 11',
    situacao: 'vigente',
    resumo:
      'Dado pessoal sobre convicção religiosa é dado pessoal sensível e tem regras mais rígidas de tratamento (art. 11). O cadastro de membros, fotos, endereços e mensagens da igreja são dados pessoais protegidos.',
    pratica: [
      'Colete só o necessário e guarde com segurança (senha, acesso restrito a quem precisa).',
      'Registre o consentimento ou a base legal e informe para que os dados são usados.',
      'Não publique lista de membros, aniversariantes ou foto de menor sem autorização adequada (dos responsáveis, no caso de crianças).',
      'Tenha um canal para o membro pedir correção ou exclusão dos seus dados.',
    ],
    fonte: { rotulo: 'LGPD no Planalto', url: P + '_ato2015-2018/2018/lei/l13709.htm' },
    busca: 'LGPD igreja dados sensíveis convicção religiosa cadastro de membros',
    tags: ['LGPD', 'dados', 'privacidade', 'cadastro', 'menores', 'fotos'],
  },
  {
    id: 'lei-9093',
    grupo: 'leis',
    titulo: 'Feriados religiosos',
    ref: 'Lei 9.093/1995, art. 2º',
    situacao: 'vigente',
    resumo:
      'São feriados religiosos os dias de guarda, declarados em lei municipal, de acordo com a tradição local e em número não superior a quatro, neste incluída a Sexta-Feira da Paixão.',
    fonte: { rotulo: 'Lei 9.093/1995', url: P + 'leis/l9093.htm' },
    busca: 'Lei 9.093 feriados religiosos lei municipal',
    tags: ['feriado', 'calendário'],
  },
  {
    id: 'lei-13425',
    grupo: 'leis',
    titulo: 'Segurança contra incêndio em locais de reunião de público',
    ref: 'Lei 13.425/2017 (Lei Kiss)',
    situacao: 'vigente',
    resumo:
      'Estabelece diretrizes gerais sobre medidas de prevenção e combate a incêndio e a desastres em estabelecimentos, edificações e áreas de reunião de público. Templos e salões de culto entram nessa categoria, e as exigências práticas (saídas de emergência, extintores, laudo) vêm da regulamentação estadual do Corpo de Bombeiros.',
    pratica: ['Confira no Corpo de Bombeiros do seu Estado se o templo precisa de projeto e do certificado (AVCB ou equivalente) e mantenha-o atualizado.'],
    fonte: { rotulo: 'Lei 13.425/2017', url: P + '_ato2015-2018/2017/lei/l13425.htm' },
    busca: 'Lei 13.425 Kiss templo igreja AVCB bombeiros',
    tags: ['bombeiros', 'AVCB', 'alvará', 'segurança', 'templo'],
  },
  {
    id: 'lei-9610',
    grupo: 'leis',
    titulo: 'Direitos autorais: músicas e projeção em cultos',
    ref: 'Lei 9.610/1998, arts. 46, VI e 68',
    situacao: 'vigente',
    resumo:
      'A execução pública de obras musicais depende de autorização do titular (art. 68). O art. 46, VI, afasta a violação em execuções no recesso familiar ou com fins exclusivamente didáticos em estabelecimentos de ensino, sem intuito de lucro. Como isso se aplica a cultos e transmissões online gera discussão, e o entendimento pode variar.',
    pratica: ['Para transmissões ao vivo, prefira repertório próprio, de domínio público ou com licença. Em caso de cobrança, procure orientação jurídica.'],
    fonte: { rotulo: 'Lei 9.610/1998', url: P + 'leis/l9610.htm' },
    busca: 'direitos autorais igreja culto músicas ECAD art. 68',
    tags: ['música', 'ECAD', 'transmissão', 'direitos autorais'],
  },
  {
    id: 'dec-7107',
    grupo: 'leis',
    titulo: 'Acordo Brasil–Santa Sé (Estatuto Jurídico da Igreja Católica)',
    ref: 'Decreto 7.107/2010',
    situacao: 'vigente',
    resumo:
      'Promulga o acordo entre o Brasil e a Santa Sé sobre o estatuto jurídico da Igreja Católica no país. É o principal texto internacional específico sobre uma confissão, e serve de referência nos debates sobre igualdade de tratamento entre religiões.',
    fonte: { rotulo: 'Decreto 7.107/2010', url: P + '_ato2007-2010/2010/decreto/d7107.htm' },
    busca: 'Decreto 7.107 acordo Brasil Santa Sé',
    tags: ['concordata', 'Igreja Católica', 'acordo internacional'],
  },
  {
    id: 'lcp-187',
    grupo: 'leis',
    titulo: 'Certificação de entidades beneficentes (CEBAS)',
    ref: 'Lei Complementar 187/2021',
    situacao: 'vigente',
    resumo:
      'Novo marco da certificação das entidades beneficentes de assistência social, educação e saúde, que substituiu a Lei 12.101/2009. Aplica-se a entidades sociais mantidas por igrejas (escola, hospital, obra social), não ao culto em si.',
    pratica: ['Só interessa se a igreja mantém uma entidade social com esse perfil. Ela costuma ser uma pessoa jurídica separada.'],
    fonte: { rotulo: 'LC 187/2021', url: P + 'leis/lcp/lcp187.htm' },
    busca: 'Lei Complementar 187/2021 CEBAS entidades beneficentes',
    tags: ['CEBAS', 'filantropia', 'entidade beneficente'],
  },

  // ───────────── TRIBUTOS E PREVIDÊNCIA ─────────────
  {
    id: 'ctn-9',
    grupo: 'tributario',
    titulo: 'CTN: imunidade de templos e responsabilidade por retenções',
    ref: 'CTN (Lei 5.172/1966), art. 9º, IV, "b" e art. 14',
    situacao: 'vigente',
    resumo:
      'O CTN repete a vedação de impostos sobre templos de qualquer culto. O art. 14 traz condições para as entidades sem fins lucrativos da alínea "c": não distribuir patrimônio ou renda, aplicar os recursos no país e manter escrituração regular. Mesmo imune, a entidade continua responsável por reter e recolher tributos de terceiros quando a lei assim determina.',
    pratica: ['Imunidade não dispensa cumprir obrigações acessórias nem reter tributos de prestadores e funcionários. Ter contador é essencial.'],
    fonte: { rotulo: 'CTN compilado', url: P + 'leis/l5172compilado.htm' },
    busca: 'CTN art. 9 IV b templos imunidade art. 14 requisitos',
    tags: ['imunidade', 'retenção', 'obrigações acessórias', 'escrituração'],
  },
  {
    id: 'lei-8212',
    grupo: 'tributario',
    titulo: 'Pastor e ministro de confissão religiosa na Previdência',
    ref: 'Lei 8.212/1991, art. 12, V, "c" e art. 22, § 13',
    situacao: 'alterada',
    resumo:
      'O ministro de confissão religiosa e o membro de instituto de vida consagrada, de congregação ou de ordem religiosa são segurados contribuintes individuais. Os valores pagos pelas entidades religiosas a esses ministros em razão do seu mister religioso ou para sua subsistência, quando fornecidos independentemente da natureza e da quantidade do trabalho executado, não são considerados remuneração para fins de contribuição patronal.',
    pratica: [
      'Pastor normalmente contribui como contribuinte individual (INSS), e a igreja não recolhe a parte patronal sobre a côngrua nessas condições.',
      'Vínculo empregatício de pastor é tema controvertido. Depende dos fatos do caso (subordinação, salário, jornada), então peça parecer de advogado trabalhista.',
      'Funcionários comuns (secretaria, limpeza, músicos contratados) seguem a CLT normalmente.',
    ],
    fonte: { rotulo: 'Lei 8.212/1991', url: P + 'leis/l8212cons.htm' },
    busca: 'ministro de confissão religiosa contribuinte individual INSS pastor art. 22 §13',
    tags: ['pastor', 'INSS', 'côngrua', 'previdência', 'trabalhista'],
  },
  {
    id: 'ec-132',
    grupo: 'tributario',
    titulo: 'Reforma tributária e igrejas (em transição)',
    ref: 'EC 132/2023 e LC 214/2025',
    situacao: 'orientacao',
    resumo:
      'A reforma do consumo criou IBS e CBS, com transição gradual. A imunidade de templos continua prevista na Constituição, mas os efeitos práticos para entidades religiosas nas compras e nos serviços dependem da regulamentação e da transição, que ainda está em andamento.',
    pratica: ['Acompanhe com o contador da igreja: regras e datas de transição podem ter mudado depois desta revisão do conteúdo.'],
    fonte: { rotulo: 'Legislação no Planalto', url: 'https://legislacao.presidencia.gov.br/' },
    busca: 'reforma tributária templos igrejas imunidade IBS CBS',
    tags: ['reforma tributária', 'IBS', 'CBS', 'imunidade'],
  },

  // ───────────── PENAL ─────────────
  {
    id: 'cp-208',
    grupo: 'penal',
    titulo: 'Ultraje a culto e impedimento de cerimônia religiosa',
    ref: 'Código Penal, art. 208',
    situacao: 'vigente',
    resumo:
      'É crime escarnecer publicamente de alguém por motivo de crença ou função religiosa, impedir ou perturbar cerimônia ou prática de culto religioso e vilipendiar publicamente ato ou objeto de culto religioso. Pena: detenção de um mês a um ano, ou multa.',
    pratica: ['Em caso de invasão ou perturbação do culto, registre boletim de ocorrência e guarde provas (vídeos, testemunhas).'],
    fonte: { rotulo: 'Código Penal', url: P + 'decreto-lei/del2848compilado.htm' },
    busca: 'art. 208 Código Penal ultraje a culto perturbação de cerimônia religiosa',
    tags: ['crime', 'culto', 'perturbação', 'ultraje'],
  },
  {
    id: 'lei-7716',
    grupo: 'penal',
    titulo: 'Crimes de discriminação por religião',
    ref: 'Lei 7.716/1989, art. 1º (redação da Lei 9.459/1997)',
    situacao: 'alterada',
    resumo:
      'Serão punidos, na forma da lei, os crimes resultantes de discriminação ou preconceito de raça, cor, etnia, religião ou procedência nacional.',
    pratica: ['Serve também de proteção a membros e templos vítimas de intolerância religiosa.'],
    fonte: { rotulo: 'Lei 7.716/1989', url: P + 'leis/l7716.htm' },
    busca: 'Lei 7.716 intolerância religiosa discriminação religião',
    tags: ['intolerância religiosa', 'discriminação', 'crime'],
  },
  {
    id: 'lcp-42',
    grupo: 'penal',
    titulo: 'Barulho e sossego alheio (culto e som alto)',
    ref: 'Lei das Contravenções Penais (Decreto-Lei 3.688/1941), art. 42',
    situacao: 'vigente',
    resumo:
      'Constitui contravenção perturbar alguém, o trabalho ou o sossego alheios com gritaria ou algazarra, exercendo profissão incômoda ou ruidosa em desacordo com prescrições legais, ou abusando de instrumentos sonoros ou sinais acústicos.',
    pratica: [
      'Liberdade de culto não afasta os limites de ruído fixados por lei municipal (lei do silêncio) e normas técnicas.',
      'Tratamento acústico do templo e horários de ensaio reduzem o risco de denúncias e ações.',
    ],
    fonte: { rotulo: 'Lei das Contravenções Penais', url: P + 'decreto-lei/del3688.htm' },
    busca: 'igreja barulho culto som alto perturbação do sossego art. 42 contravenções',
    tags: ['barulho', 'som', 'vizinhos', 'sossego', 'poluição sonora'],
  },

  // ───────────── JURISPRUDÊNCIA ─────────────
  {
    id: 'stf-re-325822',
    grupo: 'jurisprudencia',
    titulo: 'Imunidade do IPTU sobre imóveis de entidades religiosas',
    ref: 'STF, RE 325.822/SP (2002)',
    situacao: 'orientacao',
    resumo:
      'O STF entendeu que a imunidade dos templos alcança o patrimônio da entidade religiosa, inclusive imóveis que não sejam o local do culto, quando relacionados às suas finalidades essenciais, e não se limita ao prédio onde ocorre a celebração.',
    pratica: ['Prefeituras costumam cobrar IPTU de terrenos e salas da igreja. Guarde a prova de que o imóvel e a renda servem às finalidades essenciais.'],
    fonte: { rotulo: 'Portal de jurisprudência do STF', url: 'https://jurisprudencia.stf.jus.br/' },
    busca: 'RE 325822 imunidade IPTU templo entidade religiosa',
    tags: ['IPTU', 'imunidade', 'imóvel', 'prefeitura'],
  },
  {
    id: 'stf-sv-52',
    grupo: 'jurisprudencia',
    titulo: 'Súmula Vinculante 52: imóvel alugado e IPTU',
    ref: 'STF, Súmula Vinculante 52 (antiga Súmula 724)',
    situacao: 'vigente',
    resumo:
      'Ainda que alugado a terceiros, permanece imune ao IPTU o imóvel pertencente às entidades referidas no art. 150, VI, "c", da Constituição, desde que o valor dos aluguéis seja aplicado nas atividades para as quais tais entidades foram constituídas.',
    pratica: [
      'Atenção: a súmula cita a alínea "c" (partidos, sindicatos, entidades de educação e assistência social). Para templos (alínea "b"), o argumento usado é o do art. 150, § 4º e o precedente do RE 325.822.',
    ],
    fonte: { rotulo: 'Súmulas vinculantes (STF)', url: 'https://portal.stf.jus.br/jurisprudencia/aplicacaosumulasvinculantes.asp' },
    busca: 'Súmula Vinculante 52 IPTU imóvel alugado imunidade',
    tags: ['IPTU', 'aluguel', 'súmula vinculante'],
  },
  {
    id: 'stf-re-578562',
    grupo: 'jurisprudencia',
    titulo: 'Cemitérios de entidades religiosas e a imunidade',
    ref: 'STF, RE 578.562/BA (2008)',
    situacao: 'orientacao',
    resumo:
      'O STF reconheceu que cemitérios que sejam extensões de entidades religiosas estão abrangidos pela imunidade tributária de templos.',
    fonte: { rotulo: 'Portal de jurisprudência do STF', url: 'https://jurisprudencia.stf.jus.br/' },
    busca: 'RE 578562 cemitério extensão entidade religiosa imunidade',
    tags: ['cemitério', 'imunidade', 'templo'],
  },
  {
    id: 'stf-adi-4439',
    grupo: 'jurisprudencia',
    titulo: 'Ensino religioso confessional em escola pública',
    ref: 'STF, ADI 4.439 (27/09/2017)',
    situacao: 'orientacao',
    resumo:
      'Por maioria, o STF julgou constitucional o ensino religioso de natureza confessional (vinculado a uma religião específica) nas escolas públicas, desde que a matrícula seja facultativa.',
    fonte: { rotulo: 'Portal de jurisprudência do STF', url: 'https://jurisprudencia.stf.jus.br/' },
    busca: 'ADI 4439 ensino religioso confessional escola pública STF',
    tags: ['ensino religioso', 'escola', 'confessional'],
  },
  {
    id: 'stf-re-494601',
    grupo: 'jurisprudencia',
    titulo: 'Sacrifício ritual de animais em cultos',
    ref: 'STF, RE 494.601/RS (Tema 472, 28/03/2019)',
    situacao: 'orientacao',
    resumo:
      'O STF entendeu constitucional lei estadual que permite o sacrifício ritual de animais em cultos de religiões de matriz africana, desde que sem maus-tratos e com consumo da carne. O caso reforça a proteção à liberdade de culto de todas as religiões.',
    fonte: { rotulo: 'Portal de jurisprudência do STF', url: 'https://jurisprudencia.stf.jus.br/' },
    busca: 'RE 494601 Tema 472 sacrifício ritual animais culto',
    tags: ['culto', 'matriz africana', 'liberdade religiosa', 'animais'],
  },
  {
    id: 'stf-adpf-811',
    grupo: 'jurisprudencia',
    titulo: 'Restrição de cultos presenciais na pandemia',
    ref: 'STF, ADPF 811 (abril/2021)',
    situacao: 'orientacao',
    resumo:
      'O STF validou a possibilidade de Estados e Municípios restringirem cultos e missas presenciais durante a pandemia de Covid-19, por razões sanitárias, sem que isso configure violação à liberdade religiosa, desde que a medida seja proporcional e não proíba o exercício de culto de forma discriminatória.',
    pratica: ['Serve de referência para futuras emergências de saúde ou segurança: o direito ao culto convive com limites gerais e proporcionais.'],
    fonte: { rotulo: 'Portal de jurisprudência do STF', url: 'https://jurisprudencia.stf.jus.br/' },
    busca: 'ADPF 811 cultos presenciais pandemia STF',
    tags: ['pandemia', 'culto presencial', 'restrição', 'saúde'],
  },
  {
    id: 'stf-ado-26',
    grupo: 'jurisprudencia',
    titulo: 'Liberdade religiosa e pregação (ADO 26 e MI 4.733)',
    ref: 'STF, ADO 26 e MI 4.733 (13/06/2019)',
    situacao: 'orientacao',
    resumo:
      'Ao enquadrar a homofobia e a transfobia na Lei 7.716/1989, o STF fixou tese de que a repressão penal não alcança nem restringe o exercício da liberdade religiosa, sendo assegurado a fiéis e ministros pregar e divulgar livremente seu pensamento e suas convicções segundo seus livros sagrados, ensinar segundo sua orientação doutrinária e praticar os atos de culto. A tese ressalva que o discurso que configure incitação à discriminação ou violência continua sujeito à lei.',
    pratica: ['A fronteira entre pregação doutrinária e discurso de ódio é analisada caso a caso. Oriente pregadores a manter o foco no ensino e no respeito às pessoas.'],
    fonte: { rotulo: 'Portal de jurisprudência do STF', url: 'https://jurisprudencia.stf.jus.br/' },
    busca: 'ADO 26 MI 4733 liberdade religiosa pregação tese',
    tags: ['pregação', 'liberdade de expressão', 'discurso'],
  },
  {
    id: 'stf-tema-386',
    grupo: 'jurisprudencia',
    titulo: 'Guarda do sábado e concursos/estágio probatório',
    ref: 'STF, RE 611.874 (Tema 386) e ARE 1.099.099 (Tema 1.021), 26/11/2020',
    situacao: 'orientacao',
    resumo:
      'O STF fixou entendimentos favoráveis à realização de etapas de concurso público em data alternativa e à ausência de prejuízo funcional em estágio probatório por motivo de crença (guarda de dia religioso), desde que haja razoabilidade e a Administração possa fazer a adequação sem ônus desproporcional.',
    fonte: { rotulo: 'Portal de jurisprudência do STF', url: 'https://jurisprudencia.stf.jus.br/' },
    busca: 'Tema 386 Tema 1021 STF guarda do sábado concurso público estágio probatório',
    tags: ['sábado', 'concurso', 'crença', 'servidor'],
  },

  // ───────────── HISTÓRICO E REVOGADOS ─────────────
  {
    id: 'dec-119a',
    grupo: 'historico',
    titulo: 'Decreto 119-A/1890: separação entre Estado e Igreja',
    ref: 'Decreto 119-A, de 7 de janeiro de 1890',
    situacao: 'historica',
    resumo:
      'Primeiro ato republicano a proibir a intervenção da autoridade federal e dos Estados em matéria religiosa e a consagrar a plena liberdade de cultos, extinguindo o padroado. Marca o fim da religião oficial no Brasil.',
    fonte: { rotulo: 'Decreto 119-A', url: P + 'decreto/1851-1899/d119-a.htm' },
    busca: 'Decreto 119-A 1890 separação Igreja Estado',
    tags: ['laicidade', 'república', 'padroado'],
  },
  {
    id: 'cf-1824',
    grupo: 'historico',
    titulo: 'Constituição de 1824: religião oficial católica',
    ref: 'Constituição Política do Império, art. 5º',
    situacao: 'revogada',
    resumo:
      'A religião católica apostólica romana era a religião oficial do Império. As demais religiões eram permitidas apenas com culto doméstico ou particular, em casas sem forma exterior de templo.',
    fonte: { rotulo: 'Constituição de 1824', url: P + 'constituicao/constituicao24.htm' },
    busca: 'Constituição de 1824 art. 5 religião oficial culto doméstico',
    tags: ['império', 'religião oficial'],
  },
  {
    id: 'cf-1891',
    grupo: 'historico',
    titulo: 'Constituição de 1891: Estado laico',
    ref: 'Constituição de 1891, art. 72, §§ 3º a 7º',
    situacao: 'revogada',
    resumo:
      'Estabeleceu que todos os indivíduos e confissões religiosas podem exercer pública e livremente o seu culto, associando-se para esse fim e adquirindo bens, observadas as disposições do direito comum. Aboliu subvenção oficial a cultos e o casamento civil passou a ser o único reconhecido.',
    fonte: { rotulo: 'Constituição de 1891', url: P + 'constituicao/constituicao91.htm' },
    busca: 'Constituição 1891 art. 72 liberdade de culto Estado laico',
    tags: ['república', 'laicidade'],
  },
  {
    id: 'cc-1916',
    grupo: 'historico',
    titulo: 'Código Civil de 1916 e as "sociedades religiosas"',
    ref: 'Lei 3.071/1916, art. 16',
    situacao: 'revogada',
    resumo:
      'O código anterior tratava as sociedades religiosas como pessoas jurídicas de direito privado dentro do gênero das "sociedades civis". Foi revogado pelo Código Civil de 2002, que criou a categoria própria de "organizações religiosas" (art. 44, IV).',
    fonte: { rotulo: 'Código Civil de 1916', url: P + 'leis/l3071.htm' },
    busca: 'Código Civil 1916 art. 16 sociedades religiosas pessoas jurídicas',
    tags: ['código civil', 'histórico'],
  },
  {
    id: 'lei-10825',
    grupo: 'historico',
    titulo: 'Lei 10.825/2003: liberdade de organização das igrejas',
    ref: 'Lei 10.825/2003',
    situacao: 'vigente',
    resumo:
      'Alterou os arts. 44 e 2.031 do Código Civil para incluir as organizações religiosas e os partidos políticos como pessoas jurídicas de direito privado, garantindo a liberdade de criação, organização, estruturação interna e funcionamento das organizações religiosas, com adaptação dos estatutos aos novos comandos.',
    fonte: { rotulo: 'Lei 10.825/2003', url: P + 'leis/2003/l10.825.htm' },
    busca: 'Lei 10.825/2003 organizações religiosas art. 44 Código Civil',
    tags: ['organização religiosa', 'estatuto'],
  },
  {
    id: 'lei-11127',
    grupo: 'historico',
    titulo: 'Lei 11.127/2005: ajustes nas regras de associações',
    ref: 'Lei 11.127/2005',
    situacao: 'vigente',
    resumo:
      'Modificou artigos do Código Civil sobre associações (entre eles as regras de exclusão de associado e competências da assembleia geral), relevantes por analogia à vida interna das igrejas.',
    fonte: { rotulo: 'Lei 11.127/2005', url: P + '_ato2004-2006/2005/lei/l11127.htm' },
    busca: 'Lei 11.127/2005 associações exclusão de associado assembleia',
    tags: ['associação', 'assembleia'],
  },
  {
    id: 'lei-12101',
    grupo: 'historico',
    titulo: 'Lei 12.101/2009 (certificação de entidades beneficentes)',
    ref: 'Lei 12.101/2009',
    situacao: 'revogada',
    resumo:
      'Regia a certificação (CEBAS) e a isenção de contribuições sociais de entidades beneficentes. Foi revogada pela Lei Complementar 187/2021, que passou a ser a norma em vigor.',
    fonte: { rotulo: 'Lei 12.101/2009', url: P + '_ato2007-2010/2009/lei/l12101.htm' },
    busca: 'Lei 12.101 revogada Lei Complementar 187 CEBAS',
    tags: ['CEBAS', 'revogada'],
  },

  // ───────────── GUIAS PRÁTICOS ─────────────
  {
    id: 'guia-abertura',
    grupo: 'guia',
    titulo: 'Roteiro para constituir uma igreja (visão geral)',
    ref: 'Guia prático: consulte advogado e contador',
    situacao: 'orientacao',
    resumo: 'Passo a passo comum. Detalhes variam por cartório, município e Estado.',
    pratica: [
      '1. Ata de fundação, com eleição da diretoria e aprovação do estatuto, assinada pelos presentes.',
      '2. Estatuto com nome, sede, finalidade religiosa, membros e disciplina (com direito de defesa e recurso), órgãos, eleições, fonte de recursos, reforma do estatuto e destino do patrimônio na dissolução.',
      '3. Registro no Cartório de Registro Civil das Pessoas Jurídicas da sede (nascimento legal da entidade).',
      '4. CNPJ na Receita Federal: natureza jurídica "Organização Religiosa" (código 322-0) e CNAE 9491-0/00 (atividades de organizações religiosas).',
      '5. Inscrição municipal e alvará de funcionamento, conforme a lei do município.',
      '6. Regularização do imóvel: uso do solo compatível, projeto e certificado do Corpo de Bombeiros, acessibilidade.',
      '7. Conta bancária em nome da igreja, com controle de dízimos e ofertas, recibos e prestação de contas à assembleia.',
      '8. Solicitar o reconhecimento da imunidade tributária junto ao município (IPTU) quando aplicável.',
    ],
    busca: 'como abrir uma igreja registro cartório CNPJ organização religiosa',
    tags: ['abrir igreja', 'CNPJ', 'estatuto', 'ata', 'cartório'],
  },
  {
    id: 'guia-manutencao',
    grupo: 'guia',
    titulo: 'Rotina de conformidade da igreja',
    ref: 'Guia prático',
    situacao: 'orientacao',
    resumo: 'Hábitos que evitam a maior parte dos problemas jurídicos.',
    pratica: [
      'Realizar assembleia nas datas do estatuto e registrar em ata, levando ao cartório eleições e alterações.',
      'Manter contabilidade organizada, com livro-caixa, recibos de dízimos e ofertas, notas de despesas e prestação de contas anual.',
      'Separar por completo as finanças pessoais do pastor das da igreja.',
      'Formalizar voluntários com termo de adesão e funcionários pela CLT; combinar por escrito o sustento do ministro.',
      'Proteger dados dos membros (LGPD) e ter autorização de imagem, principalmente de crianças.',
      'Renovar alvará, certificado do Corpo de Bombeiros e seguros do templo.',
      'Cuidar da política de proteção infantil: cadastro de voluntários que trabalham com crianças e regras de acompanhamento.',
      'Revisar o estatuto com um advogado a cada mudança relevante de estrutura.',
    ],
    busca: 'conformidade jurídica igreja compliance contabilidade estatuto',
    tags: ['conformidade', 'contabilidade', 'assembleia', 'rotina'],
  },
  {
    id: 'guia-processo',
    grupo: 'guia',
    titulo: 'Recebeu cobrança, intimação ou notificação?',
    ref: 'Guia prático',
    situacao: 'orientacao',
    resumo: 'O que fazer nas primeiras horas.',
    pratica: [
      'Não ignore prazo: intimações judiciais e cobranças administrativas têm datas curtas.',
      'Guarde o documento original e registre data e forma de recebimento.',
      'Reúna estatuto, ata de eleição da diretoria, CNPJ e comprovantes de recolhimento.',
      'Procure advogado e contador antes de responder. Não faça acordo verbal.',
      'Para cobrança de IPTU ou taxa, verifique se a imunidade já foi reconhecida por escrito no município.',
    ],
    busca: 'igreja notificação cobrança prefeitura imunidade recurso administrativo',
    tags: ['cobrança', 'notificação', 'intimação', 'prazo'],
  },
];
