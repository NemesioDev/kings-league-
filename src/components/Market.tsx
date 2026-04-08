import { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Player {
  id: number;
  nome: string;
  posicao: string;
  pontogeral: number;
  preco: number;
  time: string;
}

interface MarketProps {
  token: string;
  onUpdateBalance: (newBalance: number) => void;
}

export default function Market({ onUpdateBalance }: MarketProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<number | null>(null);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('jogadores')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      setPlayers(data || []);
    } catch (err) {
      console.error('Erro ao buscar jogadores:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = players.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.time.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBuy = async (player: Player) => {
    setBuyingId(player.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // 1. Get profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('saldo')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (profile.saldo < player.preco) throw new Error('Saldo insuficiente');

      // 2. Check if already in team
      const { data: existing } = await supabase
        .from('escalacoes')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('jogador_id', player.id)
        .single();

      if (existing) throw new Error('Jogador já está no seu time');

      // 3. Insert into escalacoes
      const { error: insertError } = await supabase
        .from('escalacoes')
        .insert([{ usuario_id: user.id, jogador_id: player.id }]);

      if (insertError) throw insertError;

      // 4. Update balance
      const novoSaldo = profile.saldo - player.preco;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ saldo: novoSaldo })
        .eq('id', user.id);

      if (updateError) throw updateError;

      onUpdateBalance(novoSaldo);
      alert(`${player.nome} escalado com sucesso!`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-display uppercase tracking-tight">Mercado</h1>
          <p className="text-muted font-mono text-[10px] uppercase tracking-widest mt-1">Contrate os melhores para seu time</p>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input 
            type="text" 
            placeholder="BUSCAR JOGADOR..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-12 font-mono text-[10px] uppercase tracking-widest"
          />
        </div>
      </div>

      <div className="card border-white/5 p-0 overflow-hidden">
        <div className="grid grid-cols-6 px-8 py-5 bg-white/5">
          <span className="col-header">Jogador</span>
          <span className="col-header">Posição</span>
          <span className="col-header">Time</span>
          <span className="col-header">Pontos</span>
          <span className="col-header">Preço</span>
          <span className="col-header text-right">Ação</span>
        </div>
        
        {loading ? (
          <div className="p-24 text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent animate-pulse">Scanning_Market...</div>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredPlayers.map((player: Player) => (
              <div key={player.id} className="grid grid-cols-6 px-8 py-6 items-center hover:bg-white/[0.02] transition-all group">
                <div className="flex flex-col">
                  <span className="font-bold text-sm group-hover:text-accent transition-colors">{player.nome}</span>
                  <span className="text-[10px] font-mono text-muted uppercase tracking-tighter">ID: {player.id.toString().padStart(4, '0')}</span>
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
                    onClick={() => handleBuy(player)}
                    disabled={buyingId === player.id}
                    className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all ${buyingId === player.id ? 'bg-white/5 border-white/10 cursor-not-allowed' : 'border-white/10 hover:border-accent hover:bg-accent hover:text-black hover:shadow-[0_0_15px_rgba(242,125,38,0.3)]'}`}
                  >
                    {buyingId === player.id ? <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div> : <Plus className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
