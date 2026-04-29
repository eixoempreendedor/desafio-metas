/**
 * Mensagens inspiradoras pra disparo diário.
 * Mix de bíblicas, estoicas e modernas — foco em empreendedorismo,
 * trabalho duro, persistência e visão de longo prazo.
 *
 * Rotação: dia-do-ano mod length. Cresça a lista pra reduzir repetição.
 */

export type Inspiracao = { texto: string; fonte: string };

export const MENSAGENS_INSPIRADORAS: Inspiracao[] = [
  // ─── Bíblicas — Provérbios ──────────────────────────────────────
  { texto: 'O homem diligente prosperará, e a alma do diligente será saciada.', fonte: 'Provérbios 13:4' },
  { texto: 'Em todo trabalho há proveito, mas a conversa dos lábios apenas leva à pobreza.', fonte: 'Provérbios 14:23' },
  { texto: 'Encomenda ao Senhor as tuas obras, e teus pensamentos serão estabelecidos.', fonte: 'Provérbios 16:3' },
  { texto: 'O coração do homem traça o seu caminho, mas o Senhor lhe dirige os passos.', fonte: 'Provérbios 16:9' },
  { texto: 'Vês um homem perito na sua obra? Perante reis será posto.', fonte: 'Provérbios 22:29' },
  { texto: 'O justo cai sete vezes, e se levanta.', fonte: 'Provérbios 24:16' },
  { texto: 'O ferro com ferro se afia; assim, o homem afia o rosto do seu amigo.', fonte: 'Provérbios 27:17' },
  { texto: 'A bênção do Senhor é que enriquece, e ele não acrescenta dores.', fonte: 'Provérbios 10:22' },

  // ─── Bíblicas — Outras ──────────────────────────────────────────
  { texto: 'Tudo o que vier à mão para fazer, faze-o conforme as tuas forças.', fonte: 'Eclesiastes 9:10' },
  { texto: 'Posso todas as coisas naquele que me fortalece.', fonte: 'Filipenses 4:13' },
  { texto: 'Sê forte e corajoso; não temas, nem te espantes; porque o Senhor teu Deus está contigo por onde quer que andares.', fonte: 'Josué 1:9' },
  { texto: 'E sabemos que todas as coisas cooperam para o bem daqueles que amam a Deus.', fonte: 'Romanos 8:28' },
  { texto: 'Bem-aventurado o homem que confia no Senhor; será como a árvore plantada junto às águas.', fonte: 'Jeremias 17:7-8' },
  { texto: 'Tudo quanto fizerdes, fazei-o de todo o coração, como ao Senhor, e não aos homens.', fonte: 'Colossenses 3:23' },
  { texto: 'O Senhor é a minha luz e a minha salvação; a quem temerei?', fonte: 'Salmo 27:1' },
  { texto: 'Os que esperam no Senhor renovarão as forças, subirão com asas como águias.', fonte: 'Isaías 40:31' },
  { texto: 'Não vos canseis de fazer o bem, porque a seu tempo ceifaremos, se não desfalecermos.', fonte: 'Gálatas 6:9' },
  { texto: 'O reino de Deus é como um homem que lança a semente à terra; dorme e levanta, e a semente brota e cresce.', fonte: 'Marcos 4:26-27' },

  // ─── Estoicas / Filosóficas ─────────────────────────────────────
  { texto: 'Tu tens poder sobre a tua mente, não sobre os eventos. Reconhece isso e encontrarás força.', fonte: 'Marco Aurélio' },
  { texto: 'Comece. O resto é fácil.', fonte: 'Sêneca' },
  { texto: 'Não é porque as coisas são difíceis que não ousamos; é porque não ousamos que elas são difíceis.', fonte: 'Sêneca' },
  { texto: 'Toda nova manhã é uma vida nova para um homem sábio.', fonte: 'Dale Carnegie' },
  { texto: 'O obstáculo é o caminho.', fonte: 'Marco Aurélio' },
  { texto: 'Confine-se ao presente.', fonte: 'Marco Aurélio' },

  // ─── Empreendedorismo / Negócios ────────────────────────────────
  { texto: 'A melhor maneira de prever o futuro é criá-lo.', fonte: 'Peter Drucker' },
  { texto: 'Cuidado com pequenos gastos; uma pequena fenda afunda um grande navio.', fonte: 'Benjamin Franklin' },
  { texto: 'Risco vem de não saber o que se está fazendo.', fonte: 'Warren Buffett' },
  { texto: 'A maioria das pessoas perde oportunidades porque elas vêm vestidas de macacão e parecem trabalho.', fonte: 'Thomas Edison' },
  { texto: 'Não sou um produto das minhas circunstâncias. Sou um produto das minhas decisões.', fonte: 'Stephen Covey' },
  { texto: 'A disciplina é a ponte entre metas e realizações.', fonte: 'Jim Rohn' },
  { texto: 'Você não é pago pelo número de horas que trabalha, e sim pelo valor que entrega.', fonte: 'Jim Rohn' },
  { texto: 'Quem deixa de prospectar para fechar uma venda perde a próxima venda.', fonte: 'Zig Ziglar' },
  { texto: 'Pessoas comuns querem entretenimento. Pessoas extraordinárias querem educação.', fonte: 'Denzel Washington' },
  { texto: 'Se você quiser ir rápido, vá sozinho. Se quiser ir longe, vá acompanhado.', fonte: 'Provérbio africano' },

  // ─── Ação / Persistência ────────────────────────────────────────
  { texto: 'Sucesso é a soma de pequenos esforços repetidos dia após dia.', fonte: 'Robert Collier' },
  { texto: 'A motivação faz você começar. O hábito faz você continuar.', fonte: 'Jim Ryun' },
  { texto: 'Não conte os dias; faça os dias contarem.', fonte: 'Muhammad Ali' },
  { texto: 'A diferença entre o impossível e o possível está na determinação de uma pessoa.', fonte: 'Tommy Lasorda' },
  { texto: 'Quando tudo parece estar contra você, lembre-se: o avião decola contra o vento, não a favor.', fonte: 'Henry Ford' },
  { texto: 'O que está atrás de nós e o que está à nossa frente são pequenas coisas comparadas ao que está dentro de nós.', fonte: 'Ralph Waldo Emerson' },
  { texto: 'Comece onde você está. Use o que você tem. Faça o que você pode.', fonte: 'Arthur Ashe' },
  { texto: 'Plante uma semente todo dia. Não se preocupe com a colheita; ela virá.', fonte: 'Provérbio popular' },
];

/** Retorna a inspiração do dia (rotação pelo dia do ano). */
export function inspiracaoDoDia(d: Date = new Date()): Inspiracao {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const dia = Math.floor((d.getTime() - start) / 86_400_000);
  return MENSAGENS_INSPIRADORAS[dia % MENSAGENS_INSPIRADORAS.length];
}

/** Mensagem WhatsApp formatada da inspiração do dia. */
export function mensagemInspiracaoDoDia(): string {
  const i = inspiracaoDoDia();
  return [
    '🌅 *Mensagem do dia*',
    '',
    `"${i.texto}"`,
    '',
    `— _${i.fonte}_`,
  ].join('\n');
}
