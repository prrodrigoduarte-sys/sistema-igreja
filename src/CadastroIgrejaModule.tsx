// src/CadastroIgrejaModule.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

interface Props {
  loggedUser: any;
}

export default function CadastroIgrejaModule({ loggedUser }: Props) {
  const [igrejas, setIgrejas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalNovaIgreja, setModalNovaIgreja] = useState(false);
  const [itemEditando, setItemEditando] = useState<any | null>(null);

  // Mapeamento exato da tabela public.igrejas
  const [codigoIgreja, setCodigoIgreja] = useState('IGR-001');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  
  // Endereço
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('Teófilo Otoni');
  const [uf, setUf] = useState('MG');

  // Diretoria / Liderança
  const [nomeResponsavel, setNomeResponsavel] = useState('');
  const [cpfResponsavel, setCpfResponsavel] = useState('');
  const [tesoureiroNome, setTesoureiroNome] = useState('');
  const [nomeContador, setNomeContador] = useState('');
  const [crcContador, setCrcContador] = useState('');

  // App Mobile (Instagram)
  const [linkInstagram, setLinkInstagram] = useState('https://instagram.com');

  const codigoIgrejaUsuario = loggedUser?.codigo_igreja || 'IGR-001';

  // Buscar igrejas cadastradas
  const carregarIgrejas = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('igrejas')
        .select('*')
        .order('codigo_igreja', { ascending: true });

      if (!error && data) {
        setIgrejas(data);
      }
    } catch (err) {
      console.error('Erro ao buscar igrejas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarIgrejas();
  }, [carregarIgrejas]);

  // Abrir modal de criação
  const handleAbrirNova = () => {
    setItemEditando(null);
    const proximoNum = igrejas.length + 1;
    const codigoSugerido = `IGR-${String(proximoNum).padStart(3, '0')}`;

    setCodigoIgreja(codigoSugerido);
    setRazaoSocial('');
    setNomeFantasia('');
    setCnpj('');
    setTelefone('');
    setEmail('');
    setCep('');
    setLogradouro('');
    setNumero('');
    setBairro('');
    setCidade('Teófilo Otoni');
    setUf('MG');
    setNomeResponsavel('');
    setCpfResponsavel('');
    setTesoureiroNome('');
    setNomeContador('');
    setCrcContador('');
    setLinkInstagram('https://instagram.com');
    setModalNovaIgreja(true);
  };

  // Abrir modal de edição
  const handleAbrirEditar = (item: any) => {
    setItemEditando(item);
    setCodigoIgreja(item.codigo_igreja || '');
    setRazaoSocial(item.razao_social || '');
    setNomeFantasia(item.nome_fantasia || '');
    setCnpj(item.cnpj || '');
    setTelefone(item.telefone || '');
    setEmail(item.email || '');
    setCep(item.cep || '');
    setLogradouro(item.logradouro || '');
    setNumero(item.numero || '');
    setBairro(item.bairro || '');
    setCidade(item.cidade || 'Teófilo Otoni');
    setUf(item.uf || 'MG');
    setNomeResponsavel(item.nome_responsavel || item.responsavel_nome || '');
    setCpfResponsavel(item.cpf_responsavel || '');
    setTesoureiroNome(item.tesoureiro_nome || '');
    setNomeContador(item.nome_contador || item.contador_nome || '');
    setCrcContador(item.crc_contador || '');
    setModalNovaIgreja(true);
  };

  // Salvar ou Atualizar no Supabase
  const handleSalvarIgreja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!razaoSocial.trim() || !codigoIgreja.trim()) {
      return alert('Preencha a Razão Social e o Código da Igreja.');
    }

    const codUpper = codigoIgreja.toUpperCase().trim();
    const enderecoCompleto = [logradouro, numero, bairro, cidade, uf].filter(Boolean).join(', ');

    try {
      const payload = {
        codigo_igreja: codUpper,
        razao_social: razaoSocial.trim(),
        nome_fantasia: nomeFantasia.trim() || razaoSocial.trim(),
        cnpj: cnpj.trim(),
        telefone: telefone.trim(),
        email: email.trim(),
        cep: cep.trim(),
        logradouro: logradouro.trim(),
        numero: numero.trim(),
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        uf: uf.trim().toUpperCase(),
        nome_responsavel: nomeResponsavel.trim(),
        responsavel_nome: nomeResponsavel.trim(),
        cpf_responsavel: cpfResponsavel.trim(),
        tesoureiro_nome: tesoureiroNome.trim(),
        nome_contador: nomeContador.trim(),
        contador_nome: nomeContador.trim(),
        crc_contador: crcContador.trim(),
        ativo: true,
      };

      if (itemEditando) {
        const { error } = await supabase
          .from('igrejas')
          .update(payload)
          .eq('id', itemEditando.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('igrejas').insert([payload]);
        if (error) throw error;
      }

      // Sincroniza dados do App Mobile na tabela dados_igreja
      await supabase.from('dados_igreja').upsert(
        [
          {
            codigo_igreja: codUpper,
            nome_igreja: nomeFantasia.trim() || razaoSocial.trim(),
            endereco_completo: enderecoCompleto,
            link_instagram: linkInstagram.trim() || 'https://instagram.com',
            telefone_contato: telefone.trim(),
          },
        ],
        { onConflict: 'codigo_igreja' }
      );

      alert('🏛️ Igreja/Congregação salva com sucesso!');
      setModalNovaIgreja(false);
      carregarIgrejas();
    } catch (err: any) {
      alert('Erro ao salvar igreja: ' + err.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 max-w-5xl mx-auto shadow-sm space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl font-black text-blue-900">🏛️ Gestão de Igrejas e Congregações</h2>
          <p className="text-xs text-slate-500 mt-1">
            Controle de dados fiscais, endereço e liderança por código (<span className="font-bold text-blue-900">IGR-001, IGR-002...</span>).
          </p>
        </div>

        <button
          type="button"
          onClick={handleAbrirNova}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs shadow transition cursor-pointer flex items-center gap-2"
        >
          ➕ Cadastrar Nova Igreja
        </button>
      </div>

      {/* CARDS DAS IGREJAS */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-center py-8 text-xs text-slate-400">Carregando dados das igrejas...</p>
        ) : igrejas.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed text-slate-400 text-xs">
            Nenhuma igreja cadastrada. Clique no botão acima para adicionar.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {igrejas.map((item) => (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition shadow-sm space-y-3 ${
                  item.codigo_igreja === codigoIgrejaUsuario
                    ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-600/20'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-black text-xs px-2.5 py-0.5 rounded-lg bg-blue-900 text-white">
                      {item.codigo_igreja}
                    </span>
                    <h4 className="font-black text-blue-900 text-base mt-2">
                      {item.nome_fantasia || item.razao_social}
                    </h4>
                    {item.razao_social && item.nome_fantasia && (
                      <p className="text-[11px] text-slate-500">Razão Social: {item.razao_social}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAbrirEditar(item)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    ✏️ Editar
                  </button>
                </div>

                <div className="text-xs text-slate-600 space-y-1 border-t pt-2">
                  {item.cnpj && <p>📄 <strong>CNPJ:</strong> {item.cnpj}</p>}
                  {item.nome_responsavel && <p>👤 <strong>Pastor / Resp:</strong> {item.nome_responsavel}</p>}
                  {item.tesoureiro_nome && <p>💰 <strong>Tesoureiro:</strong> {item.tesoureiro_nome}</p>}
                  {item.telefone && <p>📞 <strong>Telefone:</strong> {item.telefone}</p>}
                  <p>📍 <strong>Endereço:</strong> {[item.bairro, item.cidade, item.uf].filter(Boolean).join(' - ')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL COMPLETA DE CADASTRO */}
      {modalNovaIgreja && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 space-y-5 my-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-lg font-black text-blue-900">
                  {itemEditando ? '✏️ Editar Dados da Igreja' : '➕ Cadastrar Nova Igreja / Congregação'}
                </h3>
                <p className="text-xs text-slate-500">Formulário integrado com o banco public.igrejas</p>
              </div>

              <button
                type="button"
                onClick={() => setModalNovaIgreja(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 font-bold text-xs rounded-xl cursor-pointer"
              >
                ✕ Cancelar
              </button>
            </div>

            <form onSubmit={handleSalvarIgreja} className="space-y-4 text-xs">
              {/* DADOS FISCAIS E IDENTIFICAÇÃO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CÓDIGO (DOMINANTE) *</label>
                  <input
                    type="text"
                    value={codigoIgreja}
                    onChange={(e) => setCodigoIgreja(e.target.value.toUpperCase())}
                    placeholder="IGR-001"
                    className="w-full border rounded-xl p-2.5 font-black text-blue-900 uppercase bg-slate-50"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">RAZÃO SOCIAL *</label>
                  <input
                    type="text"
                    value={razaoSocial}
                    onChange={(e) => setRazaoSocial(e.target.value)}
                    placeholder="Ex: Igreja Evangélica Central Ltda"
                    className="w-full border rounded-xl p-2.5 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NOME FANTASIA</label>
                  <input
                    type="text"
                    value={nomeFantasia}
                    onChange={(e) => setNomeFantasia(e.target.value)}
                    placeholder="Ex: Igreja Central"
                    className="w-full border rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="w-full border rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">TELEFONE</label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(33) 99999-9999"
                    className="w-full border rounded-xl p-2.5"
                  />
                </div>
              </div>

              {/* LIDERANÇA E RESPONSÁVEIS */}
              <div className="border-t pt-3 space-y-2">
                <h4 className="font-bold text-slate-800 text-xs">👥 Responsáveis e Diretoria</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">PASTOR / RESPONSÁVEL</label>
                    <input
                      type="text"
                      value={nomeResponsavel}
                      onChange={(e) => setNomeResponsavel(e.target.value)}
                      placeholder="Nome do Pastor"
                      className="w-full border rounded-xl p-2.5"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">CPF RESPONSÁVEL</label>
                    <input
                      type="text"
                      value={cpfResponsavel}
                      onChange={(e) => setCpfResponsavel(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full border rounded-xl p-2.5"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">TESOUREIRO</label>
                    <input
                      type="text"
                      value={tesoureiroNome}
                      onChange={(e) => setTesoureiroNome(e.target.value)}
                      placeholder="Nome do Tesoureiro"
                      className="w-full border rounded-xl p-2.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">NOME DO CONTADOR</label>
                    <input
                      type="text"
                      value={nomeContador}
                      onChange={(e) => setNomeContador(e.target.value)}
                      placeholder="Nome da Contabilidade"
                      className="w-full border rounded-xl p-2.5"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">CRC CONTADOR</label>
                    <input
                      type="text"
                      value={crcContador}
                      onChange={(e) => setCrcContador(e.target.value)}
                      placeholder="CRC-MG 000000/O"
                      className="w-full border rounded-xl p-2.5"
                    />
                  </div>
                </div>
              </div>

              {/* ENDEREÇO DA IGREJA */}
              <div className="border-t pt-3 space-y-2">
                <h4 className="font-bold text-slate-800 text-xs">📍 Endereço da Igreja</h4>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">CEP</label>
                    <input
                      type="text"
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                      placeholder="39800-000"
                      className="w-full border rounded-xl p-2"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">LOGRADOURO / RUA</label>
                    <input
                      type="text"
                      value={logradouro}
                      onChange={(e) => setLogradouro(e.target.value)}
                      placeholder="Rua / Av."
                      className="w-full border rounded-xl p-2"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nº</label>
                    <input
                      type="text"
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                      placeholder="123"
                      className="w-full border rounded-xl p-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">BAIRRO</label>
                    <input
                      type="text"
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value)}
                      placeholder="Bairro"
                      className="w-full border rounded-xl p-2"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">CIDADE</label>
                    <input
                      type="text"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      placeholder="Teófilo Otoni"
                      className="w-full border rounded-xl p-2"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">UF</label>
                    <input
                      type="text"
                      value={uf}
                      onChange={(e) => setUf(e.target.value)}
                      placeholder="MG"
                      className="w-full border rounded-xl p-2 uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* REDES SOCIAIS E APP MOBILE */}
              <div className="border-t pt-3 space-y-2">
                <h4 className="font-bold text-blue-900 text-xs">📱 Integração com o App Mobile</h4>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">LINK DO INSTAGRAM OFICIAL</label>
                  <input
                    type="text"
                    value={linkInstagram}
                    onChange={(e) => setLinkInstagram(e.target.value)}
                    placeholder="https://instagram.com/suaigreja"
                    className="w-full border rounded-xl p-2.5 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="border-t pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setModalNovaIgreja(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow cursor-pointer"
                >
                  💾 Salvar Dados da Igreja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}