import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { RewriteMessageBody, RewriteMessageResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const REWRITE_PROMPT = `You are a communications expert. Your task is to rewrite a potentially manipulative message into a plausible, legitimate, non-manipulative version that would serve the same genuine purpose — if there is one.

Rules:
- Remove all psychological pressure tactics: urgency, threats, secrecy instructions, implausible promises
- Keep the same general topic (e.g. if it's about an account, still write about an account)
- Write in a calm, professional, transparent tone
- If the original is outright fraudulent (prize scam, fake lottery), rewrite it as what a legitimate version of this kind of communication might look like — e.g. a real bank notification
- Do NOT add new information not implied by the original
- Respond with ONLY the rewritten message text — no explanations, no preamble, no quotes

If the message appears to be entirely legitimate already, return it unchanged.`;

router.post("/rewrite", async (req, res): Promise<void> => {
  const parsed = RewriteMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { message } = parsed.data;

  const completion = await openai.chat.completions.create({
    model: "gpt-5.6-terra",
    max_completion_tokens: 1024,
    messages: [
      { role: "system", content: REWRITE_PROMPT },
      { role: "user", content: message },
    ],
  });

  const rewritten = completion.choices[0]?.message?.content?.trim();
  if (!rewritten) {
    res.status(500).json({ error: "No rewrite returned" });
    return;
  }

  const result = RewriteMessageResponse.safeParse({ original: message, rewritten });
  if (!result.success) {
    res.status(500).json({ error: "Rewrite result had unexpected shape" });
    return;
  }

  res.json(result.data);
});

export default router;
