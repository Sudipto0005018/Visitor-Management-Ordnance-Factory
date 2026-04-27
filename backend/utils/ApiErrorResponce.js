const ApiResponse = require("./ApiResponse");
class ApiErrorResponce extends ApiResponse {
    constructor(statusCode, data = {}, message = "Something went wrong") {
        super(statusCode, data, message);
        this.success = false;
    }
}
module.exports = ApiErrorResponce;
