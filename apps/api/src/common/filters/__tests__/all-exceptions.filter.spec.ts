import { AllExceptionsFilter } from "../all-exceptions.filter";
import { ArgumentsHost, HttpException, HttpStatus, BadRequestException, NotFoundException, InternalServerErrorException } from "@nestjs/common";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("AllExceptionsFilter", () => {
  let filter: AllExceptionsFilter;
  let consoleErrorSpy: any;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createMockArgumentsHost(customRequest: any = {}): { host: ArgumentsHost; responseMock: any } {
    const responseMock = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };

    const requestMock = {
      headers: {},
      ip: "127.0.0.1",
      v2Context: {},
      ...customRequest,
    };

    const host = {
      switchToHttp: () => ({
        getResponse: () => responseMock,
        getRequest: () => requestMock,
      }),
    } as unknown as ArgumentsHost;

    return { host, responseMock };
  }

  it("should not log NotFoundException (404) on console.error", () => {
    const { host, responseMock } = createMockArgumentsHost();
    const exception = new NotFoundException("Cannot GET /wp-includes");

    filter.catch(exception, host);

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(responseMock.status).toHaveBeenCalledWith(404);
    expect(responseMock.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: "Cannot GET /wp-includes",
          code: "Not Found",
        }),
      })
    );
  });

  it("should not log BadRequestException (400) on console.error", () => {
    const { host, responseMock } = createMockArgumentsHost();
    const exception = new BadRequestException("Validation failed");

    filter.catch(exception, host);

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(responseMock.status).toHaveBeenCalledWith(400);
  });

  it("should log InternalServerErrorException (500) on console.error", () => {
    const { host, responseMock } = createMockArgumentsHost();
    const exception = new InternalServerErrorException("Something broke");

    filter.catch(exception, host);

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(responseMock.status).toHaveBeenCalledWith(500);
  });

  it("should log generic runtime Error on console.error and handle as 500 Internal Server Error", () => {
    const { host, responseMock } = createMockArgumentsHost();
    const exception = new Error("Database connection lost");

    filter.catch(exception, host);

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(responseMock.status).toHaveBeenCalledWith(500);
    expect(responseMock.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: "INTERNAL_SERVER_ERROR",
        }),
      })
    );
  });
});
