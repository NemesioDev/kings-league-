import { TrendingUp, Users, Star, Loader2, Play } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  user: any;
  onRefreshUser: () => void;
}

export default function Dashboard({ user, onRefreshUser }: DashboardProps) {
  const [highlights, setHighlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  const fetchHighlights = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jogadores')
        .select('*')
        .order('pontogeral', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      setHighlights(data || []);
    } catch (err) {
      console.error('Erro ao buscar destaques:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHighlights();
  }, []);

  const handleSimulateRound = async () => {
    setSimulating(true);
    try {
      // In a real app, this should be a server-side function.
      // For now, we'll simulate locally by updating players and then users.
      
      // 1. Get all players
      const { data: players, error: pError } = await supabase.from('jogadores').select('*');
      if (pError) throw pError;

      // 2. Update each player with a random score
      const updates = players.map((p: any) => {
        const roundPoints = (Math.random() * 15) - 2; // -2 to 13 points
        return supabase
          .from('jogadores')
          .update({ 
            pontogeral: p.pontogeral + roundPoints,
            preco: Math.max(1, p.preco + (roundPoints * 0.5))
          })
          .eq('id', p.id);
      });
      await Promise.all(updates);

      // 3. Update users' total scores based on their lineups
      // This is complex to do client-side for all users.
      // We'll just update the current user for now.
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: lineup } = await supabase
          .from('escalacoes')
          .select('jogadores(pontogeral)')
          .eq('usuario_id', authUser.id);
        
        if (lineup) {
          const totalPoints = lineup.reduce((acc: number, item: any) => acc + (item.jogadores?.pontogeral || 0), 0);
          await supabase
            .from('profiles')
            .update({ pontuacao_total: totalPoints })
            .eq('id', authUser.id);
        }
      }

      alert('Rodada simulada com sucesso!');
      fetchHighlights();
      onRefreshUser();
    } catch (error) {
      console.error('Erro ao simular rodada:', error);
      alert('Erro ao simular rodada.');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-display uppercase tracking-tight">Visão Geral</h1>
          <p className="text-muted font-mono text-[10px] uppercase tracking-widest mt-1">Estatísticas e destaques da liga</p>
        </div>
        <button 
          onClick={handleSimulateRound}
          disabled={simulating}
          className="btn-primary flex items-center gap-3 shadow-[0_0_30px_rgba(242,125,38,0.15)]"
        >
          {simulating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
          Simular Rodada
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card group">
          <div className="flex justify-between items-start mb-6">
            <span className="col-header">Pontuação Total</span>
            <TrendingUp className="w-4 h-4 text-accent opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-5xl font-display tracking-tighter">{(user.pontuacao_total || 0).toFixed(2)}</div>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-accent w-2/3"></div>
            </div>
            <span className="text-[9px] font-mono text-muted uppercase">Rank #12</span>
          </div>
        </div>

        <div className="stat-card group">
          <div className="flex justify-between items-start mb-6">
            <span className="col-header">Patrimônio</span>
            <Users className="w-4 h-4 text-accent opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-5xl font-display tracking-tighter text-accent">C$ {(user.saldo || 0).toFixed(2)}</div>
          <div className="mt-4 text-[9px] uppercase font-mono text-accent/60 tracking-wider">Disponível para mercado</div>
        </div>

        <div className="stat-card group">
          <div className="flex justify-between items-start mb-6">
            <span className="col-header">Status da Liga</span>
            <Star className="w-4 h-4 text-accent opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-5xl font-display tracking-tighter">ATIVO</div>
          <div className="mt-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[9px] uppercase font-mono text-muted tracking-wider">Pronto para rodada</span>
          </div>
        </div>
      </div>

      <div className="card border-white/5">
        <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
          <h2 className="text-xl font-display uppercase tracking-tight">Destaques da Rodada</h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-accent rounded-full"></div>
            <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Top Performers</span>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-accent opacity-20" />
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-white/5">
            <div className="grid grid-cols-4 px-6 py-4 bg-white/5">
              <span className="col-header">Jogador</span>
              <span className="col-header">Time</span>
              <span className="col-header">Pontos</span>
              <span className="col-header">Preço</span>
            </div>
            {highlights.length > 0 ? (
              highlights.map((player, i) => (
                <div key={i} className="grid grid-cols-4 px-6 py-5 border-t border-white/5 items-center hover:bg-white/[0.02] transition-colors group">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm group-hover:text-accent transition-colors">{player.nome}</span>
                    <span className="text-[10px] font-mono text-muted uppercase">{player.posicao}</span>
                  </div>
                  <span className="font-mono text-xs text-muted uppercase">{player.time}</span>
                  <span className="font-mono text-sm font-bold text-accent">{(player.pontogeral || 0).toFixed(2)}</span>
                  <span className="font-mono text-xs">C$ {(player.preco || 0).toFixed(2)}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-12 font-mono text-[10px] uppercase text-muted tracking-widest">Nenhum destaque disponível no momento.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
