import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

interface Membro {
  id?: string;
  tipo_cadastro: string;
  nome_completo: string;
  cpf: string;
  sexo: string;
  data_nascimento: string;
  identificacao: string;
  nacionalidade: string;
  naturalidade_cidade: string;
  email: string;
  foto_url: string;
  escolaridade: string;
  profissao: string;
  empresa: string;
  nome_contato: string;
  celular_principal_sms: string;
  celular_secundario: string;
  telefone_fixo: string;
}

export default function App() {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [fotoPreview, setFotoPreview] = useState<string>('');
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    tipo_cadastro: '',
    nome_completo: '',
    cpf: '',
    sexo: '',
    data_nascimento: '',
    identificacao: '',
    nacionalidade: 'Brasileira',
    naturalidade_cidade: '',
    email: '',
    escolaridade: '',
    profissao: '',
    empresa: '',
    nome_contato: '',
    celular_principal_sms: '',
    celular_secundario: '',
    telefone_fixo: ''
  });

  useEffect(() => {
    carregarMembros();
  }, []);

  const carregarMembros = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('membros')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setMembros(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const abrirCamera = async () => {
    try {
      setCameraAtiva(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('Para usar a câmera no computador, abra a página em uma nova aba.');
      setCameraAtiva(false);
    }
  };

  const capturarFoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        setFotoPreview(canvas.toDataURL('image/png'));
      }
      fecharCamera();
    }
  };

  const fecharCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setCameraAtiva(false);
  };

  const handleUploadArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const maskCPF = (val: string) => val.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
  const maskPhone = (val: string) => {
    let raw = val.replace(/\D/g, '').slice(0, 11);
    return raw.length <= 10 
      ? raw.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
      : raw.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let formatted = value;
    if (name === 'cpf') formatted = maskCPF(value);
    if (['celular_principal_sms', 'celular_secundario', 'telefone_fixo'].includes(name)) formatted = maskPhone(value);
    setForm({ ...form, [name]: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supabase) {
      alert('Coloque sua chave anon public no arquivo src/supabase.ts para conectar ao banco!');
      return;
    }

    setLoading(true);
    const novoMembro = { ...form, foto_url: fotoPreview };

    const { error } = await supabase.from('membros').insert([novoMembro]);

    if (error) {
      alert('Erro ao cadastrar: ' + error.message);
    } else {
      alert('Membro cadastrado com sucesso no Supabase!');
      setFotoPreview('');
      setForm({
        tipo_cadastro: '', nome_completo: '', cpf: '', sexo: '', data_nascimento: '', identificacao: '',
        nacionalidade: 'Brasileira', naturalidade_cidade: '', email: '', escolaridade: '',
        profissao: '', empresa: '', nome_contato: '', celular_principal_sms: '', celular_secundario: '', telefone_fixo: ''
      });
      carregarMembros();
    }
    setLoading(false);
  };

  const membrosFiltrados = membros.filter((m) =>
    m.nome_completo?.toLowerCase().includes(busca.toLowerCase()) || m.cpf?.includes(busca)
  );

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="py-3 px-6 text-center border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-bold text-indigo-700">Dados Pessoais</h2>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo Cadastro *</label>
                  <select name="tipo_cadastro" value={form.tipo_cadastro} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white">
                    <option value="">Selecione...</option>
                    <option value="Membro">Membro</option>
                    <option value="Congregado">Congregado</option>
                    <option value="Visitante">Visitante</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nome completo *</label>
                  <input type="text" name="nome_completo" value={form.nome_completo} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">CPF</label>
                  <input type="text" name="cpf" value={form.cpf} onChange={handleChange} placeholder="000.000.000-00" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sexo *</label>
                  <select name="sexo" value={form.sexo} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white">
                    <option value="">Selecione...</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nascimento *</label>
                  <input type="date" name="data_nascimento" value={form.data_nascimento} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Identificação</label>
                  <input type="text" name="identificacao" value={form.identificacao} onChange={handleChange} placeholder="RG / RGM" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nacionalidade</label>
                  <input type="text" name="nacionalidade" value={form.nacionalidade} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Naturalidade - Cidade</label>
                  <input type="text" name="naturalidade_cidade" value={form.naturalidade_cidade} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleUploadArquivo} className="hidden" />

                <div className="flex gap-3 items-center">
                  <button type="button" onClick={abrirCamera} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-md transition">
                    📷 Tirar Foto
                  </button>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-md transition">
                    📁 Adicionar Imagem
                  </button>

                  {fotoPreview && (
                    <div className="flex items-center gap-2 border border-slate-200 p-1 rounded-md bg-slate-50">
                      <img src={fotoPreview} alt="Preview" className="w-10 h-10 object-cover rounded-md" />
                      <button type="button" onClick={() => setFotoPreview('')} className="text-xs text-red-600 hover:underline">Remover</button>
                    </div>
                  )}
                </div>

                {cameraAtiva && (
                  <div className="border border-slate-300 p-3 rounded-lg bg-slate-900 text-white max-w-sm space-y-2">
                    <video ref={videoRef} autoPlay className="w-full rounded-md bg-black h-48 object-cover"></video>
                    <div className="flex justify-between">
                      <button type="button" onClick={capturarFoto} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 text-xs rounded-md font-semibold">Capturar Foto</button>
                      <button type="button" onClick={fecharCamera} className="bg-red-600 hover:bg-red-700 px-3 py-1 text-xs rounded-md font-semibold">Cancelar</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Escolaridade</label>
                  <select name="escolaridade" value={form.escolaridade} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white">
                    <option value="">Selecione...</option>
                    <option value="Ensino Fundamental">Ensino Fundamental</option>
                    <option value="Ensino Médio">Ensino Médio</option>
                    <option value="Ensino Superior">Ensino Superior</option>
                    <option value="Pós-Graduação">Pós-Graduação</option>
                  </select>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-slate-600">Profissão</label>
                    <button type="button" onClick={() => setForm({ ...form, profissao: '' })} className="text-[10px] text-indigo-600 underline">Limpar</button>
                  </div>
                  <input type="text" name="profissao" value={form.profissao} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Empresa</label>
                  <input type="text" name="empresa" value={form.empresa} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="py-3 px-6 text-center border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-bold text-indigo-700">Contatos</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nome Contato</label>
                  <input type="text" name="nome_contato" value={form.nome_contato} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Celular Principal SMS</label>
                  <input type="text" name="celular_principal_sms" value={form.celular_principal_sms} onChange={handleChange} placeholder="(00) 00000-0000" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Celular secundário</label>
                  <input type="text" name="celular_secundario" value={form.celular_secundario} onChange={handleChange} placeholder="(00) 00000-0000" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Telefone Fixo</label>
                  <input type="text" name="telefone_fixo" value={form.telefone_fixo} onChange={handleChange} placeholder="(00) 0000-0000" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-lg shadow-md text-sm disabled:opacity-50">
              {loading ? 'Salvando...' : 'Cadastrar Membro'}
            </button>
          </div>
        </form>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">Membros Cadastrados ({membros.length})</h3>
            <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou CPF..." className="px-3 py-1.5 border border-slate-300 rounded-md text-sm w-64" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="p-3">Foto</th>
                  <th className="p-3">Nome</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">CPF</th>
                  <th className="p-3">Celular</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {membrosFiltrados.length === 0 ? (
                  <tr><td colSpan={5} className="p-4 text-center text-slate-400">Nenhum membro cadastrado até o momento.</td></tr>
                ) : (
                  membrosFiltrados.map((m, idx) => (
                    <tr key={m.id || idx} className="hover:bg-slate-50">
                      <td className="p-3">
                        {m.foto_url ? (
                          <img src={m.foto_url} alt="Foto" className="w-8 h-8 rounded-full object-cover border" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                            {m.nome_completo?.charAt(0)}
                          </div>
                        )}
                      </td>
                      <td className="p-3 font-semibold text-slate-800">{m.nome_completo}</td>
                      <td className="p-3"><span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-semibold">{m.tipo_cadastro}</span></td>
                      <td className="p-3 text-slate-600">{m.cpf || '-'}</td>
                      <td className="p-3 text-slate-600">{m.celular_principal_sms || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}