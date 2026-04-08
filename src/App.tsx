import { useState, useEffect } from 'react';
import { Trophy, ShoppingCart, LayoutDashboard, Users, Wallet, LogOut, Shield } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Market from './components/Market';
import MyTeam from './components/MyTeam';
import Auth from './components/Auth';
import Admin from './components/Admin';
import { supabase } from './lib/supabase';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'market' | 'myteam' | 'admin'>('dashboard');
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      if (session) {
        setToken(session.access_token);
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session) {
        setToken(session.access_token);
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setToken(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUser(data);
    } catch (err) {
      console.error('Erro ao buscar perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData: any, userToken: string) => {
    setUser(userData);
    setToken(userToken);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setToken(null);
  };

  const updateBalance = (newBalance: number) => {
    setUser((prev: any) => ({ ...prev, saldo: newBalance }));
  };

  const refreshUser = () => {
    if (user?.id) {
      fetchProfile(user.id);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent animate-pulse">Initializing_System...</div>
    </div>
  );

  if (!supabase) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6 text-center">
      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/50">
        <Shield className="w-8 h-8 text-red-500" />
      </div>
      <h1 className="text-2xl font-display uppercase tracking-tight mb-2">Configuração Incompleta</h1>
      <p className="text-muted font-mono text-xs uppercase tracking-widest max-w-md mb-8">
        As credenciais do Supabase não foram encontradas. Por favor, configure as variáveis de ambiente no menu Settings.
      </p>
      <div className="bg-white/5 p-6 rounded-xl border border-white/10 font-mono text-[10px] text-left space-y-2">
        <p className="text-accent"># Variáveis necessárias no menu Settings:</p>
        <p className="text-white/40 italic"># (No Vite, o prefixo VITE_ é obrigatório)</p>
        <p>VITE_SUPABASE_URL=seu_url_aqui</p>
        <p>VITE_SUPABASE_ANON_KEY=sua_chave_aqui</p>
      </div>
    </div>
  );

  if (!user) return <Auth onLogin={handleLogin} />;

  return (
    <div className="min-h-screen flex flex-col bg-black text-white selection:bg-accent selection:text-black">
      {/* Header */}
      <header className="border-b border-white/5 p-6 flex justify-between items-center bg-surface/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(242,125,38,0.3)]">
            <Trophy className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-display uppercase tracking-tight leading-none">Kings League</h1>
            <span className="text-[10px] font-mono text-accent uppercase tracking-widest">Season 2026</span>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end">
            <span className="font-mono text-[9px] uppercase text-muted tracking-wider">Manager: {user.nome}</span>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                <Wallet className="w-3 h-3 text-accent" />
                <span className="font-mono font-bold text-xs">C$ {(user.saldo || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-500 transition-all" title="Sair">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <nav className="w-72 border-r border-white/5 p-8 space-y-2 bg-surface/20">
          <div className="pb-4 mb-4 border-b border-white/5">
            <span className="text-[10px] font-mono text-muted uppercase tracking-[0.2em]">Navigation</span>
          </div>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-4 p-4 rounded-xl font-mono text-[11px] uppercase tracking-widest transition-all group ${activeTab === 'dashboard' ? 'bg-accent text-black font-bold shadow-[0_0_20px_rgba(242,125,38,0.2)]' : 'text-muted hover:text-white hover:bg-white/5'}`}
          >
            <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-black' : 'group-hover:text-accent'}`} />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('market')}
            className={`w-full flex items-center gap-4 p-4 rounded-xl font-mono text-[11px] uppercase tracking-widest transition-all group ${activeTab === 'market' ? 'bg-accent text-black font-bold shadow-[0_0_20px_rgba(242,125,38,0.2)]' : 'text-muted hover:text-white hover:bg-white/5'}`}
          >
            <ShoppingCart className={`w-4 h-4 ${activeTab === 'market' ? 'text-black' : 'group-hover:text-accent'}`} />
            Mercado
          </button>
          <button 
            onClick={() => setActiveTab('myteam')}
            className={`w-full flex items-center gap-4 p-4 rounded-xl font-mono text-[11px] uppercase tracking-widest transition-all group ${activeTab === 'myteam' ? 'bg-accent text-black font-bold shadow-[0_0_20px_rgba(242,125,38,0.2)]' : 'text-muted hover:text-white hover:bg-white/5'}`}
          >
            <Users className={`w-4 h-4 ${activeTab === 'myteam' ? 'text-black' : 'group-hover:text-accent'}`} />
            Meu Time
          </button>

          {user.role === 'admin' && (
            <button 
              onClick={() => setActiveTab('admin')}
              className={`w-full flex items-center gap-4 p-4 rounded-xl font-mono text-[11px] uppercase tracking-widest transition-all group ${activeTab === 'admin' ? 'bg-accent text-black font-bold shadow-[0_0_20px_rgba(242,125,38,0.2)]' : 'text-muted hover:text-white hover:bg-white/5'}`}
            >
              <Shield className={`w-4 h-4 ${activeTab === 'admin' ? 'text-black' : 'group-hover:text-accent'}`} />
              Admin
            </button>
          )}
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-10 overflow-auto bg-[radial-gradient(circle_at_top_right,rgba(242,125,38,0.03),transparent_40%)]">
          <div className="max-w-6xl mx-auto animate-slide-in">
            {activeTab === 'dashboard' && <Dashboard user={user} onRefreshUser={refreshUser} />}
            {activeTab === 'market' && <Market token={token!} onUpdateBalance={updateBalance} />}
            {activeTab === 'myteam' && <MyTeam user={user} token={token!} onUpdateBalance={updateBalance} />}
            {activeTab === 'admin' && user.role === 'admin' && <Admin />}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 p-6 text-center bg-surface/50">
        <div className="flex items-center justify-center gap-4 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
          <span className="font-display text-xl uppercase tracking-tighter">Kings League</span>
          <div className="w-1 h-1 bg-white rounded-full"></div>
          <span className="font-mono text-[9px] uppercase tracking-[0.3em]">Official Manager Tool</span>
        </div>
      </footer>
    </div>
  );
}
