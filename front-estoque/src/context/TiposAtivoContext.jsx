// TiposAtivoContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { POSTGREST_URL } from '../config.js';

const TiposAtivoContext = createContext(null);

export const GRUPO_COR = {
  PROTECAO_CHAVEAMENTO:    { bg: 'rgba(249,115,22,.15)',  color: '#f97316', label: 'Proteção e Chaveamento' },
  CONTATORES:              { bg: 'rgba(236,72,153,.15)',  color: '#ec4899', label: 'Contatores' },
  CONDUTORES:              { bg: 'rgba(234,179,8,.15)',   color: '#ca8a04', label: 'Condutores' },
  DISPOSITIVOS_PARTIDA:    { bg: 'rgba(16,185,129,.15)',  color: '#10b981', label: 'Dispositivos de Partida' },
  PAINEL_AUTOMACAO:        { bg: 'rgba(139,92,246,.15)',  color: '#8b5cf6', label: 'Painéis e Automação' },
  ACESSORIOS:              { bg: 'rgba(118, 60, 139, 0.15)', color: '#d86beeff', label: 'Acessórios' },
  INFRAESTRUTURA_FERRAGEM: { bg: 'rgba(73, 73, 73, 0.31)', color: 'rgba(199, 199, 199, 1)', label: 'Infraestrutura e Ferragem' },
  TRANSFORMADORES:         { bg: 'rgba(6,182,212,.15)',   color: '#06b6d4', label: 'Transformadores' },
};

export function TiposAtivoProvider({ children }) {
  const [ativosPorGrupo, setAtivosPorGrupo] = useState({});
  const [labelAtivo, setLabelAtivo] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${POSTGREST_URL}/tipos_ativo?select=grupo_funcional,tipo_ativo`)
      .then(res => res.json())
      .then(data => {
        const mapaGrupos = {};
        const mapaLabels = {};

        data.forEach(item => {
          if (!mapaGrupos[item.grupo_funcional]) {
            mapaGrupos[item.grupo_funcional] = [];
          }
          // Formata tipo_ativo: MINI_DISJUNTOR -> Mini Disjuntor
          const label = item.tipo_ativo
            .replace(/_/g, ' ')
            .toLowerCase()
            .replace(/\b\w/g, c => c.toUpperCase());
          mapaGrupos[item.grupo_funcional].push({ value: item.tipo_ativo, label });
          mapaLabels[item.tipo_ativo] = label;
        });

        setAtivosPorGrupo(mapaGrupos);
        setLabelAtivo(mapaLabels);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao buscar tipos_ativo", err);
        setLoading(false);
      });
  }, []);

  return (
    <TiposAtivoContext.Provider value={{ ATIVOS_POR_GRUPO: ativosPorGrupo, LABEL_ATIVO: labelAtivo, GRUPO_COR, loading }}>
      {children}
    </TiposAtivoContext.Provider>
  );
}

export function useTiposAtivo() {
  const ctx = useContext(TiposAtivoContext);
  if (!ctx) throw new Error('useTiposAtivo deve ser usado dentro de TiposAtivoProvider');
  return ctx;
}
