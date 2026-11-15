export class ApiResponse {
  /**
   * Standard API Response Envelope
   * @param {number} statusCode - HTTP status code
   * @param {any} data - Payload data
   * @param {string} [message] - Operation status message
   * @param {object} [meta] - Optional pagination or metadata
   */
  constructor(statusCode, data, message = 'Success', meta = undefined) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    if (meta !== undefined) {
      this.meta = meta;
    }
  }

  static ok(res, data, message = 'Success', meta = undefined) {
    return res.status(200).json(new ApiResponse(200, data, message, meta));
  }

  static created(res, data, message = 'Resource created successfully') {
    return res.status(201).json(new ApiResponse(201, data, message));
  }
}

