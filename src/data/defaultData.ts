import { Destination, CostItem, Traveler, FlightInfo, GeneralTip, NotificationAlert, TravelDocument } from "../types";

export const INITIAL_TRAVELERS: Traveler[] = [
  { id: "1", name: "Théo (Você)", role: "Organizador", email: "theoked25@gmail.com" },
  { id: "2", name: "Amanda", role: "Co-piloto", email: "amanda@viagem.com" },
  { id: "3", name: "Bruno", role: "Finanças", email: "bruno@viagem.com" },
  { id: "4", name: "Camila", role: "Viajante", email: "camila@viagem.com" },
  { id: "5", name: "Diego", role: "Viajante", email: "diego@viagem.com" },
  { id: "6", name: "Elaine", role: "Viajante", email: "elaine@viagem.com" },
  { id: "7", name: "Fernando", role: "Viajante", email: "fernando@viagem.com" },
  { id: "8", name: "Glória", role: "Viajante", email: "gloria@viagem.com" }
];

export const INITIAL_FLIGHTS: FlightInfo[] = [
  {
    id: "f1",
    airline: "LATAM Airlines",
    flightCode: "LA 3012",
    departureCity: "Florianópolis",
    departureCode: "FLN",
    departureTime: "14:15",
    arrivalCity: "São Paulo",
    arrivalCode: "GRU",
    arrivalTime: "15:30",
    duration: "1h 15min",
    dateStr: "2026-06-30",
    arrivalDateStr: "2026-06-30",
    status: "Confirmado",
    gate: "A12",
    locator: "LAFLN1",
    passengers: "Grupo 1 (Theo, Karoll, Gabi, Lelê)",
    passengersList: [
      { id: "fp1-1", name: "Theo Ked", seat: "12A" },
      { id: "fp1-2", name: "Karoll Ked", seat: "12B" },
      { id: "fp1-3", name: "Gabi Ked", seat: "12C" },
      { id: "fp1-4", name: "Lelê Ked", seat: "12D" }
    ]
  },
  {
    id: "f2",
    airline: "LATAM Airlines",
    flightCode: "LA 3014",
    departureCity: "Florianópolis",
    departureCode: "FLN",
    departureTime: "14:45",
    arrivalCity: "São Paulo",
    arrivalCode: "GRU",
    arrivalTime: "16:00",
    duration: "1h 15min",
    dateStr: "2026-06-30",
    arrivalDateStr: "2026-06-30",
    status: "Confirmado",
    gate: "A14",
    locator: "LAFLN2",
    passengers: "Grupo 2 (César, Rogéria, Fabrício, Neusa)",
    passengersList: [
      { id: "fp2-1", name: "César Ferreira", seat: "14A" },
      { id: "fp2-2", name: "Rogéria Ferreira", seat: "14B" },
      { id: "fp2-3", name: "Fabrício Ferreira", seat: "14C" },
      { id: "fp2-4", name: "Neusa Chucre", seat: "14D" }
    ]
  },
  {
    id: "f3",
    airline: "Avianca",
    flightCode: "AV 248",
    departureCity: "São Paulo",
    departureCode: "GRU",
    departureTime: "18:25",
    arrivalCity: "Bogotá",
    arrivalCode: "BOG",
    arrivalTime: "22:45",
    duration: "6h 20min",
    dateStr: "2026-06-30",
    arrivalDateStr: "2026-06-30",
    status: "Confirmado",
    gate: "B18",
    locator: "AVBOG1",
    passengers: "Grupo 1 (Theo, Karoll, Gabi, Lelê)",
    passengersList: [
      { id: "fp3-1", name: "Theo Ked", seat: "18A" },
      { id: "fp3-2", name: "Karoll Ked", seat: "18B" },
      { id: "fp3-3", name: "Gabi Ked", seat: "18C" },
      { id: "fp3-4", name: "Lelê Ked", seat: "18D" }
    ]
  },
  {
    id: "f4",
    airline: "Avianca",
    flightCode: "AV 248",
    departureCity: "São Paulo",
    departureCode: "GRU",
    departureTime: "18:25",
    arrivalCity: "Bogotá",
    arrivalCode: "BOG",
    arrivalTime: "22:45",
    duration: "6h 20min",
    dateStr: "2026-06-30",
    arrivalDateStr: "2026-06-30",
    status: "Confirmado",
    gate: "B18",
    locator: "AVBOG2",
    passengers: "Grupo 2 (César, Rogéria, Fabrício, Neusa)",
    passengersList: [
      { id: "fp4-1", name: "César Ferreira", seat: "20A" },
      { id: "fp4-2", name: "Rogéria Ferreira", seat: "20B" },
      { id: "fp4-3", name: "Fabrício Ferreira", seat: "20C" },
      { id: "fp4-4", name: "Neusa Chucre", seat: "20D" }
    ]
  },
  {
    id: "f5",
    airline: "Avianca",
    flightCode: "AV 242",
    departureCity: "Bogotá",
    departureCode: "BOG",
    departureTime: "23:55",
    arrivalCity: "Washington DC",
    arrivalCode: "IAD",
    arrivalTime: "07:10 (+1)",
    duration: "6h 15min",
    dateStr: "2026-06-30",
    arrivalDateStr: "2026-07-01",
    status: "Confirmado",
    gate: "C12",
    locator: "AVIAD1",
    passengers: "Grupo 1 (Theo, Karoll, Gabi, Lelê)",
    passengersList: [
      { id: "fp5-1", name: "Theo Ked", seat: "15A" },
      { id: "fp5-2", name: "Karoll Ked", seat: "15B" },
      { id: "fp5-3", name: "Gabi Ked", seat: "15C" },
      { id: "fp5-4", name: "Lelê Ked", seat: "15D" }
    ]
  },
  {
    id: "f6",
    airline: "Avianca",
    flightCode: "AV 242",
    departureCity: "Bogotá",
    departureCode: "BOG",
    departureTime: "23:55",
    arrivalCity: "Washington DC",
    arrivalCode: "IAD",
    arrivalTime: "07:10 (+1)",
    duration: "6h 15min",
    dateStr: "2026-06-30",
    arrivalDateStr: "2026-07-01",
    status: "Confirmado",
    gate: "C12",
    locator: "AVIAD2",
    passengers: "Grupo 2 (César, Rogéria, Fabrício, Neusa)",
    passengersList: [
      { id: "fp6-1", name: "César Ferreira", seat: "16A" },
      { id: "fp6-2", name: "Rogéria Ferreira", seat: "16B" },
      { id: "fp6-3", name: "Fabrício Ferreira", seat: "16C" },
      { id: "fp6-4", name: "Neusa Chucre", seat: "16D" }
    ]
  },
  {
    id: "f7",
    airline: "Avianca",
    flightCode: "AV 243",
    departureCity: "Washington DC",
    departureCode: "IAD",
    departureTime: "08:30",
    arrivalCity: "Bogotá",
    arrivalCode: "BOG",
    arrivalTime: "13:40",
    duration: "6h 10min",
    dateStr: "2026-07-20",
    arrivalDateStr: "2026-07-20",
    status: "Confirmado",
    gate: "B04",
    locator: "AVRET1",
    passengers: "Grupo 1 (Theo, Karoll, Gabi, Lelê)",
    passengersList: [
      { id: "fp7-1", name: "Theo Ked", seat: "12A" },
      { id: "fp7-2", name: "Karoll Ked", seat: "12B" },
      { id: "fp7-3", name: "Gabi Ked", seat: "12C" },
      { id: "fp7-4", name: "Lelê Ked", seat: "12D" }
    ]
  },
  {
    id: "f8",
    airline: "Avianca",
    flightCode: "AV 243",
    departureCity: "Washington DC",
    departureCode: "IAD",
    departureTime: "08:30",
    arrivalCity: "Bogotá",
    arrivalCode: "BOG",
    arrivalTime: "13:40",
    duration: "6h 10min",
    dateStr: "2026-07-20",
    arrivalDateStr: "2026-07-20",
    status: "Confirmado",
    gate: "B04",
    locator: "AVRET2",
    passengers: "Grupo 2 (César, Rogéria, Fabrício, Neusa)",
    passengersList: [
      { id: "fp8-1", name: "César Ferreira", seat: "14A" },
      { id: "fp8-2", name: "Rogéria Ferreira", seat: "14B" },
      { id: "fp8-3", name: "Fabrício Ferreira", seat: "14C" },
      { id: "fp8-4", name: "Neusa Chucre", seat: "14D" }
    ]
  },
  {
    id: "f9",
    airline: "Avianca",
    flightCode: "AV 249",
    departureCity: "Bogotá",
    departureCode: "BOG",
    departureTime: "15:20",
    arrivalCity: "São Paulo",
    arrivalCode: "GRU",
    arrivalTime: "23:35",
    duration: "6h 15min",
    dateStr: "2026-07-20",
    arrivalDateStr: "2026-07-20",
    status: "Confirmado",
    gate: "A10",
    locator: "AVGRU1",
    passengers: "Grupo 1 (Theo, Karoll, Gabi, Lelê)",
    passengersList: [
      { id: "fp9-1", name: "Theo Ked", seat: "18A" },
      { id: "fp9-2", name: "Karoll Ked", seat: "18B" },
      { id: "fp9-3", name: "Gabi Ked", seat: "18C" },
      { id: "fp9-4", name: "Lelê Ked", seat: "18D" }
    ]
  },
  {
    id: "f10",
    airline: "Avianca",
    flightCode: "AV 249",
    departureCity: "Bogotá",
    departureCode: "BOG",
    departureTime: "15:20",
    arrivalCity: "São Paulo",
    arrivalCode: "GRU",
    arrivalTime: "23:35",
    duration: "6h 15min",
    dateStr: "2026-07-20",
    arrivalDateStr: "2026-07-20",
    status: "Confirmado",
    gate: "A10",
    locator: "AVGRU2",
    passengers: "Grupo 2 (César, Rogéria, Fabrício, Neusa)",
    passengersList: [
      { id: "fp10-1", name: "César Ferreira", seat: "20A" },
      { id: "fp10-2", name: "Rogéria Ferreira", seat: "20B" },
      { id: "fp10-3", name: "Fabrício Ferreira", seat: "20C" },
      { id: "fp10-4", name: "Neusa Chucre", seat: "20D" }
    ]
  },
  {
    id: "f11",
    airline: "LATAM Airlines",
    flightCode: "LA 3015",
    departureCity: "São Paulo",
    departureCode: "GRU",
    departureTime: "08:15",
    arrivalCity: "Florianópolis",
    arrivalCode: "FLN",
    arrivalTime: "09:30",
    duration: "1h 15min",
    dateStr: "2026-07-21",
    arrivalDateStr: "2026-07-21",
    status: "Confirmado",
    gate: "D02",
    locator: "LARET1",
    passengers: "Grupo 1 (Theo, Karoll, Gabi, Lelê)",
    passengersList: [
      { id: "fp11-1", name: "Theo Ked", seat: "10A" },
      { id: "fp11-2", name: "Karoll Ked", seat: "10B" },
      { id: "fp11-3", name: "Gabi Ked", seat: "10C" },
      { id: "fp11-4", name: "Lelê Ked", seat: "10D" }
    ]
  },
  {
    id: "f12",
    airline: "LATAM Airlines",
    flightCode: "LA 3017",
    departureCity: "São Paulo",
    departureCode: "GRU",
    departureTime: "08:45",
    arrivalCity: "Florianópolis",
    arrivalCode: "FLN",
    arrivalTime: "10:00",
    duration: "1h 15min",
    dateStr: "2026-07-21",
    arrivalDateStr: "2026-07-21",
    status: "Confirmado",
    gate: "D04",
    locator: "LARET2",
    passengers: "Grupo 2 (César, Rogéria, Fabrício, Neusa)",
    passengersList: [
      { id: "fp12-1", name: "César Ferreira", seat: "12A" },
      { id: "fp12-2", name: "Rogéria Ferreira", seat: "12B" },
      { id: "fp12-3", name: "Fabrício Ferreira", seat: "12C" },
      { id: "fp12-4", name: "Neusa Chucre", seat: "12D" }
    ]
  },
  {
    id: "f13",
    airline: "Avianca",
    flightCode: "AV 85",
    departureCity: "São Paulo",
    departureCode: "GRU",
    departureTime: "01:20",
    arrivalCity: "Bogotá",
    arrivalCode: "BOG",
    arrivalTime: "05:40",
    duration: "6h 20min",
    dateStr: "2026-06-30",
    arrivalDateStr: "2026-06-30",
    status: "Cancelado",
    gate: "-",
    locator: "AVCAN1",
    passengers: "Grupo 1 (Original Cancelado)",
    passengersList: [
      { id: "fp13-1", name: "Theo Ked", seat: "-" },
      { id: "fp13-2", name: "Karoll Ked", seat: "-" },
      { id: "fp13-3", name: "Gabi Ked", seat: "-" },
      { id: "fp13-4", name: "Lelê Ked", seat: "-" }
    ]
  }
];

import { CostCategory } from '../types';

export const INITIAL_COST_CATEGORIES: CostCategory[] = [
  { id: "hotel", label: "Hospedagem / Hotel", color: "#6366F1" }, // Indigo
  { id: "flight", label: "Passagens Aéreas", color: "#3B82F6" }, // Blue
  { id: "car", label: "Transporte / Aluguel Carro", color: "#10B981" }, // Emerald
  { id: "activity", label: "Atividades / Lazer", color: "#F59E0B" }, // Amber
  { id: "other", label: "Outros", color: "#94A3B8" } // Slate
];

export const INITIAL_COSTS: CostItem[] = [
  {
    id: "c1",
    category: "flight",
    description: "Passagem ida GRU-IAD",
    notes: "123 milhas",
    link: "https://voarfacil.net/eticket/af017a9fae8ea74051",
    totalCostBRL: 7104.38,
    status: "Pago"
  },
  {
    id: "c2",
    category: "flight",
    description: "Passagem volta IAD-GRU",
    notes: "123 milhas",
    link: "https://voarfacil.net/eticket/29671fa28115bc56el",
    totalCostBRL: 7087.04,
    status: "Pago"
  },
  {
    id: "c3",
    category: "flight",
    description: "Passagem ida FLN-GRU",
    notes: "Latam",
    totalCostBRL: 1702.88,
    status: "Pago"
  },
  {
    id: "c4",
    category: "flight",
    description: "Passagem volta CGH-FLN",
    link: "https://voarfacil.net/eticket/66250fb397590e2fc1",
    totalCostBRL: 1956.40,
    status: "Pago"
  },
  {
    id: "c5",
    category: "car",
    description: "Aluguel Carro",
    notes: "Retirada no aeroporto",
    totalCostBRL: 11318.58,
    status: "Pago"
  },
  {
    id: "c6",
    category: "hotel",
    description: "Aero Hotel",
    notes: "Aeroporto",
    link: "https://maps.app.goo.gl/zCvhCQdebLqXVNNn6",
    totalCostBRL: 663.00,
    status: "Pgto no local",
    dateRange: "30 jun. - 01 jul."
  },
  {
    id: "c7",
    category: "hotel",
    description: "Ivy City Hotel (Washington, D.C.)",
    notes: "Atividades Washington",
    link: "https://maps.app.goo.gl/JjmaY94xRZaQaXx8",
    totalCostBRL: 4059.00,
    status: "Pago",
    dateRange: "01 jul. - 04 jul.",
    destinationId: "d1"
  },
  {
    id: "c8",
    category: "hotel",
    description: "Hotel Moca NYC (New York, NY)",
    notes: "Atividades Nova York - 1ª estadia",
    link: "https://maps.app.goo.gl/DDUcHtGSR7Q44zQ5A",
    totalCostBRL: 12211.87,
    status: "Pago",
    dateRange: "04 jul. - 11 jul.",
    destinationId: "d2"
  },
  {
    id: "c9",
    category: "hotel",
    description: "BRAND NEW Modern 2BR - Heart of Center City (Philadelphia, PA)",
    notes: "Atividades Filadélfia",
    link: "https://maps.app.goo.gl/4rGhwPKzkCh54e8u9",
    totalCostBRL: 3495.00,
    status: "Pago",
    dateRange: "11 jul. - 13 jul.",
    destinationId: "d3"
  },
  {
    id: "c10",
    category: "hotel",
    description: "Clarion Inn Atlantic City - Beach and Boardwalk (Atlantic City, NJ)",
    notes: "Atividades Atlantic City",
    link: "https://maps.app.goo.gl/8vsJvPuT9LBo4QTv7",
    totalCostBRL: 4112.00,
    status: "Pago",
    dateRange: "13 jul. - 16 jul.",
    destinationId: "d4"
  },
  {
    id: "c11",
    category: "hotel",
    description: "Hotel Moca NYC (New York, NY) - 2ª estadia",
    notes: "Atividades Nova York (2ª estada)",
    link: "https://maps.app.goo.gl/DDUcHtGSR7Q44zQ5A",
    totalCostBRL: 7506.00,
    status: "Pago",
    dateRange: "16 jul. - 20 jul.",
    destinationId: "d5"
  },
  {
    id: "c12",
    category: "hotel",
    description: "Fairfield Inn Dulles Airport Chantilly (Chantilly, VA)",
    notes: "Atividades Chantilly",
    link: "https://maps.app.goo.gl/3MZUQUFTzA5m8ijp9",
    totalCostBRL: 1227.00,
    status: "Pago",
    dateRange: "20 jul. - 21 jul.",
    destinationId: "d6"
  },
  {
    id: "c13",
    category: "hotel",
    description: "Hotel Boutique CGH Aeroporto (Bogotá)",
    notes: "Aeroporto (Retorno)",
    link: "https://maps.app.goo.gl/TUXzaKGw2CzzMh7Y9",
    totalCostBRL: 1313.00,
    status: "Pgto no local",
    dateRange: "21 jul. - 23 jul."
  }
];

export const INITIAL_TIPS: GeneralTip[] = [
  {
    id: "tip1",
    category: "Nova York",
    title: "Classificação Sanitária de Restaurantes",
    content: `**Nota A:** É a melhor classificação possível. Significa que o restaurante teve pouquíssimas ou nenhuma violação sanitária durante a inspeção. A grande maioria dos restaurantes da cidade possui essa nota.

**Nota B:** Indica que foram encontradas algumas irregularidades que precisam ser corrigidas, como problemas de armazenamento de alimentos, limpeza ou controle de temperatura.

**Nota C:** Mostra que o estabelecimento teve um número maior de violações nas inspeções. Isso não significa necessariamente que o local é perigoso, mas indica que há problemas que precisam ser resolvidos.`
  },
  {
    id: "tip2",
    category: "Nova York",
    title: "Teleférico de Roosevelt Island (Roosevelt Island Tramway)",
    content: `> O eléctrico de Roosevelt Island.
Custa **$3.00** por trajeto e demora apenas **quatro minutos**. Oferece uma das melhores vistas do horizonte de Manhattan que você pode obter.

Isto não é apenas uma atração turística. É um verdadeiro teleférico que os moradores usam para chegar ao trabalho todos os dias. É exatamente por isso que a maioria dos visitantes nunca o encontra.

Você embarca na **East 59th Street com a 2nd Avenue**, bem ao lado da Ponte Queensboro. O bonde leva você sobre o East River, acima do tráfego, acima do barulho. O horizonte abre-se em ambas as direções. Ele funciona com o cartão de metrô padrão normal (MetroCard), pelo mesmo preço do metrô comum. Sem bilhete extra, sem filas grandes, sem pacotes de turismo caros.

*Dica de Ouro:* Vá à noite se puder. A luz refletida nos edifícios é espetacular lá de cima!`
  },
  {
    id: "tip_ny_cost_est",
    category: "Nova York",
    title: "Estimativas e Planejamento de Custos (7 dias)",
    content: `Abaixo está o planejamento oficial de custos individuais estimados para a estadia em Nova York:

🎟️ **Atrações pagas**: US$ 150–200 *(Reserve com antecedência pelo site oficial)*
🍔 **Alimentação (7 dias)**: US$ 350–500 *(Média de US$ 50–70/dia incluindo café da manhã no hotel)*
🚇 **Transporte interno**: US$ 70–120 *(Passe semanal ilimitado do metrô OMNY / MetroCard: US$ 34)*
🛍️ **Compras**: Variável *(Planeje um orçamento separado)*
💵 **Custo gorjeta (tips)**: US$ 60–90 *(Obrigatório em restaurantes nos EUA, sugerido entre 15% e 20%)*

📊 **TOTAL ESTIMADO**: **US$ 630–910 por pessoa** (Variável conforme gastos pessoais e compras)`
  },
  {
    id: "tip_ny_metro",
    category: "Nova York",
    title: "🚇 Funcionamento do Metrô (24h) & OMNY",
    content: `O metrô de Nova York opera **24 horas por dia, 7 dias por semana**. 

**Dica de Ouro:** Não precisa comprar cartão físico MetroCard! Você pode usar o sistema **OMNY**, basta aproximar seu cartão de crédito/débito contactless, celular ou smartwatch diretamente na catraca. O sistema possui limite de cobrança semanal automática após 12 viagens.`
  },
  {
    id: "tip_ny_apps",
    category: "Nova York",
    title: "📱 Aplicativos Recomendados Essenciais",
    content: `Para evitar estresse e se locomover como um morador local, instale estes aplicativos no seu celular:
- **Google Maps** (Navegação geral e horários)
- **Citymapper** (Melhor app de rotas de transporte público detalhadas)
- **NYC Subway Map** (Visualização offline do mapa de metrô)
- **Yelp** & **OpenTable** (Descoberta de locais e reservas em restaurantes)`
  },
  {
    id: "tip_ny_tkts",
    category: "Nova York",
    title: "🎟️ Espetáculos Broadway com Desconto (TKTS)",
    content: `Quer assistir a um espetáculo na Broadway sem pagar fortunas?

O quiosque **TKTS na Times Square** (embaixo da escadaria vermelha) vende ingressos oficiais com descontos de **até 50%** para apresentações do próprio dia. Chegue cedo para pegar as melhores opções de lugares.`
  },
  {
    id: "tip_ny_clothing",
    category: "Nova York",
    title: "🧥 Vestuário Inteligente e Clima Interno",
    content: `**Vista-se em camadas!** 

Mesmo no verão, o ar-condicionado interno de lojas, restaurantes, teatros e vagões de metrô nos EUA é extremamente frio. Carregar uma jaqueta leve ou moletom na mochila evita que você sinta frio ao entrar nos locais.`
  },
  {
    id: "tip_ny_skyline",
    category: "Nova York",
    title: "📸 Melhores Ângulos para Fotos do Skyline",
    content: `Garanta as melhores memórias e fotos do horizonte de Manhattan sem custos absurdos:
1. **DUMBO (Brooklyn):** Vista maravilhosa sob as pontes de Brooklyn e Manhattan.
2. **High Line:** Caminhada elevada cercada por arquitetura e vistas icônicas.
3. **Top of the Rock:** Clássico mirante de onde você vê o Empire State por inteiro.`
  },
  {
    id: "tip_ny_bank_travel",
    category: "Geral",
    title: "💳 Aviso de Viagem ao Banco",
    content: `**Não se esqueça!** 

Avise seu banco sobre sua viagem internacional antes de embarcar para evitar o bloqueio preventivo de segurança dos seus cartões de crédito/débito ao tentar fazer compras nos EUA.`
  },
  {
    id: "tip_ny_walking",
    category: "Nova York",
    title: "🥾 Logística Urbana: Use Tênis Confortáveis",
    content: `Nova York é uma cidade projetada para se caminhar! É muito comum andar de **12km a 20km por dia** entre atrações e estações de metrô. 

Deixe sapatos pesados no hotel e use o seu tênis mais leve e confortável para evitar bolhas ou cansaço excessivo.`
  },
  {
    id: "tip_ny_safety",
    category: "Nova York",
    title: "⚠️ Segurança e Cuidado com Pertences",
    content: `Nova York é geralmente muito segura, mas em áreas turísticas superlotadas como a **Times Square**, grandes museus e dentro do **metrô**, bolsistas e batedores de carteira atuam.

Tenha atenção redobrada com carteiras no bolso de trás, mochilas abertas e celulares soltos nas mesas de restaurantes.`
  },
  {
    id: "tip3",
    category: "Geral",
    title: "Diretrizes sobre Chip de Internet e Roaming",
    content: "Lembre-se de ativar o chip internacional eSIM antes de desembarcar em Washington (IAD) para garantir comunicação instantânea com o grupo de viajantes através do aplicativo."
  }
];

export const INITIAL_DESTINATIONS: Destination[] = [
  {
    id: "d1",
    city: "Washington",
    state: "District of Columbia",
    country: "EUA",
    dates: "01 jul. - 04 jul.",
    hotelName: "Ivy City Hotel",
    hotelLink: "https://maps.app.goo.gl/JjmaY94xRZaQaXx8",
    hotelAddress: "2002 New York Ave NE, Washington, DC 20002",
    hotelCoords: { lat: 38.9189, lng: -76.9741 },
    notes: "Atividades em Washington D.C. centradas nos marcos políticos e históricos.",
    days: [
      {
        id: "d1y1",
        dayNumber: 1,
        dateStr: "Quarta, 01 de Julho",
        title: "Capitol Hill & Biblioteca do Congresso",
        activities: [
          {
            id: "act1",
            time: "08:30",
            location: "Alinhamento de Grupo",
            duration: "15 min",
            cost: "—",
            notes: "Alinhamento com o grupo e saída pontual nos carros alugados."
          },
          {
            id: "act2",
            time: "09:00",
            location: "Capitólio dos EUA (Tour Guiado)",
            duration: "1h30",
            cost: "Gratuito (Reservado)",
            mapsQuery: "United States Capitol",
            websiteLink: "https://www.visitthecapitol.gov",
            parking: "Ruas East Capitol St SE — 2h gratuito (residencial)",
            notes: "Acesso por e-tickets salvos no Painel de Documentos."
          },
          {
            id: "act3",
            time: "11:00",
            location: "Biblioteca do Congresso (Bíblia de Gutenberg)",
            duration: "1h",
            cost: "Gratuito",
            mapsQuery: "Library of Congress",
            notes: "Bíblia de Gutenberg fica em exibição no segundo pavimento."
          },
          {
            id: "act4",
            time: "12:30",
            location: "Almoço — Union Station Food Hall",
            duration: "1h15",
            cost: "US$ 15-25/pess.",
            mapsQuery: "Union Station Washington",
            notes: "Várias opções gastronômicas rápidas para o grupo de 8 pessoas."
          },
          {
            id: "act5",
            time: "14:15",
            location: "Suprema Corte dos EUA",
            duration: "45 min",
            cost: "Gratuito",
            mapsQuery: "Supreme Court of the United States"
          },
          {
            id: "act6",
            time: "15:15",
            location: "Jardim Botânico dos EUA",
            duration: "1h",
            cost: "Gratuito",
            mapsQuery: "United States Botanic Garden"
          },
          {
            id: "act1_new1",
            time: "16:45",
            location: "Museu dos Arquivos Nacionais (National Archives)",
            duration: "1h15",
            cost: "Gratuito",
            mapsQuery: "National Archives Museum",
            notes: "Onde estão expostos os documentos originais históricos dos EUA: Declaração de Independência e Constituição!"
          },
          {
            id: "act1_new2",
            time: "18:30",
            location: "Jantar de Boas-vindas em Penn Quarter / Chinatown",
            duration: "2h",
            cost: "Consumo",
            mapsQuery: "Penn Quarter Washington DC",
            notes: "Festa e confraternização do grupo no primeiro jantar oficial em Washington D.C."
          }
        ]
      },
      {
        id: "d1y2",
        dayNumber: 2,
        dateStr: "Quinta, 02 de Julho",
        title: "National Mall & Monumentos de Memorial",
        activities: [
          {
            id: "act2_1",
            time: "09:00",
            location: "Monumento a Washington (Obelisco)",
            duration: "1h",
            cost: "Gratuito",
            mapsQuery: "Washington Monument"
          },
          {
            id: "act2_new1",
            time: "10:15",
            location: "Memorial Martin Luther King, Jr. & Tidal Basin",
            duration: "1h",
            cost: "Gratuito",
            mapsQuery: "Martin Luther King, Jr. Memorial",
            notes: "Caminhada agradável ao redor da Tidal Basin, passando pelos memoriais MLK, FDR e Guerra da Coreia."
          },
          {
            id: "act2_2",
            time: "11:30",
            location: "Memorial do Lincoln e Espelho d'Água",
            duration: "1h15",
            cost: "Gratuito",
            mapsQuery: "Lincoln Memorial",
            notes: "Escadaria icônica e vista majestosa do espelho d'água refletindo o obelisco."
          },
          {
            id: "act2_3",
            time: "13:00",
            location: "Almoço no The Wharf Washington",
            duration: "1h30",
            cost: "US$ 25-40/pess.",
            mapsQuery: "The Wharf Washington",
            notes: "Área moderna à beira da água com excelentes opções gastronômicas"
          },
          {
            id: "act2_4",
            time: "15:00",
            location: "Smithsonian Museu Nacional de História Natural",
            duration: "2h30",
            cost: "Gratuito",
            mapsQuery: "National Museum of Natural History"
          },
          {
            id: "act2_new2",
            time: "18:00",
            location: "Passeio de Fim de Tarde em Georgetown & Jantar",
            duration: "2h30",
            cost: "Consumo",
            mapsQuery: "Georgetown Waterfront Park",
            notes: "Parada na famosa Georgetown Cupcake e passeio à beira-rio no bairro histórico."
          }
        ]
      },
      {
        id: "d1y3",
        dayNumber: 3,
        dateStr: "Sexta, 03 de Julho",
        title: "White House Vista & Museus Smithsonian",
        activities: [
          {
            id: "act3_1",
            time: "09:30",
            location: "Smithsonian Museu Nacional do Ar e Espaço",
            duration: "2h",
            cost: "Gratuito (Reservado)",
            mapsQuery: "National Air and Space Museum",
            notes: "Incrivelmente interativo para todo o grupo."
          },
          {
            id: "act3_2",
            time: "11:45",
            location: "Almoço rápido de Food Trucks no Mall",
            duration: "1h",
            cost: "US$ 10-15/pess.",
            mapsQuery: "National Mall Food Trucks"
          },
          {
            id: "act3_3",
            time: "13:00",
            location: "Fachada da Casa Branca (The White House)",
            duration: "1h",
            cost: "Gratuito",
            mapsQuery: "The White House",
            notes: "Foto externa do portão norte (President's Park)."
          },
          {
            id: "act3_new1",
            time: "14:30",
            location: "Cemitério Nacional de Arlington & Memorial Iwo Jima",
            duration: "2h",
            cost: "Gratuito",
            mapsQuery: "Arlington National Cemetery",
            notes: "Túmulo do presidente John F. Kennedy e cerimônia solene de Troca da Guarda no Túmulo do Soldado Desconhecido."
          },
          {
            id: "act3_4",
            time: "17:00",
            location: "Memorial Thomas Jefferson",
            duration: "1h",
            cost: "Gratuito",
            mapsQuery: "Thomas Jefferson Memorial"
          },
          {
            id: "act3_new2",
            time: "18:35",
            location: "Compras & Jantar no Pentagon City Mall",
            duration: "3h",
            cost: "Consumo",
            mapsQuery: "Fashion Centre at Pentagon City",
            notes: "Grandes marcas, praça de alimentação fantástica e excelentes restaurantes locais para compras de grupo."
          }
        ]
      }
    ]
  },
  {
    id: "d2",
    city: "New York",
    state: "New York",
    country: "EUA",
    dates: "04 jul. - 11 jul.",
    hotelName: "Hotel Moca NYC",
    hotelLink: "https://maps.app.goo.gl/DDUcHtGSR7Q44zQ5A",
    hotelAddress: "137-33 37th Ave, Queens, NY 11354",
    hotelCoords: { lat: 40.7621, lng: -73.8302 },
    notes: "Primeiro período de estadia em Nova York com foco no feriado do 4 de Julho, Central Park e pontos clássicos do sul de Manhattan.",
    days: [
      {
        id: "d2y1",
        dayNumber: 1,
        dateStr: "Sábado, 04 de Julho",
        title: "Deslocamento e Show de Fogos Macy's",
        activities: [
          {
            id: "act4_1",
            time: "09:00",
            location: "Partida de Washington para Nova York",
            duration: "4h30",
            cost: "Pedágios",
            notes: "Deslocamento de carro pelo corredor I-95."
          },
          {
            id: "act4_2",
            time: "14:30",
            location: "Check-in Hotel Moca NYC",
            duration: "1h",
            cost: "Pago (Reserva)",
            mapsQuery: "Hotel Moca NYC",
            notes: "Inclusão das bagagens e check-in do grupo completo de 8 viajantes."
          },
          {
            id: "act4_3",
            time: "18:30",
            location: "Macy's 4th of July Fireworks Preview",
            duration: "3h",
            cost: "Gratuito",
            mapsQuery: "East River State Park Macy's Fireworks View Point",
            notes: "Espetáculo tradicional de queima de fogos da Independência Americana sobre o East River."
          }
        ]
      },
      {
        id: "d2y2",
        dayNumber: 2,
        dateStr: "Domingo, 05 de Julho",
        title: "Central Park & Times Square",
        activities: [
          {
            id: "act4_4",
            time: "09:30",
            location: "Manhã no Central Park (Strawberry Fields)",
            duration: "3h",
            cost: "Gratuito",
            mapsQuery: "Central Park Strawberry Fields",
            notes: "Caminhar pelo mosaico 'Imagine' em homenagem a John Lennon, seguido por Bethesda Terrace e Fountain."
          },
          {
            id: "act4_5",
            time: "13:00",
            location: "Almoço no Shake Shack (Midtown)",
            duration: "1h",
            cost: "US$ 15-22/pess.",
            mapsQuery: "Shake Shack Theater District"
          },
          {
            id: "act4_6",
            time: "14:30",
            location: "Visita ao MoMA (Museu de Arte Moderna)",
            duration: "2h30",
            cost: "US$ 25",
            mapsQuery: "Museum of Modern Art"
          },
          {
            id: "act4_7",
            time: "19:00",
            location: "Times Square e Passeio Noturno Broadway",
            duration: "2h",
            cost: "Gratuito",
            mapsQuery: "Times Square",
            notes: "Luzes e telões da Times Square, lojas M&M's World e Hershey's Chocolate World."
          }
        ]
      },
      {
        id: "d2y3",
        dayNumber: 3,
        dateStr: "Segunda, 06 de Julho",
        title: "Estátua da Liberdade & Financial District",
        activities: [
          {
            id: "act4_8",
            time: "08:30",
            location: "Embarque de Balsa para Estátua da Liberdade",
            duration: "3h30",
            cost: "Balsa reservada ($24)",
            mapsQuery: "The Battery Park Statue of Liberty Ferry",
            notes: "Visita à Ellis Island e à Estátua da Liberdade."
          },
          {
            id: "act4_9",
            time: "12:30",
            location: "Almoço no Financial District (Stone Street)",
            duration: "1h15",
            cost: "US$ 20-30/pess.",
            mapsQuery: "Stone Street Financial District"
          },
          {
            id: "act4_10",
            time: "14:00",
            location: "Wall Street & Touro de Bronze",
            duration: "1h",
            cost: "Gratuito",
            mapsQuery: "Charging Bull Wall Street"
          },
          {
            id: "act4_11",
            time: "15:30",
            location: "9/11 Memorial Plaza & Oculus de Calatrava",
            duration: "1h30",
            cost: "Gratuito",
            mapsQuery: "National September 11 Memorial & Museum"
          }
        ]
      },
      {
        id: "d2y4",
        dayNumber: 4,
        dateStr: "Terça, 07 de Julho",
        title: "High Line, Chelsea Market & Little Island",
        activities: [
          {
            id: "act4_12",
            time: "10:00",
            location: "High Line Park (Parque Suspenso)",
            duration: "1h30",
            cost: "Gratuito",
            mapsQuery: "The High Line Park Entrance"
          },
          {
            id: "act4_13",
            time: "11:45",
            location: "Chelsea Market & Little Island",
            duration: "2h",
            cost: "Entrada gratuita / refeições paid",
            mapsQuery: "Chelsea Market",
            notes: "Almoço livre dentro do Chelsea Market com mais de 30 opções gourmet."
          },
          {
            id: "act4_14",
            time: "14:30",
            location: "Little Island (Pier 55)",
            duration: "1h",
            cost: "Gratuito",
            mapsQuery: "Little Island Park"
          },
          {
            id: "act4_15",
            time: "16:00",
            location: "Vessel & Hudson Yards",
            duration: "1h30",
            cost: "Gratuito (Área externa)",
            mapsQuery: "The Vessel NYC"
          }
        ]
      },
      {
        id: "d2y5",
        dayNumber: 5,
        dateStr: "Quarta, 08 de Julho",
        title: "Rockefeller Center & Catedral de St. Patrick",
        activities: [
          {
            id: "act4_16",
            time: "09:30",
            location: "Caminhada pela 5ª Avenida & St. Patrick's",
            duration: "1h15",
            cost: "Gratuito",
            mapsQuery: "St. Patrick's Cathedral"
          },
          {
            id: "act4_17",
            time: "11:00",
            location: "Observatório Top of the Rock",
            duration: "2h",
            cost: "Pago ($40/pess)",
            mapsQuery: "Top of the Rock Rockefeller",
            notes: "Vista panorâmica 360 do Central Park e do Empire State."
          },
          {
            id: "act4_18",
            time: "13:30",
            location: "Almoço nas proximidades de Midtown",
            duration: "1h",
            cost: "US$ 15-25"
          },
          {
            id: "act4_19",
            time: "15:00",
            location: "Visita à New York Public Library & Bryant Park",
            duration: "1h30",
            cost: "Gratuito",
            mapsQuery: "New York Public Library Stephen A. Schwarzman Building"
          }
        ]
      },
      {
        id: "d2y6",
        dayNumber: 6,
        dateStr: "Quinta, 09 de Julho",
        title: "Ponte do Brooklyn & DUMBO",
        activities: [
          {
            id: "act4_20",
            time: "09:00",
            location: "Travessia a pé da Brooklyn Bridge",
            duration: "1h30",
            cost: "Gratuito",
            mapsQuery: "Brooklyn Bridge Walker Entrance"
          },
          {
            id: "act4_21",
            time: "11:00",
            location: "DUMBO (Foto icônica Washington St)",
            duration: "1h",
            cost: "Gratuito",
            mapsQuery: "DUMBO Manhattan Bridge View Point"
          },
          {
            id: "act4_22",
            time: "12:15",
            location: "Almoço na Grimaldi's Pizza ou Juliana's",
            duration: "1h15",
            cost: "US$ 15-25/pess.",
            mapsQuery: "Juliana's Pizza DUMBO",
            notes: "As duas melhores pizzarias no estilo forno a carvão de NY, vizinhas."
          },
          {
            id: "act4_23",
            time: "14:00",
            location: "Caminhada pelo Brooklyn Bridge Park",
            duration: "2h",
            cost: "Gratuito",
            mapsQuery: "Brooklyn Bridge Park"
          }
        ]
      },
      {
        id: "d2y7",
        dayNumber: 7,
        dateStr: "Sexta, 10 de Julho",
        title: "Grand Central Terminal & Summit Vanderbilt",
        activities: [
          {
            id: "act4_24",
            time: "10:00",
            location: "Grand Central Terminal (Estação Histórica)",
            duration: "1h15",
            cost: "Gratuito",
            mapsQuery: "Grand Central Terminal",
            notes: "Ver o teto das constelações e a Whispering Gallery."
          },
          {
            id: "act4_25",
            time: "11:30",
            location: "Chrysler Building (Área externa)",
            duration: "30 min",
            cost: "Gratuito",
            mapsQuery: "Chrysler Building"
          },
          {
            id: "act4_26",
            time: "12:30",
            location: "Almoço no Food Hall de Grand Central",
            duration: "1h",
            cost: "US$ 15-25"
          },
          {
            id: "act4_27",
            time: "14:00",
            location: "Observatório Moderno SUMMIT One Vanderbilt",
            duration: "2h",
            cost: "Pago ($45)",
            mapsQuery: "SUMMIT One Vanderbilt"
          }
        ]
      }
    ]
  },
  {
    id: "d3",
    city: "Philadelphia",
    state: "Pennsylvania",
    country: "EUA",
    dates: "11 jul. - 13 jul.",
    hotelName: "BRAND NEW Modern 2BR",
    hotelLink: "https://maps.app.goo.gl/4rGhwPKzkCh54e8u9",
    hotelAddress: "1200 Block of Center City, Philadelphia, PA 19107",
    hotelCoords: { lat: 39.9526, lng: -75.1652 },
    notes: "Hospedagem no coração da cidade com acesso rápido a pontos históricos como Liberty Bell e gastronomia tradicional da Filadélfia.",
    days: [
      {
        id: "d3y1",
        dayNumber: 1,
        dateStr: "Sábado, 11 de Julho",
        title: "História Americana: Liberty Bell & Independence Hall",
        activities: [
          {
            id: "act5_1",
            time: "10:00",
            location: "Viagem de Nova York para Filadélfia",
            duration: "2h30",
            cost: "Pedágios",
            notes: "Deslocamento terrestre de carro."
          },
          {
            id: "act5_2",
            time: "13:00",
            location: "Check-in na Modern 2BR (Philadelphia Centre)",
            duration: "1h",
            cost: "Pago (Reserva)"
          },
          {
            id: "act5_3",
            time: "14:30",
            location: "Sino do Sino da Liberdade (Liberty Bell Pavilion)",
            duration: "1h15",
            cost: "Gratuito",
            mapsQuery: "Liberty Bell Center Philadelphia",
            notes: "Ver de perto o símbolo espetacular da abolição e independência."
          },
          {
            id: "act5_4",
            time: "16:00",
            location: "Independence Hall Vista Externa",
            duration: "1h",
            cost: "Gratuito",
            mapsQuery: "Independence Hall Philadelphia"
          }
        ]
      },
      {
        id: "d3y2",
        dayNumber: 2,
        dateStr: "Domingo, 12 de Julho",
        title: "Escadaria de Rocky Balboa & Reading Terminal Market",
        activities: [
          {
            id: "act5_5",
            time: "09:30",
            location: "Estátua e Escadaria do Rocky (Philly Museum of Art)",
            duration: "1h30",
            cost: "Gratuito",
            mapsQuery: "Rocky Statue Philadelphia",
            notes: "Tirar fotos com a estátua icônica de Rocky Balboa e correr a mítica escadaria."
          },
          {
            id: "act5_6",
            time: "12:00",
            location: "Almoço no Reading Terminal Market",
            duration: "1h45",
            cost: "US$ 15-25/pess.",
            mapsQuery: "Reading Terminal Market",
            notes: "Experimentar o autêntico Philly Cheesesteak no Tommy DiNic's ou Carmen's."
          },
          {
            id: "act5_7",
            time: "14:30",
            location: "Prisão Histórica Eastern State Penitentiary",
            duration: "2h",
            cost: "Pago ($19/pess)",
            mapsQuery: "Eastern State Penitentiary",
            notes: "A famosa ruína de arquitetura prisional gótica onde Al Capone ficou preso."
          },
          {
            id: "act5_8",
            time: "17:00",
            location: "Caminhada Histórica pela Elfreth's Alley",
            duration: "1h",
            cost: "Gratuito",
            mapsQuery: "Elfreth's Alley"
          }
        ]
      }
    ]
  },
  {
    id: "d4",
    city: "Atlantic City",
    state: "New Jersey",
    country: "EUA",
    dates: "13 jul. - 16 jul.",
    hotelName: "Clarion Inn Atlantic City - Beach and Boardwalk",
    hotelLink: "https://maps.app.goo.gl/8vsJvPuT9LBo4QTv7",
    hotelAddress: "101 S Boardwalk, Atlantic City, NJ 08401",
    hotelCoords: { lat: 39.3643, lng: -74.4229 },
    notes: "Hospedagem localizada em pleno calçadão histórico de Atlantic City.",
    days: [
      {
        id: "d4y1",
        dayNumber: 1,
        dateStr: "Segunda, 13 de Julho",
        title: "Litoral de NJ: Calçadão clássico & Cassinos",
        activities: [
          {
            id: "act6_1",
            time: "11:00",
            location: "Viagem da Filadélfia para Atlantic City",
            duration: "1h30",
            cost: "Livre",
            notes: "Trajeto de carro rápido pela rodovia Atlantic City Expressway."
          },
          {
            id: "act6_2",
            time: "13:30",
            location: "Check-in Clarion Inn Atlantic City",
            duration: "1h",
            cost: "Pago (Reserva)",
            mapsQuery: "Clarion Inn Atlantic City"
          },
          {
            id: "act6_3",
            time: "15:00",
            location: "Caminhada Clássica pelo Boardwalk",
            duration: "2h",
            cost: "Gratuito",
            mapsQuery: "Atlantic City Boardwalk Entrance",
            notes: "Explorar o lendário calçadão repleto de lojas de doces de salt-water taffy e fliperamas."
          },
          {
            id: "act6_4",
            time: "19:30",
            location: "Jantar Especial e Cassino Experience (Caesars)",
            duration: "3h",
            cost: "Consumo",
            mapsQuery: "Caesars Atlantic City"
          }
        ]
      },
      {
        id: "d4y2",
        dayNumber: 2,
        dateStr: "Terça, 14 de Julho",
        title: "Praia de Atlantic City & Steel Pier",
        activities: [
          {
            id: "act6_5",
            time: "10:00",
            location: "Manhã na Praia de Atlantic City",
            duration: "3h",
            cost: "Gratuito",
            mapsQuery: "Atlantic City Beach",
            notes: "Aproveitar a praia pública de calçadão, excelente faixa de areia."
          },
          {
            id: "act6_6",
            time: "13:30",
            location: "Almoço de Frutos do Mar no Calçadão",
            duration: "1h15",
            cost: "US$ 20-35"
          },
          {
            id: "act6_7",
            time: "15:00",
            location: "Parque de Diversões no Histórico Steel Pier",
            duration: "2h30",
            cost: "Ingressos individuais por atração",
            mapsQuery: "Steel Pier Atlantic City",
            notes: "Roda gigante clássica com vista fantástica sobre o Oceano Atlântico."
          }
        ]
      },
      {
        id: "d4y3",
        dayNumber: 3,
        dateStr: "Quarta, 15 de Julho",
        title: "Farol Absecon & Compras Outlets Tanger",
        activities: [
          {
            id: "act6_8",
            time: "10:00",
            location: "Subida ao Farol Absecon",
            duration: "1h30",
            cost: "$10 (adulto)",
            mapsQuery: "Absecon Lighthouse",
            notes: "O farol mais alto de Nova Jersey, com vista total da área costeira metropolitana."
          },
          {
            id: "act6_9",
            time: "12:00",
            location: "Almoço Rápido de Hambúrgueres",
            duration: "1h",
            cost: "US$ 15"
          },
          {
            id: "act6_10",
            time: "13:30",
            location: "Tarde de Compras nos Outlets Tanger",
            duration: "4h",
            cost: "Consumo",
            mapsQuery: "Tanger Outlets Atlantic City",
            notes: "Várias quadras ao ar livre com dezenas de outlets com descontos de grandes marcas."
          }
        ]
      }
    ]
  },
  {
    id: "d6",
    city: "New York",
    state: "New York",
    country: "EUA",
    dates: "16 jul. - 20 jul.",
    hotelName: "Hotel Moca NYC",
    hotelLink: "https://maps.app.goo.gl/DDUcHtGSR7Q44zQ5A",
    hotelAddress: "137-33 37th Ave, Queens, NY 11354",
    hotelCoords: { lat: 40.7621, lng: -73.8302 },
    notes: "Segunda estadia em Nova York antes do retorno final aos EUA, focando agora nas pontas norte e leste de Manhattan e compras finais.",
    days: [
      {
        id: "d6y1",
        dayNumber: 1,
        dateStr: "Quinta, 16 de Julho",
        title: "Queens & Mirante de Gantry Plaza",
        activities: [
          {
            id: "act7_1",
            time: "10:00",
            location: "Viagem de Retorno de Atlantic City para NYC",
            duration: "3h",
            cost: "Pedágios",
            notes: "Trajeto de carro ao norte para Queens."
          },
          {
            id: "act7_2",
            time: "14:00",
            location: "Check-in Hotel Moca NYC (2ª estada)",
            duration: "1h",
            cost: "Pago (Reserva)",
            mapsQuery: "Hotel Moca NYC"
          },
          {
            id: "act7_3",
            time: "16:00",
            location: "Parque Gantry Plaza State Park (Long Island City)",
            duration: "2h30",
            cost: "Gratuito",
            mapsQuery: "Gantry Plaza State Park",
            notes: "Passeio pelo deck do Queens com vista fascinante para o prédio da ONU e Chrysler Building."
          }
        ]
      },
      {
        id: "d6y2",
        dayNumber: 2,
        dateStr: "Sexta, 17 de Julho",
        title: "Edgewise Summit & Bonde de Roosevelt Island",
        activities: [
          {
            id: "act7_4",
            time: "10:30",
            location: "Teleférico de Roosevelt Island Tramway",
            duration: "2h",
            cost: "$3 por trajeto (MetroCard)",
            mapsQuery: "Roosevelt Island Tramway Manhattan Side",
            notes: "Bonde aéreo incrível que cruza ao lado da Ponte Queensboro com vista privilegiada."
          },
          {
            id: "act7_5",
            time: "13:00",
            location: "Almoço Coletivo na 2nd Ave Midtown",
            duration: "1h15",
            cost: "US$ 20-35"
          },
          {
            id: "act7_6",
            time: "14:30",
            location: "Compras de Eletrônicos e Lembranças na B&H Photo Video",
            duration: "3h",
            cost: "Livre",
            mapsQuery: "BH Photo Video New York",
            notes: "A maior loja de fotografia e eletrônicos do mundo, imperdível para eletrônicos e cabos."
          }
        ]
      },
      {
        id: "d6y3",
        dayNumber: 3,
        dateStr: "Sábado, 18 de Julho",
        title: "Upper East Side & Museu Metropolitan (Met)",
        activities: [
          {
            id: "act7_7",
            time: "10:00",
            location: "Museu de Arte Metropolitan (The MET)",
            duration: "3h",
            cost: "US$ 30 (Estudante tem desconto)",
            mapsQuery: "The Metropolitan Museum of Art",
            notes: "Ver as seções egípcias (Templo de Dendur) e os maravilhosos jardins internos."
          },
          {
            id: "act7_8",
            time: "13:30",
            location: "Almoço nas Proximidades do Upper East Side",
            duration: "1h",
            cost: "US$ 20-30"
          },
          {
            id: "act7_9",
            time: "15:00",
            location: "Reservatório de Jacqueline Kennedy Onassis",
            duration: "1h30",
            cost: "Gratuito",
            mapsQuery: "Jacqueline Kennedy Onassis Reservoir"
          }
        ]
      },
      {
        id: "d6y4",
        dayNumber: 4,
        dateStr: "Domingo, 19 de Julho",
        title: "Zoológico do Central Park & Jantar de Despedida NY",
        activities: [
          {
            id: "act7_10",
            time: "10:30",
            location: "Central Park Zoo",
            duration: "2h",
            cost: "Pago ($12/pess)",
            mapsQuery: "Central Park Zoo"
          },
          {
            id: "act7_11",
            time: "13:00",
            location: "Almoço de Confraternização de Grupo",
            duration: "1h45",
            cost: "US$ 30-45"
          },
          {
            id: "act7_12",
            time: "15:30",
            location: "Visita ao Navio-Museu Intrepid Sea, Air & Space",
            duration: "2h30",
            cost: "Pago ($33)",
            mapsQuery: "Intrepid Sea Air Space Museum",
            notes: "Porta-aviões no Hudson River, com o ônibus espacial Enterprise e submarino Growler."
          }
        ]
      }
    ]
  },
  {
    id: "d5",
    city: "Chantilly",
    state: "Virginia",
    country: "EUA",
    dates: "20 jul. - 21 jul.",
    hotelName: "Fairfield Inn Dulles Airport Chantilly",
    hotelLink: "https://maps.app.goo.gl/3MZUQUFTzA5m8ijp9",
    hotelAddress: "4460 Brookfield Corporate Dr, Chantilly, VA 20151",
    hotelCoords: { lat: 38.8958, lng: -77.4475 },
    notes: "Hospedagem localizada próxima ao Aeroporto Dulles (IAD) para simplificar a devolução do carro e o embarque de volta de todo o grupo de 8 viajantes.",
    days: [
      {
        id: "d5y1",
        dayNumber: 1,
        dateStr: "Segunda, 20 de Julho",
        title: "Retorno a Virginia & Museu Aeroespacial Udvar-Hazy",
        activities: [
          {
            id: "act8_1",
            time: "08:30",
            location: "Viagem Longa de Nova York para Chantilly, VA",
            duration: "4h30",
            cost: "Pedágios",
            notes: "Deslocamento final de retorno de carro de 8 viajantes."
          },
          {
            id: "act8_2",
            time: "14:00",
            location: "Check-in Fairfield Inn Dulles Chantilly",
            duration: "1h",
            cost: "Pago (Reserva)",
            mapsQuery: "Fairfield Inn & Suites by Marriott Dulles Airport Chantilly"
          },
          {
            id: "act8_3",
            time: "15:30",
            location: "Steven F. Udvar-Hazy Center (Anexo Smithsonian)",
            duration: "2h30",
            cost: "Gratuito ($15 estacionamento)",
            mapsQuery: "Steven F. Udvar-Hazy Center",
            notes: "O hangar gigantesco contendo o ônibus espacial Discovery, o caça Blackbird e o jato supersônico Concorde!"
          }
        ]
      }
    ]
  }
];

export const INITIAL_NOTIFICATIONS: NotificationAlert[] = [
  {
    id: "n1",
    title: "Atualização de Portão de Embarque",
    description: "Voo LATAM LA 702 para IAD foi designado para o portão B24.",
    time: "Há 10 minutos",
    read: false,
    type: "gate"
  },
  {
    id: "n2",
    title: "Lembrete de Reserva",
    description: "Temos visita guiada reservada às 09:00 no Capitólio dos EUA amanhã! Lembre-se dos e-tickets.",
    time: "Há 2 horas",
    read: false,
    type: "schedule"
  },
  {
    id: "n3",
    title: "Confirmação de Aluguel de Carro",
    description: "O veículo foi inspecionado e está pronto com tanque cheio. Aluguel pago.",
    time: "Ontem",
    read: true,
    type: "important"
  }
];

export const INITIAL_DOCUMENTS: TravelDocument[] = [
  {
    id: "doc1",
    type: "eticket",
    title: "E-Ticket: Ida GRU - IAD (LATAM)",
    airline: "LATAM Airlines",
    flightNumber: "LA 702",
    passengerName: "Théo Silva + 7 passageiros",
    notes: "Código de reserva: LA-4710A. Inclui despacho de bagagem de 23kg para os 8 viajantes.",
    uploadedAt: "09/06/2026",
    fileName: "eticket_ida_grupo_gr_iad.pdf"
  },
  {
    id: "doc2",
    type: "eticket",
    title: "E-Ticket: Volta IAD - GRU (United)",
    airline: "United Airlines",
    flightNumber: "UA 861",
    passengerName: "Théo Silva + 7 passageiros",
    notes: "Voo com conexão. Código de check-in: UA-29671F.",
    uploadedAt: "09/06/2026",
    fileName: "eticket_volta_iad_gru.pdf"
  },
  {
    id: "doc3",
    type: "passport",
    title: "Passaporte - Théo Silva",
    passengerName: "Théo Silva",
    notes: "Expiração em 12/12/2030. Visto americano válido até 2034.",
    uploadedAt: "09/06/2026",
    fileName: "passport_theo_silva.jpg"
  }
];
