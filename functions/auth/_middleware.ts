interface Env {
  faku_h5: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const task = await context.env.faku_h5.get("public_key");
  return new Response(task);
};
