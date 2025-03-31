In this project we use a good amount of Node’s AsyncLocalStorage API. That API is a horribly named but very powerful way to pass variables down the call stack. If you’ve ever used react context, dependency injection, thread-local storage or even request middleware, you’ll be familiar with the concept.

If you want to learn more about the API, here are some [good](https://developers.cloudflare.com/workers/runtime-apis/nodejs/asynclocalstorage/) [resources](https://pawelgrzybek.com/avoid-parameter-drilling-by-using-the-node-js-asynclocalstorage/). We use it with a small wrapper that gives us some error handling, types and a slightly neater API. The usage of it is pretty simple: any code that’s ran in the function or closure called with the `withThing` function can access the information in the store by using the `useThing` function.

```ts
const UserStore = createStore<User>('user');
export const [withUser, useUser] = UserStore;
```

It’s unlikely that you’ll need a new store but if you do, you can follow that example to make one. It’s more likely that you want to add something to the environment. You can learn more about that [here](./env.md). The other main area we use this is for propagating the user responsible for the current request.
