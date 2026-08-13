import React, { useState } from 'react';
import { supabase } from './supabase';

export function MemberForm() {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Função para realizar o upload da foto e retornar a URL publica
  async function uploadPhoto(file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Envia a foto para o bucket 'membrosfotos'
      const { error: uploadError } = await supabase.storage
        .from('membrosfotos')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Erro no upload da foto:', uploadError.message);
        return null;
      }

      // 2. Pega a URL publica da foto enviada
      const { data } = supabase.storage
        .from('membrosfotos')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      console.error('Erro ao processar foto:', err);
      return null;
    }
  }

  // Função de salvamento do formulário
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    let fotoUrl = '';

    // Se o usuario selecionou uma foto, faz o upload primeiro
    if (photoFile) {
      const uploadedUrl = await uploadPhoto(photoFile);
      if (uploadedUrl) {
        fotoUrl = uploadedUrl;
      }
    }

    // Pega os dados do formulario e inclui a foto_url
    const formData = new FormData(e.currentTarget);
    const memberData = {
      nome: formData.get('nome') as string,
      tipo_cadastro: formData.get('tipo_cadastro') as string,
      cpf: formData.get('cpf') as string,
      sexo: formData.get('sexo') as string,
      nascimento: formData.get('nascimento') as string,
      email: formData.get('email') as string,
      celular_principal: formData.get('celular_principal') as string,
      foto_url: fotoUrl // Grava o link da foto no banco
    };

    // 3. Insere o membro na tabela 'members'
    const { error } = await supabase.from('members').insert([memberData]);

    setLoading(false);

    if (error) {
      alert(`Erro ao cadastrar: ${error.message}`);
    } else {
      alert('Membro cadastrado com sucesso!');
      // recarregar dados ou limpar formulario...
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Campo de Upload de Foto */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Foto do Membro</label>
        <input 
          type="file" 
          accept="image/*"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setPhotoFile(e.target.files[0]);
            }
          }}
        />
      </div>

      {/* Demais campos do seu formulario... */}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Cadastrando...' : 'Cadastrar Membro'}
      </button>
    </form>
  );
}