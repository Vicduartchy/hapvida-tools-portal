# Hub de Ferramentas Hapvida

Portal estático para reunir as ferramentas HTML do ecossistema Agile Coach em uma única entrada. O portal fornece navegação, busca, categorias, status e um Design System compartilhado; as lógicas de importação, cálculo, filtros, gráficos e exportação permanecem dentro dos HTMLs originais.

## Arquitetura

- `client/src/pages/Home.tsx`: catálogo e navegação do portal.
- `client/src/index.css`: tema global e tokens visuais do portal.
- `client/public/ferramentas/`: ferramentas HTML preservadas como páginas independentes.
- `client/public/assets/`: ativos visuais do portal.
- `vercel.json`: configuração de build para Vercel.
- `.github/workflows/deploy-pages.yml`: publicação automática no GitHub Pages.

## Execução local

```bash
pnpm install
pnpm dev
```

Para validar o projeto:

```bash
pnpm check
pnpm build
```

## GitHub Pages

O workflow publica o site de projeto em:

`https://vicduartchy.github.io/hapvida-tools-portal/`

O build usa `VITE_BASE_PATH=/hapvida-tools-portal/` para que os ativos e as rotas das ferramentas funcionem no subcaminho do GitHub Pages.

## Vercel

A Vercel pode ser conectada diretamente ao repositório `Vicduartchy/hapvida-tools-portal`. A configuração esperada é:

- Framework: Vite;
- Install command: `pnpm install --frozen-lockfile`;
- Build command: `pnpm build`;
- Output directory: `dist/public`;
- Base path: vazio, pois a Vercel publica no domínio raiz.

## Dados e privacidade

As ferramentas processam planilhas e arquivos localmente no navegador. Este repositório não deve receber planilhas reais, bases pessoais ou arquivos com dados sensíveis. O repositório contém apenas código, catálogo, ativos visuais e as ferramentas HTML.

A base de SMs e squads continua sendo carregada dentro das ferramentas conforme o fluxo existente. O portal não cria banco de dados nem envia os dados operacionais para um servidor.
