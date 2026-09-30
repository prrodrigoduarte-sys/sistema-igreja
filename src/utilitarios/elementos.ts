// Os 118 elementos químicos. Massas atômicas padrão (IUPAC, arredondadas); para elementos sem isótopo
// estável, a massa é o número de massa do isótopo mais duradouro (exibida entre parênteses).

export type Categoria = 'AL' | 'AT' | 'TR' | 'PT' | 'SM' | 'NM' | 'HA' | 'GN' | 'LA' | 'AC';

export interface Elemento {
  z: number;
  simbolo: string;
  nome: string;
  massa: number;
  categoria: Categoria;
  linha: number; // posição na grade (1 a 10)
  coluna: number; // posição na grade (1 a 18)
  grupo: number | null; // null = bloco f (lantanídeos e actinídeos)
  periodo: number;
  estado: string;
  radioativo: boolean; // sem isótopo estável: massa é número de massa
}

export const CATEGORIAS: Record<Categoria, { nome: string; celula: string; chip: string }> = {
  AL: { nome: 'Metais alcalinos', celula: 'bg-rose-200 text-rose-950', chip: 'bg-rose-200 text-rose-950' },
  AT: { nome: 'Metais alcalino-terrosos', celula: 'bg-orange-200 text-orange-950', chip: 'bg-orange-200 text-orange-950' },
  TR: { nome: 'Metais de transição', celula: 'bg-amber-200 text-amber-950', chip: 'bg-amber-200 text-amber-950' },
  PT: { nome: 'Outros metais', celula: 'bg-emerald-200 text-emerald-950', chip: 'bg-emerald-200 text-emerald-950' },
  SM: { nome: 'Semimetais', celula: 'bg-teal-200 text-teal-950', chip: 'bg-teal-200 text-teal-950' },
  NM: { nome: 'Ametais', celula: 'bg-sky-200 text-sky-950', chip: 'bg-sky-200 text-sky-950' },
  HA: { nome: 'Halogênios', celula: 'bg-indigo-200 text-indigo-950', chip: 'bg-indigo-200 text-indigo-950' },
  GN: { nome: 'Gases nobres', celula: 'bg-violet-200 text-violet-950', chip: 'bg-violet-200 text-violet-950' },
  LA: { nome: 'Lantanídeos', celula: 'bg-fuchsia-200 text-fuchsia-950', chip: 'bg-fuchsia-200 text-fuchsia-950' },
  AC: { nome: 'Actinídeos', celula: 'bg-pink-200 text-pink-950', chip: 'bg-pink-200 text-pink-950' },
};

// número | símbolo | nome | massa | categoria
const BRUTO = `
1|H|Hidrogênio|1.008|NM
2|He|Hélio|4.0026|GN
3|Li|Lítio|6.94|AL
4|Be|Berílio|9.0122|AT
5|B|Boro|10.81|SM
6|C|Carbono|12.011|NM
7|N|Nitrogênio|14.007|NM
8|O|Oxigênio|15.999|NM
9|F|Flúor|18.998|HA
10|Ne|Neônio|20.180|GN
11|Na|Sódio|22.990|AL
12|Mg|Magnésio|24.305|AT
13|Al|Alumínio|26.982|PT
14|Si|Silício|28.085|SM
15|P|Fósforo|30.974|NM
16|S|Enxofre|32.06|NM
17|Cl|Cloro|35.45|HA
18|Ar|Argônio|39.948|GN
19|K|Potássio|39.098|AL
20|Ca|Cálcio|40.078|AT
21|Sc|Escândio|44.956|TR
22|Ti|Titânio|47.867|TR
23|V|Vanádio|50.942|TR
24|Cr|Cromo|51.996|TR
25|Mn|Manganês|54.938|TR
26|Fe|Ferro|55.845|TR
27|Co|Cobalto|58.933|TR
28|Ni|Níquel|58.693|TR
29|Cu|Cobre|63.546|TR
30|Zn|Zinco|65.38|TR
31|Ga|Gálio|69.723|PT
32|Ge|Germânio|72.630|SM
33|As|Arsênio|74.922|SM
34|Se|Selênio|78.971|NM
35|Br|Bromo|79.904|HA
36|Kr|Criptônio|83.798|GN
37|Rb|Rubídio|85.468|AL
38|Sr|Estrôncio|87.62|AT
39|Y|Ítrio|88.906|TR
40|Zr|Zircônio|91.224|TR
41|Nb|Nióbio|92.906|TR
42|Mo|Molibdênio|95.95|TR
43|Tc|Tecnécio|98|TR
44|Ru|Rutênio|101.07|TR
45|Rh|Ródio|102.91|TR
46|Pd|Paládio|106.42|TR
47|Ag|Prata|107.87|TR
48|Cd|Cádmio|112.41|TR
49|In|Índio|114.82|PT
50|Sn|Estanho|118.71|PT
51|Sb|Antimônio|121.76|SM
52|Te|Telúrio|127.60|SM
53|I|Iodo|126.90|HA
54|Xe|Xenônio|131.29|GN
55|Cs|Césio|132.91|AL
56|Ba|Bário|137.33|AT
57|La|Lantânio|138.91|LA
58|Ce|Cério|140.12|LA
59|Pr|Praseodímio|140.91|LA
60|Nd|Neodímio|144.24|LA
61|Pm|Promécio|145|LA
62|Sm|Samário|150.36|LA
63|Eu|Európio|151.96|LA
64|Gd|Gadolínio|157.25|LA
65|Tb|Térbio|158.93|LA
66|Dy|Disprósio|162.50|LA
67|Ho|Hólmio|164.93|LA
68|Er|Érbio|167.26|LA
69|Tm|Túlio|168.93|LA
70|Yb|Itérbio|173.05|LA
71|Lu|Lutécio|174.97|LA
72|Hf|Háfnio|178.49|TR
73|Ta|Tântalo|180.95|TR
74|W|Tungstênio|183.84|TR
75|Re|Rênio|186.21|TR
76|Os|Ósmio|190.23|TR
77|Ir|Irídio|192.22|TR
78|Pt|Platina|195.08|TR
79|Au|Ouro|196.97|TR
80|Hg|Mercúrio|200.59|TR
81|Tl|Tálio|204.38|PT
82|Pb|Chumbo|207.2|PT
83|Bi|Bismuto|208.98|PT
84|Po|Polônio|209|PT
85|At|Astato|210|HA
86|Rn|Radônio|222|GN
87|Fr|Frâncio|223|AL
88|Ra|Rádio|226|AT
89|Ac|Actínio|227|AC
90|Th|Tório|232.04|AC
91|Pa|Protactínio|231.04|AC
92|U|Urânio|238.03|AC
93|Np|Netúnio|237|AC
94|Pu|Plutônio|244|AC
95|Am|Amerício|243|AC
96|Cm|Cúrio|247|AC
97|Bk|Berquélio|247|AC
98|Cf|Califórnio|251|AC
99|Es|Einstênio|252|AC
100|Fm|Férmio|257|AC
101|Md|Mendelévio|258|AC
102|No|Nobélio|259|AC
103|Lr|Laurêncio|266|AC
104|Rf|Rutherfórdio|267|TR
105|Db|Dúbnio|268|TR
106|Sg|Seabórgio|269|TR
107|Bh|Bóhrio|270|TR
108|Hs|Hássio|277|TR
109|Mt|Meitnério|278|TR
110|Ds|Darmstádio|281|TR
111|Rg|Roentgênio|282|TR
112|Cn|Copernício|285|TR
113|Nh|Nihônio|286|PT
114|Fl|Fleróvio|289|PT
115|Mc|Moscóvio|290|PT
116|Lv|Livermório|293|PT
117|Ts|Tenessino|294|HA
118|Og|Oganessônio|294|GN
`;

function posicao(z: number): { linha: number; coluna: number } {
  if (z === 1) return { linha: 1, coluna: 1 };
  if (z === 2) return { linha: 1, coluna: 18 };
  if (z <= 4) return { linha: 2, coluna: z - 2 };
  if (z <= 10) return { linha: 2, coluna: z + 8 };
  if (z <= 12) return { linha: 3, coluna: z - 10 };
  if (z <= 18) return { linha: 3, coluna: z };
  if (z <= 36) return { linha: 4, coluna: z - 18 };
  if (z <= 54) return { linha: 5, coluna: z - 36 };
  if (z <= 56) return { linha: 6, coluna: z - 54 };
  if (z <= 71) return { linha: 9, coluna: z - 54 }; // lantanídeos
  if (z <= 86) return { linha: 6, coluna: z - 68 };
  if (z <= 88) return { linha: 7, coluna: z - 86 };
  if (z <= 103) return { linha: 10, coluna: z - 86 }; // actinídeos
  return { linha: 7, coluna: z - 100 };
}

const GASES = new Set([1, 2, 7, 8, 9, 10, 17, 18, 36, 54, 86]);
const LIQUIDOS = new Set([35, 80]);

function estadoFisico(z: number): string {
  if (GASES.has(z)) return 'Gasoso';
  if (LIQUIDOS.has(z)) return 'Líquido';
  if (z >= 104) return 'Desconhecido';
  if (z === 85 || z === 87) return 'Sólido (previsto)';
  return 'Sólido';
}

export const ELEMENTOS: Elemento[] = BRUTO.trim()
  .split('\n')
  .map((linha) => {
    const [z, simbolo, nome, massa, categoria] = linha.split('|');
    const numero = Number(z);
    const { linha: l, coluna: c } = posicao(numero);
    const blocoF = l >= 9;
    return {
      z: numero,
      simbolo,
      nome,
      massa: Number(massa),
      categoria: categoria as Categoria,
      linha: l,
      coluna: c,
      grupo: blocoF ? null : c,
      periodo: blocoF ? (l === 9 ? 6 : 7) : l,
      estado: estadoFisico(numero),
      // Tório, protactínio e urânio têm massa padrão (isótopos de vida muito longa); os demais usam número de massa
      radioativo: numero === 43 || numero === 61 || (numero >= 84 && numero !== 90 && numero !== 91 && numero !== 92),
    };
  });

export const semAcento = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const formatarMassa = (e: Elemento) => {
  const texto = String(e.massa).replace('.', ',');
  return e.radioativo ? `(${texto})` : texto;
};
