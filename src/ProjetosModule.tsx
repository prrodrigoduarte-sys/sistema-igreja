// src/ProjetosModule.tsx
// Versão mínima para garantir que o aplicativo inicie sem erros.

import React from 'react';

interface ProjetosModuleProps {
  loggedUser: any; // Mantemos o loggedUser, pois ele é passado do App.tsx
}

export default function ProjetosModule({ loggedUser }: ProjetosModuleProps) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 max-w-5xl mx-auto">
      <h2 className="text-3xl font-black text-blue-900 tracking-tight">Módulo de Projetos (temporário)</h2>
      <p>Este é um placeholder para o módulo de Projetos. O aplicativo está funcionando!</p>
      <p>Usuário logado: {loggedUser?.email || 'Não disponível'}</p>
      <p>Quando o menu estiver pronto, voltaremos para o conteúdo completo deste módulo.</p>
    </div>
  );
}