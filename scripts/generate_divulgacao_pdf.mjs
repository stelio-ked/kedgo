import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

async function generatePdf() {
  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Plano de Divulgação - KedGo!</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.5;
      padding: 25px 35px;
    }

    .header {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 16px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo-badge {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .logo-text {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }

    .logo-ked {
      color: #1E3A5F;
    }

    .logo-go {
      color: #D95D39;
      font-style: italic;
    }

    .doc-tag {
      background: #f1f5f9;
      color: #475569;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 6px;
      letter-spacing: 0.5px;
    }

    h1 {
      font-size: 20px;
      color: #0f172a;
      font-weight: 800;
      margin-bottom: 4px;
    }

    .subtitle {
      color: #64748b;
      font-size: 12.5px;
      font-weight: 500;
      margin-bottom: 18px;
    }

    .pitch-box {
      background: linear-gradient(135deg, #1E3A5F 0%, #2b4c77 100%);
      color: #ffffff;
      border-radius: 10px;
      padding: 14px 18px;
      margin-bottom: 20px;
      box-shadow: 0 4px 12px rgba(30, 58, 95, 0.15);
    }

    .pitch-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 800;
      color: #F8B195;
      margin-bottom: 4px;
    }

    .pitch-text {
      font-size: 12.5px;
      font-weight: 500;
      line-height: 1.55;
    }

    .section-title {
      font-size: 14px;
      font-weight: 800;
      color: #1E3A5F;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
      margin-top: 18px;
      border-left: 4px solid #D95D39;
      padding-left: 8px;
    }

    /* Video Script Table */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 11.5px;
    }

    th {
      background: #f8fafc;
      color: #334155;
      text-align: left;
      font-weight: 700;
      padding: 8px 10px;
      border: 1px solid #e2e8f0;
    }

    td {
      padding: 8px 10px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
    }

    tr:nth-child(even) td {
      background: #fafafa;
    }

    .time-col {
      width: 15%;
      font-weight: 700;
      color: #D95D39;
      white-space: nowrap;
    }

    .scene-col {
      width: 38%;
      color: #334155;
    }

    .audio-col {
      width: 47%;
      font-weight: 600;
      color: #0f172a;
    }

    /* Features Grid */
    .features-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 20px;
    }

    .feature-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
      background: #ffffff;
      page-break-inside: avoid;
    }

    .feature-name {
      font-size: 12px;
      font-weight: 700;
      color: #1E3A5F;
      margin-bottom: 3px;
    }

    .feature-desc {
      font-size: 11px;
      color: #475569;
      line-height: 1.4;
    }

    /* Copy Section */
    .copy-card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 10px;
      font-size: 11.5px;
      line-height: 1.5;
      page-break-inside: avoid;
    }

    .copy-badge {
      display: inline-block;
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 2px 7px;
      border-radius: 4px;
      margin-bottom: 6px;
    }

    .badge-wpp {
      background: #dcfce7;
      color: #166534;
    }

    .badge-insta {
      background: #fce7f3;
      color: #9d174d;
    }

    .footer {
      margin-top: 24px;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #94a3b8;
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="logo-badge">
      <div class="logo-text"><span class="logo-ked">Ked</span><span class="logo-go">Go!</span></div>
    </div>
    <div class="doc-tag">Estratégia & Roteiro de Divulgação</div>
  </div>

  <h1>Manual de Divulgação & Posicionamento Comercial</h1>
  <div class="subtitle">Guia oficial para gravação de Reels/TikTok, anúncios, copies para redes sociais e pitch do app.</div>

  <div class="pitch-box">
    <div class="pitch-title">🎯 Pitch Central (Proposta Única de Valor)</div>
    <div class="pitch-text">
      "Chega de usar 5 apps diferentes, planilhas confusas no Excel e grupos caóticos de WhatsApp para organizar uma viagem. O <strong>KedGo!</strong> reúne criação de roteiro por Inteligência Artificial, divisão de contas com leitura automática de notas por OCR, cofre seguro de documentos e funcionamento 100% offline num só lugar."
    </div>
  </div>

  <div class="section-title">🎬 Roteiro para Vídeo Comercial / Reels / TikTok (60 segundos)</div>
  <table>
    <thead>
      <tr>
        <th class="time-col">Tempo</th>
        <th class="scene-col">Cena / Visual</th>
        <th class="audio-col">Locução / Áudio</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="time-col">00:00 - 00:08</td>
        <td>Pessoa estressada olhando várias abas: Excel com contas, WhatsApp cobrando amigos, pasta cheia de papéis no aeroporto.</td>
        <td>"Quantos apps e planilhas você abre para organizar uma única viagem? E pior: quantas vezes você já se perdeu cobrando quem pagou o quê no grupo?"</td>
      </tr>
      <tr>
        <td class="time-col">00:08 - 00:18</td>
        <td>Transição rápida para a tela moderna do <strong>KedGo!</strong>. Clique em <em>Criar Roteiro com IA</em> gerando dias e atrações.</td>
        <td>"Conheça o <strong>KedGo!</strong>: o único app que você vai precisar. Comece criando um roteiro completo e personalizado em segundos com a nossa IA generativa."</td>
      </tr>
      <tr>
        <td class="time-col">00:18 - 00:28</td>
        <td>Celular fotografando uma comanda de restaurante. A IA lê a nota e preenche o valor, categoria e faz o rateio.</td>
        <td>"Na hora da conta, zero dor de cabeça! É só tirar foto da nota ou cupom fiscal que o OCR com IA lê os valores e faz o rateio automático entre os viajantes."</td>
      </tr>
      <tr>
        <td class="time-col">00:28 - 00:38</td>
        <td>Modo avião ativado no celular e o app continuando a abrir normalmente com passagens e roteiro.</td>
        <td>"Sem sinal ou sem chip internacional? Sem problemas! O KedGo! funciona <strong>100% Offline</strong>. Seus mapas, horários e ingressos ficam sempre acessíveis."</td>
      </tr>
      <tr>
        <td class="time-col">00:38 - 00:48</td>
        <td>Destaque rápido do <strong>Cofre de Documentos</strong>, <strong>Chat interno</strong> e tela de <strong>Avaliação</strong>.</td>
        <td>"Guarde passaportes e vouchers no Cofre Blindado, converse com o grupo pelo chat integrado e avalie cada atração em tempo real."</td>
      </tr>
      <tr>
        <td class="time-col">00:48 - 01:00</td>
        <td>Tela final com a logo do KedGo! e cupom <strong>KED10</strong> em destaque.</td>
        <td>"Viaje leve, viaje inteligente. Acesse agora <strong>kedgo.com.br</strong>, use o cupom <strong>KED10</strong> e monte sua próxima viagem sem perrengue!"</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">🌟 Os 6 Pilares de Inovação do KedGo!</div>
  <div class="features-grid">
    <div class="feature-card">
      <div class="feature-name">🤖 1. Roteiro Inteligente com IA</div>
      <div class="feature-desc">Gera programação completa dia a dia com horários otimizados, estimativa de custos e atrações baseadas no estilo da viagem.</div>
    </div>
    <div class="feature-card">
      <div class="feature-name">📸 2. Leitura OCR de Notas e Cupons</div>
      <div class="feature-desc">Escaneia notas fiscais, cupons e comandas com inteligência artificial, preenchendo e rateando os gastos automaticamente.</div>
    </div>
    <div class="feature-card">
      <div class="feature-name">📶 3. Funcionamento 100% Offline</div>
      <div class="feature-desc">Tecnologia PWA com cache inteligente. Acesse passagens, reservas, ingressos e mapas sem precisar de sinal ou internet no exterior.</div>
    </div>
    <div class="feature-card">
      <div class="feature-name">🔒 4. Cofre Digital de Documentos</div>
      <div class="feature-desc">Central protegida e offline para passaportes, apólices de seguro, comprovantes de vacina e passagens aéreas do grupo.</div>
    </div>
    <div class="feature-card">
      <div class="feature-name">💬 5. Chat Integrado por Viagem</div>
      <div class="feature-desc">Canal de comunicação dedicado por itinerário, evitando que horários e vouchers importantes se percam em grupos de mensagens.</div>
    </div>
    <div class="feature-card">
      <div class="feature-name">⭐ 6. Avaliação e Memórias</div>
      <div class="feature-desc">Feedback individual de cada viajante sobre passeios e restaurantes, gerando um histórico consolidado da experiência.</div>
    </div>
  </div>

  <div class="section-title">📝 Copies Prontas para Redes Sociais</div>

  <div class="copy-card">
    <span class="copy-badge badge-wpp">WhatsApp / Mensagem Direta</span><br/>
    "Fala pessoal! ✈️🌍 Sabe aquele perrengue de organizar viagem em grupo, ficar fazendo conta no bloco de notas e caçando voucher de hotel no e-mail sem internet?<br/><br/>
    Acabou de sair o <strong>KedGo!</strong>, o app completo com roteiros gerados por IA, scanner de notas que divide a conta sozinho, acesso 100% offline e cofre de documentos.<br/><br/>
    Usem o cupom promocional <strong>KED10</strong> para desconto exclusivo: <em>https://crm-ked-kedgo.crl0uj.easypanel.host/</em>"
  </div>

  <div class="copy-card">
    <span class="copy-badge badge-insta">Instagram / LinkedIn</span><br/>
    "Viajar em grupo é incrível, mas organizar… costuma ser um teste de paciência. 🤯<br/><br/>
    Pensando nisso, criamos o <strong>KedGo!</strong>: uma plataforma tudo-em-um pensada por quem viaja para quem viaja.<br/>
    ✅ Roteiros detalhados com IA em minutos<br/>
    ✅ Registro e rateio de despesas fotografando a nota com OCR<br/>
    ✅ Acesso offline total no aeroporto ou sem sinal<br/>
    ✅ Chat integrado e cofre seguro de passaportes e vouchers<br/><br/>
    👉 Teste gratuitamente pelo link ou use o código <strong>KED10</strong>!<br/>
    <em>#viagem #turismo #roteirodeviagem #ia #kedgo #viajaremgrupo</em>"
  </div>

  <div class="footer">
    <div>KedGo! — Seu Roteiro Personalizado Individual ou em Grupo, Sem Perrengue</div>
    <div>Documento Estratégico Oficial • 2026</div>
  </div>

</body>
</html>
  `;

  const outputPath = path.resolve('public', 'Roteiro_Divulgacao_KedGo.pdf');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '12mm',
      right: '12mm',
      bottom: '12mm',
      left: '12mm'
    }
  });

  await browser.close();
  console.log(`PDF gerado com sucesso em: ${outputPath}`);
}

generatePdf().catch(console.error);
