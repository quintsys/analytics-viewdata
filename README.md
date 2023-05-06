# Google Analytics View Data
This project integrates with the [Google Analytics Core Reporting API][api] to
extract metrics from a predefined View. The response will contain metrics
extracted from the Google Analytics view data, and each record will be
associated with a given [`clientId`][cid].

## Configuration

This project uses the built-in environment configuration offered by the Firebase
SDK for Cloud Functions to make it easy to store and retrieve additional
settings.

More information at https://firebase.google.com/docs/functions/config-env

### Environment variables
Before running the Cloud Function, the following environment variables must be
present:

| Name          | Value  | Required | Summary                                 |
|---------------|--------|----------|-----------------------------------------|
| GA_VIEW_ID    | string | yes      | The unique table ID of the form `ga:XXXX`, where `XXXX` is the Analytics view (profile) ID for which the query will retrieve the data.|
| GA_START_DATE | string | no       | Start date for fetching Analytics data.<br /> Requests can specify a start date formatted as `YYYY-MM-DD`, or as a relative date (e.g., `today`, `yesterday`, or `NdaysAgo` where `N` is a positive integer).<br /> Defaults to `3daysAgo`. |
| GA_END_DATE   | string | no       | End date for fetching Analytics data.<br /> Request can specify an end date formatted as `YYYY-MM-DD`, or as a relative date (e.g., `today`, `yesterday`, or `NdaysAgo` where `N` is a positive integer).<br /> Defaults to `today`. |

To set these environment variables, create a `.env` file in the `/functions`
folder with the desired variable values. For example:

```bash
GA_VIEW_ID=ga:123456
GA_START_DATE=yesterday
GA_END_DATE=today
```

When deploying your functions using the Firebase CLI, the variables from the
`.env` file will be automatically loaded. Run the following command to deploy
the functions:

```bash
firebase deploy --only functions
# ...
# i functions: Loaded environment variables from .env.
# ...
```

### Secrets
The following secret needs to be stored in Cloud Secret Manager:

| Name            | Value  | Required | Summary                               |
|-----------------|--------|----------|---------------------------------------|
| GA_SVC_ACCOUNT  | string | yes      | Service account key for Analytics API |


To set the secret, use the following command:

```bash
firebase functions:secrets:set --data-file ./svc-account.json GA_SVC_ACCOUNT
```

Replace `./svc-account.json` with the path to your service account key file.

Ensure that you have the necessary permissions to manage secrets in Cloud
Secret Manager.

Once the secret is set, the Firebase Functions runtime will automatically load
it when running the functions.

Make sure to set all the required environment variables and secrets before
running your Cloud Function to ensure proper functionality.


## Usage
To run the Cloud Function, execute the following command in your terminal:

```bash
firebase serve --only functions
```

This will start a local development server and you can trigger the Cloud
Function using an HTTP request to
http://localhost:5000/{your-project-id}/{location}/gaViewData

The Cloud Function will extract all records from the Google Analytics view
within the specified date range and associate each record with a given client ID.

To deploy the Cloud Function to production, run:

```bash
firebase deploy --only functions
```

## Response Data

The Cloud Function will return a JSON object containing an array of records,
with each record having the following fields:

| Field           | Type   | Description                                      |
|-----------------|--------|--------------------------------------------------|
| clientId        | string | The unique client ID associated with the record. |
| adGroup         | string | The name of the ad group that served the ad.     |
| adContent       | string | For Google Ads traffic, this will be the first line of the Ad. For Microsoft and other non-Google Ads, it is the equivalent of the `adGroup` field. |
| adMatchedQuery  | string | The search query that matched the ad.            |
| campaign        | string | The name of the campaign that served the ad.     |
| source          | string | The source of the traffic.                       |
| medium          | string | The medium of the traffic.                       |
| keyword         | string | The keyword used in the search.                  |


Here's an example response object:

```json
{
  "data": [
    {
      "clientId": "1234.5678",
      "adGroup": "Ad Group 1",
      "adContent": "Content 1",
      "adMatchedQuery": "Keyword 1",
      "campaign": "Campaign 1",
      "source": "google",
      "medium": "cpc",
      "keyword": "Keyword 1",
    },
    {
      "clientId": "5678.1234",
      "adGroup": "Ad Group 2",
      "adContent": "Ad Group 2",
      "adMatchedQuery": "Keyword 2",
      "campaign": "Campaign 2",
      "source": "bing",
      "medium": "cpc",
      "keyword": "Keyword 2",
    }
  ]
}
```

## Contributing
Contributions to this project are welcome. Please open a pull request with your
changes.

## License
This project is licensed under the [MIT License][mit].

[api]: https://developers.google.com/analytics/devguides/reporting/core/v3/
[cid]: https://developers.google.com/analytics/devguides/collection/analyticsjs/field-reference#clientId
[mit]: https://opensource.org/licenses/MIT
