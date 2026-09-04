// src/CadastroPublico.tsx
import React, { useState } from 'react';
import { supabase } from './supabase';

export default function CadastroPublico() {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('members').insert([
        {
          codigo_igreja: 'IGR-001', // Código fixo da igreja ou dinâmico pela URL
          tipo_cadastro: 'Visitante',
          nome,
          celular_principal: telefone,
          email,
        },
      ]);

      if (error) throw error;

      setSucesso(true);
    } catch (err: any) {
      alert('Erro ao realizar cadastro: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          <h2 className="text-2xl font-black text-blue-900">Cadastro Realizado!</h2>
          <p className="text-slate-600 text-sm">Muito obrigado por se cadastrar. Seja muito bem-vindo à nossa comunidade!</p>
          <button
            onClick={() => { setSucesso(false); setNome(''); setTelefone(''); setEmail(''); }}
            className="w-full bg-blue-900 text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition cursor-pointer"
          >
            Cadastrar Outra Pessoa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-black text-blue-900">Seja Bem-Vindo!</h2>
          <p className="text-xs text-slate-500 mt-1">Preencha seus dados para fazer parte da nossa igreja.</p>
        </div>

        <form onSubmit={handleCadastrar} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome Completo *</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Telefone / WhatsApp *</label>
            <input
              type="text"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(00) 00000-0000"
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-900 text-white font-bold py-3 rounded-xl shadow-md hover:bg-blue-800 transition cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? 'Enviando...' : 'Enviar Meu Cadastro'}
          </button>
        </form>
      </div>
    </div>
  );
}