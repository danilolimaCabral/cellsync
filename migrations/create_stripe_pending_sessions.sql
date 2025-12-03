-- Tabela para armazenar sessions do Stripe pendentes de vinculação com tenant
CREATE TABLE IF NOT EXISTS stripe_pending_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sessionId TEXT NOT NULL UNIQUE,
  tenantId INTEGER NOT NULL,
  userId INTEGER NOT NULL,
  processed INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL,
  processedAt TEXT,
  FOREIGN KEY (tenantId) REFERENCES tenants(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_stripe_pending_sessions_sessionId ON stripe_pending_sessions(sessionId);
CREATE INDEX IF NOT EXISTS idx_stripe_pending_sessions_processed ON stripe_pending_sessions(processed);
