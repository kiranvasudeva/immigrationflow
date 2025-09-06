import PDFDocument from 'pdfkit';
import { s3Service } from './s3Service';

export interface TemplateData {
  client?: {
    legalName: string;
    cui: string;
    address: string;
    caen: string;
    contactEmail: string;
    onrc?: string;
  };
  worker?: {
    firstName: string;
    lastName: string;
    nationality: string;
    passportNumber: string;
    email?: string;
    phone?: string;
  };
  assignment?: {
    id: string;
    status: string;
  };
  metadata?: {
    generatedAt: Date;
    generatedBy: string;
    watermark?: string;
  };
}

export class PDFService {
  async generatePDF(templateKey: string, data: TemplateData): Promise<Buffer> {
    switch (templateKey) {
      case 'work_contract_template':
        return this.generateWorkContract(data);
      case 'power_of_attorney_template':
        return this.generatePowerOfAttorney(data);
      case 'job_description_template':
        return this.generateJobDescription(data);
      case 'visa_application_form':
        return this.generateVisaApplication(data);
      case 'residence_application_template':
        return this.generateResidenceApplication(data);
      default:
        throw new Error(`Unknown template: ${templateKey}`);
    }
  }

  private async generateWorkContract(data: TemplateData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(16).text('CONTRACT INDIVIDUAL DE MUNCĂ', { align: 'center' });
      doc.fontSize(12).text(`Nr. ${Date.now()}`, { align: 'center' });
      doc.moveDown(2);

      // Employer section
      doc.fontSize(14).text('ANGAJATOR:', { underline: true });
      doc.fontSize(12);
      doc.text(`Nume: ${data.client?.legalName || '[COMPANY_NAME]'}`);
      doc.text(`CUI: ${data.client?.cui || '[CUI]'}`);
      doc.text(`Adresa: ${data.client?.address || '[ADDRESS]'}`);
      doc.text(`CAEN: ${data.client?.caen || '[CAEN]'}`);
      if (data.client?.onrc) {
        doc.text(`ONRC: ${data.client.onrc}`);
      }
      doc.moveDown();

      // Employee section
      doc.fontSize(14).text('ANGAJAT:', { underline: true });
      doc.fontSize(12);
      doc.text(`Nume: ${data.worker?.firstName || '[FIRST_NAME]'} ${data.worker?.lastName || '[LAST_NAME]'}`);
      doc.text(`Cetățenie: ${data.worker?.nationality || '[NATIONALITY]'}`);
      doc.text(`Pașaport: ${data.worker?.passportNumber || '[PASSPORT_NUMBER]'}`);
      if (data.worker?.email) {
        doc.text(`Email: ${data.worker.email}`);
      }
      doc.moveDown();

      // Contract terms
      doc.fontSize(14).text('PREVEDERI CONTRACTUALE:', { underline: true });
      doc.fontSize(12);
      doc.text('1. Funcția: [JOB_TITLE]');
      doc.text('2. Locul de muncă: [WORKPLACE]');
      doc.text('3. Salariul de bază: [SALARY] RON');
      doc.text('4. Durata contractului: [CONTRACT_DURATION]');
      doc.text('5. Programul de lucru: [WORKING_SCHEDULE]');
      doc.moveDown();

      // Signatures
      doc.text('Semnătura angajator: ________________', { align: 'left' });
      doc.text('Semnătura angajat: ________________', { align: 'right' });
      doc.moveDown();

      // Watermark
      this.addWatermark(doc, data.metadata?.watermark || data.worker?.email || 'PREVIEW');

      // Footer
      doc.fontSize(10).fillColor('gray');
      doc.text(`Document generat automat la ${new Date().toLocaleString('ro-RO')}`, {
        align: 'center'
      });

      doc.end();
    });
  }

  private async generatePowerOfAttorney(data: TemplateData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(16).text('PROCURĂ SPECIALĂ', { align: 'center' });
      doc.moveDown(2);

      // Content
      doc.fontSize(12);
      doc.text('Eu, subsemnatul/a:', { underline: true });
      doc.text(`${data.worker?.firstName || '[FIRST_NAME]'} ${data.worker?.lastName || '[LAST_NAME]'}`);
      doc.text(`Cetățean ${data.worker?.nationality || '[NATIONALITY]'}`);
      doc.text(`Pașaport seria/nr. ${data.worker?.passportNumber || '[PASSPORT_NUMBER]'}`);
      doc.moveDown();

      doc.text('Prin prezenta împuternicesc pe:', { underline: true });
      doc.text('[LEGAL_REPRESENTATIVE_NAME]');
      doc.text('[LEGAL_REPRESENTATIVE_DETAILS]');
      doc.moveDown();

      doc.text('Să mă reprezinte în fața autorităților române pentru:', { underline: true });
      doc.text('- Depunerea dosarului pentru obținerea autorizației de muncă');
      doc.text('- Ridicarea documentelor și certificatelor necesare');
      doc.text('- Semnarea actelor și documentelor în numele meu');
      doc.text('- Orice alte formalități necesare procesului de imigrare');
      doc.moveDown();

      // Signatures
      doc.text('Data: ________________');
      doc.text('Semnătura: ________________');
      doc.moveDown();

      // Watermark
      this.addWatermark(doc, data.metadata?.watermark || data.worker?.email || 'PREVIEW');

      // Footer
      doc.fontSize(10).fillColor('gray');
      doc.text(`Document generat automat la ${new Date().toLocaleString('ro-RO')}`, {
        align: 'center'
      });

      doc.end();
    });
  }

  private async generateJobDescription(data: TemplateData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(16).text('FIȘA POSTULUI', { align: 'center' });
      doc.moveDown(2);

      // Company info
      doc.fontSize(14).text('ANGAJATOR:', { underline: true });
      doc.fontSize(12);
      doc.text(`Compania: ${data.client?.legalName || '[COMPANY_NAME]'}`);
      doc.text(`CUI: ${data.client?.cui || '[CUI]'}`);
      doc.text(`Adresa: ${data.client?.address || '[ADDRESS]'}`);
      doc.text(`Domeniu de activitate (CAEN): ${data.client?.caen || '[CAEN]'}`);
      doc.moveDown();

      // Job details
      doc.fontSize(14).text('DESCRIEREA POSTULUI:', { underline: true });
      doc.fontSize(12);
      doc.text('Denumirea postului: [JOB_TITLE]');
      doc.text('Locul de muncă: [WORKPLACE]');
      doc.text('Tipul contractului: Contract individual de muncă pe durată [DURATION]');
      doc.moveDown();

      // Requirements
      doc.fontSize(14).text('CERINȚE PENTRU POST:', { underline: true });
      doc.fontSize(12);
      doc.text('- Studii: [EDUCATION_REQUIREMENTS]');
      doc.text('- Experiență: [EXPERIENCE_REQUIREMENTS]');
      doc.text('- Competențe: [SKILLS_REQUIREMENTS]');
      doc.text('- Limbi străine: [LANGUAGE_REQUIREMENTS]');
      doc.moveDown();

      // Responsibilities
      doc.fontSize(14).text('RESPONSABILITĂȚI PRINCIPALE:', { underline: true });
      doc.fontSize(12);
      doc.text('- [RESPONSIBILITY_1]');
      doc.text('- [RESPONSIBILITY_2]');
      doc.text('- [RESPONSIBILITY_3]');
      doc.moveDown();

      // Conditions
      doc.fontSize(14).text('CONDIȚII DE MUNCĂ:', { underline: true });
      doc.fontSize(12);
      doc.text('Salariul: [SALARY] RON');
      doc.text('Programul de lucru: [WORKING_HOURS]');
      doc.text('Beneficii: [BENEFITS]');

      // Watermark
      this.addWatermark(doc, data.metadata?.watermark || data.client?.contactEmail || 'PREVIEW');

      // Footer
      doc.fontSize(10).fillColor('gray');
      doc.text(`Document generat automat la ${new Date().toLocaleString('ro-RO')}`, {
        align: 'center'
      });

      doc.end();
    });
  }

  private async generateVisaApplication(data: TemplateData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(16).text('CERERE PENTRU VIZĂ DE LUNGĂ ȘEDERE', { align: 'center' });
      doc.fontSize(12).text('(Visa D/AM)', { align: 'center' });
      doc.moveDown(2);

      // Personal data
      doc.fontSize(14).text('DATE PERSONALE:', { underline: true });
      doc.fontSize(12);
      doc.text(`Nume: ${data.worker?.lastName || '[LAST_NAME]'}`);
      doc.text(`Prenume: ${data.worker?.firstName || '[FIRST_NAME]'}`);
      doc.text(`Cetățenie: ${data.worker?.nationality || '[NATIONALITY]'}`);
      doc.text(`Numărul pașaportului: ${data.worker?.passportNumber || '[PASSPORT_NUMBER]'}`);
      doc.text(`Email: ${data.worker?.email || '[EMAIL]'}`);
      doc.text(`Telefon: ${data.worker?.phone || '[PHONE]'}`);
      doc.moveDown();

      // Employer data
      doc.fontSize(14).text('DATE ANGAJATOR:', { underline: true });
      doc.fontSize(12);
      doc.text(`Compania: ${data.client?.legalName || '[COMPANY_NAME]'}`);
      doc.text(`CUI: ${data.client?.cui || '[CUI]'}`);
      doc.text(`Adresa: ${data.client?.address || '[ADDRESS]'}`);
      doc.moveDown();

      // Purpose
      doc.fontSize(14).text('SCOPUL CĂLĂTORIEI:', { underline: true });
      doc.fontSize(12);
      doc.text('Desfășurarea unei activități de muncă pe teritoriul României');
      doc.text('în baza autorizației de muncă obținută de la IGI.');
      doc.moveDown();

      // Declaration
      doc.fontSize(12);
      doc.text('Declar pe propria răspundere că informațiile furnizate sunt corecte și complete.');
      doc.moveDown();

      // Signature
      doc.text('Data: ________________');
      doc.text('Semnătura: ________________');

      // Watermark
      this.addWatermark(doc, data.metadata?.watermark || data.worker?.email || 'PREVIEW');

      // Footer
      doc.fontSize(10).fillColor('gray');
      doc.text(`Document generat automat la ${new Date().toLocaleString('ro-RO')}`, {
        align: 'center'
      });

      doc.end();
    });
  }

  private async generateResidenceApplication(data: TemplateData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(16).text('CERERE PENTRU PERMIS DE ȘEDERE', { align: 'center' });
      doc.moveDown(2);

      // Personal data
      doc.fontSize(14).text('SOLICITANTUL:', { underline: true });
      doc.fontSize(12);
      doc.text(`Nume și prenume: ${data.worker?.firstName || '[FIRST_NAME]'} ${data.worker?.lastName || '[LAST_NAME]'}`);
      doc.text(`Cetățenie: ${data.worker?.nationality || '[NATIONALITY]'}`);
      doc.text(`Numărul pașaportului: ${data.worker?.passportNumber || '[PASSPORT_NUMBER]'}`);
      doc.text(`Adresa de domiciliu în România: [ROMANIA_ADDRESS]`);
      doc.moveDown();

      // Employment data
      doc.fontSize(14).text('DATE PRIVIND ACTIVITATEA:', { underline: true });
      doc.fontSize(12);
      doc.text(`Angajator: ${data.client?.legalName || '[COMPANY_NAME]'}`);
      doc.text(`CUI angajator: ${data.client?.cui || '[CUI]'}`);
      doc.text(`Funcția: [JOB_TITLE]`);
      doc.text(`Perioada contractului: [CONTRACT_PERIOD]`);
      doc.moveDown();

      // Request
      doc.fontSize(14).text('SOLICIT:', { underline: true });
      doc.fontSize(12);
      doc.text('Acordarea permisului de ședere temporară în scop de muncă');
      doc.text('pe teritoriul României pentru perioada [PERIOD].');
      doc.moveDown();

      // Documents list
      doc.fontSize(14).text('DOCUMENTE ANEXATE:', { underline: true });
      doc.fontSize(12);
      doc.text('☐ Formularul de cerere completat și semnat');
      doc.text('☐ Pașaportul în original');
      doc.text('☐ Autorizația de muncă');
      doc.text('☐ Contractul individual de muncă');
      doc.text('☐ Dovada cazării');
      doc.text('☐ Asigurarea medicală');
      doc.text('☐ Certificatul de cazier judiciar');
      doc.text('☐ Dovada mijloacelor de întreținere');
      doc.moveDown();

      // Declaration
      doc.text('Declar pe propria răspundere că datele furnizate sunt reale.');
      doc.moveDown();

      // Signature
      doc.text('Data: ________________');
      doc.text('Semnătura solicitantului: ________________');

      // Watermark
      this.addWatermark(doc, data.metadata?.watermark || data.worker?.email || 'PREVIEW');

      // Footer
      doc.fontSize(10).fillColor('gray');
      doc.text(`Document generat automat la ${new Date().toLocaleString('ro-RO')}`, {
        align: 'center'
      });

      doc.end();
    });
  }

  private addWatermark(doc: any, text: string): void {
    if (process.env.WATERMARK_TOGGLE === 'false') return;

    doc.save();
    doc.rotate(-45, { origin: [300, 400] });
    doc.fontSize(72).fillColor('gray', 0.1);
    doc.text(text.toUpperCase(), 50, 350, {
      width: 500,
      align: 'center'
    });
    doc.restore();
  }

  async savePDFToS3(buffer: Buffer, key: string): Promise<string> {
    await s3Service.uploadFile(key, buffer, 'application/pdf');
    return key;
  }
}

export const pdfService = new PDFService();
