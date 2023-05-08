import * as functions from "firebase-functions";

const setCorsHeaders = (req: functions.Request, res: functions.Response) => {
  let oneOf = false;
  if (req.headers.origin) {
    // TODO: validate the origin against a list of allowed origins
    res.header("Access-Control-Allow-Origin", req.headers.origin);
    oneOf = true;
  }
  if (req.headers["access-control-request-method"]) {
    res.header("Access-Control-Allow-Methods",
      req.headers["access-control-request-method"]);
    oneOf = true;
  }
  if (req.headers["access-control-request-headers"]) {
    res.header("Access-Control-Allow-Headers",
      req.headers["access-control-request-headers"]);
    oneOf = true;
  }
  if (oneOf) {
    res.header("Access-Control-Max-Age", (60 * 60 * 24 * 365).toString());
  }
};

export default setCorsHeaders;
