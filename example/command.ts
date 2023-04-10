import * as dotenv from "dotenv";
import * as fs from "fs";
import tiktoken from "tiktoken-node";
import { ModelMessage } from "../src/index";
import { Chat } from "../src/models/api/openai";
import { chatCompressionRequest } from "./prompt";

dotenv.config();

const run = async () => {
  const enc = tiktoken.encodingForModel("text-davinci-003");
  const messages_file_path = process.env.HISTORY_FILE || ".chimaera_history";
  const json_messages = fs.readFileSync(messages_file_path, "utf8");
  const messages = JSON.parse(json_messages) as ModelMessage[];
  console.log("Continuing from previous session...");
  let tokens = 0;
  for (const message of messages) {
    console.log(`${message.role}: ${message.content}`);
    tokens += enc.encode(message.content || "").length;
  }
  console.log(`Total tokens: ${tokens}`);

  console.log("Compressing history...");
  let compressed = "";
  const request = chatCompressionRequest(messages);
  console.log(request);
  for await (const chunk of Chat.events(request)) {
    if (chunk.content) {
      compressed += chunk.content;
      process.stdout.write(chunk.content);
    }
  }

  process.stdout.write("\n\n");
  console.log(`Total tokens: ${enc.encode(compressed).length}`);
};

run();
