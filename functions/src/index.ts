import * as functions from "firebase-functions";
import {defineSecret} from "firebase-functions/params";
import {google} from "googleapis";
import {AnalyticsData, Dimensions, Row, RowFormatter} from "./types";
import setCorsHeaders from "./cors";

const serviceAccount = defineSecret("GA_SVC_ACCOUNT");
const bearerToken = defineSecret("GA_BEARER_TOKEN");

const dimensions: Dimensions = {
  ad: "ga:dimension5,ga:adGroup,ga:adContent,ga:adMatchedQuery",
  origin: "ga:dimension5,ga:campaign,ga:source,ga:medium,ga:keyword",
};

const rowFormatters: {[key: string]: RowFormatter} = {
  ad: (row: Row) => ({
    clientId: row[0],
    adGroup: row[1],
    adContent: row[2],
    adMatchedQuery: row[3],
  }),
  origin: (row: Row) => ({
    clientId: row[0],
    campaign: row[1],
    source: row[2],
    medium: row[3],
    keyword: row[4],
  }),
};

/**
 * Pulls origin data from a Google Analytics view and returns it as JSON
 * @returns {AnalyticsData[]}
 */
export const gaViewOriginData = functions
  .runWith({secrets: [bearerToken.name, serviceAccount.name]})
  .https.onRequest(
    async (req: functions.Request, res: functions.Response): Promise<void> => {
      try {
        return gaViewData(req, res, dimensions.origin, rowFormatters.origin);
      } catch (error) {
        functions.logger.error(error);
        res.status(500).send({error: "Something went wrong"});
      }
    }
  );

/**
 * Pulls ad data from a Google Analytics view and returns it as JSON
 * @returns {AnalyticsData[]}
 */
export const gaViewAdData = functions
  .runWith({secrets: [bearerToken.name, serviceAccount.name]})
  .https.onRequest(
    async (req: functions.Request, res: functions.Response): Promise<void> => {
      try {
        return gaViewData(req, res, dimensions.ad, rowFormatters.ad);
      } catch (error) {
        functions.logger.error(error);
        res.status(500).send({error: "Something went wrong"});
      }
    }
  );

/**
 * Pulls data from a Google Analytics view and returns it as JSON
 * @param {functions.Request} req - The request object.
 * @param {functions.Response} res - The response object.
 * @param {string} dimensions - The dimensions to retrieve from Analytics.
 * @param {RowFormatter} formatter - The formatter function to transform the
 * retrieved rows.
 * @return {AnalyticsData[]} - The formatted analytics data.
 */
const gaViewData = async (
  req: functions.Request,
  res: functions.Response,
  dimensions: string,
  formatter: RowFormatter
): Promise<void> => {
  setCorsHeaders(req, res);

  if (req.method == "OPTIONS") {
    functions.logger.log("Preflight");
    res.sendStatus(200);
    return;
  }

  if (!isAuthorized(req)) {
    functions.logger.error("Unauthorized");
    res.status(401).send({error: "Unauthorized"});
    return;
  }

  const {
    GA_VIEW_ID,
    GA_START_DATE = "3daysAgo",
    GA_END_DATE = "today",
  } = process.env;
  if (!GA_VIEW_ID) {
    functions.logger.error("GA_VIEW_ID not set");
    res.status(500).send({error: "GA_VIEW_ID not set"});
    return;
  }

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(serviceAccount.value()),
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
  const analytics = google.analytics("v3");
  const result = await analytics.data.ga.get({
    auth,
    "ids": GA_VIEW_ID,
    "start-date": GA_START_DATE,
    "end-date": GA_END_DATE,
    "metrics": "ga:sessions",
    "dimensions": dimensions,
  });
  const rows = result.data.rows || [];
  const data: AnalyticsData[] = rows.map((row: Row) => formatter(row));

  res.status(200).send(data);
};

/**
 * Checks if the request is authorized to access the data
 * @param {functions.Request} req - The request object.
 * @return {boolean} - Whether the request is authorized.
 */
const isAuthorized = (req: functions.Request): boolean => {
  const authorizationHeader = req.headers["authorization"];
  if (!authorizationHeader) {
    return false;
  }

  const token = authorizationHeader.split("Bearer ")[1];
  return token === bearerToken.value();
};
