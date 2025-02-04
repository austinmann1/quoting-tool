import React from 'react';

export const Font = {
  register: jest.fn().mockImplementation(() => Promise.resolve()),
  getRegisteredFonts: jest.fn().mockReturnValue([]),
  getFont: jest.fn().mockReturnValue({}),
  clear: jest.fn(),
};

export const PDFDownloadLink = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="pdf-download-link">{children}</div>
);

export const Document = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="pdf-document">{children}</div>
);

export const Page = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="pdf-page">{children}</div>
);

export const Text = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="pdf-text">{children}</div>
);

export const View = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="pdf-view">{children}</div>
);

export const StyleSheet = {
  create: (styles: any) => styles,
};
