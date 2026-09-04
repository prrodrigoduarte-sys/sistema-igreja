// src/CadastroPublico.tsx
import React, { useState } from 'react';
import { supabase } from './supabase';

export default function CadastroPublico() {
  const [form, setForm] = useState({
    tipo_cadastro: 'Visitante',
    nome: '',
    cpf: '',
    rg: '',
    data_nascimento: '',
    estado_civil: 'Solteiro(a)',
    celular_principal: '',
    email: '',
    cep: '',
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    endereco: '',
    foto_url: '',
  });

  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const handleChange = (campo: string, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  // Manipulador para tirar foto com a câmera do celular ou escolher arquivo
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `membros/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('membros-fotos')
        .upload(filePath, file);

      if (uploadError) {
        // Fallback em Base64 caso o bucket não esteja configurado
        const reader = new FileReader();
        reader.onloadend = () => {
          setForm((prev) => ({ ...prev, foto_url: reader.result as string }));
          setUploadingFoto(false);
        };
        reader.readAsDataURL(file);
        return;
      }

      const { data: publicURLData } = supabase.storage
        .from('membros-fotos')
        .getPublicUrl(filePath);

      setForm((prev) => ({ ...prev, foto_url: publicURLData.publicUrl }));
    } catch (err) {
      console.error('Erro no upload:', err);
      alert('Erro ao carregar imagem.');
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...form,
        codigo_igreja: 'IGR-001', // Código padrão da igreja para cadastros externos
      };

      const { error } = await supabase.from('members').insert([payload]);

      if (error) throw error;

      setSucesso(true);
    } catch (err: any) {
      console.error('Erro ao enviar cadastro:', err);
      alert('Erro ao realizar cadastro: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          <h2 className="text-2xl font-black text-blue-900">Cadastro Realizado!</h2>
          <p className="text-slate-600 text-sm">Muito obrigado pelas informações. Seja muito bem-vindo à nossa comunidade!</p>
          <button
            onClick={() => {
              setSucesso(false);
              setForm({
                tipo_cadastro: 'Visitante',
                nome: '',
                cpf: '',
                rg: '',
                data_nascimento: '',
                estado_civil: 'Solteiro(a)',
                celular_principal: '',
                email: '',
                cep: '',
                rua: '',
                numero: '',
                bairro: '',
                cidade: '',
                estado: '',
                endereco: '',
                foto_url: '',
              });
            }}
            className="w-full bg-blue-900 text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition cursor-pointer"
          >
            Fazer Novo Cadastro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 py-10 px-4 flex items-center justify-center">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 sm:p-10 space-y-6">
        <div className="text-center border-b pb-4">
          <h2 className="text-2xl sm:text-3xl font-black text-blue-900">Ficha de Cadastro</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Preencha seus dados abaixo para registrar sua ficha.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Seção de Captura / Upload de Foto */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="w-20 h-20 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-slate-400 font-bold shrink-0 border shadow-inner">
              {form.foto_url ? (
                <img src={form.foto_url} alt="Foto" className="w-full h-full object-cover" />
              ) : (
                'Foto'
              )}
            </div>
            <div className="flex-1 w-full text-center sm:text-left">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tirar Foto ou Escolher Imagem</label>
              <input
                type="file"
                accept="image/*"
                capture="environment" // Abre a câmera traseira diretamente em celulares
                onChange={handleFileChange}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-900 file:text-white hover:file:bg-blue-800 cursor-pointer"
              />
              {uploadingFoto && <p className="text-xs text-blue-600 mt-1 font-semibold">Carregando imagem...</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Cadastro</label>
              <select
                value={form.tipo_cadastro}
                onChange={(e) => handleChange('tipo_cadastro', e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600 bg-white"
              >
                <option value="Visitante">Visitante</option>
                <option value="Congregado">Congregado</option>
                <option value="Membro">Membro</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome Completo *</label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                placeholder="Seu nome completo"
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Celular / WhatsApp *</label>
              <input
                type="text"
                value={form.celular_principal}
                onChange={(e) => handleChange('celular_principal', e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="seu@email.com"
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">CPF</label>
              <input
                type="text"
                value={form.cpf}
                onChange={(e) => handleChange('cpf', e.target.value)}
                placeholder="000.000.000-00"
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">RG</label>
              <input
                type="text"
                value={form.rg}
                onChange={(e) => handleChange('rg', e.target.value)}
                placeholder="Número do RG"
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Data de Nascimento</label>
              <input
                type="date"
                value={form.data_nascimento}
                onChange={(e) => handleChange('data_nascimento', e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Estado Civil</label>
              <select
                value={form.estado_civil}
                onChange={(e) => handleChange('estado_civil', e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600 bg-white"
              >
                <option value="Solteiro(a)">Solteiro(a)</option>
                <option value="Casado(a)">Casado(a)</option>
                <option value="Divorciado(a)">Divorciado(a)</option>
                <option value="Viúvo(a)">Viúvo(a)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">CEP</label>
              <input
                type="text"
                value={form.cep}
                onChange={(e) => handleChange('cep', e.target.value)}
                placeholder="00000-000"
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Número</label>
              <input
                type="text"
                value={form.numero}
                onChange={(e) => handleChange('numero', e.target.value)}
                placeholder="Número"
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Rua / Logradouro</label>
              <input
                type="text"
                value={form.rua}
                onChange={(e) => handleChange('rua', e.target.value)}
                placeholder="Nome da rua, avenida..."
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Bairro</label>
              <input
                type="text"
                value={form.bairro}
                onChange={(e) => handleChange('bairro', e.target.value)}
                placeholder="Bairro"
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cidade</label>
              <input
                type="text"
                value={form.cidade}
                onChange={(e) => handleChange('cidade', e.target.value)}
                placeholder="Cidade"
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Estado (UF)</label>
              <input
                type="text"
                value={form.estado}
                onChange={(e) => handleChange('estado', e.target.value)}
                placeholder="Ex: MG"
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Complemento / Observações de Endereço</label>
              <input
                type="text"
                value={form.endereco}
                onChange={(e) => handleChange('endereco', e.target.value)}
                placeholder="Apt, bloco, referência..."
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

          </div>

          <div className="pt-4 border-t">
            <button
              type="submit"
              disabled={loading || uploadingFoto}
              className="w-full bg-blue-900 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-blue-800 transition cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Enviando cadastro...' : 'Finalizar e Enviar Meu Cadastro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}