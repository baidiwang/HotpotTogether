import { createFileRoute } from "@tanstack/react-router";
import { PlayableTable } from "@/components/playable-table";
import playableCss from "../playable.css?url";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hotpot Together — A place for everyone" },
      {
        name: "description",
        content: "Pull up a seat, place a plate, and prepare one hotpot table together.",
      },
      { property: "og:title", content: "Hotpot Together — A place for everyone" },
      {
        property: "og:description",
        content: "Friends, food and a shared dinner. A playable planning experiment.",
      },
    ],
    links: [{ rel: "stylesheet", href: playableCss }],
  }),
  component: PlayableTable,
});
