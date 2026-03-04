# 🇺🇸 Inglês Master

## 🚀 Como colocar online no Vercel (gratuito)

### Passo 1 — GitHub
1. Crie conta em **github.com**
2. Clique **"New repository"** → nome: `ingles-master` → **"Create"**
3. Baixe **[GitHub Desktop](https://desktop.github.com)** e instale
4. Abra o GitHub Desktop → **File → Add Local Repository** → escolha esta pasta
5. Clique **"Publish repository"** → **"Publish"**

### Passo 2 — Vercel
1. Acesse **[vercel.com](https://vercel.com)** → **"Sign up with GitHub"**
2. Clique **"New Project"** → selecione **ingles-master**
3. Antes de clicar Deploy, expanda **"Environment Variables"** e adicione:
   - **Name:** `VITE_OPENAI_API_KEY`
   - **Value:** `sk-...` (sua chave da OpenAI)
4. Clique **"Deploy"** — aguarde ~2 minutos
5. ✅ Pronto! Link tipo: `ingles-master.vercel.app`

### Passo 3 — Celular
1. Abra o link no **Chrome** do celular
2. Menu (3 pontos) → **"Adicionar à tela inicial"**
3. Vira um app instalado! Funciona offline também.

---

## 🔑 Chave OpenAI
- Acesse: **platform.openai.com/api-keys**
- Crie conta → adicione créditos (~R$25 dura meses de uso familiar)
- Gere chave → cole no Vercel como `VITE_OPENAI_API_KEY`
- A chave fica só no servidor — ninguém mais tem acesso

## 💻 Rodar local
```bash
npm install
# Edite .env.local e coloque: VITE_OPENAI_API_KEY=sk-...
npm run dev
```
