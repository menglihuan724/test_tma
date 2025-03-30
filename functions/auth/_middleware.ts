interface Env {
  TODO_LIST: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const task = await context.env.faku_h5.get("public_key");
  console.log(task);
  return new Response(task);
};
