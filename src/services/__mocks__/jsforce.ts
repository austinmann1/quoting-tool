const mockConnection = {
  login: jest.fn(),
  logout: jest.fn(),
  sobject: jest.fn().mockReturnThis(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  find: jest.fn(),
};

class Connection {
  constructor() {
    return mockConnection;
  }
}

export default {
  Connection,
  mockConnection, // Export for test assertions
};
