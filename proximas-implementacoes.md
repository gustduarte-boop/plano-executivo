# Próximas Implementações — Plano Executivo

**Última atualização:** 2026-04-30
**Origem:** ideias coletadas durante sessão paralela do projeto imoveis-machine-learning. Salvo aqui para não perder; pegar quando voltar a trabalhar no plano-executivo.

---

## 1. Overlapping Nested Stacked Bar Chart — Evolução Patrimonial

### Problema atual
Os gráficos de evolução patrimonial (FIG 1A/1B/1C nos relatórios PDF) mostram apenas projeções. Quando dados reais forem lançados no app, não há forma visual de comparar projetado vs realizado.

### Solução proposta
**Overlapping nested stacked bar chart** — duas camadas de barras empilhadas sobrepostas:

- **Barra traseira (larga, opacidade 40%):** projeção do cenário selecionado (base/pessimista/otimista), empilhada por componente (IBKR, CDI, LCI, imóveis, cripto)
- **3 barras frontais (estreitas, lado a lado, opacidade 100%):** valores reais de cada mês do trimestre, também empilhadas pelos mesmos componentes
- Agrupamento trimestral (Q1, Q2, Q3, Q4)
- Mesma escala vertical, mesmas cores por componente
- Hover mostra breakdown do componente

### Implementação técnica (Recharts)
```
<Bar stackId="proj" barSize={40} opacity={0.3} />   ← projeção empilhada (larga, atrás)
<Bar stackId="m1" barSize={10} />                    ← mês 1 real empilhado (estreita)
<Bar stackId="m2" barSize={10} />                    ← mês 2 real empilhado (estreita)
<Bar stackId="m3" barSize={10} />                    ← mês 3 real empilhado (estreita)
```

**Desafio:** Recharts posiciona barras lado a lado por padrão. Para sobrepor, usar `<ComposedChart>` com posicionamento manual via offset de `x`, ou dois charts sobrepostos com `position: absolute`. Se Recharts não suportar, fallback para D3 puro dentro de componente React.

### Referências visuais
- Overlapping horizontal bar chart (barras sobrepostas simples)
- Nested horizontal bar chart (barras de larguras diferentes na mesma posição)
- Ambas empilhadas — a nested e a principal

---

## 2. Overlapping Bar Chart — CAPEX Obra (Orçado vs Realizado)

### Problema atual
A seção de controle de CAPEX da obra é hermética. Não dá segurança de que tudo foi lançado, não mostra claramente quanto foi gasto vs orçado, e a categorização é confusa.

### Solução proposta
**Overlapping horizontal bar chart** por categoria de obra:

- **Barra de fundo (cinza/transparente):** orçamento por categoria
- **Barra sobreposta (colorida, mais estreita):** valor realizado
- Se realizado > orçado, barra fica vermelha
- Barra de progresso geral no topo: R$ gasto / R$210k orçado

### Categorias pré-definidas
- Fundação / estrutura
- Alvenaria / paredes
- Telhado / cobertura
- Hidráulica
- Elétrica
- Acabamento / piso / revestimento
- Piscina
- Mão de obra (pedreiro, servente)
- Material de construção (cimento, areia, ferro)
- Transporte / frete
- Outros

### Funcionalidades complementares
- **Lançamento rápido:** data (default hoje), valor, categoria (dropdown), descrição curta, botão "Lançar"
- **Histórico cronológico:** lista de todos os lançamentos, mais recente primeiro, filtro por categoria, editar/excluir
- **Orçamento editável:** permitir definir orçamento por categoria, default R$210k total

---

## 3. Curva Im.1 — 3 Cenários (já implementado nos PDFs v5)

### O que foi feito
Gráfico FIG 2B nos três relatórios (Master, Sprint, TM) mostrando:
- 3 curvas de renda líquida Im.1 (conservador/base/otimista)
- Área sombreada entre conservador e otimista
- Referência flat v4 (linha pontilhada R$6.633+IPCA)
- Marcador de fim de maturação

### Oportunidade futura no app
Quando dados reais de receita Im.1 estiverem disponíveis (~set/2026+), plotar pontos reais sobre as 3 curvas projetadas. O gráfico mostraria instantaneamente em qual cenário a realidade está caindo.

---

## 4. Heatmap Geoespacial — Monitor de Preços (pendente)

### Contexto
Repetidamente discutido e deprioritizado. Visualização de preços por localização geográfica em Corumbau.

### Ideia
Mapa de calor com os 27 imóveis benchmarked (CBA + CBB) plotados por coordenada, cor representando ticket médio ou ocupação. Permitiria ver clusters de preço alto/baixo e validar a tese de que Vila/Centro (Im.1) e Ponta do Corumbau (Im.2) são mercados distintos.

### Status
Arquitetura multi-mercado já existe no banco (tabela `mercados` com `mercado_id` como FK). Falta implementar a visualização.

---

## 5. Gráfico de Ocupação Observada vs Projetada — Monitor de Preços

### Contexto
Ocupação é o elo mais fraco do benchmarking. O ChatGPT usou proxies (reviews, calendário) para estimar 40%/50%/60%.

### Ideia futura
Quando houver coleta de ocupação real (manual quinzenal ou automatizada), plotar:
- Ocupação observada por CBA (pontos/scatter)
- Faixa projetada (conservador–otimista) como área sombreada
- Sazonalidade real vs sazonalidade modelada

### Dependência
Dados de ocupação real — coleta manual quinzenal (20 min) ou automação via Browse AI / Claude in Chrome.

---

## 6. Favicons Exclusivos (definidos)

### Plano Executivo Financeiro
- **Design:** Ondas amplas terra a 45° (opção 8B)
- **Cores:** #606C38 (verde oliva), #DDA15E (dourado), #BC6C25 (terracota)
- **Estilo:** Sem fundo, curva S com duas inflexões, traço 3.2px
- **Arquivos:** favicon-plano-executivo.svg / -32.png / -180.png
- **Localização:** ~/Plano Financeiro/Favicon/

### Monitor de Preços
- **Design:** Radar azul com alvos (opção 2)
- **Cores:** #219EBC (azul principal), #E24B4A (alvo vermelho)
- **Estilo:** Sem fundo, 2 anéis, linha de varredura, ponto alvo
- **Arquivos:** favicon-monitor-precos.svg / -32.png / -180.png
- **Localização:** ~/Plano Financeiro/Favicon/
- **Nota:** primeira versão ficou com traços finos demais — versão atual usa traços de 2.5px+

---

## Prioridade de Implementação

| # | Item | Onde | Dependência | Prioridade |
|---|---|---|---|---|
| 1 | CAPEX overlapping bars | plano-executivo | Nenhuma | **Alta** — obra já começou |
| 2 | Favicons | Ambos os apps | Arquivos já gerados | **Alta** — trivial |
| 3 | Nested stacked bars (projetado vs real) | plano-executivo | Dados reais lançados | Média |
| 4 | Curva Im.1 real vs projetada | plano-executivo | Receita real (~set/2026) | Média |
| 5 | Heatmap geoespacial | monitor-precos | Coordenadas + dados | Baixa |
| 6 | Ocupação observada vs projetada | monitor-precos | Coleta de ocupação | Baixa |

---

## Stack Técnico

- **plano-executivo:** React + Supabase + Recharts + Vercel
- **monitor-precos:** Next.js + Tailwind + Supabase + Vercel
- **Gráficos:** Recharts como default; D3 como fallback para customização avançada (nested bars)
- **Dados:** Supabase free tier (pode pausar por inatividade)
