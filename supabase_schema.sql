-- Criar tabela de perfis
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  nome TEXT,
  email TEXT,
  saldo DECIMAL DEFAULT 100,
  pontuacao_total DECIMAL DEFAULT 0,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Criar tabela de jogadores
CREATE TABLE jogadores (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  posicao TEXT NOT NULL,
  time TEXT NOT NULL,
  preco DECIMAL NOT NULL,
  pontogeral DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Criar tabela de escalacoes
CREATE TABLE escalacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users ON DELETE CASCADE,
  jogador_id INT REFERENCES jogadores(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(usuario_id, jogador_id)
);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jogadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalacoes ENABLE ROW LEVEL SECURITY;

-- Politicas para profiles
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can update any profile." ON profiles FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);
CREATE POLICY "Admins can delete any profile." ON profiles FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Funcao para lidar com a criacao de novos usuarios automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, role, saldo, pontuacao_total)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'nome', 'Novo Jogador'), 
    new.email, 
    CASE WHEN new.email = 'nemesioangelooliveiradasilva@gmail.com' THEN 'admin' ELSE 'user' END, 
    100, 
    0
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gatilho para chamar a funcao apos um usuario se cadastrar
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Politicas para jogadores
CREATE POLICY "Jogadores are viewable by everyone." ON jogadores FOR SELECT USING (true);
CREATE POLICY "Only admins can modify jogadores." ON jogadores FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Politicas para escalacoes
CREATE POLICY "Users can view own escalacoes." ON escalacoes FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Users can insert own escalacoes." ON escalacoes FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can delete own escalacoes." ON escalacoes FOR DELETE USING (auth.uid() = usuario_id);

-- Inserir alguns jogadores iniciais
INSERT INTO jogadores (nome, posicao, time, preco, pontogeral) VALUES
('Neymar Jr', 'ATA', 'Al-Hilal', 25.0, 0),
('Lionel Messi', 'ATA', 'Inter Miami', 22.0, 0),
('Cristiano Ronaldo', 'ATA', 'Al-Nassr', 20.0, 0),
('Kevin De Bruyne', 'MEI', 'Man City', 18.0, 0),
('Luka Modric', 'MEI', 'Real Madrid', 15.0, 0),
('Virgil van Dijk', 'ZAG', 'Liverpool', 14.0, 0),
('Alisson Becker', 'GOL', 'Liverpool', 12.0, 0),
('Vinícius Jr', 'ATA', 'Real Madrid', 24.0, 0),
('Erling Haaland', 'ATA', 'Man City', 26.0, 0),
('Kylian Mbappé', 'ATA', 'Real Madrid', 27.0, 0);
