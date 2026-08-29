# zips.zoo.ngo — the ZIP corpus rendered by the Next app in docs/, which reads
# ZIPs/*.md frontmatter directly. Serves the static export, not the repo.
FROM mirror.gcr.io/library/node:20-alpine AS build
RUN corepack enable
WORKDIR /src
COPY . .
WORKDIR /src/docs
RUN pnpm install --frozen-lockfile && pnpm build

FROM mirror.gcr.io/library/nginx:1.27-alpine
COPY --from=build /src/docs/out /usr/share/nginx/html
EXPOSE 80
