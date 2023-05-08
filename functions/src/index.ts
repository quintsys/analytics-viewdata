import * as functions from "firebase-functions";
import { defineSecret } from "firebase-functions/params";
import { google } from "googleapis";
import { AnalyticsData, Dimensions, Row, RowFormatter } from "./types";
import setCorsHeaders from "./cors";

const serviceAccount = defineSecret("GA_SVC_ACCOUNT");

const dimensions: Dimensions = {
  ad: "ga:dimension5,ga:adGroup,ga:adContent,ga:adMatchedQuery",
  origin: "ga:dimension5,ga:campaign,ga:source,ga:medium,ga:keyword",
};

const onError = (res: functions.Response, error: unknown) => {
  functions.logger.error(error);
  res.status(500).send({ error: "Something went wrong" });
};

/**
 * Pulls origin data from a Google Analytics view and returns it as JSON
 * @returns {AnalyticsData[]}
 */
export const gaViewOriginData = functions
  .runWith({ secrets: [serviceAccount.name] })
  .https.onRequest(
    async (req, res) => {
      try {
        setCorsHeaders(req, res);
        if (req.method == "OPTIONS") {
          res.sendStatus(200);
        } else {
          const formatter: RowFormatter = (row: Row) => ({
            clientId: row[0],
            campaign: row[1],
            source: row[2],
            medium: row[3],
            keyword: row[4],
          });
          const data = await gaViewData(dimensions.origin, formatter);
          res.status(200).send(data);
        }
      } catch (error) {
        onError(res, error);
      }
    }
  );

/**
 * Pulls ad data from a Google Analytics view and returns it as JSON
 * @returns {AnalyticsData[]}
 */
export const gaViewAdData = functions
  .runWith({ secrets: [serviceAccount.name] })
  .https.onRequest(
    async (req, res) => {
      try {
        setCorsHeaders(req, res);
        if (req.method == "OPTIONS") {
          res.sendStatus(200);
        } else {
          const formatter: RowFormatter = (row: Row) => ({
            clientId: row[0],
            adGroup: row[1],
            adContent: row[2],
            adMatchedQuery: row[3],
          });
          const data = await gaViewData(dimensions.ad, formatter);
          res.status(200).send(data);
        }
      } catch (error) {
        onError(res, error);
      }
    }
  );

/**
 * Pulls data from a Google Analytics view and returns it as JSON
 * @param {string} dimensions - The dimensions to retrieve from Analytics.
 * @param {RowFormatter} formatter - The formatter function to transform the
 * retrieved rows.
 * @return {AnalyticsData[]} - The formatted analytics data.
 */
const gaViewData = async (
  dimensions: string,
  formatter: RowFormatter
): Promise<AnalyticsData[]> => {
  const result = await getAnalyticsData(dimensions);
  const rows = result.data.rows || [];
  const data: AnalyticsData[] = rows.map((row: Row) => formatter(row));

  return data;
};

/**
 * Returns Google Analytics data for a view
 * @param {string} dimensions - The dimensions to retrieve from Analytics.
 */
const getAnalyticsData = async (dimensions: string) => {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(serviceAccount.value()),
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
  const analytics = google.analytics("v3");
  const {
    GA_VIEW_ID,
    GA_START_DATE = "3daysAgo",
    GA_END_DATE = "today",
  } = process.env;

  return await analytics.data.ga.get({
    auth,
    "ids": GA_VIEW_ID,
    "start-date": GA_START_DATE,
    "end-date": GA_END_DATE,
    "metrics": "ga:sessions",
    "dimensions": dimensions,
  });
};
