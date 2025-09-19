import { urlParams } from "../utils";
interface Env {
  faku_ai: Ai;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const params = urlParams(context.request.url);

  // const input = {
  //   messages: [
  //     {
  //       role: "system",
  //       content:
  //         "你是量化监控助手。结合下面的指标，请用不超过120字简体中文，生成「近24小时」数据摘要，要求：客观、精炼，给出趋势与风险提示,返回不要包含提示词。",
  //     },
  //     { role: "user", content: params.prompt },
  //   ],
  // };
  const input =  {
    instructions: '你是量化监控助手。结合下面的指标，请用不超过120字简体中文，生成「近24小时」数据摘要，要求：客观、精炼，给出趋势与风险提示,返回不要包含提示词。',
    input: params.prompt,
  };
  // const input = { prompt: params.prompt};

  const answer = await context.env.faku_ai.run(
    "@cf/openai/gpt-oss-20b",
    // "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
    input
  );

  return Response.json(answer);
};
