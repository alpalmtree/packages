# Packages I had fun while building and thought it would be interesting to share

Recently, Deno announced the return of `deno bundle` in its version 2.4, using esbuild behind the scenes and with explicit support for targeting the browser.

This update is actually awesome for us fans of CDNs and Deno. This basically means we can bundle from CDNs as well as from official registries. If you decide to go with a CDN + Deno, you'll get the best of both worlds: you can still get intellisense from the source code, bundle it as part of your application code and avoid having a `node_modules` folder — while still being able to avoid to vendor your dependencies manually.

From the developer perspective, this simplifies the workflow a lot; and it gives us the possibility of actually owning and hosting our code without the intermediaries of package registries. You just upload your files to a public folder, and we are good to go.

Work in progress!
