export type SalesforceErrorCode = 
  | 'CONNECTION_ERROR'
  | 'UNAUTHORIZED'
  | 'USER_ERROR'
  | 'QUERY_ERROR'
  | 'CREATE_ERROR'
  | 'UPDATE_ERROR'
  | 'DELETE_ERROR';

export class SalesforceError extends Error {
  constructor(
    public readonly code: SalesforceErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'SalesforceError';
    Object.setPrototypeOf(this, SalesforceError.prototype);
  }
}
