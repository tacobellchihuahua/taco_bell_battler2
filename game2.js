'use strict';

/* =============================================================================
   TACO BELL FRAMEWORK BATTLER
   A 2D top-down RPG. Gidget the Chihuahua fights menu items that embody
   org dysfunctions. Vanilla HTML5 Canvas + JS. No build step.
   ============================================================================= */

// -----------------------------------------------------------------------------
// CONFIG
// -----------------------------------------------------------------------------
const TILE = 32;
const COLS = 30;
const ROWS = 22;
const CANVAS_W = COLS * TILE;   // 960
const CANVAS_H = ROWS * TILE;   // 704

const PAL = {
  purple: '#702082',
  teal:   '#10b5cb',
  gold:   '#ffc627',
  beige:  '#eae6df',
  red:    '#d62300',
  ink:    '#1a0a1f',
  dark:   '#2b0f33',
  green:  '#37b24d',
};

const MOVE_MS = 160;             // ms per overworld tile step
const FONT_DLG  = '18px "Roboto Mono", monospace';
const FONT_MENU = '18px "Montserrat", sans-serif';
const FONT_TITLE = '32px "Fugaz One", sans-serif';
const FONT_LABEL = '14px "Roboto Mono", monospace';

// -----------------------------------------------------------------------------
// AUDIO
// -----------------------------------------------------------------------------
const AUDIO = {
  overworld: new Audio('assets/audio/overworld.mp3'),
  battle:    new Audio('assets/audio/battle.mp3'),
  current:   null,
};
AUDIO.overworld.loop   = true;
AUDIO.battle.loop      = true;
AUDIO.overworld.volume = 0.5;
AUDIO.battle.volume    = 0.5;

let currentTrack = null;

function unlockAudio() {
  if (currentTrack) {
    currentTrack.play().catch(() => {});
  }
}

function playMusic(track) {
  const next = AUDIO[track];
  if (!next || currentTrack === next) return;
  if (currentTrack) {
    currentTrack.pause();
    currentTrack.currentTime = 0;
  }
  currentTrack = next;
  next.play().catch(() => {});
}

// -----------------------------------------------------------------------------
// DATA: Framework moves (each has a tier 4→1 with damage 40/30/20/5)
// -----------------------------------------------------------------------------
const FRAMEWORKS = {
  'Expectancy Theory': [
    { dmg: 40, text: "Show me the chain right now. What does success look like, who decides, and what happens when someone actually delivers it? I am not putting in more effort on a brief that's changed three times until we answer those three questions. In this room. Today." },
    { dmg: 30, text: "If the reward for doing this well is getting reassigned to something I've never touched, I need you to explain to me why I should go all in. I'm not being difficult. I'm asking you to close the loop." },
    { dmg: 20, text: "I hear you on breadth. I just need to know what finishing this one thing actually gets me before I commit to it." },
    { dmg: 5,  text: "A Live Mas mug would genuinely help. Do you have one? I'll wait.", trap: true },
  ],
  'Job Char. Model': [
    { dmg: 40, text: "I need three things before I start: one coach who stays with me through launch, real authority over the brief — not advisory, actual authority — and a way to know when I've done this right. If any of those aren't in place, I will fail the same way the last six leads failed. I am telling you this now so we can fix it now." },
    { dmg: 30, text: "You can't hand me the keys and rotate my manager out in four months. Pick one. Either I'm in charge or I'm not. Right now I'm just alone." },
    { dmg: 20, text: "I know the breadth is the point. I just need this one thing to actually own. Give me that and I'll deliver." },
    { dmg: 5,  text: "Another stretch assignment sounds great, honestly. Six products in three years — I'm basically an enterprise athlete at this point.", trap: true },
  ],
  'Crowding Out': [
    { dmg: 40, text: "Pull the completion bonus. Pull the check-in templates. I don't need to be watched to care about this — I cared before you set up the spreadsheet. The moment you made it a transaction, you told me caring was a job, not a commitment. Give me the work back and get out of the way." },
    { dmg: 30, text: "Every oversight mechanism you've added is telling me you don't trust me. I heard you. So I've been managing your reporting instead of running the campaign. Tell me which one you actually want." },
    { dmg: 20, text: "I don't need a bonus to want this to succeed. I need the work to mean something when it's done. Let it mean something." },
    { dmg: 5,  text: "A Taco Bell gift card would be incredible. I would use it immediately and feel very motivated.", trap: true },
  ],
  'Folly: A→B': [
    { dmg: 40, text: "Tell me what's on my review. Adaptable. Enterprise mindset. Embraces change. Nothing about whether the campaign shipped. Nothing about whether it worked. If you want me to stay and own this, that outcome has to show up in what I'm evaluated on. Change the metric or I will keep optimizing for what you're measuring." },
    { dmg: 30, text: "Why would I fight to stay on a brief when staying doesn't help my rating and leaving doesn't hurt it? I'm not disloyal. I'm rational. You built the system." },
    { dmg: 20, text: "I'm not saying anyone here is malicious. I'm saying the system is rewarding the wrong thing and everyone can see it. Including me." },
    { dmg: 5,  text: "If we just add a campaign completion checkbox to the review, item nine of twelve — I think that fully solves it.", trap: true },
  ],
  'Tight / Loose': [
    { dmg: 40, text: "I want this relaunch treated the same way you treat the salmonella policy — non-negotiable ownership, defined criteria, one lead from brief to launch. I am not rotating mid-campaign. Lock it now. You already know how to enforce rules when you want to. Do it here." },
    { dmg: 30, text: "You kept the inventor of the Doritos Locos Taco on the account until it shipped a billion dollars. That wasn't luck. Someone made that call. Make the same call for me right now." },
    { dmg: 20, text: "I'm asking for the same seriousness you give the supply chain. Just apply it to who owns the brand. That's it." },
    { dmg: 5,  text: "If we do a new onboarding module I think people would feel more settled. Better font this time.", trap: true },
  ],
  'Network Shape': [
    { dmg: 40, text: "I'm calling one meeting — every person who thinks they're the POC, the agency lead, the media partner. One meeting. After that, I am the single contact and everyone knows it. And you are not rotating me out before this launches. The agency has been emailing ghosts. That stops today." },
    { dmg: 30, text: "The agency stopped investing in these relationships because every lead rotated out within the year. I'm going to show them that's not happening this time. But I need you to actually not rotate me out." },
    { dmg: 20, text: "What's the agency lead's real name? Not Baja Blast Guy. An actual name. I need it before I leave this room." },
    { dmg: 5,  text: "I'll start a LinkedIn group. Very engaged community. Great place to put a cover photo.", trap: true },
  ],
  'Incentive Compat.': [
    { dmg: 40, text: "The director who pitched this needs to be on the hook for how it executes. And I need to be there for the outcome, not handed off before we find out if any of this worked. Tie the pitch to the results. No more rewarding the slide deck and moving on. If you won't do that, you're telling me nothing actually changes here." },
    { dmg: 30, text: "I'm not accepting a handoff for a strategy I didn't write without the person who wrote it on a call first. Either they explain it to me or we rewrite it together. I'm not holding the bag for someone else's decisions." },
    { dmg: 20, text: "At minimum, everyone who made a decision on this brief in the last six months needs to be in a room before I make the next one. Set that up." },
    { dmg: 5,  text: "Thirty minutes, I'll take good notes, we share the link — I think a really thoughtful handoff fixes most of this.", trap: true },
  ],
};

// Canonical display order — all are visible in the menu; locked ones render greyed out.
const ALL_FRAMEWORKS = ['Expectancy Theory', 'Job Char. Model', 'Crowding Out', 'Folly: A→B', 'Tight / Loose', 'Network Shape', 'Incentive Compat.'];

// -----------------------------------------------------------------------------
// FIT SYSTEM — how each framework lands against each boss/phase.
// -----------------------------------------------------------------------------
const FIT = { STRONG: 'STRONG', FIT: 'FIT', NEUTRAL: 'NEUTRAL', MISFIT: 'MISFIT' };

// Outgoing damage multipliers (player → boss)
const FIT_DMG_OUT = { STRONG: 1.5, FIT: 1.0, NEUTRAL: 0.6, MISFIT: 0.3 };
// Incoming retort multipliers (boss → player)
const FIT_DMG_IN  = { STRONG: 0.5, FIT: 0.8, NEUTRAL: 1.0, MISFIT: 1.4 };
// Boss self-heal multipliers
const FIT_HEAL    = { STRONG: 0.0, FIT: 0.4, NEUTRAL: 0.8, MISFIT: 1.0 };

// Universal narrative fit-line bank — printed every turn after player attack.
const FIT_LINES = {
  STRONG: [
    'The room shifts. They heard you.',
    'Right tool, right time. That landed.',
    'You can see them recalibrate.',
  ],
  FIT: [
    'A reasonable point. They engage.',
    'Not their preferred framing, but it still lands.',
    'They consider it. Resistant, but listening.',
  ],
  NEUTRAL: [
    'They nod politely. The point bounces off.',
    "Technically true. Not what's at stake here.",
    'You said something. They move on.',
  ],
  MISFIT: [
    'Wrong framework. They got more entrenched.',
    'You just handed them fuel.',
    "They look at you like you didn't read the room.",
  ],
};
const MENTOR_CALL_LINES = [
  'Gidget steps out and calls her old manager. Two minutes of perspective.',
  'A familiar voice on the line. Some calibration.',
];

// -----------------------------------------------------------------------------
// DATA: Bosses with full fit matrix + dialogue keyed to fit tier.
// -----------------------------------------------------------------------------
const BOSSES = {
  quesarito: {
    name: 'THE QUESARITO',
    tileCode: 6, hp: 150, sprite: 'quesarito',
    issue: 'Two different brand leads. Three strategies. One live campaign. Nobody knows which inputs drive the outcome because nobody\'s stayed long enough to find out. The media partner has been emailing Jordan for six weeks. Jordan works at Chipotle now.',
    reward: 'Mild Sauce Packet',
    unlocks: 'Network Shape',
    fit: {
      'Expectancy Theory': FIT.STRONG,
      'Incentive Compat.': FIT.STRONG,
      'Folly: A→B':        FIT.FIT,
      'Job Char. Model':   FIT.NEUTRAL,
      'Tight / Loose':     FIT.NEUTRAL,
      'Network Shape':     FIT.NEUTRAL,
      'Crowding Out':      FIT.MISFIT,
    },
    intro: "I contain both a burrito AND a quesadilla. Two identities. Zero accountability. The last brand lead called me a Q3 priority. The one before said I was exploratory. I have been in market for six weeks and I do not know what I am.",
    retorts: {
      STRONG:  "...one owner. One brief. I did not think anyone was going to actually say that out loud.",
      FIT:     "My last lead had a whole deck on this. Somewhere. I think it is in a Google Drive folder called FINAL v3 USE THIS ONE.",
      NEUTRAL: "Cool. Can you put that in the thread? There are fourteen people on it. Nobody reads it but please put it in the thread.",
      MISFIT:  "I am optimizing my half. If the other half falls apart that is a separate workstream. This layer is MINE.",
    },
    killingBlow: "...okay. One launch. One lead. I have been performing ownership for three weeks without knowing what I actually own. You drew the line. Not me.",
    defeat: "Fine. You take accountability on Q3. Document it this time. Somewhere findable. For whoever comes after you.",
    baseDmg: 13, baseHeal: 0,
  },
  baja_blast: {
    name: 'BAJA BLAST',
    tileCode: 7, hp: 150, sprite: 'baja_blast',
    issue: 'The agency has sent the same activation deck to four different people in two weeks. All four think they are the brand lead. They have never met each other. Nobody told the agency.',
    reward: 'Hot Sauce Packet',
    unlocks: ['Job Char. Model', 'Crowding Out'],
    fit: {
      'Network Shape':     FIT.STRONG,
      'Expectancy Theory': FIT.STRONG,
      'Incentive Compat.': FIT.FIT,
      'Folly: A→B':        FIT.FIT,
      'Tight / Loose':     FIT.NEUTRAL,
      'Job Char. Model':   FIT.NEUTRAL,
      'Crowding Out':      FIT.MISFIT,
    },
    intro: "Mountain Dew made me. Taco Bell claimed me. Neither of them can tell you who the current brand lead is. I have been at this chain since 2004. I have outlasted every brand lead assigned to me. The current one has been here eleven days. Good luck kid.",
    retorts: {
      STRONG:  "You know the contact AND you know who actually owns this. I have been waiting six weeks for someone to do both of those things. This is the most hydrated I have felt since the Mountain Dew collab.",
      FIT:     "Okay so I just email that person directly? Not the distribution list? Not reply-all to the chain that has the agency, the agency's agency, and someone's intern from summer?",
      NEUTRAL: "Right. I will CC everyone. The VP. The agency. Whoever approved the Naked Chicken Chalupa. Someone in there will know something.",
      MISFIT:  "I am scheduling a 30-person sync. Tomorrow. 8 AM. Legal is on it. Someone added Franchise Ops. I do not know why Franchise Ops is on it.",
    },
    killingBlow: "You had the number. It was in your phone. We have been escalating this for three weeks and it was just. In your phone. Next to your Taco Bell app.",
    defeat: "That worked. I am adding you to every distribution list I have. All fourteen of them. You cannot stop me. Nobody can stop me. Nobody has tried.",
    baseDmg: 12, baseHeal: 0,
  },
  mexican_pizza: {
    name: 'THE OG CRUNCHY TACO',
    tileCode: 8, hp: 150, sprite: 'og_crunchy_taco',
    issue: 'The cross-functional partners have worked with six brand leads in four years. Every bonus and check-in the org added to re-engage them made it worse. They are not difficult. They are just done.',
    reward: 'Fire Sauce Packet',
    unlocks: ['Tight / Loose', 'Folly: A→B'],
    fit: {
      'Job Char. Model':   FIT.STRONG,
      'Crowding Out':      FIT.STRONG,
      'Expectancy Theory': FIT.FIT,
      'Network Shape':     FIT.FIT,
      'Folly: A→B':        FIT.NEUTRAL,
      'Tight / Loose':     FIT.NEUTRAL,
      'Incentive Compat.': FIT.MISFIT,
    },
    intro: "I am older than the value menu. I am older than the Crunch Wrap. I am older than the concept of a fourth meal. The partners who support me are professionals. They are also exhausted. The last three brand leads introduced themselves with the same deck. Slide four is always about their vision for the brand. Nobody has stayed long enough to execute slide four.",
    retorts: {
      STRONG:  "You are still here. It has been six weeks and you are still here. The agency lead just asked me if you are permanent. I did not know how to answer that.",
      FIT:     "That is a reasonable thing to say. The last two leads said reasonable things also. I am cautiously not getting my hopes up.",
      NEUTRAL: "Noted. I will put it in the shared drive. Under the folder called New Lead Priorities. There are four subfolders in there already.",
      MISFIT:  "Right. A new framework. I will add it to the deck. Right after slide four. Nobody has ever gotten to slide five.",
    },
    killingBlow: "You actually... heard that. Okay. I have some ideas I have not said out loud in a while. Want to hear them?",
    defeat: "I do not trust this will not get rotated away. But for now, yeah. Let us try.",
    baseDmg: 11, baseHeal: 3,
  },
  og_crunchy_taco: {
    name: 'THE MEXICAN PIZZA',
    tileCode: 5, hp: 150, sprite: 'mexican_pizza',
    issue: 'High visibility relaunch. Hard deadline. The org rewarded the last lead for being adaptable and rotated them eight months before launch. Nobody left a note. The new lead Google searched the launch date. It was in the press release.',
    reward: 'Diablo Sauce Packet',
    unlocks: ['Incentive Compat.'],
    grants: 'diablo_sauce_packet',
    fit: {
      'Folly: A→B':        FIT.STRONG,
      'Tight / Loose':     FIT.STRONG,
      'Network Shape':     FIT.FIT,
      'Job Char. Model':   FIT.FIT,
      'Incentive Compat.': FIT.FIT,
      'Expectancy Theory': FIT.NEUTRAL,
      'Crowding Out':      FIT.MISFIT,
    },
    intro: "I trended on Twitter. I had a waitlist. People cried when I came back. Real tears. And now the person managing my comeback has never run a relaunch before because the person who did is at Chipotle now. Different Chipotle than Jordan. They carpool.",
    retorts: {
      STRONG:  "Okay. You actually know what you are doing. Do you know how rare that is on this relaunch? The last two people Google searched my launch date. It was in the press release.",
      FIT:     "That could work. I have heard better. I have also heard much worse. Last week someone pitched me a TikTok series with zero production budget. We move forward.",
      NEUTRAL: "Sure. Put it in the brief. The brief that nobody read last time either. But yes. Add it.",
      MISFIT:  "I trended for three weeks. I had a Reddit thread. And this is your plan. This is the plan for me.",
    },
    killingBlow: "You actually did the work. You read the old briefs. You called the agency contact from two relaunches ago. I did not think anyone was going to do that.",
    defeat: "Do not let them rotate you before this ships. I am serious. I will trend again and I need someone who knows what they are doing standing next to me when it happens.",
    baseDmg: 13, baseHeal: 2,
  },
  crunchwrap_supreme: {
    name: 'THE CRUNCHWRAP SUPREME',
    tileCode: 9, hp: 500, sprite: 'crunchwrap_supreme',
    issue: 'The system itself. Layered, top-down, self-perpetuating. Each layer is its own dysfunction.',
    reward: 'Breakfast Salsa Packet',
    unlocks: null,
    phased: true,
    intro: "You've made it through my menu. You think you've learned things. Now meet the structure itself.",
    defeat: "You didn't beat the structure. You named it. That was the move all along. The rotation continues, but now there's one brand lead who knows what to call it when it spins. Welcome to the Boardroom. Breakfast Salsa Packet is yours.",
    killingBlow: '...if I unwrap, what holds it all together? You? Your frameworks? ...prove it.',
    phases: [
      {
        name: 'TOSTADA LAYER',
        flavor: "Agility builds leaders. It says so on the poster next to the Baja Blast dispenser. Nobody has measured what it costs but the poster was professionally laminated.",
        threshold: 1.00,
        fit: { 'Expectancy Theory': FIT.STRONG, 'Folly: A→B': FIT.STRONG },
        retorts: {
          STRONG:  "You are naming the gap between the claim and the data. I do not like it. I will re-form. I always re-form.",
          NEUTRAL: "Agility is a value. You cannot put a value in a spreadsheet. That is not how values work.",
        },
        transition: 'The tostada cracks. The rationalization held for years. It will not hold today. Next layer.',
        baseDmg: 14, baseHeal: 2,
      },
      {
        name: 'BEEF & CHEESE',
        flavor: "Redundancy creates resilience. We rotated four people through this role last year. Technically one of them is still here. They manage the Freeze account now. They do not know why.",
        threshold: 0.8,
        fit: { 'Job Char. Model': FIT.STRONG, 'Crowding Out': FIT.STRONG },
        retorts: {
          STRONG:  "You are getting to the people layer. I can feel the attrition risk rising. That number lives in a spreadsheet next to the Freeze launch recap that nobody opened either.",
          NEUTRAL: "Redundancy is a systems concept. You are talking about a person who cried in the Cantina last Tuesday. Those are not the same conversation.",
        },
        transition: "The beef gives out. Four rotations and zero transition docs will do that. Next layer.",
        baseDmg: 14, baseHeal: 2,
      },
      {
        name: 'LETTUCE & CREMA',
        flavor: "Rotation is good for your career. Live Mas. That is the whole argument. Those are the two sentences. The person who presented them got a standing ovation at the all-hands and then was rotated to the Naked Chicken Chalupa team four months later.",
        threshold: 0.6,
        fit: { 'Tight / Loose': FIT.STRONG, 'Network Shape': FIT.STRONG },
        retorts: {
          STRONG:  "You are naming what we reward versus what we say we value. Live Mas is on the wall. The promotion went to the person who stayed in their seat for three years and did not say anything.",
          NEUTRAL: "Career development is a journey. We have a whole module on it in the learning portal. Nobody has completed the module. It was assigned in 2021.",
        },
        transition: "The lettuce wilts. Live Mas cannot load-bear this much irony. Next layer.",
        baseDmg: 14, baseHeal: 2,
      },
      {
        name: 'DICED TOMATOES',
        flavor: "Discomfort is the point. The Naked Chicken Chalupa made people uncomfortable. The Doritos Locos Taco made people uncomfortable. Those worked out. Rotating the entire brand team twice a year is the same thing. Probably.",
        threshold: 0.4,
        fit: { 'Incentive Compat.': FIT.STRONG, 'Expectancy Theory': FIT.STRONG },
        retorts: {
          STRONG:  "The Doritos Locos Taco was uncomfortable. It was also a billion dollars in seventy days. Nobody rotated that person to the Cinnamon Twists account mid-launch. The Cinnamon Twists account is where ideas go to wait.",
          NEUTRAL: "Karen has the Q2 data, the agency brief, and the activation login. Karen has been rotated twice. Nobody has asked Karen anything. Karen is now on the Spork Awareness initiative. It is not a real initiative.",
        },
        transition: "The tomatoes scatter. Karen had everything. Nobody asked Karen. One layer left.",
        baseDmg: 14, baseHeal: 2,
      },
      {
        name: 'TORTILLA SHELL',
        flavor: "If you are struggling that is a you problem. The Crunchwrap has held its shape since 2005. The hexagonal seal is intentional. Nothing spills out. Nothing gets in. If you cannot thrive inside this structure maybe you are not a Crunchwrap person.",
        threshold: 0.2,
        fit: { 'Job Char. Model': FIT.STRONG, 'Folly: A→B': FIT.STRONG },
        retorts: {
          STRONG:  "You are getting through the seal. I do not know how. The hexagon is supposed to be airtight. Geometrically this should not be happening.",
          NEUTRAL: "The structure is fine. The structure has been fine since 2005. If you are struggling that is a you problem and also possibly a tortilla problem but mostly a you problem.",
        },
        transition: null, // final phase
        baseDmg: 15, baseHeal: 2,
      },
    ],
  },
};

// Get fit tier for a (boss, framework) pair, accounting for phase.
function getFit(boss, framework, phaseIndex = 0) {
  if (boss.phased) {
    const phase = boss.phases[phaseIndex];
    return phase.fit[framework] || FIT.NEUTRAL;  // Crunchwrap: non-strong = NEUTRAL
  }
  return boss.fit[framework] || FIT.NEUTRAL;
}

// Pick a boss retort line based on player's last fit + boss state.
function getBossRetort(boss, fitTier, phaseIndex, bossHp, bossMaxHp) {
  if (boss.phased) {
    const phase = boss.phases[phaseIndex];
    // Killing blow at <20% on final phase only
    if (phaseIndex === boss.phases.length - 1 && bossHp / bossMaxHp < 0.20 && boss.killingBlow) {
      return boss.killingBlow;
    }
    if (fitTier === FIT.STRONG) return phase.retorts.STRONG;
    return phase.retorts.NEUTRAL;
  }
  // Killing blow at <30 HP for normal bosses
  if (bossHp < 30 && bossHp > 0 && boss.killingBlow) return boss.killingBlow;
  return boss.retorts[fitTier];
}

// Base boss damage / heal — accounts for Crunchwrap phasing.
function getBossBaseDmg(boss, phaseIndex) {
  return boss.phased ? boss.phases[phaseIndex].baseDmg : boss.baseDmg;
}
function getBossBaseHeal(boss, phaseIndex) {
  return boss.phased ? boss.phases[phaseIndex].baseHeal : boss.baseHeal;
}

// Mentor call consumable.
const MENTOR_CALL = {
  name: '5-MIN MENTOR CALL',
  heal: 75,
  startUses: 2,
  maxUses: 2,
};

// Lookup boss by tile code
const BOSS_BY_TILE = {};
for (const [key, b] of Object.entries(BOSSES)) BOSS_BY_TILE[b.tileCode] = key;

// -----------------------------------------------------------------------------
// PROGRESSION ORDER
// -----------------------------------------------------------------------------
// Strict linear order. Each boss/door is gated by the prior boss's defeat.
const BOSS_ORDER = ['quesarito', 'baja_blast', 'mexican_pizza', 'og_crunchy_taco', 'crunchwrap_supreme'];

// Which door (if any) gates each fight. Lobby is always open; brand starts open
// so the player can fight Quesarito first. Baja Blast has no door (corridor
// encounter — we gate her by hiding the encounter tile until Quesarito falls).
const DOOR_REQUIRES_DEFEAT = {
  lobby: null,                 // always open
  brand: null,                 // always open (Q is first fight)
  break: 'baja_blast',         // open after BB defeated
  exec:  'mexican_pizza',      // open after MP defeated
  ceo:   'og_crunchy_taco',    // open after OG defeated (also needs diablo packet)
};

// Which boss must be defeated before this boss becomes encounterable.
const BOSS_REQUIRES_DEFEAT = {
  quesarito:          null,                 // first
  baja_blast:         'quesarito',
  mexican_pizza:      'baja_blast',
  og_crunchy_taco:    'mexican_pizza',
  crunchwrap_supreme: 'og_crunchy_taco',
};

// Human-readable boss names for "defeat X first" toasts
const BOSS_DISPLAY = {
  quesarito:          'The Quesarito',
  baja_blast:         'Baja Blast',
  mexican_pizza:      'Mexican Pizza',
  og_crunchy_taco:    'The OG Crunchy Taco',
  crunchwrap_supreme: 'The Crunchwrap Supreme',
};

function isBossActive(bossKey) {
  if (state.defeatedBosses && state.defeatedBosses.has(bossKey)) return false;
  const req = BOSS_REQUIRES_DEFEAT[bossKey];
  if (!req) return true; // first fight or unknown — active by default
  return state.defeatedBosses && state.defeatedBosses.has(req);
}

function isDoorOpen(doorName) {
  const req = DOOR_REQUIRES_DEFEAT[doorName];
  if (doorName === 'ceo') {
    // CEO door needs OG defeated AND diablo packet
    return state.defeatedBosses.has(req) && state.inventory.has('diablo_sauce_packet');
  }
  if (req === null || req === undefined) return true;
  return state.defeatedBosses.has(req);
}

function doorAtTile(x, y) {
  if (!state.tilemap || !state.tilemap.doors) return null;
  for (const [name, d] of Object.entries(state.tilemap.doors)) {
    const width = d.width || 1;
    for (let dx = 0; dx < width; dx++) {
      if (d.x + dx === x && d.y === y) return name;
    }
  }
  return null;
}

// -----------------------------------------------------------------------------
// STATE
// -----------------------------------------------------------------------------
const state = {
  mode: 'loading',  // 'loading' | 'title' | 'overworld' | 'transition' | 'battle' | 'gameover' | 'ending'
  tilemap: null,
  images: {},      // name → HTMLImageElement
  walkable: null,  // 2D bool grid, rebuilt when doors/encounters change
  encounterTiles: [], // [{x, y, bossKey}]
  player: {
    x: 22, y: 19,
    facing: 'down',
    moving: false,
    moveT: 0,
    fromX: 22, fromY: 19,
    hp: 100, maxHp: 100,
  },
  inventory: new Set(),
  defeatedBosses: new Set(),
  clearedTiles: new Set(),   // "x,y" of encounter tiles that have been cleared
  unlockedFrameworks: ['Expectancy Theory'],
  mentorCallUses: 2,
  tutorialSeen: { firstBattle: false, firstStrong: false, firstMisfit: false },
  // Battle sub-state lives in state.battle while mode==='battle'
  battle: null,
  // Transitions
  transition: null,
  // Title/ending
  title: { selected: 0 },
  ending: { t: 0 },
  // Overworld toast (transient feedback like "LOCKED")
  toast: null,   // { text, t, dur }
  // Key input
  keys: new Set(),
  // Bobbing time for idle animation
  t: 0,
};

// -----------------------------------------------------------------------------
// ASSETS
// -----------------------------------------------------------------------------
function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

async function loadAll() {
  const tilemapResp = await fetch('assets/tilemap.json');
  state.tilemap = await tilemapResp.json();

  const spriteNames = [
    'gidget_up', 'gidget_down', 'gidget_left', 'gidget_right', 'gidget_battle_back',
    'quesarito_overworld', 'quesarito_battle',
    'baja_blast_overworld', 'baja_blast_battle',
    'mexican_pizza_overworld', 'mexican_pizza_battle',
    'og_crunchy_taco_overworld', 'og_crunchy_taco_battle',
    'crunchwrap_supreme_overworld', 'crunchwrap_supreme_battle',
  ];
  const tasks = [
    loadImage('assets/map.png').then(img => state.images.map = img),
    ...spriteNames.map(n => loadImage(`assets/sprites/${n}.png`).then(img => state.images[n] = img)),
  ];
  await Promise.all(tasks);

  buildWalkable();
  scanEncounters();

  // Apply spawn from tilemap
  if (state.tilemap.spawn_point) {
    state.player.x = state.tilemap.spawn_point.x;
    state.player.y = state.tilemap.spawn_point.y;
    state.player.fromX = state.player.x;
    state.player.fromY = state.player.y;
    state.player.facing = state.tilemap.spawn_point.facing || 'down';
  }
}

// Rebuild walkable grid from tilemap + cleared tiles + inventory (for CEO door)
function buildWalkable() {
  const t = state.tilemap.tiles;
  const w = state.tilemap.width, h = state.tilemap.height;
  const out = Array.from({length: h}, () => new Array(w).fill(false));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = t[y][x];
      if (c === 0 || c === 4) {
        out[y][x] = true;
      } else if (c === 2) {
        // Unlocked-style door in the tilemap, but might be progression-locked
        const dname = doorAtTile(x, y);
        out[y][x] = dname ? isDoorOpen(dname) : true;
      } else if (c === 3) {
        // CEO door (always uses ceo lock + diablo)
        out[y][x] = isDoorOpen('ceo');
      } else if (c >= 5 && c <= 9) {
        // Encounter tile is walkable; trigger checked elsewhere
        out[y][x] = true;
      }
    }
  }
  state.walkable = out;
}

function scanEncounters() {
  state.encounterTiles = [];
  const t = state.tilemap.tiles;
  for (let y = 0; y < t.length; y++) {
    for (let x = 0; x < t[y].length; x++) {
      const c = t[y][x];
      if (c >= 5 && c <= 9) {
        const bossKey = BOSS_BY_TILE[c];
        if (bossKey) state.encounterTiles.push({ x, y, bossKey });
      }
    }
  }
}

// -----------------------------------------------------------------------------
// INPUT
// -----------------------------------------------------------------------------
const DIRS = {
  ArrowUp:    { dx: 0, dy: -1, face: 'up' },
  ArrowDown:  { dx: 0, dy:  1, face: 'down' },
  ArrowLeft:  { dx:-1, dy:  0, face: 'left' },
  ArrowRight: { dx: 1, dy:  0, face: 'right' },
  KeyW:       { dx: 0, dy: -1, face: 'up' },
  KeyS:       { dx: 0, dy:  1, face: 'down' },
  KeyA:       { dx:-1, dy:  0, face: 'left' },
  KeyD:       { dx: 1, dy:  0, face: 'right' },
};

window.addEventListener('keydown', e => {
  // Prevent page scroll on arrow keys / space
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
    e.preventDefault();
  }
  unlockAudio();
  state.keys.add(e.code);
  handleKeyDown(e.code);
});
window.addEventListener('keyup', e => { state.keys.delete(e.code); });

function handleKeyDown(code) {
  if (state.mode === 'title') {
    if (code === 'Enter' || code === 'Space') startNewGame();
    return;
  }
  if (state.mode === 'battle') {
    onBattleKey(code);
    return;
  }
  if (state.mode === 'gameover') {
    if (code === 'Enter' || code === 'Space') respawnAfterBlackout();
    return;
  }
  if (state.mode === 'ending') {
    if (code === 'Enter' || code === 'Space') {
      state.mode = 'title';
      resetForTitle();
    }
    return;
  }
}

// -----------------------------------------------------------------------------
// OVERWORLD: tile-by-tile movement, encounter detection
// -----------------------------------------------------------------------------
function updateOverworld(dt) {
  const p = state.player;
  // Tick toast
  if (state.toast) {
    state.toast.t += dt;
    if (state.toast.t >= state.toast.dur) state.toast = null;
  }
  if (p.moving) {
    p.moveT += dt / MOVE_MS;
    if (p.moveT >= 1) {
      p.moveT = 0;
      p.moving = false;
      p.fromX = p.x; p.fromY = p.y;
      // Check encounter trigger on the tile we just arrived at
      const c = state.tilemap.tiles[p.y][p.x];
      if (c >= 5 && c <= 9 && !state.clearedTiles.has(`${p.x},${p.y}`)) {
        const bk = BOSS_BY_TILE[c];
        if (bk && isBossActive(bk)) {
          startTransitionToBattle(bk);
          return;
        }
      }
    }
  } else {
    // Look for a held direction key
    for (const code in DIRS) {
      if (state.keys.has(code)) {
        attemptMove(DIRS[code]);
        break;
      }
    }
  }
}

function attemptMove(d) {
  const p = state.player;
  p.facing = d.face;
  const nx = p.x + d.dx, ny = p.y + d.dy;
  if (ny < 0 || ny >= state.tilemap.height || nx < 0 || nx >= state.tilemap.width) return;
  if (!state.walkable[ny][nx]) {
    // If the blocked tile is a progression-locked door, tell the player what to do.
    const code = state.tilemap.tiles[ny][nx];
    if (code === 2 || code === 3) {
      const dname = (code === 3) ? 'ceo' : doorAtTile(nx, ny);
      if (dname && !isDoorOpen(dname)) {
        let txt = 'This door is locked.';
        if (dname === 'ceo') {
          txt = 'BOARDROOM is locked. Defeat The Mexican Pizza for the Diablo Sauce Packet.';
        } else {
          const requiredBoss = DOOR_REQUIRES_DEFEAT[dname];
          if (requiredBoss && BOSS_DISPLAY[requiredBoss]) {
            const roomLabel = {
              break: 'BREAK ROOM',
              exec:  'EXEC FLOOR',
              brand: 'BRAND BULLPEN',
            }[dname] || 'This room';
            txt = `${roomLabel} is locked. Defeat ${BOSS_DISPLAY[requiredBoss]} first.`;
          }
        }
        state.toast = { text: txt, t: 0, dur: 2800 };
      }
    }
    return;
  }
  p.fromX = p.x; p.fromY = p.y;
  p.x = nx; p.y = ny;
  p.moveT = 0;
  p.moving = true;
}

// -----------------------------------------------------------------------------
// BATTLE: turn-based menu/message state machine
// -----------------------------------------------------------------------------
function startTransitionToBattle(bossKey) {
  state.mode = 'transition';
  state.transition = { kind: 'to_battle', t: 0, duration: 600, bossKey };
}

function actuallyStartBattle(bossKey) {
  const boss = BOSSES[bossKey];
  const isFinal = bossKey === 'crunchwrap_supreme';
  const introMsgs = [
    { text: `A wild ${boss.name} appears!`, style: 'narration' },
    { text: `[ISSUE]  ${boss.issue}`, style: 'issue' },
    { text: `${boss.name}: ${boss.intro}`, style: 'boss' },
  ];
  // First-ever-battle tutorial (one-time)
  if (!state.tutorialSeen.firstBattle) {
    state.tutorialSeen.firstBattle = true;
    introMsgs.push({ text: "* TIP: Frameworks aren't interchangeable. *", style: 'gold' });
    introMsgs.push({ text: "The right one for THIS dysfunction lands harder and the boss hits back softer.", style: 'narration' });
    introMsgs.push({ text: "The wrong one backfires. Watch the [TIER] tag after each move.", style: 'narration' });
  }
  state.battle = {
    bossKey,
    bossHp: boss.hp,
    bossMaxHp: boss.hp,
    bossName: boss.name,
    isFinal,
    phaseIndex: 0,
    issue: boss.issue,
    menu: 'message',
    menuIndex: 0,
    menuStack: [],
    selectedFramework: null,
    lastFit: FIT.NEUTRAL,
    messages: introMsgs,
    nextMenuAfterMessages: 'main',
    // Animations
    shake: 0,
    bossFlash: 0,
    gidgetFlash: 0,
    mentorAnim: null,
  };
  state.mode = 'battle';
  playMusic('battle');
}

function onBattleKey(code) {
  const b = state.battle;
  if (!b) return;
  if (b.menu === 'message') {
    if (code === 'Space' || code === 'Enter') {
      advanceMessage();
    }
    return;
  }
  if (b.menu === 'victory' || b.menu === 'defeat') {
    if (code === 'Space' || code === 'Enter') {
      finishBattle(b.menu === 'victory');
    }
    return;
  }

  // Menu navigation
  const opts = currentMenuOptions();
  if (!opts) return;
  const cols = menuColumns(b.menu);
  if (code === 'ArrowUp' || code === 'KeyW') {
    b.menuIndex = cols > 1
      ? (b.menuIndex - cols + opts.length) % opts.length
      : (b.menuIndex - 1 + opts.length) % opts.length;
  }
  else if (code === 'ArrowDown' || code === 'KeyS') {
    b.menuIndex = cols > 1
      ? (b.menuIndex + cols) % opts.length
      : (b.menuIndex + 1) % opts.length;
  }
  else if (code === 'ArrowLeft' || code === 'KeyA') {
    if (cols > 1) b.menuIndex = (b.menuIndex - 1 + opts.length) % opts.length;
  }
  else if (code === 'ArrowRight' || code === 'KeyD') {
    if (cols > 1) b.menuIndex = (b.menuIndex + 1) % opts.length;
  }
  else if (code === 'Enter' || code === 'Space') selectMenuOption();
  else if (code === 'Escape' || code === 'Backspace') backMenu();
}

function menuColumns(menu) {
  if (menu === 'frameworks') return 4;
  if (menu === 'moves') return 1;
  if (menu === 'bag') return 1;
  return 1;
}

function currentMenuOptions() {
  const b = state.battle;
  if (b.menu === 'main') return ['FIGHT', 'BAG', 'RUN'];
  if (b.menu === 'frameworks') return ALL_FRAMEWORKS.slice();
  if (b.menu === 'moves') return FRAMEWORKS[b.selectedFramework].map((m, i) =>
    `${'★'.repeat(4 - i)}${'·'.repeat(i)}  ${truncate(m.text, 56)}`
  );
  if (b.menu === 'bag') {
    // Only consumables are selectable. Badges are display-only and shown in render.
    return [`${MENTOR_CALL.name}  (×${state.mentorCallUses})`];
  }
  return null;
}

function backMenu() {
  const b = state.battle;
  if (b.menu === 'frameworks' || b.menu === 'bag') {
    b.menu = 'main';
    b.menuIndex = 0;
  } else if (b.menu === 'moves') {
    b.menu = 'frameworks';
    b.menuIndex = 0;
  }
}

function selectMenuOption() {
  const b = state.battle;
  if (b.menu === 'main') {
    if (b.menuIndex === 0) { b.menu = 'frameworks'; b.menuIndex = 0; }
    else if (b.menuIndex === 1) { b.menu = 'bag'; b.menuIndex = 0; }
    else if (b.menuIndex === 2) {
      enqueue([{ text: "There's no running from corporate dysfunction.", style: 'narration' }], 'main');
    }
  } else if (b.menu === 'bag') {
    // Only one consumable for now (mentor call)
    useMentorCall();
  } else if (b.menu === 'frameworks') {
    const fw = ALL_FRAMEWORKS[b.menuIndex];
    if (!state.unlockedFrameworks.includes(fw)) {
      enqueue([{ text: `${fw} — locked. Defeat the right boss to unlock these moves.`, style: 'narration' }], 'frameworks');
      return;
    }
    b.selectedFramework = fw;
    b.menu = 'moves';
    b.menuIndex = 0;
  } else if (b.menu === 'moves') {
    const move = FRAMEWORKS[b.selectedFramework][b.menuIndex];
    executePlayerMove(b.selectedFramework, move);
  }
}

function prettyItem(s) {
  return s.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

function truncate(s, n) {
  return s.length <= n ? s : s.slice(0, n - 1) + '…';
}

// Append messages to the queue and decide where to go after they finish
function enqueue(msgs, nextMenu = 'main') {
  const b = state.battle;
  if (b.menu === 'message') {
    b.messages.push(...msgs);
    b.nextMenuAfterMessages = nextMenu;
  } else {
    b.messages = msgs.slice();
    b.menu = 'message';
    b.nextMenuAfterMessages = nextMenu;
  }
}

function advanceMessage() {
  const b = state.battle;
  if (b.messages.length === 0) return;
  b.messages.shift();
  if (b.messages.length === 0) {
    onMessagesEmpty();
  }
}

function onMessagesEmpty() {
  const b = state.battle;
  if (b.bossHp <= 0) { b.menu = 'victory'; return; }
  if (state.player.hp <= 0) { b.menu = 'defeat'; return; }
  // If next phase is "boss_turn", run it. Otherwise go to menu.
  if (b.nextMenuAfterMessages === 'boss_turn') {
    runBossTurn();
  } else {
    b.menu = b.nextMenuAfterMessages || 'main';
    b.menuIndex = 0;
  }
}

function executePlayerMove(frameworkName, move) {
  const b = state.battle;
  const boss = BOSSES[b.bossKey];

  // Determine fit tier for this turn
  let fitTier = getFit(boss, frameworkName, b.phaseIndex);

  // Special rule: 5-dmg traps are bad wording regardless of framework.
  // Trap inside STRONG framework drops to NEUTRAL (no super-fit bonus).
  // Trap inside MISFIT framework stacks (stays MISFIT for retort/heal).
  const isTrap = move.dmg === 5;
  let effectiveFit = fitTier;
  if (isTrap && fitTier === FIT.STRONG) effectiveFit = FIT.NEUTRAL;
  if (isTrap && fitTier === FIT.FIT)    effectiveFit = FIT.NEUTRAL;

  // Outgoing damage = base × fit multiplier. Traps never get STRONG bonus.
  const outMult = isTrap ? Math.min(FIT_DMG_OUT[effectiveFit], 1.0) : FIT_DMG_OUT[effectiveFit];
  const dmg = Math.max(1, Math.round(move.dmg * outMult));

  // Stash for boss turn (controls retort line, incoming dmg, heal)
  b.lastFit = effectiveFit;

  const msgs = [
    { text: `Gidget chose ${frameworkName}:`, style: 'narration' },
    { text: `"${move.text}"`, style: 'gidget' },
  ];

  // Fit-line narrative (every turn) with tier tag
  const tierLabel = {
    STRONG:  '[ STRONG FIT ]',
    FIT:     '[ FIT ]',
    NEUTRAL: '[ NEUTRAL ]',
    MISFIT:  '[ MISFIT ]',
  }[effectiveFit];
  const fitStyle = {
    STRONG: 'gold', FIT: 'teal', NEUTRAL: 'narration', MISFIT: 'red',
  }[effectiveFit];
  const line = FIT_LINES[effectiveFit][Math.floor(Math.random() * FIT_LINES[effectiveFit].length)];
  msgs.push({ text: `${tierLabel}  ${line}`, style: fitStyle });

  if (isTrap && fitTier === FIT.STRONG) {
    msgs.push({ text: '(Right framework, cliché wording. It bounced.)', style: 'narration' });
  }
  msgs.push({ text: `${boss.name} takes ${dmg} damage.`, style: 'narration' });

  b.bossHp = Math.max(0, b.bossHp - dmg);
  b.bossFlash = 1;

  // Tutorial overlays (one-time each)
  if (effectiveFit === FIT.STRONG && !state.tutorialSeen.firstStrong) {
    state.tutorialSeen.firstStrong = true;
    msgs.push({ text: '* TIP: That was a STRONG fit. *', style: 'gold' });
    msgs.push({ text: 'The framework matched the dysfunction. Boss damage out is up, boss damage in is down.', style: 'narration' });
  }
  if (effectiveFit === FIT.MISFIT && !state.tutorialSeen.firstMisfit) {
    state.tutorialSeen.firstMisfit = true;
    msgs.push({ text: '* TIP: That was a MISFIT. Wrong framework for this dysfunction. *', style: 'red' });
    msgs.push({ text: 'You did less damage AND made the boss hit harder. Try a different framework.', style: 'narration' });
  }

  // Phase transition (Crunchwrap only)
  if (boss.phased) {
    const ratio = b.bossHp / b.bossMaxHp;
    let newPhase = 0;
    for (let i = 0; i < boss.phases.length; i++) {
      if (ratio <= boss.phases[i].threshold) newPhase = i;
    }
    if (newPhase !== b.phaseIndex && newPhase > b.phaseIndex) {
      const oldPhase = boss.phases[b.phaseIndex];
      b.phaseIndex = newPhase;
      const ph = boss.phases[newPhase];
      if (oldPhase.transition) {
        msgs.push({ text: oldPhase.transition, style: 'boss' });
      }
      msgs.push({ text: `* ${ph.name} *`, style: 'gold' });
      msgs.push({ text: ph.flavor, style: 'narration' });
    }
  }

  if (b.bossHp <= 0) {
    msgs.push({ text: `${boss.name} is defeated!`, style: 'gold' });
    msgs.push({ text: `${boss.name}: ${boss.defeat}`, style: 'boss' });
    enqueue(msgs, 'victory_after_messages');
    return;
  }

  enqueue(msgs, 'boss_turn');
}

// Player uses a 5-Min Mentor Call from BAG. Counts as Gidget's turn.
function useMentorCall() {
  const b = state.battle;
  const boss = BOSSES[b.bossKey];
  if (state.mentorCallUses <= 0) {
    enqueue([{ text: "The pack is empty. Should've saved one for this.", style: 'red' }], 'main');
    return;
  }
  if (state.player.hp >= state.player.maxHp) {
    enqueue([{ text: 'Already at full Credibility.', style: 'narration' }], 'main');
    return;
  }
  state.mentorCallUses--;
  const heal = Math.min(MENTOR_CALL.heal, state.player.maxHp - state.player.hp);
  state.player.hp += heal;
  // NEUTRAL fit for boss retort
  b.lastFit = FIT.NEUTRAL;
  // Animation: 1.4s of "Gidget steps out": sprite flips, thought bubble pulses, HP gleams
  b.mentorAnim = { t: 0, dur: 1400, healed: heal };
  const line = MENTOR_CALL_LINES[Math.floor(Math.random() * MENTOR_CALL_LINES.length)];
  const msgs = [
    { text: line, style: 'teal' },
    { text: `Gidget restores ${heal} Credibility.`, style: 'gold' },
    { text: `(${state.mentorCallUses} mentor calls remaining.)`, style: 'narration' },
  ];
  enqueue(msgs, 'boss_turn');
}

function runBossTurn() {
  const b = state.battle;
  const boss = BOSSES[b.bossKey];
  const fitTier = b.lastFit || FIT.NEUTRAL;

  // Retort dialogue, picked based on fit + phase + killing-blow
  const retort = getBossRetort(boss, fitTier, b.phaseIndex, b.bossHp, b.bossMaxHp);

  // Incoming damage = base × FIT_DMG_IN
  const baseDmg = getBossBaseDmg(boss, b.phaseIndex);
  const incoming = Math.max(1, Math.round(baseDmg * FIT_DMG_IN[fitTier]));

  const msgs = [
    { text: `${boss.name}:`, style: 'narration' },
    { text: retort, style: 'boss' },
    { text: `Gidget loses ${incoming} Credibility.`, style: 'red' },
  ];
  state.player.hp = Math.max(0, state.player.hp - incoming);
  b.gidgetFlash = 1;
  b.shake = 1;

  // Boss self-heal scales with fit (STRONG = 0, MISFIT = ×1.0)
  const baseHeal = getBossBaseHeal(boss, b.phaseIndex);
  if (baseHeal > 0) {
    const healAmt = Math.round(baseHeal * FIT_HEAL[fitTier]);
    if (healAmt > 0) {
      const actualHeal = Math.min(healAmt, b.bossMaxHp - b.bossHp);
      if (actualHeal > 0) {
        b.bossHp += actualHeal;
        const tag = fitTier === FIT.MISFIT
          ? `${boss.name} regains ${actualHeal} HP. Your weak move energized them.`
          : `${boss.name} regains ${actualHeal} HP.`;
        msgs.push({ text: tag, style: 'narration' });
      }
    }
  }

  if (state.player.hp <= 0) {
    msgs.push({ text: 'Gidget loses the room…', style: 'red' });
    enqueue(msgs, 'defeat');
    return;
  }
  enqueue(msgs, 'main');
}

function finishBattle(victory) {
  const b = state.battle;
  if (victory) {
    const boss = BOSSES[b.bossKey];
    state.defeatedBosses.add(b.bossKey);
    state.clearedTiles.add(findEncounterTile(b.bossKey));
    if (boss.grants) state.inventory.add(boss.grants);
    if (boss.unlocks) {
      const list = Array.isArray(boss.unlocks) ? boss.unlocks : [boss.unlocks];
      for (const fw of list) {
        if (!state.unlockedFrameworks.includes(fw)) state.unlockedFrameworks.push(fw);
      }
    }
    buildWalkable();
    // Restore Gidget a bit between fights (10 HP)
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 10);
    // +1 Mentor Call refill on victory (capped)
    state.mentorCallUses = Math.min(MENTOR_CALL.maxUses, state.mentorCallUses + 1);
    // Toast the meaningful unlocks so the player notices on the overworld
    const unlockList = boss.unlocks
      ? (Array.isArray(boss.unlocks) ? boss.unlocks : [boss.unlocks])
      : [];
    const toastParts = [`${boss.name} defeated. +${boss.reward}.`];
    if (unlockList.length) toastParts.push(`Unlocked: ${unlockList.join(' + ')}.`);
    // Announce next progression step explicitly
    const nextStep = {
      quesarito:        'BAJA BLAST now lurks in the Cross-Functional Corridor.',
      baja_blast:       'The BREAK ROOM door is now OPEN. The OG Crunchy Taco waits there.',
      mexican_pizza:    'The EXEC FLOOR door is now OPEN. The Mexican Pizza awaits.',
      og_crunchy_taco:  'BOARDROOM door is now OPEN. The Crunchwrap Supreme is the final fight.',
    }[b.bossKey];
    if (nextStep) toastParts.push(nextStep);
    state.toast = { text: toastParts.join(' '), t: 0, dur: 6000 };
    if (b.isFinal) {
      state.mode = 'ending';
      state.ending = { t: 0 };
      playMusic('overworld');
      return;
    }
    state.mode = 'overworld';
    state.battle = null;
    playMusic('overworld');
  } else {
    // Blackout: keep boss progress, restore HP, respawn
    state.mode = 'gameover';
  }
}

function findEncounterTile(bossKey) {
  for (const e of state.encounterTiles) {
    if (e.bossKey === bossKey) return `${e.x},${e.y}`;
  }
  return '';
}

function respawnAfterBlackout() {
  state.player.hp = state.player.maxHp;
  state.player.x = state.tilemap.spawn_point.x;
  state.player.y = state.tilemap.spawn_point.y;
  state.player.fromX = state.player.x;
  state.player.fromY = state.player.y;
  state.player.facing = state.tilemap.spawn_point.facing || 'down';
  state.player.moving = false;
  state.player.moveT = 0;
  state.battle = null;
  state.mode = 'overworld';
  playMusic('overworld');
}

// -----------------------------------------------------------------------------
// RENDER
// -----------------------------------------------------------------------------
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
canvas.addEventListener('click', unlockAudio);
canvas.addEventListener('touchstart', unlockAudio);

function clear(color = '#000') {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

function drawText(text, x, y, opts = {}) {
  ctx.font = opts.font || FONT_DLG;
  ctx.fillStyle = opts.color || '#000';
  ctx.textBaseline = opts.baseline || 'top';
  ctx.textAlign = opts.align || 'left';
  if (opts.shadow) {
    ctx.fillStyle = opts.shadow;
    ctx.fillText(text, x + 2, y + 2);
    ctx.fillStyle = opts.color || '#000';
  }
  ctx.fillText(text, x, y);
}

function drawBoxFilled(x, y, w, h, fill, stroke = '#000', strokeW = 3) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeW;
    ctx.strokeRect(x + strokeW/2, y + strokeW/2, w - strokeW, h - strokeW);
  }
}

function drawDialogBox(x, y, w, h) {
  // Cubicle beige fill + purple outer border + black inner border
  ctx.fillStyle = PAL.beige;
  ctx.fillRect(x, y, w, h);
  ctx.lineWidth = 4;
  ctx.strokeStyle = PAL.purple;
  ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#000';
  ctx.strokeRect(x + 6, y + 6, w - 12, h - 12);
}

function drawHpBar(x, y, w, h, hp, maxHp, label) {
  const pct = Math.max(0, hp / maxHp);
  const fillColor = pct > 0.5 ? PAL.green : pct > 0.25 ? PAL.gold : PAL.red;
  if (label) drawText(label, x, y - 18, { font: FONT_LABEL, color: '#000' });
  ctx.fillStyle = '#333';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fillColor;
  ctx.fillRect(x, y, w * pct, h);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}

// Top-level render
function render() {
  clear();
  if (state.mode === 'loading') return renderLoading();
  if (state.mode === 'title') return renderTitle();
  if (state.mode === 'overworld') return renderOverworld();
  if (state.mode === 'transition') return renderTransition();
  if (state.mode === 'battle') return renderBattle();
  if (state.mode === 'gameover') return renderGameOver();
  if (state.mode === 'ending') return renderEnding();
}

function renderLoading() {
  ctx.fillStyle = PAL.ink;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  drawText('Loading…', CANVAS_W/2, CANVAS_H/2, {
    font: FONT_TITLE, color: PAL.gold, align: 'center', baseline: 'middle'
  });
}

function renderTitle() {
  ctx.fillStyle = PAL.purple;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  // Chequered floor pattern
  ctx.fillStyle = '#5a1869';
  for (let yy = 0; yy < CANVAS_H; yy += 64) {
    for (let xx = 0; xx < CANVAS_W; xx += 64) {
      if (((xx + yy) / 64) % 2 < 1) ctx.fillRect(xx, yy, 64, 64);
    }
  }
  drawText('TACO BELL', CANVAS_W/2, 120, {
    font: '64px "Fugaz One", sans-serif', color: PAL.gold, align: 'center', baseline: 'top', shadow: PAL.ink
  });
  drawText('FRAMEWORK BATTLER', CANVAS_W/2, 200, {
    font: '40px "Fugaz One", sans-serif', color: PAL.beige, align: 'center', baseline: 'top', shadow: PAL.ink
  });
  drawText('— A boss-rush RPG of org dysfunction —', CANVAS_W/2, 260, {
    font: '18px "Roboto Mono", monospace', color: PAL.teal, align: 'center', baseline: 'top'
  });

  // Gidget bouncing
  const bob = Math.sin(state.t / 200) * 6;
  if (state.images.gidget_down) {
    drawImageScaled(state.images.gidget_down, CANVAS_W/2 - 64, 320 + bob, 128, 128);
  }
  drawText("Press SPACE or ENTER to start", CANVAS_W/2, 500, {
    font: FONT_MENU, color: PAL.gold, align: 'center', baseline: 'top'
  });

  drawText('Move: WASD or arrows · Confirm: Space/Enter · Back: Esc',
    CANVAS_W/2, 560, { font: FONT_LABEL, color: PAL.beige, align: 'center' });
  drawText('Gidget the Chihuahua vs. the menu of org dysfunctions.',
    CANVAS_W/2, 600, { font: FONT_LABEL, color: PAL.beige, align: 'center' });
  drawText("Defeat all five layers. Reveal what's really wrong.",
    CANVAS_W/2, 622, { font: FONT_LABEL, color: PAL.beige, align: 'center' });
}

function drawImageScaled(img, x, y, w, h) {
  // Pixel-perfect, with smoothing off
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, x, y, w, h);
}

// ---------- OVERWORLD ----------
function renderOverworld() {
  // Map background
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(state.images.map, 0, 0, CANVAS_W, CANVAS_H);

  // Sprite render scale: separate sizes for boss vs Gidget.
  // Gidget is 28px (slightly narrower than the 32px doors so she fits through them).
  // Bosses are 64px (clearly bigger than Gidget, visible on the map, no wall clipping).
  const BOSS_DRAW = 64;
  const GIDGET_DRAW = 28;

  // Boss overworld sprites (only if active in progression and not cleared)
  for (const e of state.encounterTiles) {
    if (state.clearedTiles.has(`${e.x},${e.y}`)) continue;
    if (!isBossActive(e.bossKey)) continue;  // hide locked bosses entirely
    const boss = BOSSES[e.bossKey];
    const img = state.images[`${boss.sprite}_overworld`];
    const bob = Math.sin((state.t / 220) + e.x + e.y) * 1.5;
    if (img) {
      const dx = e.x * TILE - (BOSS_DRAW - TILE) / 2;     // center horizontally
      const dy = e.y * TILE - (BOSS_DRAW - TILE) + bob;    // bottom-anchored
      ctx.drawImage(img, dx, dy, BOSS_DRAW, BOSS_DRAW);
    }
    // Show a small marker for the CEO boss if locked
    if (e.bossKey === 'crunchwrap_supreme' && !state.inventory.has('diablo_sauce_packet')) {
      const rx = e.x * TILE - 12;
      const ry = e.y * TILE - (BOSS_DRAW - TILE) - 18;
      ctx.fillStyle = PAL.red;
      ctx.fillRect(rx, ry, 56, 14);
      ctx.fillStyle = PAL.gold;
      ctx.font = 'bold 10px "Montserrat", sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText('LOCKED', rx + 4, ry + 2);
    }
  }

  // Gidget
  const p = state.player;
  const interp = p.moving ? easeInOut(p.moveT) : 1;
  const drawX = (p.fromX + (p.x - p.fromX) * interp) * TILE;
  const drawY = (p.fromY + (p.y - p.fromY) * interp) * TILE;
  const sprite = state.images[`gidget_${p.facing}`];
  const idleBob = (!p.moving && Math.sin(state.t / 240) > 0) ? -1 : 0;
  if (sprite) {
    const dx = drawX + (TILE - GIDGET_DRAW) / 2;          // center in tile
    const dy = drawY + (TILE - GIDGET_DRAW) + idleBob;    // bottom-anchor inside tile
    ctx.drawImage(sprite, dx, dy, GIDGET_DRAW, GIDGET_DRAW);
  }

  // HUD: HP + inventory + unlocks
  drawOverworldHud();
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function drawOverworldHud() {
  // Top-left HP plate
  const hudX = 8, hudY = 8;
  drawBoxFilled(hudX, hudY, 200, 56, PAL.beige, PAL.purple, 3);
  drawText('GIDGET', hudX + 10, hudY + 8, { font: '14px "Montserrat", sans-serif', color: PAL.purple });
  drawHpBar(hudX + 10, hudY + 32, 130, 12, state.player.hp, state.player.maxHp, '');
  drawText(`${state.player.hp}/${state.player.maxHp}`,
    hudX + 192, hudY + 38,
    { font: FONT_LABEL, baseline: 'middle', align: 'right' });

  // Top-right: Diablo Sauce Packet indicator (only shown once held)
  if (state.inventory.has('diablo_sauce_packet')) {
    const rightX = CANVAS_W - 8 - 200;
    drawBoxFilled(rightX, hudY, 200, 56, PAL.beige, PAL.purple, 3);
    // Sauce-packet swatch
    const sx = rightX + 10;
    const sy = hudY + 16;
    ctx.fillStyle = sauceColor('diablo_sauce_packet');
    ctx.fillRect(sx, sy, 32, 24);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(sx, sy, 32, 24);
    drawText('🌶', sx + 16, sy + 7, {
      font: '14px sans-serif', align: 'center',
    });
    drawText('DIABLO SAUCE PACKET', rightX + 50, hudY + 14, {
      font: 'bold 11px "Montserrat", sans-serif', color: PAL.red,
    });
    drawText('Boardroom unlocked', rightX + 50, hudY + 32, {
      font: '10px "Roboto Mono", monospace', color: PAL.purple,
    });
  }

  // Transient toast (e.g. "LOCKED" feedback)
  if (state.toast) {
    const t = state.toast.t / state.toast.dur;
    const alpha = t < 0.85 ? 1 : 1 - (t - 0.85) / 0.15;
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    const boxW = 840;
    const padX = 24, padY = 14;
    const lineH = 18;
    // Pre-measure text to decide box height
    ctx.font = '14px "Roboto Mono", monospace';
    const words = state.toast.text.split(' ');
    const lines = [];
    let curLine = '';
    for (const w of words) {
      const test = curLine ? curLine + ' ' + w : w;
      if (ctx.measureText(test).width > boxW - padX * 2) {
        if (curLine) lines.push(curLine);
        curLine = w;
      } else {
        curLine = test;
      }
    }
    if (curLine) lines.push(curLine);
    const boxH = padY * 2 + lines.length * lineH;
    const bx = (CANVAS_W - boxW) / 2;
    const by = 80;
    drawBoxFilled(bx, by, boxW, boxH, PAL.ink, PAL.red, 3);
    lines.forEach((ln, i) => {
      drawText(ln, bx + boxW / 2, by + padY + i * lineH + lineH / 2, {
        font: '14px "Roboto Mono", monospace', color: PAL.gold,
        align: 'center', baseline: 'middle',
      });
    });
    ctx.restore();
  }
}

function sauceColor(pk) {
  return {
    mild_sauce_packet: '#ffd5b5',
    hot_sauce_packet:  '#ff9a3c',
    fire_sauce_packet: '#d62300',
    diablo_sauce_packet: '#7a1010',
    breakfast_salsa_packet: PAL.gold,
  }[pk] || PAL.beige;
}
function sauceLabel(pk) {
  return {
    mild_sauce_packet: 'MILD',
    hot_sauce_packet: 'HOT',
    fire_sauce_packet: 'FIRE',
    diablo_sauce_packet: 'DIABLO',
    breakfast_salsa_packet: 'BFAST',
  }[pk] || '?';
}

// ---------- TRANSITION ----------
function renderTransition() {
  // Render overworld behind, fade to black with diamond wipe
  renderOverworld();
  const tr = state.transition;
  const k = Math.min(1, tr.t / tr.duration);
  // Slashing diamond reveal
  ctx.save();
  ctx.fillStyle = PAL.purple;
  const bands = 8;
  for (let i = 0; i < bands; i++) {
    const stripeH = CANVAS_H / bands;
    const w = CANVAS_W * k;
    if (i % 2 === 0) ctx.fillRect(0, i * stripeH, w, stripeH);
    else ctx.fillRect(CANVAS_W - w, i * stripeH, w, stripeH);
  }
  ctx.restore();
}

function updateTransition(dt) {
  const tr = state.transition;
  tr.t += dt;
  if (tr.t >= tr.duration) {
    if (tr.kind === 'to_battle') {
      actuallyStartBattle(tr.bossKey);
      state.transition = null;
    }
  }
}

// ---------- BATTLE ----------
function renderBattle() {
  const b = state.battle;
  // Bg gradient — purple to dark
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, PAL.purple);
  grad.addColorStop(1, PAL.ink);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Faint chequer in arena
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let yy = 0; yy < 480; yy += 48) {
    for (let xx = 0; xx < CANVAS_W; xx += 48) {
      if (((xx + yy) / 48) % 2 < 1) ctx.fillRect(xx, yy, 48, 48);
    }
  }

  // Shake
  let shakeX = 0, shakeY = 0;
  if (b.shake > 0) {
    shakeX = (Math.random() - 0.5) * 12 * b.shake;
    shakeY = (Math.random() - 0.5) * 12 * b.shake;
  }

  // Boss platform (top-right)
  const bossX = CANVAS_W - 240 + shakeX, bossY = 90 + shakeY;
  drawPlatform(bossX + 30, bossY + 220, 200, 24);
  const boss = BOSSES[b.bossKey];
  const bossImg = state.images[`${boss.sprite}_battle`];
  ctx.save();
  if (b.bossFlash > 0) {
    ctx.globalAlpha = 0.4 + Math.random() * 0.4;
  }
  if (bossImg) drawImageScaled(bossImg, bossX + 50, bossY + 70 - (b.bossFlash > 0 ? 6 : 0), 160, 160);
  ctx.restore();

  // Boss HP plate (top-left)
  drawBoxFilled(20, 20, 420, 80, PAL.beige, PAL.purple, 3);
  drawText(boss.name, 32, 30, { font: '20px "Fugaz One", sans-serif', color: PAL.purple });
  drawText(`${b.bossHp}/${b.bossMaxHp}`, 428, 40,
    { font: FONT_LABEL, color: '#000', align: 'right', baseline: 'middle' });
  drawHpBar(32, 62, 396, 12, b.bossHp, b.bossMaxHp, '');
  if (boss.phased) {
    drawText(`Phase: ${boss.phases[b.phaseIndex].name}`, 32, 82,
      { font: '11px "Montserrat", sans-serif', color: PAL.red });
  }

  // Gidget platform (bottom-left)
  const gidX = 80 + shakeX, gidY = 290 + shakeY;
  drawPlatform(gidX + 30, gidY + 200, 200, 24);
  const gidImg = state.images.gidget_battle_back;
  ctx.save();
  if (b.gidgetFlash > 0) ctx.globalAlpha = 0.4 + Math.random() * 0.4;
  // Mentor-call: warm gold pulse behind Gidget
  if (b.mentorAnim) {
    const t = b.mentorAnim.t / b.mentorAnim.dur;
    const pulse = 0.4 + 0.6 * Math.sin(t * Math.PI); // 0→1→0 over animation
    ctx.save();
    ctx.globalAlpha = 0.55 * pulse;
    ctx.fillStyle = PAL.gold;
    ctx.beginPath();
    ctx.arc(gidX + 130, gidY + 130, 90 + 12 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  if (gidImg) drawImageScaled(gidImg, gidX + 50, gidY + 50, 160, 160);
  ctx.restore();

  // Mentor-call thought bubble (drawn ABOVE sprite so it's never occluded)
  if (b.mentorAnim) {
    const t = b.mentorAnim.t / b.mentorAnim.dur;
    // Envelope: pop in (0-0.2), hold (0.2-0.8), fade out (0.8-1.0)
    let scale = 1, alpha = 1;
    if (t < 0.2)      { scale = t / 0.2;             alpha = t / 0.2; }
    else if (t > 0.8) { scale = 1 - (t - 0.8) / 0.2 * 0.3; alpha = 1 - (t - 0.8) / 0.2; }
    const bx = gidX + 165;
    const by = gidY + 30;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(bx, by);
    ctx.scale(scale, scale);
    // Two small "tail" circles (comic-style thought bubble pointer)
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = PAL.purple;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(-30, 25, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(-20, 15, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Main bubble
    ctx.beginPath(); ctx.ellipse(0, 0, 36, 28, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Phone glyph inside
    ctx.fillStyle = PAL.purple;
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('☎', 0, 0);
    ctx.restore();
  }

  // Gidget HP plate (bottom-right, above menu)
  drawBoxFilled(CANVAS_W - 440, 290, 420, 80, PAL.beige, PAL.purple, 3);
  drawText('GIDGET (Credibility)', CANVAS_W - 428, 300, {
    font: '18px "Fugaz One", sans-serif', color: PAL.purple,
  });
  drawText(`${state.player.hp}/${state.player.maxHp}`,
    CANVAS_W - 32, 310,
    { font: FONT_LABEL, color: '#000', align: 'right', baseline: 'middle' });
  drawHpBar(CANVAS_W - 428, 332, 396, 14, state.player.hp, state.player.maxHp, '');
  // Gold sweep over HP bar during mentor call
  if (b.mentorAnim) {
    const t = b.mentorAnim.t / b.mentorAnim.dur;
    const sweepX = CANVAS_W - 428 + (396 + 60) * t - 30;
    ctx.save();
    ctx.globalAlpha = 0.65 * (1 - Math.abs(t - 0.5) * 2);
    const grad = ctx.createLinearGradient(sweepX, 0, sweepX + 60, 0);
    grad.addColorStop(0, 'rgba(255,198,39,0)');
    grad.addColorStop(0.5, 'rgba(255,198,39,1)');
    grad.addColorStop(1, 'rgba(255,198,39,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(sweepX, 332, 60, 14);
    ctx.restore();
  }

  // Decay flash
  if (b.bossFlash > 0)   b.bossFlash   = Math.max(0, b.bossFlash - 0.06);
  if (b.gidgetFlash > 0) b.gidgetFlash = Math.max(0, b.gidgetFlash - 0.06);
  if (b.shake > 0)       b.shake       = Math.max(0, b.shake - 0.05);

  // Persistent Issue Card (top-center, below boss name)
  drawIssueCard(b);

  // Bottom UI (dialog/menu)
  drawBattleBottom();
}

function drawIssueCard(b) {
  const boss = BOSSES[b.bossKey];
  let issueText = boss.issue;
  // For phased boss, show the current phase's flavor as the sub-issue
  if (boss.phased) {
    const ph = boss.phases[b.phaseIndex];
    issueText = `${ph.name}: ${ph.flavor}`;
  }
  const cardW = CANVAS_W - 40;
  const textFont = '10px monospace';
  const lineH = 13;
  const textMaxW = cardW - 28;
  // Use plain monospace for measuring — avoids web-font timing issues
  ctx.font = textFont;
  const words = issueText.split(' ');
  let line = '', lines = 1;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > textMaxW && line) { lines++; line = word; }
    else line = test;
  }
  const cardH = 20 + lines * lineH + 6;
  const cx = (CANVAS_W - cardW) / 2;
  const cy = 110;
  ctx.fillStyle = 'rgba(20,8,28,0.82)';
  ctx.fillRect(cx, cy, cardW, cardH);
  ctx.strokeStyle = PAL.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(cx + 1, cy + 1, cardW - 2, cardH - 2);
  drawText('⚠ ISSUE', cx + 10, cy + 4, {
    font: '9px "Montserrat", sans-serif', color: PAL.gold,
  });
  drawWrappedText(issueText, cx + 10, cy + 17, textMaxW, lineH, {
    font: textFont, color: PAL.beige,
  });
}

function drawPlatform(cx, cy, w, h) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, w/2, h/2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBattleBottom() {
  const b = state.battle;
  const bx = 20, by = 488, bw = CANVAS_W - 40, bh = 216;
  drawDialogBox(bx, by, bw, bh);

  if (b.menu === 'message') {
    const m = b.messages[0];
    if (!m) return;
    drawWrappedText(m.text, bx + 24, by + 24, bw - 48, 20, messageStyle(m.style));
    drawText('▼ press SPACE', bx + bw - 140, by + bh - 24, {
      font: '11px "Roboto Mono", monospace', color: PAL.purple,
      // Blink:
    });
    return;
  }

  if (b.menu === 'main') {
    drawText('What will Gidget do?', bx + 24, by + 24, { font: FONT_DLG, color: PAL.purple });
    const opts = ['FIGHT', 'BAG', 'RUN'];
    drawMenuColumn(opts, b.menuIndex, bx + bw - 220, by + 24, 200, 30);
    return;
  }

  if (b.menu === 'frameworks') {
    drawText('FIGHT — choose a framework  (Gidget starts with only Coordination; defeat bosses to unlock the rest)',
      bx + 24, by + 14, { font: '12px "Roboto Mono", monospace', color: PAL.purple });
    drawMenuGridFrameworks(ALL_FRAMEWORKS, state.unlockedFrameworks, b.menuIndex,
      bx + 24, by + 36, bw - 48, 132, 4);
    drawText('← → ↑ ↓ to choose · SPACE to confirm · ESC to back out',
      bx + 24, by + bh - 22, { font: '11px "Roboto Mono", monospace', color: PAL.purple });
    return;
  }

  if (b.menu === 'moves') {
    drawText(`${b.selectedFramework} — pick what to say:`, bx + 24, by + 24,
      { font: FONT_DLG, color: PAL.purple });
    const moves = FRAMEWORKS[b.selectedFramework];
    const moveFont = '11px monospace';
    const moveLineH = 13;
    const moveMaxW = bw - 80;
    // Pre-measure each row height using plain monospace to avoid web-font timing issues
    const rowHeights = moves.map(m => {
      ctx.font = moveFont;
      const words = `"${m.text}"`.split(' ');
      let line = '', lines = 1;
      for (const word of words) {
        const test = line ? line + ' ' + word : word;
        if (ctx.measureText(test).width > moveMaxW && line) { lines++; line = word; }
        else line = test;
      }
      return Math.max(24, lines * moveLineH + 8);
    });
    let rowY = by + 50;
    for (let i = 0; i < moves.length; i++) {
      const m = moves[i];
      const rh = rowHeights[i];
      if (i === b.menuIndex) {
        ctx.fillStyle = PAL.purple;
        ctx.fillRect(bx + 16, rowY - 2, bw - 32, rh);
      }
      const color = i === b.menuIndex ? '#fff' : '#000';
      drawWrappedText(`"${m.text}"`, bx + 28, rowY + 3, moveMaxW, moveLineH, { font: moveFont, color });
      rowY += rh;
    }
    drawText('ESC to go back', bx + bw - 140, by + bh - 24,
      { font: '11px "Roboto Mono", monospace', color: PAL.purple });
    return;
  }

  if (b.menu === 'victory') {
    drawText('VICTORY!', bx + 24, by + 24, { font: '28px "Fugaz One", sans-serif', color: PAL.gold });
    const boss = BOSSES[b.bossKey];
    drawText(`Defeated ${boss.name}.`, bx + 24, by + 64, { font: FONT_DLG, color: '#000' });
    drawText(`Got: ${boss.reward}.`, bx + 24, by + 92, { font: FONT_DLG, color: PAL.purple });
    if (boss.unlocks) {
      const list = Array.isArray(boss.unlocks) ? boss.unlocks : [boss.unlocks];
      drawText(`Unlocked: ${list.join(' + ')}.`, bx + 24, by + 120,
        { font: FONT_DLG, color: PAL.teal });
    }
    drawText('▼ press SPACE', bx + bw - 160, by + bh - 24,
      { font: '11px "Roboto Mono", monospace', color: PAL.purple });
    return;
  }

  if (b.menu === 'defeat') {
    drawText('BLACKOUT.', bx + 24, by + 24, { font: '28px "Fugaz One", sans-serif', color: PAL.red });
    drawWrappedText("Gidget lost the room. She'll regroup at the Lobby.",
      bx + 24, by + 64, bw - 48, 24, { font: FONT_DLG, color: '#000' });
    drawText('▼ press SPACE', bx + bw - 160, by + bh - 24,
      { font: '11px "Roboto Mono", monospace', color: PAL.purple });
    return;
  }

  if (b.menu === 'bag') {
    drawText('BAG', bx + 24, by + 14, { font: FONT_DLG, color: PAL.purple });

    // Single column: consumables
    const leftX = bx + 24;
    const colW = bw - 48;
    const colY = by + 36;

    drawText('CONSUMABLES', leftX, colY, { font: '11px "Montserrat", sans-serif', color: PAL.purple });

    // Mentor call row
    const itemY = colY + 22;
    const itemH = 44;
    const greyed = state.mentorCallUses <= 0 || state.player.hp >= state.player.maxHp;
    if (b.menuIndex === 0 && !greyed) {
      ctx.fillStyle = PAL.purple;
      ctx.fillRect(leftX - 4, itemY - 4, colW + 8, itemH);
    } else if (greyed) {
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.fillRect(leftX - 4, itemY - 4, colW + 8, itemH);
    }
    const txtColor = (b.menuIndex === 0 && !greyed) ? '#fff' : (greyed ? '#888' : '#000');
    const accent = (b.menuIndex === 0 && !greyed) ? PAL.gold : PAL.teal;
    drawText(MENTOR_CALL.name, leftX, itemY + 2, {
      font: 'bold 14px "Montserrat", sans-serif', color: txtColor
    });
    drawText(`×${state.mentorCallUses}   +${MENTOR_CALL.heal} Credibility`,
      leftX, itemY + 22, { font: '12px "Roboto Mono", monospace', color: accent });

    // Footer
    const footMsg = greyed
      ? (state.mentorCallUses <= 0
          ? 'Pack empty. Defeat a boss to refill (+1).'
          : 'Already at full Credibility.')
      : 'SPACE to use · ESC to go back';
    drawText(footMsg, bx + 24, by + bh - 22,
      { font: '11px "Roboto Mono", monospace', color: greyed ? PAL.red : PAL.purple });
    return;
  }
}

function drawMenuColumn(opts, sel, x, y, w, rowH) {
  for (let i = 0; i < opts.length; i++) {
    const ry = y + i * rowH;
    if (i === sel) {
      ctx.fillStyle = PAL.purple;
      ctx.fillRect(x, ry - 4, w, rowH);
    }
    drawText(opts[i], x + 12, ry, {
      font: FONT_MENU,
      color: i === sel ? '#fff' : '#000'
    });
  }
}

function drawMenuGrid(opts, sel, x, y, w, h, cols) {
  const rows = Math.ceil(opts.length / cols);
  const cellW = w / cols;
  const cellH = h / Math.max(rows, 1);
  for (let i = 0; i < opts.length; i++) {
    const c = i % cols, r = Math.floor(i / cols);
    const cx = x + c * cellW;
    const cy = y + r * cellH;
    if (i === sel) {
      ctx.fillStyle = PAL.purple;
      ctx.fillRect(cx, cy, cellW - 8, cellH - 6);
    }
    drawText(opts[i], cx + 16, cy + cellH/2 - 8, {
      font: FONT_MENU, color: i === sel ? '#fff' : '#000'
    });
  }
}

function drawMenuGridFrameworks(opts, unlocked, sel, x, y, w, h, cols) {
  const rows = Math.ceil(opts.length / cols);
  const cellW = w / cols;
  const cellH = h / Math.max(rows, 1);
  for (let i = 0; i < opts.length; i++) {
    const c = i % cols, r = Math.floor(i / cols);
    const cx = x + c * cellW;
    const cy = y + r * cellH;
    const isUnlocked = unlocked.includes(opts[i]);
    const innerW = cellW - 8;
    const innerH = cellH - 6;
    // Cell background
    if (i === sel) {
      ctx.fillStyle = isUnlocked ? PAL.purple : '#6b6358';
      ctx.fillRect(cx, cy, innerW, innerH);
    } else if (isUnlocked) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(cx, cy, innerW, innerH);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(cx, cy, innerW, innerH);
    }
    // Border
    ctx.strokeStyle = isUnlocked ? PAL.purple : '#aaa';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx + 0.5, cy + 0.5, innerW - 1, innerH - 1);

    const labelColor = i === sel
      ? '#fff'
      : isUnlocked ? '#000' : '#7a7468';

    // Framework name
    drawText(opts[i], cx + 12, cy + 8, {
      font: '13px "Montserrat", sans-serif', color: labelColor,
    });
    // Status line below
    if (isUnlocked) {
      const moveCount = (FRAMEWORKS[opts[i]] || []).length;
      drawText(`${moveCount} moves`, cx + 12, cy + 30, {
        font: '11px "Roboto Mono", monospace',
        color: i === sel ? PAL.gold : PAL.teal,
      });
    } else {
      drawText('[ LOCKED ]', cx + 12, cy + 30, {
        font: 'bold 11px "Roboto Mono", monospace',
        color: i === sel ? PAL.gold : '#999',
      });
    }
  }
}

function drawWrappedText(text, x, y, maxW, lineH, style = {}) {
  ctx.font = style.font || FONT_DLG;
  ctx.fillStyle = style.color || '#000';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lineH;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}

function messageStyle(s) {
  switch (s) {
    case 'gidget':   return { color: PAL.purple, font: '13px "Roboto Mono", monospace' };
    case 'boss':     return { color: PAL.red,    font: '13px "Roboto Mono", monospace' };
    case 'issue':    return { color: PAL.teal,   font: 'bold 13px "Roboto Mono", monospace' };
    case 'gold':     return { color: '#aa7a00',  font: 'bold 13px "Roboto Mono", monospace' };
    case 'teal':     return { color: '#0a7a8a',  font: 'bold 13px "Roboto Mono", monospace' };
    case 'red':      return { color: PAL.red,    font: '13px "Roboto Mono", monospace' };
    case 'narration':
    default:         return { color: '#000',     font: FONT_DLG };
  }
}

// ---------- GAME OVER ----------
function renderGameOver() {
  ctx.fillStyle = PAL.ink;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  drawText('BLACKOUT', CANVAS_W/2, 220, {
    font: '72px "Fugaz One", sans-serif', color: PAL.red, align: 'center', shadow: '#000'
  });
  drawText('Gidget lost the room. She regroups at the Lobby.', CANVAS_W/2, 320,
    { font: FONT_DLG, color: PAL.beige, align: 'center' });
  drawText('Boss progress is kept. HP restored.', CANVAS_W/2, 352,
    { font: FONT_DLG, color: PAL.beige, align: 'center' });
  drawText('▶ press SPACE / ENTER to return to the Lobby', CANVAS_W/2, 460,
    { font: FONT_MENU, color: PAL.gold, align: 'center' });
}

// ---------- ENDING ----------
function renderEnding() {
  ctx.fillStyle = PAL.ink;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Starry background using gold dots
  ctx.fillStyle = PAL.gold;
  for (let i = 0; i < 80; i++) {
    const x = (i * 137) % CANVAS_W;
    const y = (i * 53 + state.t / 40) % CANVAS_H;
    ctx.fillRect(x, y, 2, 2);
  }
  drawText('YOU WIN.', CANVAS_W/2, 110, {
    font: '80px "Fugaz One", sans-serif', color: PAL.gold, align: 'center', shadow: PAL.purple
  });
  drawText('The Crunchwrap has been unwrapped.', CANVAS_W/2, 210, {
    font: FONT_DLG, color: PAL.beige, align: 'center'
  });

  const lines = [
    'Gidget the Chihuahua took on five layers of org dysfunction',
    'and prevailed with frameworks, not vibes:',
    '',
    '· Expectancy Theory — the chain is multiplicative. Fix E→P first.',
    '· Job Char. Model — task identity and feedback are not optional.',
    '· Crowding Out — if they already care, pay makes them care less.',
    '· Folly: A→B — you reward rotation and hope for continuity. Pick one.',
    '· Tight / Loose — tightness on the wrong things is just control.',
    '· Network Shape — density plus range. Networks die with rotation.',
    '· Incentive Compat. — tie the proposer to the outcome, not just the idea.',
    '',
    "Constant rotation is not agility. It's amnesia.",
    'Continuity is a feature. Build it on purpose.',
  ];
  lines.forEach((line, i) => {
    drawText(line, CANVAS_W/2, 260 + i * 26, {
      font: '15px "Roboto Mono", monospace', color: i < 3 ? PAL.teal : PAL.beige, align: 'center'
    });
  });
  drawText('▶ press SPACE / ENTER to return to the title', CANVAS_W/2, 660, {
    font: FONT_MENU, color: PAL.gold, align: 'center'
  });
}

// -----------------------------------------------------------------------------
// MAIN LOOP
// -----------------------------------------------------------------------------
let lastT = 0;
function loop(now) {
  const dt = Math.min(60, now - lastT);
  lastT = now;
  state.t += dt;

  if (state.mode === 'overworld') updateOverworld(dt);
  if (state.mode === 'transition') updateTransition(dt);
  if (state.mode === 'battle') {
    const b = state.battle;
    if (b && b.mentorAnim) {
      b.mentorAnim.t += dt;
      if (b.mentorAnim.t >= b.mentorAnim.dur) b.mentorAnim = null;
    }
  }
  if (state.mode === 'ending')    state.ending.t += dt;

  render();
  requestAnimationFrame(loop);
}

// -----------------------------------------------------------------------------
// GAME LIFECYCLE
// -----------------------------------------------------------------------------
function startNewGame() {
  // Reset everything (in case starting from title after an ending)
  state.player = {
    x: state.tilemap.spawn_point.x, y: state.tilemap.spawn_point.y,
    facing: state.tilemap.spawn_point.facing || 'down',
    moving: false, moveT: 0,
    fromX: state.tilemap.spawn_point.x, fromY: state.tilemap.spawn_point.y,
    hp: 100, maxHp: 100,
  };
  state.inventory = new Set();
  state.defeatedBosses = new Set();
  state.clearedTiles = new Set();
  state.unlockedFrameworks = ['Expectancy Theory'];
  state.mentorCallUses = MENTOR_CALL.startUses;
  state.tutorialSeen = { firstBattle: false, firstStrong: false, firstMisfit: false };
  state.battle = null;
  state.toast = {
    text: "Welcome, brand lead. The BRAND TEAM bullpen is open. The Quesarito is your first fight. You only know Expectancy Theory — trace the broken E-to-P chain and the accountability gap.",
    t: 0, dur: 6000
  };
  buildWalkable();
  state.mode = 'overworld';
  // Force overworld music — currentTrack may already be AUDIO.overworld but paused
  // (blocked by autoplay on load), so we explicitly resume it here after user interaction.
  if (currentTrack === AUDIO.overworld) {
    currentTrack.play().catch(() => {});
  } else {
    playMusic('overworld');
  }
}

function resetForTitle() {
  // Soft reset to title screen
  state.battle = null;
  state.transition = null;
}

// Boot
state.mode = 'loading';
requestAnimationFrame(loop);
loadAll().then(() => {
  state.mode = 'title';
  playMusic('overworld');
}).catch(err => {
  console.error(err);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#900';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#fff';
  ctx.font = '20px monospace';
  ctx.fillText('Asset load failed: ' + err.message, 20, 40);
});
