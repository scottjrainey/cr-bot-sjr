import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Logger } from "probot";

interface MessageContentReview {
  path: string;
  body: string;
  suggestion?: string;
  line: number;
  start_line?: number;
}

interface ContentReviewOptions {
  path: string;
  log: Logger;
  prompts: PromptStrings;
}

export interface PromptStrings {
  system: string;
  user: string;
  jsonFormatRequirement: string;
}

/**
 * JSON Schema for pull request review comments
 */
export const pullRequestReviewCommentSchema = {
  type: "object",
  title: "pullRequestReviewComment",
  description: "Schema for ai generated pull request review comments",
  properties: {
    comments: {
      type: "array",
      items: {
        type: "object",
        required: ["path", "body", "line"],
        properties: {
          path: {
            type: "string",
            description: "The file path where the comment is located"
          },
          body: {
            type: "string",
            description: "The content of the review comment"
          },
          suggestion: {
            type: "string",
            description: "The code suggestion if any",
            nullable: true
          },
          line: {
            type: "integer",
            description: "The line number in the file where the comment is located"
          },
          start_line: {
            type: "integer",
            description: "The starting line number for multi-line comments",
            nullable: true
          }
        }
      }
    }
  },
  required: ["comments"],
};

export default async (patch: string, options: ContentReviewOptions) => {
  const {
    log,
    path,
    prompts: { system, user, jsonFormatRequirement },
  } = options;
  // TODO: Enable using other models like Ollma for onprem use
  const model = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-4o-mini",
  }).withStructuredOutput(pullRequestReviewCommentSchema);

  const messages = [
    new SystemMessage(`${system}\n${jsonFormatRequirement}`),
    new HumanMessage(`${user}\npath: ${path}\n${patch}`),
  ];

  const response = await model.invoke(messages);
  log.debug(`model response: ${JSON.stringify(response, null, 2)}`);
  return response.comments as MessageContentReview[];
};
