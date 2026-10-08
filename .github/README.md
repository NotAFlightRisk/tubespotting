<h1 align="center">tubespotting</h1>
<p align="center">
<i>Every London Underground train on one live map</i>
<br />
<b>🌐 <a href="https://tubespotting.peng.ly/">tubespotting.peng.ly</a></b><br />
</p>

<p align="center">
  <a href="https://tubespotting.peng.ly/"><img src="screenshot.png" alt="The live map, with trains on every line around central London and the line status board down the side" width="800" /></a>
</p>

<details>
  <summary>Contents</summary>

- [About](#about)
- [Usage](#usage)
- [Deployment](#deployment)
- [Configuration](#configuration)
- [Development](#development)
- [Credits](#credits)

</details>

## About

A live map of the Tube. Every train on all eleven Underground lines, gliding between stations as TfL reports them, drawn in the colours and style you already know from the map on the platform wall.

TfL doesn't publish where tube trains physically are, only when each one's due at each station. So tubespotting works the positions out from those arrival times, and moves each train along its line in between. It's a good guess rather than GPS - a train can be a few hundred metres out - but its close enough to watch yours coming.

---

## Usage

Just open [tubespotting.peng.ly](https://tubespotting.peng.ly/) and drag/ pinch around.

- Tap a line on the status board to pick it out and see every train on it
- Tap a station for its next trains, platform by platform, on a countdown board
- Tap a train to see where it's off to and follow it across London
- Search (or just press `/`) finds any station or line, and the locate button opens your nearest station. Your location never leaves your device

A line or station ends up in the URL, so `?line=victoria` or `?station=940GZZLUOXC` is a link you can share.

---

## Deployment

### Option 1: Cloudflare

It ships with `@sveltejs/adapter-cloudflare` and a `wrangler.jsonc`. Point the route at your own hostname, set `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, then:

```shell
ADAPTER=cloudflare npm run build && npx wrangler deploy
```

The free plan's CPU limit is too tight for reading the whole network every few seconds, so you'll want Workers Paid.

### Option 2: Docker

There's a multi-arch image on DockerHub ([`notaflightrisk/tubespotting`](https://hub.docker.com/r/notaflightrisk/tubespotting)) and GHCR ([`ghcr.io/notaflightrisk/tubespotting`](https://github.com/NotAFlightRisk/tubespotting/pkgs/container/tubespotting)):

```shell
docker run -p 3000:3000 notaflightrisk/tubespotting
```

[![Deploy from Docker](https://img.shields.io/badge/Deploy-Docker-2496ED?style=for-the-badge&logo=docker&labelColor=1b2744)](https://hub.docker.com/r/notaflightrisk/tubespotting)

### Option 3: From a release

Each [release](https://github.com/NotAFlightRisk/tubespotting/releases) has a `site.zip` with the built Node server in it. Unzip it and run `node build` (Node 22 or newer).

### Option 4: Build from source

Follow the [Development](#development) steps, then `npm run build` and `npm start`.

---

## Configuration

It works with no config at all. These are all optional environment variables:

| Variable                  | What it does                                                                                                           |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `TFL_APP_KEY`             | A free [TfL API key](https://api-portal.tfl.gov.uk/), which raises the rate limit. Without one TfL's asked anonymously |
| `PORT`                    | Port for the Node server and Docker image, `3000` by default                                                           |
| `PUBLIC_PLAUSIBLE_SCRIPT` | Build time. A Plausible script URL to count visits, off when empty                                                     |
| `PUBLIC_SENTRY_DSN`       | Build time. A Sentry or Bugsink DSN for error reports, off when empty                                                  |

---

## Development

You'll need [Node](https://nodejs.org/) 22 or newer, plus [Git](https://git-scm.com/).

```bash
git clone git@github.com:NotAFlightRisk/tubespotting.git
cd tubespotting
npm install
npm run dev
```

The dev server is then on [localhost:5173](http://localhost:5173).<br>
The other scripts you'll want are `npm run check` (types), `npm test` (tests) and `npm run format`.

The stations, routes and run times live in `src/lib/data/network.json`. When TfL changes the network, rebuild it with `npm run network` (put your `TFL_APP_KEY` in the environment first, it makes about 100 calls).

Alternatively, build the container with `docker build -t tubespotting .`

---

## Credits

Powered by TfL Open Data. Contains OS data © Crown copyright and database rights 2016 and Geomni UK Map data © and database rights [2019]. The Thames is © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors. Not affiliated with TfL.

##### Contributors

[![contributors badge](https://readme-contribs.as93.net/contributors/NotAFlightRisk/tubespotting?shape=squircle)](https://github.com/NotAFlightRisk/tubespotting/graphs/contributors)

---

<!-- License + Copyright -->
<p  align="center">
  <a href="https://github.com/NotAFlightRisk"><img width="64" src="https://pixelflare.cc/iain/gif/penguin-dance.gif" /></a><br>
  <sup>
    <i>Licensed under <a href="../LICENSE">MIT</a>, © <a href="https://peng.ly">NotAFlightRisk</a> 2026</i>
  </sup>
</p>

<!--
oooh, hello there! hope you're having a nice day :)
   |\__      |\___
 (:> __)X  (:o ___(
   |/        |/
-->
