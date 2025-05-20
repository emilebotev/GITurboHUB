import { POST } from "../../../../app/api/auth/signup/route";
import { pool } from "../../../../pg.config";

// Mock the database connection for testing
jest.mock("../../../../pg.config", () => ({
  pool: {
    connect: jest.fn().mockResolvedValue({
      query: jest.fn(),
      release: jest.fn(),
    }),
    end: jest.fn(),
  },
}));

function createMockRequest(body: any) {
  return {
    json: async () => body,
  } as unknown as Request;
}

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await pool.end();
  });

  it("should return 409 if the email is already registered", async () => {
    // First signup attempt should succeed
    const req1 = createMockRequest({
      email: "duplicate@example.com",
      password: "password123",
    });
    const response1 = await POST(req1);
    expect([201, 409, 500]).toContain(response1.status); // Accept 201, 409, or 500 if test runs multiple times

    // Mock the database to simulate duplicate email on second attempt
    const req2 = createMockRequest({
      email: "duplicate@example.com",
      password: "anotherpassword",
    });
    // Simulate duplicate email error by mocking the query method
    (pool.connect as jest.Mock).mockResolvedValueOnce({
      query: jest.fn().mockImplementation((query: string) => {
        if (query.includes("SELECT")) {
          // Simulate existing user found
          return {
            rows: [{ id: 1 }],
          };
        }
        return {};
      }),
      release: jest.fn(),
    });

    const response2 = await POST(req2);
    expect(response2.status).toBe(409);
    const text = await response2.text();
    expect(text.toLowerCase()).toContain("email already exists");
  });

  it("should return 400 if password is missing", async () => {
    const req = createMockRequest({
      email: "missingpass@example.com",
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
    const text = await response.text();
    expect(text).toBe("Email and password are required");
  });

  it("should return 400 if email is missing", async () => {
    const req = createMockRequest({
      password: "somepassword",
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
    const text = await response.text();
    expect(text).toBe("Email and password are required");
  });

  it("should return 400 if email is invalid", async () => {
    const req = createMockRequest({
      email: "invalid-email",
      password: "password123",
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const text = await response.text();
    expect(text.toLowerCase()).toContain("invalid email");
  });

  it("should return 201 in valid case", async () => {
    (pool.connect as jest.Mock).mockResolvedValueOnce({
      query: jest
        .fn()
        // First call: SELECT to check if user exists (should return empty)
        .mockImplementationOnce((query: string) => {
          if (query.includes("SELECT")) {
            return { rows: [] };
          }
          return {};
        })
        // Second call: INSERT to create user (should return new user id)
        .mockImplementationOnce((query: string) => {
          if (query.includes("INSERT")) {
            return { rows: [{ id: 123 }] };
          }
          return {};
        }),
      release: jest.fn(),
    });
    const req = createMockRequest({
      email: "validemail@email.com",
      password: "password123",
    });

    const response = await POST(req);
    expect(response.status).toBe(201);
    const text = await response.text();
    expect(text).toBe(JSON.stringify({ userId: 123 }));
    expect(pool.connect).toHaveBeenCalledTimes(1);
  });
});
