import http from "node:http";
import url from "node:url";

import { log } from "./app.ts";
import { appState, operations, type ProviderData } from "./queries.ts";

export function startStatusServer(listenAddr: string) {
  const addr = listenAddr.replace("http://", "").replace("https://", "");
  const host = addr.split(":")[0];
  const port = parseInt(addr.split(":")[1] ?? "N/A", 10);

  const server = http.createServer((req, res) => {
    void (async () => {
      const parsedUrl = url.parse(req.url || "", true);
      const pathname = parsedUrl.pathname || "";

      const sendJSON = (status: number, data: object) => {
        res.writeHead(status, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        });

        res.end(JSON.stringify(data, null, 2));
      };

      const _parseBody = async (): Promise<object> => {
        return new Promise((resolve, reject) => {
          let body = "";
          req.on("data", (chunk: string) => (body += chunk));
          req.on("end", () => {
            try {
              resolve(body ? JSON.parse(body) : {});
            } catch (err) {
              if (err instanceof Error) {
                reject(err);
              } else {
                reject(new Error(`Invalid json: ${String(err)}`));
              }
            }
          });
        });
      };

      try {
        //handle preflight requests <- this saves a lot of headache with setting proxy
        if (req.method === "OPTIONS") {
          res.writeHead(204, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "86400",
            "Content-Length": "0",
            "Content-Type": "text/plain charset=UTF-8",
          });
          res.end();
          return;
        }

        // === Routes ===
        if (req.method === "GET" && pathname === "/") {
          return sendJSON(200, {
            message: "Backend is running",
            timestamp: new Date().toISOString(),
          });
        }

        // === App state ===
        if (req.method === "GET" && pathname === "/state") {
          return sendJSON(200, {
            appState,
            timestamp: new Date().toISOString(),
          });
        }
        // === Provider data ===
        if (req.method === "GET" && pathname === "/providers") {
          const pd = operations.getProviderData();

          const reqData: ProviderData = {
            grouped: pd?.grouped ?? "",
            byProviderId: {},
          };

          for (const [key, value] of Object.entries(pd?.byProviderId || {})) {
            reqData.byProviderId[key] = {
              providerName: value.providerName,
              providerId: value.providerId,
              numberOfJobs: value.numberOfJobs,
              totalWork: value.totalWork,
              jobId: value.jobId,
              totalCost: value.totalCost,
              totalWorkHours: value.totalWorkHours,
              numberOfJobs24h: value.numberOfJobs24h,
              totalWork24h: value.totalWork24h,
              totalCost24h: value.totalCost24h,
              totalWorkHours24h: value.totalWorkHours24h,
              lastJobDate: value.lastJobDate,
              longestJob: value.longestJob,
            };
          }

          return sendJSON(200, {
            providers: reqData,
            timestamp: new Date().toISOString(),
          });
        }

        // Default 404
        sendJSON(404, { error: "Not Found" });
      } catch (err) {
        sendJSON(500, { error: `Internal Server Error ${err}` });
      }
    })().catch((err) => {
      log.error("Unhandled error in request handler:", err);
    });
  });

  log.info("Starting native status server...");
  server.listen(port, host, () => {
    log.info(`Native status server running at ${listenAddr}/status`);
  });
  log.info("Native status server started.");
}
