import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Logger } from "probot";

// These should be moved to a .github/cr-bot-sjr.yml file
const USER = `Please review the following code patch. Create a review for each chunk in the patch. Focus on potential bugs, risks, and improvement suggestions. If needed, offer code fixes in the return comment with explanations upto 200 words. Otherwise comment ':+1: LGTM':`
const SYSTEM = ``
const JSON_FORMAT_REQUIREMENT = `Provide your feedback in strict JSON format with the following structure, one JSON object per review. If there is one or more reviews where \`this.ltgm == false\`, do not incude items where \`this.ltgm == true\`:
[
  {
    "lgtm": boolean, // True if the code looks good to merge, false if there are concerns
    "path": string, // The path to the file being reviewed
    "body": string, // Your review comments. Use github markdown syntax in this string with code suggestions not included. Suggested code will be included in the 'suggestion' parameter of this object.
    "suggestion": string optional, // The code suggestion if any. Do not include this if there is no code suggestion. Code should be well formatted,multiple lines if needed, and a complete appliable snippet.
    "start_line": int optional // The line number where the code suggestion starts, only provided if a code suggestion is present
    "line": int // Either the line number where the suggestion ends, or the first line of the chunk if \`this.ltgm == true\`
  },
  ... // Repeat for each review
]
Ensure your response is a valid JSON array with no other markup.`

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
  const { log, path } = options;
  // TODO: Enable using other models like Ollma for onprem use
  const model = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-4o-mini",
  }).withStructuredOutput(pullRequestReviewCommentSchema);

  const messages = [
    new SystemMessage(`${SYSTEM}\n${JSON_FORMAT_REQUIREMENT}`),
    new HumanMessage(`${USER}\npath: ${path}\n${patch}`),
  ];

  const response = await model.invoke(messages);
  log.debug(`model response: ${JSON.stringify(response, null, 2)}`);
  return response.comments as MessageContentReview[];
};
