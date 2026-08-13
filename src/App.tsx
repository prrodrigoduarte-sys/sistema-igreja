import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

export default function App() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para foto e câmera
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [useCamera, setUseCamera] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Formulário
  const [formData, setFormData] = useState({
    tipo_cadastro: '',
    nome: '',
    cpf: '',
    sexo: '',
    nascimento: '',
    identificacao: '',
    nacionalidade: 'Brasileira',
    naturalidade: '',
    email: '',
    escolaridade: '',
    profissao: '',
    empresa: '',
    nome_contato: '',
    celular_principal: '',
    celular_secundario: '',
    telefone_fixo: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- CÂMERA ---
  const startCamera = async () => {
    setUseCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('Não foi possível acessar a câmera.');
      setUseCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 300;
      canvas.height = video.videoHeight || 300;

      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setPhotoPreview(dataUrl);

        fetch(dataUrl)
          .then((res) => res.blob())
          .then((blob) => {
            const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
            setPhotoFile(file);
          });
      }
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setUseCamera(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Upload para o bucket 'membrosfotos'
  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('membrosfotos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('membrosfotos')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (err: any) {
      console.error('Erro no upload da foto:', err.message);
      return null;
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let fotoUrl = '';
      if (photoFile) {
        const uploadedUrl = await uploadPhoto(photoFile);
        if (uploadedUrl) {
          fotoUrl = uploadedUrl;
        }
      }

      const payload = {
        ...formData,
        foto_url: fotoUrl
      };

      const { error } = await supabase.from('members').insert([payload]);
      if (error) throw error;

      alert('Membro cadastrado com sucesso!');
      
      // Limpa formulário e fotos
      setFormData({
        tipo_cadastro: '',
        nome: '',
        cpf: '',
        sexo: '',
        nascimento: '',
        identificacao: '',
        nacionalidade: 'Brasileira',
        naturalidade: '',
        email: '',
        escolaridade: '',
        profissao: '',
        empresa: '',
        nome_contato: '',
        celular_principal: '',
        celular_secundario: '',
        telefone_fixo: ''
      });
      setPhotoFile(null);
      setPhotoPreview(null);
      
      fetchMembers();
    } catch (err: any) {
      alert('Erro ao cadastrar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase.from('members').select('*');
      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const filteredMembers = members.filter(
    (m) =>
      m.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.cpf?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Formulário de Cadastro */}
        <form onSubmit={handleRegister} className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
          <h2 className="text-2xl font-bold text-slate-800 border-b pb-3">Dados Pessoais</h2>
          
          {/* PAINEL DE FOTO / CÂMERA */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex flex-col sm:flex-row items-center gap-6">
            <div className="w-28 h-28 rounded-full border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden relative flex-shrink-0">
              {useCamera ? (
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              ) : photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-slate-400 font-medium text-center px-2">Sem foto</span>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="space-y-2 text-center sm:text-left">
              <h3 className="text-sm font-semibold text-slate-700">Foto do Membro</h3>
              <p className="text-xs text-slate-500">Escolha uma foto do dispositivo ou tire usando a câmera.</p>
              
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
                {!useCamera ? (
                  <>
                    <label className="cursor-pointer bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors">
                      Inspecionar / Arquivo
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                    >
                      Tirar Foto
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                    >
                      Capturar Foto
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo Cadastro *</label>
              <select name="tipo_cadastro" value={formData.tipo_cadastro} onChange={handleChange} required className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500">
                <option value="">Selecione...</option>
                <option value="Membro">Membro</option>
                <option value="Visitante">Visitante</option>
                <option value="Congregado">Congregado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome completo *</label>
              <input type="text" name="nome" value={formData.nome} onChange={handleChange} required className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
              <input type="text" name="cpf" placeholder="000.000.000-00" value={formData.cpf} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sexo *</label>
              <select name="sexo" value={formData.sexo} onChange={handleChange} required className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500">
                <option value="">Selecione...</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nascimento *</label>
              <input type="date" name="nascimento" value={formData.nascimento} onChange={handleChange} required className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Identificação</label>
              <input type="text" name="identificacao" placeholder="RG / RGM" value={formData.identificacao} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nacionalidade</label>
              <input type="text" name="nacionalidade" value={formData.nacionalidade} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Naturalidade - Cidade</label>
              <input type="text" name="naturalidade" value={formData.naturalidade} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Escolaridade</label>
              <select name="escolaridade" value={formData.escolaridade} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500">
                <option value="">Selecione...</option>
                <option value="Fundamental">Ensino Fundamental</option>
                <option value="Médio">Ensino Médio</option>
                <option value="Superior">Ensino Superior</option>
                <option value="Pós-Graduação">Pós-Graduação</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Profissão</label>
              <input type="text" name="profissao" value={formData.profissao} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Empresa</label>
              <input type="text" name="empresa" value={formData.empresa} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 border-b pb-3 pt-4">Contatos</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome Contato</label>
              <input type="text" name="nome_contato" value={formData.nome_contato} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Celular Principal SMS</label>
              <input type="text" name="celular_principal" placeholder="(00) 00000-0000" value={formData.celular_principal} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Celular secundário</label>
              <input type="text" name="celular_secundario" placeholder="(00) 00000-0000" value={formData.celular_secundario} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefone Fixo</label>
              <input type="text" name="telefone_fixo" placeholder="(00) 0000-0000" value={formData.telefone_fixo} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Cadastrando...' : 'Cadastrar Membro'}
            </button>
          </div>
        </form>

        {/* Tabela de Membros Cadastrados */}
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <h2 className="text-2xl font-bold text-slate-800">
              Membros Cadastrados ({filteredMembers.length})
            </h2>
            <input
              type="text"
              placeholder="Buscar por nome ou CPF"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 text-sm font-semibold">
                  <th className="py-3 px-4">Nome</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">CPF</th>
                  <th className="py-3 px-4">Celular</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-900">{m.nome}</td>
                      <td className="py-3 px-4">{m.tipo_cadastro}</td>
                      <td className="py-3 px-4">{m.cpf || '-'}</td>
                      <td className="py-3 px-4">{m.celular_principal || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      Nenhum membro cadastrado até o momento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}