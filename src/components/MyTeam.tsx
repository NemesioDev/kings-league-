import { useState, useEffect } from 'react';
import { Trash2, Shield, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Player {
  id: number;
  nome: string;
  posicao: string;
  pontogeral: number;
  preco: number;
  time: string;
}

interface MyTeamProps {
  user: any;
  token: string;
  onUpdateBalance: (newBalance: number) => void;
}

export default function MyTeam({ user, onUpdateBalance }: MyTeamProps) {
  const [team, setTeam] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeam = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data, error } = await supabase
        .from('escalacoes')
        .select(`
          jogador_id,
          jogadores (*)
        `)
        .eq('usuario_id', authUser.id);

      if (error) throw error;
      
      const players = data.map((item: any) => item.jogadores);
      setTeam(players);
    } catch (err: any) {
      console.error('Erro ao buscar time:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleSell = async (player: Player) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Usuário não autenticado');

      // 1. Delete from escalacoes
      const { error: deleteError } = await supabase
        .from('escalacoes')
        .delete()
        .eq('usuario_id', authUser.id)
        .eq('jogador_id', player.id);

      if (deleteError) throw deleteError;

      // 2. Update balance
      const novoSaldo = user.saldo + player.preco;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ saldo: novoSaldo })
        .eq('id', authUser.id);

      if (updateError) throw updateError;

      setTeam(team.filter((p: Player) => p.id !== player.id));
      onUpdateBalance(novoSaldo);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-12 text-center font-mono text-xs uppercase animate-pulse">Carregando seu time...</div>;

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-display uppercase tracking-tight">Meu Time</h1>
          <p className="text-muted font-mono text-[10px] uppercase tracking-widest mt-1">Sua escalação para a próxima rodada</p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
          <Shield className="w-4 h-4 text-accent" />
          <span className="font-mono text-[10px] uppercase tracking-widest">{team.length} / 11 JOGADORES</span>
        </div>
      </div>

      {team.length === 0 ? (
        <div className="card border-dashed border-white/10 bg-white/[0.02] flex flex-col items-center justify-center py-32">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Info className="w-8 h-8 text-muted opacity-20" />
          </div>
          <p className="font-display text-xl uppercase tracking-tight text-muted">Time Vazio</p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted/50 mt-2">Vá ao mercado para começar a montar seu time.</p>
        </div>
      ) : (
        <div className="card border-white/5 p-0 overflow-hidden">
          <div className="grid grid-cols-6 px-8 py-5 bg-white/5">
            <span className="col-header">Jogador</span>
            <span className="col-header">Posição</span>
            <span className="col-header">Time</span>
            <span className="col-header">Pontos</span>
            <span className="col-header">Valor</span>
            <span className="col-header text-right">Ação</span>
          </div>
          <div className="divide-y divide-white/5">
            {team.map((player: Player) => (
              <div key={player.id} className="grid grid-cols-6 px-8 py-6 items-center hover:bg-white/[0.02] transition-all group">
                <div className="flex flex-col">
                  <span className="font-bold text-sm group-hover:text-accent transition-colors">{player.nome}</span>
                  <span className="text-[10px] font-mono text-muted uppercase">{player.time}</span>
                </div>
                <div>
                  <span className="px-2 py-1 bg-white/5 border border-white/10 rounded font-mono text-[10px] font-bold text-accent">
                    {player.posicao}
                  </span>
                </div>
                <span className="font-mono text-xs uppercase text-muted">{player.time}</span>
                <span className="font-mono text-sm font-bold">{(player.pontogeral || 0).toFixed(2)}</span>
                <span className="font-display text-lg text-accent">C$ {(player.preco || 0).toFixed(2)}</span>
                <div className="text-right">
                  <button 
                    onClick={() => handleSell(player)}
                    className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center text-red-500/50 hover:text-red-500 hover:border-red-500 hover:bg-red-500/10 transition-all"
                    title="Vender Jogador"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="stat-card">
          <span className="col-header mb-4 block">Pontuação Acumulada</span>
          <div className="text-5xl font-display tracking-tighter">{(user.pontuacao_total || 0).toFixed(2)}</div>
          <p className="text-[9px] font-mono text-muted uppercase mt-4 tracking-widest">Soma de todas as rodadas</p>
        </div>
        <div className="stat-card">
          <span className="col-header mb-4 block">Valor do Elenco</span>
          <div className="text-5xl font-display tracking-tighter text-accent">C$ {(team.reduce((acc, p) => acc + (p.preco || 0), 0) || 0).toFixed(2)}</div>
          <p className="text-[9px] font-mono text-muted uppercase mt-4 tracking-widest">Investimento total em jogadores</p>
        </div>
      </div>
    </div>
  );
}
