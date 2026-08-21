import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';

function createPdf() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210
  const pageHeight = doc.internal.pageSize.getHeight(); // 297
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  function checkPageBreak(spaceNeeded = 10) {
    if (y + spaceNeeded > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }

  // Header Bar
  doc.setFillColor(30, 58, 95); // #1E3A5F
  doc.rect(margin, y, contentWidth, 14, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Ked', margin + 6, y + 9.5);
  
  const kedWidth = doc.getTextWidth('Ked');
  doc.setTextColor(248, 177, 149); // #F8B195 / #D95D39
  doc.setFont('helvetica', 'bolditalic');
  doc.text('Go!', margin + 6 + kedWidth + 1, y + 9.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(220, 230, 242);
  doc.text('PLANO E ROTEIRO DE DIVULGACAO OFICIAL', pageWidth - margin - 6, y + 9.5, { align: 'right' });

  y += 20;

  // Title
  doc.setTextColor(15, 23, 42); // #0f172a
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('Manual de Divulgacao & Posicionamento Comercial', margin, y);
  y += 5.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Guia oficial para gravacao de Reels/TikTok, anuncios pagos, copies e pitch do app.', margin, y);
  y += 8;

  // Pitch Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(30, 58, 95);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  doc.setTextColor(30, 58, 95);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('PROPOSTA UNICA DE VALOR (PITCH DE 10 SEGUNDOS)', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const pitchText = '"Chega de usar 5 apps diferentes, planilhas confusas no Excel e grupos caoticos de WhatsApp para organizar uma viagem. O KedGo! reune criacao de roteiro por Inteligencia Artificial, divisao de contas com leitura automatica de notas por OCR, cofre seguro de documentos e funcionamento 100% offline num so lugar."';
  const splitPitch = doc.splitTextToSize(pitchText, contentWidth - 8);
  doc.text(splitPitch, margin + 4, y + 11.5);

  y += 29;

  // Section 1: Video Script Table
  doc.setFillColor(217, 93, 57); // #D95D39
  doc.rect(margin, y, 2.5, 6, 'F');

  doc.setTextColor(30, 58, 95);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. Roteiro para Video Comercial / Reels / TikTok (60 segundos)', margin + 5, y + 4.8);
  y += 9;

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 7, 'FD');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Tempo', margin + 3, y + 4.5);
  doc.text('Cena / Visual', margin + 25, y + 4.5);
  doc.text('Locucao / Narracao (Audio)', margin + 95, y + 4.5);
  y += 7;

  const scriptRows = [
    {
      time: '00:00 - 00:08',
      scene: 'Pessoa estressada com varias abas: Excel de contas, WhatsApp cobrando amigos e papeis amassados.',
      audio: '"Quantos apps e planilhas voce abre para organizar uma unica viagem? E pior: quantas vezes ja se perdeu cobrando quem pagou o que no grupo?"'
    },
    {
      time: '00:08 - 00:18',
      scene: 'Transicao para o KedGo!. Clique em "Criar Roteiro com IA" gerando dias e atracoes em segundos.',
      audio: '"Conheca o KedGo!: o unico app que voce vai precisar. Comece criando um roteiro completo e personalizado em segundos com a nossa IA generativa."'
    },
    {
      time: '00:18 - 00:28',
      scene: 'Celular fotografando comanda/nota. O OCR le os valores e divide automaticamente entre o grupo.',
      audio: '"Na hora da conta, zero dor de cabeca! Tire foto do cupom fiscal que o OCR com IA le os valores e faz o rateio automatico entre os viajantes."'
    },
    {
      time: '00:28 - 00:38',
      scene: 'Modo aviao ativado e o KedGo! abrindo normalmente passagens, mapas e itinerario.',
      audio: '"Sem sinal ou sem chip internacional? Sem problemas! O KedGo! funciona 100% Offline. Seus vouchers e mapas ficam sempre acessiveis."'
    },
    {
      time: '00:38 - 00:48',
      scene: 'Destaque do Cofre de Documentos, Chat interno e tela de Avaliacao individual de passeios.',
      audio: '"Guarde passaportes no Cofre Blindado, converse com o grupo pelo chat integrado e avalie cada atracao em tempo real."'
    },
    {
      time: '00:48 - 01:00',
      scene: 'Tela final com logo KedGo! e cupom KED10 destacado na tela.',
      audio: '"Viaje leve, viaje inteligente. Acesse agora kedgo.com.br, use o cupom KED10 e monte sua proxima viagem sem perrengue!"'
    }
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  scriptRows.forEach((row, idx) => {
    const sceneSplit = doc.splitTextToSize(row.scene, 66);
    const audioSplit = doc.splitTextToSize(row.audio, 82);
    const rowHeight = Math.max(sceneSplit.length, audioSplit.length) * 3.8 + 4;

    checkPageBreak(rowHeight);

    if (idx % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, rowHeight, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(217, 93, 57);
    doc.text(row.time, margin + 3, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(sceneSplit, margin + 25, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(audioSplit, margin + 95, y + 4.5);

    y += rowHeight;
  });

  y += 6;
  checkPageBreak(35);

  // Section 2: Features
  doc.setFillColor(217, 93, 57);
  doc.rect(margin, y, 2.5, 6, 'F');

  doc.setTextColor(30, 58, 95);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. Os 6 Pilares de Inovacao do KedGo!', margin + 5, y + 4.8);
  y += 9;

  const features = [
    { title: '1. Roteiro Inteligente com IA', desc: 'Programacao dia a dia personalizada por IA generativa com estimativa de custos e otimizacao de rotas.' },
    { title: '2. Leitura OCR de Comandas e Notas', desc: 'Foto do cupom fiscal vira despesa categorizada com rateio automatico entre grupo ou pessoal.' },
    { title: '3. 100% Offline (PWA Cache)', desc: 'Consulta passagens, mapas e itinerarios em modo aviao, no metro subterraneo ou sem chip no exterior.' },
    { title: '4. Cofre Blindado de Documentos', desc: 'Central protegida para passaportes, apolices de seguro-viagem, ingressos e comprovantes de todos.' },
    { title: '5. Chat Integrado por Viagem', desc: 'Canal exclusivo da viagem com mural de avisos e notificacoes sem poluir o WhatsApp.' },
    { title: '6. Avaliacoes & Memorias', desc: 'Cada viajante da nota e registra memorias dos restaurantes e passeios para historico do grupo.' }
  ];

  const colWidth = (contentWidth - 6) / 2;
  for (let i = 0; i < features.length; i += 2) {
    checkPageBreak(18);
    const f1 = features[i];
    const f2 = features[i + 1];

    // Card 1
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, colWidth, 16, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 58, 95);
    doc.text(f1.title, margin + 3, y + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(doc.splitTextToSize(f1.desc, colWidth - 6), margin + 3, y + 8.5);

    // Card 2
    if (f2) {
      doc.roundedRect(margin + colWidth + 6, y, colWidth, 16, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 58, 95);
      doc.text(f2.title, margin + colWidth + 9, y + 4.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(doc.splitTextToSize(f2.desc, colWidth - 6), margin + colWidth + 9, y + 8.5);
    }

    y += 19;
  }

  y += 4;
  checkPageBreak(40);

  // Section 3: Ready-to-use Copies
  doc.setFillColor(217, 93, 57);
  doc.rect(margin, y, 2.5, 6, 'F');

  doc.setTextColor(30, 58, 95);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('3. Textos e Copies Prontas para Redes Sociais', margin + 5, y + 4.8);
  y += 9;

  // WhatsApp Box
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin, y, contentWidth, 25, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(22, 101, 52);
  doc.text('COPY WHATSAPP / MENSAGEM DIRETA / LISTA DE TRANSMISSAO', margin + 4, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  const wppText = 'Fala pessoal! Sabe aquele perrengue de organizar viagem em grupo e fazer conta no bloco de notas? Acabou de sair o KedGo!, o app completo com roteiros gerados por IA, scanner de notas com OCR que divide a conta sozinho, acesso 100% offline e cofre de documentos. Usem o cupom KED10 para desconto: https://crm-ked-kedgo.crl0uj.easypanel.host/';
  doc.text(doc.splitTextToSize(wppText, contentWidth - 8), margin + 4, y + 9);
  y += 28;

  checkPageBreak(30);

  // Instagram Box
  doc.setFillColor(253, 242, 248);
  doc.setDrawColor(251, 207, 232);
  doc.roundedRect(margin, y, contentWidth, 27, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(157, 23, 77);
  doc.text('COPY INSTAGRAM / FEED / LINKEDIN', margin + 4, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  const instaText = 'Viajar em grupo e incrivel, mas organizar costuma ser um teste de paciencia. Com o KedGo!, voce tem: Roteiros detalhados com IA em minutos, Registro de despesas com foto da nota, Acesso offline total sem sinal e Chat com cofre blindado de passaportes. Teste gratuitamente pelo link da bio com o codigo KED10! #viagem #turismo #roteirodeviagem #ia #kedgo';
  doc.text(doc.splitTextToSize(instaText, contentWidth - 8), margin + 4, y + 9);
  y += 32;

  // Footer on all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.text('KedGo! — Seu Roteiro Personalizado Individual ou em Grupo, Sem Perrengue', margin, pageHeight - 7.5);
    doc.text(`Pagina ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 7.5, { align: 'right' });
  }

  // Ensure public and dist folders exist
  const outputPublic = path.resolve('public', 'Roteiro_Divulgacao_KedGo.pdf');
  const outputDist = path.resolve('dist', 'Roteiro_Divulgacao_KedGo.pdf');
  const outputRoot = path.resolve('Roteiro_Divulgacao_KedGo.pdf');

  const pdfBytes = doc.output('arraybuffer');
  fs.writeFileSync(outputPublic, Buffer.from(pdfBytes));
  fs.writeFileSync(outputRoot, Buffer.from(pdfBytes));
  if (fs.existsSync('dist')) {
    fs.writeFileSync(outputDist, Buffer.from(pdfBytes));
  }

  console.log('PDF gerado com sucesso em:', outputRoot);
}

createPdf();
