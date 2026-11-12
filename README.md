# SAQUA ON

Guia digital das praias de Saquarema (RJ). Mostra as condições do mar, reúne quiosques e comerciantes locais, divulga eventos e tem uma comunidade onde moradores e turistas compartilham dicas e fotos.

## O que o site tem

**Para quem visita**
- Radar das praias: ondas, vento, maré, bandeira de segurança e lotação.
- Marketplace de quiosques, restaurantes, escolas de surf, pousadas e ambulantes, com filtros, mapa e avaliações.
- Eventos e agenda da capital do surf (WSL).
- Comunidade: publicações com foto, comentários e denúncias.
- Cadastro e login (turista, morador ou comerciante) com recuperação de senha.

**Para comerciantes**
- Cadastro do estabelecimento com plano Gratuito, Pro ou Master.
- Edição pelo próprio site: dados, horário, comodidades, fotos, cardápio/serviços (com item em destaque), promoções e eventos.

**Para administradores**
- Painel com moderação de denúncias, gestão de estabelecimentos (plano, status e selo de verificado) e gestão de usuários.

## Tecnologias

- React 19, TypeScript, Vite e Tailwind CSS 4
- Supabase: PostgreSQL com RLS, autenticação e Storage de fotos
- Cloudflare Turnstile (CAPTCHA, opcional)

## Como rodar

Requisitos: Node.js 18+ e acesso a um projeto no Supabase.

```bash
git clone https://github.com/SEU-USUARIO/SAQUAON.git
cd SAQUAON
npm install
```

Crie o arquivo `.env` na raiz do projeto (ao lado do `package.json`):

```bash
cp .env.example .env        # Git Bash / Mac / Linux
copy .env.example .env      # PowerShell
```

Preencha as duas variáveis obrigatórias (veja a seção abaixo) e rode:

```bash
npm run dev
```

Abra http://localhost:3000. Ao mudar o `.env`, pare o servidor com Ctrl+C e rode `npm run dev` de novo.

Não abra o `index.html` com duplo clique: o site precisa do servidor do Vite.

Outros comandos úteis:

```bash
npm run build          # gera a versão de produção na pasta dist/
npx tsc --noEmit       # confere os erros de TypeScript
```

## Variáveis de ambiente

| Variável | Obrigatória | Para que serve |
|---|---|---|
| `VITE_SUPABASE_URL` | Sim | Project URL, no formato `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Sim | Chave pública do projeto (a `anon` ou a `publishable`, que começa com `sb_publishable_`) |
| `VITE_GOOGLE_MAPS_API_KEY` | Não | Chave do Google Maps |
| `VITE_TURNSTILE_SITE_KEY` | Não | Liga o CAPTCHA (Cloudflare Turnstile) |

Exemplo de `.env`:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxx
```

Atenção:
- O nome precisa começar com `VITE_`. Variáveis `NEXT_PUBLIC_...` (de projetos Next.js) são ignoradas pelo Vite.
- Sem aspas e sem espaço em volta do `=`.
- O `.env` não vai para o GitHub (está no `.gitignore`). Use só a chave pública, **nunca a `service_role` nem a `secret`**.

## Configurando o Supabase

1. Crie um projeto (ou peça acesso ao projeto da equipe) e copie a URL e a chave pública para o `.env`.
2. No **SQL Editor**, rode **uma única vez, nesta ordem**:
   1. `supabase/migrations/20261104000000_schema_inicial.sql` (tabelas, segurança e planos)
   2. `supabase/migrations/20261112000000_comunidade_e_fotos.sql` (publicações, comentários, denúncias, funções do administrador e bucket de fotos)
   3. `supabase/seed.sql` (dados de exemplo)
3. Em **Authentication → URL Configuration**, coloque o endereço do site em Site URL e Redirect URLs (`http://localhost:3000` para testes).
4. Para testar sem e-mail de confirmação, desligue **Confirm email** em Authentication → Providers → Email. Em produção, deixe ligado.

Observações:
- Em um banco que já tem o schema inicial, rode **apenas** a segunda migration. Rodar o schema inicial de novo dá erro de tabela já existente.
- O Supabase mostra um aviso de "operações destrutivas" ao rodar as migrations. É automático (por causa de palavras como `delete` e `update`); as migrations só criam coisas novas e não apagam dados.
- Se o projeto for compartilhado, tudo o que for criado em testes (contas, publicações, estabelecimentos) aparece para todos. Apague os testes depois.

### Primeiro administrador

Ninguém se cadastra como administrador pelo site. Crie uma conta normalmente e, no SQL Editor (em uma consulta nova, clicando em **Run**), rode:

```sql
update public.usuarios set tipo = 'administrador' where email = 'seu@email.com';
```

Saia e entre de novo: o menu da conta passa a mostrar **Painel do administrador**. Depois, novos administradores podem ser definidos na aba **Usuários** do painel.

### Voltando a ser comerciante ou turista

O painel não permite que o administrador remova o próprio acesso (para ninguém se trancar para fora). Para isso, use o SQL:

```sql
update public.usuarios set tipo = 'comerciante' where email = 'seu@email.com';
```

Os tipos válidos são `turista`, `morador`, `comerciante` e `administrador`. Os estabelecimentos continuam sendo da conta, mas o bloco "Meus estabelecimentos" do menu só aparece para o tipo `comerciante`.

## CAPTCHA (recomendado em produção)

Sem a chave configurada, o site funciona normalmente e o CAPTCHA fica desligado.

1. No painel da Cloudflare (Turnstile), crie um widget para o seu domínio (adicione `localhost` para testes).
2. Coloque a **Site Key** em `VITE_TURNSTILE_SITE_KEY` (no `.env` e na Vercel).
3. No Supabase, em **Authentication → Attack Protection**, ative **CAPTCHA protection**, escolha **Cloudflare Turnstile** e cole a **Secret Key**.

Ative os dois lados juntos: CAPTCHA ligado no Supabase sem a Site Key no site faz cadastro e login falharem.

## Fotos

As fotos ficam no bucket `fotos` do Supabase Storage (criado pela segunda migration). O banco de dados guarda só o endereço da imagem, e não o arquivo.

- Formatos: JPG, PNG e WebP, até 20 MB por arquivo escolhido.
- O navegador reduz a foto antes de enviar (lado maior de 1600 px, formato WebP, qualidade ~82%). Cada imagem costuma ficar com poucas centenas de KB.
- O bucket recusa arquivos acima de 5 MB depois da redução, e a imagem fica em cache no navegador por 1 ano.
- Cada pessoa só envia e apaga arquivos na própria pasta.
- Estabelecimentos aceitam até 10 fotos (a primeira é a capa); publicações, 1 foto.
- Ao remover uma foto pelo site, o arquivo também é apagado do Storage.

## Perfis e permissões

| Perfil | O que pode fazer |
|---|---|
| Visitante | Ver praias, quiosques, eventos, publicações e comentários |
| Turista / Morador | Avaliar locais, publicar, comentar, denunciar e apagar o que é seu |
| Comerciante | Tudo acima, mais cadastrar até 5 estabelecimentos e editar os seus |
| Administrador | Tudo acima, mais moderar denúncias, alterar plano/status/selo e definir o tipo dos usuários |

Planos: **Gratuito** (sem promoções), **Pro** (até 3 promoções ativas) e **Master** (ilimitado). O comerciante só **pede** o plano; o administrador ativa na aba Estabelecimentos do painel. As regras ficam no banco (RLS e triggers) e valem mesmo que alguém tente burlar a tela.

## Moderação

- Qualquer pessoa logada denuncia publicação, comentário ou estabelecimento (uma vez por item).
- O administrador oculta o conteúdo, suspende o estabelecimento, descarta ou reabre a denúncia.
- Conteúdo oculto some para o público; o autor e os administradores ainda o veem.
- Limite contra spam: 10 publicações e 30 comentários por hora por pessoa.

## Estrutura

```
src/
  components/   telas e janelas (AdminPanel, Community, MyBusinessModal, AuthModal...)
    ui/         Modal, campos e abas reutilizáveis
  context/      AuthContext (sessão) e DataContext (dados do site)
  lib/          api.ts (Supabase), supabase.ts, validation.ts
supabase/
  migrations/   esquema do banco, em ordem
  seed.sql      dados de exemplo
```

## Trabalhando com fork e Git

Fluxo para guardar mudanças no seu fork:

```bash
git add arquivo1 arquivo2      # ou "git add ." se tiver certeza do que está na lista
git status                     # confira: o .env NÃO pode aparecer
git commit -m "descrição da mudança"
git push
```

- O `.env` nunca deve ir para o GitHub. Se ele aparecer no `git status`, pare e confira o `.gitignore`.
- Avisos `LF will be replaced by CRLF` no Windows são só sobre quebra de linha e não são erros.
- Se o `git push` for recusado (`rejected` / `fetch first`), o GitHub tem commits que o seu computador não tem. Rode `git pull --rebase` e depois `git push`.
- Rode cada comando separadamente, apertando Enter depois de cada um.
- Se o terminal disser `not a git repository`, ele está na pasta errada. Entre na pasta do clone (a que tem a pasta oculta `.git`).

## Publicando (Vercel)

1. Importe o repositório (framework: Vite).
2. Em **Settings → Environment Variables**, cadastre `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (e `VITE_TURNSTILE_SITE_KEY`, se usar CAPTCHA).
3. Cada `git push` na `main` publica uma nova versão. Depois de mudar variáveis, faça **Redeploy**.
4. Coloque o endereço da Vercel em Authentication → URL Configuration no Supabase.

O `.env` do seu computador não vai para a Vercel: as variáveis precisam ser cadastradas lá.

## Apresentando o projeto

- O login fica salvo no navegador onde a pessoa entrou. Em outro computador o site abre deslogado.
- O `localhost:3000` só existe no seu computador. Para mostrar em outra máquina, publique o site na Vercel.
- Antes de apresentar, saia da conta pessoal ou use uma janela anônima (Ctrl+Shift+N).
- Crie contas de demonstração, uma de cada tipo (turista, comerciante com um estabelecimento e administrador), para mostrar cada fluxo sem usar a conta pessoal.

## Problemas comuns

- **`npm error ENOENT ... package.json`:** o terminal está na pasta errada. Ao extrair um zip, o projeto costuma ficar numa subpasta (`SAQUAON-main\SAQUAON-main`). Entre na pasta que contém o `package.json`.
- **Faixa amarela "Supabase não configurado":** `.env` ausente, na pasta errada, com nomes sem o prefixo `VITE_`, ou servidor não reiniciado depois de criá-lo.
- **"Sem conexão com o servidor":** `.env` com valores de exemplo (`xxxxxxxx`), URL errada, ou projeto do Supabase pausado (clique em Restore project).
- **Site abre mas sem praias e quiosques:** faltou rodar o schema e o `seed.sql`.
- **Erro em comunidade, fotos ou painel:** faltou rodar a segunda migration. Confira se existe o bucket `fotos` em Storage e as tabelas `publicacoes`, `comentarios` e `denuncias` em Table Editor.
- **A foto não sobe:** confira o bucket `fotos` e veja a mensagem em vermelho embaixo do botão de foto. Se não houver mensagem, abra o F12 → Network e veja o status da requisição para `/storage/v1/object/fotos/`.
- **Sem "Painel do administrador":** o usuário ainda não é administrador (veja o SQL acima) ou precisa sair e entrar de novo.
- **Sem o botão "Editar" no menu da conta:** a versão que está rodando é antiga (confira se `src/components/Community.tsx` existe) ou o usuário não é do tipo `comerciante`.
- **Ctrl+C não para o servidor:** se houver texto selecionado no terminal, o Ctrl+C copia em vez de interromper. Clique numa área vazia e tente de novo, ou feche o terminal pela lixeira.
- **Falha no cadastro com CAPTCHA:** falta a Site Key no site ou a Secret Key no Supabase.

## Ideias para o futuro

Notificações, estatísticas de cliques para comerciantes (prometidas nos planos Pro e Master), pagamento online dos planos e edição de publicações pela tela.
