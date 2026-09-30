// Subtítulos (títulos de seção) da Bíblia, em português.
// Baseados nos títulos da Berean Standard Bible (domínio público), traduzidos.
// Formato de cada linha: livro.capítulo.versículo|Título  (livro de 1 = Gênesis a 66 = Apocalipse)

const DADOS = `1.1.1|A criação
1.1.3|O primeiro dia
1.1.6|O segundo dia
1.1.9|O terceiro dia
1.1.14|O quarto dia
1.1.20|O quinto dia
1.1.24|O sexto dia
1.2.1|O sétimo dia
1.2.4|O homem e a mulher no jardim
1.3.1|O engano da serpente
1.3.8|Deus chama Adão e Eva a prestar contas
1.3.14|O destino da serpente
1.3.16|O castigo da humanidade
1.3.21|A expulsão do paraíso
1.4.1|Caim e Abel
1.4.17|Os descendentes de Caim
1.4.25|Sete e Enos
1.5.1|Os descendentes de Adão
1.5.18|Deus leva Enoque
1.5.25|De Matusalém a Noé
1.6.1|A corrupção na terra
1.6.8|Noé encontra favor diante de Deus
1.6.13|A preparação da arca
1.7.1|O grande dilúvio
1.8.1|A arca repousa sobre o Ararate
1.8.6|Noé solta um corvo e uma pomba
1.8.13|A saída da arca
1.8.20|Noé constrói um altar
1.9.1|A aliança do arco-íris
1.9.18|A vergonha de Noé e a maldição de Canaã
1.9.26|A bênção de Sem e a morte de Noé
1.10.1|A tabela das nações
1.10.2|Os descendentes de Jafé
1.10.6|Os descendentes de Cam
1.10.21|Os descendentes de Sem
1.11.1|A torre de Babel
1.11.10|A genealogia de Sem a Abrão
1.11.27|Os descendentes de Terá
1.12.1|O chamado de Abrão
1.12.10|Abrão e Sarai no Egito
1.13.1|Abrão e Ló se separam
1.13.10|Ló segue em direção a Sodoma
1.13.14|Deus renova a promessa a Abrão
1.14.1|A guerra dos reis
1.14.10|Abrão resgata Ló
1.14.17|Melquisedeque abençoa Abrão
1.15.1|A aliança de Deus com Abrão
1.15.8|Deus confirma a sua promessa
1.16.1|Agar e Ismael
1.17.1|Abraão, pai de muitas nações
1.17.9|A aliança da circuncisão
1.18.1|Os três visitantes
1.18.9|Sara ri da promessa
1.18.16|Abraão intercede por Sodoma
1.19.1|Ló recebe os anjos
1.19.12|Ló foge para Zoar
1.19.24|A destruição de Sodoma e Gomorra
1.19.30|Ló e suas filhas
1.20.1|Abraão, Sara e Abimeleque
1.21.1|O nascimento de Isaque
1.21.9|Sara se volta contra Agar
1.21.22|A aliança em Berseba
1.22.1|O sacrifício de Isaque
1.22.11|O Senhor providencia o sacrifício
1.22.20|Os filhos de Naor
1.23.1|A morte e o sepultamento de Sara
1.24.1|Uma esposa para Isaque
1.24.15|Rebeca é escolhida
1.24.62|Isaque se casa com Rebeca
1.25.1|Abraão e Quetura
1.25.7|A morte de Abraão
1.25.12|Os descendentes de Ismael
1.25.19|Jacó e Esaú
1.25.29|Esaú vende o seu direito de primogenitura
1.26.1|A promessa de Deus a Isaque
1.26.6|Isaque engana Abimeleque
1.26.12|A prosperidade de Isaque
1.26.26|A aliança de Isaque com Abimeleque
1.26.34|As mulheres de Esaú
1.27.1|Isaque abençoa Jacó
1.27.30|A esperança perdida de Esaú
1.28.1|A partida de Jacó
1.28.6|Esaú se casa com Maalate
1.28.10|A escada de Jacó
1.28.18|A pedra de Betel
1.29.1|Jacó conhece Raquel
1.29.14|Jacó se casa com Lia e Raquel
1.29.31|Rúben, Simeão, Levi e Judá
1.30.1|Dã e Naftali
1.30.9|Gade e Aser
1.30.17|Issacar, Zebulom e Diná
1.30.22|José
1.30.25|Jacó prospera
1.31.1|Jacó foge de Labão
1.31.22|Labão persegue Jacó
1.31.43|A aliança de Jacó com Labão
1.32.1|Jacó se prepara para encontrar Esaú
1.32.22|Jacó luta com Deus
1.33.1|Jacó encontra Esaú
1.33.18|Jacó se estabelece em Siquém
1.34.1|A violência contra Diná
1.34.13|A vingança dos irmãos de Diná
1.35.1|Jacó volta a Betel
1.35.16|Nasce Benjamim e morre Raquel
1.35.21|Os filhos de Jacó
1.35.27|A morte de Isaque
1.36.1|Os descendentes de Esaú
1.36.20|Os descendentes de Seir
1.36.31|Os reis de Edom
1.37.1|Os sonhos de José
1.37.12|José é vendido para o Egito
1.37.31|Jacó chora por José
1.38.1|Judá e Tamar
1.38.27|O nascimento de Perez e Zerá
1.39.1|José e a mulher de Potifar
1.39.13|José é preso injustamente
1.40.1|O copeiro e o padeiro
1.41.1|Os sonhos do faraó
1.41.14|José interpreta os sonhos do faraó
1.41.37|José recebe o governo do Egito
1.41.46|Os sete anos de fartura
1.41.53|Começa a fome
1.42.1|Os irmãos de José são enviados ao Egito
1.42.25|Os irmãos de José voltam a Canaã
1.43.1|A volta ao Egito com Benjamim
1.43.16|José hospeda seus irmãos
1.44.1|Benjamim e a taça de prata
1.44.18|Judá intercede por Benjamim
1.45.1|José revela quem é
1.45.9|José manda buscar seu pai
1.45.16|O faraó convida Jacó ao Egito
1.45.25|Jacó recobra o ânimo
1.46.1|A viagem de Jacó ao Egito
1.46.7|Os que foram para o Egito
1.46.8|Os filhos de Lia
1.46.16|Os filhos de Zilpa
1.46.19|Os filhos de Raquel
1.46.23|Os filhos de Bila
1.46.28|Jacó chega ao Egito
1.47.1|Jacó se estabelece em Gósen
1.47.13|A fome continua
1.47.27|Os israelitas prosperam em Gósen
1.48.1|Jacó abençoa Efraim e Manassés
1.49.1|Jacó abençoa seus filhos
1.49.29|A morte de Jacó
1.50.1|O luto e o sepultamento de Jacó
1.50.15|José consola seus irmãos
1.50.22|A morte de José
2.1.1|Os israelitas se multiplicam no Egito
2.1.8|A opressão de um novo rei
2.2.1|O nascimento e a adoção de Moisés
2.2.11|Moisés é rejeitado e foge
2.2.23|Deus ouve o clamor dos israelitas
2.3.1|Moisés e a sarça ardente
2.4.1|A vara de Moisés
2.4.6|A mão de Moisés
2.4.10|A designação de Arão
2.4.18|Moisés parte para o Egito
2.4.27|O povo crê em Moisés e Arão
2.5.1|A primeira recusa do faraó
2.5.6|Tijolos e palha
2.5.15|O clamor dos israelitas
2.6.1|Deus promete libertação
2.6.14|As genealogias de Moisés e Arão
2.7.1|Deus dá ordens a Moisés e Arão
2.7.8|A vara de Arão
2.7.14|A primeira praga: sangue
2.8.1|A segunda praga: rãs
2.8.16|A terceira praga: piolhos
2.8.20|A quarta praga: moscas
2.9.1|A quinta praga: peste nos rebanhos
2.9.8|A sexta praga: úlceras
2.9.13|A sétima praga: granizo
2.10.1|A oitava praga: gafanhotos
2.10.21|A nona praga: trevas
2.11.1|O anúncio da praga sobre os primogênitos
2.12.1|A primeira Páscoa
2.12.14|A festa dos pães sem fermento
2.12.29|A décima praga: a morte dos primogênitos
2.12.31|Começa o êxodo
2.12.43|Instruções para a Páscoa
2.13.1|A consagração dos primogênitos
2.13.17|As colunas de nuvem e de fogo
2.14.1|O faraó persegue os israelitas
2.14.15|A abertura do mar Vermelho
2.15.1|O cântico junto ao mar
2.15.22|As águas de Mara
2.16.1|Maná e codornizes do céu
2.16.22|A observância do sábado
2.16.31|O vaso de maná
2.17.1|Água da rocha
2.17.8|A derrota dos amalequitas
2.18.1|A visita de Jetro
2.18.13|Jetro aconselha Moisés
2.19.1|Israel no monte Sinai
2.19.16|O Senhor desce ao Sinai
2.20.1|Os Dez Mandamentos
2.20.18|Moisés tranquiliza o povo
2.20.22|A proibição da idolatria
2.21.1|Os servos hebreus
2.21.12|Leis sobre lesões pessoais
2.22.1|Leis sobre propriedade
2.22.16|Leis de responsabilidade social
2.23.1|Justiça e misericórdia
2.23.10|Leis sobre o sábado
2.23.14|As três festas de peregrinação
2.23.20|O anjo de Deus conduzirá o povo
2.24.1|A aliança é selada
2.24.12|Moisés no monte
2.25.1|Ofertas para o tabernáculo
2.25.10|A arca da aliança
2.25.17|O propiciatório
2.25.23|A mesa dos pães da presença
2.25.31|O candelabro
2.26.1|As dez cortinas do tabernáculo
2.26.7|As onze cortinas de pelo de cabra
2.26.15|As armações e as bases
2.26.31|O véu
2.26.36|A cortina da entrada
2.27.1|O altar de bronze
2.27.9|O pátio
2.27.20|O azeite para as lâmpadas
2.28.1|As vestes dos sacerdotes
2.28.6|O colete sacerdotal
2.28.15|O peitoral
2.28.31|Outras vestes sacerdotais
2.29.1|A consagração dos sacerdotes
2.29.10|A ordem dos sacrifícios
2.29.31|O alimento dos sacerdotes
2.29.38|As ofertas diárias
2.29.45|Deus habitará no meio do povo
2.30.1|O altar do incenso
2.30.11|A oferta do recenseamento
2.30.17|A bacia de bronze
2.30.22|O óleo da unção
2.30.34|O incenso
2.31.1|Bezalel e Aoliabe
2.31.12|O sinal do sábado
2.31.18|Moisés recebe as tábuas
2.32.1|O bezerro de ouro
2.33.1|A ordem para deixar o Sinai
2.33.7|A tenda do encontro
2.33.12|A promessa da presença de Deus
2.34.1|Novas tábuas de pedra
2.34.10|O Senhor renova a aliança
2.35.1|O sábado
2.35.4|Ofertas para o tabernáculo
2.35.10|Os artesãos habilidosos
2.35.20|O povo traz suas ofertas
2.35.30|Bezalel e Aoliabe
2.36.1|O povo traz mais do que o suficiente
2.36.8|As dez cortinas do tabernáculo
2.36.14|As onze cortinas de pelo de cabra
2.36.20|As armações e as bases
2.36.35|O véu
2.36.37|A cortina da entrada
2.37.1|A construção da arca
2.37.6|O propiciatório
2.37.10|A mesa dos pães da presença
2.37.17|O candelabro
2.37.25|O altar do incenso
2.38.1|O altar de bronze
2.38.8|A bacia de bronze
2.38.9|O pátio
2.38.21|O inventário dos materiais
2.39.1|O colete sacerdotal
2.39.8|O peitoral
2.39.22|Outras vestes sacerdotais
2.39.32|Moisés aprova a obra
2.40.1|A montagem do tabernáculo
2.40.34|A nuvem e a glória
3.1.1|Leis sobre os holocaustos
3.2.1|Leis sobre as ofertas de cereal
3.3.1|Leis sobre as ofertas de paz
3.4.1|Leis sobre as ofertas pelo pecado
3.5.1|Pecados que exigem oferta pelo pecado
3.5.14|Leis sobre as ofertas pela culpa
3.6.1|Pecados que exigem oferta pela culpa
3.6.8|O holocausto
3.6.14|A oferta de cereal
3.6.24|A oferta pelo pecado
3.7.1|A oferta pela culpa
3.7.11|A oferta de paz
3.7.22|Proibição de comer gordura e sangue
3.7.28|A porção dos sacerdotes
3.8.1|Moisés consagra Arão e seus filhos
3.8.14|A oferta pelo pecado dos sacerdotes
3.8.18|O holocausto dos sacerdotes
3.8.22|O carneiro da ordenação
3.9.1|As primeiras ofertas de Arão
3.10.1|O pecado de Nadabe e Abiú
3.10.8|Restrições para os sacerdotes
3.11.1|Animais puros e impuros
3.12.1|A purificação depois do parto
3.13.1|Leis sobre doenças de pele
3.13.47|Leis sobre o mofo
3.14.1|A purificação das doenças de pele
3.14.33|Sinais de contaminação na casa
3.14.48|A purificação da casa
3.15.1|A impureza do homem
3.15.13|A purificação do homem
3.15.19|A impureza da mulher
3.15.28|A purificação da mulher
3.16.1|O Dia da Expiação
3.17.1|O lugar do sacrifício
3.17.10|Leis contra comer sangue
3.18.1|Relações sexuais proibidas
3.19.1|Mandamentos de santidade
3.19.9|Ame o seu próximo
3.19.19|Guardem os meus decretos
3.20.1|Castigos pela desobediência
3.20.10|Castigos pela imoralidade sexual
3.20.22|Façam distinção entre o puro e o impuro
3.21.1|A santidade exigida dos sacerdotes
3.21.16|Restrições aos que têm defeito físico
3.22.1|Restrições aos impuros
3.22.17|Ofertas aceitáveis
3.23.1|As festas e os sábados
3.23.4|A Páscoa e a festa dos pães sem fermento
3.23.9|A festa das primícias
3.23.15|A festa das semanas
3.23.23|A festa das trombetas
3.23.26|O Dia da Expiação
3.23.33|A festa das cabanas
3.24.1|O azeite para as lâmpadas
3.24.5|Os pães da presença
3.24.10|O castigo da blasfêmia
3.24.17|Olho por olho
3.25.1|O sétimo ano
3.25.8|O ano do jubileu
3.25.13|A devolução da propriedade
3.25.18|A bênção da obediência
3.25.23|A lei do resgate
3.25.35|O resgate do pobre
3.25.39|O resgate dos escravos
3.25.47|O resgate dos servos
3.26.1|Outras bênçãos da obediência
3.26.14|Castigos pela desobediência
3.26.40|Deus se lembra dos que se arrependem
3.27.1|Regras sobre avaliações
3.27.30|Instruções sobre os dízimos
4.1.1|O primeiro recenseamento de Israel
4.1.5|Os líderes das tribos
4.1.17|O número de cada tribo
4.1.47|Os levitas são dispensados
4.2.1|A organização dos acampamentos
4.3.1|Os filhos de Arão
4.3.5|As funções dos levitas
4.3.14|O recenseamento dos levitas
4.3.21|Os gersonitas
4.3.27|Os coatitas
4.3.33|Os meraritas
4.3.38|Moisés e Arão
4.3.40|O resgate dos primogênitos
4.4.1|As funções dos coatitas
4.4.21|As funções dos gersonitas
4.4.29|As funções dos meraritas
4.4.34|O recenseamento dos clãs levitas
4.5.1|A purificação do acampamento
4.5.5|Confissão e restituição
4.5.11|A prova do adultério
4.6.1|O voto de nazireu
4.6.22|A bênção de Arão
4.7.1|As ofertas de dedicação
4.8.1|O candelabro
4.8.5|A purificação dos levitas
4.8.23|A aposentadoria dos levitas
4.9.1|A segunda Páscoa
4.9.15|A nuvem sobre o tabernáculo
4.10.1|As duas trombetas de prata
4.10.11|Do Sinai a Parã
4.11.1|As queixas do povo
4.11.10|A queixa de Moisés
4.11.16|Setenta autoridades recebem o Espírito
4.11.31|As codornizes e a praga
4.12.1|A queixa de Miriã e Arão
4.13.1|Os espiões exploram Canaã
4.13.25|O relatório dos espiões
4.14.1|A rebelião de Israel
4.14.13|Moisés intercede por Israel
4.14.20|O perdão e o juízo de Deus
4.14.36|A praga sobre os dez espiões
4.14.40|A derrota em Hormá
4.15.1|Leis sobre as ofertas
4.15.22|Ofertas por pecados involuntários
4.15.32|Um violador do sábado é apedrejado
4.15.37|A lei das franjas
4.16.1|A rebelião de Corá
4.16.23|Moisés separa o povo
4.16.28|A terra engole Corá
4.16.36|Os incensários reservados para uso sagrado
4.16.41|Murmuração e praga
4.17.1|A vara de Arão floresce
4.18.1|As funções dos sacerdotes e levitas
4.18.8|Ofertas para os sacerdotes e levitas
4.19.1|A novilha vermelha
4.19.11|A purificação do impuro
4.20.1|Água da rocha
4.20.14|Edom recusa passagem
4.20.22|A morte de Arão
4.21.1|A derrota de Arade
4.21.4|A serpente de bronze
4.21.10|A viagem a Moabe
4.21.21|A derrota de Seom
4.21.31|A derrota de Ogue
4.22.1|Balaque manda chamar Balaão
4.22.22|O anjo e a jumenta de Balaão
4.23.1|O primeiro oráculo de Balaão
4.23.13|O segundo oráculo de Balaão
4.24.1|O terceiro oráculo de Balaão
4.24.10|Balaque despede Balaão
4.24.15|O quarto oráculo de Balaão
4.24.20|Os três últimos oráculos de Balaão
4.25.1|Moabe seduz Israel
4.25.6|O zelo de Fineias
4.26.1|O segundo recenseamento de Israel
4.26.5|A tribo de Rúben
4.26.12|A tribo de Simeão
4.26.15|A tribo de Gade
4.26.19|A tribo de Judá
4.26.23|A tribo de Issacar
4.26.26|A tribo de Zebulom
4.26.28|A tribo de Manassés
4.26.35|A tribo de Efraim
4.26.38|A tribo de Benjamim
4.26.42|A tribo de Dã
4.26.44|A tribo de Aser
4.26.48|A tribo de Naftali
4.26.52|A herança por sorteio
4.26.57|O recenseamento dos levitas
4.26.63|Só restam Calebe e Josué
4.27.1|As filhas de Zelofeade
4.27.12|Moisés pede um sucessor
4.27.18|Josué sucederá Moisés
4.28.1|As ofertas diárias
4.28.9|As ofertas do sábado
4.28.11|As ofertas mensais
4.28.16|A Páscoa e a festa dos pães sem fermento
4.28.26|A festa das semanas
4.29.1|A festa das trombetas
4.29.7|O Dia da Expiação
4.29.12|A festa das cabanas
4.30.1|Leis sobre votos
4.31.1|A vingança contra Midiã
4.31.25|A divisão dos despojos
4.31.48|A oferta voluntária
4.32.1|As tribos a leste do Jordão
4.33.1|As quarenta e duas etapas da viagem dos israelitas
4.33.50|Instruções para ocupar Canaã
4.34.1|As fronteiras de Canaã
4.34.16|Os líderes que vão dividir a terra
4.35.1|Quarenta e oito cidades para os levitas
4.35.9|Seis cidades de refúgio
4.36.1|As filhas de Zelofeade se casam
5.1.1|A ordem para deixar Horebe
5.1.9|Moisés nomeia líderes
5.1.19|Doze espiões são enviados
5.1.26|A rebelião de Israel
5.1.34|O castigo de Israel
5.1.41|A derrota em Hormá
5.2.1|As peregrinações no deserto
5.2.24|A derrota de Seom
5.3.1|A derrota de Ogue
5.3.12|A divisão da terra a leste do Jordão
5.3.23|Moisés é proibido de atravessar o Jordão
5.4.1|Exortação à obediência
5.4.15|Advertência contra a idolatria
5.4.32|Só o Senhor é Deus
5.4.41|As cidades de refúgio
5.4.44|Introdução à lei
5.5.1|A aliança no Horebe
5.5.5|Os Dez Mandamentos
5.5.22|Moisés intercede pelo povo
5.6.1|O maior mandamento
5.6.20|Ensinem os seus filhos
5.7.1|Expulsem as nações
5.7.12|As promessas de Deus
5.8.1|Lembrem-se do Senhor, o seu Deus
5.9.1|A garantia da vitória
5.9.7|O bezerro de ouro
5.10.1|Novas tábuas de pedra
5.10.12|Um chamado à obediência
5.11.1|Obediência e disciplina
5.11.8|As grandes bênçãos de Deus
5.11.18|Lembrem-se das palavras de Deus
5.11.26|Uma bênção e uma maldição
5.12.1|Um só lugar de adoração
5.12.29|Advertência contra a idolatria
5.13.1|Os idólatras devem ser mortos
5.13.12|As cidades idólatras devem ser destruídas
5.14.1|Animais puros e impuros
5.14.22|A entrega dos dízimos
5.15.1|O sétimo ano
5.15.7|Generosidade no empréstimo e na doação
5.15.12|Os servos hebreus
5.15.19|As primeiras crias dos animais
5.16.1|A Páscoa e a festa dos pães sem fermento
5.16.9|A festa das semanas
5.16.13|A festa das cabanas
5.16.18|Juízes e justiça
5.16.21|Formas proibidas de adoração
5.17.1|Sacrifícios detestáveis
5.17.2|A eliminação do idólatra
5.17.8|Os tribunais
5.17.14|Orientações para o rei
5.18.1|O sustento dos sacerdotes e levitas
5.18.9|A feitiçaria é proibida
5.18.15|Um profeta como Moisés
5.19.1|As cidades de refúgio
5.19.15|O testemunho de duas ou três testemunhas
5.20.1|Leis sobre a guerra
5.21.1|Expiação por um assassinato não resolvido
5.21.10|Casamento com uma prisioneira de guerra
5.21.15|O direito de herança do primogênito
5.21.18|O filho rebelde
5.21.22|Maldito todo aquele que for pendurado num madeiro
5.22.1|Leis diversas
5.22.13|Violações do casamento
5.23.1|Exclusão da assembleia
5.23.9|A impureza no acampamento
5.23.15|Leis variadas
5.24.1|Leis sobre casamento e divórcio
5.24.6|Outras leis
5.25.1|Justiça e misericórdia
5.25.5|A viuvez e o casamento
5.25.13|Pesos e medidas padronizados
5.25.17|A vingança contra os amalequitas
5.26.1|A oferta das primícias e dos dízimos
5.26.16|Obedeçam aos mandamentos do Senhor
5.27.1|O altar no monte Ebal
5.27.11|As maldições proclamadas do Ebal
5.28.1|As bênçãos da obediência
5.28.15|As maldições da desobediência
5.29.1|A aliança em Moabe
5.30.1|A promessa de restauração
5.30.11|A escolha entre a vida e a morte
5.31.1|Josué sucederá Moisés
5.31.9|A leitura da lei
5.31.14|Deus comissiona Josué
5.31.24|A lei é colocada junto à arca
5.31.30|Moisés começa o seu cântico
5.32.1|O cântico de Moisés
5.32.48|A morte de Moisés é anunciada
5.33.1|Moisés abençoa as doze tribos
5.34.1|A morte de Moisés
6.1.1|Deus dá instruções a Josué
6.1.10|Josué assume o comando
6.2.1|Raabe acolhe os espiões
6.2.8|A promessa a Raabe
6.3.1|A travessia do Jordão
6.4.1|Doze pedras tiradas do Jordão
6.4.19|O acampamento em Gilgal
6.5.1|A circuncisão e a Páscoa em Gilgal
6.5.13|O comandante do exército do Senhor
6.6.1|Os muros de Jericó
6.7.1|A derrota em Ai
6.7.16|O pecado de Acã
6.8.1|A conquista de Ai
6.8.30|Josué renova a aliança
6.9.1|O engano dos gibeonitas
6.10.1|O dia em que o sol parou
6.10.16|A vitória em Maquedá
6.10.29|A conquista das cidades do sul
6.11.1|A conquista das cidades do norte
6.11.16|Josué conquista toda a terra
6.12.1|Os reis derrotados a leste do Jordão
6.12.7|Os reis derrotados a oeste do Jordão
6.13.1|As terras ainda não conquistadas
6.13.8|A herança a leste do Jordão
6.13.15|A herança de Rúben
6.13.24|A herança de Gade
6.13.29|A herança de Manassés a leste
6.14.1|A divisão da terra a oeste do Jordão
6.14.6|Calebe pede Hebrom
6.15.1|A herança de Judá
6.15.13|A porção e a conquista de Calebe
6.15.20|As cidades de Judá
6.16.1|A herança de Efraim
6.17.1|A herança de Manassés a oeste
6.18.1|A divisão do restante da terra
6.18.11|A herança de Benjamim
6.19.1|A herança de Simeão
6.19.10|A herança de Zebulom
6.19.17|A herança de Issacar
6.19.24|A herança de Aser
6.19.32|A herança de Naftali
6.19.40|A herança de Dã
6.19.49|A herança de Josué
6.20.1|Seis cidades de refúgio
6.21.1|Quarenta e oito cidades para os levitas
6.22.1|As tribos do leste voltam para casa
6.22.9|O altar do testemunho
6.23.1|As recomendações de Josué aos líderes
6.24.1|Josué relembra a história de Israel
6.24.14|Escolham a quem vão servir
6.24.29|A morte e o sepultamento de Josué
7.1.1|Continua a conquista de Canaã
7.1.8|A tomada de Jerusalém e de Hebrom
7.1.27|A conquista não é completada
7.2.1|Israel é repreendido em Boquim
7.2.6|A morte e o sepultamento de Josué
7.2.10|A infidelidade de Israel
7.2.16|Deus levanta juízes
7.3.1|Nações deixadas para pôr Israel à prova
7.3.7|Otoniel
7.3.12|Eúde
7.3.31|Sangar
7.4.1|Débora e Baraque
7.4.17|Jael mata Sísera
7.5.1|O cântico de Débora e Baraque
7.6.1|Midiã oprime Israel
7.6.11|O chamado de Gideão
7.6.25|Gideão destrói o altar de Baal
7.6.33|O sinal da lã
7.7.1|O exército de trezentos de Gideão
7.7.9|A espada de Gideão
7.7.15|Gideão derrota Midiã
7.8.1|Gideão derrota Zeba e Zalmuna
7.8.22|O colete sacerdotal de Gideão
7.8.28|Quarenta anos de paz
7.8.32|A morte de Gideão
7.9.1|A conspiração de Abimeleque
7.9.7|A parábola de Jotão
7.9.22|Gaal conspira com os siquemitas
7.9.30|A queda de Siquém
7.9.50|O castigo de Abimeleque
7.10.1|Tolá
7.10.3|Jair
7.10.6|A opressão dos filisteus e amonitas
7.11.1|Jefté liberta Israel
7.11.29|O voto trágico de Jefté
7.12.1|Jefté derrota Efraim
7.12.8|Ibsã, Elom e Abdom
7.13.1|O nascimento de Sansão
7.14.1|O casamento de Sansão
7.14.8|O enigma de Sansão
7.15.1|A vingança de Sansão
7.16.1|Sansão escapa de Gaza
7.16.4|Sansão e Dalila
7.16.15|Dalila descobre o segredo
7.16.23|A vingança e a morte de Sansão
7.17.1|A idolatria de Mica
7.18.1|Os danitas se estabelecem em Laís
7.18.14|Os danitas tomam os ídolos de Mica
7.19.1|O crime dos benjamitas
7.20.1|A decisão da assembleia
7.20.18|Guerra civil contra Benjamim
7.21.1|Esposas para os benjamitas
8.1.1|Noemi fica viúva
8.1.6|A lealdade de Rute a Noemi
8.1.19|A volta a Belém
8.2.1|Boaz conhece Rute
8.3.1|Rute tem o resgate garantido
8.4.1|Boaz resgata Rute
8.4.13|Boaz se casa com Rute
8.4.18|A linhagem de Davi
9.1.1|Elcana e suas mulheres
9.1.9|Ana ora por um filho
9.1.19|O nascimento de Samuel
9.2.1|A oração de gratidão de Ana
9.2.12|Os filhos perversos de Eli
9.2.27|Uma profecia contra a casa de Eli
9.3.1|O Senhor chama Samuel
9.3.15|Samuel conta a visão
9.4.1|Os filisteus tomam a arca
9.4.12|A morte de Eli
9.5.1|A arca aflige os filisteus
9.6.1|A arca é devolvida a Israel
9.7.1|Samuel subjuga os filisteus
9.8.1|Israel pede um rei
9.8.10|A advertência de Samuel
9.8.19|Deus atende ao pedido
9.9.1|Saul é escolhido como rei
9.10.1|Samuel unge Saul
9.10.9|Os sinais de Samuel se cumprem
9.10.17|Saul é proclamado rei
9.11.1|Saul derrota os amonitas
9.11.12|Saul é confirmado como rei
9.12.1|O discurso de despedida de Samuel
9.13.1|Guerra contra os filisteus
9.13.8|O sacrifício ilegítimo de Saul
9.13.16|Israel sem armas
9.14.1|A vitória de Jônatas sobre os filisteus
9.14.24|Jônatas come o mel
9.14.37|O povo salva Jônatas
9.14.47|As vitórias de Saul
9.15.1|A desobediência de Saul
9.15.10|Samuel repreende Saul
9.15.24|A confissão de Saul
9.16.1|Samuel unge Davi
9.16.14|Davi serve a Saul
9.17.1|O desafio de Golias
9.17.12|Davi aceita o desafio
9.17.38|Davi mata Golias
9.18.1|Jônatas se torna amigo de Davi
9.18.5|Saul tem inveja de Davi
9.18.17|Davi se casa com Mical
9.19.1|Saul tenta matar Davi
9.20.1|Jônatas ajuda Davi
9.20.10|Jônatas e Davi renovam a sua aliança
9.20.30|Saul tenta matar Jônatas
9.21.1|Davi recebe os pães consagrados
9.21.8|Davi foge para Gate
9.22.1|Davi foge para Adulão e Mispá
9.22.6|Saul mata os sacerdotes de Nobe
9.23.1|Davi liberta Queila
9.23.7|Saul persegue Davi
9.24.1|Davi poupa Saul
9.24.16|O juramento de Davi a Saul
9.25.1|A morte de Samuel
9.25.2|Davi, Nabal e Abigail
9.25.18|Abigail intercede por Nabal
9.25.39|Davi se casa com Abigail
9.26.1|Davi poupa Saul outra vez
9.26.13|Davi repreende Abner
9.26.21|Saul reconhece o seu pecado
9.27.1|Davi e os filisteus
9.28.1|Os filisteus se reúnem contra Israel
9.28.7|Saul e a médium de En-Dor
9.29.1|Os filisteus rejeitam Davi
9.30.1|Os amalequitas atacam Ziclague
9.30.7|Davi destrói os amalequitas
9.30.21|A divisão dos despojos
9.31.1|A derrota e a morte de Saul
9.31.7|Os filisteus ocupam as cidades
9.31.11|A homenagem de Jabes-Gileade a Saul
10.1.1|A morte de Saul é anunciada a Davi
10.1.17|O lamento de Davi por Saul e Jônatas
10.2.1|Davi é ungido rei de Judá
10.2.8|Is-Bosete é feito rei de Israel
10.2.12|A batalha de Gibeom
10.3.1|A casa de Davi se fortalece
10.3.6|Abner passa para o lado de Davi
10.3.22|Joabe assassina Abner
10.3.31|Davi chora por Abner
10.4.1|O assassinato de Is-Bosete
10.4.9|A execução de Recabe e Baaná
10.5.1|Davi é ungido rei sobre todo o Israel
10.5.6|Davi conquista Jerusalém
10.5.12|A família de Davi cresce
10.5.17|Duas vitórias sobre os filisteus
10.6.1|Davi vai buscar a arca
10.6.5|Uzá toca na arca
10.6.12|A arca é levada para Jerusalém
10.6.16|O desprezo de Mical por Davi
10.7.1|A aliança de Deus com Davi
10.7.18|A oração de gratidão de Davi
10.8.1|Os triunfos de Davi
10.8.15|Os oficiais de Davi
10.9.1|Davi e Mefibosete
10.10.1|Os mensageiros de Davi são humilhados
10.10.9|Davi derrota Amom e Arã
10.11.1|Davi e Bate-Seba
10.11.14|Davi planeja a morte de Urias
10.11.26|Davi se casa com Bate-Seba
10.12.1|Natã repreende Davi
10.12.13|A perda e o arrependimento de Davi
10.12.24|O nascimento de Salomão
10.12.26|A tomada de Rabá
10.13.1|Amnom e Tamar
10.13.23|A vingança de Absalão contra Amnom
10.13.34|Absalão foge para Gesur
10.14.1|A volta de Absalão a Jerusalém
10.14.28|Absalão se reconcilia com Davi
10.15.1|A conspiração de Absalão
10.15.13|Davi foge de Jerusalém
10.15.30|Davi chora no monte das Oliveiras
10.16.1|Davi e Ziba
10.16.5|Simei amaldiçoa Davi
10.16.15|Os conselhos de Aitofel e de Husai
10.17.1|Husai contraria o conselho de Aitofel
10.17.15|O aviso de Husai salva Davi
10.18.1|Absalão é morto
10.18.19|Davi chora por Absalão
10.19.1|Joabe repreende Davi
10.19.8|Davi é restabelecido como rei
10.19.16|Simei é perdoado
10.19.24|Mefibosete se explica
10.19.31|A bondade de Davi para com Barzilai
10.19.41|A disputa pelo rei
10.20.1|A rebelião de Seba
10.21.1|Davi vinga os gibeonitas
10.21.15|Quatro batalhas contra os filisteus
10.22.1|O cântico de libertação de Davi
10.23.1|As últimas palavras de Davi
10.23.8|Os heróis de Davi
10.24.1|O recenseamento militar de Davi
10.24.10|O juízo sobre o pecado de Davi
10.24.15|Uma praga sobre Israel
10.24.18|Davi constrói um altar
11.1.1|Abisague cuida de Davi
11.1.5|Adonias usurpa o reino
11.1.11|Natã e Bate-Seba diante de Davi
11.1.28|Davi renova o seu juramento a Bate-Seba
11.1.32|Salomão é ungido rei
11.1.41|Adonias fica sabendo do reinado de Salomão
11.2.1|Davi dá instruções a Salomão
11.2.10|O reinado e a morte de Davi
11.2.13|A execução de Adonias
11.2.28|A execução de Joabe
11.2.36|A execução de Simei
11.3.1|Salomão pede sabedoria
11.3.16|Salomão julga com sabedoria
11.4.1|Os principais oficiais de Salomão
11.4.7|Os doze governadores de Salomão
11.4.20|A prosperidade de Salomão
11.4.29|A sabedoria de Salomão
11.5.1|Os preparativos para o templo
11.5.7|A resposta de Hirão a Salomão
11.5.13|Os trabalhadores de Salomão
11.6.1|Começa a construção do templo
11.6.5|Os quartos laterais
11.6.11|A promessa de Deus a Salomão
11.6.14|O interior do templo
11.6.23|Os querubins
11.6.31|As portas
11.6.36|O pátio
11.7.1|O conjunto do palácio de Salomão
11.7.13|As colunas e os capitéis
11.7.23|O tanque de metal fundido
11.7.27|Os dez carrinhos de bronze
11.7.38|As dez pias de bronze
11.7.40|A conclusão das obras de bronze
11.7.48|A conclusão dos utensílios de ouro
11.8.1|A arca é levada para o templo
11.8.12|Salomão bendiz o Senhor
11.8.22|A oração de dedicação de Salomão
11.8.54|A bênção de Salomão
11.8.62|Os sacrifícios de dedicação
11.9.1|A resposta do Senhor a Salomão
11.9.10|Outras realizações de Salomão
11.10.1|A rainha de Sabá
11.10.14|A riqueza e o esplendor de Salomão
11.11.1|As mulheres estrangeiras de Salomão
11.11.9|A ira de Deus contra Salomão
11.11.14|A volta de Hadade
11.11.23|A hostilidade de Rezom
11.11.26|A rebelião de Jeroboão
11.11.41|A morte de Salomão
11.12.1|A rebelião contra Roboão
11.12.16|O reino é dividido
11.12.20|A profecia de Semaías
11.12.25|A idolatria de Jeroboão
11.13.1|A mão de Jeroboão fica paralisada
11.13.11|O velho profeta e o homem de Deus
11.14.1|A profecia de Aías contra Jeroboão
11.14.19|Nadabe sucede Jeroboão
11.14.21|Roboão reina em Judá
11.14.25|Sisaque ataca Jerusalém
11.15.1|Abias reina em Judá
11.15.9|Asa reina em Judá
11.15.16|Guerra entre Asa e Baasa
11.15.23|Josafá sucede Asa
11.15.25|Nadabe reina em Israel
11.15.33|Baasa reina em Israel
11.16.1|A profecia de Jeú contra Baasa
11.16.8|Elá reina em Israel
11.16.15|Zinri reina em Israel
11.16.21|Onri reina em Israel
11.16.29|Acabe reina em Israel e se casa com Jezabel
11.17.1|Os corvos alimentam Elias
11.17.8|A viúva de Sarepta
11.17.17|Elias ressuscita o filho da viúva
11.18.1|A mensagem de Elias a Acabe
11.18.16|Elias no monte Carmelo
11.18.36|A oração de Elias
11.18.41|O Senhor manda chuva
11.19.1|Elias foge de Jezabel
11.19.9|O Senhor fala com Elias no Horebe
11.19.19|O chamado de Eliseu
11.20.1|Ben-Hadade ataca Samaria
11.20.13|Acabe derrota Ben-Hadade
11.20.26|Nova guerra contra Ben-Hadade
11.20.31|Acabe poupa Ben-Hadade
11.20.35|Um profeta repreende Acabe
11.21.1|A vinha de Nabote
11.21.8|A trama de Jezabel
11.21.17|Elias denuncia Acabe e Jezabel
11.21.25|O arrependimento de Acabe
11.22.1|Acabe e os falsos profetas
11.22.13|Micaías profetiza contra Acabe
11.22.29|A derrota e a morte de Acabe
11.22.41|Josafá reina em Judá
11.22.51|Acazias reina em Israel
12.1.1|Elias denuncia Acazias
12.1.17|Jorão sucede Acazias
12.2.1|Elias é levado ao céu
12.2.15|Eliseu sucede Elias
12.2.19|Eliseu purifica as águas de Jericó
12.2.23|Eliseu é zombado
12.3.1|A rebelião de Moabe
12.4.1|O azeite da viúva
12.4.8|A mulher sunamita
12.4.18|Eliseu ressuscita o filho da sunamita
12.4.38|Eliseu purifica o cozido venenoso
12.4.42|Alimento para cem homens
12.5.1|Naamã é curado da lepra
12.5.15|A ganância e a lepra de Geazi
12.6.1|O machado flutua
12.6.8|Eliseu captura os arameus cegos
12.6.24|O cerco e a fome em Samaria
12.7.1|A profecia de fartura de Eliseu
12.7.3|Os sírios fogem
12.7.16|A profecia de Eliseu se cumpre
12.8.1|A terra da sunamita é devolvida
12.8.7|Hazael assassina Ben-Hadade
12.8.16|Jeorão reina em Judá
12.8.20|Edom e Libna se rebelam
12.8.25|Acazias reina em Judá
12.9.1|Jeú é ungido rei de Israel
12.9.14|Jeú mata Jorão e Acazias
12.9.30|A morte violenta de Jezabel
12.10.1|Os setenta filhos de Acabe são mortos
12.10.18|Jeú mata os sacerdotes de Baal
12.10.28|Jeú repete os pecados de Jeroboão
12.10.34|Jeoacaz sucede Jeú em Israel
12.11.1|Atalia e Joás
12.11.4|Joás é ungido rei de Judá
12.11.13|A morte de Atalia
12.11.17|Joiada restaura o culto ao Senhor
12.12.1|Joás reforma o templo
12.12.17|A morte de Joás
12.13.1|Jeoacaz reina em Israel
12.13.10|Jeoás reina em Israel
12.13.14|A última profecia de Eliseu
12.14.1|Amazias reina em Judá
12.14.8|Jeoás derrota Amazias
12.14.15|Jeroboão II sucede Jeoás em Israel
12.14.17|A morte de Amazias
12.14.21|Azarias sucede Amazias em Judá
12.14.23|Jeroboão II reina em Israel
12.15.1|Azarias reina em Judá
12.15.8|Zacarias reina em Israel
12.15.13|Salum reina em Israel
12.15.17|Menaém reina em Israel
12.15.23|Pecaías reina em Israel
12.15.27|Peca reina em Israel
12.15.32|Jotão reina em Judá
12.16.1|Acaz reina em Judá
12.16.10|A idolatria de Acaz
12.17.1|Oseias, o último rei de Israel
12.17.5|Israel é levado cativo para a Assíria
12.17.24|Samaria é repovoada
12.18.1|Ezequias destrói a idolatria em Judá
12.18.13|Senaqueribe invade Judá
12.18.17|Senaqueribe ameaça Jerusalém
12.19.1|A mensagem de livramento de Isaías
12.19.8|A carta blasfema de Senaqueribe
12.19.14|A oração de Ezequias
12.19.20|A queda de Senaqueribe é profetizada
12.19.35|Jerusalém é livrada dos assírios
12.20.1|A doença e a cura de Ezequias
12.20.12|Ezequias mostra os seus tesouros
12.20.20|Manassés sucede Ezequias
12.21.1|Manassés reina em Judá
12.21.10|As idolatrias de Manassés são condenadas
12.21.19|Amom reina em Judá
12.22.1|Josias reina em Judá
12.22.3|O dinheiro para a reforma do templo
12.22.8|Hilquias encontra o Livro da Lei
12.22.14|A profecia de Hulda
12.23.1|Josias renova a aliança
12.23.4|Josias destrói a idolatria
12.23.21|Josias restaura a Páscoa
12.23.28|A morte de Josias
12.23.31|Jeoacaz sucede Josias
12.23.36|Jeoaquim reina em Judá
12.24.1|Babilônia domina Jeoaquim
12.24.6|Joaquim reina em Judá
12.24.10|O cativeiro de Jerusalém
12.24.18|Zedequias reina em Judá
12.25.1|Nabucodonosor cerca Jerusalém
12.25.8|O templo é destruído
12.25.18|Os cativos são levados para a Babilônia
12.25.22|Gedalias governa Judá
12.25.25|O assassinato de Gedalias
12.25.27|Joaquim é libertado da prisão
13.1.1|De Adão a Abraão
13.1.28|Os descendentes de Abraão
13.1.35|Os descendentes de Esaú
13.1.38|Os descendentes de Seir
13.1.43|Os reis de Edom
13.2.1|Os filhos de Israel
13.3.1|Os descendentes de Davi
13.3.10|Os descendentes de Salomão
13.3.17|A linhagem real depois do exílio
13.4.1|Os descendentes de Judá
13.4.9|A oração de Jabez
13.4.11|Outros descendentes de Judá
13.4.24|Os descendentes de Simeão
13.5.1|Os descendentes de Rúben
13.5.11|Os descendentes de Gade
13.5.23|A meia tribo de Manassés
13.6.1|Os descendentes de Levi
13.6.31|Os músicos do templo
13.6.48|Os descendentes de Arão
13.6.54|Os territórios dos levitas
13.7.1|Os descendentes de Issacar
13.7.6|Os descendentes de Benjamim
13.7.13|Os descendentes de Naftali
13.7.14|Os descendentes de Manassés
13.7.20|Os descendentes de Efraim
13.7.30|Os descendentes de Aser
13.8.1|A genealogia de Benjamim a Saul
13.8.33|A família de Saul
13.9.1|Os moradores de Jerusalém
13.9.35|Os descendentes de Saul
13.10.1|A derrota e a morte de Saul
13.10.7|Os filisteus ocupam as cidades
13.10.11|A homenagem de Jabes-Gileade a Saul
13.11.1|Davi é ungido rei sobre todo o Israel
13.11.4|Davi conquista Jerusalém
13.11.10|Os heróis de Davi
13.12.1|Os guerreiros se juntam a Davi em Ziclague
13.12.23|O exército de Davi cresce em Hebrom
13.13.1|Davi vai buscar a arca
13.13.8|Uzá toca na arca
13.14.1|A família de Davi cresce
13.14.8|Duas vitórias sobre os filisteus
13.15.1|Os preparativos para levar a arca
13.15.14|Os sacerdotes e levitas carregam a arca
13.15.25|A arca é levada para Jerusalém
13.15.29|O desprezo de Mical por Davi
13.16.1|Uma tenda para a arca
13.16.7|O salmo de gratidão de Davi
13.16.23|Cantem ao Senhor, todos os habitantes da terra
13.16.37|O culto diante da arca
13.17.1|A aliança de Deus com Davi
13.17.16|A oração de gratidão de Davi
13.18.1|Os triunfos de Davi
13.18.14|Os oficiais de Davi
13.19.1|Os mensageiros de Davi são humilhados
13.19.10|Davi derrota Amom e Arã
13.20.1|A tomada de Rabá
13.20.4|Batalhas contra os filisteus
13.21.1|O recenseamento militar de Davi
13.21.7|O juízo sobre o pecado de Davi
13.21.14|Uma praga sobre Israel
13.21.18|Davi constrói um altar
13.22.1|Os preparativos para o templo
13.22.6|Salomão é encarregado de construir o templo
13.23.1|Os turnos dos levitas
13.23.7|Os gersonitas
13.23.12|Os coatitas
13.23.21|Os meraritas
13.23.24|As funções dos levitas são revistas
13.24.1|Os vinte e quatro turnos de sacerdotes
13.24.20|Os demais levitas
13.25.1|Os vinte e quatro turnos de músicos
13.26.1|Os turnos dos porteiros
13.26.20|Os tesoureiros, oficiais e juízes
13.27.1|Doze comandantes para os doze meses
13.27.16|Os líderes das doze tribos
13.27.25|Os vários administradores de Davi
13.27.32|Os conselheiros
13.28.1|Davi encarrega Salomão
13.28.11|Os planos do templo
13.29.1|Ofertas para o templo
13.29.10|A oração de louvor de Davi
13.29.21|Salomão é ungido rei
13.29.26|O reinado e a morte de Davi
14.1.1|Salomão pede sabedoria
14.1.14|As riquezas de Salomão
14.2.1|Os preparativos para o templo
14.2.11|A resposta de Hirão a Salomão
14.3.1|Começa a construção do templo
14.3.5|O interior do templo
14.3.10|Os querubins
14.3.14|O véu e as colunas
14.4.1|O altar de bronze e o tanque de metal fundido
14.4.6|As dez pias, os candelabros e as mesas
14.4.9|Os pátios
14.4.11|A conclusão das obras de bronze
14.4.19|A conclusão dos utensílios de ouro
14.5.1|A arca é levada para o templo
14.6.1|Salomão bendiz o Senhor
14.6.12|A oração de dedicação de Salomão
14.7.1|Fogo do céu
14.7.4|Os sacrifícios de dedicação
14.7.11|A resposta do Senhor a Salomão
14.8.1|Outras realizações de Salomão
14.9.1|A rainha de Sabá
14.9.13|A riqueza e o esplendor de Salomão
14.9.29|A morte de Salomão
14.10.1|A rebelião contra Roboão
14.10.16|O reino é dividido
14.11.1|A profecia de Semaías
14.11.5|Roboão fortifica Judá
14.11.13|Jeroboão abandona os sacerdotes e levitas
14.11.18|A família de Roboão
14.12.1|Sisaque ataca Jerusalém
14.12.13|O reinado e a morte de Roboão
14.13.1|Abias reina em Judá
14.13.4|Guerra civil contra Jeroboão
14.14.1|Asa reina em Judá
14.15.1|A profecia de Azarias
14.15.8|As reformas de Asa
14.16.1|Guerra entre Asa e Baasa
14.16.7|A mensagem de Hanani a Asa
14.16.11|A morte e o sepultamento de Asa
14.17.1|Josafá reina em Judá
14.18.1|Josafá se alia a Acabe
14.18.12|Micaías profetiza contra Acabe
14.18.28|A derrota e a morte de Acabe
14.19.1|Jeú repreende Josafá
14.19.4|As reformas de Josafá
14.20.1|Guerra contra Josafá
14.20.5|A oração de Josafá
14.20.14|A profecia de Jaaziel
14.20.20|Os inimigos destroem uns aos outros
14.20.26|A volta com alegria
14.20.31|Resumo do reinado de Josafá
14.20.35|A frota de Josafá naufraga
14.21.1|Jeorão reina em Judá
14.21.8|Edom e Libna se rebelam
14.21.12|A carta de Elias a Jeorão
14.21.16|A doença e a morte de Jeorão
14.22.1|Acazias reina em Judá
14.22.8|Jeú mata os príncipes de Judá
14.22.10|Atalia e Joás
14.23.1|Joás é ungido rei de Judá
14.23.12|A morte de Atalia
14.23.16|Joiada restaura o culto ao Senhor
14.24.1|Joás reforma o templo
14.24.15|A morte e o sepultamento de Joiada
14.24.17|A maldade de Joás
14.24.23|A morte de Joás
14.25.1|Amazias reina em Judá
14.25.5|As vitórias de Amazias
14.25.14|Amazias é repreendido por idolatria
14.25.17|Jeoás derrota Amazias
14.25.25|A morte de Amazias
14.26.1|Uzias reina em Judá
14.27.1|Jotão reina em Judá
14.28.1|Acaz reina em Judá
14.28.5|Arã derrota Judá
14.28.16|A idolatria de Acaz
14.29.1|Ezequias purifica o templo
14.29.20|Ezequias restaura o culto no templo
14.30.1|Ezequias convoca a Páscoa
14.30.13|Ezequias celebra a Páscoa
14.31.1|A destruição dos ídolos
14.31.3|Contribuições para o culto
14.31.11|Ezequias organiza os sacerdotes
14.32.1|Senaqueribe invade Judá
14.32.9|Senaqueribe ameaça Jerusalém
14.32.20|Jerusalém é livrada dos assírios
14.32.24|A doença e a cura de Ezequias
14.32.32|A morte de Ezequias
14.33.1|Manassés reina em Judá
14.33.10|O arrependimento e a restauração de Manassés
14.33.21|Amom reina em Judá
14.34.1|Josias reina em Judá
14.34.3|Josias destrói a idolatria
14.34.8|Josias reforma o templo
14.34.14|Hilquias encontra o Livro da Lei
14.34.22|A profecia de Hulda
14.34.29|Josias renova a aliança
14.35.1|Josias restaura a Páscoa
14.35.20|A morte de Josias
14.35.25|Lamentos por Josias
14.36.1|Jeoacaz sucede Josias
14.36.5|Jeoaquim reina em Judá
14.36.9|Joaquim reina em Judá
14.36.11|Zedequias reina em Judá
14.36.15|A queda de Jerusalém
14.36.22|O decreto de Ciro
15.1.1|O decreto de Ciro
15.1.7|Ciro devolve os utensílios sagrados
15.2.1|A lista dos exilados que voltaram
15.2.68|As ofertas dos exilados
15.3.1|Os sacrifícios são restaurados
15.3.8|Começa a reconstrução do templo
15.4.1|Os inimigos atrapalham a obra
15.4.6|Oposição nos reinados de Xerxes e Artaxerxes
15.4.17|O decreto de Artaxerxes
15.5.1|A reconstrução do templo é retomada
15.5.6|A carta de Tatenai a Dario
15.6.1|O decreto de Dario
15.6.13|O templo é concluído
15.6.16|A dedicação do templo
15.6.19|Os exilados que voltaram celebram a Páscoa
15.7.1|Esdras chega a Jerusalém
15.7.11|A carta de Artaxerxes a Esdras
15.7.27|Esdras bendiz a Deus
15.8.1|Os exilados que voltaram com Esdras
15.8.15|Esdras manda buscar levitas
15.8.21|Jejum pedindo proteção
15.8.24|Sacerdotes guardam as ofertas
15.8.32|A chegada a Jerusalém
15.9.1|Casamentos com os povos vizinhos
15.9.5|A oração de confissão de Esdras
15.10.1|O encorajamento de Secanias
15.10.6|O povo confessa o seu pecado
15.10.18|Os culpados de casamentos mistos
16.1.1|A oração de Neemias
16.2.1|Neemias é enviado a Jerusalém
16.2.11|Neemias inspeciona os muros
16.3.1|Os construtores dos muros
16.4.1|A obra é ridicularizada
16.4.9|O desânimo é vencido
16.5.1|Neemias defende os oprimidos
16.5.14|A generosidade de Neemias
16.6.1|A conspiração de Sambalate
16.6.15|A conclusão do muro
16.7.1|A segurança da cidade
16.7.4|A lista dos exilados que voltaram
16.7.70|As ofertas dos exilados
16.8.1|Esdras lê a lei
16.8.13|A festa das cabanas
16.9.1|O povo confessa os seus pecados
16.10.1|Os que assinaram a aliança
16.10.28|Os compromissos da aliança
16.11.1|Os novos moradores de Jerusalém
16.11.20|Os moradores de fora de Jerusalém
16.12.1|Os sacerdotes e levitas que voltaram
16.12.27|A dedicação do muro
16.12.44|O sustento do culto no templo
16.13.1|Os estrangeiros são excluídos
16.13.4|O templo é purificado
16.13.10|Os dízimos são restaurados
16.13.15|O sábado é restaurado
16.13.23|Os casamentos mistos são proibidos
17.1.1|O banquete real de Xerxes
17.1.9|A recusa da rainha Vasti
17.1.13|A rainha Vasti é destituída
17.2.1|A busca de uma sucessora para Vasti
17.2.5|Ester conquista a simpatia de todos
17.2.17|Ester se torna rainha
17.2.21|Mardoqueu descobre uma conspiração
17.3.1|A trama de Hamã contra os judeus
17.4.1|Mardoqueu apela a Ester
17.5.1|Ester se apresenta ao rei
17.5.9|A trama de Hamã contra Mardoqueu
17.6.1|Mardoqueu é honrado
17.7.1|Ester intercede pelo seu povo
17.7.7|Hamã é enforcado
17.8.1|Ester apela em favor dos judeus
17.8.7|O decreto de Xerxes
17.9.1|Os judeus destroem os seus inimigos
17.9.11|Os filhos de Hamã são enforcados
17.9.18|É instituída a festa de Purim
17.10.1|Homenagem a Xerxes e a Mardoqueu
18.1.1|O caráter e a riqueza de Jó
18.1.6|O primeiro ataque de Satanás
18.1.13|Jó perde os filhos e os bens
18.2.1|Jó perde a saúde
18.2.11|Os três amigos de Jó
18.3.1|Jó lamenta o seu nascimento
18.4.1|Elifaz: os inocentes prosperam
18.5.1|Elifaz continua: Deus abençoa quem o busca
18.6.1|Jó responde: a minha queixa é justa
18.7.1|Jó continua: a vida parece inútil
18.8.1|Bildade: Jó deve se arrepender
18.9.1|Jó: como posso discutir com Deus?
18.10.1|A súplica de Jó a Deus
18.11.1|Zofar repreende Jó
18.12.1|Jó apresenta a sua causa
18.13.1|Jó prepara a sua defesa
18.14.1|Jó lamenta que a morte é definitiva
18.15.1|Elifaz: Jó não teme a Deus
18.16.1|Jó critica os seus consoladores
18.17.1|Jó se prepara para a morte
18.18.1|Bildade: Deus castiga os ímpios
18.19.1|Jó: o meu Redentor vive
18.20.1|Zofar: a destruição espera os ímpios
18.21.1|Jó: Deus castigará os ímpios
18.22.1|Elifaz: o homem pode ser útil a Deus?
18.23.1|Jó anseia por Deus
18.24.1|Jó: o julgamento dos ímpios
18.25.1|Bildade: o homem não pode ser justo
18.26.1|Jó: quem pode entender a majestade de Deus?
18.27.1|Jó afirma a sua integridade
18.27.7|A porção do homem ímpio
18.28.1|Onde se encontra a sabedoria?
18.29.1|As bênçãos passadas de Jó
18.30.1|A honra de Jó se torna desprezo
18.30.15|A prosperidade de Jó se torna desgraça
18.31.1|O último apelo de Jó
18.32.1|Eliú repreende os amigos de Jó
18.33.1|Eliú repreende Jó
18.34.1|Eliú confirma a justiça de Deus
18.35.1|Eliú relembra a justiça de Deus
18.36.1|Eliú descreve o poder de Deus
18.37.1|Eliú proclama a majestade de Deus
18.38.1|O Senhor desafia Jó
18.39.1|O Senhor fala da sua criação
18.40.1|Jó se humilha diante do Senhor
18.40.6|O Senhor desafia Jó outra vez
18.41.1|O poder do Senhor revelado no Leviatã
18.42.1|Jó se submete ao Senhor
18.42.7|O Senhor repreende os amigos de Jó
18.42.10|O Senhor abençoa Jó
19.1.1|Os dois caminhos
19.2.1|O Messias vitorioso
19.3.1|Livra-me, Senhor!
19.4.1|Responde-me quando eu clamar!
19.5.1|Escuta as minhas palavras
19.6.1|Não me repreendas na tua ira
19.7.1|Em ti me refugio
19.8.1|Como é majestoso o teu nome!
19.9.1|Darei graças ao Senhor
19.10.1|Os perigos do peregrino
19.11.1|No Senhor me refugio
19.12.1|Os fiéis desapareceram
19.13.1|Até quando, Senhor?
19.14.1|O tolo diz que não há Deus
19.15.1|Quem habitará no teu santo monte?
19.16.1|A presença do Senhor
19.17.1|Ouve a minha causa justa
19.18.1|O Senhor é a minha rocha
19.19.1|Os céus declaram a glória de Deus
19.20.1|O dia da angústia
19.21.1|Depois da batalha
19.22.1|O salmo da cruz
19.23.1|O Senhor é o meu pastor
19.24.1|Ao Senhor pertence a terra
19.25.1|A ti elevo a minha alma
19.26.1|Faze-me justiça, Senhor
19.27.1|O Senhor é a minha salvação
19.28.1|O Senhor é a minha força
19.29.1|Deem glória ao Senhor
19.30.1|Transformaste o meu pranto em dança
19.31.1|Nas tuas mãos entrego o meu espírito
19.32.1|A alegria do perdão
19.33.1|Louvor ao Criador
19.34.1|Provem e vejam como o Senhor é bom
19.35.1|Luta contra os meus adversários, Senhor
19.36.1|A transgressão do ímpio
19.37.1|Deleite-se no Senhor
19.38.1|Não me repreendas na tua ira
19.39.1|Vigiarei os meus caminhos
19.40.1|Esperei com paciência pelo Senhor
19.41.1|Vitória sobre a traição
19.42.1|Como a corça anseia pelas águas
19.43.1|Envia a tua luz
19.44.1|Resgata-nos, ó Deus
19.45.1|O meu coração transborda de um tema nobre
19.46.1|Deus é o nosso refúgio e fortaleza
19.47.1|Batam palmas, todos os povos
19.48.1|A escravidão rompida
19.49.1|A riqueza passageira
19.50.1|O Poderoso convoca
19.51.1|Cria em mim um coração puro, ó Deus
19.52.1|Por que te glorias do mal?
19.53.1|O tolo diz que não há Deus
19.54.1|Salva-me pelo teu nome
19.55.1|Entregue ao Senhor o seu fardo
19.56.1|Tem misericórdia de mim, ó Deus
19.57.1|Em ti a minha alma se refugia
19.58.1|Deus julga a terra
19.59.1|Livra-me dos meus inimigos
19.60.1|Vitória com Deus
19.61.1|Ouviste os meus votos
19.62.1|Esperando em Deus
19.63.1|Sede de Deus
19.64.1|A língua que fere
19.65.1|O louvor te aguarda em Sião, ó Deus
19.66.1|Aclamem a Deus com alegria
19.67.1|Que Deus faça resplandecer o seu rosto sobre nós
19.68.1|Os inimigos de Deus são dispersos
19.69.1|As águas me chegam ao pescoço
19.70.1|Apressa-te, Senhor, em me socorrer!
19.71.1|Sê a minha rocha de refúgio
19.72.1|Dá ao rei a tua justiça
19.73.1|Deus é bom para Israel
19.74.1|Por que nos rejeitaste para sempre?
19.75.1|O justo juízo de Deus
19.76.1|O nome de Deus é grande em Israel
19.77.1|No dia da angústia busquei o Senhor
19.78.1|Abrirei a minha boca em parábolas
19.79.1|Uma oração por livramento
19.80.1|Escuta-nos, ó Pastor de Israel
19.81.1|Cantem de alegria a Deus, nossa força
19.82.1|Deus preside a assembleia divina
19.83.1|Ó Deus, não te cales
19.84.1|Melhor é um dia nos teus átrios
19.85.1|Foste favorável à tua terra
19.86.1|Provado, mas confiante
19.87.1|O Senhor ama as portas de Sião
19.88.1|Clamo diante de ti
19.89.1|Cantarei para sempre o teu amor
19.90.1|De eternidade a eternidade
19.91.1|Tu és o meu refúgio e a minha fortaleza
19.92.1|Como são grandes as tuas obras!
19.93.1|O Senhor reina!
19.94.1|O Senhor não esquecerá o seu povo
19.95.1|Não endureçam o coração
19.96.1|Cantem ao Senhor, todos os habitantes da terra
19.97.1|Alegre-se a terra
19.98.1|Cantem ao Senhor um cântico novo
19.99.1|O Senhor reina!
19.100.1|Aclamem ao Senhor com alegria
19.101.1|Não porei coisa má diante dos meus olhos
19.102.1|A oração do aflito
19.103.1|Bendiga o Senhor a minha alma
19.104.1|Quantas são as tuas obras, Senhor!
19.105.1|Anunciem as suas maravilhas
19.106.1|Deem graças ao Senhor, porque ele é bom
19.107.1|Gratidão pelo livramento
19.108.1|A bênção do reino de Israel
19.109.1|O cântico do caluniado
19.110.1|O Messias fiel de Deus
19.111.1|Majestosa é a sua obra
19.112.1|O bendito temor do Senhor
19.113.1|O Senhor exalta o humilde
19.114.1|Um salmo do êxodo
19.115.1|Ao teu nome seja a glória
19.116.1|O Senhor ouviu a minha voz
19.117.1|Louvem-no, todos os povos
19.118.1|O Senhor está comigo
19.119.1|A tua palavra é lâmpada para os meus pés
19.120.1|Na minha angústia clamei ao Senhor
19.121.1|Elevo os meus olhos para os montes
19.122.1|Orem pela paz de Jerusalém
19.123.1|A ti elevo os meus olhos
19.124.1|O nosso socorro está no nome do Senhor
19.125.1|O Senhor protege o seu povo
19.126.1|Os cativos de Sião são restaurados
19.127.1|Os filhos são herança do Senhor
19.128.1|O bendito temor do Senhor
19.129.1|As cordas dos ímpios
19.130.1|Das profundezas
19.131.1|Acalmei a minha alma
19.132.1|O Senhor escolheu Sião
19.133.1|Como é bom viver em união!
19.134.1|Bendigam o Senhor, todos os seus servos
19.135.1|Louvem, servos do Senhor
19.136.1|O seu amor dura para sempre
19.137.1|Junto aos rios da Babilônia
19.138.1|Um coração agradecido
19.139.1|Tu me sondas e me conheces
19.140.1|Livra-me dos homens maus
19.141.1|Vem depressa me socorrer
19.142.1|Clamo ao Senhor em voz alta
19.143.1|Estendo as minhas mãos para ti
19.144.1|Bendito seja o Senhor, a minha rocha
19.145.1|Eu te exaltarei, meu Deus e Rei
19.146.1|Louve o Senhor, ó minha alma
19.147.1|É bom cantar louvores
19.148.1|Louvem o Senhor desde os céus
19.149.1|Cantem ao Senhor um cântico novo
19.150.1|Tudo o que tem fôlego louve o Senhor
20.1.1|O princípio do conhecimento
20.1.8|A sedução do pecado
20.1.20|A sabedoria clama em alta voz
20.2.1|Os benefícios da sabedoria
20.3.1|Confie no Senhor de todo o coração
20.3.13|As bênçãos da sabedoria
20.4.1|A instrução de um pai
20.5.1|Como evitar a imoralidade
20.6.1|Advertências contra a insensatez
20.6.20|Advertências contra o adultério
20.7.1|Advertências sobre a mulher adúltera
20.8.1|A excelência da sabedoria
20.9.1|O caminho da sabedoria
20.9.13|O caminho da insensatez
20.10.1|Provérbios de Salomão: o filho sábio
20.11.1|Balanças desonestas
20.12.1|Amar a disciplina e o conhecimento
20.13.1|A disciplina do pai
20.14.1|A mulher sábia
20.15.1|A resposta calma desvia a fúria
20.16.1|A resposta da língua vem do Senhor
20.17.1|Melhor é um pedaço de pão seco com paz
20.18.1|O egoísmo de quem se isola
20.19.1|O homem íntegro
20.20.1|O vinho é zombador
20.21.1|O coração do rei
20.22.1|O bom nome
20.22.17|Trinta ditados dos sábios
20.22.17|Ditado 1
20.22.22|Ditado 2
20.22.24|Ditado 3
20.22.26|Ditado 4
20.22.28|Ditado 5
20.22.29|Ditado 6
20.23.1|A verdadeira riqueza
20.23.1|Ditado 7
20.23.4|Ditado 8
20.23.6|Ditado 9
20.23.9|Ditado 10
20.23.10|Ditado 11
20.23.12|Ditado 12
20.23.13|Ditado 13
20.23.15|Ditado 14
20.23.17|Ditado 15
20.23.19|Ditado 16
20.23.22|Ditado 17
20.23.26|Ditado 18
20.23.29|Ditado 19
20.24.1|Não tenha inveja
20.24.1|Ditado 20
20.24.3|Ditado 21
20.24.5|Ditado 22
20.24.7|Ditado 23
20.24.8|Ditado 24
20.24.10|Ditado 25
20.24.13|Ditado 26
20.24.15|Ditado 27
20.24.17|Ditado 28
20.24.19|Ditado 29
20.24.21|Ditado 30
20.24.23|Outros ditados dos sábios
20.25.1|Outros provérbios de Salomão
20.26.1|Comparações e instruções
20.27.1|Não se gabe do amanhã
20.28.1|A coragem do justo
20.29.1|O florescimento do justo
20.30.1|As palavras de Agur
20.31.1|Os ditados para o rei Lemuel
20.31.10|As virtudes da mulher virtuosa
21.1.1|Tudo é inútil
21.1.12|Com a sabedoria vem a tristeza
21.2.1|A inutilidade do prazer
21.2.12|O sábio e o tolo
21.2.18|A inutilidade do trabalho
21.3.1|Há tempo para tudo
21.3.9|As obras de Deus permanecem para sempre
21.3.16|Do pó ao pó
21.4.1|O mal da opressão
21.4.13|A inutilidade do poder
21.5.1|Aproxime-se de Deus com reverência
21.5.8|A inutilidade da riqueza
21.6.1|A inutilidade da vida
21.7.1|O valor da sabedoria
21.7.15|Os limites da sabedoria humana
21.8.1|Obedeça ao rei
21.8.10|Tema a Deus
21.8.14|Os caminhos de Deus são misteriosos
21.9.1|A morte vem para bons e maus
21.9.7|Desfrute a sua porção nesta vida
21.9.13|A sabedoria é melhor que a força
21.10.1|Sabedoria e insensatez
21.11.1|Lance o seu pão sobre as águas
21.11.7|Aproveite os seus anos
21.12.1|Lembre-se do seu Criador
21.12.9|O dever de todo homem
22.1.1|A noiva declara o seu amor
22.1.2|A noiva
22.1.8|As amigas
22.1.9|O noivo
22.1.11|As amigas
22.1.12|A noiva
22.1.15|O noivo
22.1.16|A noiva
22.1.17|O noivo
22.2.1|A admiração da noiva
22.2.1|A noiva
22.2.2|O noivo
22.2.3|A noiva
22.2.14|O noivo
22.2.15|As amigas
22.2.16|A noiva
22.3.1|O sonho da noiva
22.3.6|Salomão chega no dia do seu casamento
22.4.1|Salomão admira a sua noiva
22.4.1|O noivo
22.4.16|A noiva
22.5.1|A noiva e o seu amado
22.5.1|O noivo
22.5.2|A noiva
22.5.9|As amigas
22.5.10|A noiva
22.6.1|Juntos no jardim
22.6.1|As amigas
22.6.2|A noiva
22.6.4|O noivo
22.6.10|As amigas
22.6.11|O noivo
22.6.13|As amigas
22.7.1|A admiração do noivo
22.8.1|A saudade do seu amado
22.8.5|As amigas
22.8.8|As amigas
22.8.10|A noiva
22.8.13|O noivo
22.8.14|A noiva
23.1.1|A rebelião de Judá
23.1.10|Ofertas sem sentido
23.1.21|A corrupção de Sião
23.2.1|O monte do templo do Senhor
23.2.5|O dia do acerto de contas
23.3.1|Juízo sobre Jerusalém e Judá
23.3.16|Advertência às filhas de Sião
23.4.1|Um remanescente em Sião
23.5.1|O cântico da vinha
23.5.8|Ai dos ímpios
23.6.1|A missão de Isaías
23.7.1|Uma mensagem para Acaz
23.7.10|O sinal de Emanuel
23.7.17|O juízo que virá
23.8.1|A invasão assíria é profetizada
23.8.11|Um chamado para temer a Deus
23.8.19|Trevas e luz
23.9.1|Um menino nos nasceu
23.9.8|Juízo contra o orgulho de Israel
23.9.13|Juízo contra a hipocrisia de Israel
23.9.18|Juízo contra a falta de arrependimento de Israel
23.10.1|Ai dos tiranos
23.10.5|Juízo sobre a Assíria
23.10.20|Um remanescente voltará
23.11.1|O tronco de Jessé
23.12.1|Gratidão com alegria
23.13.1|Profecia contra a Babilônia
23.14.1|A restauração de Israel
23.14.3|A queda do rei da Babilônia
23.14.24|O propósito de Deus contra a Assíria
23.14.28|A Filístia será destruída
23.15.1|Profecia contra Moabe
23.16.1|A destruição de Moabe
23.17.1|Profecia contra Damasco
23.18.1|Uma mensagem para Cuxe
23.19.1|Profecia contra o Egito
23.19.16|Uma bênção sobre a terra
23.20.1|Um sinal contra o Egito e Cuxe
23.21.1|Caiu a Babilônia
23.21.11|Profecia contra Edom
23.21.13|Profecia contra a Arábia
23.22.1|O vale da visão
23.22.15|Uma mensagem para Sebna
23.23.1|Profecia contra Tiro
23.24.1|O juízo de Deus sobre a terra
23.25.1|Louvor ao Deus vitorioso
23.26.1|Um cântico de salvação
23.27.1|A vinha do Senhor
23.28.1|O cativeiro de Efraim
23.28.14|Uma pedra angular em Sião
23.28.23|Escutem e ouçam
23.29.1|Ai da cidade de Davi
23.29.17|A santificação dos fiéis
23.30.1|O tratado inútil com o Egito
23.30.18|Deus será bondoso
23.31.1|Ai dos que confiam no Egito
23.32.1|Um rei justo
23.32.9|As mulheres de Jerusalém
23.33.1|O Senhor é exaltado
23.34.1|Juízo sobre as nações
23.34.5|Juízo sobre Edom
23.35.1|A glória de Sião
23.36.1|Senaqueribe ameaça Jerusalém
23.37.1|A mensagem de livramento de Isaías
23.37.8|A carta blasfema de Senaqueribe
23.37.14|A oração de Ezequias
23.37.21|A queda de Senaqueribe é profetizada
23.37.36|Jerusalém é livrada dos assírios
23.38.1|A doença e a cura de Ezequias
23.38.9|O cântico de gratidão de Ezequias
23.39.1|Ezequias mostra os seus tesouros
23.40.1|Preparem o caminho do Senhor
23.40.6|A palavra que permanece
23.40.9|Aqui está o seu Deus!
23.41.1|O socorro de Deus a Israel
23.41.21|Os ídolos inúteis
23.42.1|Eis o meu servo
23.42.10|Um novo cântico de louvor
23.42.18|Israel é surdo e cego
23.43.1|O único Salvador de Israel
23.43.14|Um caminho no deserto
23.43.22|A infidelidade de Israel
23.44.1|O Senhor escolheu Israel
23.44.21|Jerusalém será restaurada
23.45.1|Deus chama Ciro
23.46.1|Os ídolos da Babilônia
23.47.1|A humilhação da Babilônia
23.48.1|A teimosia de Israel
23.48.12|Livramento prometido a Israel
23.49.1|O servo, luz para os gentios
23.50.1|O pecado de Israel
23.50.4|A obediência do servo
23.51.1|Salvação para Sião
23.51.17|A ira de Deus é removida
23.52.1|Livramento para Jerusalém
23.52.13|O servo exaltado
23.53.1|O servo sofredor
23.53.9|Uma sepultura designada
23.54.1|Bênçãos futuras para Sião
23.55.1|Convite aos necessitados
23.56.1|Salvação para os estrangeiros
23.56.9|Os líderes pecadores de Israel
23.57.1|A morte abençoada do justo
23.57.3|Deus condena a idolatria
23.57.14|Cura para o arrependido
23.58.1|O verdadeiro jejum e o sábado
23.59.1|O pecado nos separa de Deus
23.59.18|A aliança do Redentor
23.60.1|A glória futura de Sião
23.61.1|O ano da graça do Senhor
23.62.1|A salvação e o novo nome de Sião
23.63.1|A vingança de Deus sobre as nações
23.63.7|Lembrança das misericórdias de Deus
23.63.15|Uma oração por misericórdia
23.64.1|Uma oração pelo poder de Deus
23.65.1|Juízos e promessas
23.65.17|Novos céus e nova terra
23.66.1|O céu é o meu trono
23.66.7|Alegrem-se com Jerusalém
23.66.15|Os juízos finais contra os ímpios
24.1.1|O chamado de Jeremias
24.2.1|Israel abandonou a Deus
24.2.14|A consequência do pecado de Israel
24.2.23|A infidelidade de Israel
24.3.1|O salário da prostituta
24.3.6|Judá segue o exemplo de Israel
24.3.11|Um chamado ao arrependimento
24.4.1|Um apelo para voltar
24.4.5|Desgraça vinda do norte
24.4.19|Lamento por Judá
24.5.1|Ninguém é justo
24.5.14|O juízo é anunciado
24.6.1|A última advertência a Jerusalém
24.6.22|Uma invasão vinda do norte
24.7.1|A mensagem de Jeremias à porta do templo
24.7.16|A idolatria de Judá continua
24.7.30|O vale da matança
24.8.1|O pecado e o castigo de Judá
24.8.14|A resposta do povo
24.8.18|Jeremias chora pelo seu povo
24.9.1|Um lamento por Sião
24.10.1|A soberania de Deus
24.10.17|O cativeiro que vem sobre Judá
24.11.1|A aliança quebrada
24.11.18|Uma trama contra Jeremias
24.12.1|A prosperidade dos ímpios
24.12.5|A resposta de Deus a Jeremias
24.12.14|Uma mensagem para os vizinhos de Israel
24.13.1|O cinto de linho
24.13.12|As vasilhas de vinho
24.13.15|A ameaça do cativeiro
24.14.1|Seca, fome, espada e peste
24.14.19|Uma oração por misericórdia
24.15.1|O juízo continuará
24.15.10|O lamento de Jeremias
24.15.19|A promessa do Senhor
24.16.1|A desgraça é anunciada
24.16.14|Deus restaurará Israel
24.17.1|O pecado e o castigo de Judá
24.17.12|A oração de Jeremias por livramento
24.17.19|A restauração do sábado
24.18.1|O oleiro e o barro
24.18.18|Outra trama contra Jeremias
24.19.1|O jarro quebrado
24.20.1|Pasur persegue Jeremias
24.20.7|A queixa de Jeremias
24.21.1|Jerusalém cairá diante da Babilônia
24.21.11|Uma mensagem para a casa de Davi
24.22.1|Advertência aos reis de Judá
24.22.6|Advertência sobre o palácio
24.22.10|Advertência sobre Salum
24.22.13|Advertência sobre Jeoaquim
24.22.24|Advertência a Conias
24.23.1|O Renovo justo de Davi
24.23.9|Os profetas mentirosos
24.23.33|As falsas profecias
24.24.1|Os figos bons e os ruins
24.25.1|Setenta anos de cativeiro
24.25.15|O cálice da ira de Deus
24.25.34|O clamor dos pastores
24.26.1|Advertência às cidades de Judá
24.26.7|Jeremias é ameaçado de morte
24.26.16|Jeremias escapa da morte
24.26.20|O profeta Urias
24.27.1|O jugo de Nabucodonosor
24.28.1|A falsa profecia de Hananias
24.29.1|A carta de Jeremias aos exilados
24.29.24|A mensagem para Semaías
24.30.1|A restauração de Israel e de Judá
24.31.1|O pranto se transforma em alegria
24.31.26|A nova aliança
24.32.1|Jeremias compra o campo de Hanameel
24.32.16|Jeremias ora pedindo entendimento
24.32.26|O Senhor responde a Jeremias
24.32.36|Uma promessa de restauração
24.33.1|A excelência da nação restaurada
24.33.14|A aliança com Davi
24.34.1|Uma profecia contra Zedequias
24.34.8|Liberdade para os escravos hebreus
24.35.1|A obediência dos recabitas
24.35.12|Judá é repreendido
24.36.1|O rolo de Jeremias é lido no templo
24.36.11|O rolo de Jeremias é lido no palácio
24.36.20|Jeoaquim queima o rolo
24.36.27|Jeremias escreve o rolo de novo
24.37.1|Jeremias adverte Zedequias
24.37.11|Jeremias é preso
24.38.1|Jeremias é jogado na cisterna
24.39.1|A queda de Jerusalém
24.39.11|Jeremias é libertado
24.40.1|Jeremias fica em Judá
24.40.7|Gedalias governa Judá
24.40.13|A trama contra Gedalias
24.41.1|O assassinato de Gedalias
24.41.11|Joanã resgata os cativos
24.42.1|Advertência contra ir para o Egito
24.43.1|Jeremias é levado para o Egito
24.44.1|Juízo sobre os judeus no Egito
24.44.15|A teimosia do povo
24.44.20|Desgraça para os judeus
24.45.1|A mensagem de Jeremias a Baruque
24.46.1|Juízo sobre o Egito
24.47.1|Juízo sobre os filisteus
24.48.1|Juízo sobre Moabe
24.49.1|Juízo sobre os amonitas
24.49.7|Juízo sobre Edom
24.49.23|Juízo sobre Damasco
24.49.28|Juízo sobre Quedar e Hazor
24.49.34|Juízo sobre Elão
24.50.1|Uma profecia contra a Babilônia
24.50.4|Esperança para Israel e Judá
24.50.11|A queda da Babilônia é certa
24.50.17|Resgate para o povo de Deus
24.50.21|A destruição da Babilônia
24.51.1|Juízo sobre a Babilônia
24.51.15|Louvor ao Deus de Jacó
24.51.20|O castigo da Babilônia
24.51.59|A mensagem de Jeremias a Seraías
24.52.1|O relato da queda de Jerusalém
24.52.12|O templo é destruído
24.52.24|Os cativos são levados para a Babilônia
24.52.31|Joaquim é libertado da prisão
25.1.1|Como está abandonada a cidade!
25.2.1|A ira de Deus sobre Jerusalém
25.3.1|As aflições do profeta
25.3.19|A esperança do profeta
25.3.37|A justiça de Deus
25.4.1|A angústia de Sião
25.5.1|Uma oração pedindo restauração
26.1.1|A visão de Ezequiel junto ao rio Quebar
26.1.4|Os quatro seres viventes
26.1.15|As quatro rodas
26.1.22|A glória divina
26.2.1|O chamado de Ezequiel
26.3.1|Ezequiel come o rolo
26.3.16|Uma sentinela para Israel
26.4.1|Um sinal do cerco de Jerusalém
26.4.9|O pão contaminado
26.5.1|A navalha do juízo
26.5.11|Fome, espada e dispersão
26.6.1|Juízo contra a idolatria
26.6.8|Um remanescente será abençoado
26.7.1|A hora da condenação
26.7.14|A desolação de Israel
26.8.1|A visão da idolatria no templo
26.9.1|A execução dos idólatras
26.10.1|A glória de Deus sai do templo
26.11.1|O mal nos altos postos
26.11.13|Uma promessa de restauração
26.11.22|A glória de Deus deixa Jerusalém
26.12.1|Sinais do cativeiro que vem
26.12.21|O provérbio atrevido
26.13.1|Repreensão aos falsos profetas
26.13.17|Repreensão às falsas profetisas
26.14.1|Os anciãos idólatras são condenados
26.14.12|Quatro juízos terríveis
26.15.1|Jerusalém, a videira inútil
26.16.1|A infidelidade de Jerusalém
26.16.35|Juízo sobre Jerusalém
26.16.59|A aliança é lembrada
26.17.1|A parábola das duas águias e da videira
26.17.11|A parábola é explicada
26.18.1|Quem pecar é que morrerá
26.19.1|Um lamento pelos príncipes de Israel
26.20.1|A rebelião de Israel no Egito
26.20.10|A rebelião de Israel no deserto
26.20.27|A rebelião de Israel na terra
26.20.33|Juízo e restauração
26.20.45|Uma profecia contra o sul
26.21.1|A espada do juízo de Deus
26.22.1|Os pecados de Jerusalém
26.22.17|A fornalha que purifica
26.22.23|Os líderes ímpios de Israel
26.23.1|As duas irmãs adúlteras
26.23.22|Aolibá será castigada
26.23.36|Juízo sobre as duas irmãs
26.24.1|A parábola da panela
26.24.15|A mulher de Ezequiel morre
26.25.1|Uma profecia contra Amom
26.25.8|Uma profecia contra Moabe
26.25.12|Uma profecia contra Edom
26.25.15|Uma profecia contra os filisteus
26.26.1|Uma profecia contra Tiro
26.27.1|Um lamento por Tiro
26.28.1|Uma profecia contra o governante de Tiro
26.28.11|Um lamento pelo rei de Tiro
26.28.20|Uma profecia contra Sidom
26.28.25|A restauração de Israel
26.29.1|Uma profecia contra o faraó
26.29.8|A desolação do Egito
26.29.17|O Egito, recompensa de Nabucodonosor
26.30.1|Um lamento pelo Egito
26.30.20|O poder do faraó é quebrado
26.31.1|O Egito cairá como a Assíria
26.32.1|Um lamento pelo faraó, rei do Egito
26.32.17|O Egito é lançado na cova
26.33.1|Ezequiel, sentinela de Israel
26.33.10|A mensagem da sentinela
26.33.21|A notícia da queda de Jerusalém
26.34.1|Uma profecia contra os pastores de Israel
26.34.11|O bom pastor
26.34.25|A aliança de paz
26.35.1|Uma profecia contra o monte Seir
26.36.1|Uma profecia aos montes de Israel
26.36.16|Um novo coração e um novo espírito
26.37.1|O vale dos ossos secos
26.37.15|Uma só nação com um só rei
26.38.1|Uma profecia contra Gogue
26.39.1|A matança dos exércitos de Gogue
26.39.21|Israel será restaurado
26.40.1|O homem com a vara de medir
26.40.5|A porta leste
26.40.17|O pátio externo
26.40.20|A porta norte
26.40.24|A porta sul
26.40.28|As portas do pátio interno
26.40.38|Oito mesas para os sacrifícios
26.40.44|Salas para o serviço
26.40.47|O pátio interno
26.41.1|O interior do templo
26.41.5|O exterior do templo
26.41.15|As estruturas internas
26.42.1|As salas dos sacerdotes
26.42.15|As medidas externas
26.43.1|A glória do Senhor volta ao templo
26.43.13|O altar do sacrifício
26.44.1|A porta leste é reservada ao príncipe
26.44.6|Repreensão aos levitas
26.44.15|As funções dos sacerdotes
26.45.1|A consagração da terra
26.45.7|A porção do príncipe
26.45.10|Balanças honestas
26.45.13|Ofertas e festas
26.46.1|As ofertas do príncipe
26.46.19|Os pátios para cozinhar e assar
26.47.1|As águas que saem do templo
26.47.13|As fronteiras da terra
26.48.1|As porções das tribos
26.48.8|As porções dos sacerdotes e levitas
26.48.15|A porção de uso comum
26.48.21|A porção do príncipe
26.48.23|As porções das demais tribos
26.48.30|As portas e as medidas da cidade
27.1.1|Daniel é levado para a Babilônia
27.1.8|A fidelidade de Daniel
27.1.17|A sabedoria de Daniel
27.2.1|O sonho perturbador de Nabucodonosor
27.2.14|O sonho é revelado a Daniel
27.2.24|Daniel interpreta o sonho
27.2.46|Nabucodonosor promove Daniel
27.3.1|A estátua de ouro de Nabucodonosor
27.3.8|Sadraque, Mesaque e Abede-Nego são acusados
27.3.19|A fornalha ardente
27.4.1|Nabucodonosor reconhece o reino de Deus
27.4.4|O sonho de Nabucodonosor com uma grande árvore
27.4.19|Daniel interpreta o segundo sonho
27.4.28|O segundo sonho se cumpre
27.4.34|Nabucodonosor é restaurado
27.5.1|O banquete de Belsazar
27.5.5|A escrita na parede
27.5.13|Daniel interpreta a escrita
27.6.1|A trama contra Daniel
27.6.10|Daniel na cova dos leões
27.6.25|Dario honra a Deus
27.7.1|A visão de Daniel dos quatro animais
27.7.9|A visão de Daniel do Ancião de Dias
27.7.13|A visão de Daniel do Filho do Homem
27.7.15|As visões de Daniel são interpretadas
27.8.1|A visão de Daniel do carneiro e do bode
27.8.15|Gabriel interpreta a visão de Daniel
27.9.1|A oração de Daniel pelo seu povo
27.9.20|A profecia de Gabriel sobre as setenta semanas
27.10.1|A visão de Daniel junto ao Tigre
27.11.1|Os reis do sul e do norte
27.11.36|O rei que se exalta
27.12.1|O tempo do fim
28.1.1|A mulher e os filhos de Oseias
28.2.1|O adultério de Israel é repreendido
28.2.14|A misericórdia de Deus para com Israel
28.3.1|Oseias resgata a sua mulher
28.4.1|A acusação de Deus contra o seu povo
28.5.1|Juízo sobre Israel e Judá
28.6.1|A falta de arrependimento de Israel e Judá
28.7.1|A iniquidade de Efraim
28.8.1|Israel colherá tempestade
28.9.1|O castigo de Israel
28.10.1|A retribuição pelo pecado de Israel
28.11.1|Do Egito chamei o meu filho
28.11.8|O amor de Deus por Israel
28.12.1|Repreensão a Efraim, Judá e Jacó
28.13.1|A ira de Deus contra Israel
28.13.9|Morte e ressurreição
28.13.15|Juízo sobre Samaria
28.14.1|Um chamado ao arrependimento
28.14.4|Uma promessa da bênção de Deus
29.1.1|A invasão dos gafanhotos
29.1.8|Um chamado ao luto
29.1.13|Um chamado ao arrependimento
29.2.1|O exército de gafanhotos
29.2.12|Voltem de todo o coração
29.2.18|A restauração é prometida
29.2.28|Derramarei o meu Espírito
29.3.1|O Senhor julga as nações
29.3.17|Bênçãos para o povo de Deus
30.1.1|Juízo sobre os vizinhos de Israel
30.2.1|Juízo sobre Moabe, Judá e Israel
30.3.1|Testemunhas contra Israel
30.4.1|O castigo não traz arrependimento
30.5.1|Um lamento contra Israel
30.5.4|Um chamado ao arrependimento
30.5.16|Ai do Israel rebelde
30.6.1|Ai dos que vivem tranquilos em Sião
30.6.8|O orgulho de Israel
30.7.1|Os gafanhotos, o fogo e o prumo
30.7.10|Amazias acusa Amós
30.8.1|O cesto de frutas maduras
30.9.1|A destruição de Israel
30.9.11|Uma promessa de restauração
31.1.1|A destruição de Edom
31.1.15|O livramento de Israel
32.1.1|Jonas foge do Senhor
32.1.4|A grande tempestade
32.1.11|Jonas é lançado ao mar
32.2.1|A oração de Jonas
32.3.1|Os ninivitas se arrependem
32.4.1|A ira de Jonas diante da compaixão do Senhor
33.1.1|O juízo que virá
33.1.8|Choro e lamento
33.2.1|Ai dos opressores
33.2.6|Repreensão aos falsos profetas
33.2.12|O remanescente de Israel
33.3.1|Governantes e profetas condenados
33.4.1|O monte do templo do Senhor
33.4.6|A restauração de Sião
33.5.1|Um governante de Belém
33.5.7|O remanescente de Jacó
33.6.1|A acusação contra Israel
33.6.9|O castigo de Israel
33.7.1|A grande miséria de Israel
33.7.7|A confissão e o consolo de Israel
33.7.14|A compaixão de Deus por Israel
34.1.1|Profecia contra Nínive
34.2.1|A queda de Nínive
34.3.1|Juízo sobre Nínive
35.1.1|A primeira queixa de Habacuque
35.1.5|A resposta do Senhor
35.1.12|A segunda queixa de Habacuque
35.2.1|O Senhor responde outra vez
35.2.6|Ai dos caldeus
35.3.1|A oração de Habacuque
35.3.17|Habacuque se alegra
36.1.1|Sofonias profetiza juízo sobre Judá
36.1.7|O dia do Senhor
36.2.1|Um chamado ao arrependimento
36.2.4|Juízo sobre os filisteus
36.2.8|Juízo sobre Moabe e Amom
36.2.12|Juízo sobre Cuxe e a Assíria
36.3.1|Juízo sobre Jerusalém
36.3.6|A purificação das nações
36.3.9|Um remanescente fiel
36.3.14|A restauração de Israel
37.1.1|Um chamado para reconstruir o templo
37.1.12|O povo obedece
37.2.1|A glória futura da casa de Deus
37.2.10|Bênçãos para um povo impuro
37.2.20|Zorobabel, o anel de selar do Senhor
38.1.1|Um chamado ao arrependimento
38.1.7|A visão dos cavalos
38.1.18|A visão dos chifres e dos artesãos
38.2.1|A visão do cordel de medir
38.2.6|O resgate de Sião
38.3.1|A visão do sumo sacerdote Josué
38.4.1|A visão do candelabro e das oliveiras
38.5.1|A visão do rolo que voa
38.5.5|A visão da mulher no cesto
38.6.1|A visão das quatro carruagens
38.6.9|A coroa e o templo
38.7.1|Um chamado à justiça e à misericórdia
38.8.1|A restauração de Jerusalém
38.9.1|Profecia contra os inimigos de Israel
38.9.9|O rei que vem a Sião
38.9.14|O Senhor salvará o seu povo
38.10.1|Judá e Israel serão restaurados
38.11.1|O rebanho condenado
38.11.10|Trinta moedas de prata
38.12.1|O livramento que virá para Jerusalém
38.12.10|O pranto por aquele a quem traspassaram
38.13.1|O fim da idolatria
38.13.7|O pastor é ferido e as ovelhas se dispersam
38.14.1|Os destruidores de Jerusalém são destruídos
38.14.16|Todas as nações adorarão o Rei
39.1.1|O amor do Senhor por Israel
39.1.6|As ofertas impuras
39.2.1|Advertência aos sacerdotes
39.2.10|A infidelidade de Judá
39.3.1|Enviarei o meu mensageiro
39.3.6|Roubando a Deus
39.3.13|O livro memorial
39.4.1|O dia do Senhor
40.1.1|A genealogia de Jesus
40.1.18|O nascimento de Jesus
40.2.1|A visita dos magos
40.2.13|A fuga para o Egito
40.2.16|Choro e grande lamento
40.2.19|A volta para Nazaré
40.3.1|A missão de João Batista
40.3.13|O batismo de Jesus
40.4.1|A tentação de Jesus
40.4.12|Jesus começa o seu ministério
40.4.18|Os primeiros discípulos
40.4.23|Jesus cura as multidões
40.5.1|O Sermão do Monte
40.5.3|As bem-aventuranças
40.5.13|O sal e a luz
40.5.17|O cumprimento da lei
40.5.21|A ira e a reconciliação
40.5.27|O adultério
40.5.31|O divórcio
40.5.33|Juramentos e votos
40.5.38|Amem os seus inimigos
40.6.1|A ajuda aos necessitados
40.6.5|A oração do Pai Nosso
40.6.16|O jejum verdadeiro
40.6.19|Tesouros no céu
40.6.22|A lâmpada do corpo
40.6.25|Não se preocupem
40.7.1|Não julguem os outros
40.7.7|Peçam, busquem, batam
40.7.13|A porta estreita
40.7.15|A árvore e os seus frutos
40.7.24|A casa sobre a rocha
40.7.28|A autoridade de Jesus
40.8.1|A súplica do leproso
40.8.5|A fé do centurião
40.8.14|Jesus cura na casa de Pedro
40.8.18|O preço de seguir Jesus
40.8.23|Jesus acalma a tempestade
40.8.28|Os demônios e os porcos
40.9.1|Jesus cura um paralítico
40.9.9|Jesus chama Mateus
40.9.14|Perguntas sobre o jejum
40.9.16|Os remendos e as vasilhas de couro
40.9.18|O toque de Jesus que cura
40.9.27|Jesus cura cegos e um mudo
40.9.35|O Senhor da colheita
40.10.1|Os doze apóstolos
40.10.5|A missão dos doze
40.10.16|Ovelhas no meio de lobos
40.10.26|Temam somente a Deus
40.10.32|Confessar a Cristo
40.10.34|Não paz, mas espada
40.10.40|A recompensa do serviço
40.11.1|A pergunta de João
40.11.7|Jesus dá testemunho sobre João
40.11.20|Ai dos que não se arrependem
40.11.25|Descanso para os cansados
40.12.1|O Senhor do sábado
40.12.9|Jesus cura no sábado
40.12.15|O servo escolhido de Deus
40.12.22|Uma casa dividida
40.12.31|O pecado imperdoável
40.12.33|Frutos bons e frutos ruins
40.12.38|O sinal de Jonas
40.12.43|O espírito impuro que volta
40.12.46|A mãe e os irmãos de Jesus
40.13.1|A parábola do semeador
40.13.10|O propósito das parábolas de Jesus
40.13.18|A explicação da parábola do semeador
40.13.24|A parábola do joio
40.13.31|A parábola do grão de mostarda
40.13.33|A parábola do fermento
40.13.34|Abrirei a minha boca em parábolas
40.13.36|A explicação da parábola do joio
40.13.44|As parábolas do tesouro e da pérola
40.13.47|A parábola da rede
40.13.53|Jesus é rejeitado em Nazaré
40.14.1|A decapitação de João
40.14.13|A multiplicação para cinco mil
40.14.22|Jesus anda sobre as águas
40.14.34|Jesus cura em Genesaré
40.15.1|A tradição dos anciãos
40.15.10|O que torna o homem impuro
40.15.21|A fé da mulher cananeia
40.15.29|A multiplicação para quatro mil
40.16.1|O pedido de um sinal
40.16.5|O fermento dos fariseus e saduceus
40.16.13|Pedro declara que Jesus é o Cristo
40.16.21|Jesus anuncia a sua paixão
40.16.24|Tome a sua cruz
40.17.1|A transfiguração
40.17.14|O menino endemoninhado
40.17.19|O poder da fé
40.17.22|O segundo anúncio da paixão
40.17.24|O imposto do templo
40.18.1|O maior no Reino
40.18.6|Tropeços e pecados
40.18.10|A parábola da ovelha perdida
40.18.15|O irmão que peca
40.18.19|Peçam em meu nome
40.18.21|O servo que não perdoou
40.19.1|Ensinos sobre o divórcio
40.19.13|Jesus abençoa as crianças
40.19.16|O jovem rico
40.20.1|A parábola dos trabalhadores da vinha
40.20.17|O terceiro anúncio da paixão
40.20.20|O pedido de uma mãe
40.20.29|Os cegos à beira do caminho
40.21.1|A entrada triunfal
40.21.12|Jesus purifica o templo
40.21.18|A figueira sem frutos
40.21.23|A autoridade de Jesus é questionada
40.21.28|A parábola dos dois filhos
40.21.33|A parábola dos lavradores maus
40.22.1|A parábola do banquete de casamento
40.22.15|O imposto pago a César
40.22.23|Os saduceus e a ressurreição
40.22.34|O maior mandamento
40.22.41|De quem o Cristo é filho?
40.23.1|Ai dos mestres da lei e fariseus
40.23.37|O lamento por Jerusalém
40.24.1|A destruição do templo e outros sinais
40.24.9|O testemunho a todas as nações
40.24.15|O sacrilégio terrível
40.24.26|A volta do Filho do Homem
40.24.32|A lição da figueira
40.24.36|Vigilância a qualquer hora
40.25.1|A parábola das dez virgens
40.25.14|A parábola dos talentos
40.25.31|As ovelhas e os bodes
40.26.1|A trama para matar Jesus
40.26.6|Jesus é ungido em Betânia
40.26.14|Judas combina trair Jesus
40.26.17|A preparação da Páscoa
40.26.20|A última ceia
40.26.31|Jesus prediz a negação de Pedro
40.26.36|Jesus ora no Getsêmani
40.26.47|Jesus é traído
40.26.57|Jesus diante do Sinédrio
40.26.69|Pedro nega Jesus
40.27.1|Jesus é entregue a Pilatos
40.27.3|Judas se enforca
40.27.11|Jesus diante de Pilatos
40.27.15|A multidão escolhe Barrabás
40.27.24|Pilatos lava as mãos
40.27.27|Os soldados zombam de Jesus
40.27.32|A crucificação
40.27.45|A morte de Jesus
40.27.57|O sepultamento de Jesus
40.27.62|Os guardas no sepulcro
40.28.1|A ressurreição
40.28.11|O relato dos guardas
40.28.16|A Grande Comissão
41.1.1|A missão de João Batista
41.1.12|A tentação e a pregação de Jesus
41.1.16|Os primeiros discípulos
41.1.21|Jesus expulsa um espírito impuro
41.1.29|Jesus cura na casa de Pedro
41.1.35|Jesus ora e prega
41.1.40|A súplica do leproso
41.2.1|Jesus cura um paralítico
41.2.13|Jesus chama Levi
41.2.18|Perguntas sobre o jejum
41.2.21|Os remendos e as vasilhas de couro
41.2.23|O Senhor do sábado
41.3.1|Jesus cura no sábado
41.3.7|Jesus cura as multidões
41.3.13|Os doze apóstolos
41.3.20|Uma casa dividida
41.3.28|O pecado imperdoável
41.3.31|A mãe e os irmãos de Jesus
41.4.1|A parábola do semeador
41.4.10|O propósito das parábolas de Jesus
41.4.13|A explicação da parábola do semeador
41.4.21|A lição da lâmpada
41.4.26|A semente que cresce em segredo
41.4.30|A parábola do grão de mostarda
41.4.35|Jesus acalma a tempestade
41.5.1|Os demônios e os porcos
41.5.21|O toque de Jesus que cura
41.6.1|Jesus é rejeitado em Nazaré
41.6.7|A missão dos doze
41.6.14|A decapitação de João
41.6.30|A multiplicação para cinco mil
41.6.45|Jesus anda sobre as águas
41.6.53|Jesus cura em Genesaré
41.7.1|A tradição dos anciãos
41.7.14|O que torna o homem impuro
41.7.24|A fé da mulher estrangeira
41.7.31|O homem surdo e mudo
41.8.1|A multiplicação para quatro mil
41.8.11|O pedido de um sinal
41.8.14|O fermento dos fariseus e de Herodes
41.8.22|O cego de Betsaida
41.8.27|Pedro declara que Jesus é o Cristo
41.8.31|Jesus anuncia a sua paixão
41.8.34|Tome a sua cruz
41.9.1|A transfiguração
41.9.14|O menino com um espírito mau
41.9.30|O segundo anúncio da paixão
41.9.33|O maior no Reino
41.9.42|Tropeços e pecados
41.9.49|O sal bom
41.10.1|Ensinos sobre o divórcio
41.10.13|Jesus abençoa as crianças
41.10.17|O jovem rico
41.10.32|O terceiro anúncio da paixão
41.10.35|O pedido de Tiago e João
41.10.46|Jesus cura Bartimeu
41.11.1|A entrada triunfal
41.11.12|Jesus amaldiçoa a figueira
41.11.15|Jesus purifica o templo
41.11.20|A figueira seca
41.11.27|A autoridade de Jesus é questionada
41.12.1|A parábola dos lavradores maus
41.12.13|O imposto pago a César
41.12.18|Os saduceus e a ressurreição
41.12.28|O maior mandamento
41.12.35|De quem o Cristo é filho?
41.12.38|Cuidado com os mestres da lei
41.12.41|A oferta da viúva
41.13.1|A destruição do templo e outros sinais
41.13.9|O testemunho a todas as nações
41.13.14|O sacrilégio terrível
41.13.24|A volta do Filho do Homem
41.13.28|A lição da figueira
41.13.32|Vigilância a qualquer hora
41.14.1|A trama para matar Jesus
41.14.3|Jesus é ungido em Betânia
41.14.10|Judas combina trair Jesus
41.14.12|A preparação da Páscoa
41.14.17|A última ceia
41.14.27|Jesus prediz a negação de Pedro
41.14.32|Jesus ora no Getsêmani
41.14.43|Jesus é traído
41.14.53|Jesus diante do Sinédrio
41.14.66|Pedro nega Jesus
41.15.1|Jesus é entregue a Pilatos
41.15.6|A multidão escolhe Barrabás
41.15.12|Pilatos entrega Jesus
41.15.16|Os soldados zombam de Jesus
41.15.21|A crucificação
41.15.33|A morte de Jesus
41.15.42|O sepultamento de Jesus
41.16.1|A ressurreição
41.16.9|Jesus aparece a Maria Madalena
41.16.12|Jesus aparece a dois discípulos
41.16.14|A Grande Comissão
41.16.19|A ascensão
42.1.1|Dedicatória a Teófilo
42.1.5|Gabriel anuncia o nascimento de João
42.1.26|Gabriel anuncia o nascimento de Jesus
42.1.39|Maria visita Isabel
42.1.46|O cântico de Maria
42.1.57|O nascimento de João Batista
42.1.67|O cântico de Zacarias
42.2.1|O nascimento de Jesus
42.2.8|Os pastores e os anjos
42.2.21|Jesus é apresentado no templo
42.2.25|A profecia de Simeão
42.2.36|A profecia de Ana
42.2.39|A volta para Nazaré
42.2.41|O menino Jesus no templo
42.3.1|A missão de João Batista
42.3.21|O batismo de Jesus
42.3.23|A genealogia de Jesus
42.4.1|A tentação de Jesus
42.4.14|Jesus começa o seu ministério
42.4.16|Jesus é rejeitado em Nazaré
42.4.31|Jesus expulsa um espírito impuro
42.4.38|Jesus cura na casa de Pedro
42.4.42|Jesus prega na Judeia
42.5.1|Os primeiros discípulos
42.5.12|A súplica do leproso
42.5.17|Jesus cura um paralítico
42.5.27|Jesus chama Levi
42.5.33|Perguntas sobre o jejum
42.5.36|Os remendos e as vasilhas de couro
42.6.1|O Senhor do sábado
42.6.6|Jesus cura no sábado
42.6.12|Os doze apóstolos
42.6.17|Jesus cura as multidões
42.6.20|As bem-aventuranças
42.6.24|Ai dos satisfeitos
42.6.27|Amem os seus inimigos
42.6.37|Não julguem os outros
42.6.43|A árvore e os seus frutos
42.6.46|A casa sobre a rocha
42.7.1|A fé do centurião
42.7.11|Jesus ressuscita o filho de uma viúva
42.7.18|A pergunta de João
42.7.24|Jesus dá testemunho sobre João
42.7.36|Uma mulher pecadora unge Jesus
42.8.1|Mulheres servem a Jesus
42.8.4|A parábola do semeador
42.8.16|A lição da lâmpada
42.8.19|A mãe e os irmãos de Jesus
42.8.22|Jesus acalma a tempestade
42.8.26|Os demônios e os porcos
42.8.40|O toque de Jesus que cura
42.9.1|A missão dos doze
42.9.7|Herodes procura ver Jesus
42.9.10|A multiplicação para cinco mil
42.9.18|Pedro declara que Jesus é o Cristo
42.9.21|Jesus anuncia a sua paixão
42.9.23|Tome a sua cruz
42.9.28|A transfiguração
42.9.37|O menino com um espírito mau
42.9.43|O segundo anúncio da paixão
42.9.46|O maior no Reino
42.9.51|Os samaritanos rejeitam Jesus
42.9.57|O preço de seguir Jesus
42.10.1|Jesus envia os setenta e dois
42.10.13|Ai dos que não se arrependem
42.10.17|A volta com alegria
42.10.21|A oração de gratidão de Jesus
42.10.25|A parábola do bom samaritano
42.10.38|Marta e Maria
42.11.1|A oração do Pai Nosso
42.11.5|Peçam, busquem, batam
42.11.14|Uma casa dividida
42.11.24|O espírito impuro que volta
42.11.27|A verdadeira felicidade
42.11.29|O sinal de Jonas
42.11.33|A lâmpada do corpo
42.11.37|Ai dos fariseus e dos peritos na lei
42.12.1|O fermento dos fariseus
42.12.4|Temam somente a Deus
42.12.8|Confessar a Cristo
42.12.13|A parábola do rico insensato
42.12.22|Não se preocupem
42.12.32|Tesouros no céu
42.12.35|Vigilância a qualquer hora
42.12.49|Não paz, mas divisão
42.12.54|Discernir os sinais dos tempos
42.12.57|A reconciliação com o adversário
42.13.1|Um chamado ao arrependimento
42.13.6|A parábola da figueira sem frutos
42.13.10|Jesus cura uma mulher encurvada
42.13.18|A parábola do grão de mostarda
42.13.20|A parábola do fermento
42.13.22|A porta estreita
42.13.31|O lamento por Jerusalém
42.14.1|Jesus cura um homem doente de hidropisia
42.14.7|A parábola dos convidados
42.14.15|A parábola do grande banquete
42.14.25|O preço de seguir Jesus
42.14.34|O sal bom
42.15.1|A parábola da ovelha perdida
42.15.8|A parábola da moeda perdida
42.15.11|A parábola do filho pródigo
42.16.1|A parábola do administrador astuto
42.16.14|A Lei e os Profetas
42.16.19|O rico e Lázaro
42.17.1|Tropeços e pecados
42.17.5|O poder da fé
42.17.11|Os dez leprosos
42.17.20|A vinda do Reino
42.18.1|A parábola da viúva persistente
42.18.9|O fariseu e o publicano
42.18.15|Jesus abençoa as crianças
42.18.18|O jovem rico
42.18.31|O terceiro anúncio da paixão
42.18.35|Jesus cura um mendigo cego
42.19.1|Jesus e Zaqueu
42.19.11|A parábola das dez minas
42.19.28|A entrada triunfal
42.19.41|Jesus chora por Jerusalém
42.19.45|Jesus purifica o templo
42.20.1|A autoridade de Jesus é questionada
42.20.9|A parábola dos lavradores maus
42.20.19|O imposto pago a César
42.20.27|Os saduceus e a ressurreição
42.20.41|De quem o Cristo é filho?
42.20.45|Cuidado com os mestres da lei
42.21.1|A oferta da viúva pobre
42.21.5|A destruição do templo e outros sinais
42.21.10|O testemunho a todas as nações
42.21.20|A destruição de Jerusalém
42.21.25|A volta do Filho do Homem
42.21.29|A lição da figueira
42.21.34|Estejam atentos para aquele dia
42.22.1|A trama para matar Jesus
42.22.3|Judas combina trair Jesus
42.22.7|A preparação da Páscoa
42.22.14|A última ceia
42.22.24|Quem é o maior?
42.22.31|Jesus prediz a negação de Pedro
42.22.39|Jesus ora no monte das Oliveiras
42.22.47|Jesus é traído
42.22.54|Pedro nega Jesus
42.22.63|Os soldados zombam de Jesus
42.22.66|Jesus diante do Sinédrio
42.23.1|Jesus diante de Pilatos
42.23.6|Jesus diante de Herodes
42.23.13|A multidão escolhe Barrabás
42.23.26|A crucificação
42.23.44|A morte de Jesus
42.23.50|O sepultamento de Jesus
42.24.1|A ressurreição
42.24.13|O caminho de Emaús
42.24.36|Jesus aparece aos discípulos
42.24.50|A ascensão
43.1.1|No princípio
43.1.6|O testemunho de João
43.1.14|O Verbo se fez carne
43.1.19|A missão de João Batista
43.1.29|Jesus, o Cordeiro de Deus
43.1.35|Os primeiros discípulos
43.1.43|Jesus chama Filipe e Natanael
43.2.1|O casamento em Caná
43.2.12|Jesus purifica o templo
43.3.1|Jesus e Nicodemos
43.3.22|O testemunho de João sobre Jesus
43.4.1|Jesus e a mulher samaritana
43.4.27|Os discípulos voltam e se admiram
43.4.39|Muitos samaritanos creem
43.4.43|Jesus cura o filho de um oficial
43.5.1|O tanque de Betesda
43.5.16|O Pai e o Filho
43.5.31|Testemunhos sobre Jesus
43.5.39|O testemunho das Escrituras
43.6.1|A multiplicação para cinco mil
43.6.16|Jesus anda sobre as águas
43.6.22|Jesus, o pão da vida
43.6.59|Muitos discípulos abandonam Jesus
43.6.67|A declaração de fé de Pedro
43.7.1|Jesus ensina na festa
43.7.25|Jesus é o Cristo?
43.7.37|Água viva
43.7.40|Divisão por causa de Jesus
43.7.45|A incredulidade dos líderes judeus
43.8.1|A mulher surpreendida em adultério
43.8.12|Jesus, a luz do mundo
43.8.30|A verdade os libertará
43.8.48|Antes de Abraão nascer, Eu Sou
43.9.1|Jesus cura um cego de nascença
43.9.13|Os fariseus investigam a cura
43.9.35|A cegueira espiritual
43.10.1|Jesus, o bom pastor
43.10.22|Jesus na festa da Dedicação
43.10.40|O testemunho de João é confirmado
43.11.1|A morte de Lázaro
43.11.17|Jesus consola Marta e Maria
43.11.38|Jesus ressuscita Lázaro
43.11.45|A trama para matar Jesus
43.12.1|Maria unge Jesus
43.12.9|A trama para matar Lázaro
43.12.12|A entrada triunfal
43.12.20|Jesus prediz a sua morte
43.12.37|Fé e incredulidade
43.13.1|Jesus lava os pés dos discípulos
43.13.18|Jesus prediz a traição
43.13.31|Amem uns aos outros
43.13.36|Jesus prediz a negação de Pedro
43.14.1|Na casa de meu Pai há muitas moradas
43.14.5|O caminho, a verdade e a vida
43.14.15|Jesus promete o Espírito Santo
43.14.27|Deixo a vocês a paz
43.15.1|Jesus, a videira verdadeira
43.15.9|Não há amor maior
43.15.18|O ódio do mundo
43.16.1|A perseguição é anunciada
43.16.5|A promessa do Espírito Santo
43.16.17|A tristeza se transformará em alegria
43.16.23|Peçam em meu nome
43.17.1|A oração pelo Filho
43.17.6|A oração pelos discípulos
43.17.20|A oração por todos os que creem
43.18.1|Jesus é traído
43.18.15|A primeira negação de Pedro
43.18.19|Jesus diante do sumo sacerdote
43.18.25|A segunda e a terceira negação de Pedro
43.18.28|Jesus diante de Pilatos
43.19.1|Os soldados zombam de Jesus
43.19.16|A crucificação
43.19.28|A morte de Jesus
43.19.31|O lado de Jesus é traspassado
43.19.38|O sepultamento de Jesus
43.20.1|A ressurreição
43.20.10|Jesus aparece a Maria Madalena
43.20.19|Jesus aparece aos discípulos
43.20.24|Jesus aparece a Tomé
43.20.30|O propósito do livro de João
43.21.1|Jesus aparece junto ao mar de Tiberíades
43.21.15|Jesus e Pedro
43.21.20|Jesus e o discípulo amado
44.1.1|Prólogo
44.1.6|A ascensão
44.1.12|Matias substitui Judas
44.2.1|O Espírito Santo no Pentecostes
44.2.14|Pedro fala à multidão
44.2.37|Três mil creem
44.2.42|A comunhão dos que creem
44.3.1|Um paralítico anda
44.3.11|Pedro fala no pórtico de Salomão
44.4.1|Pedro e João diante do Sinédrio
44.4.13|O nome de Jesus é proibido
44.4.23|A oração dos que creem
44.4.32|Os que creem repartem os bens
44.5.1|Ananias e Safira
44.5.12|Os apóstolos curam muitos
44.5.17|Os apóstolos são presos e libertados
44.5.24|Os apóstolos diante do Sinédrio
44.5.33|O conselho de Gamaliel
44.6.1|A escolha dos sete
44.6.8|A prisão de Estêvão
44.7.1|O discurso de Estêvão: o chamado de Abraão
44.7.9|José é vendido para o Egito
44.7.15|Israel é oprimido no Egito
44.7.20|O nascimento e a adoção de Moisés
44.7.23|Moisés é rejeitado e foge
44.7.30|O chamado de Moisés
44.7.39|A rebelião de Israel
44.7.44|O tabernáculo do testemunho
44.7.54|O apedrejamento de Estêvão
44.8.1|Saulo persegue a igreja
44.8.4|Filipe em Samaria
44.8.9|Simão, o mágico
44.8.26|Filipe e o etíope
44.9.1|No caminho de Damasco
44.9.10|Ananias batiza Saulo
44.9.20|Saulo prega em Damasco
44.9.23|A fuga de Damasco
44.9.26|Saulo em Jerusalém
44.9.31|A cura de Eneias
44.9.36|Tabita volta à vida
44.10.1|Cornélio manda chamar Pedro
44.10.9|A visão de Pedro
44.10.17|Pedro é chamado a Cesareia
44.10.24|Pedro visita Cornélio
44.10.34|Boas-novas para os gentios
44.10.44|Os gentios recebem o Espírito Santo
44.11.1|O relato de Pedro em Jerusalém
44.11.19|A igreja em Antioquia
44.12.1|Tiago é morto e Pedro é preso
44.12.5|O livramento de Pedro
44.12.20|A morte de Herodes
44.13.1|Começa a primeira viagem missionária de Paulo
44.13.4|Em Chipre
44.13.13|Em Antioquia da Pisídia
44.13.42|Uma luz para os gentios
44.14.1|Paulo e Barnabé em Icônio
44.14.8|A visita a Listra e Derbe
44.14.21|Os discípulos são fortalecidos
44.15.1|A discussão sobre a circuncisão
44.15.5|O concílio de Jerusalém
44.15.22|A carta aos cristãos gentios
44.15.30|Os irmãos de Antioquia se alegram
44.15.36|Começa a segunda viagem missionária de Paulo
44.16.1|Timóteo se junta a Paulo e Silas
44.16.6|A visão de Paulo com o macedônio
44.16.11|A conversão de Lídia em Filipos
44.16.16|Paulo e Silas são presos
44.16.25|A conversão do carcereiro
44.16.35|Um pedido oficial de desculpas
44.17.1|O tumulto em Tessalônica
44.17.10|O caráter dos bereanos
44.17.16|Paulo em Atenas
44.17.22|O discurso de Paulo no Areópago
44.18.1|Paulo trabalha em Corinto
44.18.12|Paulo diante de Gálio
44.18.18|Paulo volta a Antioquia
44.18.23|Começa a terceira viagem missionária de Paulo
44.19.1|O Espírito Santo é recebido em Éfeso
44.19.8|Paulo trabalha em Éfeso
44.19.13|Os sete filhos de Ceva
44.19.21|O tumulto em Éfeso
44.20.1|Paulo na Macedônia e na Grécia
44.20.7|Êutico é reanimado em Trôade
44.20.13|De Trôade a Mileto
44.20.17|A despedida de Paulo aos efésios
44.21.1|A viagem de Paulo a Jerusalém
44.21.8|Paulo visita Filipe, o evangelista
44.21.17|A chegada de Paulo a Jerusalém
44.21.27|Paulo é preso no templo
44.21.37|Paulo fala à multidão
44.22.1|A defesa de Paulo diante da multidão
44.22.22|Paulo, cidadão romano
44.23.1|Paulo diante do Sinédrio
44.23.12|A trama para matar Paulo
44.23.23|Paulo é enviado a Félix
44.24.1|Tértulo acusa Paulo
44.24.10|A defesa de Paulo diante de Félix
44.24.22|A sentença é adiada
44.25.1|O julgamento de Paulo diante de Festo
44.25.10|Paulo apela para César
44.25.13|Festo consulta Agripa
44.25.23|Paulo diante de Agripa e Berenice
44.26.1|O testemunho de Paulo a Agripa
44.26.24|Festo interrompe a defesa de Paulo
44.27.1|Paulo navega para Roma
44.27.13|A tempestade no mar
44.27.27|O naufrágio
44.28.1|Em terra na ilha de Malta
44.28.11|Paulo chega à Itália
44.28.16|Paulo prega em Roma
45.1.1|Paulo saúda os santos em Roma
45.1.8|Não me envergonho do evangelho
45.1.18|A ira de Deus contra o pecado
45.2.1|O justo juízo de Deus
45.2.17|Os judeus e a lei
45.3.1|Deus continua fiel
45.3.9|Não há nenhum justo
45.3.21|A justiça pela fé em Cristo
45.4.1|Abraão é justificado pela fé
45.4.13|Abraão recebe a promessa
45.5.1|O triunfo da fé
45.5.6|O sacrifício de Cristo pelos ímpios
45.5.12|Morte em Adão, vida em Cristo
45.6.1|Mortos para o pecado, vivos para Deus
45.6.15|O salário do pecado
45.7.1|Livres da lei
45.7.7|A lei de Deus é santa
45.7.13|A luta contra o pecado
45.8.1|Vivendo pelo Espírito
45.8.12|Herdeiros com Cristo
45.8.18|A glória futura
45.8.28|Deus age em todas as coisas
45.8.35|Mais que vencedores
45.9.1|A preocupação de Paulo com os judeus
45.9.6|A escolha soberana de Deus
45.9.30|A incredulidade de Israel
45.10.1|A palavra traz salvação
45.11.1|Um remanescente escolhido pela graça
45.11.11|Os gentios são enxertados
45.11.25|Todo o Israel será salvo
45.11.33|Um hino de louvor
45.12.1|Sacrifícios vivos
45.12.9|Amor, zelo, esperança e hospitalidade
45.12.14|O perdão
45.13.1|Submissão às autoridades
45.13.8|O amor cumpre a lei
45.13.11|O dia está próximo
45.14.1|A lei da liberdade
45.14.13|A lei do amor
45.15.1|Aceitem uns aos outros
45.15.7|Cristo, servo de judeus e gentios
45.15.14|Paulo, ministro aos gentios
45.15.23|Os planos de viagem de Paulo
45.16.1|Saudações pessoais e amor
45.16.17|Evitem divisões
45.16.21|Saudações dos colaboradores de Paulo
45.16.25|Doxologia
46.1.1|Saudações de Paulo e Sóstenes
46.1.4|Ação de graças
46.1.10|A unidade na igreja
46.1.18|A mensagem da cruz
46.1.26|A sabedoria que vem de Deus
46.2.1|A mensagem de Paulo pelo poder do Espírito
46.2.6|A sabedoria espiritual
46.3.1|Cooperadores de Deus
46.3.10|Cristo, o nosso alicerce
46.3.16|O templo de Deus e a sabedoria de Deus
46.4.1|Servos de Cristo
46.4.14|A advertência de Paulo como pai
46.5.1|A imoralidade é repreendida
46.5.9|Expulsem o irmão imoral
46.6.1|Processos entre irmãos
46.6.9|Membros de Cristo
46.6.18|O templo do Espírito Santo
46.7.1|Princípios do casamento
46.7.17|Vivam o seu chamado
46.7.25|Os solteiros e as viúvas
46.8.1|A comida sacrificada aos ídolos
46.9.1|Os direitos de um apóstolo
46.9.19|Paulo, servo de todos
46.9.24|Corram para vencer
46.10.1|Advertências do passado de Israel
46.10.14|Fujam da idolatria
46.10.23|Tudo para a glória de Deus
46.11.1|Os papéis no culto
46.11.17|A participação na Ceia do Senhor
46.12.1|Os dons espirituais
46.12.12|O corpo de Cristo
46.12.27|Os dons maiores
46.13.1|O amor
46.14.1|Profecia e línguas
46.14.26|Ordem no culto
46.15.1|A ressurreição de Cristo
46.15.12|A ressurreição dos mortos
46.15.20|A ordem da ressurreição
46.15.35|O corpo ressuscitado
46.15.50|Onde está, ó morte, a sua vitória?
46.16.1|A coleta para os santos
46.16.5|Os planos de viagem de Paulo
46.16.10|Timóteo e Apolo
46.16.13|Exortações finais
46.16.19|Assinatura e saudações finais
47.1.1|Paulo saúda os coríntios
47.1.3|O Deus de toda consolação
47.1.12|A mudança de planos de Paulo
47.2.1|Reafirmem o seu amor
47.2.12|Triunfo em Cristo
47.3.1|Ministros de uma nova aliança
47.3.7|A glória da nova aliança
47.4.1|A luz do evangelho
47.4.7|Um tesouro em vasos de barro
47.5.1|A nossa habitação eterna
47.5.11|Embaixadores de Cristo
47.6.1|As dificuldades de Paulo e a graça de Deus
47.6.14|Não se ponham em jugo desigual
47.7.1|A alegria de Paulo com os coríntios
47.8.1|A generosidade é elogiada
47.8.16|Tito é recomendado
47.9.1|Deus ama quem dá com alegria
47.10.1|A autoridade apostólica de Paulo
47.11.1|Paulo e os falsos apóstolos
47.11.16|O sofrimento e o serviço de Paulo
47.12.1|A revelação de Paulo
47.12.5|O espinho de Paulo e a graça de Deus
47.12.11|A preocupação de Paulo com os coríntios
47.13.1|Examinem a si mesmos
47.13.11|Bênção e despedida
48.1.1|A saudação de Paulo aos gálatas
48.1.6|Não há outro evangelho
48.1.10|Paulo prega o evangelho
48.2.1|O concílio de Jerusalém
48.2.11|Paulo confronta Cefas
48.3.1|Fé e crença
48.3.10|Cristo nos resgatou
48.3.15|O propósito da lei
48.3.26|Filhos pela fé em Cristo
48.4.1|Filhos e herdeiros
48.4.8|A preocupação de Paulo com os gálatas
48.4.21|Agar e Sara
48.5.1|Liberdade em Cristo
48.5.16|Vivendo pelo Espírito
48.6.1|Levem os fardos uns dos outros
48.6.11|Advertências e bênçãos finais
49.1.1|A saudação de Paulo aos efésios
49.1.3|Bênçãos espirituais
49.1.15|Sabedoria espiritual
49.2.1|Vivos com Cristo
49.2.11|Um só em Cristo
49.2.19|Cristo, a nossa pedra angular
49.3.1|O mistério do evangelho
49.3.14|A oração de Paulo pelos efésios
49.4.1|A unidade no corpo
49.4.17|A nova vida em Cristo
49.5.1|Imitadores de Deus
49.5.8|Filhos da luz
49.5.21|Mulheres e maridos
49.6.1|Filhos e pais
49.6.5|Servindo com dignidade
49.6.10|A armadura completa de Deus
49.6.21|Saudações finais
50.1.1|Saudações de Paulo e Timóteo
50.1.3|Ação de graças e oração
50.1.12|As provações de Paulo fazem o evangelho avançar
50.1.21|O viver é Cristo
50.1.27|Dignos do evangelho
50.2.1|Um só em Cristo
50.2.5|A atitude de Cristo
50.2.12|Luzes no mundo
50.2.19|Timóteo e Epafrodito
50.3.1|A justiça pela fé em Cristo
50.3.12|Prosseguindo para o alvo
50.3.17|Cidadania nos céus
50.4.1|Alegrem-se no Senhor
50.4.10|A generosidade dos filipenses
50.4.21|Saudações finais
51.1.1|Saudações de Paulo e Timóteo
51.1.3|Ação de graças e oração
51.1.15|A supremacia do Filho
51.1.24|O sofrimento de Paulo pela igreja
51.2.1|Ausente no corpo, presente em espírito
51.2.6|Vivos com Cristo
51.3.1|Revistam-se do novo homem
51.3.18|A família cristã
51.3.22|Servindo com dignidade
51.4.1|Palavras e ações com oração
51.4.7|Saudações dos colaboradores de Paulo
51.4.15|Assinatura e instruções finais
52.1.1|Saudações aos tessalonicenses
52.2.1|O ministério de Paulo
52.2.17|O desejo de Paulo de visitá-los
52.3.1|A visita de Timóteo
52.3.6|O relato encorajador de Timóteo
52.4.1|Vivendo para agradar a Deus
52.4.13|A volta do Senhor
52.5.1|O dia do Senhor
52.5.12|A vida cristã
52.5.23|Bênçãos e instruções finais
53.1.1|Saudações aos tessalonicenses
53.1.5|A vinda de Cristo
53.2.1|O homem do pecado
53.2.13|Permaneçam firmes
53.3.1|Pedido de oração
53.3.6|Advertência contra a ociosidade
53.3.16|Assinatura e saudações finais
54.1.1|A saudação de Paulo a Timóteo
54.1.3|A correção dos falsos mestres
54.1.12|A graça de Deus para com Paulo
54.2.1|Um chamado à oração
54.2.9|Instruções às mulheres
54.3.1|As qualificações dos bispos
54.3.8|As qualificações dos diáconos
54.3.14|O mistério da piedade
54.4.1|Advertência contra a apostasia
54.4.6|Um bom servo de Cristo Jesus
54.5.1|Repreensão e respeito
54.5.3|A honra às verdadeiras viúvas
54.5.17|A honra aos presbíteros
54.5.21|Uma recomendação a Timóteo
54.6.1|Servindo com dignidade
54.6.3|Rejeitem as falsas doutrinas
54.6.6|A piedade com contentamento
54.6.11|Combata o bom combate
54.6.17|Uma recomendação aos ricos
54.6.20|Guarde a fé
55.1.1|A saudação de Paulo a Timóteo
55.1.3|Fidelidade na perseguição
55.1.13|Apegando-se ao ensino sadio
55.2.1|Graça e perseverança
55.2.14|O obreiro aprovado pelo Senhor
55.3.1|O mal nos últimos dias
55.3.10|Toda a Escritura é inspirada por Deus
55.4.1|Pregue a palavra
55.4.9|Assuntos pessoais
55.4.16|O Senhor permanece fiel
55.4.19|Saudações finais
56.1.1|A saudação de Paulo a Tito
56.1.5|A nomeação de presbíteros em Creta
56.1.10|A correção dos falsos mestres
56.2.1|O ensino da sã doutrina
56.2.11|A graça de Deus traz salvação
56.3.1|Herdeiros da graça
56.3.9|Evitem divisões
56.3.12|Observações e saudações finais
57.1.1|Saudações de Paulo e Timóteo
57.1.4|A fé e o amor de Filemom
57.1.8|O apelo de Paulo por Onésimo
57.1.23|Outras saudações
58.1.1|A supremacia do Filho
58.2.1|A salvação é confirmada
58.2.5|Jesus, semelhante aos seus irmãos
58.3.1|Jesus, nosso apóstolo e sumo sacerdote
58.3.7|Não endureçam o coração
58.3.12|O perigo da incredulidade
58.4.1|O descanso sabático
58.4.12|A palavra viva
58.5.1|O sumo sacerdote perfeito
58.5.11|Leite e alimento sólido
58.6.1|Um chamado à maturidade
58.6.13|A promessa imutável de Deus
58.7.1|Melquisedeque e Abraão
58.7.11|Um sacerdócio superior
58.8.1|O sacerdócio eterno de Cristo
58.8.6|A nova aliança
58.9.1|O tabernáculo terreno
58.9.11|A redenção pelo seu sangue
58.10.1|O sacrifício perfeito de Cristo
58.10.19|Um chamado à perseverança
58.11.1|Fé e certeza
58.11.4|A fé de Abel, Enoque e Noé
58.11.8|A fé de Abraão e Sara
58.11.20|A fé de Isaque, Jacó e José
58.11.23|A fé de Moisés
58.11.30|A fé de muitos
58.12.1|Um chamado à perseverança
58.12.4|Deus disciplina os seus filhos
58.12.14|Um chamado à santidade
58.12.18|Um reino inabalável
58.13.1|O amor fraternal
58.13.5|Cristo não muda
58.13.15|Sacrifício, obediência e oração
58.13.20|Bênção e despedida
59.1.1|Uma saudação de Tiago
59.1.2|Alegria nas provações
59.1.13|Os dons bons e perfeitos
59.1.19|Ouvir e praticar
59.2.1|Advertência contra o favoritismo
59.2.14|Fé e obras
59.3.1|Como domar a língua
59.3.13|A sabedoria que vem do alto
59.4.1|Advertência contra o orgulho
59.4.7|Aproximem-se de Deus
59.4.13|Não se gabem do amanhã
59.5.1|Advertência aos ricos
59.5.7|Paciência no sofrimento
59.5.13|A oração da fé
59.5.19|A restauração do pecador
60.1.1|Uma saudação de Pedro
60.1.3|Uma esperança viva
60.1.13|Um chamado à santidade
60.1.22|A palavra que permanece
60.2.1|A pedra viva e o povo escolhido
60.2.13|Submissão às autoridades
60.2.21|O exemplo de Cristo no sofrimento
60.3.1|Mulheres e maridos
60.3.8|Afastem-se do mal
60.3.14|Sofrendo por causa da justiça
60.4.1|Vivendo para a glória de Deus
60.4.12|Sofrendo como cristãos
60.5.1|Instruções aos presbíteros
60.5.5|Lancem sobre ele as suas preocupações
60.5.10|Bênção e despedida
61.1.1|Uma saudação de Pedro
61.1.3|Participantes da natureza divina
61.1.16|Testemunhas oculares da sua majestade
61.2.1|Livramento dos falsos profetas
61.3.1|O juízo que virá
61.3.8|O dia do Senhor
61.3.14|Exortações finais
62.1.1|A Palavra da vida
62.1.5|Andando na luz
62.2.1|Jesus, o nosso advogado
62.2.7|Um novo mandamento
62.2.15|Não amem o mundo
62.2.18|Cuidado com os anticristos
62.2.24|Permaneçam em Cristo
62.3.1|Filhos de Deus
62.3.11|Amem uns aos outros
62.4.1|Ponham à prova os espíritos
62.4.7|O amor vem de Deus
62.5.1|Vencendo o mundo
62.5.9|O testemunho de Deus sobre o seu Filho
62.5.13|A oração eficaz
62.5.18|O Deus verdadeiro
63.1.1|Uma saudação do presbítero
63.1.4|Andando na verdade
63.1.7|Cuidado com os enganadores
63.1.12|Conclusão
64.1.1|Uma saudação do presbítero
64.1.5|Gaio é elogiado pela hospitalidade
64.1.9|Diótrefes e Demétrio
64.1.13|Conclusão
65.1.1|Uma saudação de Judas
65.1.3|O juízo de Deus sobre os ímpios
65.1.17|Um chamado à perseverança
65.1.24|Doxologia
66.1.1|Prólogo
66.1.4|João saúda as sete igrejas
66.1.9|A visão de João em Patmos
66.2.1|À igreja em Éfeso
66.2.8|À igreja em Esmirna
66.2.12|À igreja em Pérgamo
66.2.18|À igreja em Tiatira
66.3.1|À igreja em Sardes
66.3.7|À igreja em Filadélfia
66.3.14|À igreja em Laodiceia
66.4.1|O trono no céu
66.4.5|A adoração ao Criador
66.5.1|O Cordeiro recebe o livro
66.5.11|O Cordeiro é exaltado
66.6.1|O primeiro selo: o cavalo branco
66.6.3|O segundo selo: a guerra
66.6.5|O terceiro selo: a fome
66.6.7|O quarto selo: a morte
66.6.9|O quinto selo: os mártires
66.6.12|O sexto selo: o terror
66.7.1|Os 144 mil selados
66.7.9|O louvor da grande multidão
66.8.1|O sétimo selo
66.8.6|As quatro primeiras trombetas
66.9.1|A quinta trombeta
66.9.13|A sexta trombeta
66.10.1|O anjo e o livrinho
66.11.1|As duas testemunhas
66.11.7|As testemunhas são mortas e ressuscitam
66.11.15|A sétima trombeta
66.12.1|A mulher e o dragão
66.12.7|A guerra no céu
66.12.13|A mulher é perseguida
66.13.1|A besta que sai do mar
66.13.11|A besta que sai da terra
66.13.16|A marca da besta
66.14.1|O Cordeiro e os 144 mil
66.14.6|Os três anjos e a queda da Babilônia
66.14.14|A colheita da terra
66.15.1|O cântico de Moisés e do Cordeiro
66.15.5|A preparação para o juízo
66.16.1|As seis primeiras taças da ira
66.16.17|A sétima taça da ira
66.17.1|A mulher sobre a besta
66.17.6|O mistério é explicado
66.17.14|A vitória do Cordeiro
66.18.1|Caiu a Babilônia
66.18.9|O lamento pela Babilônia
66.18.21|A condenação da Babilônia
66.19.1|Alegria no céu
66.19.6|O casamento do Cordeiro
66.19.11|O cavaleiro do cavalo branco
66.19.17|A derrota da besta e do falso profeta
66.20.1|Satanás é preso
66.20.7|Satanás é lançado no lago de fogo
66.20.11|O julgamento diante do grande trono branco
66.21.1|Novos céus e nova terra
66.21.9|A nova Jerusalém
66.22.1|O rio da vida
66.22.6|Jesus vem em breve
66.22.18|Nada pode ser acrescentado nem tirado`;

let indice: Map<string, { v: number; t: string }[]> | null = null;

/** Subtítulos de um capítulo, em ordem, com o versículo antes do qual aparecem. */
export function subtitulosDoCapitulo(livro: number, capitulo: number): { v: number; t: string }[] {
  if (!indice) {
    indice = new Map();
    for (const linha of DADOS.split('\n')) {
      const i = linha.indexOf('|');
      const [l, c, v] = linha.slice(0, i).split('.').map(Number);
      const chave = `${l}.${c}`;
      const lista = indice.get(chave) || [];
      lista.push({ v, t: linha.slice(i + 1) });
      indice.set(chave, lista);
    }
  }
  return indice.get(`${livro}.${capitulo}`) || [];
}
