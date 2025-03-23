import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const USER = `Please review the following code patch. Create a review for each chunk in the patch. Focus on potential bugs, risks, and improvement suggestions. If needed, offer code fixes in the return comment with explanations upto 200 words. Otherwise comment ':+1: LGTM':`
const SYSTEM = ``
const JSON_FORMAT_REQUIREMENT = `Provide your feedback in a strict JSON format with the following structure, one JSON object per review. If there is one or more reviews where \`this.ltgm == false\`, do not incude items where \`this.ltgm == true\`:
[
  {
    "lgtm": boolean, // True if the code looks good to merge, false if there are concerns 
    "body": string, // Your review comments. Use github markdown syntax in this string with code suggestions handled as commitable changes using the '\`\`\`suggestion' syntax. The suggested code should cover an uninterupeted range of lines. The overall response must be a valid JSON
    "start_line": int | null // The line number where the code suggestion starts, null if no code suggestion is given
    "line": int | null // Either the line number where the suggestion ends, or the first line of the chunk if \`this.ltgm == true\`
  },
  ... // Repeat for each review
]
Ensure your response is a valid JSON object.`
// .giitignore globs to include and ignore files
// const REVIEW_FILES = ''

interface MessageContentReview {
  path: string;
  body: string;
  line: number;
  start_line?: number;
}

export default async (patch: string) => {
  const model = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-4o-mini",
  });
      
  const messages = [
    new SystemMessage(`${SYSTEM}\n${JSON_FORMAT_REQUIREMENT}`),
    new HumanMessage(`${USER}\n${patch}`),
  ];

  const res = await model.invoke(messages);
  return res.content as MessageContentReview[];
};
