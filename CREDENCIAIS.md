# CineLog — Credenciais e Acesso Admin

Documento para testes e apresentação acadêmica.

---

## Conta Administrador Padrão

| Campo | Valor |
|-------|-------|
| **E-mail** | `admin@cinelog.com` |
| **Senha** | `admin123` |
| **Nome de usuário** | `admin` |
| **Tipo** | `admin` |

---

## Onde as credenciais estão configuradas

1. **Banco de dados** — tabela `usuarios`, arquivo `banco_cinelog.sql`:
   - Campo `email` = `admin@cinelog.com`
   - Campo `senha_hash` = hash bcrypt da senha `admin123`
   - Campo `tipo` = `'admin'`

2. **Script de migração** — `cinelog-api/scripts/init-db.js`:
   - Cria o admin automaticamente se não existir

3. **Tela de login** — credenciais não são exibidas na interface (apenas neste documento)

---

## Como o sistema identifica um admin

### No banco (MySQL)
```sql
-- Campo tipo na tabela usuarios
tipo ENUM('usuario', 'admin') DEFAULT 'usuario'
```

### No backend (Express)
1. Login gera JWT com payload `{ id, email, nome_usuario, tipo }`
2. `middleware/auth.js` decodifica o token → `req.usuario.tipo`
3. `middleware/admin.js` verifica `req.usuario.tipo === 'admin'`
4. Rotas `/admin/*` usam ambos os middlewares

### No frontend (React)
1. `AuthContext` expõe `isAdmin: usuario?.tipo === 'admin'`
2. `AdminRoute` redireciona usuários comuns para `/`
3. Header mostra link "Admin" apenas se `isAdmin === true`

---

## URL do painel administrativo

Com o React rodando (`npm run dev`):

| Página | URL |
|--------|-----|
| Dashboard | http://localhost:5173/admin |
| Gerenciar filmes | http://localhost:5173/admin/filmes |
| Gerenciar usuários | http://localhost:5173/admin/usuarios |

---

## Como testar o painel admin

1. Execute a API: `cd cinelog-api && node server.js`
2. Execute o React: `cd cinelog-web && npm run dev`
3. Acesse http://localhost:5173/login
4. Entre com `admin@cinelog.com` / `admin123`
5. Clique em **Admin** no menu ou acesse `/admin`
6. Teste estatísticas, CRUD de filmes e gerenciamento de usuários

---

## Como criar ou promover novos administradores

### Opção 1 — Painel admin (recomendado)
1. Login como admin
2. Acesse `/admin/usuarios`
3. Clique em **Promover admin** no usuário desejado

### Opção 2 — SQL direto
```sql
UPDATE usuarios SET tipo = 'admin' WHERE email = 'email@usuario.com';
```

### Opção 3 — Cadastro + promoção
1. Usuário cria conta normal em `/cadastro`
2. Admin promove via painel ou SQL

---

## Segurança (para explicar na apresentação)

- Senhas **nunca** ficam em texto puro — apenas `senha_hash` (bcrypt)
- JWT assinado com `JWT_SECRET` no `.env`
- Usuário comum recebe **403 Forbidden** ao tentar `/admin/*`
- Frontend bloqueia UI, backend garante segurança real
