// src/AppMobileCadastro.tsx (Exemplo de um app mobile separado)
import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Conexão com o mesmo Supabase
const supabase = createClient('SUA_SUPABASE_URL', 'SUA_SUPABASE_ANON_KEY');

export default function AppMobileCadastro() {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');

  const handleCadastrarSe = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('members').insert([
      {
        codigo_igreja: 'IGR-001', // O código fixo da igreja ou via QR Code
        tipo_cadastro: 'Visitante',
        nome,
        celular_principal: telefone,
        email,
      },
    ]);

    if (error) {
      alert('Erro ao enviar cadastro: ' + error.message);
    } else {
      alert('Cadastro realizado com sucesso! Seja bem-vindo.');
      setNome('');
      setTelefone('');
      setEmail('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4">
        <h2 className="text-2xl font-black text-blue-900 text-center">Ficha de Inscrição</h2>
        <p className="text-xs text-slate-500 text-center">Preencha seus dados para participar da nossa comunidade.</p>

        <form onSubmit={handleCadastrarSe} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome Completo</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Telefone / WhatsApp</label>
            <input
              type="text"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-900 text-white font-bold py-3 rounded-xl shadow-md hover:bg-blue-800 transition"
          >
            Enviar Meu Cadastro
          </button>
        </form>
      </div>
    </div>
  );
}