import { describe, it, expect } from 'vitest';
import { generateShippingLabels, ShippingLabelData } from './shipping-label-generator';
import fs from 'fs';
import path from 'path';

describe('Geração de Etiquetas de Envio', () => {
  const sampleLabel: ShippingLabelData = {
    // Destinatário
    recipientName: 'João Silva Santos',
    recipientCpf: '123.456.789-00',
    recipientAddress: 'Avenida Paulista',
    recipientNumber: '1000',
    recipientComplement: 'Apto 101',
    recipientNeighborhood: 'Bela Vista',
    recipientCity: 'São Paulo',
    recipientState: 'SP',
    recipientZipCode: '01310-100',
    recipientPhone: '(11) 98765-4321',
    
    // Remetente
    senderName: 'Loja Teste LTDA',
    senderAddress: 'Avenida Paulista',
    senderNumber: '500',
    senderComplement: 'Loja 10',
    senderNeighborhood: 'Bela Vista',
    senderCity: 'São Paulo',
    senderState: 'SP',
    senderZipCode: '01310-200',
    senderPhone: '(11) 3333-4444',
    
    // Transportadora
    carrier: 'Correios',
    trackingCode: 'BR123456789BR',
    
    // Tipo
    labelType: 'correios',
  };

  it('deve gerar PDF de etiqueta simples', async () => {
    const labelData: ShippingLabelData = {
      ...sampleLabel,
      labelType: 'simple',
    };

    const pdfBuffer = await generateShippingLabels([labelData]);
    
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
    
    // Verificar se é um PDF válido (começa com %PDF)
    const pdfHeader = pdfBuffer.toString('utf-8', 0, 4);
    expect(pdfHeader).toBe('%PDF');
  });

  it('deve gerar PDF de etiqueta dos Correios', async () => {
    const pdfBuffer = await generateShippingLabels([sampleLabel]);
    
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
    
    // Verificar se é um PDF válido
    const pdfHeader = pdfBuffer.toString('utf-8', 0, 4);
    expect(pdfHeader).toBe('%PDF');
  });

  it('deve gerar PDF com múltiplas etiquetas', async () => {
    const labels: ShippingLabelData[] = [
      sampleLabel,
      {
        ...sampleLabel,
        recipientName: 'Maria Oliveira',
        recipientPhone: '(11) 99999-8888',
        trackingCode: 'BR987654321BR',
      },
      {
        ...sampleLabel,
        recipientName: 'Pedro Costa',
        recipientPhone: '(11) 97777-6666',
        trackingCode: 'BR111222333BR',
        labelType: 'simple',
      },
    ];

    const pdfBuffer = await generateShippingLabels(labels);
    
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
    
    // PDF com múltiplas etiquetas deve ser maior
    const singleLabelPdf = await generateShippingLabels([sampleLabel]);
    expect(pdfBuffer.length).toBeGreaterThan(singleLabelPdf.length);
  });

  it('deve gerar etiqueta sem código de rastreamento', async () => {
    const labelData: ShippingLabelData = {
      ...sampleLabel,
      trackingCode: undefined,
    };

    const pdfBuffer = await generateShippingLabels([labelData]);
    
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('deve gerar etiqueta sem CPF', async () => {
    const labelData: ShippingLabelData = {
      ...sampleLabel,
      recipientCpf: undefined,
    };

    const pdfBuffer = await generateShippingLabels([labelData]);
    
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('deve salvar PDF de teste para validação manual', async () => {
    const pdfBuffer = await generateShippingLabels([sampleLabel]);
    
    const testDir = path.join(__dirname, '../test-output');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    const outputPath = path.join(testDir, 'etiqueta-teste.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    
    expect(fs.existsSync(outputPath)).toBe(true);
    console.log(`✅ PDF de teste salvo em: ${outputPath}`);
  });
});
