export type FtueStep = {
  path: string;
  anchor: string;
  title: string;
  description: string;
};

export function getFtueSteps(isMobile: boolean): FtueStep[] {
  const createStep: FtueStep = isMobile
    ? {
        path: "/home",
        anchor: "ftue-quick-create",
        title: "Create",
        description:
          "Post an event or add a mix from the + button. Your shortcuts to sharing what you play and where you play.",
      }
    : {
        path: "/events/create",
        anchor: "ftue-create-heading",
        title: "Create events",
        description:
          "Publish gigs with flyers, lineups, and details. You can also add mixes from Edit profile.",
      };

  return [
    {
      path: "/home",
      anchor: "ftue-nav-home",
      title: "Welcome to Mirrorball",
      description:
        "This is home — nearby events, your upcoming gigs, and fresh mixes. Use the main nav to move around the app.",
    },
    {
      path: "/events",
      anchor: "ftue-nav-events",
      title: "Events",
      description:
        "Browse listings and calendar, filter by genre, and save shows you do not want to miss.",
    },
    {
      path: "/mixes",
      anchor: "ftue-nav-mixes",
      title: "Mixes",
      description: "Hear what DJs are sharing — follow profiles to stay in the loop.",
    },
    {
      path: "/search",
      anchor: "ftue-search",
      title: "Search",
      description: "Find DJs and events across the network. City filters apply where it makes sense.",
    },
    {
      path: "/messages",
      anchor: "ftue-messages",
      title: "Messages",
      description:
        "DM other DJs and stay in event chats when you are on a lineup.",
    },
    {
      path: "/home",
      anchor: "ftue-location",
      title: "Your city",
      description:
        "Mirrorball uses your active city for events and discovery. Tap to explore another city anytime.",
    },
    createStep,
    {
      path: "/home",
      anchor: "ftue-profile",
      title: "Your profile",
      description:
        "Open your menu or the Me tab to edit your profile, manage mixes, and sign out. Enjoy the dance floor.",
    },
  ];
}
