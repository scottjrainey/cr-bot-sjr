import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Langfuse } from "langfuse";
import type { Logger } from "probot";

export interface MessageContentReview {
  path: string;
  body: string;
  suggestion?: string;
  line: number;
  start_line?: number;
}

export interface ReviewResult {
  error: boolean;
  comments?: MessageContentReview[];
}

export interface ContentReviewOptions {
  path: string;
  log: Logger;
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

export default async (patch: string, options: ContentReviewOptions): Promise<ReviewResult> => {
  const {
    log,
    path,
  } = options;

  // Log Langfuse configuration
  log.info('Langfuse Configuration:', {
    publicKey: process.env.LANGFUSE_PUBLIC_KEY ? `***${process.env.LANGFUSE_PUBLIC_KEY.slice(-4)}` : 'not set',
    secretKey: process.env.LANGFUSE_SECRET_KEY ? `***${process.env.LANGFUSE_SECRET_KEY.slice(-4)}` : 'not set',
    baseUrl: process.env.LANGFUSE_BASE_URL || 'not set'
  });

  const langfuse = new Langfuse({
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    baseUrl: process.env.LANGFUSE_BASE_URL,
  });

  // Create a new trace for this code review
  const trace = langfuse.trace({
    name: 'code-review',
    metadata: {
      path,
      patchLength: patch.length
    }
  });

  try {
    // Create a span for prompt fetching
    const promptSpan = trace.span({
      name: 'fetch-prompts',
      input: { path }
    });

    const systemPrompt = await langfuse.getPrompt('cr-bot-sjr.system');
    const userPrompt = await langfuse.getPrompt('cr-bot-sjr.user');

    promptSpan.end({
      output: {
        systemPromptName: 'cr-bot-sjr.system',
        userPromptName: 'cr-bot-sjr.user'
      }
    });

    const model = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-4o-mini",
    }).withStructuredOutput(pullRequestReviewCommentSchema);

    const messages = [
      new SystemMessage({ content: systemPrompt.prompt }),
      new HumanMessage({ content: `${userPrompt.prompt}\npath: ${path}\n${patch}` }),
    ];

    // Create a span for model invocation
    const modelSpan = trace.span({
      name: 'model-invocation',
      input: {
        path,
        messages: messages.map(m => ({ role: m._getType(), content: m.content }))
      }
    });

    const response = await model.invoke(messages);

    // Log the raw response for debugging
    log.debug('Raw model response:', {
      responseType: typeof response,
      responseString: JSON.stringify(response, null, 2)
    });

    // Add additional validation
    if (!response || typeof response !== 'object' || !Array.isArray(response.comments)) {
      log.error('Invalid response structure:', {
        response,
        responseType: typeof response,
        path,
        rawResponse: response ? JSON.stringify(response) : 'null'
      });

      modelSpan.end({
        output: { error: 'Invalid response structure' },
        level: 'ERROR'
      });

      trace.update({
        output: { error: 'Invalid response structure' },
        metadata: { error: 'Invalid response structure' }
      });

      return { error: true };
    }

    modelSpan.end({
      output: {
        commentsCount: response.comments.length,
        comments: response.comments
      }
    });

    trace.update({
      output: { success: true },
      metadata: {
        commentsCount: response.comments.length
      }
    });

    return { error: false, comments: response.comments as MessageContentReview[] };
  } catch (error) {
    // Enhanced error logging with all details in one log entry
    log.error('Error in model response:', {
      error,
      path,
      patchLength: patch.length,
      stack: error instanceof Error ? error.stack : undefined,
      message: error instanceof Error ? error.message : String(error),
      rawError: JSON.stringify(error, Object.getOwnPropertyNames(error))
    });

    trace.update({
      output: { error: error instanceof Error ? error.message : String(error) },
      metadata: {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : String(error)
      }
    });

    return { error: true };
  } finally {
    // Ensure we flush any pending events
    await langfuse.shutdownAsync();
  }
};
