CREATE TABLE IF NOT EXISTS trabalhadores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  funcao VARCHAR(20) NOT NULL CHECK (funcao IN ('pedreiro', 'servente')),
  valor_diaria DECIMAL(10,2) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dias_trabalhados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trabalhador_id UUID NOT NULL REFERENCES trabalhadores(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('inteiro', 'meio')),
  valor_dia DECIMAL(10,2) NOT NULL,
  pago BOOLEAN DEFAULT false,
  valor_pago DECIMAL(10,2),
  data_pagamento TIMESTAMPTZ,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trabalhador_id, data)
);

CREATE TABLE IF NOT EXISTS despesas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao VARCHAR(200) NOT NULL,
  categoria VARCHAR(30) NOT NULL CHECK (categoria IN ('material','alimentacao','transporte','ferramentas','outros')),
  valor DECIMAL(10,2) NOT NULL,
  data DATE NOT NULL,
  pago_para VARCHAR(100),
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dias_trabalhador ON dias_trabalhados(trabalhador_id);
CREATE INDEX IF NOT EXISTS idx_dias_data ON dias_trabalhados(data);
CREATE INDEX IF NOT EXISTS idx_despesas_data ON despesas(data);
CREATE INDEX IF NOT EXISTS idx_despesas_categoria ON despesas(categoria);
