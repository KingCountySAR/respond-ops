# Respond - SAR Operations Manager

## Development Guide
The application is split into three parts:
- **Server** - HTTP server based on Hono. Static HTML files, JSON API, and websocket broker
- **Shared** - Types and utility methods shared beween server and web frontend
- **Web** - Vite+React frontend

### Quick Start
- Install the dependencies: `npm install`
- Start both the web server and frontend dev environment: `npm run dev`
  - or, if `concurrently` isn't working well or you want the logs in separate windows, `npm run dev -w server` and `npm run dev -w client`

The project uses `npm` workspaces. This works pretty much the same as regular `npm` commands, with the addition of the `-w` workspace parameter. ex: `npm install --save date-fns -w server`

### Frontend/Web
The web frontend is a Vite+React frontend with support for hot-reload development, bundling/shaking, and code splitting. Logic/state is managed by [MobX](https://mobx.js.org/README.html), which blends class-based business logic with a reactive-style notification system that will trigger React renders/etc.

#### MobX Introduction
The MobX [documentation](https://mobx.js.org/README.html) is pretty good, and you should probably read the [gist of MobX](https://mobx.js.org/the-gist-of-mobx.html). In brief:
- Class fields marked `@observable` will generate proxies for that field. Mutations to the field value will trigger a set of reactions.
- Mutations of `@observable` must happen in in an "action." This can be done explicitly (`runInAction(() => store.counter++)`), or using a method that is decorated with `@action` or `@action.bound`.
- `@computed` getters will lazily compute, and cache, derived state from `@observable` fields. Changes to `@observable`s will automatically propagate to `@computed` properties.
- React components wrapped in an `observer` will automatically render when its `@observable` props change.

In an effort to maintain separation between business logic and the UI/view, you will see "Store" classes for business/domain logic and "UI Store" classes for more complex UI management. UI Stores will almost always reference other Store classes to do work. For UI with minimal state management, it's fine to use React state.
