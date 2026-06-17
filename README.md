# Fork notice — 00o-sh/homepage

> This is a downstream fork of [`gethomepage/homepage`](https://github.com/gethomepage/homepage). The upstream README is preserved below; the fork-specific docs come first.

## Why this fork exists

We carry exactly one application-level patch on top of upstream: **aggregate totals across multiple kopia repositories** in the kopia widget. The widget upstream renders the first matching source only; the patch sums `totalSize` across every source matching the host/path filter, takes the newest successful `lastSnapshot.startTime` as last run, and the soonest `nextSnapshotTime` as next run. When more than one source matches, the status block reads `N sources`.

The PR upstreaming this was declined. Rather than maintain an ever-diverging fork, we keep the patch as a single commit on `dev` and republish upstream releases with that commit cherry-picked on top.

## Branch model

Single long-lived branch:

| Branch       | Purpose                                                                                                                                                          | Who writes to it                                                                                                     |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `dev`        | `gethomepage/homepage:dev` + downstream patches (currently: the kopia aggregation commit) + the two automation workflows + this section. Default branch.         | Maintainers when adding/updating a downstream patch. Sync workflow rebases it onto `gethomepage/homepage:dev` daily. |
| `release/v*` | Ephemeral. Created by the release workflow from an upstream tag, with `dev`'s `src/` and `docs/` patches cherry-picked on top. Deleted after the release is cut. | Release workflow only.                                                                                               |

If you need to fix or extend the downstream patch, commit to `dev`. The next release cut picks the new commit up automatically.

## Release scheme

Tags and Releases here mirror upstream's versioning exactly. When upstream publishes `v1.13.1`, this repo eventually publishes `v1.13.1` too, with our patch applied:

- Git tag `v1.13.1` at the tip of the (now-deleted) `release/v1.13.1` branch.
- Container image `ghcr.io/00o-sh/homepage:v1.13.1` (and `:v1.13`, `:v1`, plus `:latest` moved forward).
- A real GitHub Release object (Renovate's `github-releases` datasource needs the Release, not just a tag) with notes linking back to the upstream release and listing the cherry-picked downstream patches.

Downstream (Helm/Renovate) pins to the GitHub Release tag and resolves the matching image tag.

## Workflows

### `sync-upstream.yaml` — daily 00:00 UTC + manual

Fetches `gethomepage/homepage`, rebases fork `dev` onto `upstream/dev`, force-pushes with lease. Opens an issue on conflict.

### `release.yaml` — daily 01:00 UTC + manual

Resolves the target upstream tag (latest by default, or the one passed via `workflow_dispatch` input). If a Release with that tag already exists here, skips. Otherwise:

1. Creates `release/<tag>` from the upstream tag.
2. Cherry-picks every `--no-merges` commit on `dev` that's not on `upstream/dev`, **restricted to `src/` and `docs/`** — workflows and this section stay on `dev`.
3. Runs `pnpm install --frozen-lockfile && pnpm run build`, then builds & pushes a multi-arch image to GHCR with semver tags and `:latest`.
4. Creates the Git tag at the release branch HEAD.
5. Publishes a GitHub Release.
6. Deletes the release branch.

Cherry-pick conflicts open an issue and stop.

## Adding another downstream patch

1. Branch off `dev`, write the patch (must touch `src/` or `docs/` to get picked up by the release workflow — see "Release scope caveat" below), open a PR.
2. Merge to `dev`. The next release cut will include it.
3. Update the "Why this fork exists" section if the patch warrants explanation.

### Release scope caveat

The release workflow cherry-picks only `src/` and `docs/` paths from `dev`. If you add a patch that needs to ship inside the Docker image but lives outside those paths (e.g. `next.config.js`, `package.json`, top-level config), edit `PATCH_PATHS` in `.github/workflows/release.yaml`.

## Re-cutting a release

If a downstream patch turns out to be broken and we need to re-cut `v1.13.1` (say) with a fix:

1. Fix the patch on `dev` and merge.
2. Delete the GitHub Release for `v1.13.1` (Releases page → Edit → Delete release).
3. Delete the Git tag: `git push origin :refs/tags/v1.13.1`.
4. Delete the GHCR image tag (Packages → homepage → Manage versions).
5. Trigger `release.yaml` with `tag: v1.13.1`.

The workflow refuses to re-build a tag that already has a Release, so all three deletions are required.

## Maintainer one-time setup

- **Repository → Settings → Actions → General → Workflow permissions**: set to **Read and write permissions**. Both workflows push commits, tags, releases, and images using `GITHUB_TOKEN`.
- **First image push**: after `release.yaml` runs successfully once, go to **the user profile → Packages → homepage → Package settings**, and change visibility to **Public** so the Helm cluster can pull without auth.
- **GitHub Releases default**: nothing to configure — the workflow creates Releases via `gh release create --verify-tag`, which publishes immediately (not as draft).

No PATs are required.

## Deprecated: `docker-publish.yml`

The legacy nightly workflow is kept as `workflow_dispatch`-only for one-off debug builds. Its schedule and push triggers are removed; the downstream cluster no longer consumes `:nightly` or `:dev` tags.

---

# Upstream README

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="images/banner_light@2x.png">
    <img src="images/banner_dark@2x.png" width="65%">
  </picture>
</p>

<p align="center">
  A modern, <em>fully static, fast</em>, secure <em>fully proxied</em>, highly customizable application dashboard with integrations for over 100 services and translations into multiple languages. Easily configured via YAML files or through docker label discovery.
</p>

<p align="center">
  <img src="images/1.png?v=2" />
</p>

<p align="center">
  <a href="https://github.com/gethomepage/homepage/actions/workflows/docker-publish.yml"><img alt="GitHub Workflow Status (with event)" src="https://img.shields.io/github/actions/workflow/status/gethomepage/homepage/docker-publish.yml"></a>
  &nbsp;
  <a href="https://codecov.io/gh/gethomepage/homepage"><img src="https://codecov.io/gh/gethomepage/homepage/graph/badge.svg?token=7SKFL4D9K7"/></a>
  &nbsp;
  <a href="https://crowdin.com/project/gethomepage" target="_blank"><img src="https://badges.crowdin.net/gethomepage/localized.svg"></a>
  &nbsp;
  <a href="https://discord.gg/k4ruYNrudu"><img alt="Discord" src="https://img.shields.io/discord/1019316731635834932"></a>
  &nbsp;
  <a href="https://gethomepage.dev/" title="Docs"><img title="Docs" src="https://github.com/gethomepage/homepage/actions/workflows/docs-publish.yml/badge.svg"/></a>
  &nbsp;
  <a href="https://paypal.me/phelpsben" title="Donate"><img alt="GitHub Sponsors" src="https://img.shields.io/github/sponsors/benphelps"></a>
</p>

# Features

With features like quick search, bookmarks, weather support, a wide range of integrations and widgets, an elegant and modern design, and a focus on performance, Homepage is your ideal start to the day and a handy companion throughout it.

- **Fast** - The site is statically generated at build time for instant load times.
- **Secure** - All API requests to backend services are proxied, keeping your API keys hidden. Constantly reviewed for security by the community.
- **For Everyone** - Images built for AMD64, ARM64.
- **Full i18n** - Support for over 40 languages.
- **Service & Web Bookmarks** - Add custom links to the homepage.
- **Docker Integration** - Container status and stats. Automatic service discovery via labels.
- **Service Integration** - Over 100 service integrations, including popular starr and self-hosted apps.
- **Information & Utility Widgets** - Weather, time, date, search, and more.
- **And much more...**

## Docker Integration

Homepage has built-in support for Docker, and can automatically discover and add services to the homepage based on labels. See the [Docker Service Discovery](https://gethomepage.dev/configs/docker/#automatic-service-discovery) page for more information.

## Service Widgets

Homepage also has support for hundreds of 3rd-party services, including all popular \*arr apps, and most popular self-hosted apps. Some examples include: Radarr, Sonarr, Lidarr, Bazarr, Ombi, Tautulli, Plex, Jellyfin, Emby, Transmission, qBittorrent, Deluge, Jackett, NZBGet, SABnzbd, etc. As well as service integrations, Homepage also has a number of information providers, sourcing information from a variety of external 3rd-party APIs. See the [Service](https://gethomepage.dev/widgets/) page for more information.

## Information Widgets

Homepage has built-in support for a number of information providers, including weather, time, date, search, glances and more. System and status information presented at the top of the page. See the [Information Providers](https://gethomepage.dev/widgets/) page for more information.

## Customization

Homepage is highly customizable, with support for custom themes, custom CSS & JS, custom layouts, formatting, localization and more. See the [Settings](https://gethomepage.dev/configs/settings/) page for more information.

# Getting Started

For configuration options, examples and more, [please check out the homepage documentation](http://gethomepage.dev).

## Security Notice 🔒

Please note that when using features such as widgets, Homepage can access personal information (for example from your home automation system) and Homepage currently does not (and is not planned to) include any authentication layer itself. If Homepage is reachable from any untrusted network, it **must** sit behind a reverse proxy (and/or VPN) that enforces authentication, TLS, and strictly validates Host headers. The built-in host check in Homepage is a best-effort guard and should not be treated as security when exposed publicly.

## With Docker

Using docker compose:

```yaml
services:
  homepage:
    image: ghcr.io/gethomepage/homepage:latest
    container_name: homepage
    environment:
      HOMEPAGE_ALLOWED_HOSTS: gethomepage.dev # required, may need port. See gethomepage.dev/installation/#homepage_allowed_hosts
      PUID: 1000 # optional, your user id
      PGID: 1000 # optional, your group id
    ports:
      - 3000:3000
    volumes:
      - /path/to/config:/app/config # Make sure your local config directory exists
      - /var/run/docker.sock:/var/run/docker.sock:ro # optional, for docker integrations
    restart: unless-stopped
```

or docker run:

```bash
docker run --name homepage \
  -e HOMEPAGE_ALLOWED_HOSTS=gethomepage.dev \
  -e PUID=1000 \
  -e PGID=1000 \
  -p 3000:3000 \
  -v /path/to/config:/app/config \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  --restart unless-stopped \
  ghcr.io/gethomepage/homepage:latest
```

## From Source

First, clone the repository:

```bash
git clone https://github.com/gethomepage/homepage.git
```

Then install dependencies and build the production bundle:

```bash
pnpm install
pnpm build
```

If this is your first time starting, copy the `src/skeleton` directory to `config/` to populate initial example config files.

Finally, run the server in production mode:

```bash
pnpm start
```

# Configuration

Please refer to the [homepage documentation website](https://gethomepage.dev/) for more information. Everything you need to know about configuring Homepage is there. Please read everything carefully before asking for help, as most questions are answered there or are simple YAML configuration issues.

# Development

Install NPM packages, this project uses [pnpm](https://pnpm.io/) (and so should you!):

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to start.

This is a [Next.js](https://nextjs.org/) application, see their documentation for more information.

# Documentation

The homepage documentation is available at [https://gethomepage.dev/](https://gethomepage.dev/).

Homepage uses Zensical for documentation. To run the documentation locally, first install the dependencies:

```bash
uv sync
```

Then run the development server:

```bash
uv run zensical serve # or build, to build the static site
```

# Support & Suggestions

If you have any questions, suggestions, or general issues, please start a discussion on the [Discussions](https://github.com/gethomepage/homepage/discussions) page.

## Troubleshooting

In addition to the docs, the [troubleshooting guide](https://gethomepage.dev/troubleshooting/) can help reveal many basic config or network issues. If you're having a problem, it's a good place to start.

## Contributing & Contributors

Contributions are welcome! Please see the [CONTRIBUTING.md](CONTRIBUTING.md) file for more information.

Thanks to the over 200 contributors who have helped make this project what it is today!

Especially huge thanks to [@shamoon](https://github.com/shamoon), who has been the backbone of this community from the very start.
