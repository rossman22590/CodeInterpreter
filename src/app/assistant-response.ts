import { AssistantMessage, AssistantStep } from "@/app/shared/types";
import { getStreamString } from "@/app/shared/utils";

export function experimental_AssistantResponse(
  { threadId, messageId }: { threadId: string; messageId: string },
  process: (stream: {
    threadId: string;
    messageId: string;
    sendMessage: (message: AssistantMessage | AssistantStep) => void;
  }) => Promise<void>
): Response {
  const stream = new ReadableStream({
    async start(controller) {
      const textEncoder = new TextEncoder();

      const sendMessage = (message: AssistantMessage | AssistantStep) => {
        if (message.type === "step") {
          controller.enqueue(
            textEncoder.encode(getStreamString("step", message))
          );
        } else {
          controller.enqueue(
            textEncoder.encode(getStreamString("text", message))
          );
        }
      };

      const sendError = (errorMessage: string) => {
        controller.enqueue(
          textEncoder.encode(getStreamString("error", errorMessage))
        );
      };

      // send the threadId and messageId as the first message:
      controller.enqueue(
        textEncoder.encode(
          getStreamString("control_data", {
            threadId,
            messageId,
          })
        )
      );

      try {
        await process({
          threadId,
          messageId,
          sendMessage,
        });
      } catch (error) {
        sendError((error as any).message ?? `${error}`);
      } finally {
        controller.close();
      }
    },
    pull(controller) {},
    cancel() {},
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
