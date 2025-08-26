import Tesseract from 'tesseract.js';
import { storage } from '../storage';

export interface OcrExtractionResult {
  extractedText: string;
  extractedData: Record<string, any>;
  confidence: number;
  processingStatus: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  fieldMatches?: Array<{
    field: string;
    value: string;
    confidence: number;
  }>;
}

export class OcrService {
  private worker: Tesseract.Worker | null = null;

  async initializeWorker() {
    if (!this.worker) {
      this.worker = await Tesseract.createWorker('eng+ron+spa+fra');
    }
    return this.worker;
  }

  async processDocument(imageBuffer: Buffer, documentType?: string): Promise<OcrExtractionResult> {
    try {
      const worker = await this.initializeWorker();
      
      const { data } = await worker.recognize(imageBuffer);
      const extractedText = data.text;
      
      // Extract structured data based on document type and text patterns
      const extractedData = this.extractStructuredData(extractedText, documentType);
      
      // Calculate overall confidence
      const confidence = this.calculateConfidence(data);
      
      return {
        extractedText,
        extractedData,
        confidence,
        processingStatus: 'COMPLETED',
        fieldMatches: this.findFieldMatches(extractedText, extractedData)
      };
    } catch (error) {
      console.error('OCR processing failed:', error);
      return {
        extractedText: '',
        extractedData: {},
        confidence: 0,
        processingStatus: 'FAILED'
      };
    }
  }

  private extractStructuredData(text: string, documentType?: string): Record<string, any> {
    const data: Record<string, any> = {};
    
    // Common patterns for Romanian immigration documents
    const patterns = {
      // Personal information
      nume: /(?:nume|name|nom|nombre)[\s:]+([a-zA-ZăâîșțĂÂÎȘȚ\s]+)/gi,
      prenume: /(?:prenume|given name|prénom|primer nombre)[\s:]+([a-zA-ZăâîșțĂÂÎȘȚ\s]+)/gi,
      cnp: /(?:cnp|personal numerical code)[\s:]+(\d{13})/gi,
      pasaport: /(?:pasaport|passport|passeport)[\s:#]+([a-zA-Z0-9]+)/gi,
      
      // Dates
      dataNasterii: /(?:data nașterii|date of birth|date de naissance|fecha de nacimiento)[\s:]+(\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})/gi,
      dataExpirarii: /(?:data expirării|expiry date|date d'expiration|fecha de vencimiento)[\s:]+(\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})/gi,
      
      // Work permit specific
      codCOR: /(?:cod cor|occupation code|code métier)[\s:]+(\d{6})/gi,
      angajator: /(?:angajator|employer|employeur|empleador)[\s:]+([a-zA-ZăâîșțĂÂÎȘȚ0-9\s&.-]+)/gi,
      salariu: /(?:salariu|salary|salaire|salario)[\s:]+(\d+(?:[.,]\d{2})?)/gi,
      
      // Addresses
      adresa: /(?:adresa|address|adresse|dirección)[\s:]+([a-zA-ZăâîșțĂÂÎȘȚ0-9\s,.-]+)/gi,
      localitate: /(?:localitate|city|ville|ciudad)[\s:]+([a-zA-ZăâîșțĂÂÎȘȚ\s-]+)/gi,
      judet: /(?:județ|county|comté|condado)[\s:]+([a-zA-ZăâîșțĂÂÎȘȚ\s-]+)/gi,
      
      // Document numbers
      numarDocument: /(?:număr document|document number|numéro de document|número de documento)[\s:]+([a-zA-Z0-9]+)/gi,
      serieDocument: /(?:serie|series|série)[\s:]+([a-zA-Z0-9]+)/gi,
    };

    // Extract data using patterns
    for (const [field, pattern] of Object.entries(patterns)) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].trim()) {
          data[field] = match[1].trim();
          break; // Take first match
        }
      }
    }

    // Document type specific extraction
    if (documentType) {
      switch (documentType.toLowerCase()) {
        case 'passport':
          this.extractPassportData(text, data);
          break;
        case 'work_permit':
          this.extractWorkPermitData(text, data);
          break;
        case 'residence_permit':
          this.extractResidencePermitData(text, data);
          break;
        case 'employment_contract':
          this.extractEmploymentContractData(text, data);
          break;
      }
    }

    return data;
  }

  private extractPassportData(text: string, data: Record<string, any>) {
    // Additional passport-specific patterns
    const passportPatterns = {
      nationality: /(?:nationality|naționalitate|nationalité|nacionalidad)[\s:]+([a-zA-ZăâîșțĂÂÎȘȚ\s]+)/gi,
      placeOfBirth: /(?:place of birth|locul nașterii|lieu de naissance|lugar de nacimiento)[\s:]+([a-zA-ZăâîșțĂÂÎȘȚ\s,.-]+)/gi,
      issuingAuthority: /(?:issuing authority|autoritatea emitentă|autorité émettrice|autoridad emisora)[\s:]+([a-zA-ZăâîșțĂÂÎȘȚ\s.-]+)/gi,
    };

    for (const [field, pattern] of Object.entries(passportPatterns)) {
      const match = text.match(pattern);
      if (match && match[1]) {
        data[field] = match[1].trim();
      }
    }
  }

  private extractWorkPermitData(text: string, data: Record<string, any>) {
    // Work permit specific patterns
    const workPermitPatterns = {
      validFrom: /(?:valid from|valabil de la|valide à partir de|válido desde)[\s:]+(\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})/gi,
      validUntil: /(?:valid until|valabil până la|valide jusqu'au|válido hasta)[\s:]+(\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})/gi,
      permitNumber: /(?:permit number|numărul autorizației|numéro de permis|número de permiso)[\s:]+([a-zA-Z0-9/-]+)/gi,
    };

    for (const [field, pattern] of Object.entries(workPermitPatterns)) {
      const match = text.match(pattern);
      if (match && match[1]) {
        data[field] = match[1].trim();
      }
    }
  }

  private extractResidencePermitData(text: string, data: Record<string, any>) {
    // Residence permit specific patterns
    const residencePatterns = {
      permitType: /(?:tip permis|permit type|type de permis|tipo de permiso)[\s:]+([a-zA-ZăâîșțĂÂÎȘȚ\s]+)/gi,
      category: /(?:categorie|category|catégorie|categoría)[\s:]+([a-zA-Z0-9]+)/gi,
    };

    for (const [field, pattern] of Object.entries(residencePatterns)) {
      const match = text.match(pattern);
      if (match && match[1]) {
        data[field] = match[1].trim();
      }
    }
  }

  private extractEmploymentContractData(text: string, data: Record<string, any>) {
    // Employment contract specific patterns
    const contractPatterns = {
      jobTitle: /(?:funcția|job title|titre du poste|título del trabajo)[\s:]+([a-zA-ZăâîșțĂÂÎȘȚ\s.-]+)/gi,
      workSchedule: /(?:program de lucru|work schedule|horaire de travail|horario de trabajo)[\s:]+([a-zA-ZăâîșțĂÂÎȘȚ0-9\s:-]+)/gi,
      contractDuration: /(?:durata contractului|contract duration|durée du contrat|duración del contrato)[\s:]+([a-zA-ZăâîșțĂÂÎȘȚ0-9\s.-]+)/gi,
    };

    for (const [field, pattern] of Object.entries(contractPatterns)) {
      const match = text.match(pattern);
      if (match && match[1]) {
        data[field] = match[1].trim();
      }
    }
  }

  private calculateConfidence(ocrData: any): number {
    if (!ocrData.words || ocrData.words.length === 0) return 0;
    
    const totalWords = ocrData.words.length;
    const highConfidenceWords = ocrData.words.filter((word: any) => word.confidence > 80).length;
    
    return Math.round((highConfidenceWords / totalWords) * 100);
  }

  private findFieldMatches(text: string, extractedData: Record<string, any>): Array<{ field: string; value: string; confidence: number }> {
    const matches = [];
    
    for (const [field, value] of Object.entries(extractedData)) {
      if (typeof value === 'string' && value.length > 0) {
        // Simple confidence calculation based on text clarity and field importance
        let confidence = 85; // Base confidence
        
        // Boost confidence for structured data like dates and numbers
        if (/^\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4}$/.test(value)) confidence += 10; // Date pattern
        if (/^\d+$/.test(value)) confidence += 5; // Numbers
        if (value.length > 20) confidence -= 10; // Long strings are less reliable
        
        matches.push({
          field,
          value,
          confidence: Math.min(100, Math.max(0, confidence))
        });
      }
    }
    
    return matches;
  }

  async processDocumentFromFile(filePath: string, documentType?: string): Promise<OcrExtractionResult> {
    try {
      const fs = await import('fs');
      const imageBuffer = fs.readFileSync(filePath);
      return await this.processDocument(imageBuffer, documentType);
    } catch (error) {
      console.error('Error reading file for OCR:', error);
      return {
        extractedText: '',
        extractedData: {},
        confidence: 0,
        processingStatus: 'FAILED'
      };
    }
  }

  async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

export const ocrService = new OcrService();