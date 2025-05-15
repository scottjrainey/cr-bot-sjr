import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { Logger } from "probot";

export interface MessageContentReview {
  path: string;
  body: string;
  suggestion?: string;
  line: number;
  start_line?: number;
}

export interface ContentReviewOptions {
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
            description: "The file path where the comment is located",
          },
          body: {
            type: "string",
            description: "The content of the review comment",
          },
          suggestion: {
            type: "string",
            description: "The code suggestion if any",
            nullable: true,
          },
          line: {
            type: "integer",
            description: "The line number in the file where the comment is located",
          },
          start_line: {
            type: "integer",
            description: "The starting line number for multi-line comments",
            nullable: true,
          },
        },
      },
    },
  },
  required: ["comments"],
};

export default async (patch: string, options: ContentReviewOptions) => {
  const {
    log,
    path,
    prompts: { system, user, jsonFormatRequirement },
  } = options;

  const model = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-4o-mini",
  }).withStructuredOutput(pullRequestReviewCommentSchema);

  const messages = [
    new SystemMessage(`${system}\n${jsonFormatRequirement}`),
    new HumanMessage(`${user}\npath: ${path}\n${patch}`),
  ];

  try {
    const response = await model.invoke(messages);

    // Log the raw response for debugging
    log.debug('Raw model response:', {
      responseType: typeof response,
      responseString: JSON.stringify(response, null, 2)
    });

    // Add additional validation
    if (!response || typeof response !== 'object' || !Array.isArray(response.comments)) {
      log.error('Invalid response structure:', response);
      return [];
    }

    return response.comments as MessageContentReview[];
  } catch (error) {
    log.error('Error in model response:', error);
    if (error instanceof SyntaxError) {
      log.error('JSON parsing error. Raw response:', error.message);
    }
    return [];
  }
};
