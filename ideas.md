# Direção visual — Hub de Ferramentas Hapvida

## Abordagem 1

**Theme Name:** Centro de Operações Azul Clínico

**Very Brief Intro:** Uma interface operacional, clara e institucional, combinando azul Hapvida, superfícies brancas, âncoras âmbar e navegação lateral persistente. A sensação deve ser de controle, confiabilidade e leitura rápida.

**Probability:** 0.07

## Abordagem 2

**Theme Name:** Editorial de Dados Humanos

**Very Brief Intro:** Uma camada mais editorial, com grandes títulos, bastante espaço em branco e recortes narrativos para transformar indicadores em histórias de decisão. O visual seria acolhedor, porém menos adequado para uso operacional intenso.

**Probability:** 0.04

## Abordagem 3

**Theme Name:** Oficina Modular do Agile Coach

**Very Brief Intro:** Um sistema modular com painéis encaixáveis, códigos visuais de status e uma linguagem quase de bancada de operação. A proposta enfatiza ferramentas como instrumentos de trabalho, mas pode ficar visualmente densa.

**Probability:** 0.09

## Abordagem escolhida: Centro de Operações Azul Clínico

### Design Movement

Dashboard editorial operacional, inspirado em centros de comando de saúde e produtos B2B de alta confiabilidade, com hierarquia tipográfica forte e superfícies de baixa ornamentação.

### Core Principles

1. **Decisão antes de decoração:** cada elemento visual deve ajudar o usuário a localizar uma ferramenta, entender seu estado ou iniciar uma ação.
2. **Hierarquia por contexto:** ferramentas, categorias, atualizações e indicadores devem formar camadas legíveis, não uma grade uniforme de cartões.
3. **Confiança operacional:** estados de dados, versões e últimas atualizações devem ser sempre visíveis e compreensíveis.
4. **Consistência sem homogeneizar:** o portal compartilha componentes, mas cada ferramenta mantém sua finalidade e descrição própria.

### Color Philosophy

O azul profundo representa confiança, continuidade e estrutura. O azul médio é reservado para ações e navegação. O âmbar sinaliza atenção operacional sem parecer erro. Verde confirma carga e disponibilidade; vermelho fica restrito a falhas ou riscos reais. O fundo será um cinza azulado muito claro para evitar a sensação de planilha branca infinita.

### Layout Paradigm

Navegação lateral persistente no desktop, com uma área principal assimétrica: um bloco de contexto e busca na parte superior, seguido por categorias editoriais e uma coluna lateral de “estado do ecossistema”. No mobile, a navegação se converte em barra superior compacta e os cards viram uma lista de ferramentas com prioridade e status.

### Signature Elements

1. **Marca de versão e estado:** cada ferramenta recebe uma linha de metadados com versão, última atualização e disponibilidade.
2. **Faixa âmbar de atenção:** um detalhe gráfico recorrente para ferramentas que exigem ação ou atualização.
3. **Ícones lineares em molduras azul-clínico:** símbolos de operação, análise, comunicação e governança, sem excesso de ilustrações.

### Interaction Philosophy

As interações devem ser rápidas e previsíveis. Hover revela contexto e prioridade; foco de teclado é sempre visível; ações importantes têm feedback curto; itens administrativos ficam separados da navegação principal.

### Animation

Entradas suaves de 180–220ms para filtros, busca e navegação. Cards podem elevar 2px em hover, sem exagero. O conteúdo principal entra em pequenos grupos com atraso de 40ms. Respeitar `prefers-reduced-motion` e não animar tabelas ou indicadores em alta frequência.

### Typography System

Usar uma combinação de **Plus Jakarta Sans** para títulos e **IBM Plex Sans** para leitura operacional. O nome da plataforma terá peso 800 e espaçamento levemente fechado. Metadados, labels e status usarão caixa alta pequena com tracking controlado. Números de indicadores usarão peso 800 e alinhamento tabular.

### Brand Essence

**Posicionamento:** um centro de operação para Agile Coaches e lideranças que precisam transformar dados de squads em ações claras, sem navegar por arquivos dispersos. **Personalidade:** confiável, objetiva e cuidadosa.

### Brand Voice

Headlines são diretas e orientadas a contexto. CTAs usam verbos de ação específicos. Microcopy explica o estado dos dados sem culpar o usuário.

Exemplos:

> “Encontre a ferramenta certa para a decisão de agora.”

> “Acompanhe o que mudou antes de abrir o detalhe.”

### Wordmark & Logo

O símbolo será uma marca abstrata formada por três barras verticais conectadas por um arco suave: pessoas, squads e dados convergindo em uma única operação. O wordmark usa Plus Jakarta Sans ExtraBold com uma pequena interrupção visual entre “HAC” e “Hub”.

### Signature Brand Color

**Azul Horizonte Clínico — `#1746A2`**. É um azul vivo, mas sóbrio, usado para ações, estados ativos, ícones e destaques do portal.

## Style Decisions

- O portal não usará roxo como cor dominante, gradientes neon ou cartões excessivamente arredondados.
- A home terá navegação lateral e composição assimétrica, evitando uma grade centralizada genérica.
- O portal funcionará como catálogo e ponto de entrada; as lógicas das ferramentas permanecerão em seus próprios HTMLs.
- O Design System compartilhado será aplicado por classes e tokens, preservando IDs e eventos existentes.
- Dados de usuário não serão simulados; os estados exibidos no portal serão derivados do catálogo estático de ferramentas.

## Style Decisions — Refinamento aplicado

- A navegação lateral azul-clínico permanece visível no desktop como parte estrutural do produto, não apenas como menu móvel.
- Os cards exibem versão, atualização e disponibilidade online como metadados operacionais de primeira leitura.
- Azul é a base visual dos ícones e ações; âmbar é reservado para atenção, verde para disponibilidade confirmada e vermelho para risco ou falha.
- A marca HAC aparece no cabeçalho lateral e no topo do hero usando o símbolo gráfico gerado.
