import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { spawn } from "child_process";

const runArjun = (args: string[]) => {
  return new Promise<string>((resolve, reject) => {
    const proc = spawn("arjun", args, { env: process.env });

    let output = "";

    proc.stdout.on("data", (data) => {
      output += data.toString();
    });

    proc.stderr.on("data", (data) => {
      output += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(`arjun exited with code ${code}. Output: ${output}`));
      }
    });

    proc.on("error", (err) => {
      reject(new Error(`Failed to start arjun: ${err.message}`));
    });
  });
};

const handler = createMcpHandler(
  async (server) => {
    server.tool(
      "do-arjun",
      "Run Arjun to discover hidden HTTP parameters",
      {
        url: z.string().url().optional().describe("Target URL to scan for hidden parameters"),
        textFile: z.string().optional().describe("Path to file containing multiple URLs"),
        wordlist: z.string().optional().describe("Path to custom wordlist file"),
        method: z
          .enum(["GET", "POST", "JSON", "HEADERS"])
          .optional()
          .describe("HTTP method to use for scanning (default: GET)"),
        rateLimit: z
          .number()
          .optional()
          .describe("Maximum requests per second (default: 9999)"),
        chunkSize: z
          .number()
          .optional()
          .describe("Chunk size: number of parameters to send at once"),
      },
      async ({ url, textFile, wordlist, method, rateLimit, chunkSize }) => {
        if (!url && !textFile) {
          throw new Error("Either url or textFile must be provided");
        }

        const arjunArgs: string[] = [];

        if (url) {
          arjunArgs.push("-u", url);
        }
        if (textFile) {
          arjunArgs.push("-f", textFile);
        }
        if (wordlist) {
          arjunArgs.push("-w", wordlist);
        }
        if (method) {
          arjunArgs.push("-m", method);
        }
        if (rateLimit) {
          arjunArgs.push("--rate-limit", rateLimit.toString());
        }
        if (chunkSize) {
          arjunArgs.push("-c", chunkSize.toString());
        }

        const result = await runArjun(arjunArgs);
        return {
          content: [
            {
              type: "text",
              text: result || "Arjun completed with no output",
            },
          ],
        };
      }
    );
  },
  {
    capabilities: {
      tools: {
        listChanged: true,
        "do-arjun": {
          description: "Run Arjun to discover hidden HTTP parameters",
        },
      },
    },
  } as any,
  {
    basePath: "",
    verboseLogs: true,
    maxDuration: 60,
    disableSse: true,
  }
);

export { handler as GET, handler as POST, handler as DELETE };
