export const pdfService = {
  generatePDF: jest.fn().mockResolvedValue(new Blob(['mock pdf content'])),
};
